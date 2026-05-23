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

    const LIST_OPTIONS    = array( 'getmelit' => 'GetMeLit', 'culture-drop' => 'Culture Drop' );
    const SEGMENT_OPTIONS = array(
        ''   => 'All segments',
        'us' => 'The Moveee America (US)',
        'uk' => 'The British Moveee (UK)',
        'ng' => 'Nigeria',
        'gh' => 'Ghana',
        'ca' => 'Canada',
        'au' => 'Australia',
    );

    public static function init() {
        // Run migration if needed
        self::maybe_migrate();

        add_action( 'admin_menu', array( __CLASS__, 'register_menu' ) );
        add_action( 'admin_post_culture_delete_subscriber',    array( __CLASS__, 'handle_delete' ) );
        add_action( 'admin_post_culture_export_subscribers',   array( __CLASS__, 'handle_export' ) );
        add_action( 'admin_post_culture_import_mailpoet',      array( __CLASS__, 'handle_import_mailpoet' ) );
        add_action( 'admin_post_culture_import_wp_users',      array( __CLASS__, 'handle_import_wp_users' ) );
        add_action( 'admin_post_culture_nl_auto_subscribe',    array( __CLASS__, 'handle_auto_subscribe_toggle' ) );
        add_action( 'admin_post_culture_bulk_import_emails',   array( __CLASS__, 'handle_bulk_import' ) );
        add_action( 'admin_post_culture_edit_subscriber',      array( __CLASS__, 'handle_edit' ) );

        // Auto-subscribe new registrations if the option is enabled.
        if ( get_option( 'culture_nl_auto_subscribe', '0' ) === '1' ) {
            add_action( 'user_register', array( __CLASS__, 'auto_subscribe_new_user' ), 20 );
        }
    }

    /**
     * Migrate subscribers from simple array of emails to array of objects.
     */
    private static function maybe_migrate() {
        $subscribers = get_option( 'culture_newsletter_subscribers', array() );
        if ( empty( $subscribers ) ) {
            return;
        }

        // If the first element is a string, we need to migrate.
        if ( is_string( reset( $subscribers ) ) ) {
            $migrated = array();
            $now      = current_time( 'mysql' );
            foreach ( $subscribers as $email ) {
                $migrated[] = array(
                    'email'    => sanitize_email( $email ),
                    'name'     => '',
                    'location' => '',
                    'date'     => $now,
                );
            }
            update_option( 'culture_newsletter_subscribers', $migrated );
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
        } elseif ( isset( $_GET['sub_saved'] ) && '1' === $_GET['sub_saved'] ) {
            $notice = __( 'Subscriber updated.', 'culture-community' );
        }

        // ── INLINE EDIT FORM ─────────────────────────────────────────────────
        $editing_email = isset( $_GET['sub_action'], $_GET['sub_email'] )
            && 'edit' === $_GET['sub_action']
            ? sanitize_email( wp_unslash( $_GET['sub_email'] ) )
            : '';

        if ( $editing_email ) {
            $edit_sub = null;
            foreach ( $subscribers as $s ) {
                $e = is_array( $s ) ? ( $s['email'] ?? '' ) : $s;
                if ( strtolower( trim( $e ) ) === strtolower( $editing_email ) ) {
                    $edit_sub = is_array( $s ) ? $s : array( 'email' => $s );
                    break;
                }
            }
            if ( $edit_sub ) : ?>
        <div style="background:#fff;border:1px solid #c3c4c7;border-radius:4px;padding:24px 28px;max-width:600px;margin-bottom:28px;">
            <h2 style="margin:0 0 18px;font-size:14px;font-weight:600;">
                <?php esc_html_e( 'Edit Subscriber', 'culture-community' ); ?> —
                <span style="font-weight:400;color:#646970;"><?php echo esc_html( $edit_sub['email'] ); ?></span>
            </h2>
            <form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
                <input type="hidden" name="action" value="culture_edit_subscriber">
                <input type="hidden" name="subscriber_email" value="<?php echo esc_attr( $edit_sub['email'] ); ?>">
                <?php wp_nonce_field( 'culture_edit_subscriber' ); ?>
                <table class="form-table" style="margin:0;">
                    <tr>
                        <th style="padding:8px 16px 8px 0;font-size:13px;width:120px;"><?php esc_html_e( 'Name', 'culture-community' ); ?></th>
                        <td><input type="text" name="sub_name" class="regular-text" value="<?php echo esc_attr( $edit_sub['name'] ?? '' ); ?>"></td>
                    </tr>
                    <tr>
                        <th style="padding:8px 16px 8px 0;font-size:13px;"><?php esc_html_e( 'Location', 'culture-community' ); ?></th>
                        <td><input type="text" name="sub_location" class="regular-text" value="<?php echo esc_attr( $edit_sub['location'] ?? '' ); ?>"></td>
                    </tr>
                    <tr>
                        <th style="padding:8px 16px 8px 0;font-size:13px;"><?php esc_html_e( 'Lists', 'culture-community' ); ?></th>
                        <td>
                            <?php
                            $sub_lists = $edit_sub['lists'] ?? array();
                            foreach ( self::LIST_OPTIONS as $list_id => $list_label ) : ?>
                            <label style="display:inline-flex;align-items:center;gap:6px;margin-right:18px;">
                                <input type="checkbox" name="sub_lists[]" value="<?php echo esc_attr( $list_id ); ?>"
                                    <?php checked( in_array( $list_id, $sub_lists, true ) ); ?>>
                                <?php echo esc_html( $list_label ); ?>
                            </label>
                            <?php endforeach; ?>
                        </td>
                    </tr>
                    <tr>
                        <th style="padding:8px 16px 8px 0;font-size:13px;"><?php esc_html_e( 'Segment', 'culture-community' ); ?></th>
                        <td>
                            <select name="sub_segment">
                                <?php foreach ( self::SEGMENT_OPTIONS as $seg_id => $seg_label ) : ?>
                                <option value="<?php echo esc_attr( $seg_id ); ?>" <?php selected( ( $edit_sub['segment'] ?? '' ), $seg_id ); ?>>
                                    <?php echo esc_html( $seg_label ); ?>
                                </option>
                                <?php endforeach; ?>
                            </select>
                        </td>
                    </tr>
                </table>
                <div style="margin-top:18px;display:flex;gap:10px;">
                    <button type="submit" class="button button-primary"><?php esc_html_e( 'Save Changes', 'culture-community' ); ?></button>
                    <a href="<?php echo esc_url( add_query_arg( 'page', 'culture-subscribers', admin_url( 'admin.php' ) ) ); ?>" class="button button-secondary">
                        <?php esc_html_e( 'Cancel', 'culture-community' ); ?>
                    </a>
                </div>
            </form>
        </div>
            <?php endif;
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
                        <?php esc_html_e( 'Downloads subscriber list (Email, Name, Location) as CSV.', 'culture-community' ); ?>
                    </p>
                </div>
                <?php endif; ?>

            </div>

            <?php /* ── IMPORT TOOLS ── */ ?>
            <h2 style="font-size:14px;font-weight:600;margin:0 0 12px;"><?php esc_html_e( 'Import Subscribers', 'culture-community' ); ?></h2>
            <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:28px;">

                <?php /* NEW: Bulk Import Card */ ?>
                <div style="background:#fff;border:1px solid #c3c4c7;border-radius:4px;padding:20px 24px;min-width:340px;max-width:480px;flex:1;">
                    <h3 style="margin:0 0 6px;font-size:13px;font-weight:600;">
                        <?php esc_html_e( 'Bulk Import (CSV or Paste)', 'culture-community' ); ?>
                    </h3>
                    <p style="margin:0 0 12px;font-size:12px;color:#646970;">
                        <?php esc_html_e( 'Upload a CSV or paste a list of subscribers. Format: email, name, location (comma separated, one per line).', 'culture-community' ); ?>
                    </p>
                    <form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" enctype="multipart/form-data">
                        <input type="hidden" name="action" value="culture_bulk_import_emails">
                        <?php wp_nonce_field( 'culture_bulk_import_emails' ); ?>
                        
                        <div style="margin-bottom:12px;">
                            <label style="display:block;font-size:11px;font-weight:600;text-transform:uppercase;margin-bottom:4px;">Paste List</label>
                            <textarea name="bulk_list" rows="3" style="width:100%;font-family:monospace;font-size:12px;" placeholder="tope@moveee.com, Tope, Lagos"></textarea>
                        </div>

                        <div style="margin-bottom:16px;">
                            <label style="display:block;font-size:11px;font-weight:600;text-transform:uppercase;margin-bottom:4px;">Or Upload CSV File</label>
                            <input type="file" name="bulk_csv" accept=".csv" style="font-size:12px;">
                        </div>

                        <button type="submit" class="button button-primary">
                            <?php esc_html_e( 'Import Selected', 'culture-community' ); ?>
                        </button>
                    </form>
                </div>

                <?php /* MailPoet Import */ ?>
                <div style="background:#fff;border:1px solid #c3c4c7;border-radius:4px;padding:20px 24px;min-width:260px;max-width:300px;">
                    <h3 style="margin:0 0 6px;font-size:13px;font-weight:600;">
                        <?php esc_html_e( 'MailPoet Sync', 'culture-community' ); ?>
                    </h3>
                    <?php if ( $mailpoet_active ) : ?>
                        <p style="margin:0 0 12px;font-size:12px;color:#646970;">
                            <?php esc_html_e( 'Sync active subscribers from MailPoet table.', 'culture-community' ); ?>
                        </p>
                        <form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
                            <input type="hidden" name="action" value="culture_import_mailpoet">
                            <?php wp_nonce_field( 'culture_import_mailpoet' ); ?>
                            <button type="submit" class="button button-secondary">
                                <?php esc_html_e( 'Sync Now', 'culture-community' ); ?>
                            </button>
                        </form>
                    <?php else : ?>
                        <p style="margin:0;font-size:12px;color:#646970;">
                            <?php esc_html_e( 'MailPoet is not active.', 'culture-community' ); ?>
                        </p>
                    <?php endif; ?>
                </div>

                <?php /* WordPress Users Import */ ?>
                <div style="background:#fff;border:1px solid #c3c4c7;border-radius:4px;padding:20px 24px;min-width:260px;max-width:300px;">
                    <h3 style="margin:0 0 6px;font-size:13px;font-weight:600;">
                        <?php esc_html_e( 'WP User Import', 'culture-community' ); ?>
                    </h3>
                    <form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
                        <input type="hidden" name="action" value="culture_import_wp_users">
                        <?php wp_nonce_field( 'culture_import_wp_users' ); ?>
                        <div style="margin-bottom:10px;">
                            <select name="role" style="width:100%;font-size:12px;">
                                <option value=""><?php esc_html_e( 'All roles', 'culture-community' ); ?></option>
                                <?php
                                $roles = wp_roles()->get_names();
                                foreach ( $roles as $role_key => $role_name ) {
                                    echo '<option value="' . esc_attr( $role_key ) . '">' . esc_html( $role_name ) . '</option>';
                                }
                                ?>
                            </select>
                        </div>
                        <button type="submit" class="button button-secondary">
                            <?php esc_html_e( 'Import Role', 'culture-community' ); ?>
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
                                <?php esc_html_e( 'Add every new registered user to the list automatically.', 'culture-community' ); ?>
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
                <p style="color:#646970;"><?php esc_html_e( 'No subscribers yet.', 'culture-community' ); ?></p>
            <?php else : ?>
                <table class="wp-list-table widefat fixed striped">
                    <thead>
                        <tr>
                            <th scope="col" style="width:40px;">#</th>
                            <th scope="col" style="width:220px;"><?php esc_html_e( 'Email Address', 'culture-community' ); ?></th>
                            <th scope="col" style="width:150px;"><?php esc_html_e( 'Name', 'culture-community' ); ?></th>
                            <th scope="col" style="width:160px;"><?php esc_html_e( 'Lists', 'culture-community' ); ?></th>
                            <th scope="col" style="width:140px;"><?php esc_html_e( 'Segment', 'culture-community' ); ?></th>
                            <th scope="col" style="width:120px;"><?php esc_html_e( 'Joined', 'culture-community' ); ?></th>
                            <th scope="col" style="width:130px;"><?php esc_html_e( 'Actions', 'culture-community' ); ?></th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ( array_reverse( $subscribers ) as $idx => $sub ) : ?>
                            <?php
                            $email    = is_array( $sub ) ? ( $sub['email'] ?? '' ) : $sub;
                            $name     = is_array( $sub ) ? ( $sub['name'] ?? '' ) : '';
                            $sub_lists = is_array( $sub ) ? ( $sub['lists'] ?? array() ) : array();
                            $segment  = is_array( $sub ) ? ( $sub['segment'] ?? '' ) : '';
                            $date     = is_array( $sub ) && ! empty( $sub['date'] )
                                ? date_i18n( get_option( 'date_format' ), strtotime( $sub['date'] ) )
                                : '';
                            $is_editing = ( strtolower( trim( $email ) ) === strtolower( $editing_email ) );
                            ?>
                            <tr<?php echo $is_editing ? ' style="background:#fffbe6;"' : ''; ?>>
                                <td style="color:#646970;"><?php echo esc_html( $count - $idx ); ?></td>
                                <td><strong><?php echo esc_html( $email ); ?></strong></td>
                                <td><?php echo esc_html( $name ); ?></td>
                                <td>
                                    <?php if ( ! empty( $sub_lists ) ) : ?>
                                        <?php foreach ( $sub_lists as $l ) : ?>
                                            <span style="display:inline-block;padding:2px 7px;border-radius:3px;font-size:10px;font-weight:600;letter-spacing:.05em;margin:1px;background:<?php echo $l === 'getmelit' ? '#d1fae5' : '#e0e7ff'; ?>;color:<?php echo $l === 'getmelit' ? '#065f46' : '#3730a3'; ?>;">
                                                <?php echo esc_html( self::LIST_OPTIONS[ $l ] ?? $l ); ?>
                                            </span>
                                        <?php endforeach; ?>
                                    <?php else : ?>
                                        <span style="font-size:11px;color:#aaa;">—</span>
                                    <?php endif; ?>
                                </td>
                                <td style="font-size:12px;color:#646970;">
                                    <?php echo $segment ? esc_html( self::SEGMENT_OPTIONS[ $segment ] ?? $segment ) : '<span style="color:#aaa;">—</span>'; ?>
                                </td>
                                <td style="font-size:12px;color:#646970;"><?php echo esc_html( $date ); ?></td>
                                <td>
                                    <div style="display:flex;gap:6px;align-items:center;">
                                        <a
                                            href="<?php echo esc_url( add_query_arg( array(
                                                'page'       => 'culture-subscribers',
                                                'sub_action' => 'edit',
                                                'sub_email'  => rawurlencode( $email ),
                                            ), admin_url( 'admin.php' ) ) ); ?>#edit-subscriber"
                                            class="button button-small"
                                        ><?php esc_html_e( 'Edit', 'culture-community' ); ?></a>
                                        <form
                                            method="post"
                                            action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>"
                                            onsubmit="return confirm('<?php echo esc_js( sprintf( __( 'Remove %s?', 'culture-community' ), $email ) ); ?>')"
                                        >
                                            <input type="hidden" name="action" value="culture_delete_subscriber">
                                            <input type="hidden" name="subscriber_email" value="<?php echo esc_attr( $email ); ?>">
                                            <?php wp_nonce_field( 'culture_delete_subscriber' ); ?>
                                            <button type="submit" class="button button-small button-link-delete">
                                                <?php esc_html_e( 'Remove', 'culture-community' ); ?>
                                            </button>
                                        </form>
                                    </div>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php endif; ?>
        </div>
        <?php
    }

    // ── HANDLERS ─────────────────────────────────────────────────────────────

    /**
     * Handle edit subscriber POST action — updates name, location, lists, segment.
     */
    public static function handle_edit() {
        check_admin_referer( 'culture_edit_subscriber' );

        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( esc_html__( 'Permission denied.', 'culture-community' ) );
        }

        $email    = sanitize_email( $_POST['subscriber_email'] ?? '' );
        $name     = sanitize_text_field( $_POST['sub_name'] ?? '' );
        $location = sanitize_text_field( $_POST['sub_location'] ?? '' );
        $segment  = sanitize_text_field( $_POST['sub_segment'] ?? '' );
        $lists    = array_values( array_intersect(
            array_map( 'sanitize_text_field', (array) ( $_POST['sub_lists'] ?? array() ) ),
            array_keys( self::LIST_OPTIONS )
        ) );

        if ( ! $email ) {
            wp_safe_redirect( add_query_arg( 'page', 'culture-subscribers', admin_url( 'admin.php' ) ) );
            exit;
        }

        $subscribers = get_option( 'culture_newsletter_subscribers', array() );
        $found       = false;

        foreach ( $subscribers as &$sub ) {
            $sub_email = is_array( $sub ) ? ( $sub['email'] ?? '' ) : $sub;
            if ( strtolower( trim( $sub_email ) ) === strtolower( $email ) ) {
                if ( ! is_array( $sub ) ) {
                    $sub = array( 'email' => $sub_email, 'date' => current_time( 'mysql' ) );
                }
                $sub['name']     = $name;
                $sub['location'] = $location;
                $sub['lists']    = $lists;
                $sub['segment']  = $segment;
                $found = true;
                break;
            }
        }
        unset( $sub );

        if ( $found ) {
            update_option( 'culture_newsletter_subscribers', $subscribers );
        }

        wp_safe_redirect( add_query_arg( array(
            'page'      => 'culture-subscribers',
            'sub_saved' => '1',
        ), admin_url( 'admin.php' ) ) );
        exit;
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
                $sub_email = is_array( $s ) ? ( $s['email'] ?? '' ) : $s;
                return strtolower( trim( $sub_email ) ) !== strtolower( $email );
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
        fputcsv( $output, array( 'Email Address', 'Name', 'Location', 'Date Joined' ) );

        foreach ( $subscribers as $sub ) {
            if ( is_array( $sub ) ) {
                fputcsv( $output, array(
                    $sub['email'],
                    $sub['name'] ?? '',
                    $sub['location'] ?? '',
                    $sub['date'] ?? '',
                ) );
            } else {
                fputcsv( $output, array( $sub, '', '', '' ) );
            }
        }

        fclose( $output );
        exit;
    }

    /**
     * Handle Bulk Import POST action (CSV or Textarea).
     */
    public static function handle_bulk_import() {
        check_admin_referer( 'culture_bulk_import_emails' );

        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( esc_html__( 'Permission denied.', 'culture-community' ) );
        }

        $items = array(); // Each item: [email, name, location]

        // 1. Parse Textarea
        $raw_list = $_POST['bulk_list'] ?? '';
        if ( ! empty( $raw_list ) ) {
            $lines = explode( "\n", str_replace( "\r", "", $raw_list ) );
            foreach ( $lines as $line ) {
                $parts = str_getcsv( $line ); // Handles comma separation gracefully
                if ( ! empty( $parts[0] ) ) {
                    $items[] = array(
                        'email'    => trim( $parts[0] ),
                        'name'     => trim( $parts[1] ?? '' ),
                        'location' => trim( $parts[2] ?? '' ),
                    );
                }
            }
        }

        // 2. Parse CSV File
        if ( ! empty( $_FILES['bulk_csv']['tmp_name'] ) ) {
            $handle = fopen( $_FILES['bulk_csv']['tmp_name'], 'r' );
            if ( $handle ) {
                $header = fgetcsv( $handle ); // Skip or check header
                while ( ( $row = fgetcsv( $handle ) ) !== false ) {
                    if ( ! empty( $row[0] ) ) {
                        $items[] = array(
                            'email'    => trim( $row[0] ),
                            'name'     => trim( $row[1] ?? '' ),
                            'location' => trim( $row[2] ?? '' ),
                        );
                    }
                }
                fclose( $handle );
            }
        }

        if ( empty( $items ) ) {
            wp_safe_redirect( add_query_arg( 'page', 'culture-subscribers', admin_url( 'admin.php' ) ) );
            exit;
        }

        $count = self::merge_subscribers( $items );

        wp_safe_redirect( add_query_arg( array(
            'page'     => 'culture-subscribers',
            'imported' => $count,
        ), admin_url( 'admin.php' ) ) );
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

        $rows = $wpdb->get_results(
            "SELECT email, first_name, last_name FROM {$wpdb->prefix}mailpoet_subscribers
             WHERE status = 'subscribed'
               AND deleted_at IS NULL
               AND email != ''"
        );

        $items = array();
        foreach ( $rows as $row ) {
            $items[] = array(
                'email'    => $row->email,
                'name'     => trim( $row->first_name . ' ' . $row->last_name ),
                'location' => '',
            );
        }

        $imported = self::merge_subscribers( $items );

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
            'fields'  => array( 'user_email', 'display_name' ),
            'number'  => -1,
        );

        if ( $role ) {
            $args['role'] = $role;
        }

        $users = get_users( $args );
        $items = array();
        foreach ( $users as $u ) {
            $items[] = array(
                'email'    => $u->user_email,
                'name'     => $u->display_name,
                'location' => '',
            );
        }

        $imported = self::merge_subscribers( $items );

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

        self::merge_subscribers( array(
            array(
                'email'    => $user->user_email,
                'name'     => $user->display_name,
                'location' => '',
            )
        ) );
    }

    // ── HELPERS ──────────────────────────────────────────────────────────────

    /**
     * Merge a list of email items into the subscriber list, skipping duplicates.
     *
     * @param  array $items Each item: [email => ..., name => ..., location => ...]
     * @return int   Number of newly added subscribers.
     */
    private static function merge_subscribers( array $items ) {
        $subscribers = get_option( 'culture_newsletter_subscribers', array() );
        
        // Build lookup of current emails
        $existing_emails = array();
        foreach ( $subscribers as $sub ) {
            $existing_emails[] = strtolower( trim( is_array( $sub ) ? $sub['email'] : $sub ) );
        }
        $existing_emails = array_unique( $existing_emails );

        $added = 0;
        $now   = current_time( 'mysql' );

        foreach ( $items as $item ) {
            $email = sanitize_email( is_array( $item ) ? $item['email'] : $item );
            if ( ! $email || ! is_email( $email ) ) {
                continue;
            }
            if ( in_array( strtolower( $email ), $existing_emails, true ) ) {
                continue;
            }

            $subscribers[] = array(
                'email'    => $email,
                'name'     => sanitize_text_field( $item['name'] ?? '' ),
                'location' => sanitize_text_field( $item['location'] ?? '' ),
                'date'     => $now,
            );
            $existing_emails[] = strtolower( $email );
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
