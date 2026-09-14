<?php
/**
 * The Moveee Literary — email/OTP verification for the metered soft-paywall.
 *
 * Two things this backs, both reached from apps/site's /literary/[slug] page:
 *
 * 1. Anonymous readers get a limited number of free Literary reads per
 *    rolling 30-day window (tracked client-side via a cookie, see
 *    apps/site/lib/literary-access.ts) — once that's used up, continuing to
 *    read requires verifying an email via a 6-digit code. Verifying always
 *    unlocks free content (and adds the email to the "literary-club"
 *    newsletter list — this is the list-building mechanism), same as
 *    joining the list. This does not require a WordPress account at all.
 * 2. Pro-only Literary pieces (culture_access = patron-only) require the
 *    email to belong to an existing Moveee Pro (`patron`) member — this is
 *    the same Pro-gating the rest of the site uses (see access.ts /
 *    getAccessLevel()), just reached via emailed-code verification instead
 *    of a logged-in session, for a reader who doesn't want to sign in on
 *    this device.
 *
 * Trust model: same as Culture_Preview — a short-lived HMAC-signed token
 * (email|access|expiry, signed with the existing `culture_api_secret`) is
 * the credential. Next.js verifies it locally (it has the same secret as
 * CULTURE_API_SECRET, already used for the Bearer-auth REST surface) rather
 * than round-tripping to WordPress on every article load — see
 * apps/site/lib/literary-access.ts's verifyLiteraryToken(). No new secret.
 *
 * The one-time 6-digit code itself is never stored in the clear — only its
 * wp_hash() lives in a transient, same convention as
 * Culture_Account_Deletion's token handling.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Culture_Literary_Access {

	/** How long a requested code stays valid, in seconds. */
	const CODE_TTL = 600;

	/** How long an issued verification token stays valid, in seconds. */
	const TOKEN_TTL = 30 * DAY_IN_SECONDS;

	/** Wrong-code attempts allowed before the code is invalidated. */
	const MAX_ATTEMPTS = 5;

	/** Code requests allowed per email within CODE_TTL, to slow down abuse. */
	const MAX_REQUESTS_PER_WINDOW = 3;

	/**
	 * Step 1 — generate and email a 6-digit code to the given address.
	 *
	 * @param string $email
	 * @return true|WP_Error
	 */
	public static function request_code( $email ) {
		$email = sanitize_email( $email );
		if ( ! is_email( $email ) ) {
			return new WP_Error( 'invalid_email', __( 'Enter a valid email address.', 'culture-community' ), array( 'status' => 400 ) );
		}

		$key = md5( strtolower( $email ) );

		$rl_key   = 'culture_lit_otp_rl_' . $key;
		$requests = (int) get_transient( $rl_key );
		if ( $requests >= self::MAX_REQUESTS_PER_WINDOW ) {
			return new WP_Error( 'too_many_requests', __( 'Too many code requests — try again in a few minutes.', 'culture-community' ), array( 'status' => 429 ) );
		}
		set_transient( $rl_key, $requests + 1, self::CODE_TTL );

		$code = str_pad( (string) random_int( 0, 999999 ), 6, '0', STR_PAD_LEFT );

		set_transient( 'culture_lit_otp_' . $key, wp_hash( $code ), self::CODE_TTL );
		set_transient( 'culture_lit_otp_attempts_' . $key, 0, self::CODE_TTL );

		if ( class_exists( 'Culture_Emails' ) ) {
			Culture_Emails::send_literary_otp_email( $email, $code );
		}

		return true;
	}

	/**
	 * Step 2 — verify a code, and if correct, resolve the reader's access
	 * level and issue a signed token.
	 *
	 * @param string $email
	 * @param string $code
	 * @return array|WP_Error { access: 'free'|'pro', token: string }
	 */
	public static function verify_code( $email, $code ) {
		$email = sanitize_email( $email );
		if ( ! is_email( $email ) ) {
			return new WP_Error( 'invalid_email', __( 'Enter a valid email address.', 'culture-community' ), array( 'status' => 400 ) );
		}
		$code = trim( (string) $code );

		$key           = md5( strtolower( $email ) );
		$stored_hash   = get_transient( 'culture_lit_otp_' . $key );
		$attempts_key  = 'culture_lit_otp_attempts_' . $key;
		$attempts      = (int) get_transient( $attempts_key );

		if ( false === $stored_hash ) {
			return new WP_Error( 'code_expired', __( 'That code has expired — request a new one.', 'culture-community' ), array( 'status' => 400 ) );
		}
		if ( $attempts >= self::MAX_ATTEMPTS ) {
			delete_transient( 'culture_lit_otp_' . $key );
			return new WP_Error( 'too_many_attempts', __( 'Too many incorrect attempts — request a new code.', 'culture-community' ), array( 'status' => 429 ) );
		}
		if ( ! hash_equals( $stored_hash, wp_hash( $code ) ) ) {
			set_transient( $attempts_key, $attempts + 1, self::CODE_TTL );
			return new WP_Error( 'invalid_code', __( 'That code is incorrect.', 'culture-community' ), array( 'status' => 400 ) );
		}

		// Single-use — invalidate immediately on success.
		delete_transient( 'culture_lit_otp_' . $key );
		delete_transient( $attempts_key );

		$access = 'free';
		$wp_user = get_user_by( 'email', $email );
		if ( $wp_user && 'patron' === get_user_meta( $wp_user->ID, '_culture_membership_tier', true ) ) {
			$access = 'pro';
		}

		if ( 'free' === $access ) {
			self::add_to_literary_club( $email );
		}

		$token = self::make_token( $email, $access );
		if ( ! $token ) {
			return new WP_Error( 'server_error', __( 'Verification is not configured.', 'culture-community' ), array( 'status' => 503 ) );
		}

		return array( 'access' => $access, 'token' => $token );
	}

	/**
	 * Add (or update) a subscriber record for the "literary-club" list —
	 * the list-building side of this feature. Mirrors
	 * Culture_REST_API::handle_newsletter_subscribe()'s find-or-create
	 * shape rather than calling into it (that logic lives on the public
	 * newsletter-subscribe endpoint and isn't reusable as a plain
	 * function), since Culture_Subscribers::merge_subscribers() is private
	 * to that class.
	 */
	private static function add_to_literary_club( $email ) {
		$subscribers = get_option( 'culture_newsletter_subscribers', array() );

		foreach ( $subscribers as $i => $sub ) {
			$sub_email = is_array( $sub ) ? ( $sub['email'] ?? '' ) : $sub;
			if ( strtolower( trim( $sub_email ) ) === strtolower( $email ) ) {
				if ( is_array( $sub ) ) {
					$lists = $sub['lists'] ?? array();
					if ( ! in_array( 'literary-club', $lists, true ) ) {
						$lists[] = 'literary-club';
						$subscribers[ $i ]['lists'] = $lists;
						update_option( 'culture_newsletter_subscribers', $subscribers, false );
					}
				} else {
					$subscribers[ $i ] = array(
						'email'   => $email,
						'name'    => '',
						'date'    => current_time( 'mysql' ),
						'lists'   => array( 'getmelit', 'literary-club', 'announcements' ),
						'segment' => '',
					);
					update_option( 'culture_newsletter_subscribers', $subscribers, false );
				}
				return;
			}
		}

		$subscribers[] = array(
			'email'   => $email,
			'name'    => '',
			'date'    => current_time( 'mysql' ),
			'lists'   => array( 'literary-club', 'announcements' ),
			'segment' => '',
		);
		update_option( 'culture_newsletter_subscribers', $subscribers, false );
	}

	/**
	 * Build a signed, expiring verification token: base64url(email|access|expiry).signature
	 *
	 * @return string|false
	 */
	public static function make_token( $email, $access, $secret = null ) {
		if ( null === $secret ) {
			$secret = get_option( 'culture_api_secret', '' );
		}
		if ( empty( $secret ) || empty( $email ) || ! in_array( $access, array( 'free', 'pro' ), true ) ) {
			return false;
		}

		$expires = time() + self::TOKEN_TTL;
		$payload = strtolower( $email ) . '|' . $access . '|' . $expires;
		$encoded = self::base64url_encode( $payload );
		$sig     = hash_hmac( 'sha256', $encoded, $secret );

		return $encoded . '.' . $sig;
	}

	/**
	 * Verify a token produced by make_token(). Returns { email, access,
	 * expires } on success, or a WP_Error on failure. Not currently called
	 * from PHP anywhere (Next.js verifies locally with the same secret —
	 * see literary-access.ts) but kept as the canonical reference
	 * implementation and for any future server-side need.
	 *
	 * @return array|WP_Error
	 */
	public static function verify_token( $token ) {
		$secret = get_option( 'culture_api_secret', '' );
		if ( empty( $secret ) ) {
			return new WP_Error( 'not_configured', 'Literary verification is not configured.', array( 'status' => 503 ) );
		}
		if ( empty( $token ) || false === strpos( (string) $token, '.' ) ) {
			return new WP_Error( 'invalid_token', 'Malformed token.', array( 'status' => 400 ) );
		}

		list( $encoded, $sig ) = array_pad( explode( '.', (string) $token, 2 ), 2, '' );
		$expected_sig = hash_hmac( 'sha256', $encoded, $secret );
		if ( ! hash_equals( $expected_sig, $sig ) ) {
			return new WP_Error( 'invalid_token', 'Token signature mismatch.', array( 'status' => 403 ) );
		}

		$payload = self::base64url_decode( $encoded );
		$parts   = explode( '|', (string) $payload );
		if ( count( $parts ) !== 3 ) {
			return new WP_Error( 'invalid_token', 'Malformed token payload.', array( 'status' => 400 ) );
		}

		list( $email, $access, $expires ) = $parts;
		$expires = absint( $expires );

		if ( ! is_email( $email ) || ! in_array( $access, array( 'free', 'pro' ), true ) ) {
			return new WP_Error( 'invalid_token', 'Malformed token payload.', array( 'status' => 400 ) );
		}
		if ( time() > $expires ) {
			return new WP_Error( 'token_expired', 'This verification has expired.', array( 'status' => 403 ) );
		}

		return array( 'email' => $email, 'access' => $access, 'expires' => $expires );
	}

	private static function base64url_encode( $data ) {
		return rtrim( strtr( base64_encode( $data ), '+/', '-_' ), '=' );
	}

	private static function base64url_decode( $data ) {
		$padded = str_pad( $data, strlen( $data ) % 4 === 0 ? strlen( $data ) : strlen( $data ) + 4 - ( strlen( $data ) % 4 ), '=' );
		return base64_decode( strtr( $padded, '-_', '+/' ) );
	}
}
