<?php
/**
 * Admin page for viewing and managing Event RSVPs.
 *
 * Shows all submissions from the culture_event_rsvp table,
 * with per-event filtering and CSV export.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Culture_RSVP_Admin {

    public static function init(): void {
        add_action( 'admin_menu', [ __CLASS__, 'register_menu' ] );
        add_action( 'admin_post_culture_export_rsvp', [ __CLASS__, 'handle_export' ] );
    }

    public static function register_menu(): void {
        add_submenu_page(
            'culture-community',
            __( 'Event RSVPs', 'culture-community' ),
            __( 'RSVPs', 'culture-community' ),
            'manage_options',
            'culture-rsvp-manager',
            [ __CLASS__, 'render_page' ]
        );
    }

    // ── Render ────────────────────────────────────────────────────────────────

    public static function render_page(): void {
        global $wpdb;
        $table = $wpdb->prefix . 'culture_event_rsvp';

        // Filters
        $event_slug = isset( $_GET['event_slug'] ) ? sanitize_text_field( $_GET['event_slug'] ) : '';
        $status     = isset( $_GET['status'] )     ? sanitize_text_field( $_GET['status'] )     : '';

        // Distinct event slugs for the filter dropdown
        $event_slugs = $wpdb->get_col( "SELECT DISTINCT event_slug FROM {$table} ORDER BY event_slug ASC" );

        // Paging
        $per_page    = 50;
        $current_page = max( 1, (int) ( $_GET['paged'] ?? 1 ) );
        $offset      = ( $current_page - 1 ) * $per_page;

        // Build WHERE
        $where  = '1=1';
        $values = [];

        if ( $event_slug ) {
            $where   .= ' AND event_slug = %s';
            $values[] = $event_slug;
        }
        if ( $status ) {
            $where   .= ' AND status = %s';
            $values[] = $status;
        }

        $count_sql = "SELECT COUNT(*) FROM {$table} WHERE {$where}";
        $total     = (int) ( $values ? $wpdb->get_var( $wpdb->prepare( $count_sql, ...$values ) ) : $wpdb->get_var( $count_sql ) );

        $rows_sql = "SELECT * FROM {$table} WHERE {$where} ORDER BY created_at DESC LIMIT %d OFFSET %d";
        $all_values = array_merge( $values, [ $per_page, $offset ] );
        $rows = $wpdb->get_results( $wpdb->prepare( $rows_sql, ...$all_values ) );

        $total_pages = max( 1, (int) ceil( $total / $per_page ) );

        // Current filter query string (without paged)
        $filter_qs = http_build_query( array_filter( [
            'page'       => 'culture-rsvp-manager',
            'event_slug' => $event_slug,
            'status'     => $status,
        ] ) );

        ?>
        <div class="wrap">
            <h1 class="wp-heading-inline"><?php esc_html_e( 'Event RSVPs', 'culture-community' ); ?></h1>
            <span style="margin-left:12px;color:#666;"><?php echo esc_html( number_format( $total ) ); ?> total</span>
            <hr class="wp-header-end">

            <?php // ── Filter bar ?>
            <form method="get" style="margin:16px 0;display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
                <input type="hidden" name="page" value="culture-rsvp-manager">

                <select name="event_slug" onchange="this.form.submit()">
                    <option value=""><?php esc_html_e( '— All Events —', 'culture-community' ); ?></option>
                    <?php foreach ( $event_slugs as $slug ) : ?>
                        <option value="<?php echo esc_attr( $slug ); ?>" <?php selected( $event_slug, $slug ); ?>>
                            <?php echo esc_html( $slug ); ?>
                        </option>
                    <?php endforeach; ?>
                </select>

                <select name="status" onchange="this.form.submit()">
                    <option value=""><?php esc_html_e( '— All Statuses —', 'culture-community' ); ?></option>
                    <option value="confirmed" <?php selected( $status, 'confirmed' ); ?>>Confirmed</option>
                    <option value="cancelled" <?php selected( $status, 'cancelled' ); ?>>Cancelled</option>
                </select>

                <a href="<?php echo esc_url( admin_url( 'admin-post.php?' . $filter_qs . '&action=culture_export_rsvp&_wpnonce=' . wp_create_nonce( 'culture_export_rsvp' ) ) ); ?>"
                   class="button">
                    <?php esc_html_e( 'Export CSV', 'culture-community' ); ?>
                </a>
            </form>

            <?php if ( empty( $rows ) ) : ?>
                <p><?php esc_html_e( 'No RSVPs found.', 'culture-community' ); ?></p>
            <?php else : ?>
                <table class="wp-list-table widefat fixed striped" style="margin-top:8px;">
                    <thead>
                        <tr>
                            <th style="width:40px;">#</th>
                            <th><?php esc_html_e( 'Name', 'culture-community' ); ?></th>
                            <th><?php esc_html_e( 'Email', 'culture-community' ); ?></th>
                            <th><?php esc_html_e( 'Event', 'culture-community' ); ?></th>
                            <th><?php esc_html_e( 'Ticket', 'culture-community' ); ?></th>
                            <th><?php esc_html_e( 'Source', 'culture-community' ); ?></th>
                            <th><?php esc_html_e( 'Status', 'culture-community' ); ?></th>
                            <th><?php esc_html_e( 'Date', 'culture-community' ); ?></th>
                            <th><?php esc_html_e( 'Actions', 'culture-community' ); ?></th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ( $rows as $row ) : ?>
                            <tr>
                                <td><?php echo absint( $row->id ); ?></td>
                                <td><?php echo esc_html( $row->name ); ?></td>
                                <td><a href="mailto:<?php echo esc_attr( $row->email ); ?>"><?php echo esc_html( $row->email ); ?></a></td>
                                <td>
                                    <?php if ( $row->event_title ) : ?>
                                        <strong><?php echo esc_html( $row->event_title ); ?></strong><br>
                                        <small><?php echo esc_html( $row->event_slug ); ?></small>
                                    <?php else : ?>
                                        <?php echo esc_html( $row->event_slug ); ?>
                                    <?php endif; ?>
                                </td>
                                <td><?php echo esc_html( $row->ticket_type ); ?></td>
                                <td><?php echo esc_html( $row->source ); ?></td>
                                <td>
                                    <span style="background:<?php echo $row->status === 'confirmed' ? '#d4edda' : '#f8d7da'; ?>;padding:2px 8px;border-radius:3px;font-size:12px;">
                                        <?php echo esc_html( $row->status ); ?>
                                    </span>
                                </td>
                                <td><?php echo esc_html( wp_date( 'd M Y H:i', strtotime( $row->created_at ) ) ); ?></td>
                                <td>
                                    <?php if ( $row->status === 'confirmed' ) : ?>
                                        <a href="<?php echo esc_url( wp_nonce_url( admin_url( 'admin-post.php?action=culture_cancel_rsvp&id=' . $row->id . '&' . $filter_qs ), 'culture_cancel_rsvp_' . $row->id ) ); ?>"
                                           style="color:#a00;"
                                           onclick="return confirm('Cancel this RSVP?')">
                                            <?php esc_html_e( 'Cancel', 'culture-community' ); ?>
                                        </a>
                                    <?php else : ?>
                                        <a href="<?php echo esc_url( wp_nonce_url( admin_url( 'admin-post.php?action=culture_confirm_rsvp&id=' . $row->id . '&' . $filter_qs ), 'culture_confirm_rsvp_' . $row->id ) ); ?>"
                                           style="color:#080;">
                                            <?php esc_html_e( 'Re-confirm', 'culture-community' ); ?>
                                        </a>
                                    <?php endif; ?>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>

                <?php // Pagination ?>
                <?php if ( $total_pages > 1 ) : ?>
                    <div class="tablenav bottom" style="margin-top:12px;">
                        <div class="tablenav-pages">
                            <?php for ( $p = 1; $p <= $total_pages; $p++ ) : ?>
                                <?php if ( $p === $current_page ) : ?>
                                    <span class="current"><?php echo $p; ?></span>
                                <?php else : ?>
                                    <a class="page-numbers" href="<?php echo esc_url( admin_url( 'admin.php?' . $filter_qs . '&paged=' . $p ) ); ?>"><?php echo $p; ?></a>
                                <?php endif; ?>
                            <?php endfor; ?>
                        </div>
                    </div>
                <?php endif; ?>
            <?php endif; ?>
        </div>
        <?php
    }

    // ── CSV Export ────────────────────────────────────────────────────────────

    public static function handle_export(): void {
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( 'Unauthorised', 403 );
        }
        check_admin_referer( 'culture_export_rsvp' );

        global $wpdb;
        $table = $wpdb->prefix . 'culture_event_rsvp';

        $event_slug = isset( $_GET['event_slug'] ) ? sanitize_text_field( $_GET['event_slug'] ) : '';
        $status     = isset( $_GET['status'] )     ? sanitize_text_field( $_GET['status'] )     : '';

        $where  = '1=1';
        $values = [];
        if ( $event_slug ) { $where .= ' AND event_slug = %s'; $values[] = $event_slug; }
        if ( $status )     { $where .= ' AND status = %s';     $values[] = $status; }

        $sql  = "SELECT id, name, email, event_slug, event_title, ticket_type, source, status, ip_address, created_at FROM {$table} WHERE {$where} ORDER BY created_at DESC";
        $rows = $values ? $wpdb->get_results( $wpdb->prepare( $sql, ...$values ), ARRAY_A ) : $wpdb->get_results( $sql, ARRAY_A );

        $filename = 'rsvps-' . ( $event_slug ?: 'all' ) . '-' . gmdate( 'Y-m-d' ) . '.csv';

        header( 'Content-Type: text/csv; charset=UTF-8' );
        header( 'Content-Disposition: attachment; filename="' . $filename . '"' );
        header( 'Pragma: no-cache' );

        $out = fopen( 'php://output', 'w' );
        fputcsv( $out, [ 'ID', 'Name', 'Email', 'Event Slug', 'Event Title', 'Ticket Type', 'Source', 'Status', 'IP Address', 'Date' ] );
        foreach ( $rows as $row ) {
            fputcsv( $out, array_values( $row ) );
        }
        fclose( $out );
        exit;
    }

    // ── Status toggle handlers (registered via admin_post_*) ─────────────────

    public static function init_post_handlers(): void {
        add_action( 'admin_post_culture_cancel_rsvp',  [ __CLASS__, 'handle_cancel' ] );
        add_action( 'admin_post_culture_confirm_rsvp', [ __CLASS__, 'handle_confirm' ] );
    }

    public static function handle_cancel(): void {
        self::toggle_status( 'cancel' );
    }

    public static function handle_confirm(): void {
        self::toggle_status( 'confirm' );
    }

    private static function toggle_status( string $action ): void {
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( 'Unauthorised', 403 );
        }

        $id = absint( $_GET['id'] ?? 0 );
        check_admin_referer( "culture_{$action}_rsvp_{$id}" );

        global $wpdb;
        $table  = $wpdb->prefix . 'culture_event_rsvp';
        $status = $action === 'cancel' ? 'cancelled' : 'confirmed';
        $wpdb->update( $table, [ 'status' => $status ], [ 'id' => $id ], [ '%s' ], [ '%d' ] );

        // Redirect back
        $redirect = admin_url( 'admin.php?' . http_build_query( array_filter( [
            'page'       => 'culture-rsvp-manager',
            'event_slug' => sanitize_text_field( $_GET['event_slug'] ?? '' ),
            'status'     => sanitize_text_field( $_GET['status'] ?? '' ),
        ] ) ) );

        wp_safe_redirect( $redirect );
        exit;
    }
}
