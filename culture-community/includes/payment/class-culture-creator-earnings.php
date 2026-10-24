<?php
/**
 * Creator Earnings Ledger — tracks platform-collected RSVP revenue owed to
 * event creators and handles payout requests via Flutterwave Transfer API.
 *
 * Tables:
 *   wp_culture_creator_earnings  — one row per confirmed paid RSVP
 *   wp_culture_payout_requests   — one row per creator payout request
 *
 * Platform fee is read from the `culture_creator_fee_rate` option (0–1 float,
 * default 0.10 = 10%).  Net = gross × (1 − fee_rate).
 *
 * Payout flow:
 *   1. Creator calls POST /culture/v1/creator/payout-request with bank details.
 *   2. Row inserted with status = pending; earnings rows tagged with that request.
 *   3. Admin calls POST /culture/v1/admin/creator-payouts/{id}/process.
 *   4. Flutterwave Transfer API called; status → processing / completed / failed.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Culture_Creator_Earnings {

    /* ── Tables ──────────────────────────────────────────────────────── */

    public static function earnings_table(): string {
        global $wpdb;
        return $wpdb->prefix . 'culture_creator_earnings';
    }

    public static function requests_table(): string {
        global $wpdb;
        return $wpdb->prefix . 'culture_payout_requests';
    }

    public static function create_tables(): void {
        global $wpdb;
        $charset = $wpdb->get_charset_collate();
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';

        $e = self::earnings_table();
        dbDelta( "CREATE TABLE {$e} (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            creator_id bigint(20) UNSIGNED NOT NULL,
            event_id bigint(20) UNSIGNED NOT NULL,
            rsvp_id bigint(20) UNSIGNED NOT NULL,
            payment_reference varchar(255) NOT NULL DEFAULT '',
            gross_amount decimal(10,2) NOT NULL DEFAULT 0.00,
            platform_fee decimal(10,2) NOT NULL DEFAULT 0.00,
            net_amount decimal(10,2) NOT NULL DEFAULT 0.00,
            currency varchar(10) NOT NULL DEFAULT 'NGN',
            gateway varchar(50) NOT NULL DEFAULT 'flutterwave',
            status varchar(30) NOT NULL DEFAULT 'available',
            payout_request_id bigint(20) UNSIGNED DEFAULT NULL,
            created_at datetime NOT NULL,
            paid_out_at datetime DEFAULT NULL,
            PRIMARY KEY  (id),
            UNIQUE KEY rsvp_id (rsvp_id),
            KEY creator_id (creator_id),
            KEY event_id (event_id),
            KEY status (status),
            KEY payout_request_id (payout_request_id)
        ) {$charset};" );

        $r = self::requests_table();
        dbDelta( "CREATE TABLE {$r} (
            id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            creator_id bigint(20) UNSIGNED NOT NULL,
            amount decimal(10,2) NOT NULL DEFAULT 0.00,
            currency varchar(10) NOT NULL DEFAULT 'NGN',
            bank_code varchar(50) NOT NULL DEFAULT '',
            account_number varchar(50) NOT NULL DEFAULT '',
            account_name varchar(255) NOT NULL DEFAULT '',
            status varchar(30) NOT NULL DEFAULT 'pending',
            flw_transfer_id bigint(20) UNSIGNED DEFAULT NULL,
            transfer_reference varchar(255) DEFAULT NULL,
            failure_reason text DEFAULT NULL,
            created_at datetime NOT NULL,
            processed_at datetime DEFAULT NULL,
            PRIMARY KEY  (id),
            KEY creator_id (creator_id),
            KEY status (status)
        ) {$charset};" );
    }

    /* ── Config ──────────────────────────────────────────────────────── */

    public static function platform_fee_rate(): float {
        return (float) get_option( 'culture_creator_fee_rate', 0.10 );
    }

    /* ── Record an earning ───────────────────────────────────────────── */

    /**
     * Called from confirm_rsvp_payment() / confirm_guest_rsvp_payment()
     * after a payment is confirmed.  Idempotent on rsvp_id.
     */
    public static function record_rsvp_earning(
        int    $rsvp_id,
        int    $event_id,
        int    $creator_id,
        float  $gross,
        string $currency,
        string $gateway,
        string $tx_ref
    ): void {
        global $wpdb;

        if ( $creator_id <= 0 || $gross <= 0 ) {
            return;
        }

        // Idempotent.
        $exists = $wpdb->get_var( $wpdb->prepare(
            'SELECT id FROM ' . self::earnings_table() . ' WHERE rsvp_id = %d LIMIT 1',
            $rsvp_id
        ) );
        if ( $exists ) {
            return;
        }

        $fee_rate = self::platform_fee_rate();
        $fee      = round( $gross * $fee_rate, 2 );
        $net      = round( $gross - $fee, 2 );

        $wpdb->insert(
            self::earnings_table(),
            [
                'creator_id'        => $creator_id,
                'event_id'          => $event_id,
                'rsvp_id'           => $rsvp_id,
                'payment_reference' => $tx_ref,
                'gross_amount'      => $gross,
                'platform_fee'      => $fee,
                'net_amount'        => $net,
                'currency'          => strtoupper( $currency ),
                'gateway'           => $gateway,
                'status'            => 'available',
                'created_at'        => current_time( 'mysql' ),
            ],
            [ '%d', '%d', '%d', '%s', '%f', '%f', '%f', '%s', '%s', '%s', '%s' ]
        );
    }

    /* ── Balance ─────────────────────────────────────────────────────── */

    /**
     * Returns available and pending balances per currency for a creator.
     *
     * @return array[]  e.g. [ 'NGN' => [ 'available' => 4500.00, 'paid_out' => 1000.00 ] ]
     */
    public static function get_balance( int $creator_id ): array {
        global $wpdb;

        $rows = $wpdb->get_results( $wpdb->prepare(
            "SELECT currency, status, SUM(net_amount) AS total
             FROM " . self::earnings_table() . "
             WHERE creator_id = %d
             GROUP BY currency, status",
            $creator_id
        ), ARRAY_A );

        $balance = [];
        foreach ( (array) $rows as $row ) {
            $cur    = $row['currency'];
            $status = $row['status'];
            $total  = (float) $row['total'];
            if ( ! isset( $balance[ $cur ] ) ) {
                $balance[ $cur ] = [ 'available' => 0.0, 'paid_out' => 0.0 ];
            }
            if ( 'available' === $status ) {
                $balance[ $cur ]['available'] += $total;
            } elseif ( 'paid_out' === $status ) {
                $balance[ $cur ]['paid_out'] += $total;
            }
        }

        return $balance;
    }

    /* ── History ─────────────────────────────────────────────────────── */

    public static function get_history( int $creator_id, int $page = 1, int $per_page = 20 ): array {
        global $wpdb;

        $offset = ( $page - 1 ) * $per_page;

        $rows = $wpdb->get_results( $wpdb->prepare(
            "SELECT e.*, p.post_title AS event_title
             FROM " . self::earnings_table() . " e
             LEFT JOIN {$wpdb->posts} p ON p.ID = e.event_id
             WHERE e.creator_id = %d
             ORDER BY e.created_at DESC
             LIMIT %d OFFSET %d",
            $creator_id, $per_page, $offset
        ), ARRAY_A );

        $total = (int) $wpdb->get_var( $wpdb->prepare(
            'SELECT COUNT(*) FROM ' . self::earnings_table() . ' WHERE creator_id = %d',
            $creator_id
        ) );

        return [
            'items'      => $rows ?: [],
            'total'      => $total,
            'page'       => $page,
            'per_page'   => $per_page,
            'total_pages' => (int) ceil( $total / $per_page ),
        ];
    }

    /* ── Payout request ──────────────────────────────────────────────── */

    /**
     * Creator calls this to request withdrawal of their available balance
     * for a given currency.  Returns the new payout request ID or WP_Error.
     */
    public static function request_payout(
        int    $creator_id,
        float  $amount,
        string $currency,
        string $bank_code,
        string $account_number,
        string $account_name
    ): int|WP_Error {
        global $wpdb;

        if ( $amount <= 0 ) {
            return new WP_Error( 'invalid_amount', 'Amount must be greater than zero.', [ 'status' => 400 ] );
        }

        // Verify the creator actually has enough available.
        $available = (float) $wpdb->get_var( $wpdb->prepare(
            "SELECT SUM(net_amount) FROM " . self::earnings_table() . "
             WHERE creator_id = %d AND currency = %s AND status = 'available'",
            $creator_id, strtoupper( $currency )
        ) );

        if ( $available < $amount ) {
            return new WP_Error( 'insufficient_balance',
                sprintf( 'Available balance is %s %s; requested %s.', number_format( $available, 2 ), $currency, number_format( $amount, 2 ) ),
                [ 'status' => 400 ]
            );
        }

        // Block duplicate pending requests for the same creator+currency.
        $pending_count = (int) $wpdb->get_var( $wpdb->prepare(
            "SELECT COUNT(*) FROM " . self::requests_table() . "
             WHERE creator_id = %d AND currency = %s AND status IN ('pending','processing')",
            $creator_id, strtoupper( $currency )
        ) );
        if ( $pending_count > 0 ) {
            return new WP_Error( 'payout_in_progress',
                'A payout request is already pending or processing for this currency.',
                [ 'status' => 409 ]
            );
        }

        $inserted = $wpdb->insert(
            self::requests_table(),
            [
                'creator_id'     => $creator_id,
                'amount'         => $amount,
                'currency'       => strtoupper( $currency ),
                'bank_code'      => sanitize_text_field( $bank_code ),
                'account_number' => sanitize_text_field( $account_number ),
                'account_name'   => sanitize_text_field( $account_name ),
                'status'         => 'pending',
                'created_at'     => current_time( 'mysql' ),
            ],
            [ '%d', '%f', '%s', '%s', '%s', '%s', '%s', '%s' ]
        );

        if ( ! $inserted ) {
            return new WP_Error( 'db_error', 'Could not save payout request.', [ 'status' => 500 ] );
        }

        $request_id = (int) $wpdb->insert_id;

        // Tag the earnings rows that this request covers.
        $wpdb->query( $wpdb->prepare(
            "UPDATE " . self::earnings_table() . "
             SET payout_request_id = %d
             WHERE creator_id = %d AND currency = %s AND status = 'available'
             ORDER BY created_at ASC",
            $request_id, $creator_id, strtoupper( $currency )
        ) );

        return $request_id;
    }

    /* ── Admin: list payout requests ─────────────────────────────────── */

    public static function get_payout_requests( string $status = '', int $page = 1, int $per_page = 20 ): array {
        global $wpdb;

        $offset = ( $page - 1 ) * $per_page;
        $where  = $status ? $wpdb->prepare( "WHERE r.status = %s", $status ) : '';

        $rows = $wpdb->get_results(
            "SELECT r.*, u.display_name AS creator_name, u.user_email AS creator_email
             FROM " . self::requests_table() . " r
             LEFT JOIN {$wpdb->users} u ON u.ID = r.creator_id
             {$where}
             ORDER BY r.created_at DESC
             LIMIT {$per_page} OFFSET {$offset}",
            ARRAY_A
        );

        $total = (int) $wpdb->get_var(
            "SELECT COUNT(*) FROM " . self::requests_table() . " r {$where}"
        );

        return [
            'items'       => $rows ?: [],
            'total'       => $total,
            'page'        => $page,
            'per_page'    => $per_page,
            'total_pages' => (int) ceil( $total / $per_page ),
        ];
    }

    /* ── Admin: process a payout ─────────────────────────────────────── */

    /**
     * Calls Flutterwave Transfer API and marks the request + its earnings rows.
     * Returns the Flutterwave transfer data on success, WP_Error on failure.
     */
    public static function process_payout( int $request_id ): array|WP_Error {
        global $wpdb;

        $row = $wpdb->get_row( $wpdb->prepare(
            'SELECT * FROM ' . self::requests_table() . ' WHERE id = %d LIMIT 1',
            $request_id
        ), ARRAY_A );

        if ( ! $row ) {
            return new WP_Error( 'not_found', 'Payout request not found.', [ 'status' => 404 ] );
        }

        if ( ! in_array( $row['status'], [ 'pending', 'failed' ], true ) ) {
            return new WP_Error( 'invalid_status',
                'Only pending or failed requests can be processed. Current status: ' . $row['status'],
                [ 'status' => 409 ]
            );
        }

        if ( ! class_exists( 'Culture_Flutterwave' ) || ! Culture_Flutterwave::is_configured() ) {
            return new WP_Error( 'flutterwave_unconfigured', 'Flutterwave is not configured.', [ 'status' => 503 ] );
        }

        $reference = 'payout-' . $request_id . '-' . time();

        // Mark processing immediately to prevent double-fire.
        $wpdb->update(
            self::requests_table(),
            [ 'status' => 'processing', 'transfer_reference' => $reference ],
            [ 'id' => $request_id ],
            [ '%s', '%s' ],
            [ '%d' ]
        );

        $result = Culture_Flutterwave::initiate_transfer( [
            'account_bank'   => $row['bank_code'],
            'account_number' => $row['account_number'],
            'amount'         => (float) $row['amount'],
            'currency'       => $row['currency'],
            'narration'      => 'Moveee creator payout #' . $request_id,
            'reference'      => $reference,
        ] );

        if ( is_wp_error( $result ) ) {
            $wpdb->update(
                self::requests_table(),
                [
                    'status'         => 'failed',
                    'failure_reason' => $result->get_error_message(),
                    'processed_at'   => current_time( 'mysql' ),
                ],
                [ 'id' => $request_id ],
                [ '%s', '%s', '%s' ],
                [ '%d' ]
            );
            return $result;
        }

        $flw_id = (int) ( $result['id'] ?? 0 );
        $wpdb->update(
            self::requests_table(),
            [
                'status'           => 'completed',
                'flw_transfer_id'  => $flw_id ?: null,
                'processed_at'     => current_time( 'mysql' ),
            ],
            [ 'id' => $request_id ],
            [ '%s', $flw_id ? '%d' : 'NULL', '%s' ],
            [ '%d' ]
        );

        // Mark the earnings rows as paid_out.
        $wpdb->query( $wpdb->prepare(
            "UPDATE " . self::earnings_table() . "
             SET status = 'paid_out', paid_out_at = %s
             WHERE payout_request_id = %d",
            current_time( 'mysql' ), $request_id
        ) );

        return $result;
    }

    /* ── Admin: get a single payout request ──────────────────────────── */

    public static function get_payout_request( int $id ): array|null {
        global $wpdb;
        $row = $wpdb->get_row( $wpdb->prepare(
            'SELECT r.*, u.display_name AS creator_name, u.user_email AS creator_email
             FROM ' . self::requests_table() . ' r
             LEFT JOIN ' . $wpdb->users . ' u ON u.ID = r.creator_id
             WHERE r.id = %d LIMIT 1',
            $id
        ), ARRAY_A );
        return $row ?: null;
    }
}
