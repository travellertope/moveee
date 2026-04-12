<?php
/**
 * Newsletter subscriber management admin page.
 * Lists all subscribers with delete, CSV export, MailPoet import,
 * WP user import, and auto-subscribe on registration.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Culture_Subscribers {

    public static function init() {
        add_action( 'admin_menu', array( __CLASS__, 'register_menu' ) );
        add_action( 'admin_post_culture_delete_subscriber',    array( __CLASS__, 'handle_delete' ) );
        add_action( 'admin_post_culture_export_subscribers',   array( __CLASS__, 'handle_export' ) );
        add_action( 'admin_post_culture_import_mailpoet',      array( __CLASS__, 'handle_import_mailpoet' ) );
        add_action( 'admin_post_culture_import_wp_users',      array( __CLASS__, 'handle_import_wp_users' ) );
        add_action( 'admin_post_culture_nl_auto_subscribe',    array( __CLASS__, 'handle_auto_subscribe_toggle' ) );

        // Auto-subscribe new registrations if the option is enabled.
        if ( get_option( 'culture_nl_auto_subscribe', '0' ) === '1' ) {
            add_action( 'user_register', array( __CLASS__, 'auto_subscribe_new_user' ), 20 );
        }
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
        global $wpdb;

        $subscribers    = get_option( 'culture_newsletter_subscribers', array() );
        $count          = count( $subscribers );
        $auto_subscribe = get_option( 'culture_nl_auto_subscribe', '0' ) === '1';
        $mailpoet_active = self::is_mailpoet_active();

        // Feedback notices from redirects.
        $notice = '';
        if ( isset( $_GET['imported'] ) ) {
            $n      = absint( $_GET['imported'] );
            $notice = sprintf(
                _n( '%s new subscriber imported.', '%s new subscribers imported.', $n, 'culture-community' ),
                number_format( $n )
            );
        } elseif ( isset( $_GET['deleted'] ) && '1' === $_GET['deleted'] ) {
            $notice = __( 'Subscriber removed successfully.', 'culture-community' );
        } elseif ( isset( $_GET['saved'] ) && '1' === $_GET['saved'] ) {
            $notice = __( 'Settings saved.', 'culture-community' );
        }
        ?>
        <div class="wrap">
            <h1 class="wp-heading-inline"><?php esc_html_e( 'Newsletter Subscribers', 'culture-community' ); ?></h1>
            <hr class="wp-header-end">

            <?php if ( $notice ) : ?>
                <div class="notice notice-success is-dismissible"><p><?php echo esc_html( $notice ); ?></p></div>
            <?php endif; ?>

            <?php /* ── STATS + EXPORT ── */ ?>
            <div style="display:flex;align-items:flex-start;gap:20px;margin:16px 0 28px;flex-wrap:wrap;">

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

            <?php /* ── IMPORT TOOLS ── */ ?>
            <h2 style="font-size:14px;font-weight:600;margin:0 0 12px;"><?php esc_html_e( 'Import Subscribers', 'culture-community' ); ?></h2>
            <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:28px;">

                <?php /* MailPoet Import */ ?>
                <div style="background:#fff;border:1px solid #c3c4c7;border-radius:4px;padding:20px 24px;min-width:260px;max-width:340px;">
                    <h3 style="margin:0 0 6px;font-size:13px;font-weight:600;">
                        <?php esc_html_e( 'Import from MailPoet', 'culture-community' ); ?>
                    </h3>
                    <?php if ( $mailpoet_active ) : ?>
                        <?php
                        $mp_count = $wpdb->get_var(
                            "SELECT COUNT(*) FROM {$wpdb->prefix}mailpoet_subscribers
                             WHERE status = 'subscribed' AND deleted_at IS NULL"
                        );
                        ?>
                        <p style="margin:0 0 12px;font-size:12px;color:#646970;">
                            <?php
                            printf(
                                esc_html__( '%s subscribed contacts found in MailPoet. Duplicates will be skipped.', 'culture-community' ),
                                '<strong>' . number_format( (int) $mp_count ) . '</strong>'
                            );
                            ?>
                        </p>
                        <form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
                            <input type="hidden" name="action" value="culture_import_mailpoet">
                            <?php wp_nonce_field( 'culture_import_mailpoet' ); ?>
                            <button type="submit" class="button button-primary">
                                <?php esc_html_e( 'Import from MailPoet', 'culture-community' ); ?>
                            </button>
                        </form>
                    <?php else : ?>
                        <p style="margin:0;font-size:12px;color:#646970;">
                            <?php esc_html_e( 'MailPoet is not active on this site. Install and activate MailPoet to import your list.', 'culture-community' ); ?>
                        </p>
                    <?php endif; ?>
                </div>

                <?php /* WordPress Users Import */ ?>
                <div style="background:#fff;border:1px solid #c3c4c7;border-radius:4px;padding:20px 24px;min-width:260px;max-width:340px;">
                    <h3 style="margin:0 0 6px;font-size:13px;font-weight:600;">
                        <?php esc_html_e( 'Import WordPress Users', 'culture-community' ); ?>
                    </h3>
                    <p style="margin:0 0 12px;font-size:12px;color:#646970;">
                        <?php esc_html_e( 'Import registered users by role. Duplicates will be skipped.', 'culture-community' ); ?>
                    </p>
                    <form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
                        <input type="hidden" name="action" value="culture_import_wp_users">
                        <?php wp_nonce_field( 'culture_import_wp_users' ); ?>
                        <div style="margin-bottom:10px;">
                            <label for="culture-import-role" style="display:block;font-size:12px;font-weight:600;margin-bottom:4px;">
                                <?php esc_html_e( 'Filter by role', 'culture-community' ); ?>
                            </label>
                            <select id="culture-import-role" name="role" style="width:100%;">
                                <option value=""><?php esc_html_e( 'All users', 'culture-community' ); ?></option>
                                <?php
                                $roles = wp_roles()->get_names();
                                foreach ( $roles as $role_key => $role_name ) {
                                    echo '<option value="' . esc_attr( $role_key ) . '">' . esc_html( $role_name ) . '</option>';
                                }
                                ?>
                            </select>
                        </div>
                        <button type="submit" class="button button-primary">
                            <?php esc_html_e( 'Import Users', 'culture-community' ); ?>
                        </button>
                    </form>
                </div>

            </div>

            <?php /* ── AUTO-SUBSCRIBE TOGGLE ── */ ?>
            <h2 style="font-size:14px;font-weight:600;margin:0 0 12px;"><?php esc_html_e( 'Auto-Subscribe Settings', 'culture-community' ); ?></h2>
            <div style="background:#fff;border:1px solid #c3c4c7;border-radius:4px;padding:20px 24px;max-width:560px;margin-bottom:32px;">
                <form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
                    <input type="hidden" name="action" value="culture_nl_auto_subscribe">
                    <?php wp_nonce_field( 'culture_nl_auto_subscribe' ); ?>
                    <label style="display:flex;align-items:flex-start;gap:12px;cursor:pointer;">
                        <input
                            type="checkbox"
                            name="auto_subscribe"
                            value="1"
                            style="margin-top:2px;"
                            <?php checked( $auto_subscribe ); ?>
                        >
                        <span>
                            <strong style="display:block;font-size:13px;margin-bottom:2px;">
                                <?php esc_html_e( 'Auto-subscribe new registrations', 'culture-community' ); ?>
                            </strong>
                            <span style="font-size:12px;color:#646970;">
                                <?php esc_html_e( 'Automatically add every new WordPress user\'s email to the newsletter list when they register on this site.', 'culture-community' ); ?>
                            </span>
                        </span>
                    </label>
                    <div style="margin-top:14px;">
                        <button type="submit" class="button button-secondary">
                            <?php esc_html_e( 'Save Setting', 'culture-community' ); ?>
                        </button>
                    </div>
                </form>
            </div>

            <?php /* ── SUBSCRIBER LIST ── */ ?>
            <h2 style="font-size:14px;font-weight:600;margin:0 0 12px;"><?php esc_html_e( 'Subscriber List', 'culture-community' ); ?></h2>
            <?php if ( empty( $subscribers ) ) : ?>
                <p style="color:#646970;"><?php esc_html_e( 'No subscribers yet. Use the import tools above or wait for sign-ups via the site subscribe forms.', 'culture-community' ); ?></p>
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

    // ── HANDLERS ─────────────────────────────────────────────────────────────

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

    /**
     * Handle MailPoet import POST action.
     */
    public static function handle_import_mailpoet() {
        global $wpdb;

        check_admin_referer( 'culture_import_mailpoet' );

        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( esc_html__( 'Permission denied.', 'culture-community' ) );
        }

        if ( ! self::is_mailpoet_active() ) {
            wp_die( esc_html__( 'MailPoet is not active.', 'culture-community' ) );
        }

        $mp_emails = $wpdb->get_col(
            "SELECT email FROM {$wpdb->prefix}mailpoet_subscribers
             WHERE status = 'subscribed'
               AND deleted_at IS NULL
               AND email != ''"
        );

        $imported = self::merge_subscribers( $mp_emails );

        wp_safe_redirect( add_query_arg( array(
            'page'     => 'culture-subscribers',
            'imported' => $imported,
        ), admin_url( 'admin.php' ) ) );
        exit;
    }

    /**
     * Handle WordPress users import POST action.
     */
    public static function handle_import_wp_users() {
        check_admin_referer( 'culture_import_wp_users' );

        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( esc_html__( 'Permission denied.', 'culture-community' ) );
        }

        $role = sanitize_text_field( $_POST['role'] ?? '' );

        $args = array(
            'fields'  => array( 'user_email' ),
            'number'  => -1,
        );

        if ( $role ) {
            $args['role'] = $role;
        }

        $users  = get_users( $args );
        $emails = wp_list_pluck( $users, 'user_email' );

        $imported = self::merge_subscribers( $emails );

        wp_safe_redirect( add_query_arg( array(
            'page'     => 'culture-subscribers',
            'imported' => $imported,
        ), admin_url( 'admin.php' ) ) );
        exit;
    }

    /**
     * Handle auto-subscribe toggle POST action.
     */
    public static function handle_auto_subscribe_toggle() {
        check_admin_referer( 'culture_nl_auto_subscribe' );

        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( esc_html__( 'Permission denied.', 'culture-community' ) );
        }

        $enabled = isset( $_POST['auto_subscribe'] ) && '1' === $_POST['auto_subscribe'] ? '1' : '0';
        update_option( 'culture_nl_auto_subscribe', $enabled );

        wp_safe_redirect( add_query_arg( array(
            'page'  => 'culture-subscribers',
            'saved' => '1',
        ), admin_url( 'admin.php' ) ) );
        exit;
    }

    /**
     * Auto-subscribe a newly registered user.
     *
     * @param int $user_id
     */
    public static function auto_subscribe_new_user( $user_id ) {
        $user = get_userdata( $user_id );
        if ( ! $user || ! is_email( $user->user_email ) ) {
            return;
        }

        $subscribers = get_option( 'culture_newsletter_subscribers', array() );
        $existing    = array_map( 'strtolower', array_map( 'trim', $subscribers ) );

        if ( ! in_array( strtolower( $user->user_email ), $existing, true ) ) {
            $subscribers[] = $user->user_email;
            update_option( 'culture_newsletter_subscribers', $subscribers );
        }
    }

    // ── HELPERS ──────────────────────────────────────────────────────────────

    /**
     * Merge a list of emails into the subscriber list, skipping duplicates.
     *
     * @param  array $emails
     * @return int   Number of newly added subscribers.
     */
    private static function merge_subscribers( array $emails ) {
        $subscribers = get_option( 'culture_newsletter_subscribers', array() );
        $existing    = array_map( 'strtolower', array_map( 'trim', $subscribers ) );
        $added       = 0;

        foreach ( $emails as $email ) {
            $email = sanitize_email( $email );
            if ( ! $email || ! is_email( $email ) ) {
                continue;
            }
            if ( in_array( strtolower( $email ), $existing, true ) ) {
                continue;
            }
            $subscribers[] = $email;
            $existing[]    = strtolower( $email );
            $added++;
        }

        if ( $added > 0 ) {
            update_option( 'culture_newsletter_subscribers', $subscribers );
        }

        return $added;
    }

    /**
     * Check whether MailPoet is active and its subscribers table exists.
     *
     * @return bool
     */
    private static function is_mailpoet_active() {
        global $wpdb;

        if ( ! function_exists( 'is_plugin_active' ) ) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }

        // Check common MailPoet plugin slugs.
        $active = is_plugin_active( 'mailpoet/mailpoet.php' )
               || is_plugin_active( 'wysija-newsletters/index.php' );

        if ( ! $active ) {
            return false;
        }

        // Confirm the table actually exists.
        $table  = $wpdb->prefix . 'mailpoet_subscribers';
        $exists = $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $table ) );

        return ! empty( $exists );
    }
}
