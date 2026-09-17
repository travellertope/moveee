<?php
/**
 * Byline Contributor role — lets a trusted-but-non-editorial account create
 * and publish `post` (Moveee Magazine article) entries and attribute a post
 * to a named guest writer (with an optional short bio/photo) without ever
 * creating a real WordPress user account for that writer and without seeing
 * any other author's posts.
 *
 * Two independent pieces:
 *  1. A custom role, `culture_byline_contributor` — Author-equivalent
 *     primitive capabilities (own-posts only, can publish directly), scoped
 *     down to the `post` post type only via map_meta_cap + an admin-menu
 *     trim. Every other `capability_type => 'post'` CPT in this plugin
 *     (culture_event, culture_directory, culture_newsletter, culture_quote,
 *     culture_post, culture_journey, culture_cluster, culture_hub) reuses
 *     the exact same 'edit_posts'/'publish_posts'/etc. capability strings as
 *     core Posts — WordPress has no native way to grant Author-level access
 *     to one post type without granting it to all of them that share
 *     capability_type => 'post', so this class scopes it down itself.
 *  2. A "Guest Byline" ACF field group (registered in
 *     class-culture-acf-fields.php — guest_byline_name / guest_byline_bio /
 *     guest_byline_avatar, `post` type only, restricted via ACF's
 *     "Current User Role" location rule to this role + administrators) — a
 *     pure *display* override. post_author never changes, so ownership,
 *     capability checks, and revision history all still apply to the real
 *     logged-in account; only the rendered byline changes. Exposed to the
 *     frontend via a `guestByline` GraphQL field on Post
 *     (moveee-graphql-bridge.php), same isolation pattern as `moveeeMeta`.
 *
 * Because this is display-only, the account's own WP identity (first name/
 * last name/nickname/display name) should never need to change just
 * because a different guest byline was set on some post — but a shared
 * Byline Contributor account naturally invites exactly that mistake (edit
 * "my" profile name to match this week's guest instead of using the
 * per-post field), which then corrupts the account's identity for every
 * other post published under it. lock_profile_name_fields() +
 * annotate_profile_name_fields() below close that off at the source by
 * disabling those fields on the account's own profile.php.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Culture_Guest_Byline {

    const ROLE              = 'culture_byline_contributor';
    const ROLE_LABEL        = 'Byline Contributor';
    const ROLE_VERSION_OPT  = 'culture_byline_role_version';
    const ROLE_VERSION      = '1';
    const OTHER_POST_TYPES  = array(
        'culture_event',
        'culture_directory',
        'culture_newsletter',
        'culture_quote',
        'culture_post',
        'culture_journey',
        'culture_cluster',
        'culture_hub',
    );

    public static function init() {
        add_action( 'init', array( __CLASS__, 'maybe_register_role' ), 6 );
        add_filter( 'map_meta_cap', array( __CLASS__, 'restrict_to_post_type' ), 10, 4 );
        add_action( 'admin_menu', array( __CLASS__, 'trim_admin_menu' ), 999 );
        add_action( 'personal_options_update', array( __CLASS__, 'lock_profile_name_fields' ), 1 );
        add_action( 'admin_head-profile.php', array( __CLASS__, 'annotate_profile_name_fields' ) );
    }

    /**
     * Whether the currently logged-in user holds this role without also
     * being an administrator — the "self-service byline account, not a
     * real staff account" case both lock_profile_name_fields() and
     * annotate_profile_name_fields() gate on.
     */
    private static function current_user_is_contributor_only(): bool {
        $user = wp_get_current_user();
        if ( ! $user || ! in_array( self::ROLE, (array) $user->roles, true ) ) {
            return false;
        }
        return ! $user->has_cap( 'manage_options' );
    }

    /**
     * Guest Byline (see the class docblock) is a purely per-post display
     * override — post_author, and the account's own first/last/nickname/
     * display name, are never supposed to change. In practice, a Byline
     * Contributor account is often shared/managed on behalf of whichever
     * guest writer is being published that week, and without this guard
     * the natural (but wrong) move is to edit *the account's own*
     * profile.php "Name" fields to match instead of using the per-post
     * field — which then corrupts that shared account's identity for
     * every other post ever published under it, and is exactly what the
     * WP Admin Users list "Name" column then displays for the account.
     * Hooked on `personal_options_update` (fires only when editing one's
     * OWN profile, before wp_update_user() runs) at priority 1, so these
     * keys are gone from $_POST before core's own save handler reads
     * them — deliberately NOT hooked on `edit_user_profile_update` (an
     * admin editing someone else's profile), so an admin can still fix an
     * already-corrupted account's name from user-edit.php.
     */
    public static function lock_profile_name_fields() {
        if ( ! self::current_user_is_contributor_only() ) {
            return;
        }
        foreach ( array( 'first_name', 'last_name', 'nickname', 'display_name' ) as $key ) {
            unset( $_POST[ $key ] );
        }
    }

    /**
     * Visually locks the same fields on the account's own profile.php (so
     * the silent no-op above doesn't look like a bug) and explains why,
     * pointing back at the real, correct mechanism.
     */
    public static function annotate_profile_name_fields() {
        if ( ! self::current_user_is_contributor_only() ) {
            return;
        }
        ?>
        <style>
            #first_name, #last_name, #nickname { background: #f0f0f1; }
            #display_name { background: #f0f0f1; }
        </style>
        <script>
        document.addEventListener('DOMContentLoaded', function () {
            ['first_name', 'last_name', 'nickname'].forEach(function (id) {
                var el = document.getElementById(id);
                if (el) el.setAttribute('readonly', 'readonly');
            });
            var dn = document.getElementById('display_name');
            if (dn) dn.setAttribute('disabled', 'disabled');

            var anchor = document.getElementById('first_name');
            var row = anchor ? anchor.closest('tr') : null;
            var cell = row ? row.querySelector('td') : null;
            if (cell) {
                var note = document.createElement('p');
                note.className = 'description';
                note.style.color = '#a00';
                note.style.maxWidth = '480px';
                note.textContent = "This account's name is fixed and isn't shown publicly. To attribute an article to a specific guest writer, use the \"Guest Byline\" field on that post instead.";
                cell.appendChild(note);
            }
        });
        </script>
        <?php
    }

    /**
     * Registers the role once, and re-registers it (remove + add) whenever
     * ROLE_VERSION changes, so a future cap-set tweak reaches existing
     * installs on their next request instead of only new ones.
     */
    public static function maybe_register_role() {
        if ( get_option( self::ROLE_VERSION_OPT, '' ) === self::ROLE_VERSION && get_role( self::ROLE ) ) {
            return;
        }

        remove_role( self::ROLE );

        add_role( self::ROLE, self::ROLE_LABEL, array(
            'read'                   => true,
            'edit_posts'             => true,
            'edit_published_posts'   => true,
            'publish_posts'          => true,
            'delete_posts'           => true,
            'delete_published_posts' => true,
            'upload_files'           => true,
            // Deliberately absent: edit_others_posts, edit_private_posts,
            // delete_others_posts, list_users, create_users, edit_users,
            // promote_users, manage_options — this role never sees another
            // author's posts (WP's own post-list query restricts to
            // own-author-only whenever edit_others_posts is missing) and
            // can never touch a user account.
        ) );

        update_option( self::ROLE_VERSION_OPT, self::ROLE_VERSION );
    }

    /**
     * Denies the item-level edit/delete/publish/read-private meta caps on
     * any post whose post_type isn't `post`, for a Byline Contributor with
     * no broader admin capability. See the class docblock for why this is
     * needed: every other capability_type=>'post' CPT here shares the exact
     * same primitive capability strings as core Posts, so without this
     * filter the role above would also be able to create/edit/publish
     * Events, Directory entries, Newsletters, Quotes, community posts,
     * Journeys, Hubs, and Stoop clusters — never intended.
     */
    public static function restrict_to_post_type( $caps, $cap, $user_id, $args ) {
        $scoped_caps = array( 'edit_post', 'delete_post', 'publish_post', 'read_private_post' );
        if ( ! in_array( $cap, $scoped_caps, true ) || empty( $args[0] ) ) {
            return $caps;
        }

        $user = get_userdata( $user_id );
        if ( ! $user || ! in_array( self::ROLE, (array) $user->roles, true ) ) {
            return $caps;
        }
        if ( $user->has_cap( 'manage_options' ) ) {
            return $caps; // An admin who also happens to hold this role is unaffected.
        }

        $post = get_post( $args[0] );
        if ( $post && 'post' !== $post->post_type ) {
            return array( 'do_not_allow' );
        }

        return $caps;
    }

    /**
     * Hides every other CPT's admin menu entry for this role — a UX trim;
     * the real enforcement is restrict_to_post_type() above, so a Byline
     * Contributor who guesses a direct edit.php?post_type=... URL still
     * can't create, publish, or edit anything there.
     */
    public static function trim_admin_menu() {
        $user = wp_get_current_user();
        if ( ! $user || ! in_array( self::ROLE, (array) $user->roles, true ) ) {
            return;
        }
        if ( current_user_can( 'manage_options' ) ) {
            return;
        }

        foreach ( self::OTHER_POST_TYPES as $post_type ) {
            // Every one of these CPTs is registered with
            // show_in_menu => 'culture-community' (a nested submenu), not a
            // top-level page — remove_menu_page() wouldn't find them.
            remove_submenu_page( 'culture-community', 'edit.php?post_type=' . $post_type );
        }
    }
}
