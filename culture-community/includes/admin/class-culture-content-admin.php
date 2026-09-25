<?php
/**
 * "Moveee Content" top-level admin menu (September 2026).
 *
 * Anchor for the general content CPTs that don't belong under any of the
 * other top-level menus (Newsletters/Events/Literary/Hubs/Stoop) — Directory,
 * Quotes, Community Posts, Journeys — plus Directory Tools, which manages the
 * Directory CPT's seeder/image tools. Same anchor-slug pattern as every other
 * top-level menu in this plugin (see the "WP Admin menu structure" note in
 * CLAUDE.md): the landing page slug doubles as its own first submenu.
 *
 * This class registers the menu shell only — the actual admin screens for
 * culture_directory/culture_quote/culture_post/culture_journey are WordPress's
 * own native CPT edit/list screens (via `register_post_type()`'s
 * `show_in_menu` pointing at this anchor slug); Directory Tools is a real
 * custom admin page registered by Culture_Directory_Tools, reparented here.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Culture_Content_Admin {

    const ANCHOR_SLUG = 'culture-content-manager';

    public static function init(): void {
        add_action( 'admin_menu', array( __CLASS__, 'register_menu' ) );
    }

    public static function register_menu(): void {
        add_menu_page(
            __( 'Moveee Content', 'culture-community' ),
            __( 'Moveee Content', 'culture-community' ),
            'manage_options',
            self::ANCHOR_SLUG,
            array( __CLASS__, 'render_landing' ),
            'dashicons-archive',
            36
        );

        // Anchor submenu — same slug as the top-level page, standard WP
        // "duplicate the anchor as the first submenu with its own label"
        // pattern already used by every other top-level menu in this plugin.
        add_submenu_page(
            self::ANCHOR_SLUG,
            __( 'Moveee Content', 'culture-community' ),
            __( 'Overview', 'culture-community' ),
            'manage_options',
            self::ANCHOR_SLUG,
            array( __CLASS__, 'render_landing' )
        );
    }

    public static function render_landing(): void {
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( 'Unauthorised', 403 );
        }
        ?>
        <div class="wrap">
            <h1><?php esc_html_e( 'Moveee Content', 'culture-community' ); ?></h1>
            <p><?php esc_html_e( 'Directory entries, Quotes, Community Posts, Journeys, and Directory Tools all live under this menu.', 'culture-community' ); ?></p>
            <ul style="list-style:disc;margin-left:20px;">
                <li><a href="<?php echo esc_url( admin_url( 'edit.php?post_type=culture_directory' ) ); ?>"><?php esc_html_e( 'Directory', 'culture-community' ); ?></a></li>
                <li><a href="<?php echo esc_url( admin_url( 'edit.php?post_type=culture_quote' ) ); ?>"><?php esc_html_e( 'Quotes', 'culture-community' ); ?></a></li>
                <li><a href="<?php echo esc_url( admin_url( 'edit.php?post_type=culture_post' ) ); ?>"><?php esc_html_e( 'Community Posts', 'culture-community' ); ?></a></li>
                <li><a href="<?php echo esc_url( admin_url( 'edit.php?post_type=culture_journey' ) ); ?>"><?php esc_html_e( 'Journeys', 'culture-community' ); ?></a></li>
                <li><a href="<?php echo esc_url( admin_url( 'admin.php?page=culture-directory-tools' ) ); ?>"><?php esc_html_e( 'Directory Tools', 'culture-community' ); ?></a></li>
            </ul>
        </div>
        <?php
    }
}
