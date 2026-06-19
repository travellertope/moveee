<?php
/**
 * Google Sign-In support — shared by both the web (class-culture-rest-api.php)
 * and mobile (class-culture-mobile-api.php) REST surfaces.
 *
 * Verification uses Google's tokeninfo endpoint (one HTTP call per login) rather
 * than a local JWKS library — see CLAUDE.md "Google Sign-In" section for why.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Culture_Google_Auth {

	const TOKENINFO_URL = 'https://oauth2.googleapis.com/tokeninfo';

	/**
	 * Verify a Google ID token via Google's tokeninfo endpoint and check its
	 * audience against the configured Client IDs (web / iOS / Android — any
	 * configured client is accepted, since the same login endpoint serves all
	 * three surfaces).
	 *
	 * @param string $id_token
	 * @return array|WP_Error Decoded claims (email, email_verified, name, picture) on success.
	 */
	public static function verify_id_token( string $id_token ) {
		if ( empty( $id_token ) ) {
			return new WP_Error( 'missing_token', 'id_token is required.', array( 'status' => 400 ) );
		}

		$allowed_client_ids = array_filter( array(
			get_option( 'culture_google_client_id_web', '' ),
			get_option( 'culture_google_client_id_ios', '' ),
			get_option( 'culture_google_client_id_android', '' ),
		) );

		if ( empty( $allowed_client_ids ) ) {
			return new WP_Error( 'google_signin_disabled', 'Google Sign-In is not configured.', array( 'status' => 503 ) );
		}

		// Rate-limit per IP — without this, an attacker can hammer this
		// endpoint with junk tokens, each forwarded as an outbound request
		// to Google's tokeninfo endpoint (cost/DoS amplification).
		$ip       = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( $_SERVER['REMOTE_ADDR'] ) : 'unknown';
		$rate_key = 'culture_google_auth_' . md5( $ip );
		$attempts = (int) get_transient( $rate_key );
		if ( $attempts >= 20 ) {
			return new WP_Error( 'rate_limited', 'Too many sign-in attempts. Please try again later.', array( 'status' => 429 ) );
		}
		set_transient( $rate_key, $attempts + 1, MINUTE_IN_SECONDS );

		$response = wp_remote_get( add_query_arg( 'id_token', rawurlencode( $id_token ), self::TOKENINFO_URL ), array(
			'timeout' => 8,
		) );

		if ( is_wp_error( $response ) ) {
			return new WP_Error( 'google_verify_failed', 'Could not reach Google to verify the token.', array( 'status' => 502 ) );
		}

		$code = wp_remote_retrieve_response_code( $response );
		$body = json_decode( wp_remote_retrieve_body( $response ), true );

		if ( 200 !== $code || empty( $body['aud'] ) ) {
			return new WP_Error( 'invalid_google_token', 'Invalid or expired Google token.', array( 'status' => 401 ) );
		}

		if ( ! in_array( $body['aud'], $allowed_client_ids, true ) ) {
			return new WP_Error( 'invalid_audience', 'Google token was not issued for this app.', array( 'status' => 401 ) );
		}

		if ( empty( $body['email'] ) || 'true' !== ( $body['email_verified'] ?? '' ) ) {
			return new WP_Error( 'email_not_verified', 'Google account email is not verified.', array( 'status' => 401 ) );
		}

		return array(
			'email'   => sanitize_email( $body['email'] ),
			'name'    => sanitize_text_field( $body['name'] ?? '' ),
			'picture' => sanitize_url( $body['picture'] ?? '' ),
		);
	}

	/**
	 * Find a WP user by the Google-verified email, or create one.
	 * Email is treated as verified immediately — Google already confirmed ownership.
	 *
	 * @param array $claims Output of verify_id_token().
	 * @return WP_User|WP_Error
	 */
	public static function find_or_create_user( array $claims ) {
		$email = $claims['email'];

		$user = get_user_by( 'email', $email );
		if ( $user ) {
			// Logging in via Google proves ownership even if the account was
			// originally created with a password and never verified.
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

		if ( ! empty( $claims['name'] ) ) {
			wp_update_user( array( 'ID' => $user_id, 'display_name' => $claims['name'] ) );
		}
		if ( ! empty( $claims['picture'] ) ) {
			update_user_meta( $user_id, '_culture_avatar_url', $claims['picture'] );
		}

		update_user_meta( $user_id, '_culture_membership_tier', 'citizen' );
		update_user_meta( $user_id, '_culture_points', 0 );
		update_user_meta( $user_id, '_culture_badges', array() );
		update_user_meta( $user_id, '_culture_directory_opt_in', '1' );
		update_user_meta( $user_id, '_culture_email_verified', '1' );

		return get_userdata( $user_id );
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
