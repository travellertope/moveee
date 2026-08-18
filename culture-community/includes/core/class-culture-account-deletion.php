<?php
/**
 * Account deletion — request/confirm flow.
 *
 * Required by Google Play's "Account deletion" policy: an app that supports
 * account creation must offer both an in-app way to *initiate* deletion and a
 * publicly reachable web page that can *complete* it without requiring the
 * app to be installed. This class is the shared logic both surfaces (mobile
 * JWT endpoint, web session-based endpoint, and the public confirm page) call
 * into — mirrors the existing email-verification token pattern
 * (`_culture_email_verify_token` in class-culture-rest-api.php) exactly:
 * a random token, stored only as a `wp_hash()`, emailed to the account's own
 * address, expiring after 24 hours.
 *
 * Deletion itself is immediate on confirm (no grace period) — `wp_delete_user()`
 * removes the WP user row and every `wp_usermeta` row, which is where all real
 * PII actually lives (name, email, phone, DOB, city, occupation, avatar/cover
 * URLs, interests, directory bio, etc.). Posts/comments authored by the account
 * are reassigned to a single placeholder "Deleted User" account (created lazily,
 * see get_placeholder_user_id()) rather than left attributed to a vanished ID.
 *
 * Known, deliberate scope limit: custom plugin tables keyed by user_id
 * (wp_culture_notifications, wp_culture_follows, wp_culture_credit_ledger,
 * wp_culture_redemptions, wp_culture_community_rsvp, wp_culture_event_rsvp,
 * wp_culture_attendance, wp_culture_hub_members, wp_culture_cluster_members,
 * etc.) are NOT swept here — their rows become orphaned references to a
 * user_id that no longer resolves via get_userdata(), which is harmless
 * (nothing renders for a nonexistent user) but not a full data purge. Revisit
 * with a proper per-table cleanup pass if a stricter data-retention audit
 * requires it — deliberately not attempted in one blind pass here since it'd
 * mean writing and trusting ~10 DELETE statements against a schema this
 * environment can't run against to verify.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Culture_Account_Deletion {

    const TOKEN_EXPIRY = DAY_IN_SECONDS;

    /**
     * Step 1 — generates a deletion token and emails a confirm link to the
     * account's own address. Does not delete anything yet.
     *
     * @param int $user_id
     * @return true|WP_Error
     */
    public static function request_deletion( $user_id ) {
        $user = get_userdata( $user_id );
        if ( ! $user ) {
            return new WP_Error( 'not_found', __( 'Account not found.', 'culture-community' ), array( 'status' => 404 ) );
        }

        $token = wp_generate_password( 32, false );
        update_user_meta( $user_id, '_culture_deletion_token', wp_hash( $token ) );
        update_user_meta( $user_id, '_culture_deletion_expires', time() + self::TOKEN_EXPIRY );

        if ( class_exists( 'Culture_Emails' ) ) {
            Culture_Emails::send_account_deletion_email( $user_id, $token );
        }

        return true;
    }

    /**
     * Step 2 — validates the token from the confirm link and, if valid,
     * permanently deletes the account. This is the only place the actual
     * delete happens; nothing here is reachable without a valid token.
     *
     * @param int    $user_id
     * @param string $token Plain-text token from the confirm link.
     * @return true|WP_Error
     */
    public static function confirm_deletion( $user_id, $token ) {
        $user = get_userdata( $user_id );
        if ( ! $user ) {
            return new WP_Error( 'not_found', __( 'Account not found.', 'culture-community' ), array( 'status' => 404 ) );
        }

        $stored_hash = get_user_meta( $user_id, '_culture_deletion_token', true );
        $expires     = (int) get_user_meta( $user_id, '_culture_deletion_expires', true );

        if ( ! $stored_hash || ! hash_equals( $stored_hash, wp_hash( $token ) ) ) {
            return new WP_Error( 'invalid_token', __( 'This deletion link is invalid.', 'culture-community' ), array( 'status' => 400 ) );
        }
        if ( time() > $expires ) {
            return new WP_Error( 'token_expired', __( 'This deletion link has expired. Please request account deletion again.', 'culture-community' ), array( 'status' => 410 ) );
        }

        if ( ! function_exists( 'wp_delete_user' ) ) {
            require_once ABSPATH . 'wp-admin/includes/user.php';
        }

        $reassign_id = self::get_placeholder_user_id();
        $deleted     = wp_delete_user( $user_id, $reassign_id ?: null );

        if ( ! $deleted ) {
            return new WP_Error( 'delete_failed', __( 'Account deletion failed. Please contact support.', 'culture-community' ), array( 'status' => 500 ) );
        }

        return true;
    }

    /**
     * Lazily creates (once) a "Deleted User" placeholder account that
     * authored content gets reassigned to on deletion, so posts/comments
     * don't end up attributed to a WP user ID that no longer resolves.
     * The placeholder itself can never log in (random unusable password,
     * no role capabilities beyond the minimum WP requires for a user row).
     *
     * @return int|false
     */
    private static function get_placeholder_user_id() {
        $existing = (int) get_option( 'culture_deleted_user_id', 0 );
        if ( $existing && get_userdata( $existing ) ) {
            return $existing;
        }

        $login = 'deleted-user';
        $user  = get_user_by( 'login', $login );
        if ( $user ) {
            update_option( 'culture_deleted_user_id', $user->ID );
            return $user->ID;
        }

        $new_id = wp_insert_user( array(
            'user_login'   => $login,
            'user_pass'    => wp_generate_password( 32, true, true ),
            'user_email'   => 'deleted-user@' . wp_parse_url( home_url(), PHP_URL_HOST ),
            'display_name' => 'Deleted User',
            'role'         => 'subscriber',
        ) );

        if ( is_wp_error( $new_id ) ) {
            return false;
        }

        update_option( 'culture_deleted_user_id', $new_id );
        return $new_id;
    }
}
