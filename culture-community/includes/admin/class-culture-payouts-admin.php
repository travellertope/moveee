<?php
/**
 * Admin page for managing creator payout requests.
 *
 * Lists rows from wp_culture_payout_requests (joined to wp_users for the
 * creator's name/email).  Admins can trigger the Flutterwave transfer for
 * any pending or failed request with one click.
 *
 * Registered as a submenu under "Moveee Events" (culture-ticket-sales).
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Culture_Payouts_Admin {

    public static function init(): void {
        add_action( 'admin_menu',                               [ __CLASS__, 'register_menu' ] );
        add_action( 'admin_post_culture_process_payout',        [ __CLASS__, 'handle_process' ] );
        add_action( 'admin_post_culture_export_payouts',        [ __CLASS__, 'handle_export' ] );
    }

    public static function register_menu(): void {
        add_submenu_page(
            'culture-ticket-sales',
            __( 'Creator Payouts', 'culture-community' ),
            __( 'Creator Payouts', 'culture-community' ),
            'manage_options',
            'culture-creator-payouts',
            [ __CLASS__, 'render_page' ]
        );
    }

    /* ── List page ──────────────────────────────────────────────────────── */

    public static function render_page(): void {
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( esc_html__( 'Not allowed.', 'culture-community' ) );
        }

        $notice = '';
        if ( isset( $_GET['culture_msg'] ) ) {
            $msg_map = [
                'processed'   => [ 'success', 'Payout processed and transfer initiated.' ],
                'already_done' => [ 'warning', 'This request is already completed or processing.' ],
                'not_found'   => [ 'error',   'Payout request not found.' ],
                'flw_error'   => [ 'error',   'Flutterwave transfer failed: ' . sanitize_text_field( $_GET['culture_error'] ?? '' ) ],
                'flw_missing' => [ 'error',   'Flutterwave is not configured. Check your API keys in Settings → Payments.' ],
            ];
            if ( isset( $msg_map[ $_GET['culture_msg'] ] ) ) {
                [ $type, $text ] = $msg_map[ $_GET['culture_msg'] ];
                $notice = "<div class='notice notice-{$type} is-dismissible'><p>" . esc_html( $text ) . '</p></div>';
            }
        }

        // Filters
        $status_filter  = isset( $_GET['status'] )  ? sanitize_text_field( $_GET['status'] )  : '';
        $creator_filter = isset( $_GET['creator'] ) ? sanitize_text_field( $_GET['creator'] ) : '';

        global $wpdb;
        $r_table = $wpdb->prefix . 'culture_payout_requests';
        $e_table = $wpdb->prefix . 'culture_creator_earnings';

        $per_page     = 50;
        $current_page = max( 1, (int) ( $_GET['paged'] ?? 1 ) );
        $offset       = ( $current_page - 1 ) * $per_page;

        $where  = '1=1';
        $values = [];

        if ( $status_filter ) {
            $where   .= ' AND r.status = %s';
            $values[] = $status_filter;
        }
        if ( $creator_filter ) {
            $where   .= ' AND r.creator_id = %d';
            $values[] = (int) $creator_filter;
        }

        $count_sql = "SELECT COUNT(*) FROM {$r_table} r WHERE {$where}";
        $total     = (int) ( $values
            ? $wpdb->get_var( $wpdb->prepare( $count_sql, ...$values ) )
            : $wpdb->get_var( $count_sql ) );

        $rows_sql = "SELECT r.*,
                            u.display_name AS creator_name,
                            u.user_email   AS creator_email
                     FROM {$r_table} r
                     LEFT JOIN {$wpdb->users} u ON u.ID = r.creator_id
                     WHERE {$where}
                     ORDER BY r.created_at DESC
                     LIMIT %d OFFSET %d";

        $all_values = array_merge( $values, [ $per_page, $offset ] );
        $rows       = $wpdb->get_results(
            $values
                ? $wpdb->prepare( $rows_sql, ...$all_values )
                : $wpdb->prepare( $rows_sql, $per_page, $offset ),
            ARRAY_A
        );

        $total_pages = max( 1, (int) ceil( $total / $per_page ) );

        // Pending balance totals (available across all creators)
        $pending_total = (float) $wpdb->get_var(
            "SELECT SUM(amount) FROM {$r_table} WHERE status IN ('pending','processing')"
        );

        $status_colors = [
            'pending'    => '#fff3cd',
            'processing' => '#cce5ff',
            'completed'  => '#d4edda',
            'failed'     => '#f8d7da',
        ];

        ?>
        <div class="wrap">
            <h1 class="wp-heading-inline"><?php esc_html_e( 'Creator Payouts', 'culture-community' ); ?></h1>
            <span style="margin-left:12px;color:#666;">
                <?php echo esc_html( number_format( $total ) ); ?> request<?php echo $total !== 1 ? 's' : ''; ?>
                <?php if ( $pending_total > 0 ) : ?>
                    &nbsp;·&nbsp; ₦<?php echo esc_html( number_format( $pending_total, 2 ) ); ?> pending/processing
                <?php endif; ?>
            </span>
            <hr class="wp-header-end">

            <?php echo wp_kses_post( $notice ); ?>

            <!-- Filters -->
            <form method="get" style="margin:16px 0;display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
                <input type="hidden" name="page" value="culture-creator-payouts">

                <select name="status" onchange="this.form.submit()">
                    <option value=""><?php esc_html_e( '— All Statuses —', 'culture-community' ); ?></option>
                    <option value="pending"    <?php selected( $status_filter, 'pending' ); ?>>Pending</option>
                    <option value="processing" <?php selected( $status_filter, 'processing' ); ?>>Processing</option>
                    <option value="completed"  <?php selected( $status_filter, 'completed' ); ?>>Completed</option>
                    <option value="failed"     <?php selected( $status_filter, 'failed' ); ?>>Failed</option>
                </select>

                <?php
                $filter_qs = http_build_query( array_filter( [
                    'page'    => 'culture-creator-payouts',
                    'status'  => $status_filter,
                    'creator' => $creator_filter,
                ] ) );
                ?>
                <a href="<?php echo esc_url( admin_url( 'admin-post.php?' . $filter_qs . '&action=culture_export_payouts&_wpnonce=' . wp_create_nonce( 'culture_export_payouts' ) ) ); ?>"
                   class="button">
                    <?php esc_html_e( 'Export CSV', 'culture-community' ); ?>
                </a>
            </form>

            <?php if ( empty( $rows ) ) : ?>
                <p><?php esc_html_e( 'No payout requests found.', 'culture-community' ); ?></p>
            <?php else : ?>
                <table class="wp-list-table widefat fixed striped" style="margin-top:8px;">
                    <thead>
                        <tr>
                            <th style="width:40px;">#</th>
                            <th><?php esc_html_e( 'Creator', 'culture-community' ); ?></th>
                            <th><?php esc_html_e( 'Amount', 'culture-community' ); ?></th>
                            <th><?php esc_html_e( 'Bank', 'culture-community' ); ?></th>
                            <th><?php esc_html_e( 'Account', 'culture-community' ); ?></th>
                            <th><?php esc_html_e( 'Status', 'culture-community' ); ?></th>
                            <th><?php esc_html_e( 'FLW Transfer', 'culture-community' ); ?></th>
                            <th><?php esc_html_e( 'Requested', 'culture-community' ); ?></th>
                            <th><?php esc_html_e( 'Processed', 'culture-community' ); ?></th>
                            <th><?php esc_html_e( 'Actions', 'culture-community' ); ?></th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ( $rows as $row ) : ?>
                            <?php
                            $bg        = $status_colors[ $row['status'] ] ?? '#e9ecef';
                            $can_process = in_array( $row['status'], [ 'pending', 'failed' ], true );
                            $symbol    = 'NGN' === strtoupper( $row['currency'] ) ? '₦' : esc_html( $row['currency'] ) . ' ';
                            ?>
                            <tr style="background:<?php echo esc_attr( $bg ); ?>;">
                                <td><?php echo absint( $row['id'] ); ?></td>
                                <td>
                                    <strong><?php echo esc_html( $row['creator_name'] ?: "User #{$row['creator_id']}" ); ?></strong><br>
                                    <a href="mailto:<?php echo esc_attr( $row['creator_email'] ); ?>"
                                       style="font-size:11px;">
                                        <?php echo esc_html( $row['creator_email'] ); ?>
                                    </a><br>
                                    <a href="<?php echo esc_url( add_query_arg( [ 'page' => 'culture-creator-payouts', 'creator' => $row['creator_id'] ], admin_url( 'admin.php' ) ) ); ?>"
                                       style="font-size:11px;color:#999;">
                                        <?php esc_html_e( 'Filter by creator', 'culture-community' ); ?>
                                    </a>
                                </td>
                                <td>
                                    <strong style="font-size:14px;">
                                        <?php echo esc_html( $symbol . number_format( (float) $row['amount'], 2 ) ); ?>
                                    </strong><br>
                                    <small style="color:#999;"><?php echo esc_html( $row['currency'] ); ?></small>
                                </td>
                                <td>
                                    <code style="font-size:11px;"><?php echo esc_html( $row['bank_code'] ); ?></code>
                                </td>
                                <td>
                                    <strong><?php echo esc_html( $row['account_name'] ); ?></strong><br>
                                    <code style="font-size:11px;"><?php echo esc_html( $row['account_number'] ); ?></code>
                                </td>
                                <td>
                                    <span style="display:inline-block;padding:2px 8px;border-radius:3px;
                                                 font-size:11px;font-weight:600;text-transform:uppercase;
                                                 background:<?php echo esc_attr( $bg ); ?>;border:1px solid rgba(0,0,0,0.1);">
                                        <?php echo esc_html( $row['status'] ); ?>
                                    </span>
                                    <?php if ( $row['failure_reason'] ) : ?>
                                        <br><small style="color:#c00;font-size:10px;"><?php echo esc_html( $row['failure_reason'] ); ?></small>
                                    <?php endif; ?>
                                </td>
                                <td>
                                    <?php if ( $row['flw_transfer_id'] ) : ?>
                                        <code style="font-size:11px;"><?php echo absint( $row['flw_transfer_id'] ); ?></code>
                                    <?php elseif ( $row['transfer_reference'] ) : ?>
                                        <small style="color:#999;font-size:10px;"><?php echo esc_html( $row['transfer_reference'] ); ?></small>
                                    <?php else : ?>
                                        <span style="color:#ccc;">—</span>
                                    <?php endif; ?>
                                </td>
                                <td style="font-size:12px;">
                                    <?php echo esc_html( date_i18n( 'd M Y', strtotime( $row['created_at'] ) ) ); ?>
                                </td>
                                <td style="font-size:12px;">
                                    <?php echo $row['processed_at']
                                        ? esc_html( date_i18n( 'd M Y', strtotime( $row['processed_at'] ) ) )
                                        : '<span style="color:#ccc;">—</span>'; ?>
                                </td>
                                <td>
                                    <?php if ( $can_process ) : ?>
                                        <form method="post"
                                              action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>"
                                              onsubmit="return confirm('Process payout of <?php echo esc_js( $symbol . number_format( (float) $row['amount'], 2 ) ); ?> to <?php echo esc_js( $row['account_name'] ); ?>?');">
                                            <?php wp_nonce_field( 'culture_process_payout_' . $row['id'], '_wpnonce' ); ?>
                                            <input type="hidden" name="action"     value="culture_process_payout">
                                            <input type="hidden" name="request_id" value="<?php echo absint( $row['id'] ); ?>">
                                            <input type="hidden" name="_redirect_status" value="<?php echo esc_attr( $status_filter ); ?>">
                                            <button type="submit" class="button button-primary" style="font-size:11px;padding:2px 8px;">
                                                <?php esc_html_e( 'Process Payout', 'culture-community' ); ?>
                                            </button>
                                        </form>
                                    <?php else : ?>
                                        <span style="color:#ccc;font-size:11px;">—</span>
                                    <?php endif; ?>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>

                <!-- Pagination -->
                <?php if ( $total_pages > 1 ) : ?>
                    <div class="tablenav bottom" style="margin-top:12px;">
                        <div class="tablenav-pages">
                            <?php
                            $base_url = add_query_arg( [
                                'page'    => 'culture-creator-payouts',
                                'status'  => $status_filter,
                                'creator' => $creator_filter,
                            ], admin_url( 'admin.php' ) );
                            for ( $p = 1; $p <= $total_pages; $p++ ) :
                                $url = add_query_arg( 'paged', $p, $base_url );
                                if ( $p === $current_page ) :
                                    echo '<span class="paging-input" style="margin:0 3px;font-weight:bold;">' . esc_html( $p ) . '</span>';
                                else :
                                    echo '<a class="page-numbers" style="margin:0 3px;" href="' . esc_url( $url ) . '">' . esc_html( $p ) . '</a>';
                                endif;
                            endfor;
                            ?>
                        </div>
                    </div>
                <?php endif; ?>
            <?php endif; ?>
        </div>
        <?php
    }

    /* ── Process payout (admin-post handler) ────────────────────────────── */

    public static function handle_process(): void {
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( esc_html__( 'Not allowed.', 'culture-community' ) );
        }

        $request_id     = absint( $_POST['request_id'] ?? 0 );
        $redirect_status = sanitize_text_field( $_POST['_redirect_status'] ?? '' );

        check_admin_referer( 'culture_process_payout_' . $request_id );

        $redirect = add_query_arg(
            [ 'page' => 'culture-creator-payouts', 'status' => $redirect_status ],
            admin_url( 'admin.php' )
        );

        if ( ! $request_id ) {
            wp_safe_redirect( add_query_arg( 'culture_msg', 'not_found', $redirect ) );
            exit;
        }

        if ( ! class_exists( 'Culture_Creator_Earnings' ) ) {
            wp_safe_redirect( add_query_arg( 'culture_msg', 'flw_missing', $redirect ) );
            exit;
        }

        $result = Culture_Creator_Earnings::process_payout( $request_id );

        if ( is_wp_error( $result ) ) {
            $code = $result->get_error_code();
            if ( 'invalid_status' === $code ) {
                wp_safe_redirect( add_query_arg( 'culture_msg', 'already_done', $redirect ) );
            } elseif ( 'flutterwave_unconfigured' === $code ) {
                wp_safe_redirect( add_query_arg( 'culture_msg', 'flw_missing', $redirect ) );
            } else {
                wp_safe_redirect( add_query_arg( [
                    'culture_msg'   => 'flw_error',
                    'culture_error' => rawurlencode( $result->get_error_message() ),
                ], $redirect ) );
            }
            exit;
        }

        wp_safe_redirect( add_query_arg( 'culture_msg', 'processed', $redirect ) );
        exit;
    }

    /* ── CSV export ──────────────────────────────────────────────────────── */

    public static function handle_export(): void {
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( esc_html__( 'Not allowed.', 'culture-community' ) );
        }
        check_admin_referer( 'culture_export_payouts' );

        global $wpdb;
        $r_table = $wpdb->prefix . 'culture_payout_requests';

        $status_filter  = isset( $_GET['status'] )  ? sanitize_text_field( $_GET['status'] )  : '';
        $creator_filter = isset( $_GET['creator'] ) ? sanitize_text_field( $_GET['creator'] ) : '';

        $where  = '1=1';
        $values = [];
        if ( $status_filter )  { $where .= ' AND r.status = %s';     $values[] = $status_filter; }
        if ( $creator_filter ) { $where .= ' AND r.creator_id = %d'; $values[] = (int) $creator_filter; }

        $sql  = "SELECT r.*, u.display_name AS creator_name, u.user_email AS creator_email
                 FROM {$r_table} r
                 LEFT JOIN {$wpdb->users} u ON u.ID = r.creator_id
                 WHERE {$where}
                 ORDER BY r.created_at DESC";
        $rows = $values
            ? $wpdb->get_results( $wpdb->prepare( $sql, ...$values ), ARRAY_A )
            : $wpdb->get_results( $sql, ARRAY_A );

        header( 'Content-Type: text/csv; charset=UTF-8' );
        header( 'Content-Disposition: attachment; filename="creator-payouts-' . date( 'Y-m-d' ) . '.csv"' );
        header( 'Pragma: no-cache' );

        $out = fopen( 'php://output', 'w' );
        fprintf( $out, chr( 0xEF ) . chr( 0xBB ) . chr( 0xBF ) ); // UTF-8 BOM

        fputcsv( $out, [ 'ID', 'Creator', 'Email', 'Amount', 'Currency', 'Bank Code', 'Account Number', 'Account Name', 'Status', 'FLW Transfer ID', 'Reference', 'Failure Reason', 'Requested At', 'Processed At' ] );

        foreach ( (array) $rows as $row ) {
            fputcsv( $out, [
                $row['id'],
                $row['creator_name'],
                $row['creator_email'],
                $row['amount'],
                $row['currency'],
                $row['bank_code'],
                $row['account_number'],
                $row['account_name'],
                $row['status'],
                $row['flw_transfer_id'] ?? '',
                $row['transfer_reference'] ?? '',
                $row['failure_reason'] ?? '',
                $row['created_at'],
                $row['processed_at'] ?? '',
            ] );
        }

        fclose( $out );
        exit;
    }
}
