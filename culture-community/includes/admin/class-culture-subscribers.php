<?php
/**
 * Newsletter subscriber management admin page.
 * Lists all subscribers with delete and CSV export actions.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Culture_Subscribers {

    public static function init() {
        add_action( 'admin_menu', array( __CLASS__, 'register_menu' ) );
        add_action( 'admin_post_culture_delete_subscriber',  array( __CLASS__, 'handle_delete' ) );
        add_action( 'admin_post_culture_export_subscribers', array( __CLASS__, 'handle_export' ) );
    }

    /**
     * Register submenu under Culture Community.
     */
    public static function register_menu() {
        add_submenu_page(
            'culture-community',
            __( 'Newsletter Subscribers', 'culture-community' ),
            __( 'Subscribers', 'culture-community' ),
            'manage_options',
            'culture-subscribers',
            array( __CLASS__, 'render_page' )
        );
    }

    /**
     * Render the subscribers admin page.
     */
    public static function render_page() {
        $subscribers = get_option( 'culture_newsletter_subscribers', array() );
        $count       = count( $subscribers );
        ?>
        <div class="wrap">
            <h1 class="wp-heading-inline"><?php esc_html_e( 'Newsletter Subscribers', 'culture-community' ); ?></h1>
            <hr class="wp-header-end">

            <?php if ( isset( $_GET['deleted'] ) && '1' === $_GET['deleted'] ) : ?>
                <div class="notice notice-success is-dismissible">
                    <p><?php esc_html_e( 'Subscriber removed successfully.', 'culture-community' ); ?></p>
                </div>
            <?php endif; ?>

            <div style="display:flex;align-items:flex-start;gap:20px;margin:16px 0 24px;flex-wrap:wrap;">

                <div style="background:#fff;border:1px solid #c3c4c7;border-radius:4px;padding:20px 28px;min-width:160px;text-align:center;">
                    <span style="display:block;font-size:36px;font-weight:700;line-height:1;color:#1d2327;">
                        <?php echo esc_html( number_format( $count ) ); ?>
                    </span>
                    <span style="display:block;margin-top:4px;font-size:12px;color:#646970;text-transform:uppercase;letter-spacing:.06em;">
                        <?php esc_html_e( 'Total Subscribers', 'culture-community' ); ?>
                    </span>
                </div>

                <?php if ( $count > 0 ) : ?>
                    <div style="display:flex;flex-direction:column;gap:8px;justify-content:center;">
                        <form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
                            <input type="hidden" name="action" value="culture_export_subscribers">
                            <?php wp_nonce_field( 'culture_export_subscribers' ); ?>
                            <button type="submit" class="button button-secondary">
                                ↓ <?php esc_html_e( 'Export as CSV', 'culture-community' ); ?>
                            </button>
                        </form>
                        <p style="margin:0;font-size:12px;color:#646970;">
                            <?php esc_html_e( 'Downloads all subscriber emails as a CSV file.', 'culture-community' ); ?>
                        </p>
                    </div>
                <?php endif; ?>

            </div>

            <?php if ( empty( $subscribers ) ) : ?>
                <p style="color:#646970;"><?php esc_html_e( 'No subscribers yet. Subscribe forms on the site will populate this list.', 'culture-community' ); ?></p>
            <?php else : ?>
                <table class="wp-list-table widefat fixed striped" style="max-width:680px;">
                    <thead>
                        <tr>
                            <th scope="col" style="width:60px;">#</th>
                            <th scope="col"><?php esc_html_e( 'Email Address', 'culture-community' ); ?></th>
                            <th scope="col" style="width:100px;"><?php esc_html_e( 'Action', 'culture-community' ); ?></th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ( $subscribers as $idx => $email ) : ?>
                            <tr>
                                <td style="color:#646970;"><?php echo esc_html( $idx + 1 ); ?></td>
                                <td><?php echo esc_html( $email ); ?></td>
                                <td>
                                    <form
                                        method="post"
                                        action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>"
                                        onsubmit="return confirm('<?php echo esc_js( sprintf( __( 'Remove %s from the subscriber list?', 'culture-community' ), $email ) ); ?>')"
                                    >
                                        <input type="hidden" name="action" value="culture_delete_subscriber">
                                        <input type="hidden" name="subscriber_email" value="<?php echo esc_attr( $email ); ?>">
                                        <?php wp_nonce_field( 'culture_delete_subscriber' ); ?>
                                        <button type="submit" class="button button-small">
                                            <?php esc_html_e( 'Remove', 'culture-community' ); ?>
                                        </button>
                                    </form>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                    <tfoot>
                        <tr>
                            <th colspan="2" style="font-weight:600;">
                                <?php printf( esc_html( _n( '%s subscriber', '%s subscribers', $count, 'culture-community' ) ), number_format( $count ) ); ?>
                            </th>
                            <th></th>
                        </tr>
                    </tfoot>
                </table>
            <?php endif; ?>
        </div>
        <?php
    }

    /**
     * Handle delete subscriber POST action.
     */
    public static function handle_delete() {
        check_admin_referer( 'culture_delete_subscriber' );

        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( esc_html__( 'Permission denied.', 'culture-community' ) );
        }

        $email = sanitize_email( $_POST['subscriber_email'] ?? '' );

        if ( $email ) {
            $subscribers = get_option( 'culture_newsletter_subscribers', array() );
            $updated     = array_values( array_filter( $subscribers, function ( $s ) use ( $email ) {
                return strtolower( trim( $s ) ) !== strtolower( $email );
            } ) );
            update_option( 'culture_newsletter_subscribers', $updated );
        }

        wp_safe_redirect( add_query_arg( array(
            'page'    => 'culture-subscribers',
            'deleted' => '1',
        ), admin_url( 'admin.php' ) ) );
        exit;
    }

    /**
     * Handle CSV export POST action.
     */
    public static function handle_export() {
        check_admin_referer( 'culture_export_subscribers' );

        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( esc_html__( 'Permission denied.', 'culture-community' ) );
        }

        $subscribers = get_option( 'culture_newsletter_subscribers', array() );
        $filename    = 'newsletter-subscribers-' . date( 'Y-m-d' ) . '.csv';

        header( 'Content-Type: text/csv; charset=utf-8' );
        header( 'Content-Disposition: attachment; filename="' . $filename . '"' );
        header( 'Pragma: no-cache' );
        header( 'Expires: 0' );

        $output = fopen( 'php://output', 'w' );
        fputcsv( $output, array( 'Email Address' ) );

        foreach ( $subscribers as $email ) {
            fputcsv( $output, array( $email ) );
        }

        fclose( $output );
        exit;
    }
}
