<?php
/**
 * Flutterwave Bills API — airtime top-ups.
 *
 * Env vars:
 *   FLUTTERWAVE_SECRET_KEY — from Flutterwave dashboard
 *
 * WP option fallback (set in WP Admin → Settings or WP-CLI):
 *   culture_flutterwave_secret_key
 *
 * Supported countries: NG (Nigeria) — extend airtime_type_for_country() for others.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Culture_Flutterwave {

    const API_BASE = 'https://api.flutterwave.com/v3';

    /* ── Credentials ────────────────────────────────────────────── */

    private static function secret_key(): string {
        return getenv( 'FLUTTERWAVE_SECRET_KEY' )
            ?: (string) get_option( 'culture_flutterwave_secret_key', '' );
    }

    public static function is_configured(): bool {
        return self::secret_key() !== '';
    }

    /**
     * Flutterwave bill type for airtime by country.
     * Extend this map as more countries are enabled.
     */
    private static function airtime_type_for_country( string $country ): string {
        $map = [
            'NG' => 'AIRTIME',
            'GH' => 'AIRTIME',
            'KE' => 'AIRTIME',
            'ZA' => 'AIRTIME',
            'UG' => 'AIRTIME',
        ];
        return $map[ strtoupper( $country ) ] ?? 'AIRTIME';
    }

    /* ── Airtime ────────────────────────────────────────────────── */

    /**
     * Send airtime to a phone number via the Flutterwave Bills API.
     *
     * @param string $phone      Phone number in E.164 format (e.g. "+2348012345678")
     *                           or local format as accepted by Flutterwave for that country.
     * @param float  $amount     Amount in local currency units (e.g. 500 for ₦500).
     * @param string $country    ISO-2 country code (e.g. "NG").
     * @param string $reference  Unique idempotency reference for this transaction.
     * @return array|WP_Error    Flutterwave response `data` on success, WP_Error on failure.
     */
    public static function send_airtime(
        string $phone,
        float  $amount,
        string $country,
        string $reference
    ): array|WP_Error {
        if ( ! self::is_configured() ) {
            return new WP_Error(
                'flutterwave_unconfigured',
                'Flutterwave is not configured. Please add your secret key in Settings.',
                [ 'status' => 503 ]
            );
        }

        $payload = [
            'country'    => strtoupper( $country ),
            'customer'   => $phone,
            'amount'     => (float) $amount,
            'recurrence' => 'ONCE',
            'type'       => self::airtime_type_for_country( $country ),
            'reference'  => $reference,
        ];

        $response = wp_remote_post( self::API_BASE . '/bills', [
            'headers' => [
                'Authorization' => 'Bearer ' . self::secret_key(),
                'Content-Type'  => 'application/json',
            ],
            'body'    => wp_json_encode( $payload ),
            'timeout' => 30,
        ] );

        if ( is_wp_error( $response ) ) {
            return new WP_Error(
                'flutterwave_network',
                'Could not reach Flutterwave: ' . $response->get_error_message(),
                [ 'status' => 502 ]
            );
        }

        $code = (int) wp_remote_retrieve_response_code( $response );
        $body = json_decode( wp_remote_retrieve_body( $response ), true ) ?? [];

        if ( $code >= 400 || ( $body['status'] ?? '' ) !== 'success' ) {
            $msg = $body['message'] ?? "Flutterwave returned HTTP {$code}";
            return new WP_Error(
                'flutterwave_api',
                $msg,
                [ 'status' => $code >= 500 ? 502 : 422 ]
            );
        }

        return $body['data'] ?? $body;
    }
}
