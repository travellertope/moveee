<?php
/**
 * "Moveee Hubs" admin page — the first real WP Admin manager for
 * culture_hub posts. Before this, Hubs only had the bare native WP
 * post-list/edit screen (title + a generic Custom Fields box, no real UI
 * for description/cover/category/allowed templates/members).
 *
 * Every mutation here goes through Culture_Hubs::admin_*() — a parallel,
 * un-gated set of methods added alongside this page specifically because
 * every existing member-facing method (update(), archive(), appoint_mod(),
 * remove_member(), etc.) requires the *requester* to hold 'owner'/'mod' on
 * the Hub, which the 11 official/platform-owned Hubs never have (no owner
 * row at all) — so an admin couldn't manage those through the normal API.
 * See that class's own "Admin-only operations" section for the full
 * reasoning. This file is the only caller of those admin_*() methods and is
 * responsible for the current_user_can('manage_options') check they rely on.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Culture_Hubs_Admin {

    public static function init(): void {
        add_action( 'admin_menu', array( __CLASS__, 'register_menu' ) );
        add_action( 'admin_post_culture_hub_admin_create',        array( __CLASS__, 'handle_create' ) );
        add_action( 'admin_post_culture_hub_admin_update',        array( __CLASS__, 'handle_update' ) );
        add_action( 'admin_post_culture_hub_admin_set_status',    array( __CLASS__, 'handle_set_status' ) );
        add_action( 'admin_post_culture_hub_admin_add_member',    array( __CLASS__, 'handle_add_member' ) );
        add_action( 'admin_post_culture_hub_admin_set_role',      array( __CLASS__, 'handle_set_role' ) );
        add_action( 'admin_post_culture_hub_admin_remove_member', array( __CLASS__, 'handle_remove_member' ) );
    }

    /**
     * Registers the top-level "Moveee Hubs" admin menu, same anchor-slug
     * pattern as Newsletters/Events/Literary (see the "WP Admin menu
     * structure" note in CLAUDE.md).
     */
    public static function register_menu(): void {
        add_menu_page(
            __( 'Moveee Hubs', 'culture-community' ),
            __( 'Moveee Hubs', 'culture-community' ),
            'manage_options',
            'culture-hubs-manager',
            array( __CLASS__, 'render_page' ),
            'dashicons-networking',
            34
        );

        add_submenu_page(
            'culture-hubs-manager',
            __( 'Hubs', 'culture-community' ),
            __( 'Hubs', 'culture-community' ),
            'manage_options',
            'culture-hubs-manager',
            array( __CLASS__, 'render_page' )
        );
    }

    // ── Render ───────────────────────────────────────────────────────────

    public static function render_page(): void {
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( esc_html__( 'Permission denied.', 'culture-community' ) );
        }

        $hub_id = absint( $_GET['hub_id'] ?? 0 );
        if ( $hub_id ) {
            self::render_detail_page( $hub_id );
            return;
        }
        self::render_list_page();
    }

    private static function render_list_page(): void {
        $status_filter   = isset( $_GET['status'] ) ? sanitize_key( $_GET['status'] ) : '';
        $category_filter = isset( $_GET['category'] ) ? sanitize_text_field( wp_unslash( $_GET['category'] ) ) : '';
        $official_only   = isset( $_GET['official'] ) && '1' === $_GET['official'];
        $search          = isset( $_GET['s'] ) ? sanitize_text_field( wp_unslash( $_GET['s'] ) ) : '';

        $per_page     = 50;
        $current_page = max( 1, (int) ( $_GET['paged'] ?? 1 ) );

        $args = array(
            'post_type'      => 'culture_hub',
            'post_status'    => 'publish',
            'posts_per_page' => $per_page,
            'paged'          => $current_page,
            'orderby'        => 'date',
            'order'          => 'DESC',
        );
        if ( $search ) {
            $args['s'] = $search;
        }

        $meta_query = array();
        if ( $status_filter ) {
            $meta_query[] = array( 'key' => '_hub_status', 'value' => $status_filter );
        }
        if ( $category_filter ) {
            $meta_query[] = array( 'key' => '_hub_category', 'value' => $category_filter );
        }
        if ( $meta_query ) {
            $args['meta_query'] = $meta_query;
        }

        $query = new WP_Query( $args );
        $hubs  = array();
        foreach ( $query->posts as $post ) {
            $hub = Culture_Hubs::get_hub( $post->ID );
            if ( $hub && ( ! $official_only || $hub['isOfficial'] ) ) {
                $hubs[] = $hub;
            }
        }

        $total_pages = max( 1, (int) ceil( $query->found_posts / $per_page ) );

        $notice = '';
        if ( isset( $_GET['created'] ) ) {
            $notice = __( 'Hub created.', 'culture-community' );
        } elseif ( isset( $_GET['status_updated'] ) ) {
            $notice = __( 'Hub status updated.', 'culture-community' );
        }
        $error = isset( $_GET['error'] ) ? sanitize_text_field( wp_unslash( $_GET['error'] ) ) : '';

        ?>
        <div class="wrap">
            <h1 class="wp-heading-inline"><?php esc_html_e( 'Moveee Hubs', 'culture-community' ); ?></h1>
            <span style="margin-left:12px;color:#666;"><?php echo esc_html( number_format( $query->found_posts ) ); ?> total</span>
            <hr class="wp-header-end">

            <?php if ( $notice ) : ?>
                <div class="notice notice-success is-dismissible"><p><?php echo esc_html( $notice ); ?></p></div>
            <?php endif; ?>
            <?php if ( $error ) : ?>
                <div class="notice notice-error is-dismissible"><p><?php echo esc_html( $error ); ?></p></div>
            <?php endif; ?>

            <div style="background:#fff;border:1px solid #c3c4c7;border-radius:4px;padding:20px 24px;max-width:640px;margin:16px 0 28px;">
                <h2 style="margin:0 0 14px;font-size:14px;font-weight:600;"><?php esc_html_e( 'Create a New Hub', 'culture-community' ); ?></h2>
                <form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
                    <input type="hidden" name="action" value="culture_hub_admin_create">
                    <?php wp_nonce_field( 'culture_hub_admin_create' ); ?>
                    <table class="form-table" style="margin:0;">
                        <tr>
                            <th style="padding:8px 16px 8px 0;font-size:13px;width:120px;"><?php esc_html_e( 'Name', 'culture-community' ); ?></th>
                            <td><input type="text" name="name" class="regular-text" required></td>
                        </tr>
                        <tr>
                            <th style="padding:8px 16px 8px 0;font-size:13px;"><?php esc_html_e( 'Description', 'culture-community' ); ?></th>
                            <td><textarea name="description" class="large-text" rows="2" required></textarea></td>
                        </tr>
                        <tr>
                            <th style="padding:8px 16px 8px 0;font-size:13px;"><?php esc_html_e( 'Category', 'culture-community' ); ?></th>
                            <td>
                                <select name="category">
                                    <option value=""><?php esc_html_e( '— None —', 'culture-community' ); ?></option>
                                    <?php foreach ( Culture_Hubs::categories() as $cat ) : ?>
                                        <option value="<?php echo esc_attr( $cat ); ?>"><?php echo esc_html( $cat ); ?></option>
                                    <?php endforeach; ?>
                                </select>
                            </td>
                        </tr>
                        <tr>
                            <th style="padding:8px 16px 8px 0;font-size:13px;"><?php esc_html_e( 'Owner', 'culture-community' ); ?></th>
                            <td>
                                <input type="text" name="owner" class="regular-text" placeholder="<?php esc_attr_e( 'Email or username', 'culture-community' ); ?>" required>
                                <p style="font-size:11px;color:#646970;margin:4px 0 0;"><?php esc_html_e( 'Must be an existing WordPress user — they become the Hub owner.', 'culture-community' ); ?></p>
                            </td>
                        </tr>
                    </table>
                    <div style="margin-top:14px;">
                        <button type="submit" class="button button-primary"><?php esc_html_e( 'Create Hub', 'culture-community' ); ?></button>
                    </div>
                </form>
            </div>

            <form method="get" style="margin:16px 0;display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
                <input type="hidden" name="page" value="culture-hubs-manager">
                <input type="search" name="s" value="<?php echo esc_attr( $search ); ?>" placeholder="<?php esc_attr_e( 'Search Hub name…', 'culture-community' ); ?>">
                <select name="status" onchange="this.form.submit()">
                    <option value=""><?php esc_html_e( '— All Statuses —', 'culture-community' ); ?></option>
                    <option value="active" <?php selected( $status_filter, 'active' ); ?>><?php esc_html_e( 'Active', 'culture-community' ); ?></option>
                    <option value="archived" <?php selected( $status_filter, 'archived' ); ?>><?php esc_html_e( 'Archived', 'culture-community' ); ?></option>
                </select>
                <select name="category" onchange="this.form.submit()">
                    <option value=""><?php esc_html_e( '— All Categories —', 'culture-community' ); ?></option>
                    <?php foreach ( Culture_Hubs::categories() as $cat ) : ?>
                        <option value="<?php echo esc_attr( $cat ); ?>" <?php selected( $category_filter, $cat ); ?>><?php echo esc_html( $cat ); ?></option>
                    <?php endforeach; ?>
                </select>
                <label style="display:flex;align-items:center;gap:4px;">
                    <input type="checkbox" name="official" value="1" <?php checked( $official_only ); ?> onchange="this.form.submit()">
                    <?php esc_html_e( 'Official only', 'culture-community' ); ?>
                </label>
                <button type="submit" class="button"><?php esc_html_e( 'Filter', 'culture-community' ); ?></button>
            </form>

            <?php if ( empty( $hubs ) ) : ?>
                <p><?php esc_html_e( 'No Hubs found.', 'culture-community' ); ?></p>
            <?php else : ?>
                <table class="wp-list-table widefat fixed striped">
                    <thead>
                        <tr>
                            <th><?php esc_html_e( 'Name', 'culture-community' ); ?></th>
                            <th style="width:110px;"><?php esc_html_e( 'Category', 'culture-community' ); ?></th>
                            <th style="width:80px;"><?php esc_html_e( 'Status', 'culture-community' ); ?></th>
                            <th style="width:80px;"><?php esc_html_e( 'Members', 'culture-community' ); ?></th>
                            <th style="width:70px;"><?php esc_html_e( 'Posts', 'culture-community' ); ?></th>
                            <th style="width:130px;"><?php esc_html_e( 'Owner', 'culture-community' ); ?></th>
                            <th style="width:110px;"><?php esc_html_e( 'Newsletter List', 'culture-community' ); ?></th>
                            <th style="width:160px;"><?php esc_html_e( 'Actions', 'culture-community' ); ?></th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ( $hubs as $hub ) : ?>
                            <?php
                            $owner_id   = self::get_owner_id( $hub['id'] );
                            $owner_user = $owner_id ? get_userdata( $owner_id ) : null;
                            $list       = class_exists( 'Culture_Newsletter_Lists' ) ? Culture_Newsletter_Lists::get_for_hub( $hub['id'] ) : null;
                            ?>
                            <tr>
                                <td>
                                    <strong>
                                        <a href="<?php echo esc_url( add_query_arg( array( 'page' => 'culture-hubs-manager', 'hub_id' => $hub['id'] ), admin_url( 'admin.php' ) ) ); ?>">
                                            <?php echo esc_html( $hub['name'] ); ?>
                                        </a>
                                    </strong>
                                    <?php if ( $hub['isOfficial'] ) : ?>
                                        <span style="font-size:10px;color:#7a6f5c;display:block;"><?php esc_html_e( 'Official', 'culture-community' ); ?></span>
                                    <?php endif; ?>
                                </td>
                                <td><?php echo esc_html( $hub['category'] ?: '—' ); ?></td>
                                <td>
                                    <span style="background:<?php echo 'active' === $hub['status'] ? '#d4edda' : '#f8d7da'; ?>;padding:2px 8px;border-radius:3px;font-size:12px;">
                                        <?php echo esc_html( ucfirst( $hub['status'] ) ); ?>
                                    </span>
                                </td>
                                <td><?php echo absint( $hub['memberCount'] ); ?></td>
                                <td><?php echo absint( $hub['postCount'] ); ?></td>
                                <td><?php echo $owner_user ? esc_html( $owner_user->display_name ) : '<span style="color:#999;">—</span>'; ?></td>
                                <td>
                                    <?php if ( $list ) : ?>
                                        <?php echo esc_html( number_format( Culture_Newsletter_Lists::subscriber_count( $list['id'] ) ) ); ?>
                                        subs
                                    <?php else : ?>
                                        <span style="color:#999;">—</span>
                                    <?php endif; ?>
                                </td>
                                <td>
                                    <div style="display:flex;gap:6px;flex-wrap:wrap;">
                                        <a href="<?php echo esc_url( add_query_arg( array( 'page' => 'culture-hubs-manager', 'hub_id' => $hub['id'] ), admin_url( 'admin.php' ) ) ); ?>" class="button button-small">
                                            <?php esc_html_e( 'Manage', 'culture-community' ); ?>
                                        </a>
                                        <form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
                                            <input type="hidden" name="action" value="culture_hub_admin_set_status">
                                            <input type="hidden" name="hub_id" value="<?php echo esc_attr( $hub['id'] ); ?>">
                                            <input type="hidden" name="status" value="<?php echo 'active' === $hub['status'] ? 'archived' : 'active'; ?>">
                                            <input type="hidden" name="redirect" value="list">
                                            <?php wp_nonce_field( 'culture_hub_admin_set_status_' . $hub['id'] ); ?>
                                            <button type="submit" class="button button-small">
                                                <?php echo 'active' === $hub['status'] ? esc_html__( 'Archive', 'culture-community' ) : esc_html__( 'Reactivate', 'culture-community' ); ?>
                                            </button>
                                        </form>
                                    </div>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>

                <?php if ( $total_pages > 1 ) : ?>
                    <div class="tablenav bottom" style="margin-top:12px;">
                        <div class="tablenav-pages">
                            <?php
                            $base_args = array_filter( array(
                                'page'     => 'culture-hubs-manager',
                                'status'   => $status_filter,
                                'category' => $category_filter,
                                'official' => $official_only ? '1' : '',
                                's'        => $search,
                            ) );
                            for ( $p = 1; $p <= $total_pages; $p++ ) :
                                $page_args           = $base_args;
                                $page_args['paged']  = $p;
                                if ( $p === $current_page ) : ?>
                                    <span class="current"><?php echo (int) $p; ?></span>
                                <?php else : ?>
                                    <a class="page-numbers" href="<?php echo esc_url( admin_url( 'admin.php?' . http_build_query( $page_args ) ) ); ?>"><?php echo (int) $p; ?></a>
                                <?php endif;
                            endfor; ?>
                        </div>
                    </div>
                <?php endif; ?>
            <?php endif; ?>
        </div>
        <?php
    }

    private static function render_detail_page( int $hub_id ): void {
        $hub = Culture_Hubs::get_hub( $hub_id );
        if ( ! $hub ) {
            wp_die( esc_html__( 'Hub not found.', 'culture-community' ) );
        }

        $owner_id = self::get_owner_id( $hub_id );
        $list     = class_exists( 'Culture_Newsletter_Lists' ) ? Culture_Newsletter_Lists::get_for_hub( $hub_id ) : null;

        $mem_page = max( 1, (int) ( $_GET['mpaged'] ?? 1 ) );
        $members  = Culture_Hubs::list_members( $hub_id, $mem_page, 50 );

        $notice = '';
        if ( isset( $_GET['updated'] ) ) {
            $notice = __( 'Hub updated.', 'culture-community' );
        } elseif ( isset( $_GET['member_added'] ) ) {
            $notice = __( 'Member added.', 'culture-community' );
        } elseif ( isset( $_GET['role_updated'] ) ) {
            $notice = __( 'Member role updated.', 'culture-community' );
        } elseif ( isset( $_GET['member_removed'] ) ) {
            $notice = __( 'Member removed.', 'culture-community' );
        } elseif ( isset( $_GET['status_updated'] ) ) {
            $notice = __( 'Hub status updated.', 'culture-community' );
        }
        $error = isset( $_GET['error'] ) ? sanitize_text_field( wp_unslash( $_GET['error'] ) ) : '';

        $back_url = admin_url( 'admin.php?page=culture-hubs-manager' );
        ?>
        <div class="wrap">
            <h1 class="wp-heading-inline"><?php echo esc_html( $hub['name'] ); ?></h1>
            <a href="<?php echo esc_url( $back_url ); ?>" class="page-title-action"><?php esc_html_e( '← All Hubs', 'culture-community' ); ?></a>
            <hr class="wp-header-end">

            <?php if ( $notice ) : ?>
                <div class="notice notice-success is-dismissible"><p><?php echo esc_html( $notice ); ?></p></div>
            <?php endif; ?>
            <?php if ( $error ) : ?>
                <div class="notice notice-error is-dismissible"><p><?php echo esc_html( $error ); ?></p></div>
            <?php endif; ?>

            <div style="display:flex;gap:24px;align-items:flex-start;flex-wrap:wrap;">

                <div style="background:#fff;border:1px solid #c3c4c7;border-radius:4px;padding:20px 24px;flex:1;min-width:420px;max-width:600px;">
                    <h2 style="margin:0 0 14px;font-size:14px;font-weight:600;"><?php esc_html_e( 'Details', 'culture-community' ); ?></h2>
                    <form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
                        <input type="hidden" name="action" value="culture_hub_admin_update">
                        <input type="hidden" name="hub_id" value="<?php echo esc_attr( $hub_id ); ?>">
                        <?php wp_nonce_field( 'culture_hub_admin_update_' . $hub_id ); ?>
                        <table class="form-table" style="margin:0;">
                            <tr>
                                <th style="padding:8px 16px 8px 0;font-size:13px;width:120px;"><?php esc_html_e( 'Name', 'culture-community' ); ?></th>
                                <td><input type="text" name="name" class="regular-text" required value="<?php echo esc_attr( $hub['name'] ); ?>"></td>
                            </tr>
                            <tr>
                                <th style="padding:8px 16px 8px 0;font-size:13px;"><?php esc_html_e( 'Description', 'culture-community' ); ?></th>
                                <td><textarea name="description" class="large-text" rows="3" required><?php echo esc_textarea( $hub['description'] ); ?></textarea></td>
                            </tr>
                            <tr>
                                <th style="padding:8px 16px 8px 0;font-size:13px;"><?php esc_html_e( 'Cover Image URL', 'culture-community' ); ?></th>
                                <td><input type="url" name="coverImageUrl" class="large-text" value="<?php echo esc_attr( $hub['coverImageUrl'] ); ?>"></td>
                            </tr>
                            <tr>
                                <th style="padding:8px 16px 8px 0;font-size:13px;"><?php esc_html_e( 'Category', 'culture-community' ); ?></th>
                                <td>
                                    <select name="category">
                                        <option value=""><?php esc_html_e( '— None —', 'culture-community' ); ?></option>
                                        <?php foreach ( Culture_Hubs::categories() as $cat ) : ?>
                                            <option value="<?php echo esc_attr( $cat ); ?>" <?php selected( $hub['category'], $cat ); ?>><?php echo esc_html( $cat ); ?></option>
                                        <?php endforeach; ?>
                                    </select>
                                </td>
                            </tr>
                            <tr>
                                <th style="padding:8px 16px 8px 0;font-size:13px;vertical-align:top;"><?php esc_html_e( 'Allowed Post Types', 'culture-community' ); ?></th>
                                <td>
                                    <?php foreach ( Culture_Hubs::ALLOWED_TEMPLATES as $tpl ) : ?>
                                        <label style="display:inline-flex;align-items:center;gap:6px;margin-right:14px;margin-bottom:6px;">
                                            <input type="checkbox" name="allowedTemplates[]" value="<?php echo esc_attr( $tpl ); ?>" <?php checked( in_array( $tpl, $hub['allowedTemplates'], true ) ); ?>>
                                            <?php echo esc_html( ucwords( str_replace( '-', ' ', $tpl ) ) ); ?>
                                        </label>
                                    <?php endforeach; ?>
                                </td>
                            </tr>
                        </table>
                        <div style="margin-top:14px;">
                            <button type="submit" class="button button-primary"><?php esc_html_e( 'Save Changes', 'culture-community' ); ?></button>
                        </div>
                    </form>

                    <hr style="margin:20px 0;">

                    <form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" style="display:flex;gap:10px;align-items:center;">
                        <input type="hidden" name="action" value="culture_hub_admin_set_status">
                        <input type="hidden" name="hub_id" value="<?php echo esc_attr( $hub_id ); ?>">
                        <input type="hidden" name="status" value="<?php echo 'active' === $hub['status'] ? 'archived' : 'active'; ?>">
                        <input type="hidden" name="redirect" value="detail">
                        <?php wp_nonce_field( 'culture_hub_admin_set_status_' . $hub_id ); ?>
                        <span style="font-size:13px;">
                            <?php esc_html_e( 'Status:', 'culture-community' ); ?>
                            <strong><?php echo esc_html( ucfirst( $hub['status'] ) ); ?></strong>
                        </span>
                        <button type="submit" class="button">
                            <?php echo 'active' === $hub['status'] ? esc_html__( 'Archive this Hub', 'culture-community' ) : esc_html__( 'Reactivate this Hub', 'culture-community' ); ?>
                        </button>
                    </form>
                </div>

                <div style="background:#fff;border:1px solid #c3c4c7;border-radius:4px;padding:20px 24px;min-width:260px;">
                    <h2 style="margin:0 0 14px;font-size:14px;font-weight:600;"><?php esc_html_e( 'Overview', 'culture-community' ); ?></h2>
                    <table style="font-size:13px;line-height:1.9;">
                        <tr><td style="color:#646970;padding-right:12px;"><?php esc_html_e( 'ID', 'culture-community' ); ?></td><td><?php echo absint( $hub_id ); ?></td></tr>
                        <tr><td style="color:#646970;padding-right:12px;"><?php esc_html_e( 'Slug', 'culture-community' ); ?></td><td><code><?php echo esc_html( $hub['slug'] ); ?></code></td></tr>
                        <tr><td style="color:#646970;padding-right:12px;"><?php esc_html_e( 'Official', 'culture-community' ); ?></td><td><?php echo $hub['isOfficial'] ? esc_html__( 'Yes', 'culture-community' ) : esc_html__( 'No', 'culture-community' ); ?></td></tr>
                        <tr><td style="color:#646970;padding-right:12px;"><?php esc_html_e( 'Created', 'culture-community' ); ?></td><td><?php echo esc_html( $hub['createdAt'] ); ?></td></tr>
                        <tr><td style="color:#646970;padding-right:12px;"><?php esc_html_e( 'Members', 'culture-community' ); ?></td><td><?php echo absint( $hub['memberCount'] ); ?></td></tr>
                        <tr><td style="color:#646970;padding-right:12px;"><?php esc_html_e( 'Posts', 'culture-community' ); ?></td><td><?php echo absint( $hub['postCount'] ); ?></td></tr>
                    </table>

                    <?php if ( $list ) : ?>
                        <hr style="margin:16px 0;">
                        <p style="font-size:13px;margin:0 0 6px;font-weight:600;"><?php esc_html_e( 'Newsletter List', 'culture-community' ); ?></p>
                        <p style="font-size:13px;margin:0;">
                            <?php echo esc_html( $list['name'] ); ?><br>
                            <?php echo esc_html( number_format( Culture_Newsletter_Lists::subscriber_count( $list['id'] ) ) ); ?> <?php esc_html_e( 'subscribers', 'culture-community' ); ?>
                        </p>
                        <p style="margin:8px 0 0;">
                            <a href="<?php echo esc_url( admin_url( 'admin.php?page=culture-campaigns' ) ); ?>" class="button button-small">
                                <?php esc_html_e( 'Email this Hub →', 'culture-community' ); ?>
                            </a>
                        </p>
                    <?php endif; ?>
                </div>
            </div>

            <h2 style="font-size:16px;margin:28px 0 12px;"><?php esc_html_e( 'Members', 'culture-community' ); ?></h2>

            <div style="background:#fff;border:1px solid #c3c4c7;border-radius:4px;padding:16px 20px;max-width:460px;margin-bottom:18px;">
                <form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
                    <input type="hidden" name="action" value="culture_hub_admin_add_member">
                    <input type="hidden" name="hub_id" value="<?php echo esc_attr( $hub_id ); ?>">
                    <?php wp_nonce_field( 'culture_hub_admin_add_member_' . $hub_id ); ?>
                    <input type="text" name="user" placeholder="<?php esc_attr_e( 'Email or username', 'culture-community' ); ?>" required style="flex:1;min-width:160px;">
                    <select name="role">
                        <option value="member"><?php esc_html_e( 'Member', 'culture-community' ); ?></option>
                        <option value="mod"><?php esc_html_e( 'Mod', 'culture-community' ); ?></option>
                        <option value="owner"><?php esc_html_e( 'Owner', 'culture-community' ); ?></option>
                    </select>
                    <button type="submit" class="button"><?php esc_html_e( 'Add / Update', 'culture-community' ); ?></button>
                </form>
            </div>

            <?php if ( empty( $members['members'] ) ) : ?>
                <p><?php esc_html_e( 'No members yet.', 'culture-community' ); ?></p>
            <?php else : ?>
                <table class="wp-list-table widefat fixed striped" style="max-width:760px;">
                    <thead>
                        <tr>
                            <th><?php esc_html_e( 'Name', 'culture-community' ); ?></th>
                            <th style="width:110px;"><?php esc_html_e( 'Role', 'culture-community' ); ?></th>
                            <th style="width:140px;"><?php esc_html_e( 'Joined', 'culture-community' ); ?></th>
                            <th style="width:280px;"><?php esc_html_e( 'Actions', 'culture-community' ); ?></th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ( $members['members'] as $m ) : ?>
                            <tr>
                                <td><?php echo esc_html( $m['name'] ); ?></td>
                                <td><?php echo esc_html( ucfirst( $m['role'] ) ); ?></td>
                                <td style="font-size:12px;color:#646970;"><?php echo esc_html( $m['joinedAt'] ); ?></td>
                                <td>
                                    <div style="display:flex;gap:6px;flex-wrap:wrap;">
                                        <?php foreach ( array( 'member', 'mod', 'owner' ) as $role_option ) : ?>
                                            <?php if ( $role_option !== $m['role'] ) : ?>
                                                <form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
                                                    <input type="hidden" name="action" value="culture_hub_admin_set_role">
                                                    <input type="hidden" name="hub_id" value="<?php echo esc_attr( $hub_id ); ?>">
                                                    <input type="hidden" name="user_id" value="<?php echo esc_attr( $m['id'] ); ?>">
                                                    <input type="hidden" name="role" value="<?php echo esc_attr( $role_option ); ?>">
                                                    <?php wp_nonce_field( 'culture_hub_admin_set_role_' . $hub_id . '_' . $m['id'] ); ?>
                                                    <button type="submit" class="button button-small">
                                                        <?php echo esc_html( sprintf( __( 'Make %s', 'culture-community' ), ucfirst( $role_option ) ) ); ?>
                                                    </button>
                                                </form>
                                            <?php endif; ?>
                                        <?php endforeach; ?>
                                        <form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" onsubmit="return confirm('<?php echo esc_js( __( 'Remove this member?', 'culture-community' ) ); ?>')">
                                            <input type="hidden" name="action" value="culture_hub_admin_remove_member">
                                            <input type="hidden" name="hub_id" value="<?php echo esc_attr( $hub_id ); ?>">
                                            <input type="hidden" name="user_id" value="<?php echo esc_attr( $m['id'] ); ?>">
                                            <?php wp_nonce_field( 'culture_hub_admin_remove_member_' . $hub_id . '_' . $m['id'] ); ?>
                                            <button type="submit" class="button button-small button-link-delete"><?php esc_html_e( 'Remove', 'culture-community' ); ?></button>
                                        </form>
                                    </div>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>

                <?php if ( $members['total'] > $members['perPage'] ) : ?>
                    <?php $mem_total_pages = (int) ceil( $members['total'] / $members['perPage'] ); ?>
                    <div class="tablenav bottom" style="margin-top:12px;">
                        <div class="tablenav-pages">
                            <?php for ( $p = 1; $p <= $mem_total_pages; $p++ ) : ?>
                                <?php if ( $p === $mem_page ) : ?>
                                    <span class="current"><?php echo (int) $p; ?></span>
                                <?php else : ?>
                                    <a class="page-numbers" href="<?php echo esc_url( add_query_arg( array( 'page' => 'culture-hubs-manager', 'hub_id' => $hub_id, 'mpaged' => $p ), admin_url( 'admin.php' ) ) ); ?>"><?php echo (int) $p; ?></a>
                                <?php endif; ?>
                            <?php endfor; ?>
                        </div>
                    </div>
                <?php endif; ?>
            <?php endif; ?>
        </div>
        <?php
    }

    // ── Handlers ─────────────────────────────────────────────────────────

    private static function require_admin(): void {
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( esc_html__( 'Permission denied.', 'culture-community' ) );
        }
    }

    /**
     * Resolves a "email or username" input field into a WP user — used by
     * both the Create Hub owner field and the Add Member field, since
     * there's no user-search API available to reuse here (only a plain text
     * field, matching this plugin's other admin-page conventions).
     */
    private static function resolve_user( string $input ) {
        $input = trim( $input );
        if ( '' === $input ) {
            return null;
        }
        return is_email( $input ) ? get_user_by( 'email', $input ) : get_user_by( 'login', $input );
    }

    public static function handle_create(): void {
        self::require_admin();
        check_admin_referer( 'culture_hub_admin_create' );

        $owner = self::resolve_user( wp_unslash( $_POST['owner'] ?? '' ) );
        if ( ! $owner ) {
            wp_safe_redirect( add_query_arg( array( 'page' => 'culture-hubs-manager', 'error' => rawurlencode( __( 'No user found with that email/username.', 'culture-community' ) ) ), admin_url( 'admin.php' ) ) );
            exit;
        }

        $result = Culture_Hubs::create( $owner->ID, array(
            'name'        => wp_unslash( $_POST['name'] ?? '' ),
            'description' => wp_unslash( $_POST['description'] ?? '' ),
            'category'    => wp_unslash( $_POST['category'] ?? '' ),
        ) );

        if ( is_wp_error( $result ) ) {
            wp_safe_redirect( add_query_arg( array( 'page' => 'culture-hubs-manager', 'error' => rawurlencode( $result->get_error_message() ) ), admin_url( 'admin.php' ) ) );
            exit;
        }

        wp_safe_redirect( add_query_arg( array( 'page' => 'culture-hubs-manager', 'created' => '1' ), admin_url( 'admin.php' ) ) );
        exit;
    }

    public static function handle_update(): void {
        self::require_admin();
        $hub_id = absint( $_POST['hub_id'] ?? 0 );
        check_admin_referer( 'culture_hub_admin_update_' . $hub_id );

        $result = Culture_Hubs::admin_update( $hub_id, array(
            'name'              => wp_unslash( $_POST['name'] ?? '' ),
            'description'       => wp_unslash( $_POST['description'] ?? '' ),
            'coverImageUrl'     => wp_unslash( $_POST['coverImageUrl'] ?? '' ),
            'category'          => wp_unslash( $_POST['category'] ?? '' ),
            'allowedTemplates'  => (array) ( $_POST['allowedTemplates'] ?? array() ),
        ) );

        $args = array( 'page' => 'culture-hubs-manager', 'hub_id' => $hub_id );
        if ( is_wp_error( $result ) ) {
            $args['error'] = rawurlencode( $result->get_error_message() );
        } else {
            $args['updated'] = '1';
        }
        wp_safe_redirect( add_query_arg( $args, admin_url( 'admin.php' ) ) );
        exit;
    }

    public static function handle_set_status(): void {
        self::require_admin();
        $hub_id = absint( $_POST['hub_id'] ?? 0 );
        check_admin_referer( 'culture_hub_admin_set_status_' . $hub_id );

        $status = sanitize_key( $_POST['status'] ?? '' );
        $result = Culture_Hubs::admin_set_status( $hub_id, $status );

        $to_detail = 'detail' === ( $_POST['redirect'] ?? '' );
        $args      = $to_detail ? array( 'page' => 'culture-hubs-manager', 'hub_id' => $hub_id ) : array( 'page' => 'culture-hubs-manager' );

        if ( is_wp_error( $result ) ) {
            $args['error'] = rawurlencode( $result->get_error_message() );
        } else {
            $args['status_updated'] = '1';
        }
        wp_safe_redirect( add_query_arg( $args, admin_url( 'admin.php' ) ) );
        exit;
    }

    public static function handle_add_member(): void {
        self::require_admin();
        $hub_id = absint( $_POST['hub_id'] ?? 0 );
        check_admin_referer( 'culture_hub_admin_add_member_' . $hub_id );

        $user = self::resolve_user( wp_unslash( $_POST['user'] ?? '' ) );
        $args = array( 'page' => 'culture-hubs-manager', 'hub_id' => $hub_id );

        if ( ! $user ) {
            $args['error'] = rawurlencode( __( 'No user found with that email/username.', 'culture-community' ) );
            wp_safe_redirect( add_query_arg( $args, admin_url( 'admin.php' ) ) );
            exit;
        }

        $role   = sanitize_key( $_POST['role'] ?? 'member' );
        $result = Culture_Hubs::admin_set_role( $hub_id, $user->ID, $role );

        if ( is_wp_error( $result ) ) {
            $args['error'] = rawurlencode( $result->get_error_message() );
        } else {
            $args['member_added'] = '1';
        }
        wp_safe_redirect( add_query_arg( $args, admin_url( 'admin.php' ) ) );
        exit;
    }

    public static function handle_set_role(): void {
        self::require_admin();
        $hub_id  = absint( $_POST['hub_id'] ?? 0 );
        $user_id = absint( $_POST['user_id'] ?? 0 );
        check_admin_referer( 'culture_hub_admin_set_role_' . $hub_id . '_' . $user_id );

        $role   = sanitize_key( $_POST['role'] ?? '' );
        $result = Culture_Hubs::admin_set_role( $hub_id, $user_id, $role );

        $args = array( 'page' => 'culture-hubs-manager', 'hub_id' => $hub_id );
        if ( is_wp_error( $result ) ) {
            $args['error'] = rawurlencode( $result->get_error_message() );
        } else {
            $args['role_updated'] = '1';
        }
        wp_safe_redirect( add_query_arg( $args, admin_url( 'admin.php' ) ) );
        exit;
    }

    public static function handle_remove_member(): void {
        self::require_admin();
        $hub_id  = absint( $_POST['hub_id'] ?? 0 );
        $user_id = absint( $_POST['user_id'] ?? 0 );
        check_admin_referer( 'culture_hub_admin_remove_member_' . $hub_id . '_' . $user_id );

        $result = Culture_Hubs::admin_remove_member( $hub_id, $user_id );

        $args = array( 'page' => 'culture-hubs-manager', 'hub_id' => $hub_id );
        if ( is_wp_error( $result ) ) {
            $args['error'] = rawurlencode( $result->get_error_message() );
        } else {
            $args['member_removed'] = '1';
        }
        wp_safe_redirect( add_query_arg( $args, admin_url( 'admin.php' ) ) );
        exit;
    }

    // ── Helpers ──────────────────────────────────────────────────────────

    private static function get_owner_id( int $hub_id ): int {
        global $wpdb;
        $id = $wpdb->get_var( $wpdb->prepare(
            "SELECT user_id FROM " . Culture_Hubs::members_table() . " WHERE hub_id = %d AND role = 'owner' AND status = 'active'",
            $hub_id
        ) );
        return (int) $id;
    }
}
