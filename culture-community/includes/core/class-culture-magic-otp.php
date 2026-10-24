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
	public static function find_or_create_user( $email, $referral = '' ) {
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

	// ── Guest RSVP magic-link ─────────────────────────────────────────────────

	const RSVP_MAGIC_TTL   = 86400; // 24 hours
	const SIGNIN_MAGIC_TTL = 86400; // 24 hours

	private static function rsvp_magic_option_name( string $token_hash ): string {
		return '_culture_rsvp_magic_' . $token_hash;
	}

	private static function signin_magic_option_name( string $token_hash ): string {
		return '_culture_signin_magic_' . $token_hash;
	}

	/**
	 * Generate a magic sign-in link for a given email (post-payment or other
	 * headless sign-in surfaces). Stores a single-use token in wp_options;
	 * the caller decides where to redirect the user after sign-in.
	 *
	 * @param string $email
	 * @param string $redirect_path Relative path to redirect to after sign-in (e.g. '/community/my-event').
	 * @return string The magic sign-in URL.
	 */
	public static function generate_signin_magic_link( string $email, string $redirect_path = '/feed' ): string {
		global $wpdb;

		$token      = bin2hex( random_bytes( 32 ) );
		$token_hash = md5( $token );
		$opt_name   = self::signin_magic_option_name( $token_hash );
		$payload    = wp_json_encode( [
			'email'         => sanitize_email( $email ),
			'redirect_path' => $redirect_path,
			'expires'       => time() + self::SIGNIN_MAGIC_TTL,
		] );
		$wpdb->query( $wpdb->prepare(
			"INSERT INTO {$wpdb->options} (option_name,option_value,autoload) VALUES(%s,%s,'no') ON DUPLICATE KEY UPDATE option_value=%s",
			$opt_name, $payload, $payload
		) );

		$connect_url = untrailingslashit( get_option( 'culture_connect_url', 'https://web.themoveee.com' ) );
		return $connect_url . '/magic-signin?token=' . rawurlencode( $token ) . '&redirect=' . rawurlencode( $redirect_path );
	}

	/**
	 * Register REST routes for guest RSVP magic link.
	 * Call Culture_Magic_OTP::init() from culture_community_init().
	 */
	public static function init(): void {
		add_action( 'rest_api_init', [ __CLASS__, 'register_routes' ] );
	}

	public static function register_routes(): void {
		// Public — rate-limited; sends the magic-link email to the guest.
		register_rest_route( 'culture/v1', '/community/event/rsvp-guest-magic', [
			'methods'             => 'POST',
			'callback'            => [ __CLASS__, 'handle_send_guest_rsvp_magic' ],
			'permission_callback' => '__return_true',
			'args'                => [
				'email'   => [ 'required' => true, 'type' => 'string', 'sanitize_callback' => 'sanitize_email' ],
				'post_id' => [ 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ],
			],
		] );

		// API-key-authenticated — called by NextAuth authorize() to verify the RSVP token.
		register_rest_route( 'culture/v1', '/magic-link/verify-rsvp', [
			'methods'             => 'POST',
			'callback'            => [ __CLASS__, 'handle_verify_rsvp_magic' ],
			'permission_callback' => [ 'Culture_REST_API', 'api_key_permission' ],
			'args'                => [
				'token' => [ 'required' => true, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field' ],
			],
		] );

		// API-key-authenticated — called by NextAuth authorize() to verify a post-payment sign-in token.
		register_rest_route( 'culture/v1', '/magic-link/verify-signin', [
			'methods'             => 'POST',
			'callback'            => [ __CLASS__, 'handle_verify_signin_magic' ],
			'permission_callback' => [ 'Culture_REST_API', 'api_key_permission' ],
			'args'                => [
				'token' => [ 'required' => true, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field' ],
			],
		] );
	}

	/**
	 * REST handler — send the guest RSVP magic link.
	 */
	public static function handle_send_guest_rsvp_magic( WP_REST_Request $req ): WP_REST_Response {
		$email   = sanitize_email( $req->get_param( 'email' ) );
		$post_id = (int) $req->get_param( 'post_id' );

		if ( ! is_email( $email ) ) {
			return new WP_REST_Response( [ 'error' => 'invalid_email', 'message' => 'Enter a valid email address.' ], 400 );
		}

		// Validate this is a free, RSVP-enabled community event with capacity remaining.
		$post = get_post( $post_id );
		if ( ! $post || 'culture_post' !== $post->post_type || 'event' !== get_post_meta( $post_id, '_template_type', true ) ) {
			return new WP_REST_Response( [ 'error' => 'invalid_event', 'message' => 'Event not found.' ], 404 );
		}
		if ( ! class_exists( 'Culture_Community_RSVP' ) || ! Culture_Community_RSVP::is_rsvp_enabled( $post_id ) ) {
			return new WP_REST_Response( [ 'error' => 'rsvp_disabled', 'message' => 'RSVP is not enabled for this event.' ], 400 );
		}
		if ( Culture_Community_RSVP::is_paid( $post_id ) ) {
			return new WP_REST_Response( [ 'error' => 'rsvp_paid', 'message' => 'Paid events require a Moveee account.' ], 400 );
		}
		$capacity = Culture_Community_RSVP::get_capacity( $post_id );
		if ( $capacity > 0 && Culture_Community_RSVP::get_count( $post_id ) >= $capacity ) {
			return new WP_REST_Response( [ 'error' => 'event_full', 'message' => 'This event is fully booked.' ], 409 );
		}

		// Rate-limit by email hash (3 requests per 10 min).
		global $wpdb;
		$key    = 'rsvp_magic_rl_' . md5( strtolower( $email ) . '_' . $post_id );
		$rl_opt = '_culture_otp_rl_' . $key;
		$rl_row = $wpdb->get_var( $wpdb->prepare( "SELECT option_value FROM {$wpdb->options} WHERE option_name = %s", $rl_opt ) );
		$rl     = $rl_row ? json_decode( $rl_row, true ) : null;
		if ( $rl && time() < (int) $rl['window_expires'] && (int) $rl['count'] >= 3 ) {
			return new WP_REST_Response( [ 'error' => 'too_many_requests', 'message' => 'Too many requests — try again in a few minutes.' ], 429 );
		}
		$rl = $rl && time() < (int) $rl['window_expires']
			? [ 'count' => (int) $rl['count'] + 1, 'window_expires' => $rl['window_expires'] ]
			: [ 'count' => 1, 'window_expires' => time() + self::CODE_TTL ];
		$rl_json = wp_json_encode( $rl );
		$wpdb->query( $wpdb->prepare(
			"INSERT INTO {$wpdb->options} (option_name,option_value,autoload) VALUES(%s,%s,'no') ON DUPLICATE KEY UPDATE option_value=%s",
			$rl_opt, $rl_json, $rl_json
		) );

		// Generate token, store with event context.
		$token      = bin2hex( random_bytes( 32 ) );
		$token_hash = md5( $token );
		$opt_name   = self::rsvp_magic_option_name( $token_hash );
		$payload    = wp_json_encode( [
			'email'    => $email,
			'post_id'  => $post_id,
			'slug'     => $post->post_name,
			'title'    => $post->post_title,
			'expires'  => time() + self::RSVP_MAGIC_TTL,
		] );
		$wpdb->query( $wpdb->prepare(
			"INSERT INTO {$wpdb->options} (option_name,option_value,autoload) VALUES(%s,%s,'no') ON DUPLICATE KEY UPDATE option_value=%s",
			$opt_name, $payload, $payload
		) );

		// Build the magic link URL.
		$connect_url = untrailingslashit( get_option( 'culture_connect_url', 'https://web.themoveee.com' ) );
		$magic_url   = $connect_url . '/magic-rsvp?token=' . rawurlencode( $token ) . '&post=' . rawurlencode( $post->post_name );

		if ( class_exists( 'Culture_Emails' ) ) {
			Culture_Emails::send_guest_rsvp_email( $email, $magic_url, $post->post_title );
		}

		return new WP_REST_Response( [ 'sent' => true ], 200 );
	}

	/**
	 * REST handler — verify token, find/create account, perform free RSVP,
	 * return user profile for NextAuth.
	 */
	public static function handle_verify_rsvp_magic( WP_REST_Request $req ): WP_REST_Response {
		global $wpdb;

		$token      = sanitize_text_field( $req->get_param( 'token' ) );
		$token_hash = md5( $token );
		$opt_name   = self::rsvp_magic_option_name( $token_hash );

		$row = $wpdb->get_var( $wpdb->prepare(
			"SELECT option_value FROM {$wpdb->options} WHERE option_name = %s",
			$opt_name
		) );

		if ( null === $row ) {
			return new WP_REST_Response( [ 'error' => 'token_expired', 'message' => 'This link has expired or already been used.' ], 400 );
		}

		$data = json_decode( $row, true );
		if ( ! $data || time() > (int) $data['expires'] ) {
			$wpdb->delete( $wpdb->options, [ 'option_name' => $opt_name ] );
			return new WP_REST_Response( [ 'error' => 'token_expired', 'message' => 'This link has expired.' ], 400 );
		}

		// Single-use — delete immediately.
		$wpdb->delete( $wpdb->options, [ 'option_name' => $opt_name ] );

		$email   = sanitize_email( $data['email'] );
		$post_id = (int) $data['post_id'];

		// Find or create the user.
		$user = self::find_or_create_user( $email );
		if ( is_wp_error( $user ) ) {
			return new WP_REST_Response( [ 'error' => 'user_error', 'message' => $user->get_error_message() ], 500 );
		}

		// Perform the free RSVP (idempotent — already-RSVPed returns gracefully).
		if ( $post_id && class_exists( 'Culture_Community_RSVP' ) ) {
			Culture_Community_RSVP::rsvp( $post_id, $user->ID );
		}

		// Return the same profile shape as the OTP verify path.
		return new WP_REST_Response( [
			'id'                     => $user->ID,
			'display_name'           => $user->display_name,
			'email'                  => $user->user_email,
			'username'               => $user->user_login,
			'phone'                  => get_user_meta( $user->ID, '_culture_phone', true ) ?: '',
			'whatsapp'               => get_user_meta( $user->ID, '_culture_whatsapp', true ) ?: '',
			'gender'                 => get_user_meta( $user->ID, '_culture_gender', true ) ?: '',
			'date_of_birth'          => get_user_meta( $user->ID, '_culture_date_of_birth', true ) ?: '',
			'nationality'            => get_user_meta( $user->ID, '_culture_nationality', true ) ?: '',
			'country_of_residence'   => get_user_meta( $user->ID, '_culture_country', true ) ?: '',
			'city'                   => get_user_meta( $user->ID, '_culture_city', true ) ?: '',
			'occupation'             => get_user_meta( $user->ID, '_culture_occupation', true ) ?: '',
			'registered_at'          => strtotime( $user->user_registered ),
			'tier'                   => get_user_meta( $user->ID, '_culture_membership_tier', true ) ?: 'citizen',
			'interests'              => (array) get_user_meta( $user->ID, '_culture_interests', true ),
			'credits'                => (int) get_user_meta( $user->ID, '_culture_credits', true ),
			'reputation'             => (int) get_user_meta( $user->ID, '_culture_points', true ),
			'reputation_tier'        => get_user_meta( $user->ID, '_culture_reputation_tier', true ) ?: 'member',
			'daily_credits_remaining'=> 50,
			'points'                 => (int) get_user_meta( $user->ID, '_culture_points', true ),
			'badges'                 => (array) get_user_meta( $user->ID, '_culture_badges', true ),
			'referral_code'          => get_user_meta( $user->ID, '_culture_referral_code', true ) ?: '',
			'referral_count'         => (int) get_user_meta( $user->ID, '_culture_referral_count', true ),
			'visual_downloads_today' => 0,
			'is_vendor'              => false,
			'vendor_slug'            => '',
			'avatar_url'             => get_user_meta( $user->ID, '_culture_avatar_url', true ) ?: '',
			'has_passkey'            => false,
			'passkey_count'          => 0,
			'credits_escrowed'       => 0,
			'rsvp_post_slug'         => $data['slug'] ?? '',
		], 200 );
	}

	/**
	 * REST handler — verify a post-payment sign-in token, find/create account,
	 * and return a user profile for NextAuth. No RSVP action — the RSVP row
	 * was already confirmed by confirm_guest_rsvp_payment() at webhook time.
	 */
	public static function handle_verify_signin_magic( WP_REST_Request $req ): WP_REST_Response {
		global $wpdb;

		$token      = sanitize_text_field( $req->get_param( 'token' ) );
		$token_hash = md5( $token );
		$opt_name   = self::signin_magic_option_name( $token_hash );

		$row = $wpdb->get_var( $wpdb->prepare(
			"SELECT option_value FROM {$wpdb->options} WHERE option_name = %s",
			$opt_name
		) );

		if ( null === $row ) {
			return new WP_REST_Response( [ 'error' => 'token_expired', 'message' => 'This link has expired or already been used.' ], 400 );
		}

		$data = json_decode( $row, true );
		if ( ! $data || time() > (int) $data['expires'] ) {
			$wpdb->delete( $wpdb->options, [ 'option_name' => $opt_name ] );
			return new WP_REST_Response( [ 'error' => 'token_expired', 'message' => 'This link has expired.' ], 400 );
		}

		// Single-use — delete immediately.
		$wpdb->delete( $wpdb->options, [ 'option_name' => $opt_name ] );

		$email = sanitize_email( $data['email'] );
		$user  = self::find_or_create_user( $email );
		if ( is_wp_error( $user ) ) {
			return new WP_REST_Response( [ 'error' => 'user_error', 'message' => $user->get_error_message() ], 500 );
		}

		return new WP_REST_Response( [
			'id'                     => $user->ID,
			'display_name'           => $user->display_name,
			'email'                  => $user->user_email,
			'username'               => $user->user_login,
			'phone'                  => get_user_meta( $user->ID, '_culture_phone', true ) ?: '',
			'whatsapp'               => get_user_meta( $user->ID, '_culture_whatsapp', true ) ?: '',
			'gender'                 => get_user_meta( $user->ID, '_culture_gender', true ) ?: '',
			'date_of_birth'          => get_user_meta( $user->ID, '_culture_date_of_birth', true ) ?: '',
			'nationality'            => get_user_meta( $user->ID, '_culture_nationality', true ) ?: '',
			'country_of_residence'   => get_user_meta( $user->ID, '_culture_country', true ) ?: '',
			'city'                   => get_user_meta( $user->ID, '_culture_city', true ) ?: '',
			'occupation'             => get_user_meta( $user->ID, '_culture_occupation', true ) ?: '',
			'registered_at'          => strtotime( $user->user_registered ),
			'tier'                   => get_user_meta( $user->ID, '_culture_membership_tier', true ) ?: 'citizen',
			'interests'              => (array) get_user_meta( $user->ID, '_culture_interests', true ),
			'credits'                => (int) get_user_meta( $user->ID, '_culture_credits', true ),
			'reputation'             => (int) get_user_meta( $user->ID, '_culture_points', true ),
			'reputation_tier'        => get_user_meta( $user->ID, '_culture_reputation_tier', true ) ?: 'member',
			'daily_credits_remaining'=> 50,
			'points'                 => (int) get_user_meta( $user->ID, '_culture_points', true ),
			'badges'                 => (array) get_user_meta( $user->ID, '_culture_badges', true ),
			'referral_code'          => get_user_meta( $user->ID, '_culture_referral_code', true ) ?: '',
			'referral_count'         => (int) get_user_meta( $user->ID, '_culture_referral_count', true ),
			'visual_downloads_today' => 0,
			'is_vendor'              => false,
			'vendor_slug'            => '',
			'avatar_url'             => get_user_meta( $user->ID, '_culture_avatar_url', true ) ?: '',
			'has_passkey'            => false,
			'passkey_count'          => 0,
			'credits_escrowed'       => 0,
			'redirect_path'          => $data['redirect_path'] ?? '/feed',
		], 200 );
	}
}
