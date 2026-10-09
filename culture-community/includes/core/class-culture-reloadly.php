<?php
/**
 * Reloadly API — airtime top-ups and digital gift cards.
 *
 * Env vars required on the server:
 *   RELOADLY_CLIENT_ID      — from Reloadly dashboard
 *   RELOADLY_CLIENT_SECRET  — from Reloadly dashboard
 *   RELOADLY_SANDBOX        — "true" for sandbox mode (default: false/live)
 *
 * WP option fallbacks (set in WP Admin → Settings or via WP-CLI):
 *   culture_reloadly_client_id     / culture_reloadly_client_secret
 *   culture_reloadly_sandbox       (1 = sandbox)
 */
class Culture_Reloadly {

    const AUTH_URL   = 'https://auth.reloadly.com/oauth/token';
    const TOPUP_LIVE = 'https://topups.reloadly.com';
    const TOPUP_SBX  = 'https://topups-sandbox.reloadly.com';
    const GC_LIVE    = 'https://giftcards.reloadly.com';
    const GC_SBX     = 'https://giftcards-sandbox.reloadly.com';

    /* ── Credentials & mode ─────────────────────────────────────── */

    private static function is_sandbox(): bool {
        return getenv( 'RELOADLY_SANDBOX' ) === 'true'
            || get_option( 'culture_reloadly_sandbox', '0' ) === '1';
    }

    private static function topup_base(): string {
        return self::is_sandbox() ? self::TOPUP_SBX : self::TOPUP_LIVE;
    }

    private static function gc_base(): string {
        return self::is_sandbox() ? self::GC_SBX : self::GC_LIVE;
    }

    private static function client_id(): string {
        return getenv( 'RELOADLY_CLIENT_ID' )
            ?: (string) get_option( 'culture_reloadly_client_id', '' );
    }

    private static function client_secret(): string {
        return getenv( 'RELOADLY_CLIENT_SECRET' )
            ?: (string) get_option( 'culture_reloadly_client_secret', '' );
    }

    public static function is_configured(): bool {
        return self::client_id() !== '' && self::client_secret() !== '';
    }

    /* ── OAuth token (cached as WP transient) ───────────────────── */

    public static function get_token( string $audience ): string|WP_Error {
        if ( ! self::is_configured() ) {
            return new WP_Error( 'reloadly_unconfigured', 'Reloadly API credentials are not set.', [ 'status' => 503 ] );
        }

        $cache_key = 'culture_rl_tok_' . substr( md5( $audience ), 0, 8 );
        $cached    = get_transient( $cache_key );
        if ( $cached ) return $cached;

        $response = wp_remote_post( self::AUTH_URL, [
            'headers' => [ 'Content-Type' => 'application/json' ],
            'body'    => wp_json_encode( [
                'client_id'     => self::client_id(),
                'client_secret' => self::client_secret(),
                'grant_type'    => 'client_credentials',
                'audience'      => $audience,
            ] ),
            'timeout' => 15,
        ] );

        if ( is_wp_error( $response ) ) return $response;

        $code = (int) wp_remote_retrieve_response_code( $response );
        $body = json_decode( wp_remote_retrieve_body( $response ), true ) ?? [];

        if ( $code !== 200 || empty( $body['access_token'] ) ) {
            return new WP_Error(
                'reloadly_auth',
                $body['error_description'] ?? 'Reloadly auth failed',
                [ 'status' => 502 ]
            );
        }

        $ttl = max( 60, (int) ( $body['expires_in'] ?? 3600 ) - 120 );
        set_transient( $cache_key, $body['access_token'], $ttl );
        return $body['access_token'];
    }

    /* ── Internal HTTP helper ───────────────────────────────────── */

    private static function req(
        string $method,
        string $url,
        array  $body,
        string $audience,
        string $accept
    ): array|WP_Error {
        $token = self::get_token( $audience );
        if ( is_wp_error( $token ) ) return $token;

        $args = [
            'method'  => strtoupper( $method ),
            'headers' => [
                'Authorization' => "Bearer $token",
                'Content-Type'  => 'application/json',
                'Accept'        => $accept,
            ],
            'timeout' => 30,
        ];
        if ( ! empty( $body ) ) $args['body'] = wp_json_encode( $body );

        $response = wp_remote_request( $url, $args );
        if ( is_wp_error( $response ) ) return $response;

        $code    = (int) wp_remote_retrieve_response_code( $response );
        $decoded = json_decode( wp_remote_retrieve_body( $response ), true ) ?? [];

        if ( $code >= 400 ) {
            $msg = $decoded['message'] ?? ( $decoded['error'] ?? "Reloadly error {$code}" );
            return new WP_Error( 'reloadly_api', $msg, [ 'status' => $code >= 500 ? 502 : 422 ] );
        }

        return $decoded;
    }

    private static function topup_req( string $method, string $path, array $body = [] ): array|WP_Error {
        return self::req(
            $method,
            self::topup_base() . $path,
            $body,
            self::topup_base(),
            'application/com.reloadly.topups-v1+json'
        );
    }

    private static function gc_req( string $method, string $path, array $body = [] ): array|WP_Error {
        return self::req(
            $method,
            self::gc_base() . $path,
            $body,
            self::gc_base(),
            'application/com.reloadly.giftcards-v1+json'
        );
    }

    /* ── Airtime: operator detection ────────────────────────────── */

    /**
     * Auto-detect the mobile operator for a phone number.
     *
     * @param string $phone       Full number incl. country code (e.g. "+2348012345678")
     * @param string $country_iso ISO-2 (e.g. "NG")
     */
    public static function detect_operator( string $phone, string $country_iso ): array|WP_Error {
        $enc = rawurlencode( $phone );
        return self::topup_req(
            'GET',
            "/operators/auto-detect/phone/{$enc}/countries/{$country_iso}?suggestAlternates=true"
        );
    }

    /**
     * List all operators for a country (used as fallback when auto-detect fails).
     */
    public static function get_operators( string $country_iso ): array|WP_Error {
        return self::topup_req(
            'GET',
            "/operators/countries/{$country_iso}?includePin=false&includeBundles=true&size=50&page=1"
        );
    }

    /* ── Airtime: send top-up ───────────────────────────────────── */

    /**
     * Send a mobile top-up or data bundle.
     *
     * @param int    $operator_id      Reloadly operator ID
     * @param float  $amount           Amount in the local currency of the operator
     * @param string $recipient_phone  E.164 number (e.g. "+2348012345678")
     * @param string $country_iso      ISO-2 (e.g. "NG")
     */
    public static function send_topup(
        int    $operator_id,
        float  $amount,
        string $recipient_phone,
        string $country_iso
    ): array|WP_Error {
        return self::topup_req( 'POST', '/topups', [
            'operatorId'       => $operator_id,
            'amount'           => $amount,
            'useLocalAmount'   => true,
            'customIdentifier' => 'moveee_' . uniqid( '', true ),
            'recipientPhone'   => [
                'countryCode' => $country_iso,
                'number'      => $recipient_phone,
            ],
            'senderPhone' => [
                'countryCode' => 'GB',
                'number'      => '+441000000000',
            ],
        ] );
    }

    /* ── Gift cards: catalog ────────────────────────────────────── */

    /**
     * List gift card products for a country.
     *
     * @param string $country_iso ISO-2 (e.g. "GB", "NG", "US")
     */
    public static function get_gift_card_products( string $country_iso ): array|WP_Error {
        return self::gc_req(
            'GET',
            "/products?countryCode={$country_iso}&includeRange=true&includeFixed=true&size=50&page=1"
        );
    }

    /* ── Gift cards: order ──────────────────────────────────────── */

    /**
     * Order a digital gift card; Reloadly emails the code to $recipient_email.
     *
     * @param int    $product_id       Reloadly product ID
     * @param float  $amount           Face value (must be within product's min/max)
     * @param string $recipient_email  Member's email address
     */
    public static function order_gift_card(
        int    $product_id,
        float  $amount,
        string $recipient_email
    ): array|WP_Error {
        return self::gc_req( 'POST', '/orders', [
            'productId'        => $product_id,
            'quantity'         => 1,
            'unitPrice'        => $amount,
            'customIdentifier' => 'moveee_gc_' . uniqid( '', true ),
            'recipientEmail'   => sanitize_email( $recipient_email ),
            'preOrder'         => false,
        ] );
    }

    /* ── Credit ↔ money conversion ──────────────────────────────── */

    /**
     * Calculate credits required for a given monetary amount + currency.
     * Uses the same exchange rates as the cashout system (WP options).
     *
     * @param float  $amount   Amount in the target currency
     * @param string $currency ISO-4217 (GBP / USD / NGN)
     */
    public static function credits_for_amount( float $amount, string $currency ): int {
        switch ( strtoupper( $currency ) ) {
            case 'GBP':
                $rate = (int) get_option( 'culture_cashout_rate_gbp', 200 );
                return (int) ceil( $amount * $rate );
            case 'USD':
                $rate = (int) get_option( 'culture_cashout_rate_usd', 150 );
                return (int) ceil( $amount * $rate );
            case 'NGN':
                $rate = (int) get_option( 'culture_cashout_rate_ngn', 110 );
                return (int) ceil( ( $amount / 1000 ) * $rate );
            default:
                $rate = (int) get_option( 'culture_cashout_rate_usd', 150 );
                return (int) ceil( $amount * $rate );
        }
    }

    /**
     * Convert credits back to approximate money value (for display).
     *
     * @param int    $credits
     * @param string $currency GBP / USD / NGN
     */
    public static function amount_for_credits( int $credits, string $currency ): float {
        switch ( strtoupper( $currency ) ) {
            case 'GBP':
                $rate = (int) get_option( 'culture_cashout_rate_gbp', 200 );
                return round( $credits / $rate, 2 );
            case 'USD':
                $rate = (int) get_option( 'culture_cashout_rate_usd', 150 );
                return round( $credits / $rate, 2 );
            case 'NGN':
                $rate = (int) get_option( 'culture_cashout_rate_ngn', 110 );
                return round( ( $credits / $rate ) * 1000, 2 );
            default:
                $rate = (int) get_option( 'culture_cashout_rate_usd', 150 );
                return round( $credits / $rate, 2 );
        }
    }
}
