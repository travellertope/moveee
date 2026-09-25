<?php
/**
 * Email/OTP magic-code verification — originally built for The Moveee
 * Literary's metered soft-paywall, and reused as-is (same class, same
 * signed token, same cookie) to gate Moveee Magazine's member-only/
 * patron-only articles too (see apps/site/app/magazine/[slug]/page.tsx and
 * components/MagazinePieceGate.tsx) — verifying once unlocks both, since
 * the token only ever encodes an email + access level, nothing
 * section-specific. The one difference between the two callers is which
 * newsletter list a "free" verifier joins, controlled by verify_code()'s
 * $context param — see NEWSLETTER_LIST_BY_CONTEXT.
 *
 * Two things this backs on /literary specifically, reached from apps/site's
 * /literary/[slug] page:
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
 * Three-tier membership (September 2026, see CLAUDE.md): the token's access
 * value can now be 'free' | 'lit' | 'pro' — 'lit' unlocks Literary-only
 * gated content (Moveee Lit tier) but must NEVER unlock Magazine's separate
 * patron-only gating, which still checks strictly for 'pro'. This is why
 * 'lit' is only ever resolved when $context === 'literary' in verify_code()
 * below — a Lit-tier reader verifying through the Magazine gate still gets
 * plain 'free' access, exactly as before this tier existed.
 *
 * The one-time 6-digit code itself is never stored in the clear — only its
 * wp_hash() lives in a transient, same convention as
 * Culture_Account_Deletion's token handling.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Culture_Literary_Access {

	/**
	 * Which newsletter list a "free" (non-Pro) verified email joins, keyed
	 * by the calling surface's context — /magazine reuses this exact same
	 * class/token/cookie (see verify_code()'s $context param) rather than a
	 * second parallel implementation, since the underlying mechanism (HMAC
	 * token, OTP, rate limiting) has nothing Literary-specific about it,
	 * only the list a verifier joins differs.
	 */
	const NEWSLETTER_LIST_BY_CONTEXT = array(
		'literary' => 'literary-club',
		'magazine' => 'culture-drop',
	);

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
	 * @param string $context Which newsletter list a free verifier joins —
	 *                         see NEWSLETTER_LIST_BY_CONTEXT. Defaults to
	 *                         'literary' for the original caller.
	 * @return array|WP_Error { access: 'free'|'lit'|'pro', token: string }
	 */
	public static function verify_code( $email, $code, $context = 'literary' ) {
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

		$access  = 'free';
		$wp_user = get_user_by( 'email', $email );
		if ( $wp_user ) {
			$member_tier = get_user_meta( $wp_user->ID, '_culture_membership_tier', true );
			if ( 'patron' === $member_tier ) {
				$access = 'pro';
			} elseif ( 'lit' === $member_tier && 'literary' === $context ) {
				// Moveee Lit only ever grants full access via the Literary
				// context — verifying against a Magazine patron-only piece
				// still resolves to 'free' for a Lit-tier member.
				$access = 'lit';
			}
		}

		if ( 'free' === $access ) {
			$list = self::NEWSLETTER_LIST_BY_CONTEXT[ $context ] ?? self::NEWSLETTER_LIST_BY_CONTEXT['literary'];
			self::add_to_list( $email, $list );
		}

		$token = self::make_token( $email, $access );
		if ( ! $token ) {
			return new WP_Error( 'server_error', __( 'Verification is not configured.', 'culture-community' ), array( 'status' => 503 ) );
		}

		return array( 'access' => $access, 'token' => $token );
	}

	/**
	 * Add (or update) a subscriber record for the given newsletter list —
	 * the list-building side of this feature. Culture_Subscribers_DB::subscribe()
	 * (September 2026) is exactly the reusable find-or-create helper this
	 * docblock used to say didn't exist — now shared across every list-join
	 * caller (REST subscribe endpoint, imports, WP-CLI, this class) instead
	 * of each maintaining its own copy of the same logic.
	 *
	 * @param string $email
	 * @param string $list One of NEWSLETTER_LIST_BY_CONTEXT's values.
	 */
	private static function add_to_list( $email, $list ) {
		Culture_Subscribers_DB::subscribe( $email, array( $list ) );
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
		if ( empty( $secret ) || empty( $email ) || ! in_array( $access, array( 'free', 'lit', 'pro' ), true ) ) {
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

		if ( ! is_email( $email ) || ! in_array( $access, array( 'free', 'lit', 'pro' ), true ) ) {
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
