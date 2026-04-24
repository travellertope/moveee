<?php
/**
 * Admin page for viewing and managing paid ticket sales.
 *
 * Shows all rows from the culture_tickets table with filtering,
 * manual check-in, and CSV export.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Culture_Tickets_Admin {

    public static function init(): void {
        add_action( 'admin_menu',                          [ __CLASS__, 'register_menu' ] );
        add_action( 'admin_post_culture_export_tickets',   [ __CLASS__, 'handle_export' ] );
        add_action( 'admin_post_culture_checkin_ticket',   [ __CLASS__, 'handle_checkin' ] );
        add_action( 'admin_post_culture_cancel_ticket',    [ __CLASS__, 'handle_cancel' ] );
    }

    public static function register_menu(): void {
        add_submenu_page(
            'culture-community',
            __( 'Ticket Sales', 'culture-community' ),
            __( 'Ticket Sales', 'culture-community' ),
            'manage_options',
            'culture-ticket-sales',
            [ __CLASS__, 'render_page' ]
        );
    }

    // ── Render ─────────────────────────────────────────────────────────────────

    public static function render_page(): void {
        global $wpdb;
        $table = $wpdb->prefix . 'culture_tickets';

        $event_slug = isset( $_GET['event_slug'] ) ? sanitize_text_field( $_GET['event_slug'] ) : '';
        $status     = isset( $_GET['status'] )     ? sanitize_text_field( $_GET['status'] )     : '';
        $gateway    = isset( $_GET['gateway'] )    ? sanitize_text_field( $_GET['gateway'] )    : '';

        $event_slugs = $wpdb->get_col( "SELECT DISTINCT event_slug FROM {$table} ORDER BY event_slug ASC" );

        $per_page     = 50;
        $current_page = max( 1, (int) ( $_GET['paged'] ?? 1 ) );
        $offset       = ( $current_page - 1 ) * $per_page;

        $where  = '1=1';
        $values = [];

        if ( $event_slug ) { $where .= ' AND event_slug = %s'; $values[] = $event_slug; }
        if ( $status )     { $where .= ' AND status = %s';     $values[] = $status; }
        if ( $gateway )    { $where .= ' AND payment_gateway = %s'; $values[] = $gateway; }

        $count_sql = "SELECT COUNT(*) FROM {$table} WHERE {$where}";
        $total     = (int) ( $values
            ? $wpdb->get_var( $wpdb->prepare( $count_sql, ...$values ) )
            : $wpdb->get_var( $count_sql ) );

        $rows_sql   = "SELECT * FROM {$table} WHERE {$where} ORDER BY created_at DESC LIMIT %d OFFSET %d";
        $all_values = array_merge( $values, [ $per_page, $offset ] );
        $rows       = $wpdb->get_results( $wpdb->prepare( $rows_sql, ...$all_values ) );

        $total_pages = max( 1, (int) ceil( $total / $per_page ) );

        $filter_qs = http_build_query( array_filter( [
            'page'       => 'culture-ticket-sales',
            'event_slug' => $event_slug,
            'status'     => $status,
            'gateway'    => $gateway,
        ] ) );

        // Revenue totals
        $rev_sql  = "SELECT SUM(price_amount) FROM {$table} WHERE status IN ('confirmed','checked_in') AND {$where}";
        $revenue  = (float) ( $values ? $wpdb->get_var( $wpdb->prepare( $rev_sql, ...$values ) ) : $wpdb->get_var( $rev_sql ) );

        ?>
        <div class="wrap">
            <h1 class="wp-heading-inline"><?php esc_html_e( 'Ticket Sales', 'culture-community' ); ?></h1>
            <span style="margin-left:12px;color:#666;">
                <?php echo esc_html( number_format( $total ) ); ?> ticket<?php echo $total !== 1 ? 's' : ''; ?>
                <?php if ( $revenue > 0 ) : ?>
                    &nbsp;·&nbsp; Revenue: <?php echo esc_html( number_format( $revenue ) ); ?>
                <?php endif; ?>
            </span>
            <hr class="wp-header-end">

            <form method="get" style="margin:16px 0;display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
                <input type="hidden" name="page" value="culture-ticket-sales">

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
                    <option value="pending"    <?php selected( $status, 'pending' ); ?>>Pending</option>
                    <option value="confirmed"  <?php selected( $status, 'confirmed' ); ?>>Confirmed</option>
                    <option value="checked_in" <?php selected( $status, 'checked_in' ); ?>>Checked In</option>
                    <option value="cancelled"  <?php selected( $status, 'cancelled' ); ?>>Cancelled</option>
                </select>

                <select name="gateway" onchange="this.form.submit()">
                    <option value=""><?php esc_html_e( '— All Gateways —', 'culture-community' ); ?></option>
                    <option value="paystack" <?php selected( $gateway, 'paystack' ); ?>>Paystack</option>
                    <option value="stripe"   <?php selected( $gateway, 'stripe' ); ?>>Stripe</option>
                </select>

                <a href="<?php echo esc_url( admin_url( 'admin-post.php?' . $filter_qs . '&action=culture_export_tickets&_wpnonce=' . wp_create_nonce( 'culture_export_tickets' ) ) ); ?>"
                   class="button">
                    <?php esc_html_e( 'Export CSV', 'culture-community' ); ?>
                </a>
            </form>

            <?php if ( empty( $rows ) ) : ?>
                <p><?php esc_html_e( 'No tickets found.', 'culture-community' ); ?></p>
            <?php else : ?>
                <table class="wp-list-table widefat fixed striped" style="margin-top:8px;">
                    <thead>
                        <tr>
                            <th style="width:40px;">#</th>
                            <th><?php esc_html_e( 'Attendee', 'culture-community' ); ?></th>
                            <th><?php esc_html_e( 'Event', 'culture-community' ); ?></th>
                            <th><?php esc_html_e( 'Ticket', 'culture-community' ); ?></th>
                            <th><?php esc_html_e( 'Amount', 'culture-community' ); ?></th>
                            <th><?php esc_html_e( 'Gateway', 'culture-community' ); ?></th>
                            <th><?php esc_html_e( 'Code', 'culture-community' ); ?></th>
                            <th><?php esc_html_e( 'Status', 'culture-community' ); ?></th>
                            <th><?php esc_html_e( 'Date', 'culture-community' ); ?></th>
                            <th><?php esc_html_e( 'Actions', 'culture-community' ); ?></th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ( $rows as $row ) : ?>
                            <?php
                            $status_colors = [
                                'confirmed'  => '#d4edda',
                                'checked_in' => '#cce5ff',
                                'pending'    => '#fff3cd',
                                'cancelled'  => '#f8d7da',
                            ];
                            $bg = $status_colors[ $row->status ] ?? '#e9ecef';
                            $symbol = match ( strtoupper( $row->price_currency ) ) {
                                'USD'   => '$',
                                'GBP'   => '£',
                                'EUR'   => '€',
                                default => '₦',
                            };
                            ?>
                            <tr>
                                <td><?php echo absint( $row->id ); ?></td>
                                <td>
                                    <strong><?php echo esc_html( $row->attendee_name ); ?></strong><br>
                                    <a href="mailto:<?php echo esc_attr( $row->attendee_email ); ?>"><?php echo esc_html( $row->attendee_email ); ?></a>
                                </td>
                                <td>
                                    <?php if ( $row->event_title ) : ?>
                                        <strong><?php echo esc_html( $row->event_title ); ?></strong><br>
                                        <small><?php echo esc_html( $row->event_slug ); ?></small>
                                    <?php else : ?>
                                        <?php echo esc_html( $row->event_slug ); ?>
                                    <?php endif; ?>
                                </td>
                                <td><?php echo esc_html( $row->ticket_type_name ); ?></td>
                                <td>
                                    <?php echo esc_html( $symbol . number_format( $row->price_amount ) ); ?>
                                    <small style="color:#999;"><?php echo esc_html( $row->price_currency ); ?></small>
                                </td>
                                <td>
                                    <span style="font-family:monospace;font-size:11px;">
                                        <?php echo esc_html( $row->payment_gateway ); ?>
                                    </span>
                                </td>
                                <td>
                                    <code style="font-size:11px;"><?php echo esc_html( $row->ticket_code ); ?></code>
                                </td>
                                <td>
                                    <span style="background:<?php echo esc_attr( $bg ); ?>;padding:2px 8px;border-radius:3px;font-size:12px;">
                                        <?php echo esc_html( str_replace( '_', ' ', $row->status ) ); ?>
                                    </span>
                                    <?php if ( $row->checked_in_at ) : ?>
                                        <br><small style="color:#999;"><?php echo esc_html( wp_date( 'd M H:i', strtotime( $row->checked_in_at ) ) ); ?></small>
                                    <?php endif; ?>
                                </td>
                                <td><?php echo esc_html( wp_date( 'd M Y H:i', strtotime( $row->created_at ) ) ); ?></td>
                                <td style="white-space:nowrap;">
                                    <?php if ( 'confirmed' === $row->status ) : ?>
                                        <a href="<?php echo esc_url( wp_nonce_url( admin_url( 'admin-post.php?action=culture_checkin_ticket&id=' . $row->id . '&' . $filter_qs ), 'culture_checkin_ticket_' . $row->id ) ); ?>"
                                           style="color:#00547a;"
                                           onclick="return confirm('Check in this ticket?')">
                                            <?php esc_html_e( 'Check In', 'culture-community' ); ?>
                                        </a>
                                        &nbsp;
                                        <a href="<?php echo esc_url( wp_nonce_url( admin_url( 'admin-post.php?action=culture_cancel_ticket&id=' . $row->id . '&' . $filter_qs ), 'culture_cancel_ticket_' . $row->id ) ); ?>"
                                           style="color:#a00;"
                                           onclick="return confirm('Cancel this ticket?')">
                                            <?php esc_html_e( 'Cancel', 'culture-community' ); ?>
                                        </a>
                                    <?php elseif ( 'checked_in' === $row->status ) : ?>
                                        <span style="color:#999;font-size:12px;"><?php esc_html_e( 'Admitted', 'culture-community' ); ?></span>
                                    <?php elseif ( 'pending' === $row->status ) : ?>
                                        <span style="color:#999;font-size:12px;"><?php esc_html_e( 'Awaiting payment', 'culture-community' ); ?></span>
                                    <?php else : ?>
                                        <span style="color:#999;font-size:12px;">&mdash;</span>
                                    <?php endif; ?>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>

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

    // ── CSV Export ─────────────────────────────────────────────────────────────

    public static function handle_export(): void {
        if ( ! current_user_can( 'manage_options' ) ) wp_die( 'Unauthorised', 403 );
        check_admin_referer( 'culture_export_tickets' );

        global $wpdb;
        $table = $wpdb->prefix . 'culture_tickets';

        $event_slug = isset( $_GET['event_slug'] ) ? sanitize_text_field( $_GET['event_slug'] ) : '';
        $status     = isset( $_GET['status'] )     ? sanitize_text_field( $_GET['status'] )     : '';
        $gateway    = isset( $_GET['gateway'] )    ? sanitize_text_field( $_GET['gateway'] )    : '';

        $where  = '1=1';
        $values = [];
        if ( $event_slug ) { $where .= ' AND event_slug = %s';       $values[] = $event_slug; }
        if ( $status )     { $where .= ' AND status = %s';           $values[] = $status; }
        if ( $gateway )    { $where .= ' AND payment_gateway = %s';  $values[] = $gateway; }

        $sql  = "SELECT id, ticket_code, event_slug, event_title, ticket_type_slug, ticket_type_name, price_amount, price_currency, payment_gateway, payment_reference, payment_status, attendee_name, attendee_email, status, checked_in_at, created_at FROM {$table} WHERE {$where} ORDER BY created_at DESC";
        $rows = $values ? $wpdb->get_results( $wpdb->prepare( $sql, ...$values ), ARRAY_A ) : $wpdb->get_results( $sql, ARRAY_A );

        $filename = 'tickets-' . ( $event_slug ?: 'all' ) . '-' . gmdate( 'Y-m-d' ) . '.csv';

        header( 'Content-Type: text/csv; charset=UTF-8' );
        header( 'Content-Disposition: attachment; filename="' . $filename . '"' );
        header( 'Pragma: no-cache' );

        $out = fopen( 'php://output', 'w' );
        fputcsv( $out, [ 'ID', 'Ticket Code', 'Event Slug', 'Event Title', 'Type Slug', 'Type Name', 'Amount', 'Currency', 'Gateway', 'Payment Ref', 'Payment Status', 'Name', 'Email', 'Status', 'Checked In At', 'Created At' ] );
        foreach ( $rows as $row ) {
            fputcsv( $out, array_values( $row ) );
        }
        fclose( $out );
        exit;
    }

    // ── Check-in handler ────────────────────────────────────────────────────────

    public static function handle_checkin(): void {
        if ( ! current_user_can( 'manage_options' ) ) wp_die( 'Unauthorised', 403 );
        $id = absint( $_GET['id'] ?? 0 );
        check_admin_referer( 'culture_checkin_ticket_' . $id );

        global $wpdb;
        $table = $wpdb->prefix . 'culture_tickets';
        $wpdb->update(
            $table,
            [ 'status' => 'checked_in', 'checked_in_at' => current_time( 'mysql' ) ],
            [ 'id' => $id, 'status' => 'confirmed' ],
            [ '%s', '%s' ], [ '%d', '%s' ]
        );

        wp_safe_redirect( admin_url( 'admin.php?' . self::redirect_qs() ) );
        exit;
    }

    // ── Cancel handler ─────────────────────────────────────────────────────────

    public static function handle_cancel(): void {
        if ( ! current_user_can( 'manage_options' ) ) wp_die( 'Unauthorised', 403 );
        $id = absint( $_GET['id'] ?? 0 );
        check_admin_referer( 'culture_cancel_ticket_' . $id );

        global $wpdb;
        $table = $wpdb->prefix . 'culture_tickets';
        $wpdb->update( $table, [ 'status' => 'cancelled' ], [ 'id' => $id ], [ '%s' ], [ '%d' ] );

        wp_safe_redirect( admin_url( 'admin.php?' . self::redirect_qs() ) );
        exit;
    }

    private static function redirect_qs(): string {
        return http_build_query( array_filter( [
            'page'       => 'culture-ticket-sales',
            'event_slug' => sanitize_text_field( $_GET['event_slug'] ?? '' ),
            'status'     => sanitize_text_field( $_GET['status']     ?? '' ),
            'gateway'    => sanitize_text_field( $_GET['gateway']    ?? '' ),
        ] ) );
    }
}
