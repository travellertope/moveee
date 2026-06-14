<?php
/**
 * Partner Perks & Credits Redemption — core logic.
 *
 * Handles perk listing, redemption, QR verification, cashout requests,
 * and cashout admin actions.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Culture_Perks {

    // ── Constants ─────────────────────────────────────────────────────────────

    /** Credits-to-GBP conversion rate (credits per £1). Overridden by option. */
    const DEFAULT_CREDITS_PER_GBP = 200;
    const DEFAULT_CREDITS_PER_USD = 150;
    const DEFAULT_CREDITS_PER_NGN = 110; // per ₦1,000

    // ── HMAC helper ───────────────────────────────────────────────────────────

    /**
     * Return the HMAC signing key.
     * Prefers CULTURE_API_SECRET constant, falls back to WP option.
     *
     * @return string
     */
    private static function hmac_key() {
        if ( defined( 'CULTURE_API_SECRET' ) && CULTURE_API_SECRET ) {
            return CULTURE_API_SECRET;
        }
        return get_option( 'culture_api_secret', '' );
    }

    /**
     * Generate an HMAC QR token for a redemption.
     *
     * @param int    $redemption_id
     * @param int    $user_id
     * @param int    $perk_id
     * @param string $expires_at  MySQL datetime string
     * @return string 64-char hex token
     */
    private static function generate_qr_token( $redemption_id, $user_id, $perk_id, $expires_at ) {
        $payload = "{$redemption_id}:{$user_id}:{$perk_id}:{$expires_at}";
        return hash_hmac( 'sha256', $payload, self::hmac_key() );
    }

    // ── Perk listing ──────────────────────────────────────────────────────────

    /**
     * Get perks from the database.
     *
     * Supported $args keys:
     *   status                (string) default 'active'
     *   partner_directory_id  (int)    filter by directory entry
     *   partner_vendor_id     (int)    filter by vendor
     *   limit                 (int)    default 50
     *   offset                (int)    default 0
     *
     * @param array $args
     * @return array
     */
    public static function get_perks( $args = array() ) {
        global $wpdb;

        $table = $wpdb->prefix . 'culture_partner_perks';

        $defaults = array(
            'status'               => 'active',
            'partner_directory_id' => 0,
            'partner_vendor_id'    => 0,
            'limit'                => 50,
            'offset'               => 0,
        );
        $args = wp_parse_args( $args, $defaults );

        $where  = array();
        $values = array();

        if ( ! empty( $args['status'] ) ) {
            $where[]  = 'status = %s';
            $values[] = sanitize_key( $args['status'] );
        }
        if ( ! empty( $args['partner_directory_id'] ) ) {
            $where[]  = 'partner_directory_id = %d';
            $values[] = (int) $args['partner_directory_id'];
        }
        if ( ! empty( $args['partner_vendor_id'] ) ) {
            $where[]  = 'partner_vendor_id = %d';
            $values[] = (int) $args['partner_vendor_id'];
        }

        $sql = "SELECT * FROM {$table}";
        if ( ! empty( $where ) ) {
            $sql .= ' WHERE ' . implode( ' AND ', $where );
        }
        $sql .= ' ORDER BY id DESC LIMIT %d OFFSET %d';

        $values[] = (int) $args['limit'];
        $values[] = (int) $args['offset'];

        // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared
        return $wpdb->get_results( $wpdb->prepare( $sql, $values ), ARRAY_A ) ?: array();
    }

    /**
     * Get a single perk by ID.
     *
     * @param int $perk_id
     * @return array|null
     */
    public static function get_perk( $perk_id ) {
        global $wpdb;

        $table = $wpdb->prefix . 'culture_partner_perks';
        $row   = $wpdb->get_row( $wpdb->prepare(
            "SELECT * FROM {$table} WHERE id = %d",
            (int) $perk_id
        ), ARRAY_A );

        return $row ?: null;
    }

    // ── Redemption ────────────────────────────────────────────────────────────

    /**
     * Redeem a perk for a user.
     *
     * Checks:
     *  1. Perk exists and is active.
     *  2. User has sufficient credit balance.
     *  3. Per-user redemption cap (max_per_user).
     *  4. Global redemption cap (max_total).
     *
     * Then deducts credits, inserts the redemption row, and increments
     * the perk's redeemed_count.
     *
     * @param int $user_id
     * @param int $perk_id
     * @return array|WP_Error  array with keys: success, redemption_id, qr_token, expires_at
     */
    public static function redeem_perk( $user_id, $perk_id ) {
        global $wpdb;

        $perk = self::get_perk( $perk_id );
        if ( ! $perk ) {
            return new WP_Error( 'perk_not_found', 'Perk not found.', array( 'status' => 404 ) );
        }
        if ( 'active' !== $perk['status'] ) {
            return new WP_Error( 'perk_unavailable', 'This perk is not currently available.', array( 'status' => 400 ) );
        }

        $cost    = (int) $perk['credit_cost'];
        $user_id = (int) $user_id;
        $perk_id = (int) $perk_id;

        // Balance check.
        $balance = Culture_Gamification::get_credits( $user_id );
        if ( $balance < $cost ) {
            return new WP_Error( 'insufficient_credits', 'You do not have enough credits to redeem this perk.', array( 'status' => 402 ) );
        }

        $redemptions_table = $wpdb->prefix . 'culture_redemptions';
        $perks_table       = $wpdb->prefix . 'culture_partner_perks';

        // Per-user cap check.
        if ( (int) $perk['max_per_user'] > 0 ) {
            $user_count = (int) $wpdb->get_var( $wpdb->prepare(
                "SELECT COUNT(*) FROM {$redemptions_table}
                 WHERE user_id = %d AND perk_id = %d AND type = 'perk'",
                $user_id,
                $perk_id
            ) );
            if ( $user_count >= (int) $perk['max_per_user'] ) {
                return new WP_Error( 'per_user_limit', 'You have already redeemed this perk the maximum number of times.', array( 'status' => 409 ) );
            }
        }

        // Global cap check.
        if ( (int) $perk['max_total'] > 0 && (int) $perk['redeemed_count'] >= (int) $perk['max_total'] ) {
            return new WP_Error( 'perk_exhausted', 'This perk has reached its redemption limit.', array( 'status' => 409 ) );
        }

        // Deduct credits.
        $new_balance = Culture_Gamification::deduct_credits( $user_id, $cost, 'perk_redeem', $perk_id );
        if ( false === $new_balance ) {
            // Race condition — balance dropped between our check and the deduction.
            return new WP_Error( 'insufficient_credits', 'Credit balance changed. Please try again.', array( 'status' => 402 ) );
        }

        // Build expiry datetime.
        $expiry_days = max( 1, (int) $perk['expiry_days'] );
        $expires_at  = gmdate( 'Y-m-d H:i:s', strtotime( "+{$expiry_days} days" ) );

        // Insert redemption with an empty QR token placeholder; we need the row ID first.
        $inserted = $wpdb->insert(
            $redemptions_table,
            array(
                'user_id'       => $user_id,
                'perk_id'       => $perk_id,
                'type'          => 'perk',
                'credits_spent' => $cost,
                'fee_credits'   => 0,
                'qr_token'      => '',
                'qr_scanned'    => 0,
                'status'        => 'active',
                'expires_at'    => $expires_at,
                'created_at'    => current_time( 'mysql', true ),
            ),
            array( '%d', '%d', '%s', '%d', '%d', '%s', '%d', '%s', '%s', '%s' )
        );

        if ( ! $inserted ) {
            // Roll back credit deduction.
            Culture_Gamification::award_credits( $user_id, $cost, 'perk_redeem_rollback', $perk_id );
            return new WP_Error( 'db_error', 'Could not record redemption. Please try again.', array( 'status' => 500 ) );
        }

        $redemption_id = (int) $wpdb->insert_id;

        // Generate HMAC token now that we have the ID.
        $qr_token = self::generate_qr_token( $redemption_id, $user_id, $perk_id, $expires_at );

        // Write the token back to the row.
        $wpdb->update(
            $redemptions_table,
            array( 'qr_token' => $qr_token ),
            array( 'id' => $redemption_id ),
            array( '%s' ),
            array( '%d' )
        );

        // Increment global redeemed_count.
        $wpdb->query( $wpdb->prepare(
            "UPDATE {$perks_table} SET redeemed_count = redeemed_count + 1 WHERE id = %d",
            $perk_id
        ) );

        return array(
            'success'       => true,
            'redemption_id' => $redemption_id,
            'qr_token'      => $qr_token,
            'expires_at'    => $expires_at,
            'new_balance'   => (int) $new_balance,
        );
    }

    // ── QR verification ───────────────────────────────────────────────────────

    /**
     * Verify a QR token and mark the redemption as used if valid.
     *
     * @param string $token
     * @return array  { valid: bool, reason?: string, perk?: array, user?: array, redemption?: array }
     */
    public static function verify_qr( $token ) {
        global $wpdb;

        $token = sanitize_text_field( $token );
        if ( empty( $token ) ) {
            return array( 'valid' => false, 'reason' => 'Token is required.' );
        }

        $redemptions_table = $wpdb->prefix . 'culture_redemptions';
        $row = $wpdb->get_row( $wpdb->prepare(
            "SELECT * FROM {$redemptions_table} WHERE qr_token = %s AND type = 'perk' LIMIT 1",
            $token
        ), ARRAY_A );

        if ( ! $row ) {
            return array( 'valid' => false, 'reason' => 'Token not found.' );
        }

        // Verify the HMAC — protects against forged tokens.
        $expected = self::generate_qr_token(
            $row['id'],
            $row['user_id'],
            $row['perk_id'],
            $row['expires_at']
        );
        if ( ! hash_equals( $expected, $token ) ) {
            return array( 'valid' => false, 'reason' => 'Token is invalid.' );
        }

        if ( 'used' === $row['status'] ) {
            return array( 'valid' => false, 'reason' => 'This perk has already been redeemed.' );
        }

        if ( 'expired' === $row['status'] || strtotime( $row['expires_at'] ) < time() ) {
            $wpdb->update(
                $redemptions_table,
                array( 'status' => 'expired' ),
                array( 'id' => (int) $row['id'] ),
                array( '%s' ),
                array( '%d' )
            );
            return array( 'valid' => false, 'reason' => 'This perk has expired.' );
        }

        // Mark as used.
        $wpdb->update(
            $redemptions_table,
            array( 'status' => 'used', 'qr_scanned' => 1 ),
            array( 'id' => (int) $row['id'] ),
            array( '%s', '%d' ),
            array( '%d' )
        );

        $perk = self::get_perk( $row['perk_id'] );
        $user = get_userdata( $row['user_id'] );

        return array(
            'valid'      => true,
            'redemption' => $row,
            'perk'       => $perk,
            'user'       => $user ? array(
                'id'           => $user->ID,
                'display_name' => $user->display_name,
                'email'        => $user->user_email,
            ) : array(),
        );
    }

    // ── User redemption history ───────────────────────────────────────────────

    /**
     * Get a user's redemptions.
     *
     * @param int         $user_id
     * @param string|null $status  Filter by status (null = all).
     * @return array
     */
    public static function get_user_redemptions( $user_id, $status = null ) {
        global $wpdb;

        $table = $wpdb->prefix . 'culture_redemptions';

        if ( $status ) {
            $rows = $wpdb->get_results( $wpdb->prepare(
                "SELECT * FROM {$table} WHERE user_id = %d AND status = %s ORDER BY created_at DESC",
                (int) $user_id,
                sanitize_key( $status )
            ), ARRAY_A );
        } else {
            $rows = $wpdb->get_results( $wpdb->prepare(
                "SELECT * FROM {$table} WHERE user_id = %d ORDER BY created_at DESC",
                (int) $user_id
            ), ARRAY_A );
        }

        return $rows ?: array();
    }

    // ── Cashout ───────────────────────────────────────────────────────────────

    /**
     * Calculate the fee percentage for a cashout amount.
     *
     * @param int $credits  Gross credits before fee.
     * @return int  Flat fee percentage applied to all cashouts.
     */
    public static function cashout_fee_percent( $credits ) {
        return 40;
    }

    /**
     * Request a credit cash-out.
     *
     * @param int    $user_id
     * @param int    $credits       Gross credits to cash out (before fee).
     * @param string $method        e.g. 'bank_transfer', 'paypal'
     * @param string $account_name
     * @param string $account_ref   Account number / email / IBAN etc.
     * @param string $currency      ISO 4217 currency code, default 'GBP'
     * @return array|WP_Error
     */
    public static function request_cashout( $user_id, $credits, $method, $account_name, $account_ref, $currency = 'GBP' ) {
        global $wpdb;

        $credits = (int) $credits;
        $user_id = (int) $user_id;

        if ( $credits <= 0 ) {
            return new WP_Error( 'invalid_amount', 'Credits must be greater than zero.', array( 'status' => 400 ) );
        }

        $balance = Culture_Gamification::get_credits( $user_id );
        if ( $balance < $credits ) {
            return new WP_Error( 'insufficient_credits', 'Insufficient credit balance.', array( 'status' => 402 ) );
        }

        // Calculate fee.
        $fee_pct     = self::cashout_fee_percent( $credits );
        $fee_credits = (int) round( $credits * $fee_pct / 100 );
        $net_credits = $credits - $fee_credits;

        // Determine credits-per-unit based on requested currency.
        switch ( strtoupper( $currency ) ) {
            case 'USD':
                $rate = (int) get_option( 'culture_credits_per_usd', self::DEFAULT_CREDITS_PER_USD );
                if ( $rate <= 0 ) $rate = self::DEFAULT_CREDITS_PER_USD;
                // cashout_amount stored as integer cents.
                $cashout_amount = (int) round( ( $net_credits / $rate ) * 100 );
                break;
            case 'NGN':
                $rate = (int) get_option( 'culture_credits_per_ngn', self::DEFAULT_CREDITS_PER_NGN );
                if ( $rate <= 0 ) $rate = self::DEFAULT_CREDITS_PER_NGN;
                // cashout_amount stored as integer kobo (per ₦1,000 basis → ×100,000).
                $cashout_amount = (int) round( ( $net_credits / $rate ) * 100000 );
                break;
            default: // GBP
                $rate = (int) get_option( 'culture_credits_per_gbp', self::DEFAULT_CREDITS_PER_GBP );
                if ( $rate <= 0 ) $rate = self::DEFAULT_CREDITS_PER_GBP;
                // cashout_amount stored as integer pence.
                $cashout_amount = (int) round( ( $net_credits / $rate ) * 100 );
                break;
        }

        // Deduct credits.
        $new_balance = Culture_Gamification::deduct_credits( $user_id, $credits, 'cashout', 0 );
        if ( false === $new_balance ) {
            return new WP_Error( 'insufficient_credits', 'Credit balance changed. Please try again.', array( 'status' => 402 ) );
        }

        $redemptions_table = $wpdb->prefix . 'culture_redemptions';

        $inserted = $wpdb->insert(
            $redemptions_table,
            array(
                'user_id'              => $user_id,
                'perk_id'              => 0,
                'type'                 => 'cashout',
                'credits_spent'        => $credits,
                'fee_credits'          => $fee_credits,
                'qr_token'             => '',
                'qr_scanned'           => 0,
                'status'               => 'pending',
                'expires_at'           => null,
                'created_at'           => current_time( 'mysql', true ),
                'cashout_amount'       => $cashout_amount,
                'cashout_currency'     => strtoupper( substr( sanitize_text_field( $currency ), 0, 3 ) ),
                'cashout_method'       => sanitize_text_field( $method ),
                'cashout_account_name' => sanitize_text_field( $account_name ),
                'cashout_account_ref'  => sanitize_text_field( $account_ref ),
            ),
            array( '%d', '%d', '%s', '%d', '%d', '%s', '%d', '%s', '%s', '%s', '%d', '%s', '%s', '%s', '%s' )
        );

        if ( ! $inserted ) {
            // Refund credits before returning the error.
            self::_refund_credits( $user_id, $credits, 0 );
            return new WP_Error( 'db_error', 'Could not record cashout request. Please try again.', array( 'status' => 500 ) );
        }

        $redemption_id = (int) $wpdb->insert_id;

        // Backfill the ledger source_id with the real redemption ID.
        $wpdb->query( $wpdb->prepare(
            "UPDATE {$wpdb->prefix}culture_credit_ledger
             SET source_id = %d
             WHERE user_id = %d AND source = 'cashout' AND source_id = 0
             ORDER BY id DESC LIMIT 1",
            $redemption_id,
            $user_id
        ) );

        return array(
            'success'        => true,
            'redemption_id'  => $redemption_id,
            'credits_spent'  => $credits,
            'fee_credits'    => $fee_credits,
            'net_credits'    => $net_credits,
            'cashout_amount' => $cashout_amount,
            'currency'       => strtoupper( substr( sanitize_text_field( $currency ), 0, 3 ) ),
            'new_balance'    => (int) $new_balance,
        );
    }

    // ── Admin: cashout queue ──────────────────────────────────────────────────

    /**
     * Get the cashout queue (admin view).
     *
     * @param string $status  default 'pending'
     * @return array
     */
    public static function get_cashout_queue( $status = 'pending' ) {
        global $wpdb;

        $table = $wpdb->prefix . 'culture_redemptions';
        $rows  = $wpdb->get_results( $wpdb->prepare(
            "SELECT * FROM {$table} WHERE type = 'cashout' AND status = %s ORDER BY created_at ASC",
            sanitize_key( $status )
        ), ARRAY_A );

        if ( ! $rows ) {
            return array();
        }

        $enriched = array();
        foreach ( $rows as $row ) {
            $user = get_userdata( $row['user_id'] );
            if ( ! $user ) {
                continue;
            }

            $account_ref      = $row['cashout_account_ref'];
            $registered_at    = strtotime( $user->user_registered );
            $account_age_days = (int) floor( ( time() - $registered_at ) / DAY_IN_SECONDS );

            // Anti-fraud: same account_ref used by >1 user?
            $shared_ref_count = (int) $wpdb->get_var( $wpdb->prepare(
                "SELECT COUNT(DISTINCT user_id) FROM {$table}
                 WHERE cashout_account_ref = %s AND type = 'cashout'",
                $account_ref
            ) );

            $today_earnings = (int) get_user_meta( $user->ID, '_culture_credits_earned_today', true );

            $enriched[] = array_merge( $row, array(
                'user' => array(
                    'id'           => $user->ID,
                    'display_name' => $user->display_name,
                    'email'        => $user->user_email,
                    'credits'      => Culture_Gamification::get_credits( $user->ID ),
                    'account_age'  => $account_age_days,
                ),
                'fraud_flags' => array(
                    'shared_account_ref' => $shared_ref_count > 1,
                    'new_account'        => $account_age_days < 30,
                    'daily_cap_farming'  => $today_earnings >= Culture_Gamification::DAILY_CREDIT_CAP,
                ),
            ) );
        }

        return $enriched;
    }

    /**
     * Approve a pending cashout.
     *
     * @param int $redemption_id
     * @param int $admin_id
     * @return array|WP_Error
     */
    public static function approve_cashout( $redemption_id, $admin_id ) {
        global $wpdb;

        $admin = get_user_by( 'id', (int) $admin_id );
        if ( ! $admin || ! user_can( $admin, 'manage_options' ) ) {
            return new WP_Error( 'forbidden', 'admin_id must belong to an administrator.', array( 'status' => 403 ) );
        }

        $table = $wpdb->prefix . 'culture_redemptions';
        $row   = $wpdb->get_row( $wpdb->prepare(
            "SELECT * FROM {$table} WHERE id = %d AND type = 'cashout' AND status = 'pending'",
            (int) $redemption_id
        ), ARRAY_A );

        if ( ! $row ) {
            return new WP_Error( 'not_found', 'Pending cashout not found.', array( 'status' => 404 ) );
        }

        $updated = $wpdb->update(
            $table,
            array(
                'status'      => 'approved',
                'approved_at' => current_time( 'mysql', true ),
                'approved_by' => (int) $admin_id,
            ),
            array( 'id' => (int) $redemption_id ),
            array( '%s', '%s', '%d' ),
            array( '%d' )
        );

        if ( false === $updated ) {
            return new WP_Error( 'db_error', 'Could not update cashout status.', array( 'status' => 500 ) );
        }

        return array(
            'success'       => true,
            'redemption_id' => (int) $redemption_id,
            'status'        => 'approved',
        );
    }

    /**
     * Reject a pending cashout and refund the user's credits.
     *
     * @param int    $redemption_id
     * @param int    $admin_id
     * @param string $reason
     * @return array|WP_Error
     */
    public static function reject_cashout( $redemption_id, $admin_id, $reason = '' ) {
        global $wpdb;

        $admin = get_user_by( 'id', (int) $admin_id );
        if ( ! $admin || ! user_can( $admin, 'manage_options' ) ) {
            return new WP_Error( 'forbidden', 'admin_id must belong to an administrator.', array( 'status' => 403 ) );
        }

        $table = $wpdb->prefix . 'culture_redemptions';
        $row   = $wpdb->get_row( $wpdb->prepare(
            "SELECT * FROM {$table} WHERE id = %d AND type = 'cashout' AND status = 'pending'",
            (int) $redemption_id
        ), ARRAY_A );

        if ( ! $row ) {
            return new WP_Error( 'not_found', 'Pending cashout not found.', array( 'status' => 404 ) );
        }

        $updated = $wpdb->update(
            $table,
            array(
                'status'      => 'rejected',
                'approved_at' => current_time( 'mysql', true ),
                'approved_by' => (int) $admin_id,
            ),
            array( 'id' => (int) $redemption_id ),
            array( '%s', '%s', '%d' ),
            array( '%d' )
        );

        if ( false === $updated ) {
            return new WP_Error( 'db_error', 'Could not update cashout status.', array( 'status' => 500 ) );
        }

        // Refund credits — bypasses daily earn cap.
        self::_refund_credits( (int) $row['user_id'], (int) $row['credits_spent'], (int) $redemption_id );

        if ( $reason ) {
            update_user_meta(
                (int) $row['user_id'],
                '_culture_cashout_reject_reason_' . (int) $redemption_id,
                sanitize_text_field( $reason )
            );
        }

        return array(
            'success'          => true,
            'redemption_id'    => (int) $redemption_id,
            'status'           => 'rejected',
            'credits_refunded' => (int) $row['credits_spent'],
        );
    }

    // ── Internal helpers ──────────────────────────────────────────────────────

    /**
     * Refund credits directly without touching the daily earn cap.
     *
     * @param int $user_id
     * @param int $amount
     * @param int $source_id  Redemption ID for the ledger.
     */
    private static function _refund_credits( $user_id, $amount, $source_id ) {
        if ( $amount <= 0 ) return;

        $current   = Culture_Gamification::get_credits( $user_id );
        $new_total = $current + $amount;
        update_user_meta( $user_id, '_culture_credits', $new_total );

        Culture_Gamification::ledger_add( $user_id, 'credit', $amount, 'cashout_refund', $source_id );

        do_action( 'culture_credits_refunded', $user_id, $amount, $new_total );
    }
}
