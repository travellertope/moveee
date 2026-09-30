<?php
/**
 * "One-Off Campaigns" list page — compose and send an email that is not
 * tied to any culture_newsletter/getmelit/culture_drop post at all. Create/
 * edit itself now happens on the native culture_campaign post editor (same
 * Gutenberg block editor every other newsletter type uses, per explicit
 * September 2026 request) — this page is just an entry point into it and a
 * status/progress overview, mirroring how e.g. the native Posts list table
 * relates to post.php. See class-culture-campaign-send.php for the "Send
 * Campaign" meta box on that editor screen, and class-culture-campaigns.php
 * for the underlying send/tracking mechanics.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Culture_Campaigns_Admin {

    public static function init() {
        add_action( 'admin_menu', array( __CLASS__, 'register_menu' ) );
    }

    public static function register_menu() {
        add_submenu_page(
            'culture-subscribers',
            __( 'One-Off Campaigns', 'culture-community' ),
            __( 'Campaigns', 'culture-community' ),
            'manage_options',
            'culture-campaigns',
            array( __CLASS__, 'render_page' )
        );
    }

    public static function render_page() {
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( esc_html__( 'Permission denied.', 'culture-community' ) );
        }

        // Notices set by class-culture-campaign-send.php's admin-post
        // handlers, which redirect back to post.php?action=edit — surfaced
        // there via the WP editor's own notice area (the query args are
        // read directly on that screen too, see the code comment in
        // Culture_Campaign_Send::render_meta_box() callers), so nothing
        // extra is needed on this list page for those.
        ?>
        <div class="wrap">
            <h1 class="wp-heading-inline"><?php esc_html_e( 'One-Off Campaigns', 'culture-community' ); ?></h1>
            <a href="<?php echo esc_url( admin_url( 'post-new.php?post_type=culture_campaign' ) ); ?>" class="page-title-action">
                <?php esc_html_e( 'Add New', 'culture-community' ); ?>
            </a>
            <a href="<?php echo esc_url( admin_url( 'admin.php?page=culture-subscribers' ) ); ?>" class="page-title-action">
                <?php esc_html_e( 'Subscribers', 'culture-community' ); ?>
            </a>
            <a href="<?php echo esc_url( admin_url( 'admin.php?page=culture-newsletter-lists' ) ); ?>" class="page-title-action">
                <?php esc_html_e( 'Lists & Segments', 'culture-community' ); ?>
            </a>
            <hr class="wp-header-end">

            <p style="max-width:640px;color:#646970;">
                <?php esc_html_e( 'A campaign is a single send to one or more lists — it has no frontend archive page and is not a GetMeLit or Culture Drop issue. Use this for announcements, promotions, or a one-time message to a Hub without publishing an issue. Write the body in the block editor, then pick which list(s) to send to and send from the "Send Campaign" box on that screen.', 'culture-community' ); ?>
            </p>

            <table class="wp-list-table widefat fixed striped">
                <thead>
                    <tr>
                        <th scope="col"><?php esc_html_e( 'Subject', 'culture-community' ); ?></th>
                        <th scope="col" style="width:220px;"><?php esc_html_e( 'Lists', 'culture-community' ); ?></th>
                        <th scope="col" style="width:100px;"><?php esc_html_e( 'Status', 'culture-community' ); ?></th>
                        <th scope="col" style="width:150px;"><?php esc_html_e( 'Progress', 'culture-community' ); ?></th>
                        <th scope="col" style="width:140px;"><?php esc_html_e( 'Actions', 'culture-community' ); ?></th>
                    </tr>
                </thead>
                <tbody>
                    <?php $campaigns = Culture_Campaigns::all(); ?>
                    <?php if ( ! $campaigns ) : ?>
                        <tr><td colspan="5"><?php esc_html_e( 'No campaigns yet.', 'culture-community' ); ?></td></tr>
                    <?php endif; ?>
                    <?php foreach ( $campaigns as $c ) : ?>
                        <tr>
                            <td>
                                <strong>
                                    <a href="<?php echo esc_url( admin_url( 'post.php?post=' . $c['id'] . '&action=edit' ) ); ?>">
                                        <?php echo esc_html( $c['subject'] ?: __( '(no subject)', 'culture-community' ) ); ?>
                                    </a>
                                </strong>
                            </td>
                            <td>
                                <?php
                                $names = array();
                                foreach ( $c['listIds'] as $lid ) {
                                    $l = Culture_Newsletter_Lists::get( $lid );
                                    if ( $l ) {
                                        $names[] = $l['name'];
                                    }
                                }
                                echo esc_html( implode( ', ', $names ) ?: '—' );
                                ?>
                            </td>
                            <td><?php echo esc_html( ucfirst( $c['status'] ) ); ?></td>
                            <td>
                                <?php if ( Culture_Campaigns::STATUS_SENT === $c['status'] ) : ?>
                                    <?php echo esc_html( number_format( $c['sendTotal'] ) ); ?>
                                <?php elseif ( Culture_Campaigns::STATUS_SENDING === $c['status'] ) : ?>
                                    <?php echo esc_html( $c['sendOffset'] . ' / ' . $c['sendTotal'] . ' (' . $c['percent'] . '%)' ); ?>
                                <?php else : ?>
                                    —
                                <?php endif; ?>
                            </td>
                            <td>
                                <a href="<?php echo esc_url( admin_url( 'post.php?post=' . $c['id'] . '&action=edit' ) ); ?>" class="button button-small">
                                    <?php esc_html_e( 'Edit', 'culture-community' ); ?>
                                </a>
                                <?php if ( Culture_Campaigns::STATUS_DRAFT === $c['status'] ) : ?>
                                    <a href="<?php echo esc_url( get_delete_post_link( $c['id'] ) ); ?>" class="button button-small button-link-delete">
                                        <?php esc_html_e( 'Trash', 'culture-community' ); ?>
                                    </a>
                                <?php endif; ?>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
        <?php
    }
}
