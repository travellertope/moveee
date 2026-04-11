<?php
/**
 * Chapter Leader admin dashboard.
 *
 * Provides:
 * - QR scanner page for checking in attendees
 * - Attendance records viewer with filtering
 * - Event management overview for their chapter
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Culture_Leader_Dashboard {

    public static function init() {
        add_action( 'admin_menu', array( __CLASS__, 'register_menu' ) );
        add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_admin_assets' ) );
    }

    /**
     * Register the Chapter Leader submenu pages.
     */
    public static function register_menu() {
        // Only show for users with the scan QR capability.
        if ( ! current_user_can( 'culture_scan_qr' ) ) {
            return;
        }

        add_submenu_page(
            'culture-community',
            __( 'QR Scanner', 'culture-community' ),
            __( 'QR Scanner', 'culture-community' ),
            'culture_scan_qr',
            'culture-qr-scanner',
            array( __CLASS__, 'render_qr_scanner' )
        );

        add_submenu_page(
            'culture-community',
            __( 'Attendance', 'culture-community' ),
            __( 'Attendance', 'culture-community' ),
            'culture_view_attendance',
            'culture-attendance',
            array( __CLASS__, 'render_attendance' )
        );
    }

    /**
     * Enqueue admin-specific assets on our pages.
     */
    public static function enqueue_admin_assets( $hook ) {
        if ( ! in_array( $hook, array( 'culture-community_page_culture-qr-scanner', 'culture-community_page_culture-attendance' ), true ) ) {
            return;
        }

        wp_enqueue_script(
            'culture-admin',
            CULTURE_PLUGIN_URL . 'assets/js/culture-admin.js',
            array( 'jquery' ),
            CULTURE_VERSION,
            true
        );

        wp_localize_script( 'culture-admin', 'cultureAdmin', array(
            'restUrl'   => rest_url( 'culture/v1/' ),
            'restNonce' => wp_create_nonce( 'wp_rest' ),
        ) );
    }

    /**
     * Render the QR Scanner page.
     */
    public static function render_qr_scanner() {
        $user_id    = get_current_user_id();
        $chapter_id = self::get_leader_chapter( $user_id );

        // Get upcoming events for this chapter.
        $events = array();
        if ( $chapter_id ) {
            $events = get_posts( array(
                'post_type'      => 'culture_event',
                'posts_per_page' => 20,
                'meta_query'     => array(
                    array(
                        'key'   => '_culture_chapter_id',
                        'value' => $chapter_id,
                    ),
                    array(
                        'key'     => '_culture_event_date',
                        'value'   => gmdate( 'Y-m-d\TH:i', strtotime( '-1 day' ) ),
                        'compare' => '>=',
                        'type'    => 'DATETIME',
                    ),
                ),
                'meta_key' => '_culture_event_date',
                'orderby'  => 'meta_value',
                'order'    => 'ASC',
            ) );
        }
        ?>
        <div class="wrap">
            <h1><?php esc_html_e( 'QR Code Scanner', 'culture-community' ); ?></h1>

            <div class="culture-admin-scanner">
                <div class="culture-admin-scanner__select">
                    <label for="culture-scanner-event"><?php esc_html_e( 'Select Event:', 'culture-community' ); ?></label>
                    <select id="culture-scanner-event">
                        <option value=""><?php esc_html_e( '-- Choose an event --', 'culture-community' ); ?></option>
                        <?php foreach ( $events as $event ) : ?>
                            <option value="<?php echo esc_attr( $event->ID ); ?>">
                                <?php echo esc_html( $event->post_title ); ?>
                                (<?php echo esc_html( get_post_meta( $event->ID, '_culture_event_date', true ) ); ?>)
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>

                <div class="culture-admin-scanner__manual">
                    <h3><?php esc_html_e( 'Manual Check-in', 'culture-community' ); ?></h3>
                    <p class="description"><?php esc_html_e( 'Enter the user ID from the scanned QR code, or type a username to search.', 'culture-community' ); ?></p>
                    <div class="culture-admin-scanner__input-row">
                        <input type="number" id="culture-scanner-user-id" placeholder="<?php esc_attr_e( 'User ID', 'culture-community' ); ?>" min="1" />
                        <button type="button" class="button button-primary js-culture-checkin-btn">
                            <?php esc_html_e( 'Check In', 'culture-community' ); ?>
                        </button>
                    </div>
                </div>

                <div class="culture-admin-scanner__qr-input">
                    <h3><?php esc_html_e( 'Scan QR Code', 'culture-community' ); ?></h3>
                    <p class="description"><?php esc_html_e( 'Paste the scanned QR code data (JSON) below.', 'culture-community' ); ?></p>
                    <textarea id="culture-scanner-qr-data" rows="3" placeholder='{"uid":123,"hash":"abc..."}'></textarea>
                    <button type="button" class="button button-primary js-culture-qr-checkin-btn">
                        <?php esc_html_e( 'Process QR Check-in', 'culture-community' ); ?>
                    </button>
                </div>

                <div class="culture-admin-scanner__result" id="culture-scanner-result" style="display:none;">
                    <div class="culture-admin-scanner__result-content"></div>
                </div>
            </div>
        </div>
        <?php
    }

    /**
     * Render the Attendance records page.
     */
    public static function render_attendance() {
        global $wpdb;

        $user_id    = get_current_user_id();
        $chapter_id = self::get_leader_chapter( $user_id );
        $table      = $wpdb->prefix . 'culture_attendance';

        // Filters.
        $filter_event  = isset( $_GET['event_id'] ) ? absint( $_GET['event_id'] ) : 0;
        $filter_status = isset( $_GET['status'] ) ? sanitize_key( $_GET['status'] ) : '';

        // Build query.
        $where = array( '1=1' );
        $params = array();

        if ( $filter_event ) {
            $where[] = 'a.event_id = %d';
            $params[] = $filter_event;
        } elseif ( $chapter_id ) {
            // Limit to events in this leader's chapter.
            $where[] = "pm.meta_value = %s";
            $params[] = (string) $chapter_id;
        }

        if ( $filter_status ) {
            $where[] = 'a.status = %s';
            $params[] = $filter_status;
        }

        $where_sql = implode( ' AND ', $where );

        $query = "SELECT a.*, u.display_name, p.post_title AS event_title
                  FROM {$table} a
                  INNER JOIN {$wpdb->users} u ON a.user_id = u.ID
                  INNER JOIN {$wpdb->posts} p ON a.event_id = p.ID
                  INNER JOIN {$wpdb->postmeta} pm ON p.ID = pm.post_id AND pm.meta_key = '_culture_chapter_id'
                  WHERE {$where_sql}
                  ORDER BY a.checkin_time DESC
                  LIMIT 100";

        if ( ! empty( $params ) ) {
            $query = $wpdb->prepare( $query, ...$params );
        }

        $records = $wpdb->get_results( $query );

        // Get events for filter dropdown.
        $events_for_filter = array();
        if ( $chapter_id ) {
            $events_for_filter = get_posts( array(
                'post_type'      => 'culture_event',
                'posts_per_page' => 50,
                'meta_key'       => '_culture_chapter_id',
                'meta_value'     => $chapter_id,
                'orderby'        => 'date',
                'order'          => 'DESC',
            ) );
        }
        ?>
        <div class="wrap">
            <h1><?php esc_html_e( 'Attendance Records', 'culture-community' ); ?></h1>

            <div class="culture-admin-filters">
                <form method="get">
                    <input type="hidden" name="page" value="culture-attendance" />
                    <select name="event_id">
                        <option value=""><?php esc_html_e( 'All Events', 'culture-community' ); ?></option>
                        <?php foreach ( $events_for_filter as $event ) : ?>
                            <option value="<?php echo esc_attr( $event->ID ); ?>" <?php selected( $filter_event, $event->ID ); ?>>
                                <?php echo esc_html( $event->post_title ); ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                    <select name="status">
                        <option value=""><?php esc_html_e( 'All Statuses', 'culture-community' ); ?></option>
                        <option value="rsvp" <?php selected( $filter_status, 'rsvp' ); ?>><?php esc_html_e( 'RSVP', 'culture-community' ); ?></option>
                        <option value="checked_in" <?php selected( $filter_status, 'checked_in' ); ?>><?php esc_html_e( 'Checked In', 'culture-community' ); ?></option>
                        <option value="no_show" <?php selected( $filter_status, 'no_show' ); ?>><?php esc_html_e( 'No Show', 'culture-community' ); ?></option>
                    </select>
                    <?php submit_button( __( 'Filter', 'culture-community' ), 'secondary', 'filter', false ); ?>
                </form>
            </div>

            <?php if ( empty( $records ) ) : ?>
                <p><?php esc_html_e( 'No attendance records found.', 'culture-community' ); ?></p>
            <?php else : ?>
                <table class="wp-list-table widefat fixed striped">
                    <thead>
                        <tr>
                            <th><?php esc_html_e( 'User', 'culture-community' ); ?></th>
                            <th><?php esc_html_e( 'Phone', 'culture-community' ); ?></th>
                            <th><?php esc_html_e( 'WhatsApp', 'culture-community' ); ?></th>
                            <th><?php esc_html_e( 'Event', 'culture-community' ); ?></th>
                            <th><?php esc_html_e( 'Status', 'culture-community' ); ?></th>
                            <th><?php esc_html_e( 'Time', 'culture-community' ); ?></th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ( $records as $record ) :
                            $member_phone    = get_user_meta( $record->user_id, '_culture_phone', true );
                            $member_whatsapp = get_user_meta( $record->user_id, '_culture_whatsapp', true );
                            $wa_display      = $member_whatsapp ? $member_whatsapp : $member_phone;
                        ?>
                            <tr>
                                <td>
                                    <?php echo esc_html( $record->display_name ); ?>
                                    <small>(#<?php echo esc_html( $record->user_id ); ?>)</small>
                                </td>
                                <td>
                                    <?php if ( $member_phone ) : ?>
                                        <a href="tel:<?php echo esc_attr( $member_phone ); ?>"><?php echo esc_html( $member_phone ); ?></a>
                                    <?php else : ?>
                                        <span class="description">&mdash;</span>
                                    <?php endif; ?>
                                </td>
                                <td>
                                    <?php if ( $wa_display ) :
                                        $wa_digits = preg_replace( '/[^0-9]/', '', $wa_display );
                                    ?>
                                        <a href="https://wa.me/<?php echo esc_attr( $wa_digits ); ?>" target="_blank" rel="noopener noreferrer"><?php echo esc_html( $wa_display ); ?></a>
                                    <?php else : ?>
                                        <span class="description">&mdash;</span>
                                    <?php endif; ?>
                                </td>
                                <td><?php echo esc_html( $record->event_title ); ?></td>
                                <td>
                                    <span class="culture-admin-status culture-admin-status--<?php echo esc_attr( $record->status ); ?>">
                                        <?php echo esc_html( ucwords( str_replace( '_', ' ', $record->status ) ) ); ?>
                                    </span>
                                </td>
                                <td><?php echo esc_html( date_i18n( 'Y-m-d H:i', strtotime( $record->checkin_time ) ) ); ?></td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
                <p class="description">
                    <?php printf( esc_html__( 'Showing %d records (most recent 100).', 'culture-community' ), count( $records ) ); ?>
                </p>
            <?php endif; ?>
        </div>
        <?php
    }

    /**
     * Get the chapter ID this leader manages.
     *
     * @param int $user_id
     * @return int|false
     */
    private static function get_leader_chapter( $user_id ) {
        $chapters = get_posts( array(
            'post_type'      => 'culture_chapter',
            'posts_per_page' => 1,
            'meta_key'       => '_culture_chapter_leader_id',
            'meta_value'     => $user_id,
        ) );

        return ! empty( $chapters ) ? $chapters[0]->ID : false;
    }
}
