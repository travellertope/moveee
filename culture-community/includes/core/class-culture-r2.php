<?php
/**
 * Cloudflare R2 upload helper (SigV4-signed PUT, no AWS SDK).
 *
 * Mirrors packages/shared/lib/r2.ts so mobile uploads land in the same
 * bucket the web app (apps/connect) already uses.
 *
 * @package Culture_Community
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Culture_R2 {

    const REGION  = 'auto';
    const SERVICE = 's3';

    /**
     * Whether R2 credentials are configured.
     *
     * @return bool
     */
    public static function is_configured() {
        return '' !== self::account_id() && '' !== self::access_key_id() && '' !== self::secret_access_key();
    }

    /**
     * Upload a binary blob to R2 and return its public URL.
     *
     * @param string $key          Object key, e.g. "community/123/167...jpg".
     * @param string $body         Raw binary file contents.
     * @param string $content_type MIME type.
     * @return string|WP_Error Public URL on success, WP_Error on failure.
     */
    public static function upload( $key, $body, $content_type ) {
        if ( ! self::is_configured() ) {
            return new WP_Error( 'r2_not_configured', 'Cloudflare R2 credentials are not configured.' );
        }

        $bucket = self::bucket_name();
        $host   = self::account_id() . '.r2.cloudflarestorage.com';
        $now    = new DateTime( 'now', new DateTimeZone( 'UTC' ) );
        $amz_date   = $now->format( 'Ymd\THis\Z' );
        $date_stamp = $now->format( 'Ymd' );

        $payload_hash = hash( 'sha256', $body );

        $canonical_headers = "content-type:{$content_type}\nhost:{$host}\nx-amz-content-sha256:{$payload_hash}\nx-amz-date:{$amz_date}\n";
        $signed_headers     = 'content-type;host;x-amz-content-sha256;x-amz-date';
        $canonical_uri      = '/' . $bucket . '/' . $key;

        $canonical_request = implode(
            "\n",
            array(
                'PUT',
                $canonical_uri,
                '',
                $canonical_headers,
                $signed_headers,
                $payload_hash,
            )
        );

        $credential_scope = "{$date_stamp}/" . self::REGION . '/' . self::SERVICE . '/aws4_request';
        $string_to_sign    = implode(
            "\n",
            array(
                'AWS4-HMAC-SHA256',
                $amz_date,
                $credential_scope,
                hash( 'sha256', $canonical_request ),
            )
        );

        $signing_key = self::signing_key( $date_stamp );
        $signature   = hash_hmac( 'sha256', $string_to_sign, $signing_key );

        $auth_header = 'AWS4-HMAC-SHA256 Credential=' . self::access_key_id() . '/' . $credential_scope
            . ', SignedHeaders=' . $signed_headers . ', Signature=' . $signature;

        $endpoint = 'https://' . $host . $canonical_uri;

        $response = wp_remote_request(
            $endpoint,
            array(
                'method'  => 'PUT',
                'timeout' => 30,
                'headers' => array(
                    'Content-Type'         => $content_type,
                    'x-amz-content-sha256' => $payload_hash,
                    'x-amz-date'           => $amz_date,
                    'Authorization'        => $auth_header,
                ),
                'body'    => $body,
            )
        );

        if ( is_wp_error( $response ) ) {
            return $response;
        }

        $status = wp_remote_retrieve_response_code( $response );
        if ( $status < 200 || $status >= 300 ) {
            return new WP_Error( 'r2_upload_failed', 'R2 upload failed with status ' . $status );
        }

        return rtrim( self::public_url(), '/' ) . '/' . $key;
    }

    /**
     * Derive the AWS SigV4 signing key.
     *
     * @param string $date_stamp YYYYMMDD.
     * @return string Raw binary signing key.
     */
    private static function signing_key( $date_stamp ) {
        $k_date    = hash_hmac( 'sha256', $date_stamp, 'AWS4' . self::secret_access_key(), true );
        $k_region  = hash_hmac( 'sha256', self::REGION, $k_date, true );
        $k_service = hash_hmac( 'sha256', self::SERVICE, $k_region, true );
        return hash_hmac( 'sha256', 'aws4_request', $k_service, true );
    }

    private static function account_id() {
        if ( defined( 'CULTURE_R2_ACCOUNT_ID' ) && CULTURE_R2_ACCOUNT_ID ) {
            return CULTURE_R2_ACCOUNT_ID;
        }
        return get_option( 'culture_r2_account_id', '' );
    }

    private static function access_key_id() {
        if ( defined( 'CULTURE_R2_ACCESS_KEY_ID' ) && CULTURE_R2_ACCESS_KEY_ID ) {
            return CULTURE_R2_ACCESS_KEY_ID;
        }
        return get_option( 'culture_r2_access_key_id', '' );
    }

    private static function secret_access_key() {
        if ( defined( 'CULTURE_R2_SECRET_ACCESS_KEY' ) && CULTURE_R2_SECRET_ACCESS_KEY ) {
            return CULTURE_R2_SECRET_ACCESS_KEY;
        }
        return get_option( 'culture_r2_secret_access_key', '' );
    }

    private static function bucket_name() {
        if ( defined( 'CULTURE_R2_BUCKET_NAME' ) && CULTURE_R2_BUCKET_NAME ) {
            return CULTURE_R2_BUCKET_NAME;
        }
        return get_option( 'culture_r2_bucket_name', 'moveee-media' );
    }

    private static function public_url() {
        if ( defined( 'CULTURE_R2_PUBLIC_URL' ) && CULTURE_R2_PUBLIC_URL ) {
            return CULTURE_R2_PUBLIC_URL;
        }
        return get_option( 'culture_r2_public_url', 'https://media.themoveee.com' );
    }
}
