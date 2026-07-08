<?php
/**
 * Admin page for viewing Stoop clusters and appointing hosts
 * (§2.4.2 — admin-only operator tool, no member-facing trigger).
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Culture_Clusters_Admin {

    public static function init(): void {
        add_action( 'admin_menu', [ __CLASS__, 'register_menu' ] );
    }

    public static function register_menu(): void {
        add_submenu_page(
            'culture-community',
            __( 'Stoop Clusters', 'culture-community' ),
            __( 'Clusters', 'culture-community' ),
            'manage_options',
            'culture-clusters-manager',
            [ __CLASS__, 'render_page' ]
        );
    }

    // ── Render ────────────────────────────────────────────────────────────────

    public static function render_page(): void {
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( 'Unauthorised', 403 );
        }

        $status_filter = isset( $_GET['status'] ) ? sanitize_key( $_GET['status'] ) : '';

        $per_page     = 50;
        $current_page = max( 1, (int) ( $_GET['paged'] ?? 1 ) );

        $args = array(
            'post_type'      => 'culture_cluster',
            'post_status'    => 'publish',
            'posts_per_page' => $per_page,
            'paged'          => $current_page,
            'orderby'        => 'date',
            'order'          => 'DESC',
        );

        if ( $status_filter ) {
            $args['meta_query'] = array( array(
                'key'   => '_cluster_status',
                'value' => $status_filter,
            ) );
        }

        $query    = new WP_Query( $args );
        $clusters = array();
        foreach ( $query->posts as $post ) {
            $clusters[] = Culture_Clusters::get_cluster( $post->ID );
        }

        $total_pages = max( 1, (int) ceil( $query->found_posts / $per_page ) );

        $filter_qs = http_build_query( array_filter( array(
            'page'   => 'culture-clusters-manager',
            'status' => $status_filter,
        ) ) );

        ?>
        <div class="wrap">
            <h1 class="wp-heading-inline"><?php esc_html_e( 'Stoop Clusters', 'culture-community' ); ?></h1>
            <span style="margin-left:12px;color:#666;"><?php echo esc_html( number_format( $query->found_posts ) ); ?> total</span>
            <hr class="wp-header-end">

            <?php if ( isset( $_GET['appointed'] ) ) : ?>
                <div class="notice notice-success is-dismissible"><p><?php esc_html_e( 'Host appointed.', 'culture-community' ); ?></p></div>
            <?php elseif ( isset( $_GET['error'] ) ) : ?>
                <div class="notice notice-error is-dismissible"><p><?php echo esc_html( sanitize_text_field( wp_unslash( $_GET['error'] ) ) ); ?></p></div>
            <?php endif; ?>

            <form method="get" style="margin:16px 0;display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
                <input type="hidden" name="page" value="culture-clusters-manager">
                <select name="status" onchange="this.form.submit()">
                    <option value=""><?php esc_html_e( '— All Statuses —', 'culture-community' ); ?></option>
                    <option value="forming"  <?php selected( $status_filter, 'forming' ); ?>>Forming</option>
                    <option value="active"   <?php selected( $status_filter, 'active' ); ?>>Active</option>
                    <option value="archived" <?php selected( $status_filter, 'archived' ); ?>>Archived</option>
                </select>
            </form>

            <?php if ( empty( $clusters ) ) : ?>
                <p><?php esc_html_e( 'No Stoops found.', 'culture-community' ); ?></p>
            <?php else : ?>
                <table class="wp-list-table widefat fixed striped" style="margin-top:8px;">
                    <thead>
                        <tr>
                            <th style="width:40px;">#</th>
                            <th><?php esc_html_e( 'Name', 'culture-community' ); ?></th>
                            <th><?php esc_html_e( 'City', 'culture-community' ); ?></th>
                            <th><?php esc_html_e( 'Status', 'culture-community' ); ?></th>
                            <th><?php esc_html_e( 'Members', 'culture-community' ); ?></th>
                            <th><?php esc_html_e( 'Host', 'culture-community' ); ?></th>
                            <th><?php esc_html_e( 'Mechanism', 'culture-community' ); ?></th>
                            <th><?php esc_html_e( 'Appoint Host', 'culture-community' ); ?></th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ( $clusters as $cluster ) : ?>
                            <?php $member_ids = Culture_Clusters::get_active_member_ids( $cluster['id'] ); ?>
                            <tr>
                                <td><?php echo absint( $cluster['id'] ); ?></td>
                                <td><strong><?php echo esc_html( $cluster['name'] ); ?></strong></td>
                                <td><?php echo esc_html( $cluster['city'] ); ?></td>
                                <td>
                                    <span style="background:<?php echo $cluster['status'] === 'active' ? '#d4edda' : ( $cluster['status'] === 'archived' ? '#f8d7da' : '#fff3cd' ); ?>;padding:2px 8px;border-radius:3px;font-size:12px;">
                                        <?php echo esc_html( $cluster['status'] ); ?>
                                    </span>
                                </td>
                                <td><?php echo absint( $cluster['memberCount'] ); ?></td>
                                <td><?php echo esc_html( $cluster['hostName'] ?: '—' ); ?></td>
                                <td><?php echo esc_html( $cluster['hostMechanism'] ?: '—' ); ?></td>
                                <td>
                                    <?php if ( count( $member_ids ) > 0 ) : ?>
                                        <form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" style="display:flex;gap:6px;">
                                            <input type="hidden" name="action" value="culture_appoint_host">
                                            <input type="hidden" name="cluster_id" value="<?php echo absint( $cluster['id'] ); ?>">
                                            <input type="hidden" name="status" value="<?php echo esc_attr( $status_filter ); ?>">
                                            <?php wp_nonce_field( 'culture_appoint_host_' . $cluster['id'] ); ?>
                                            <select name="new_host_id" style="max-width:160px;">
                                                <?php foreach ( $member_ids as $member_id ) : ?>
                                                    <?php $member = get_userdata( $member_id ); ?>
                                                    <?php if ( $member ) : ?>
                                                        <option value="<?php echo absint( $member_id ); ?>" <?php selected( $member_id, $cluster['hostId'] ); ?>>
                                                            <?php echo esc_html( $member->display_name ); ?>
                                                        </option>
                                                    <?php endif; ?>
                                                <?php endforeach; ?>
                                            </select>
                                            <button type="submit" class="button button-small"><?php esc_html_e( 'Appoint', 'culture-community' ); ?></button>
                                        </form>
                                    <?php else : ?>
                                        <span style="color:#999;">—</span>
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

    // ── Appoint host handler ─────────────────────────────────────────────────

    public static function init_post_handlers(): void {
        add_action( 'admin_post_culture_appoint_host', [ __CLASS__, 'handle_appoint_host' ] );
    }

    public static function handle_appoint_host(): void {
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( 'Unauthorised', 403 );
        }

        $cluster_id = absint( $_POST['cluster_id'] ?? 0 );
        check_admin_referer( 'culture_appoint_host_' . $cluster_id );

        $new_host_id = absint( $_POST['new_host_id'] ?? 0 );
        $status      = sanitize_key( $_POST['status'] ?? '' );

        $result = Culture_Clusters::appoint_host( $cluster_id, $new_host_id );

        $redirect_args = array_filter( array(
            'page'   => 'culture-clusters-manager',
            'status' => $status,
        ) );

        if ( is_wp_error( $result ) ) {
            $redirect_args['error'] = $result->get_error_message();
        } else {
            $redirect_args['appointed'] = 1;
        }

        wp_safe_redirect( admin_url( 'admin.php?' . http_build_query( $redirect_args ) ) );
        exit;
    }
}
