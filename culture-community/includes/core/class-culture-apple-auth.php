<?php
/**
 * Sign in with Apple support — mobile app only (App Store Guideline 4.8:
 * an app offering a third-party social login, here Google, must also offer
 * Sign in with Apple as an equivalent option). See CLAUDE.md "Sign in with
 * Apple" section.
 *
 * Verification is a local JWKS check, not a single tokeninfo HTTP call like
 * Culture_Google_Auth — Apple has no equivalent verification endpoint, so
 * the ID token (a standard RS256 JWT) is verified against Apple's public
 * keys directly. No JWT/JWK library dependency (matches this codebase's
 * "raw, no SDK" convention — see class-culture-r2.php's hand-rolled AWS
 * SigV4 signer for the precedent) — the RSA public key is reconstructed
 * from the JWK's raw modulus/exponent into a PEM via manual ASN.1 DER
 * encoding, then checked with PHP's built-in openssl_verify().
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Culture_Apple_Auth {

	const KEYS_URL      = 'https://appleid.apple.com/auth/keys';
	const ISSUER         = 'https://appleid.apple.com';
	const KEYS_CACHE_KEY = 'culture_apple_jwks';
	const KEYS_CACHE_TTL = 12 * HOUR_IN_SECONDS;

	/**
	 * Verify an Apple identity token (JWT) and check its audience against the
	 * configured bundle ID / Service ID.
	 *
	 * @param string $identity_token
	 * @return array|WP_Error Decoded claims (email, email_verified, sub) on success.
	 */
	public static function verify_id_token( string $identity_token ) {
		if ( empty( $identity_token ) ) {
			return new WP_Error( 'missing_token', 'identity_token is required.', array( 'status' => 400 ) );
		}

		$allowed_audiences = self::allowed_audiences();
		if ( empty( $allowed_audiences ) ) {
			return new WP_Error( 'apple_signin_disabled', 'Sign in with Apple is not configured.', array( 'status' => 503 ) );
		}

		// Rate-limit per IP — same reasoning as Culture_Google_Auth::verify_id_token():
		// without this, junk tokens can be hammered against the JWKS-fetch path.
		$ip       = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( $_SERVER['REMOTE_ADDR'] ) : 'unknown';
		$rate_key = 'culture_apple_auth_' . md5( $ip );
		$attempts = (int) get_transient( $rate_key );
		if ( $attempts >= 20 ) {
			return new WP_Error( 'rate_limited', 'Too many sign-in attempts. Please try again later.', array( 'status' => 429 ) );
		}
		set_transient( $rate_key, $attempts + 1, MINUTE_IN_SECONDS );

		$parts = explode( '.', $identity_token );
		if ( 3 !== count( $parts ) ) {
			return new WP_Error( 'invalid_apple_token', 'Malformed identity token.', array( 'status' => 401 ) );
		}
		list( $header_b64, $payload_b64, $sig_b64 ) = $parts;

		$header  = json_decode( self::base64url_decode( $header_b64 ), true );
		$payload = json_decode( self::base64url_decode( $payload_b64 ), true );
		$sig     = self::base64url_decode( $sig_b64 );

		if ( empty( $header['kid'] ) || empty( $header['alg'] ) || empty( $payload ) ) {
			return new WP_Error( 'invalid_apple_token', 'Malformed identity token.', array( 'status' => 401 ) );
		}
		if ( 'RS256' !== $header['alg'] ) {
			return new WP_Error( 'invalid_apple_token', 'Unsupported token signing algorithm.', array( 'status' => 401 ) );
		}

		$jwk = self::find_key( $header['kid'] );
		if ( ! $jwk ) {
			return new WP_Error( 'invalid_apple_token', 'Could not find a matching Apple signing key.', array( 'status' => 401 ) );
		}

		$pem      = self::jwk_to_pem( $jwk['n'], $jwk['e'] );
		$signed   = $header_b64 . '.' . $payload_b64;
		$verified = openssl_verify( $signed, $sig, $pem, OPENSSL_ALGO_SHA256 );

		if ( 1 !== $verified ) {
			return new WP_Error( 'invalid_apple_token', 'Identity token signature is invalid.', array( 'status' => 401 ) );
		}

		if ( ( $payload['iss'] ?? '' ) !== self::ISSUER ) {
			return new WP_Error( 'invalid_apple_token', 'Identity token issuer mismatch.', array( 'status' => 401 ) );
		}
		if ( empty( $payload['exp'] ) || time() >= (int) $payload['exp'] ) {
			return new WP_Error( 'invalid_apple_token', 'Identity token has expired.', array( 'status' => 401 ) );
		}
		if ( empty( $payload['aud'] ) || ! in_array( $payload['aud'], $allowed_audiences, true ) ) {
			return new WP_Error( 'invalid_audience', 'Apple token was not issued for this app.', array( 'status' => 401 ) );
		}
		if ( empty( $payload['email'] ) ) {
			return new WP_Error( 'email_not_verified', 'Apple account has no associated email.', array( 'status' => 401 ) );
		}
		// Apple sends this as either a boolean or the strings "true"/"false"
		// depending on client SDK version — normalize before comparing.
		$email_verified = $payload['email_verified'] ?? false;
		if ( true !== $email_verified && 'true' !== $email_verified ) {
			return new WP_Error( 'email_not_verified', 'Apple account email is not verified.', array( 'status' => 401 ) );
		}

		return array(
			'email' => sanitize_email( $payload['email'] ),
			'sub'   => sanitize_text_field( $payload['sub'] ?? '' ),
		);
	}

	/**
	 * Find a WP user by the Apple-verified email, or create one. Mirrors
	 * Culture_Google_Auth::find_or_create_user() exactly, plus an optional
	 * $full_name — Apple only ever sends the user's real name on the very
	 * first authorization (never again after), so the mobile client must
	 * capture it from that first native response and forward it here; a
	 * repeat login simply passes an empty string, which is ignored for an
	 * already-existing account.
	 *
	 * @param array  $claims    Output of verify_id_token().
	 * @param string $full_name Optional, first-authorization-only display name.
	 * @return WP_User|WP_Error
	 */
	public static function find_or_create_user( array $claims, string $full_name = '' ) {
		$email = $claims['email'];

		$user = get_user_by( 'email', $email );
		if ( $user ) {
			if ( '1' !== get_user_meta( $user->ID, '_culture_email_verified', true ) ) {
				update_user_meta( $user->ID, '_culture_email_verified', '1' );
			}
			return $user;
		}

		$username = self::unique_username_from_email( $email );
		$password = wp_generate_password( 32 );

		$user_id = wp_create_user( $username, $password, $email );
		if ( is_wp_error( $user_id ) ) {
			return $user_id;
		}

		if ( ! empty( $full_name ) ) {
			wp_update_user( array( 'ID' => $user_id, 'display_name' => sanitize_text_field( $full_name ) ) );
		}

		update_user_meta( $user_id, '_culture_membership_tier', 'citizen' );
		update_user_meta( $user_id, '_culture_points', 0 );
		update_user_meta( $user_id, '_culture_badges', array() );
		update_user_meta( $user_id, '_culture_directory_opt_in', '1' );
		update_user_meta( $user_id, '_culture_email_verified', '1' );

		return get_userdata( $user_id );
	}

	// -------------------------------------------------------------------------
	// Internals
	// -------------------------------------------------------------------------

	/**
	 * Bundle ID (native app flow) plus an optional admin-configured Service ID
	 * (only needed if Sign in with Apple is ever added to a web flow — the
	 * native mobile flow alone only ever needs the bundle ID).
	 */
	private static function allowed_audiences(): array {
		$configured = get_option( 'culture_apple_service_id', '' );
		return array_values( array_filter( array_unique( array(
			'com.moveee.connect', // matches app.config.ts ios.bundleIdentifier / android.package
			$configured,
		) ) ) );
	}

	private static function find_key( string $kid ) {
		$keys = self::get_jwks();
		foreach ( $keys as $key ) {
			if ( ( $key['kid'] ?? '' ) === $kid ) {
				return $key;
			}
		}
		return null;
	}

	private static function get_jwks(): array {
		$cached = get_transient( self::KEYS_CACHE_KEY );
		if ( is_array( $cached ) ) {
			return $cached;
		}

		$response = wp_remote_get( self::KEYS_URL, array( 'timeout' => 8 ) );
		if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return array();
		}

		$body = json_decode( wp_remote_retrieve_body( $response ), true );
		$keys = $body['keys'] ?? array();
		set_transient( self::KEYS_CACHE_KEY, $keys, self::KEYS_CACHE_TTL );

		return $keys;
	}

	/** Reconstructs a PEM RSA public key from a JWK's base64url n/e — see file docblock. */
	private static function jwk_to_pem( string $n_b64url, string $e_b64url ): string {
		$n = self::base64url_decode( $n_b64url );
		$e = self::base64url_decode( $e_b64url );

		$modulus     = self::der_integer( $n );
		$exponent    = self::der_integer( $e );
		$rsa_pub_seq = "\x30" . self::der_length( strlen( $modulus . $exponent ) ) . $modulus . $exponent;

		// RSAPublicKey wrapped as a BIT STRING (0x00 = zero unused bits).
		$bit_string = "\x03" . self::der_length( strlen( $rsa_pub_seq ) + 1 ) . "\x00" . $rsa_pub_seq;

		// AlgorithmIdentifier SEQUENCE { OID rsaEncryption (1.2.840.113549.1.1.1), NULL }.
		$algo_id = "\x30\x0d\x06\x09\x2a\x86\x48\x86\xf7\x0d\x01\x01\x01\x05\x00";

		$spki = "\x30" . self::der_length( strlen( $algo_id . $bit_string ) ) . $algo_id . $bit_string;

		return "-----BEGIN PUBLIC KEY-----\n" . chunk_split( base64_encode( $spki ), 64, "\n" ) . "-----END PUBLIC KEY-----\n";
	}

	private static function der_length( int $length ): string {
		if ( $length <= 0x7f ) {
			return chr( $length );
		}
		$bytes = ltrim( pack( 'N', $length ), "\x00" );
		return chr( 0x80 | strlen( $bytes ) ) . $bytes;
	}

	/** Encodes a raw big-endian integer as a DER INTEGER, adding a leading
	 *  0x00 when the high bit is set (so it's never read as negative). */
	private static function der_integer( string $bytes ): string {
		$bytes = ltrim( $bytes, "\x00" );
		if ( '' === $bytes || ord( $bytes[0] ) > 0x7f ) {
			$bytes = "\x00" . $bytes;
		}
		return "\x02" . self::der_length( strlen( $bytes ) ) . $bytes;
	}

	private static function base64url_decode( string $data ): string {
		$padded = strtr( $data, '-_', '+/' );
		$pad    = strlen( $padded ) % 4;
		if ( $pad ) {
			$padded .= str_repeat( '=', 4 - $pad );
		}
		return base64_decode( $padded );
	}

	private static function unique_username_from_email( string $email ): string {
		$base = sanitize_user( strtolower( substr( $email, 0, strpos( $email, '@' ) ) ), true );
		if ( empty( $base ) ) {
			$base = 'member';
		}

		$username = $base;
		$suffix   = 1;
		while ( username_exists( $username ) ) {
			$username = $base . $suffix;
			$suffix++;
		}

		return $username;
	}
}
