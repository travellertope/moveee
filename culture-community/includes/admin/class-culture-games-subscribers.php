<?php
/**
 * Moveee Games subscriber management admin page.
 * Stores subscribers in culture_games_subscribers wp_option.
 * Allows viewing, exporting, and removing game subscribers.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Culture_Games_Subscribers {

    public static function init() {
        add_action( 'admin_menu', array( __CLASS__, 'register_menu' ) );
        add_action( 'admin_post_culture_games_delete_subscriber', array( __CLASS__, 'handle_delete' ) );
        add_action( 'admin_post_culture_games_export_subscribers', array( __CLASS__, 'handle_export' ) );
    }

    public static function register_menu() {
        add_submenu_page(
            'culture-community',
            __( 'Games Subscribers', 'culture-community' ),
            __( 'Games Subscribers', 'culture-community' ),
            'manage_options',
            'culture-games-subscribers',
            array( __CLASS__, 'render_page' )
        );
    }

    public static function render_page() {
        $subscribers = get_option( 'culture_games_subscribers', array() );
        $count       = count( $subscribers );

        $notice = '';
        if ( isset( $_GET['deleted'] ) && '1' === $_GET['deleted'] ) {
            $notice = __( 'Subscriber removed.', 'culture-community' );
        }
        ?>
        <div class="wrap">
            <h1 class="wp-heading-inline"><?php esc_html_e( 'Moveee Games Subscribers', 'culture-community' ); ?></h1>
            <hr class="wp-header-end">

            <?php if ( $notice ) : ?>
                <div class="notice notice-success is-dismissible"><p><?php echo esc_html( $notice ); ?></p></div>
            <?php endif; ?>

            <div style="display:flex;align-items:flex-start;gap:20px;margin:16px 0 28px;flex-wrap:wrap;">
                <div style="background:#fff;border:1px solid #c3c4c7;border-radius:4px;padding:20px 28px;min-width:160px;text-align:center;">
                    <span style="display:block;font-size:36px;font-weight:700;line-height:1;color:#1d2327;">
                        <?php echo esc_html( number_format( $count ) ); ?>
                    </span>
                    <span style="display:block;margin-top:4px;font-size:12px;color:#646970;text-transform:uppercase;letter-spacing:.06em;">
                        <?php esc_html_e( 'Games Subscribers', 'culture-community' ); ?>
                    </span>
                </div>

                <?php if ( $count > 0 ) : ?>
                <div style="display:flex;flex-direction:column;gap:8px;justify-content:center;">
                    <form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
                        <input type="hidden" name="action" value="culture_games_export_subscribers">
                        <?php wp_nonce_field( 'culture_games_export_subscribers' ); ?>
                        <button type="submit" class="button button-secondary">
                            ↓ <?php esc_html_e( 'Export as CSV', 'culture-community' ); ?>
                        </button>
                    </form>
                    <p style="margin:0;font-size:12px;color:#646970;">
                        <?php esc_html_e( 'Downloads games subscriber list as CSV.', 'culture-community' ); ?>
                    </p>
                </div>
                <?php endif; ?>
            </div>

            <h2 style="font-size:14px;font-weight:600;margin:0 0 12px;"><?php esc_html_e( 'Subscriber List', 'culture-community' ); ?></h2>
            <?php if ( empty( $subscribers ) ) : ?>
                <p style="color:#646970;"><?php esc_html_e( 'No games subscribers yet.', 'culture-community' ); ?></p>
            <?php else : ?>
                <table class="wp-list-table widefat fixed striped">
                    <thead>
                        <tr>
                            <th scope="col" style="width:40px;">#</th>
                            <th scope="col"><?php esc_html_e( 'Email Address', 'culture-community' ); ?></th>
                            <th scope="col" style="width:160px;"><?php esc_html_e( 'Subscribed', 'culture-community' ); ?></th>
                            <th scope="col" style="width:100px;"><?php esc_html_e( 'Action', 'culture-community' ); ?></th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ( array_reverse( $subscribers ) as $idx => $sub ) :
                            $email = is_array( $sub ) ? ( $sub['email'] ?? '' ) : $sub;
                            $date  = is_array( $sub ) && ! empty( $sub['date'] )
                                ? date_i18n( get_option( 'date_format' ), strtotime( $sub['date'] ) )
                                : '';
                        ?>
                            <tr>
                                <td style="color:#646970;"><?php echo esc_html( $count - $idx ); ?></td>
                                <td><strong><?php echo esc_html( $email ); ?></strong></td>
                                <td style="font-size:12px;color:#646970;"><?php echo esc_html( $date ); ?></td>
                                <td>
                                    <form
                                        method="post"
                                        action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>"
                                        onsubmit="return confirm('<?php echo esc_js( sprintf( __( 'Remove %s?', 'culture-community' ), $email ) ); ?>')"
                                    >
                                        <input type="hidden" name="action" value="culture_games_delete_subscriber">
                                        <input type="hidden" name="subscriber_email" value="<?php echo esc_attr( $email ); ?>">
                                        <?php wp_nonce_field( 'culture_games_delete_subscriber' ); ?>
                                        <button type="submit" class="button button-small">
                                            <?php esc_html_e( 'Remove', 'culture-community' ); ?>
                                        </button>
                                    </form>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php endif; ?>
        </div>
        <?php
    }

    public static function handle_delete() {
        check_admin_referer( 'culture_games_delete_subscriber' );

        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( esc_html__( 'Permission denied.', 'culture-community' ) );
        }

        $email = sanitize_email( $_POST['subscriber_email'] ?? '' );

        if ( $email ) {
            $subscribers = get_option( 'culture_games_subscribers', array() );
            $updated     = array_values( array_filter( $subscribers, function ( $s ) use ( $email ) {
                $sub_email = is_array( $s ) ? ( $s['email'] ?? '' ) : $s;
                return strtolower( trim( $sub_email ) ) !== strtolower( $email );
            } ) );
            update_option( 'culture_games_subscribers', $updated );
        }

        wp_safe_redirect( add_query_arg( array(
            'page'    => 'culture-games-subscribers',
            'deleted' => '1',
        ), admin_url( 'admin.php' ) ) );
        exit;
    }

    public static function handle_export() {
        check_admin_referer( 'culture_games_export_subscribers' );

        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( esc_html__( 'Permission denied.', 'culture-community' ) );
        }

        $subscribers = get_option( 'culture_games_subscribers', array() );
        $filename    = 'games-subscribers-' . date( 'Y-m-d' ) . '.csv';

        header( 'Content-Type: text/csv; charset=utf-8' );
        header( 'Content-Disposition: attachment; filename="' . $filename . '"' );
        header( 'Pragma: no-cache' );
        header( 'Expires: 0' );

        $output = fopen( 'php://output', 'w' );
        fputcsv( $output, array( 'Email Address', 'Date Subscribed' ) );

        foreach ( $subscribers as $sub ) {
            $email = is_array( $sub ) ? ( $sub['email'] ?? '' ) : $sub;
            $date  = is_array( $sub ) ? ( $sub['date'] ?? '' ) : '';
            fputcsv( $output, array( $email, $date ) );
        }

        fclose( $output );
        exit;
    }
}
