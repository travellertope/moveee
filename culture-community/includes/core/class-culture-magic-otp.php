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
	 * wp_options row name for the OTP payload for a given key.
	 * Stored directly in the DB (not via transients) so the value is never
	 * at the mercy of an external object cache (Redis/Memcached) evicting it
	 * before the user can enter the code.
	 */
	private static function otp_option_name( $key ) {
		return '_culture_otp_' . $key;
	}

	private static function rl_option_name( $key ) {
		return '_culture_otp_rl_' . $key;
	}

	/**
	 * Step 1 — generate and email a 6-digit sign-in code.
	 *
	 * @param string $email
	 * @return true|WP_Error
	 */
	public static function request_otp( $email ) {
		global $wpdb;

		$email = sanitize_email( $email );
		if ( ! is_email( $email ) ) {
			return new WP_Error( 'invalid_email', __( 'Enter a valid email address.', 'culture-community' ), array( 'status' => 400 ) );
		}

		$key    = md5( strtolower( $email ) );
		$rl_opt = self::rl_option_name( $key );

		// Rate limiting — stored in DB, not the object cache.
		$rl_row = $wpdb->get_var( $wpdb->prepare(
			"SELECT option_value FROM {$wpdb->options} WHERE option_name = %s",
			$rl_opt
		) );
		$rl_data = $rl_row ? json_decode( $rl_row, true ) : null;
		if ( $rl_data && time() < (int) $rl_data['window_expires'] ) {
			if ( (int) $rl_data['count'] >= self::MAX_REQUESTS_PER_WINDOW ) {
				return new WP_Error( 'too_many_requests', __( 'Too many code requests — try again in a few minutes.', 'culture-community' ), array( 'status' => 429 ) );
			}
			$rl_data['count']++;
		} else {
			$rl_data = array( 'count' => 1, 'window_expires' => time() + self::CODE_TTL );
		}
		$rl_json = wp_json_encode( $rl_data );
		$wpdb->query( $wpdb->prepare(
			"INSERT INTO {$wpdb->options} (option_name, option_value, autoload)
			 VALUES (%s, %s, 'no')
			 ON DUPLICATE KEY UPDATE option_value = %s",
			$rl_opt, $rl_json, $rl_json
		) );

		$code    = str_pad( (string) random_int( 0, 999999 ), 6, '0', STR_PAD_LEFT );
		$otp_opt = self::otp_option_name( $key );
		$otp_json = wp_json_encode( array(
			'hash'     => wp_hash( $code ),
			'attempts' => 0,
			'expires'  => time() + self::CODE_TTL,
		) );
		// Write directly to wp_options, bypassing the object cache.
		$wpdb->query( $wpdb->prepare(
			"INSERT INTO {$wpdb->options} (option_name, option_value, autoload)
			 VALUES (%s, %s, 'no')
			 ON DUPLICATE KEY UPDATE option_value = %s",
			$otp_opt, $otp_json, $otp_json
		) );

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
	 *                          Pass an empty string to skip subscribing entirely —
	 *                          the sign-in/register pages use the code purely as a
	 *                          credential and must not silently add anyone to a
	 *                          mailing list they never asked for.
	 * @param string $referral  Optional referral code to attribute a brand-new
	 *                          account to. Ignored for an existing account.
	 * @return WP_User|WP_Error
	 */
	public static function verify_otp( $email, $code, $list_slug = 'getmelit', $referral = '' ) {
		global $wpdb;

		$email = sanitize_email( $email );
		if ( ! is_email( $email ) ) {
			return new WP_Error( 'invalid_email', __( 'Enter a valid email address.', 'culture-community' ), array( 'status' => 400 ) );
		}
		$code    = trim( (string) $code );
		$key     = md5( strtolower( $email ) );
		$otp_opt = self::otp_option_name( $key );

		// Read directly from the DB — bypasses object cache so Redis eviction
		// can never make a valid code appear missing.
		$row = $wpdb->get_var( $wpdb->prepare(
			"SELECT option_value FROM {$wpdb->options} WHERE option_name = %s",
			$otp_opt
		) );

		if ( null === $row ) {
			return new WP_Error( 'code_expired', __( 'That code has expired — request a new one.', 'culture-community' ), array( 'status' => 400 ) );
		}

		$data = json_decode( $row, true );
		if ( ! $data || time() > (int) $data['expires'] ) {
			$wpdb->delete( $wpdb->options, array( 'option_name' => $otp_opt ) );
			return new WP_Error( 'code_expired', __( 'That code has expired — request a new one.', 'culture-community' ), array( 'status' => 400 ) );
		}

		$attempts = (int) $data['attempts'];
		if ( $attempts >= self::MAX_ATTEMPTS ) {
			$wpdb->delete( $wpdb->options, array( 'option_name' => $otp_opt ) );
			return new WP_Error( 'too_many_attempts', __( 'Too many incorrect attempts — request a new code.', 'culture-community' ), array( 'status' => 429 ) );
		}
		if ( ! hash_equals( $data['hash'], wp_hash( $code ) ) ) {
			$data['attempts'] = $attempts + 1;
			$wpdb->update(
				$wpdb->options,
				array( 'option_value' => wp_json_encode( $data ) ),
				array( 'option_name' => $otp_opt )
			);
			return new WP_Error( 'invalid_code', __( 'That code is incorrect.', 'culture-community' ), array( 'status' => 400 ) );
		}

		// Single-use — delete immediately on success.
		$wpdb->delete( $wpdb->options, array( 'option_name' => $otp_opt ) );

		$user = self::find_or_create_user( $email, $referral );
		if ( is_wp_error( $user ) ) {
			return $user;
		}

		$list_slug = sanitize_title( (string) $list_slug );
		if ( '' !== $list_slug && class_exists( 'Culture_Subscribers_DB' ) ) {
			Culture_Subscribers_DB::subscribe( $email, array( $list_slug ), $user->display_name );
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
	 * @param string $referral Optional referral code, applied only when this call
	 *                         actually creates the account.
	 * @return WP_User|WP_Error
	 */
	private static function find_or_create_user( $email, $referral = '' ) {
		$user = get_user_by( 'email', $email );
		if ( $user ) {
			if ( '1' !== get_user_meta( $user->ID, '_culture_email_verified', true ) ) {
				update_user_meta( $user->ID, '_culture_email_verified', '1' );
			}
			return $user;
		}

		$username = self::unique_username_from_email( $email );
		$password = wp_generate_password( 32 );

		// Culture_Referrals::process_referral() is hooked on user_register and
		// reads $_POST['culture_referral_code'] (its cookie path can't work
		// headlessly — the cookie would land on cms.themoveee.com, not the
		// frontend origin). A JSON REST body never populates $_POST, so set it
		// here for the duration of the create call and restore it after.
		$referral   = sanitize_key( (string) $referral );
		$had_post   = array_key_exists( 'culture_referral_code', $_POST );
		$prev_post  = $had_post ? $_POST['culture_referral_code'] : null;
		if ( '' !== $referral ) {
			$_POST['culture_referral_code'] = $referral;
		}

		$user_id = wp_create_user( $username, $password, $email );

		if ( '' !== $referral ) {
			if ( $had_post ) {
				$_POST['culture_referral_code'] = $prev_post;
			} else {
				unset( $_POST['culture_referral_code'] );
			}
		}

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
