<?php
/**
 * Newsletter subscriber management admin page.
 * Lists all subscribers with delete, CSV export, MailPoet import,
 * WP user import, and auto-subscribe on registration.
 *
 * Storage backend as of September 2026: wp_culture_subscribers +
 * wp_culture_subscriber_lists (Culture_Subscribers_DB), not the flat
 * culture_newsletter_subscribers option array this file used to read/write
 * directly — see that class's own docblock for the migration. List/segment
 * checkboxes below are populated from the real list registry
 * (Culture_Newsletter_Lists) instead of the old hardcoded LIST_OPTIONS/
 * SEGMENT_OPTIONS constants, so a Hub list or a custom list an admin creates
 * on the Newsletter Lists page shows up here automatically.
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
        add_action( 'admin_post_culture_bulk_import_emails',   array( __CLASS__, 'handle_bulk_import' ) );
        add_action( 'admin_post_culture_edit_subscriber',      array( __CLASS__, 'handle_edit' ) );
        add_action( 'admin_post_culture_bulk_action_subscribers', array( __CLASS__, 'handle_bulk_action' ) );
        add_action( 'admin_post_culture_add_single_subscriber',  array( __CLASS__, 'handle_add_single_subscriber' ) );

        // Auto-subscribe new registrations if the option is enabled.
        if ( get_option( 'culture_nl_auto_subscribe', '0' ) === '1' ) {
            add_action( 'user_register', array( __CLASS__, 'auto_subscribe_new_user' ), 20 );
        }
    }

    /**
     * Registers the top-level "Moveee Newsletters" admin menu (September
     * 2026) — this class's own Subscribers page is its anchor/first page
     * (slug `culture-subscribers` doubles as both the top-level menu slug
     * and this submenu's slug, the standard WP pattern for a top-level menu
     * whose landing page is also one of its own submenus). Every other
     * newsletter-related admin page (Lists & Segments, Campaigns, Import,
     * Games Subscribers) is parented to this same slug — see each of their
     * own register_menu() methods.
     */
    public static function register_menu() {
        add_menu_page(
            __( 'Moveee Newsletters', 'culture-community' ),
            __( 'Moveee Newsletters', 'culture-community' ),
            'manage_options',
            'culture-subscribers',
            array( __CLASS__, 'render_page' ),
            'dashicons-email-alt',
            31
        );

        add_submenu_page(
            'culture-subscribers',
            __( 'Newsletter Subscribers', 'culture-community' ),
            __( 'Subscribers', 'culture-community' ),
            'manage_options',
            'culture-subscribers',
            array( __CLASS__, 'render_page' )
        );

        add_submenu_page(
            'culture-subscribers',
            __( 'Import Subscribers', 'culture-community' ),
            __( 'Import', 'culture-community' ),
            'manage_options',
            'culture-subscribers-import',
            array( __CLASS__, 'render_import_page' )
        );

        add_submenu_page(
            'culture-subscribers',
            __( 'Subscriber Settings', 'culture-community' ),
            __( 'Settings', 'culture-community' ),
            'manage_options',
            'culture-subscribers-settings',
            array( __CLASS__, 'render_settings_page' )
        );
    }

    /**
     * Render the subscribers admin page.
     */
    public static function render_page() {
        $count     = Culture_Subscribers_DB::count();
        $all_lists = Culture_Newsletter_Lists::get_all();

        $page   = max( 1, absint( $_GET['paged'] ?? 1 ) );
        $search = sanitize_text_field( wp_unslash( $_GET['s'] ?? '' ) );
        $filter_list_id = absint( $_GET['list_id'] ?? 0 );

        // Date-joined range filter (Y-m-d, inclusive) and an adjustable
        // per-page count, both new alongside search/list.
        $date_from     = preg_match( '/^\d{4}-\d{2}-\d{2}$/', $_GET['date_from'] ?? '' ) ? sanitize_text_field( wp_unslash( $_GET['date_from'] ) ) : '';
        $date_to       = preg_match( '/^\d{4}-\d{2}-\d{2}$/', $_GET['date_to'] ?? '' ) ? sanitize_text_field( wp_unslash( $_GET['date_to'] ) ) : '';
        $per_page_opts = array( 25, 50, 100, 200 );
        $per_page      = absint( $_GET['per_page'] ?? 50 );
        if ( ! in_array( $per_page, $per_page_opts, true ) ) {
            $per_page = 50;
        }

        $result      = Culture_Subscribers_DB::all( array(
            'page'      => $page,
            'per_page'  => $per_page,
            'search'    => $search,
            'list_id'   => $filter_list_id,
            'date_from' => $date_from,
            'date_to'   => $date_to,
        ) );
        $subscribers = $result['subscribers'];
        $total_pages = $result['perPage'] > 0 ? (int) ceil( $result['total'] / $result['perPage'] ) : 1;

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
        } elseif ( isset( $_GET['bulk_deleted'] ) ) {
            $n      = absint( $_GET['bulk_deleted'] );
            $notice = sprintf(
                _n( '%s subscriber removed.', '%s subscribers removed.', $n, 'culture-community' ),
                number_format( $n )
            );
        } elseif ( isset( $_GET['bulk_added'] ) ) {
            $n      = absint( $_GET['bulk_added'] );
            $notice = sprintf(
                _n( '%s subscriber added to the list.', '%s subscribers added to the list.', $n, 'culture-community' ),
                number_format( $n )
            );
        } elseif ( isset( $_GET['bulk_removed'] ) ) {
            $n      = absint( $_GET['bulk_removed'] );
            $notice = sprintf(
                _n( '%s subscriber removed from the list.', '%s subscribers removed from the list.', $n, 'culture-community' ),
                number_format( $n )
            );
        }

        // ── INLINE EDIT FORM ─────────────────────────────────────────────────
        $editing_email = isset( $_GET['sub_action'], $_GET['sub_email'] )
            && 'edit' === $_GET['sub_action']
            ? sanitize_email( wp_unslash( $_GET['sub_email'] ) )
            : '';

        if ( $editing_email ) {
            $edit_sub = Culture_Subscribers_DB::find_by_email( $editing_email );
            if ( $edit_sub ) {
                $edit_sub_list_ids = Culture_Subscribers_DB::get_list_ids( $edit_sub['id'] );
                ?>
        <div style="background:#fff;border:1px solid #c3c4c7;border-radius:4px;padding:24px 28px;max-width:600px;margin-bottom:28px;">
            <h2 style="margin:0 0 18px;font-size:14px;font-weight:600;">
                <?php esc_html_e( 'Edit Subscriber', 'culture-community' ); ?> —
                <span style="font-weight:400;color:#646970;"><?php echo esc_html( $edit_sub['email'] ); ?></span>
            </h2>
            <form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
                <input type="hidden" name="action" value="culture_edit_subscriber">
                <input type="hidden" name="subscriber_id" value="<?php echo esc_attr( $edit_sub['id'] ); ?>">
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
                        <th style="padding:8px 16px 8px 0;font-size:13px;"><?php esc_html_e( 'Lists & Segments', 'culture-community' ); ?></th>
                        <td>
                            <?php foreach ( $all_lists as $list ) : ?>
                            <label style="display:inline-flex;align-items:center;gap:6px;margin-right:18px;margin-bottom:6px;">
                                <input type="checkbox" name="sub_lists[]" value="<?php echo esc_attr( $list['id'] ); ?>"
                                    <?php checked( in_array( $list['id'], $edit_sub_list_ids, true ) ); ?>>
                                <?php echo esc_html( $list['name'] ); ?>
                                <span style="font-size:10px;color:#999;text-transform:uppercase;">(<?php echo esc_html( $list['type'] ); ?>)</span>
                            </label>
                            <?php endforeach; ?>
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
                <?php
            }
        }
        ?>
        <div class="wrap">
            <h1 class="wp-heading-inline"><?php esc_html_e( 'Newsletter Subscribers', 'culture-community' ); ?></h1>
            <a href="<?php echo esc_url( admin_url( 'admin.php?page=culture-subscribers-import' ) ); ?>" class="page-title-action">
                <?php esc_html_e( 'Import', 'culture-community' ); ?>
            </a>
            <a href="<?php echo esc_url( admin_url( 'admin.php?page=culture-newsletter-lists' ) ); ?>" class="page-title-action">
                <?php esc_html_e( 'Lists & Segments', 'culture-community' ); ?>
            </a>
            <a href="<?php echo esc_url( admin_url( 'admin.php?page=culture-campaigns' ) ); ?>" class="page-title-action">
                <?php esc_html_e( 'Campaigns', 'culture-community' ); ?>
            </a>
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

            <?php /* ── SUBSCRIBER LIST ── */ ?>
            <h2 style="font-size:14px;font-weight:600;margin:0 0 12px;"><?php esc_html_e( 'Subscriber List', 'culture-community' ); ?></h2>

            <form method="get" style="display:flex;gap:10px;align-items:center;margin-bottom:14px;flex-wrap:wrap;">
                <input type="hidden" name="page" value="culture-subscribers">
                <input type="search" name="s" value="<?php echo esc_attr( $search ); ?>" placeholder="<?php esc_attr_e( 'Search email or name…', 'culture-community' ); ?>" style="min-width:220px;">
                <select name="list_id">
                    <option value="0"><?php esc_html_e( 'All lists', 'culture-community' ); ?></option>
                    <?php foreach ( $all_lists as $list ) : ?>
                        <option value="<?php echo esc_attr( $list['id'] ); ?>" <?php selected( $filter_list_id, $list['id'] ); ?>>
                            <?php echo esc_html( $list['name'] ); ?>
                        </option>
                    <?php endforeach; ?>
                </select>
                <label style="display:flex;align-items:center;gap:6px;font-size:12px;color:#646970;">
                    <?php esc_html_e( 'Joined', 'culture-community' ); ?>
                    <input type="date" name="date_from" value="<?php echo esc_attr( $date_from ); ?>" style="font-size:12px;">
                    <?php esc_html_e( '–', 'culture-community' ); ?>
                    <input type="date" name="date_to" value="<?php echo esc_attr( $date_to ); ?>" style="font-size:12px;">
                </label>
                <select name="per_page">
                    <?php foreach ( $per_page_opts as $opt ) : ?>
                        <option value="<?php echo esc_attr( $opt ); ?>" <?php selected( $per_page, $opt ); ?>>
                            <?php echo esc_html( sprintf( __( '%d per page', 'culture-community' ), $opt ) ); ?>
                        </option>
                    <?php endforeach; ?>
                </select>
                <button type="submit" class="button"><?php esc_html_e( 'Filter', 'culture-community' ); ?></button>
                <?php if ( $search || $filter_list_id || $date_from || $date_to || 50 !== $per_page ) : ?>
                    <a href="<?php echo esc_url( add_query_arg( 'page', 'culture-subscribers', admin_url( 'admin.php' ) ) ); ?>" class="button-link" style="font-size:12px;">
                        <?php esc_html_e( 'Reset filters', 'culture-community' ); ?>
                    </a>
                <?php endif; ?>
            </form>

            <?php if ( empty( $subscribers ) ) : ?>
                <p style="color:#646970;"><?php esc_html_e( 'No subscribers found.', 'culture-community' ); ?></p>
            <?php else : ?>
                <form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" id="culture-subscribers-bulk-form">
                    <input type="hidden" name="action" value="culture_bulk_action_subscribers">
                    <?php wp_nonce_field( 'culture_bulk_subscribers' ); ?>
                    <?php // Preserve the current filtered/paginated view so the redirect after a bulk action lands back on it. ?>
                    <input type="hidden" name="ret_s" value="<?php echo esc_attr( $search ); ?>">
                    <input type="hidden" name="ret_list_id" value="<?php echo esc_attr( $filter_list_id ); ?>">
                    <input type="hidden" name="ret_date_from" value="<?php echo esc_attr( $date_from ); ?>">
                    <input type="hidden" name="ret_date_to" value="<?php echo esc_attr( $date_to ); ?>">
                    <input type="hidden" name="ret_per_page" value="<?php echo esc_attr( $per_page ); ?>">
                    <input type="hidden" name="ret_paged" value="<?php echo esc_attr( $page ); ?>">

                    <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px;">
                        <select name="bulk_action" id="culture-subscribers-bulk-action">
                            <option value=""><?php esc_html_e( 'Bulk actions', 'culture-community' ); ?></option>
                            <option value="delete"><?php esc_html_e( 'Remove selected', 'culture-community' ); ?></option>
                            <?php if ( $all_lists ) : ?>
                                <optgroup label="<?php esc_attr_e( 'Add to list…', 'culture-community' ); ?>">
                                    <?php foreach ( $all_lists as $list ) : ?>
                                        <option value="add_to_list_<?php echo esc_attr( $list['id'] ); ?>">
                                            <?php echo esc_html( $list['name'] ); ?>
                                        </option>
                                    <?php endforeach; ?>
                                </optgroup>
                                <optgroup label="<?php esc_attr_e( 'Remove from list…', 'culture-community' ); ?>">
                                    <?php foreach ( $all_lists as $list ) : ?>
                                        <option value="remove_from_list_<?php echo esc_attr( $list['id'] ); ?>">
                                            <?php echo esc_html( $list['name'] ); ?>
                                        </option>
                                    <?php endforeach; ?>
                                </optgroup>
                            <?php endif; ?>
                        </select>
                        <button
                            type="submit"
                            class="button"
                            onclick="var a=document.getElementById('culture-subscribers-bulk-action').value,n=document.querySelectorAll('input[name=\'subscriber_ids[]\']:checked').length;if(!a){alert('<?php echo esc_js( __( 'Choose a bulk action first.', 'culture-community' ) ); ?>');return false;}if(!n){alert('<?php echo esc_js( __( 'Select at least one subscriber first.', 'culture-community' ) ); ?>');return false;}return a==='delete'?confirm('<?php echo esc_js( __( 'Remove the selected subscribers? This cannot be undone.', 'culture-community' ) ); ?>'):true;"
                        ><?php esc_html_e( 'Apply', 'culture-community' ); ?></button>
                        <span style="font-size:12px;color:#646970;" id="culture-subscribers-selected-count"></span>
                    </div>

                    <table class="wp-list-table widefat fixed striped">
                        <thead>
                            <tr>
                                <th scope="col" style="width:32px;">
                                    <input type="checkbox" id="culture-subscribers-select-all">
                                </th>
                                <th scope="col" style="width:220px;"><?php esc_html_e( 'Email Address', 'culture-community' ); ?></th>
                                <th scope="col" style="width:150px;"><?php esc_html_e( 'Name', 'culture-community' ); ?></th>
                                <th scope="col"><?php esc_html_e( 'Lists', 'culture-community' ); ?></th>
                                <th scope="col" style="width:120px;"><?php esc_html_e( 'Joined', 'culture-community' ); ?></th>
                                <th scope="col" style="width:130px;"><?php esc_html_e( 'Actions', 'culture-community' ); ?></th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ( $subscribers as $sub ) : ?>
                                <?php
                                $date = $sub['createdAt'] ? date_i18n( get_option( 'date_format' ), strtotime( $sub['createdAt'] ) ) : '';
                                $is_editing = ( strtolower( trim( $sub['email'] ) ) === strtolower( $editing_email ) );
                                ?>
                                <tr<?php echo $is_editing ? ' style="background:#fffbe6;"' : ''; ?>>
                                    <td>
                                        <input type="checkbox" class="culture-subscriber-checkbox" name="subscriber_ids[]" value="<?php echo esc_attr( $sub['id'] ); ?>">
                                    </td>
                                    <td><strong><?php echo esc_html( $sub['email'] ); ?></strong></td>
                                    <td><?php echo esc_html( $sub['name'] ); ?></td>
                                    <td>
                                        <?php if ( ! empty( $sub['lists'] ) ) : ?>
                                            <?php foreach ( $sub['lists'] as $slug ) : ?>
                                                <?php $list = Culture_Newsletter_Lists::get_by_slug( $slug ); ?>
                                                <span style="display:inline-block;padding:2px 7px;border-radius:3px;font-size:10px;font-weight:600;letter-spacing:.05em;margin:1px;background:<?php echo $list && 'region' === $list['type'] ? '#fef3c7' : '#e0e7ff'; ?>;color:<?php echo $list && 'region' === $list['type'] ? '#92400e' : '#3730a3'; ?>;">
                                                    <?php echo esc_html( $list ? $list['name'] : $slug ); ?>
                                                </span>
                                            <?php endforeach; ?>
                                        <?php else : ?>
                                            <span style="font-size:11px;color:#aaa;">—</span>
                                        <?php endif; ?>
                                    </td>
                                    <td style="font-size:12px;color:#646970;"><?php echo esc_html( $date ); ?></td>
                                    <td>
                                        <div style="display:flex;gap:6px;align-items:center;">
                                            <a
                                                href="<?php echo esc_url( add_query_arg( array(
                                                    'page'       => 'culture-subscribers',
                                                    'sub_action' => 'edit',
                                                    'sub_email'  => rawurlencode( $sub['email'] ),
                                                ), admin_url( 'admin.php' ) ) ); ?>#edit-subscriber"
                                                class="button button-small"
                                            ><?php esc_html_e( 'Edit', 'culture-community' ); ?></a>
                                            <a
                                                href="<?php echo esc_url( wp_nonce_url( add_query_arg( array(
                                                    'action'           => 'culture_delete_subscriber',
                                                    'subscriber_email' => rawurlencode( $sub['email'] ),
                                                ), admin_url( 'admin-post.php' ) ), 'culture_delete_subscriber' ) ); ?>"
                                                class="button button-small button-link-delete"
                                                onclick="return confirm('<?php echo esc_js( sprintf( __( 'Remove %s?', 'culture-community' ), $sub['email'] ) ); ?>')"
                                            ><?php esc_html_e( 'Remove', 'culture-community' ); ?></a>
                                        </div>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </form>

                <script>
                (function () {
                    var selectAll = document.getElementById('culture-subscribers-select-all');
                    var boxes     = document.querySelectorAll('.culture-subscriber-checkbox');
                    var countEl   = document.getElementById('culture-subscribers-selected-count');
                    function updateCount() {
                        var n = document.querySelectorAll('.culture-subscriber-checkbox:checked').length;
                        if ( countEl ) {
                            countEl.textContent = n ? n + ' <?php echo esc_js( __( 'selected', 'culture-community' ) ); ?>' : '';
                        }
                    }
                    if ( selectAll ) {
                        selectAll.addEventListener('change', function () {
                            boxes.forEach( function ( b ) { b.checked = selectAll.checked; } );
                            updateCount();
                        } );
                    }
                    boxes.forEach( function ( b ) { b.addEventListener('change', updateCount); } );
                })();
                </script>

                <?php if ( $total_pages > 1 ) : ?>
                <div style="margin-top:14px;">
                    <?php
                    echo paginate_links( array(
                        'base'      => add_query_arg( 'paged', '%#%' ),
                        'format'    => '',
                        'current'   => $page,
                        'total'     => $total_pages,
                        'prev_text' => '«',
                        'next_text' => '»',
                    ) );
                    ?>
                </div>
                <?php endif; ?>
            <?php endif; ?>
        </div>
        <?php
    }

    // ── IMPORT PAGE ──────────────────────────────────────────────────────────

    /**
     * Dedicated Import Subscribers sub-page.
     */
    public static function render_import_page() {
        $mailpoet_active = self::is_mailpoet_active();
        $all_lists       = Culture_Newsletter_Lists::get_all();
        $content_lists   = array_filter( $all_lists, function( $l ) {
            return in_array( $l['type'], array( 'content', 'hub' ), true );
        } );

        $notice      = '';
        $notice_type = 'success';
        if ( isset( $_GET['error'] ) && 'invalid_email' === $_GET['error'] ) {
            $notice      = __( 'Invalid email address. Please enter a valid email.', 'culture-community' );
            $notice_type = 'error';
        } elseif ( isset( $_GET['added'] ) && '1' === $_GET['added'] ) {
            $notice = __( 'Subscriber added.', 'culture-community' );
        } elseif ( isset( $_GET['imported'] ) ) {
            $n          = absint( $_GET['imported'] );
            $list_added = absint( $_GET['list_added'] ?? 0 );
            if ( $n > 0 && $list_added > 0 ) {
                $notice = sprintf(
                    /* translators: 1: new count, 2: list-added count */
                    _n( '%1$s new subscriber imported. %2$s subscriber(s) added to the list.', '%1$s new subscribers imported. %2$s subscriber(s) added to the list.', $n, 'culture-community' ),
                    number_format( $n ), number_format( $list_added )
                );
            } elseif ( $n > 0 ) {
                $notice = sprintf(
                    _n( '%s new subscriber imported.', '%s new subscribers imported.', $n, 'culture-community' ),
                    number_format( $n )
                );
            } elseif ( $list_added > 0 ) {
                $notice = sprintf(
                    /* translators: number of subscribers assigned to a list (they already existed) */
                    _n( 'No new subscribers (all already existed). %s subscriber added to the list.', 'No new subscribers (all already existed). %s subscribers added to the list.', $list_added, 'culture-community' ),
                    number_format( $list_added )
                );
            } else {
                $notice      = __( 'No new subscribers were imported (all emails already exist).', 'culture-community' );
                $notice_type = 'warning';
            }
        }
        ?>
        <div class="wrap">
            <h1><?php esc_html_e( 'Import Subscribers', 'culture-community' ); ?></h1>
            <hr class="wp-header-end">

            <?php if ( $notice ) : ?>
                <div class="notice notice-<?php echo esc_attr( $notice_type ); ?> is-dismissible"><p><?php echo esc_html( $notice ); ?></p></div>
            <?php endif; ?>

            <?php /* ── ADD SINGLE SUBSCRIBER ── */ ?>
            <h2 style="font-size:15px;font-weight:600;margin:24px 0 8px;"><?php esc_html_e( 'Add Single Subscriber', 'culture-community' ); ?></h2>
            <div style="background:#fff;border:1px solid #c3c4c7;border-radius:4px;padding:24px 28px;max-width:600px;margin-bottom:32px;">
                <form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
                    <input type="hidden" name="action" value="culture_add_single_subscriber">
                    <?php wp_nonce_field( 'culture_add_single_subscriber' ); ?>
                    <table class="form-table" style="margin:0 0 16px;">
                        <tr>
                            <th scope="row" style="padding:8px 16px 8px 0;font-size:12px;font-weight:600;text-transform:uppercase;width:140px;">
                                <?php esc_html_e( 'Email *', 'culture-community' ); ?>
                            </th>
                            <td>
                                <input type="email" name="single_email" class="regular-text" required placeholder="email@example.com">
                            </td>
                        </tr>
                        <tr>
                            <th scope="row" style="padding:8px 16px 8px 0;font-size:12px;font-weight:600;text-transform:uppercase;">
                                <?php esc_html_e( 'Name', 'culture-community' ); ?>
                            </th>
                            <td>
                                <input type="text" name="single_name" class="regular-text" placeholder="<?php esc_attr_e( 'Optional', 'culture-community' ); ?>">
                            </td>
                        </tr>
                        <tr>
                            <th scope="row" style="padding:8px 16px 8px 0;font-size:12px;font-weight:600;text-transform:uppercase;">
                                <?php esc_html_e( 'Location', 'culture-community' ); ?>
                            </th>
                            <td>
                                <input type="text" name="single_location" class="regular-text" placeholder="<?php esc_attr_e( 'Optional', 'culture-community' ); ?>">
                            </td>
                        </tr>
                        <?php if ( $all_lists ) : ?>
                        <tr>
                            <th scope="row" style="padding:8px 16px 8px 0;font-size:12px;font-weight:600;text-transform:uppercase;">
                                <?php esc_html_e( 'Add to list', 'culture-community' ); ?>
                            </th>
                            <td>
                                <select name="single_list_id" style="font-size:13px;">
                                    <option value="0"><?php esc_html_e( '— No list —', 'culture-community' ); ?></option>
                                    <?php foreach ( $all_lists as $list ) : ?>
                                        <option value="<?php echo esc_attr( $list['id'] ); ?>">
                                            <?php echo esc_html( $list['name'] ); ?>
                                        </option>
                                    <?php endforeach; ?>
                                </select>
                            </td>
                        </tr>
                        <?php endif; ?>
                    </table>
                    <button type="submit" class="button button-primary">
                        <?php esc_html_e( 'Add Subscriber', 'culture-community' ); ?>
                    </button>
                </form>
            </div>

            <?php /* ── BULK IMPORT ── */ ?>
            <h2 style="font-size:15px;font-weight:600;margin:24px 0 8px;"><?php esc_html_e( 'Bulk Import — CSV or Paste', 'culture-community' ); ?></h2>
            <div style="background:#fff;border:1px solid #c3c4c7;border-radius:4px;padding:24px 28px;max-width:600px;margin-bottom:32px;">
                <p style="margin:0 0 16px;font-size:13px;color:#3c434a;">
                    <?php esc_html_e( 'Paste a list of subscribers or upload a CSV file. Format: email, name, location (comma-separated, one per line). A header row is skipped automatically when uploading a file.', 'culture-community' ); ?>
                </p>
                <form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" enctype="multipart/form-data">
                    <input type="hidden" name="action" value="culture_bulk_import_emails">
                    <input type="hidden" name="_wp_http_referer" value="<?php echo esc_attr( admin_url( 'admin.php?page=culture-subscribers-import' ) ); ?>">
                    <?php wp_nonce_field( 'culture_bulk_import_emails' ); ?>

                    <table class="form-table" style="margin:0 0 16px;">
                        <tr>
                            <th scope="row" style="padding:8px 16px 8px 0;font-size:12px;font-weight:600;text-transform:uppercase;width:140px;">
                                <?php esc_html_e( 'Paste list', 'culture-community' ); ?>
                            </th>
                            <td>
                                <textarea name="bulk_list" rows="6" style="width:100%;max-width:420px;font-family:monospace;font-size:12px;" placeholder="tope@moveee.com, Tope, Lagos&#10;ade@moveee.com, Ade, Accra"></textarea>
                            </td>
                        </tr>
                        <tr>
                            <th scope="row" style="padding:8px 16px 8px 0;font-size:12px;font-weight:600;text-transform:uppercase;">
                                <?php esc_html_e( 'Or upload CSV', 'culture-community' ); ?>
                            </th>
                            <td>
                                <input type="file" name="bulk_csv" accept=".csv" style="font-size:13px;">
                            </td>
                        </tr>
                        <?php if ( $content_lists ) : ?>
                        <tr>
                            <th scope="row" style="padding:8px 16px 8px 0;font-size:12px;font-weight:600;text-transform:uppercase;">
                                <?php esc_html_e( 'Add to list', 'culture-community' ); ?>
                            </th>
                            <td>
                                <select name="import_list_id" style="font-size:13px;">
                                    <option value="0"><?php esc_html_e( '— No list —', 'culture-community' ); ?></option>
                                    <?php foreach ( $content_lists as $list ) : ?>
                                        <option value="<?php echo esc_attr( $list['id'] ); ?>">
                                            <?php echo esc_html( $list['name'] ); ?>
                                        </option>
                                    <?php endforeach; ?>
                                </select>
                                <p class="description" style="margin-top:4px;">
                                    <?php esc_html_e( 'Optionally subscribe all imported emails to a specific list.', 'culture-community' ); ?>
                                </p>
                            </td>
                        </tr>
                        <?php endif; ?>
                    </table>

                    <button type="submit" class="button button-primary">
                        <?php esc_html_e( 'Import', 'culture-community' ); ?>
                    </button>
                </form>
            </div>

            <?php /* ── MAILPOET SYNC ── */ ?>
            <h2 style="font-size:15px;font-weight:600;margin:0 0 8px;"><?php esc_html_e( 'MailPoet Sync', 'culture-community' ); ?></h2>
            <div style="background:#fff;border:1px solid #c3c4c7;border-radius:4px;padding:24px 28px;max-width:600px;margin-bottom:32px;">
                <?php if ( $mailpoet_active ) : ?>
                    <p style="margin:0 0 16px;font-size:13px;color:#3c434a;">
                        <?php esc_html_e( 'Sync all active MailPoet subscribers into Moveee Newsletters. Existing subscribers will not be duplicated.', 'culture-community' ); ?>
                    </p>
                    <form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
                        <input type="hidden" name="action" value="culture_import_mailpoet">
                        <?php wp_nonce_field( 'culture_import_mailpoet' ); ?>
                        <button type="submit" class="button button-secondary">
                            <?php esc_html_e( 'Sync Now', 'culture-community' ); ?>
                        </button>
                    </form>
                <?php else : ?>
                    <p style="margin:0;font-size:13px;color:#646970;">
                        <?php esc_html_e( 'MailPoet is not installed or active on this site. Install MailPoet to use this sync.', 'culture-community' ); ?>
                    </p>
                <?php endif; ?>
            </div>

            <?php /* ── WP USER IMPORT ── */ ?>
            <h2 style="font-size:15px;font-weight:600;margin:0 0 8px;"><?php esc_html_e( 'Import WordPress Users', 'culture-community' ); ?></h2>
            <div style="background:#fff;border:1px solid #c3c4c7;border-radius:4px;padding:24px 28px;max-width:600px;margin-bottom:32px;">
                <p style="margin:0 0 16px;font-size:13px;color:#3c434a;">
                    <?php esc_html_e( 'Add registered WordPress users to Moveee Newsletters. Filter by role, or leave "All roles" to import everyone.', 'culture-community' ); ?>
                </p>
                <form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
                    <input type="hidden" name="action" value="culture_import_wp_users">
                    <?php wp_nonce_field( 'culture_import_wp_users' ); ?>
                    <table class="form-table" style="margin:0 0 16px;">
                        <tr>
                            <th scope="row" style="padding:8px 16px 8px 0;font-size:12px;font-weight:600;text-transform:uppercase;width:140px;">
                                <?php esc_html_e( 'Role', 'culture-community' ); ?>
                            </th>
                            <td>
                                <select name="role" style="font-size:13px;min-width:200px;">
                                    <option value=""><?php esc_html_e( 'All roles', 'culture-community' ); ?></option>
                                    <?php
                                    foreach ( wp_roles()->get_names() as $role_key => $role_name ) {
                                        echo '<option value="' . esc_attr( $role_key ) . '">' . esc_html( translate_user_role( $role_name ) ) . '</option>';
                                    }
                                    ?>
                                </select>
                            </td>
                        </tr>
                        <?php if ( $content_lists ) : ?>
                        <tr>
                            <th scope="row" style="padding:8px 16px 8px 0;font-size:12px;font-weight:600;text-transform:uppercase;">
                                <?php esc_html_e( 'Add to list', 'culture-community' ); ?>
                            </th>
                            <td>
                                <select name="import_list_id" style="font-size:13px;">
                                    <option value="0"><?php esc_html_e( '— No list —', 'culture-community' ); ?></option>
                                    <?php foreach ( $content_lists as $list ) : ?>
                                        <option value="<?php echo esc_attr( $list['id'] ); ?>">
                                            <?php echo esc_html( $list['name'] ); ?>
                                        </option>
                                    <?php endforeach; ?>
                                </select>
                            </td>
                        </tr>
                        <?php endif; ?>
                    </table>
                    <button type="submit" class="button button-secondary">
                        <?php esc_html_e( 'Import Users', 'culture-community' ); ?>
                    </button>
                </form>
            </div>
        </div>
        <?php
    }

    // ── SETTINGS PAGE ─────────────────────────────────────────────────────────

    /**
     * Dedicated Subscriber Settings sub-page.
     */
    public static function render_settings_page() {
        $auto_subscribe = get_option( 'culture_nl_auto_subscribe', '0' ) === '1';

        $notice = '';
        if ( isset( $_GET['saved'] ) && '1' === $_GET['saved'] ) {
            $notice = __( 'Settings saved.', 'culture-community' );
        }
        ?>
        <div class="wrap">
            <h1><?php esc_html_e( 'Subscriber Settings', 'culture-community' ); ?></h1>
            <hr class="wp-header-end">

            <?php if ( $notice ) : ?>
                <div class="notice notice-success is-dismissible"><p><?php echo esc_html( $notice ); ?></p></div>
            <?php endif; ?>

            <h2 style="font-size:15px;font-weight:600;margin:24px 0 8px;"><?php esc_html_e( 'Auto-Subscribe', 'culture-community' ); ?></h2>
            <div style="background:#fff;border:1px solid #c3c4c7;border-radius:4px;padding:24px 28px;max-width:600px;margin-bottom:32px;">
                <form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
                    <input type="hidden" name="action" value="culture_nl_auto_subscribe">
                    <input type="hidden" name="redirect_page" value="culture-subscribers-settings">
                    <?php wp_nonce_field( 'culture_nl_auto_subscribe' ); ?>
                    <label style="display:flex;align-items:flex-start;gap:12px;cursor:pointer;">
                        <input type="checkbox" name="auto_subscribe" value="1" style="margin-top:3px;" <?php checked( $auto_subscribe ); ?>>
                        <span>
                            <strong style="display:block;font-size:13px;margin-bottom:4px;">
                                <?php esc_html_e( 'Auto-subscribe new registrations', 'culture-community' ); ?>
                            </strong>
                            <span style="font-size:12px;color:#646970;">
                                <?php esc_html_e( 'Automatically adds every new registered WordPress user to Moveee Newsletters when they create an account.', 'culture-community' ); ?>
                            </span>
                        </span>
                    </label>
                    <div style="margin-top:20px;">
                        <button type="submit" class="button button-primary">
                            <?php esc_html_e( 'Save Settings', 'culture-community' ); ?>
                        </button>
                    </div>
                </form>
            </div>
        </div>
        <?php
    }

    // ── HANDLERS ─────────────────────────────────────────────────────────────

    /**
     * Handle edit subscriber POST action — updates name, location, list membership.
     */
    public static function handle_edit() {
        check_admin_referer( 'culture_edit_subscriber' );

        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( esc_html__( 'Permission denied.', 'culture-community' ) );
        }

        $id = absint( $_POST['subscriber_id'] ?? 0 );
        if ( ! $id ) {
            wp_safe_redirect( add_query_arg( 'page', 'culture-subscribers', admin_url( 'admin.php' ) ) );
            exit;
        }

        Culture_Subscribers_DB::update_subscriber( $id, array(
            'name'     => sanitize_text_field( $_POST['sub_name'] ?? '' ),
            'location' => sanitize_text_field( $_POST['sub_location'] ?? '' ),
        ) );

        $list_ids = array_map( 'absint', (array) ( $_POST['sub_lists'] ?? array() ) );
        Culture_Subscribers_DB::set_lists( $id, $list_ids );

        wp_safe_redirect( add_query_arg( array(
            'page'      => 'culture-subscribers',
            'sub_saved' => '1',
        ), admin_url( 'admin.php' ) ) );
        exit;
    }

    /**
     * Handle delete subscriber action — the per-row "Remove" link, a plain
     * nonced GET request (not a POST form) so it can sit as a row action
     * inside the bulk-actions table without nesting a second <form>.
     */
    public static function handle_delete() {
        check_admin_referer( 'culture_delete_subscriber' );

        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( esc_html__( 'Permission denied.', 'culture-community' ) );
        }

        $email = sanitize_email( wp_unslash( $_REQUEST['subscriber_email'] ?? '' ) );
        if ( $email ) {
            Culture_Subscribers_DB::delete_subscriber_by_email( $email );
        }

        wp_safe_redirect( add_query_arg( array(
            'page'    => 'culture-subscribers',
            'deleted' => '1',
        ), admin_url( 'admin.php' ) ) );
        exit;
    }

    /**
     * Handle the Subscriber List's bulk-actions form — remove selected, or
     * add/remove the selected subscribers to/from a list. The dropdown's
     * value encodes both the action and, for the two list actions, the
     * target list id (add_to_list_{id} / remove_from_list_{id}) so one
     * <select> + one Apply button covers all three without extra JS UI.
     * Redirects back to the exact filtered/paginated view it was submitted
     * from, carried via the form's ret_* hidden fields.
     */
    public static function handle_bulk_action() {
        check_admin_referer( 'culture_bulk_subscribers' );

        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( esc_html__( 'Permission denied.', 'culture-community' ) );
        }

        $ids    = array_values( array_filter( array_map( 'absint', (array) ( $_POST['subscriber_ids'] ?? array() ) ) ) );
        $action = sanitize_text_field( wp_unslash( $_POST['bulk_action'] ?? '' ) );

        $redirect_args = array( 'page' => 'culture-subscribers' );
        foreach ( array( 's', 'list_id', 'date_from', 'date_to', 'per_page', 'paged' ) as $preserve ) {
            $value = sanitize_text_field( wp_unslash( $_POST[ 'ret_' . $preserve ] ?? '' ) );
            if ( '' !== $value ) {
                $redirect_args[ $preserve ] = $value;
            }
        }

        if ( $ids && $action ) {
            if ( 'delete' === $action ) {
                foreach ( $ids as $id ) {
                    $sub = Culture_Subscribers_DB::get( $id );
                    if ( $sub ) {
                        Culture_Subscribers_DB::delete_subscriber_by_email( $sub['email'] );
                    }
                }
                $redirect_args['bulk_deleted'] = count( $ids );
            } elseif ( 0 === strpos( $action, 'add_to_list_' ) ) {
                $list_id = absint( substr( $action, strlen( 'add_to_list_' ) ) );
                if ( $list_id ) {
                    foreach ( $ids as $id ) {
                        Culture_Subscribers_DB::add_subscriber_to_list_id( $id, $list_id );
                    }
                    $redirect_args['bulk_added'] = count( $ids );
                }
            } elseif ( 0 === strpos( $action, 'remove_from_list_' ) ) {
                $list_id = absint( substr( $action, strlen( 'remove_from_list_' ) ) );
                if ( $list_id ) {
                    foreach ( $ids as $id ) {
                        Culture_Subscribers_DB::remove_subscriber_from_list_id( $id, $list_id );
                    }
                    $redirect_args['bulk_removed'] = count( $ids );
                }
            }
        }

        wp_safe_redirect( admin_url( 'admin.php?' . http_build_query( $redirect_args ) ) );
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

        $filename = 'newsletter-subscribers-' . date( 'Y-m-d' ) . '.csv';

        header( 'Content-Type: text/csv; charset=utf-8' );
        header( 'Content-Disposition: attachment; filename="' . $filename . '"' );
        header( 'Pragma: no-cache' );
        header( 'Expires: 0' );

        $output = fopen( 'php://output', 'w' );
        fputcsv( $output, array( 'Email Address', 'Name', 'Location', 'Date Joined', 'Lists' ) );

        $page = 1;
        do {
            $result = Culture_Subscribers_DB::all( array( 'page' => $page, 'per_page' => 200 ) );
            foreach ( $result['subscribers'] as $sub ) {
                fputcsv( $output, array(
                    $sub['email'],
                    $sub['name'],
                    $sub['location'],
                    $sub['createdAt'],
                    implode( '; ', $sub['lists'] ),
                ) );
            }
            $page++;
        } while ( count( $result['subscribers'] ) === $result['perPage'] );

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

        $count = Culture_Subscribers_DB::subscribe_many( $items );

        // Add every subscriber (new OR already existing) to the chosen list.
        // The old guard ($count > 0) meant that if all emails already existed,
        // no one got list-assigned even though the admin chose a list.
        $import_list_id = absint( $_POST['import_list_id'] ?? 0 );
        $list_added     = 0;
        if ( $import_list_id ) {
            foreach ( $items as $item ) {
                $sub = Culture_Subscribers_DB::find_by_email( $item['email'] );
                if ( $sub ) {
                    Culture_Subscribers_DB::add_subscriber_to_list_id( $sub['id'], $import_list_id );
                    $list_added++;
                }
            }
        }

        $redirect = array(
            'page'     => 'culture-subscribers-import',
            'imported' => $count,
        );
        if ( $list_added ) {
            $redirect['list_added'] = $list_added;
        }

        wp_safe_redirect( add_query_arg( $redirect, admin_url( 'admin.php' ) ) );
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

        $imported = Culture_Subscribers_DB::subscribe_many( $items );

        wp_safe_redirect( add_query_arg( array(
            'page'     => 'culture-subscribers-import',
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

        $imported = Culture_Subscribers_DB::subscribe_many( $items );

        // Add every user (new OR already existing) to the chosen list.
        $import_list_id = absint( $_POST['import_list_id'] ?? 0 );
        $list_added     = 0;
        if ( $import_list_id ) {
            foreach ( $items as $item ) {
                $sub = Culture_Subscribers_DB::find_by_email( $item['email'] );
                if ( $sub ) {
                    Culture_Subscribers_DB::add_subscriber_to_list_id( $sub['id'], $import_list_id );
                    $list_added++;
                }
            }
        }

        $redirect = array(
            'page'     => 'culture-subscribers-import',
            'imported' => $imported,
        );
        if ( $list_added ) {
            $redirect['list_added'] = $list_added;
        }

        wp_safe_redirect( add_query_arg( $redirect, admin_url( 'admin.php' ) ) );
        exit;
    }

    /**
     * Handle Add Single Subscriber POST action.
     */
    public static function handle_add_single_subscriber() {
        check_admin_referer( 'culture_add_single_subscriber' );

        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( esc_html__( 'Permission denied.', 'culture-community' ) );
        }

        $email    = sanitize_email( wp_unslash( $_POST['single_email'] ?? '' ) );
        $name     = sanitize_text_field( wp_unslash( $_POST['single_name'] ?? '' ) );
        $location = sanitize_text_field( wp_unslash( $_POST['single_location'] ?? '' ) );
        $list_id  = absint( $_POST['single_list_id'] ?? 0 );

        if ( ! is_email( $email ) ) {
            wp_safe_redirect( add_query_arg( array(
                'page'  => 'culture-subscribers-import',
                'error' => 'invalid_email',
            ), admin_url( 'admin.php' ) ) );
            exit;
        }

        // get_or_create ensures an existing subscriber is returned rather than duplicated.
        $sub_id = Culture_Subscribers_DB::get_or_create( $email, $name, $location );

        if ( $list_id && $sub_id ) {
            Culture_Subscribers_DB::add_subscriber_to_list_id( $sub_id, $list_id );
        }

        wp_safe_redirect( add_query_arg( array(
            'page'  => 'culture-subscribers-import',
            'added' => '1',
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

        // Redirect back to whichever page submitted this (settings page or legacy subscribers page).
        $redirect_page = sanitize_key( $_POST['redirect_page'] ?? 'culture-subscribers-settings' );
        if ( ! in_array( $redirect_page, array( 'culture-subscribers', 'culture-subscribers-settings' ), true ) ) {
            $redirect_page = 'culture-subscribers-settings';
        }

        wp_safe_redirect( add_query_arg( array(
            'page'  => $redirect_page,
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

        Culture_Subscribers_DB::subscribe( $user->user_email, array(), $user->display_name, '', $user_id );
    }

    // ── HELPERS ──────────────────────────────────────────────────────────────

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
