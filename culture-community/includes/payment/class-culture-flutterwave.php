<?php
/**
 * Flutterwave integration.
 *
 * Used for:
 *   1. Standard hosted checkout  — paid event RSVPs (payment_initiate / verify_transaction)
 *   2. Bills API (airtime)       — airtime perk fulfillment  (send_airtime)
 *   3. Bills API (data bundles)  — data-bundle perk fulfillment (send_data_bundle)
 *
 * Secret key: reads FLUTTERWAVE_SECRET_KEY env-var first; falls back to the
 * culture_flutterwave_secret_key WP option (set in WP Admin → Culture → Payments).
 */

if ( ! defined( 'ABSPATH' ) ) exit;

class Culture_Flutterwave {

    const API_BASE = 'https://api.flutterwave.com/v3';

    // ── Configuration check ───────────────────────────────────────────────────

    public static function is_configured(): bool {
        return ! empty( self::secret_key() );
    }

    private static function secret_key(): string {
        $env = getenv( 'FLUTTERWAVE_SECRET_KEY' );
        if ( $env ) return $env;
        return (string) get_option( 'culture_flutterwave_secret_key', '' );
    }

    // ── Standard hosted checkout ──────────────────────────────────────────────

    /**
     * Initiate a Flutterwave Standard (hosted) checkout session.
     *
     * @param array{
     *   tx_ref: string,
     *   amount: float,
     *   currency: string,
     *   redirect_url: string,
     *   email: string,
     *   name?: string,
     *   description?: string,
     *   title?: string,
     *   payment_options?: string,
     * } $params
     * @return array{url: string}|WP_Error
     */
    public static function payment_initiate( array $params ): array|\WP_Error {
        $body = [
            'tx_ref'          => $params['tx_ref'],
            'amount'          => (float) $params['amount'],
            'currency'        => strtoupper( $params['currency'] ),
            'redirect_url'    => $params['redirect_url'],
            'payment_options' => $params['payment_options'] ?? 'card,banktransfer,ussd',
            'customer'        => [
                'email' => $params['email'],
                'name'  => $params['name'] ?? '',
            ],
            'customizations'  => [
                'title'       => $params['title']       ?? 'Moveee',
                'description' => $params['description'] ?? '',
                'logo'        => 'https://themoveee.com/icon.png',
            ],
        ];

        $response = self::api_request( 'POST', '/payments', $body );
        if ( is_wp_error( $response ) ) return $response;

        $link = $response['data']['link'] ?? '';
        if ( ! $link ) {
            return new \WP_Error( 'flutterwave_error', 'Could not retrieve payment link from Flutterwave.' );
        }

        return [ 'url' => $link ];
    }

    // ── Transaction verification ──────────────────────────────────────────────

    /**
     * Verify a Flutterwave transaction by its numeric transaction ID.
     *
     * Returns the transaction data array on success (caller checks
     * $result['status'] === 'successful').
     *
     * @param int $transaction_id
     * @return array|WP_Error
     */
    public static function verify_transaction( int $transaction_id ): array|\WP_Error {
        $response = self::api_request( 'GET', '/transactions/' . $transaction_id . '/verify' );
        if ( is_wp_error( $response ) ) return $response;

        $data = $response['data'] ?? null;
        if ( ! $data ) {
            return new \WP_Error( 'flutterwave_error', 'Could not retrieve transaction details from Flutterwave.' );
        }

        return $data;
    }

    // ── Bills API: airtime ────────────────────────────────────────────────────

    /**
     * Send airtime to a phone number via the Flutterwave Bills API.
     *
     * @param string $phone     E.164 or local format (e.g. "+2348012345678" or "08012345678")
     * @param float  $amount    Amount in the local currency of $country (e.g. 500 NGN)
     * @param string $country   2-letter ISO country code (NG, GH, KE, ZA, …)
     * @param string $reference Unique idempotency key for this transaction
     * @return array{flw_ref: string, ...}|WP_Error
     */
    public static function send_airtime( string $phone, float $amount, string $country, string $reference ): array|\WP_Error {
        $body = [
            'country'    => strtoupper( $country ),
            'customer'   => self::normalise_phone( $phone, $country ),
            'amount'     => $amount,
            'recurrence' => 'ONCE',
            'type'       => 'AIRTIME',
            'reference'  => $reference,
        ];

        $response = self::api_request( 'POST', '/bills', $body );
        if ( is_wp_error( $response ) ) return $response;

        $data = $response['data'] ?? null;
        if ( ! $data ) {
            return new \WP_Error( 'flutterwave_bills_error', 'Airtime send failed — no data returned.' );
        }

        return $data;
    }

    // ── Bills API: data bundle ────────────────────────────────────────────────

    /**
     * Send a data bundle via the Flutterwave Bills API.
     *
     * $bundle_code is the Flutterwave bill-type string for the specific bundle
     * (e.g. "MTN_BUNDLE_500MB", "AIRTEL_1GB"). Get valid codes for your market
     * from GET /v3/bills/categories?country=NG in the Flutterwave API explorer.
     * This value is stored in the perk's `data_bundle_code` field in WP Admin.
     *
     * @param string $phone       Recipient phone number
     * @param string $bundle_code Flutterwave bill type / biller name for this bundle
     * @param float  $amount      Amount in local currency (must match the bundle price)
     * @param string $country     2-letter ISO country code
     * @param string $reference   Unique idempotency key
     * @return array{flw_ref: string, ...}|WP_Error
     */
    public static function send_data_bundle( string $phone, string $bundle_code, float $amount, string $country, string $reference ): array|\WP_Error {
        $body = [
            'country'    => strtoupper( $country ),
            'customer'   => self::normalise_phone( $phone, $country ),
            'amount'     => $amount,
            'recurrence' => 'ONCE',
            'type'       => strtoupper( $bundle_code ),
            'reference'  => $reference,
        ];

        $response = self::api_request( 'POST', '/bills', $body );
        if ( is_wp_error( $response ) ) return $response;

        $data = $response['data'] ?? null;
        if ( ! $data ) {
            return new \WP_Error( 'flutterwave_bills_error', 'Data bundle send failed — no data returned.' );
        }

        return $data;
    }

    // ── Bills API: list available categories (utility for admins) ────────────

    /**
     * Fetch available bill categories for a country.
     * Useful in admin UIs to find the correct bundle_code values.
     *
     * @param string $country 2-letter ISO code
     * @return array|WP_Error
     */
    public static function get_bill_categories( string $country ): array|\WP_Error {
        return self::api_request( 'GET', '/bills/categories?country=' . strtoupper( $country ) );
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Normalise a phone number: ensure it starts with + for E.164.
     * Flutterwave's Bills API requires the international format.
     */
    private static function normalise_phone( string $phone, string $country ): string {
        $phone = preg_replace( '/\s+/', '', $phone );
        if ( str_starts_with( $phone, '+' ) ) return $phone;

        // Strip leading 0 and prepend dial code for known countries.
        $dial_codes = [
            'NG' => '234', 'GH' => '233', 'KE' => '254',
            'ZA' => '27',  'UG' => '256', 'TZ' => '255',
            'RW' => '250', 'CM' => '237', 'SN' => '221',
        ];
        $code = $dial_codes[ strtoupper( $country ) ] ?? null;
        if ( $code && str_starts_with( $phone, '0' ) ) {
            return '+' . $code . substr( $phone, 1 );
        }
        if ( $code && ! str_starts_with( $phone, $code ) ) {
            return '+' . $code . $phone;
        }
        return '+' . ltrim( $phone, '+' );
    }

    // ── Core HTTP helper ──────────────────────────────────────────────────────

    private static function api_request( string $method, string $endpoint, array $body = [] ): array|\WP_Error {
        $args = [
            'method'  => $method,
            'headers' => [
                'Authorization' => 'Bearer ' . self::secret_key(),
                'Content-Type'  => 'application/json',
            ],
            'timeout' => 30,
        ];

        if ( ! empty( $body ) && in_array( $method, [ 'POST', 'PUT', 'PATCH' ], true ) ) {
            $args['body'] = wp_json_encode( $body );
        }

        $response = wp_remote_request( self::API_BASE . $endpoint, $args );

        if ( is_wp_error( $response ) ) return $response;

        $code         = (int) wp_remote_retrieve_response_code( $response );
        $decoded      = json_decode( wp_remote_retrieve_body( $response ), true );
        $flw_status   = $decoded['status'] ?? '';

        if ( $code >= 400 || 'error' === $flw_status ) {
            $message = $decoded['message'] ?? 'Flutterwave API error.';
            return new \WP_Error( 'flutterwave_error', $message, [ 'status' => $code ?: 502, 'raw' => $decoded ] );
        }

        return $decoded;
    }
}
