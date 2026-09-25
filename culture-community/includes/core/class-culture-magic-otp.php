<?php
/**
 * Magic-code sign-in + subscribe — a 6-digit emailed OTP that, on success,
 * finds-or-creates a real Moveee account for that email, subscribes it to a
 * given newsletter list, and hands back the same user-profile shape every
 * other login path (handle_login/handle_login_google) already returns, so
 * the Next.js CredentialsProvider can build a normal site session from it.
 *
 * Built first for The Moveee Literary's newsletter-subscribe landing page
 * (apps/site/app/literary/subscribe) — "Subscribe" there both joins GetMeLit
 * and signs the visitor into the website, new account or existing one alike
 * — but the class itself is generic (an arbitrary $list_slug), not
 * Literary-specific, so any future "subscribe to X, sign me in" surface can
 * reuse it.
 *
 * Deliberately a separate class from Culture_Literary_Access, even though
 * the OTP mechanics (hash a code, rate-limit requests, cap wrong attempts,
 * single-use transient) are the same shape — that class's verify_code()
 * issues a signed *content-access* token and never touches a real WP
 * account; this one always creates/updates a real WP user and never issues
 * a standalone token, it returns the full profile instead. Conflating the
 * two would mean either the content-gate token model needs to carry account
 * creation (wrong — nothing else reads that token expects an account behind
 * it) or a "sign in" flow starts returning a lightweight token instead of a
 * profile — cleaner as two classes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Culture_Magic_OTP {

	/** How long a requested code stays valid, in seconds. */
	const CODE_TTL = 600;

	/** Wrong-code attempts allowed before the code is invalidated. */
	const MAX_ATTEMPTS = 5;

	/** Code requests allowed per email within CODE_TTL, to slow down abuse. */
	const MAX_REQUESTS_PER_WINDOW = 3;

	/**
	 * Step 1 — generate and email a 6-digit sign-in code.
	 *
	 * @param string $email
	 * @return true|WP_Error
	 */
	public static function request_otp( $email ) {
		$email = sanitize_email( $email );
		if ( ! is_email( $email ) ) {
			return new WP_Error( 'invalid_email', __( 'Enter a valid email address.', 'culture-community' ), array( 'status' => 400 ) );
		}

		$key = md5( strtolower( $email ) );

		$rl_key   = 'culture_magic_otp_rl_' . $key;
		$requests = (int) get_transient( $rl_key );
		if ( $requests >= self::MAX_REQUESTS_PER_WINDOW ) {
			return new WP_Error( 'too_many_requests', __( 'Too many code requests — try again in a few minutes.', 'culture-community' ), array( 'status' => 429 ) );
		}
		set_transient( $rl_key, $requests + 1, self::CODE_TTL );

		$code = str_pad( (string) random_int( 0, 999999 ), 6, '0', STR_PAD_LEFT );

		set_transient( 'culture_magic_otp_' . $key, wp_hash( $code ), self::CODE_TTL );
		set_transient( 'culture_magic_otp_attempts_' . $key, 0, self::CODE_TTL );

		if ( class_exists( 'Culture_Emails' ) ) {
			Culture_Emails::send_magic_otp_email( $email, $code );
		}

		return true;
	}

	/**
	 * Step 2 — verify the code, then find-or-create the account and
	 * subscribe it to $list_slug.
	 *
	 * @param string $email
	 * @param string $code
	 * @param string $list_slug Newsletter list slug to subscribe the email to.
	 * @return WP_User|WP_Error
	 */
	public static function verify_otp( $email, $code, $list_slug = 'getmelit' ) {
		$email = sanitize_email( $email );
		if ( ! is_email( $email ) ) {
			return new WP_Error( 'invalid_email', __( 'Enter a valid email address.', 'culture-community' ), array( 'status' => 400 ) );
		}
		$code = trim( (string) $code );

		$key          = md5( strtolower( $email ) );
		$stored_hash  = get_transient( 'culture_magic_otp_' . $key );
		$attempts_key = 'culture_magic_otp_attempts_' . $key;
		$attempts     = (int) get_transient( $attempts_key );

		if ( false === $stored_hash ) {
			return new WP_Error( 'code_expired', __( 'That code has expired — request a new one.', 'culture-community' ), array( 'status' => 400 ) );
		}
		if ( $attempts >= self::MAX_ATTEMPTS ) {
			delete_transient( 'culture_magic_otp_' . $key );
			return new WP_Error( 'too_many_attempts', __( 'Too many incorrect attempts — request a new code.', 'culture-community' ), array( 'status' => 429 ) );
		}
		if ( ! hash_equals( $stored_hash, wp_hash( $code ) ) ) {
			set_transient( $attempts_key, $attempts + 1, self::CODE_TTL );
			return new WP_Error( 'invalid_code', __( 'That code is incorrect.', 'culture-community' ), array( 'status' => 400 ) );
		}

		// Single-use — invalidate immediately on success.
		delete_transient( 'culture_magic_otp_' . $key );
		delete_transient( $attempts_key );

		$user = self::find_or_create_user( $email );
		if ( is_wp_error( $user ) ) {
			return $user;
		}

		if ( class_exists( 'Culture_Subscribers_DB' ) ) {
			Culture_Subscribers_DB::subscribe( $email, array( sanitize_title( $list_slug ) ), $user->display_name );
		}

		return $user;
	}

	/**
	 * Find the account for this email, or create a fresh Citizen account —
	 * same shape as Culture_Google_Auth::find_or_create_user(), minus the
	 * name/picture claims a magic code has none of. Verifying a code proves
	 * ownership of the inbox the same way clicking a Google account does, so
	 * an existing password-only, never-verified account is marked verified
	 * here too.
	 *
	 * @param string $email
	 * @return WP_User|WP_Error
	 */
	private static function find_or_create_user( $email ) {
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

		update_user_meta( $user_id, '_culture_membership_tier', 'citizen' );
		update_user_meta( $user_id, '_culture_points', 0 );
		update_user_meta( $user_id, '_culture_badges', array() );
		update_user_meta( $user_id, '_culture_directory_opt_in', '1' );
		update_user_meta( $user_id, '_culture_email_verified', '1' );

		return get_userdata( $user_id );
	}

	private static function unique_username_from_email( $email ) {
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
