<?php
/**
 * Admin CRUD interface for Partner Perks (including airtime perk type).
 *
 * Registers a "Perks" submenu under Moveee Community and handles
 * list, add, edit, and delete actions for wp_culture_partner_perks.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Culture_Perks_Admin {

    public static function init(): void {
        add_action( 'admin_menu', [ __CLASS__, 'register_menu' ] );
        add_action( 'admin_post_culture_save_perk',   [ __CLASS__, 'handle_save' ] );
        add_action( 'admin_post_culture_delete_perk', [ __CLASS__, 'handle_delete' ] );
    }

    public static function register_menu(): void {
        add_submenu_page(
            'culture-community',
            __( 'Perks', 'culture-community' ),
            __( 'Perks', 'culture-community' ),
            'manage_options',
            'culture-perks',
            [ __CLASS__, 'render_page' ]
        );
    }

    // ── Router ─────────────────────────────────────────────────────────────────

    public static function render_page(): void {
        $action = sanitize_key( $_GET['action'] ?? 'list' );
        $id     = isset( $_GET['perk_id'] ) ? (int) $_GET['perk_id'] : 0;

        if ( 'add' === $action || 'edit' === $action ) {
            self::render_form( $id );
        } else {
            self::render_list();
        }
    }

    // ── List view ──────────────────────────────────────────────────────────────

    private static function render_list(): void {
        global $wpdb;

        $table = $wpdb->prefix . 'culture_partner_perks';
        $type  = isset( $_GET['perk_type'] ) ? sanitize_key( $_GET['perk_type'] ) : '';

        // Filters
        $where  = '1=1';
        $values = [];
        if ( $type ) {
            $where   .= ' AND perk_type = %s';
            $values[] = $type;
        }

        $per_page     = 30;
        $current_page = max( 1, (int) ( $_GET['paged'] ?? 1 ) );
        $offset       = ( $current_page - 1 ) * $per_page;

        $count_sql = "SELECT COUNT(*) FROM {$table} WHERE {$where}";
        $total     = (int) ( $values
            ? $wpdb->get_var( $wpdb->prepare( $count_sql, ...$values ) )
            : $wpdb->get_var( $count_sql ) );

        $rows_sql   = "SELECT * FROM {$table} WHERE {$where} ORDER BY id DESC LIMIT %d OFFSET %d";
        $all_values = array_merge( $values, [ $per_page, $offset ] );
        $perks      = $wpdb->get_results( $wpdb->prepare( $rows_sql, ...$all_values ), ARRAY_A ) ?: [];

        $total_pages = max( 1, (int) ceil( $total / $per_page ) );

        $notice = '';
        if ( isset( $_GET['saved'] ) ) {
            $notice = '<div class="notice notice-success is-dismissible"><p>' . esc_html__( 'Perk saved.', 'culture-community' ) . '</p></div>';
        } elseif ( isset( $_GET['deleted'] ) ) {
            $notice = '<div class="notice notice-success is-dismissible"><p>' . esc_html__( 'Perk deleted.', 'culture-community' ) . '</p></div>';
        }
        ?>
        <div class="wrap">
            <h1 class="wp-heading-inline"><?php esc_html_e( 'Partner Perks', 'culture-community' ); ?></h1>
            <a href="<?php echo esc_url( admin_url( 'admin.php?page=culture-perks&action=add' ) ); ?>" class="page-title-action">
                <?php esc_html_e( 'Add New', 'culture-community' ); ?>
            </a>
            <hr class="wp-header-end">
            <?php echo $notice; // phpcs:ignore WordPress.Security.EscapeOutput ?>

            <form method="get" style="margin-bottom:12px;">
                <input type="hidden" name="page" value="culture-perks">
                <select name="perk_type">
                    <option value=""><?php esc_html_e( 'All types', 'culture-community' ); ?></option>
                    <option value="partner"     <?php selected( $type, 'partner' ); ?>><?php esc_html_e( 'Partner (QR code)', 'culture-community' ); ?></option>
                    <option value="airtime"     <?php selected( $type, 'airtime' ); ?>><?php esc_html_e( 'Airtime Reward', 'culture-community' ); ?></option>
                    <option value="data_bundle" <?php selected( $type, 'data_bundle' ); ?>><?php esc_html_e( 'Data Bundle', 'culture-community' ); ?></option>
                </select>
                <?php submit_button( __( 'Filter', 'culture-community' ), 'secondary', '', false ); ?>
            </form>

            <table class="widefat striped">
                <thead>
                    <tr>
                        <th><?php esc_html_e( 'ID', 'culture-community' ); ?></th>
                        <th><?php esc_html_e( 'Title', 'culture-community' ); ?></th>
                        <th><?php esc_html_e( 'Type', 'culture-community' ); ?></th>
                        <th><?php esc_html_e( 'Credits', 'culture-community' ); ?></th>
                        <th><?php esc_html_e( 'Airtime amount', 'culture-community' ); ?></th>
                        <th><?php esc_html_e( 'Country', 'culture-community' ); ?></th>
                        <th><?php esc_html_e( 'Redeemed', 'culture-community' ); ?></th>
                        <th><?php esc_html_e( 'Status', 'culture-community' ); ?></th>
                        <th><?php esc_html_e( 'Actions', 'culture-community' ); ?></th>
                    </tr>
                </thead>
                <tbody>
                    <?php if ( empty( $perks ) ) : ?>
                        <tr><td colspan="9"><?php esc_html_e( 'No perks found.', 'culture-community' ); ?></td></tr>
                    <?php else : ?>
                        <?php foreach ( $perks as $perk ) : ?>
                            <?php
                            $edit_url   = admin_url( 'admin.php?page=culture-perks&action=edit&perk_id=' . (int) $perk['id'] );
                            $delete_url = wp_nonce_url(
                                admin_url( 'admin-post.php?action=culture_delete_perk&perk_id=' . (int) $perk['id'] ),
                                'culture_delete_perk_' . (int) $perk['id']
                            );
                            $is_airtime      = 'airtime'      === ( $perk['perk_type'] ?? 'partner' );
                            $is_data_bundle  = 'data_bundle'  === ( $perk['perk_type'] ?? 'partner' );
                            $is_delivery     = $is_airtime || $is_data_bundle;
                            ?>
                            <tr>
                                <td><?php echo (int) $perk['id']; ?></td>
                                <td><strong><?php echo esc_html( $perk['title'] ); ?></strong></td>
                                <td>
                                    <?php if ( $is_airtime ) : ?>
                                        <span style="background:#e6f0ff;color:#1a5ab5;padding:2px 8px;border-radius:3px;font-size:12px;font-weight:600;">📱 Airtime</span>
                                    <?php elseif ( $is_data_bundle ) : ?>
                                        <span style="background:#e8f5e9;color:#1b6b2a;padding:2px 8px;border-radius:3px;font-size:12px;font-weight:600;">📶 Data</span>
                                    <?php else : ?>
                                        <span style="background:#f0f0f0;color:#555;padding:2px 8px;border-radius:3px;font-size:12px;">Partner</span>
                                    <?php endif; ?>
                                </td>
                                <td><?php echo (int) $perk['credit_cost']; ?></td>
                                <td>
                                    <?php if ( $is_delivery ) :
                                        $sym = 'NG' === ( $perk['airtime_country'] ?: 'NG' ) ? '₦' : '';
                                        echo esc_html( $sym . number_format( (int) $perk['airtime_amount_local'] ) );
                                        if ( $is_data_bundle && ! empty( $perk['data_bundle_code'] ) ) {
                                            echo ' <small style="color:#666;">(' . esc_html( $perk['data_bundle_code'] ) . ')</small>';
                                        }
                                    else : ?>—<?php endif; ?>
                                </td>
                                <td><?php echo $is_delivery ? esc_html( $perk['airtime_country'] ?: 'NG' ) : '—'; ?></td>
                                <td>
                                    <?php echo (int) $perk['redeemed_count']; ?>
                                    <?php if ( (int) $perk['max_total'] > 0 ) : ?>
                                        / <?php echo (int) $perk['max_total']; ?>
                                    <?php endif; ?>
                                </td>
                                <td>
                                    <?php
                                    $status_colors = [
                                        'active'   => '#0f7928',
                                        'inactive' => '#666',
                                        'archived' => '#999',
                                    ];
                                    $st = esc_html( $perk['status'] );
                                    $sc = $status_colors[ $perk['status'] ] ?? '#666';
                                    echo "<span style='color:{$sc};font-weight:600;'>{$st}</span>";
                                    ?>
                                </td>
                                <td>
                                    <a href="<?php echo esc_url( $edit_url ); ?>"><?php esc_html_e( 'Edit', 'culture-community' ); ?></a>
                                    &nbsp;|&nbsp;
                                    <a href="<?php echo esc_url( $delete_url ); ?>"
                                       onclick="return confirm('<?php esc_attr_e( 'Delete this perk? This cannot be undone.', 'culture-community' ); ?>')"
                                       style="color:#a00;"><?php esc_html_e( 'Delete', 'culture-community' ); ?></a>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>

            <?php if ( $total_pages > 1 ) : ?>
                <div class="tablenav bottom">
                    <div class="tablenav-pages">
                        <?php
                        $page_links = paginate_links( [
                            'base'      => add_query_arg( 'paged', '%#%' ),
                            'format'    => '',
                            'current'   => $current_page,
                            'total'     => $total_pages,
                            'prev_text' => '&laquo;',
                            'next_text' => '&raquo;',
                        ] );
                        echo $page_links; // phpcs:ignore WordPress.Security.EscapeOutput
                        ?>
                    </div>
                </div>
            <?php endif; ?>
        </div>
        <?php
    }

    // ── Add / Edit form ────────────────────────────────────────────────────────

    private static function render_form( int $perk_id ): void {
        global $wpdb;

        $is_edit = $perk_id > 0;
        $table   = $wpdb->prefix . 'culture_partner_perks';

        $defaults = [
            'id'                   => 0,
            'title'                => '',
            'description'          => '',
            'credit_cost'          => 100,
            'min_spend'            => 0,
            'min_spend_currency'   => 'GBP',
            'expiry_days'          => 30,
            'max_per_user'         => 1,
            'max_total'            => 0,
            'status'               => 'active',
            'partner_directory_id' => 0,
            'min_rep_tier'         => 'member',
            'perk_type'            => 'partner',
            'airtime_country'      => 'NG',
            'airtime_amount_local' => 0,
            'data_bundle_code'     => '',
        ];

        $perk = $defaults;
        if ( $is_edit ) {
            $row = $wpdb->get_row( $wpdb->prepare(
                "SELECT * FROM {$table} WHERE id = %d",
                $perk_id
            ), ARRAY_A );
            if ( ! $row ) {
                echo '<div class="wrap"><p>' . esc_html__( 'Perk not found.', 'culture-community' ) . '</p></div>';
                return;
            }
            $perk = array_merge( $defaults, $row );
        }

        $form_action     = esc_url( admin_url( 'admin-post.php' ) );
        $cancel_url      = esc_url( admin_url( 'admin.php?page=culture-perks' ) );
        $is_airtime      = 'airtime'      === $perk['perk_type'];
        $is_data_bundle  = 'data_bundle'  === $perk['perk_type'];
        $is_delivery     = $is_airtime || $is_data_bundle;
        ?>
        <div class="wrap">
            <h1><?php echo $is_edit ? esc_html__( 'Edit Perk', 'culture-community' ) : esc_html__( 'Add New Perk', 'culture-community' ); ?></h1>
            <a href="<?php echo $cancel_url; ?>">&larr; <?php esc_html_e( 'Back to perks', 'culture-community' ); ?></a>

            <style>
                #perks-form .form-table th { width: 220px; }
                #airtime-fields      { display: <?php echo $is_delivery     ? 'table-row-group' : 'none'; ?>; }
                #data-bundle-fields  { display: <?php echo $is_data_bundle  ? 'table-row-group' : 'none'; ?>; }
                #partner-fields      { display: <?php echo $is_delivery     ? 'none' : 'table-row-group'; ?>; }
            </style>

            <form id="perks-form" method="post" action="<?php echo $form_action; ?>">
                <input type="hidden" name="action"  value="culture_save_perk">
                <input type="hidden" name="perk_id" value="<?php echo (int) $perk['id']; ?>">
                <?php wp_nonce_field( 'culture_save_perk' ); ?>

                <h2 class="title"><?php esc_html_e( 'General', 'culture-community' ); ?></h2>
                <table class="form-table">
                    <tr>
                        <th><label for="perk_type"><?php esc_html_e( 'Perk type', 'culture-community' ); ?></label></th>
                        <td>
                            <label style="margin-right:20px;">
                                <input type="radio" name="perk_type" value="partner" <?php checked( $perk['perk_type'], 'partner' ); ?>>
                                <?php esc_html_e( 'Partner (QR code coupon)', 'culture-community' ); ?>
                            </label>
                            <label style="margin-right:20px;">
                                <input type="radio" name="perk_type" value="airtime" <?php checked( $perk['perk_type'], 'airtime' ); ?>>
                                📱 <?php esc_html_e( 'Airtime Reward (Flutterwave, auto-delivered)', 'culture-community' ); ?>
                            </label>
                            <label>
                                <input type="radio" name="perk_type" value="data_bundle" <?php checked( $perk['perk_type'], 'data_bundle' ); ?>>
                                📶 <?php esc_html_e( 'Data Bundle (Flutterwave, auto-delivered)', 'culture-community' ); ?>
                            </label>
                        </td>
                    </tr>
                    <tr>
                        <th><label for="perk_title"><?php esc_html_e( 'Title', 'culture-community' ); ?></label></th>
                        <td><input type="text" id="perk_title" name="title" value="<?php echo esc_attr( $perk['title'] ); ?>" class="regular-text" required></td>
                    </tr>
                    <tr>
                        <th><label for="perk_description"><?php esc_html_e( 'Description', 'culture-community' ); ?></label></th>
                        <td><textarea id="perk_description" name="description" rows="3" class="large-text"><?php echo esc_textarea( $perk['description'] ); ?></textarea></td>
                    </tr>
                    <tr>
                        <th><label for="credit_cost"><?php esc_html_e( 'Credit cost', 'culture-community' ); ?></label></th>
                        <td><input type="number" id="credit_cost" name="credit_cost" value="<?php echo (int) $perk['credit_cost']; ?>" min="1" class="small-text" required></td>
                    </tr>
                    <tr>
                        <th><label for="perk_status"><?php esc_html_e( 'Status', 'culture-community' ); ?></label></th>
                        <td>
                            <select id="perk_status" name="status">
                                <option value="active"   <?php selected( $perk['status'], 'active' ); ?>><?php esc_html_e( 'Active', 'culture-community' ); ?></option>
                                <option value="inactive" <?php selected( $perk['status'], 'inactive' ); ?>><?php esc_html_e( 'Inactive', 'culture-community' ); ?></option>
                                <option value="archived" <?php selected( $perk['status'], 'archived' ); ?>><?php esc_html_e( 'Archived', 'culture-community' ); ?></option>
                            </select>
                        </td>
                    </tr>
                    <tr>
                        <th><label for="max_per_user"><?php esc_html_e( 'Max per user', 'culture-community' ); ?></label></th>
                        <td>
                            <input type="number" id="max_per_user" name="max_per_user" value="<?php echo (int) $perk['max_per_user']; ?>" min="0" class="small-text">
                            <p class="description"><?php esc_html_e( '0 = unlimited.', 'culture-community' ); ?></p>
                        </td>
                    </tr>
                    <tr>
                        <th><label for="max_total"><?php esc_html_e( 'Max total redemptions', 'culture-community' ); ?></label></th>
                        <td>
                            <input type="number" id="max_total" name="max_total" value="<?php echo (int) $perk['max_total']; ?>" min="0" class="small-text">
                            <p class="description"><?php esc_html_e( '0 = unlimited.', 'culture-community' ); ?></p>
                        </td>
                    </tr>
                    <tr>
                        <th><label for="min_rep_tier"><?php esc_html_e( 'Minimum reputation tier', 'culture-community' ); ?></label></th>
                        <td>
                            <select id="min_rep_tier" name="min_rep_tier">
                                <option value="member"              <?php selected( $perk['min_rep_tier'], 'member' ); ?>><?php esc_html_e( 'Member (any)', 'culture-community' ); ?></option>
                                <option value="culture-contributor" <?php selected( $perk['min_rep_tier'], 'culture-contributor' ); ?>><?php esc_html_e( 'Culture Contributor', 'culture-community' ); ?></option>
                                <option value="taste-maker"         <?php selected( $perk['min_rep_tier'], 'taste-maker' ); ?>><?php esc_html_e( 'Taste Maker', 'culture-community' ); ?></option>
                                <option value="culture-authority"   <?php selected( $perk['min_rep_tier'], 'culture-authority' ); ?>><?php esc_html_e( 'Culture Authority', 'culture-community' ); ?></option>
                                <option value="culture-icon"        <?php selected( $perk['min_rep_tier'], 'culture-icon' ); ?>><?php esc_html_e( 'Culture Icon', 'culture-community' ); ?></option>
                            </select>
                        </td>
                    </tr>
                </table>

                <!-- ── Airtime / Data bundle shared fields ──────────────────────── -->
                <h2 class="title" id="airtime-heading" style="display:<?php echo $is_delivery ? 'block' : 'none'; ?>;">
                    <?php esc_html_e( 'Delivery settings (Flutterwave)', 'culture-community' ); ?>
                </h2>
                <table class="form-table">
                    <tbody id="airtime-fields">
                        <tr>
                            <th><label for="airtime_country"><?php esc_html_e( 'Country', 'culture-community' ); ?></label></th>
                            <td>
                                <select id="airtime_country" name="airtime_country">
                                    <option value="NG" <?php selected( $perk['airtime_country'], 'NG' ); ?>>🇳🇬 Nigeria (NG)</option>
                                    <option value="GH" <?php selected( $perk['airtime_country'], 'GH' ); ?>>🇬🇭 Ghana (GH)</option>
                                    <option value="KE" <?php selected( $perk['airtime_country'], 'KE' ); ?>>🇰🇪 Kenya (KE)</option>
                                    <option value="ZA" <?php selected( $perk['airtime_country'], 'ZA' ); ?>>🇿🇦 South Africa (ZA)</option>
                                    <option value="UG" <?php selected( $perk['airtime_country'], 'UG' ); ?>>🇺🇬 Uganda (UG)</option>
                                    <option value="TZ" <?php selected( $perk['airtime_country'], 'TZ' ); ?>>🇹🇿 Tanzania (TZ)</option>
                                </select>
                                <p class="description"><?php esc_html_e( 'ISO country code sent to Flutterwave Bills API.', 'culture-community' ); ?></p>
                            </td>
                        </tr>
                        <tr>
                            <th><label for="airtime_amount_local"><?php esc_html_e( 'Amount (local currency)', 'culture-community' ); ?></label></th>
                            <td>
                                <input type="number" id="airtime_amount_local" name="airtime_amount_local" value="<?php echo (int) $perk['airtime_amount_local']; ?>" min="0" class="small-text">
                                <p class="description"><?php esc_html_e( 'e.g. 500 for ₦500. Face value sent to the recipient\'s phone.', 'culture-community' ); ?></p>
                            </td>
                        </tr>
                    </tbody>
                    <!-- ── Data bundle only ─────────────────────────────────────── -->
                    <tbody id="data-bundle-fields">
                        <tr>
                            <th><label for="data_bundle_code"><?php esc_html_e( 'Bundle type (Flutterwave type code)', 'culture-community' ); ?></label></th>
                            <td>
                                <input type="text" id="data_bundle_code" name="data_bundle_code" value="<?php echo esc_attr( $perk['data_bundle_code'] ); ?>" class="regular-text" placeholder="e.g. MTNDATA">
                                <p class="description">
                                    <?php esc_html_e( 'The Flutterwave bill type for this data bundle, e.g. MTNDATA, AIRTELDATA, GLODATA, 9MOBILEDATA. Get the exact value from your Flutterwave dashboard → Bills → Categories.', 'culture-community' ); ?>
                                </p>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <!-- ── Partner-specific fields ────────────────────────────────── -->
                <h2 class="title" id="partner-heading" style="display:<?php echo $is_airtime ? 'none' : 'block'; ?>;">
                    <?php esc_html_e( 'Partner / coupon settings', 'culture-community' ); ?>
                </h2>
                <table class="form-table">
                    <tbody id="partner-fields">
                        <tr>
                            <th><label for="expiry_days"><?php esc_html_e( 'Coupon expiry (days)', 'culture-community' ); ?></label></th>
                            <td>
                                <input type="number" id="expiry_days" name="expiry_days" value="<?php echo (int) $perk['expiry_days']; ?>" min="1" class="small-text">
                            </td>
                        </tr>
                        <tr>
                            <th><label for="min_spend"><?php esc_html_e( 'Min spend (pence / cents / kobo)', 'culture-community' ); ?></label></th>
                            <td>
                                <input type="number" id="min_spend" name="min_spend" value="<?php echo (int) $perk['min_spend']; ?>" min="0" class="small-text">
                                <select name="min_spend_currency">
                                    <option value="GBP" <?php selected( $perk['min_spend_currency'], 'GBP' ); ?>>GBP</option>
                                    <option value="USD" <?php selected( $perk['min_spend_currency'], 'USD' ); ?>>USD</option>
                                    <option value="NGN" <?php selected( $perk['min_spend_currency'], 'NGN' ); ?>>NGN</option>
                                </select>
                            </td>
                        </tr>
                        <tr>
                            <th><label for="partner_directory_id"><?php esc_html_e( 'Partner directory ID', 'culture-community' ); ?></label></th>
                            <td>
                                <input type="number" id="partner_directory_id" name="partner_directory_id" value="<?php echo (int) $perk['partner_directory_id']; ?>" min="0" class="small-text">
                                <p class="description"><?php esc_html_e( '0 = not linked to a directory entry.', 'culture-community' ); ?></p>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <?php if ( $is_edit && class_exists( 'Culture_Flutterwave' ) && $is_delivery ) : ?>
                    <p style="color:<?php echo Culture_Flutterwave::is_configured() ? '#0f7928' : '#a00'; ?>;">
                        <?php if ( Culture_Flutterwave::is_configured() ) : ?>
                            ✅ <?php esc_html_e( 'Flutterwave is configured — airtime delivery is live.', 'culture-community' ); ?>
                        <?php else : ?>
                            ⚠️ <?php echo wp_kses_post( sprintf(
                                /* translators: %s: settings page URL */
                                __( 'Flutterwave secret key is <strong>not configured</strong>. <a href="%s">Add it in Settings → Payment</a>.', 'culture-community' ),
                                esc_url( admin_url( 'admin.php?page=culture-community&tab=payment' ) )
                            ) ); ?>
                        <?php endif; ?>
                    </p>
                <?php endif; ?>

                <p class="submit">
                    <?php submit_button( $is_edit ? __( 'Update perk', 'culture-community' ) : __( 'Add perk', 'culture-community' ), 'primary', '', false ); ?>
                    <a href="<?php echo $cancel_url; ?>" class="button"><?php esc_html_e( 'Cancel', 'culture-community' ); ?></a>
                </p>
            </form>

            <script>
            (function() {
                var radios = document.querySelectorAll('input[name="perk_type"]');
                function toggle() {
                    var val        = document.querySelector('input[name="perk_type"]:checked').value;
                    var isAirtime  = val === 'airtime';
                    var isData     = val === 'data_bundle';
                    var isDelivery = isAirtime || isData;
                    document.getElementById('airtime-fields').style.display      = isDelivery ? 'table-row-group' : 'none';
                    document.getElementById('data-bundle-fields').style.display  = isData     ? 'table-row-group' : 'none';
                    document.getElementById('partner-fields').style.display      = isDelivery ? 'none' : 'table-row-group';
                    document.getElementById('airtime-heading').style.display     = isDelivery ? '' : 'none';
                    document.getElementById('partner-heading').style.display     = isDelivery ? 'none' : '';
                }
                radios.forEach(function(r) { r.addEventListener('change', toggle); });
            })();
            </script>
        </div>
        <?php
    }

    // ── Save handler ───────────────────────────────────────────────────────────

    public static function handle_save(): void {
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( esc_html__( 'Permission denied.', 'culture-community' ) );
        }
        check_admin_referer( 'culture_save_perk' );

        global $wpdb;
        $table   = $wpdb->prefix . 'culture_partner_perks';
        $perk_id = (int) ( $_POST['perk_id'] ?? 0 );

        $perk_type = in_array( $_POST['perk_type'] ?? '', [ 'partner', 'airtime', 'data_bundle' ], true )
            ? sanitize_key( $_POST['perk_type'] )
            : 'partner';

        $data = [
            'title'                => sanitize_text_field( $_POST['title'] ?? '' ),
            'description'          => sanitize_textarea_field( $_POST['description'] ?? '' ),
            'credit_cost'          => max( 1, (int) ( $_POST['credit_cost'] ?? 100 ) ),
            'status'               => in_array( $_POST['status'] ?? '', [ 'active', 'inactive', 'archived' ], true )
                                        ? sanitize_key( $_POST['status'] )
                                        : 'active',
            'max_per_user'         => max( 0, (int) ( $_POST['max_per_user'] ?? 1 ) ),
            'max_total'            => max( 0, (int) ( $_POST['max_total'] ?? 0 ) ),
            'min_rep_tier'         => sanitize_key( $_POST['min_rep_tier'] ?? 'member' ),
            'perk_type'            => $perk_type,
            'airtime_country'      => strtoupper( sanitize_text_field( $_POST['airtime_country'] ?? 'NG' ) ),
            'airtime_amount_local' => max( 0, (int) ( $_POST['airtime_amount_local'] ?? 0 ) ),
            'data_bundle_code'     => sanitize_text_field( $_POST['data_bundle_code'] ?? '' ),
            'expiry_days'          => max( 1, (int) ( $_POST['expiry_days'] ?? 30 ) ),
            'min_spend'            => max( 0, (int) ( $_POST['min_spend'] ?? 0 ) ),
            'min_spend_currency'   => in_array( $_POST['min_spend_currency'] ?? '', [ 'GBP', 'USD', 'NGN' ], true )
                                        ? strtoupper( sanitize_text_field( $_POST['min_spend_currency'] ) )
                                        : 'GBP',
            'partner_directory_id' => max( 0, (int) ( $_POST['partner_directory_id'] ?? 0 ) ),
        ];

        $formats = [ '%s', '%s', '%d', '%s', '%d', '%d', '%s', '%s', '%s', '%d', '%s', '%d', '%d', '%s', '%d' ];

        if ( $perk_id > 0 ) {
            $wpdb->update( $table, $data, [ 'id' => $perk_id ], $formats, [ '%d' ] );
        } else {
            $data['redeemed_count'] = 0;
            $data['created_at']     = current_time( 'mysql', true );
            $formats[]              = '%d';
            $formats[]              = '%s';
            $wpdb->insert( $table, $data, $formats );
        }

        wp_safe_redirect( admin_url( 'admin.php?page=culture-perks&saved=1' ) );
        exit;
    }

    // ── Delete handler ─────────────────────────────────────────────────────────

    public static function handle_delete(): void {
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( esc_html__( 'Permission denied.', 'culture-community' ) );
        }

        $perk_id = (int) ( $_GET['perk_id'] ?? 0 );
        check_admin_referer( 'culture_delete_perk_' . $perk_id );

        if ( $perk_id > 0 ) {
            global $wpdb;
            $wpdb->delete( $wpdb->prefix . 'culture_partner_perks', [ 'id' => $perk_id ], [ '%d' ] );
        }

        wp_safe_redirect( admin_url( 'admin.php?page=culture-perks&deleted=1' ) );
        exit;
    }
}
