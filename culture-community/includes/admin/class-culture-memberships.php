<?php
/**
 * Connect Pro Membership Manager
 *
 * Admin page for viewing all Pro subscribers and manually managing
 * patron subscriptions — add, edit, set expiry, upgrade or downgrade.
 *
 * Meta keys managed here:
 *   _culture_membership_tier        – 'patron' | 'citizen'
 *   _culture_subscription_status    – 'active' | 'cancelled' | 'non-renewing' | 'expired'
 *   _culture_subscription_type      – 'manual' | 'paystack' | 'stripe'
 *   _culture_subscription_expiry    – Unix timestamp, 0 = never expires
 *   _culture_subscription_notes     – Admin freetext notes
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Culture_Memberships {

	// -------------------------------------------------------------------------
	// Bootstrap
	// -------------------------------------------------------------------------

	public static function init(): void {
		add_action( 'admin_menu', [ __CLASS__, 'register_menu' ] );
		add_action( 'admin_post_culture_save_membership',  [ __CLASS__, 'handle_save' ] );
		add_action( 'admin_post_culture_downgrade_user',   [ __CLASS__, 'handle_downgrade' ] );
		add_action( 'wp_ajax_culture_member_search',       [ __CLASS__, 'ajax_member_search' ] );
	}

	public static function register_menu(): void {
		add_submenu_page(
			'culture-community',
			__( 'Pro Memberships', 'culture-community' ),
			__( 'Pro Memberships', 'culture-community' ),
			'manage_options',
			'culture-memberships',
			[ __CLASS__, 'render_page' ]
		);
	}

	// -------------------------------------------------------------------------
	// Routing — list / edit / add
	// -------------------------------------------------------------------------

	public static function render_page(): void {
		$action  = isset( $_GET['action'] ) ? sanitize_key( $_GET['action'] ) : 'list';
		$user_id = isset( $_GET['user_id'] ) ? absint( $_GET['user_id'] ) : 0;

		echo '<div class="wrap">';

		switch ( $action ) {
			case 'edit':
				self::render_edit_form( $user_id );
				break;
			case 'add':
				self::render_edit_form( 0 );
				break;
			default:
				self::render_list();
				break;
		}

		echo '</div>';
	}

	// -------------------------------------------------------------------------
	// List view
	// -------------------------------------------------------------------------

	private static function render_list(): void {
		$status_filter = isset( $_GET['status'] ) ? sanitize_key( $_GET['status'] ) : '';
		$search        = isset( $_GET['s'] )      ? sanitize_text_field( wp_unslash( $_GET['s'] ) ) : '';
		$paged         = max( 1, isset( $_GET['paged'] ) ? absint( $_GET['paged'] ) : 1 );
		$per_page      = 30;

		// ── Query ──────────────────────────────────────────────────────────────
		$args = [
			'meta_key'   => '_culture_membership_tier',
			'meta_value' => 'patron',
			'number'     => $per_page,
			'offset'     => ( $paged - 1 ) * $per_page,
			'orderby'    => 'registered',
			'order'      => 'DESC',
		];

		if ( $status_filter ) {
			$args['meta_query'] = [
				[ 'key' => '_culture_membership_tier',     'value' => 'patron' ],
				[ 'key' => '_culture_subscription_status', 'value' => $status_filter ],
			];
			unset( $args['meta_key'], $args['meta_value'] );
		}

		if ( $search ) {
			$args['search']         = '*' . $search . '*';
			$args['search_columns'] = [ 'user_login', 'user_email', 'display_name' ];
		}

		$user_query = new WP_User_Query( $args );
		$users      = $user_query->get_results();
		$total      = $user_query->get_total();
		$pages      = ceil( $total / $per_page );

		// ── Counts for status tabs ─────────────────────────────────────────────
		$counts = self::get_status_counts();

		// ── Base URL helpers ──────────────────────────────────────────────────
		$base_url  = admin_url( 'admin.php?page=culture-memberships' );
		$add_url   = $base_url . '&action=add';

		?>
		<h1 class="wp-heading-inline"><?php esc_html_e( 'Connect Pro Memberships', 'culture-community' ); ?></h1>
		<a href="<?php echo esc_url( $add_url ); ?>" class="page-title-action">
			<?php esc_html_e( 'Add New', 'culture-community' ); ?>
		</a>
		<hr class="wp-header-end">

		<?php self::render_notices(); ?>

		<?php /* Status filter tabs */ ?>
		<ul class="subsubsub">
			<?php
			$tabs = [
				''              => __( 'All', 'culture-community' ),
				'active'        => __( 'Active', 'culture-community' ),
				'non-renewing'  => __( 'Non-renewing', 'culture-community' ),
				'cancelled'     => __( 'Cancelled', 'culture-community' ),
				'expired'       => __( 'Expired', 'culture-community' ),
			];
			$tab_links = [];
			foreach ( $tabs as $slug => $label ) {
				$count  = $slug ? ( $counts[ $slug ] ?? 0 ) : array_sum( $counts );
				$url    = $slug ? $base_url . '&status=' . $slug : $base_url;
				$active = ( $status_filter === $slug ) ? ' class="current"' : '';
				$tab_links[] = sprintf(
					'<li><a href="%s"%s>%s <span class="count">(%d)</span></a>',
					esc_url( $url ),
					$active,
					esc_html( $label ),
					$count
				);
			}
			echo implode( ' | </li>', $tab_links ) . '</li>';
			?>
		</ul>

		<?php /* Search form */ ?>
		<form method="get" action="<?php echo esc_url( $base_url ); ?>">
			<input type="hidden" name="page" value="culture-memberships">
			<?php if ( $status_filter ) : ?>
				<input type="hidden" name="status" value="<?php echo esc_attr( $status_filter ); ?>">
			<?php endif; ?>
			<p class="search-box">
				<input type="search" name="s" value="<?php echo esc_attr( $search ); ?>"
					placeholder="<?php esc_attr_e( 'Search by name or email…', 'culture-community' ); ?>"
					style="width:280px">
				<input type="submit" class="button" value="<?php esc_attr_e( 'Search', 'culture-community' ); ?>">
			</p>
		</form>

		<?php /* Main table */ ?>
		<table class="wp-list-table widefat fixed striped">
			<thead>
				<tr>
					<th style="width:22%"><?php esc_html_e( 'User', 'culture-community' ); ?></th>
					<th style="width:20%"><?php esc_html_e( 'Email', 'culture-community' ); ?></th>
					<th style="width:10%"><?php esc_html_e( 'Status', 'culture-community' ); ?></th>
					<th style="width:10%"><?php esc_html_e( 'Type', 'culture-community' ); ?></th>
					<th style="width:18%"><?php esc_html_e( 'Expiry', 'culture-community' ); ?></th>
					<th style="width:20%"><?php esc_html_e( 'Actions', 'culture-community' ); ?></th>
				</tr>
			</thead>
			<tbody>
			<?php if ( empty( $users ) ) : ?>
				<tr><td colspan="6"><em><?php esc_html_e( 'No members found.', 'culture-community' ); ?></em></td></tr>
			<?php else : ?>
				<?php foreach ( $users as $user ) : ?>
					<?php
					$status  = get_user_meta( $user->ID, '_culture_subscription_status', true ) ?: '—';
					$type    = get_user_meta( $user->ID, '_culture_subscription_type',   true ) ?: 'paystack';
					$expiry  = (int) get_user_meta( $user->ID, '_culture_subscription_expiry', true );
					$notes   = get_user_meta( $user->ID, '_culture_subscription_notes',  true );
					$edit_url = $base_url . '&action=edit&user_id=' . $user->ID;

					$expiry_label = $expiry > 0
						? date_i18n( 'j M Y', $expiry )
						: '<span style="color:#888">Never</span>';

					$is_expired = $expiry > 0 && $expiry < time();

					$status_colours = [
						'active'       => '#00a32a',
						'non-renewing' => '#dba617',
						'cancelled'    => '#d63638',
						'expired'      => '#787c82',
					];
					$dot_colour = $status_colours[ $status ] ?? '#787c82';
					?>
					<tr>
						<td>
							<strong><a href="<?php echo esc_url( $edit_url ); ?>"><?php echo esc_html( $user->display_name ); ?></a></strong>
							<?php if ( $notes ) : ?>
								<br><span style="color:#666;font-size:11px"><?php echo esc_html( wp_trim_words( $notes, 8 ) ); ?></span>
							<?php endif; ?>
						</td>
						<td><?php echo esc_html( $user->user_email ); ?></td>
						<td>
							<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:<?php echo esc_attr( $dot_colour ); ?>;margin-right:4px"></span>
							<?php echo esc_html( ucfirst( str_replace( '-', '‑', $status ) ) ); ?>
							<?php if ( $is_expired ) : ?>
								<br><span style="color:#d63638;font-size:11px">Overdue</span>
							<?php endif; ?>
						</td>
						<td><?php echo esc_html( ucfirst( $type ) ); ?></td>
						<td><?php echo wp_kses( $expiry_label, [ 'span' => [ 'style' => [] ] ] ); ?></td>
						<td>
							<a href="<?php echo esc_url( $edit_url ); ?>" class="button button-small">
								<?php esc_html_e( 'Edit', 'culture-community' ); ?>
							</a>
							<?php
							$downgrade_url = wp_nonce_url(
								admin_url( 'admin-post.php?action=culture_downgrade_user&user_id=' . $user->ID ),
								'culture_downgrade_' . $user->ID
							);
							?>
							<a href="<?php echo esc_url( $downgrade_url ); ?>"
								class="button button-small"
								style="color:#d63638"
								onclick="return confirm('<?php esc_attr_e( 'Downgrade this user to Citizen?', 'culture-community' ); ?>')">
								<?php esc_html_e( 'Downgrade', 'culture-community' ); ?>
							</a>
						</td>
					</tr>
				<?php endforeach; ?>
			<?php endif; ?>
			</tbody>
		</table>

		<?php /* Pagination */ ?>
		<?php if ( $pages > 1 ) : ?>
			<div class="tablenav bottom">
				<div class="tablenav-pages">
					<?php
					$pag_args = [ 'base' => $base_url . '%_%', 'format' => '&paged=%#%', 'total' => $pages, 'current' => $paged ];
					if ( $status_filter ) $pag_args['add_args'] = [ 'status' => $status_filter ];
					if ( $search )        $pag_args['add_args']['s'] = $search;
					echo paginate_links( $pag_args );
					?>
				</div>
			</div>
		<?php endif; ?>
		<?php
	}

	// -------------------------------------------------------------------------
	// Add / Edit form
	// -------------------------------------------------------------------------

	private static function render_edit_form( int $user_id ): void {
		$user        = $user_id ? get_user_by( 'id', $user_id ) : null;
		$is_edit     = (bool) $user;
		$back_url    = admin_url( 'admin.php?page=culture-memberships' );

		// Current meta values (defaults for new user)
		$tier    = $is_edit ? ( get_user_meta( $user_id, '_culture_membership_tier',     true ) ?: 'patron'  ) : 'patron';
		$status  = $is_edit ? ( get_user_meta( $user_id, '_culture_subscription_status', true ) ?: 'active'  ) : 'active';
		$type    = $is_edit ? ( get_user_meta( $user_id, '_culture_subscription_type',   true ) ?: 'manual'  ) : 'manual';
		$expiry  = $is_edit ? (int) get_user_meta( $user_id, '_culture_subscription_expiry', true )            : 0;
		$notes   = $is_edit ? get_user_meta( $user_id, '_culture_subscription_notes',   true )                 : '';

		$expiry_value = $expiry > 0 ? date( 'Y-m-d', $expiry ) : '';

		$title = $is_edit
			? sprintf( __( 'Edit Membership: %s', 'culture-community' ), esc_html( $user->display_name ) )
			: __( 'Add Pro Membership', 'culture-community' );
		?>
		<h1><?php echo esc_html( $title ); ?></h1>
		<a href="<?php echo esc_url( $back_url ); ?>">← <?php esc_html_e( 'Back to list', 'culture-community' ); ?></a>
		<hr class="wp-header-end">

		<?php self::render_notices(); ?>

		<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" style="max-width:640px;margin-top:20px">
			<input type="hidden" name="action"  value="culture_save_membership">
			<input type="hidden" name="user_id" value="<?php echo esc_attr( $user_id ); ?>">
			<?php wp_nonce_field( 'culture_save_membership_' . $user_id, '_wpnonce' ); ?>

			<table class="form-table" role="presentation">

				<?php if ( ! $is_edit ) : ?>
				<tr>
					<th><label for="cm_user_search"><?php esc_html_e( 'User', 'culture-community' ); ?></label></th>
					<td>
						<input type="text" id="cm_user_search" name="user_search"
							class="regular-text"
							placeholder="<?php esc_attr_e( 'Type name or email…', 'culture-community' ); ?>"
							autocomplete="off">
						<input type="hidden" id="cm_user_id_hidden" name="new_user_id" value="">
						<div id="cm_user_results" style="border:1px solid #ccc;background:#fff;max-height:160px;overflow-y:auto;display:none;position:absolute;z-index:99;width:300px"></div>
						<p class="description"><?php esc_html_e( 'Search for a registered user to assign Pro membership.', 'culture-community' ); ?></p>
					</td>
				</tr>
				<?php else : ?>
				<tr>
					<th><?php esc_html_e( 'User', 'culture-community' ); ?></th>
					<td>
						<strong><?php echo esc_html( $user->display_name ); ?></strong>
						<span style="color:#666"> — <?php echo esc_html( $user->user_email ); ?></span>
						<br>
						<a href="<?php echo esc_url( get_edit_user_link( $user_id ) ); ?>" target="_blank" style="font-size:12px">
							<?php esc_html_e( 'View WordPress profile ↗', 'culture-community' ); ?>
						</a>
					</td>
				</tr>
				<?php endif; ?>

				<tr>
					<th><label for="cm_tier"><?php esc_html_e( 'Tier', 'culture-community' ); ?></label></th>
					<td>
						<select id="cm_tier" name="tier">
							<option value="patron"  <?php selected( $tier, 'patron'  ); ?>><?php esc_html_e( 'Patron (Pro)', 'culture-community' ); ?></option>
							<option value="citizen" <?php selected( $tier, 'citizen' ); ?>><?php esc_html_e( 'Citizen (Free)', 'culture-community' ); ?></option>
						</select>
					</td>
				</tr>

				<tr>
					<th><label for="cm_status"><?php esc_html_e( 'Status', 'culture-community' ); ?></label></th>
					<td>
						<select id="cm_status" name="status">
							<option value="active"       <?php selected( $status, 'active'       ); ?>><?php esc_html_e( 'Active',        'culture-community' ); ?></option>
							<option value="non-renewing" <?php selected( $status, 'non-renewing' ); ?>><?php esc_html_e( 'Non-renewing',  'culture-community' ); ?></option>
							<option value="cancelled"    <?php selected( $status, 'cancelled'    ); ?>><?php esc_html_e( 'Cancelled',     'culture-community' ); ?></option>
							<option value="expired"      <?php selected( $status, 'expired'      ); ?>><?php esc_html_e( 'Expired',       'culture-community' ); ?></option>
						</select>
					</td>
				</tr>

				<tr>
					<th><label for="cm_type"><?php esc_html_e( 'Subscription Type', 'culture-community' ); ?></label></th>
					<td>
						<select id="cm_type" name="sub_type">
							<option value="manual"   <?php selected( $type, 'manual'   ); ?>><?php esc_html_e( 'Manual (admin-assigned)', 'culture-community' ); ?></option>
							<option value="paystack" <?php selected( $type, 'paystack' ); ?>><?php esc_html_e( 'Paystack',               'culture-community' ); ?></option>
							<option value="stripe"   <?php selected( $type, 'stripe'   ); ?>><?php esc_html_e( 'Stripe',                 'culture-community' ); ?></option>
						</select>
					</td>
				</tr>

				<tr>
					<th><label for="cm_expiry"><?php esc_html_e( 'Expiry Date', 'culture-community' ); ?></label></th>
					<td>
						<input type="date" id="cm_expiry" name="expiry_date" value="<?php echo esc_attr( $expiry_value ); ?>">
						<p class="description"><?php esc_html_e( 'Leave blank for no expiry. When this date passes, the daily cron will automatically downgrade the user to Citizen.', 'culture-community' ); ?></p>
					</td>
				</tr>

				<tr>
					<th><label for="cm_notes"><?php esc_html_e( 'Admin Notes', 'culture-community' ); ?></label></th>
					<td>
						<textarea id="cm_notes" name="notes" rows="3" class="large-text"><?php echo esc_textarea( $notes ); ?></textarea>
						<p class="description"><?php esc_html_e( 'Internal notes — not visible to the user.', 'culture-community' ); ?></p>
					</td>
				</tr>

			</table>

			<?php submit_button( $is_edit ? __( 'Save Changes', 'culture-community' ) : __( 'Add Membership', 'culture-community' ) ); ?>
		</form>

		<?php /* Live user search JS (only on Add form) */ ?>
		<?php if ( ! $is_edit ) : ?>
		<script>
		(function() {
			const input   = document.getElementById('cm_user_search');
			const hidden  = document.getElementById('cm_user_id_hidden');
			const results = document.getElementById('cm_user_results');
			let timer;

			input.addEventListener('input', function() {
				clearTimeout(timer);
				const q = this.value.trim();
				if ( q.length < 2 ) { results.style.display = 'none'; return; }
				timer = setTimeout(function() {
					fetch('<?php echo esc_url( admin_url( 'admin-ajax.php' ) ); ?>?action=culture_member_search&q=' + encodeURIComponent(q) + '&_wpnonce=<?php echo esc_js( wp_create_nonce( 'culture_member_search' ) ); ?>')
						.then(r => r.json())
						.then(data => {
							results.innerHTML = '';
							if ( ! data.length ) {
								results.innerHTML = '<div style="padding:8px;color:#666">No users found.</div>';
							} else {
								data.forEach(u => {
									const d = document.createElement('div');
									d.style.cssText = 'padding:8px 12px;cursor:pointer;border-bottom:1px solid #eee';
									d.textContent   = u.display_name + ' (' + u.email + ')';
									d.addEventListener('mouseenter', () => d.style.background = '#f0f6fc');
									d.addEventListener('mouseleave', () => d.style.background = '');
									d.addEventListener('click', () => {
										input.value          = u.display_name + ' (' + u.email + ')';
										hidden.value         = u.id;
										results.style.display = 'none';
									});
									results.appendChild(d);
								});
							}
							results.style.display = 'block';
						});
				}, 250);
			});

			document.addEventListener('click', function(e) {
				if ( ! results.contains(e.target) && e.target !== input ) {
					results.style.display = 'none';
				}
			});
		})();
		</script>
		<?php endif; ?>
		<?php
	}

	// -------------------------------------------------------------------------
	// AJAX — user search
	// -------------------------------------------------------------------------

	public static function ajax_member_search(): void {
		check_ajax_referer( 'culture_member_search' );
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( [], 403 );
		}

		$q = sanitize_text_field( wp_unslash( $_GET['q'] ?? '' ) );
		if ( strlen( $q ) < 2 ) {
			wp_send_json( [] );
		}

		$users = get_users( [
			'search'         => '*' . $q . '*',
			'search_columns' => [ 'user_login', 'user_email', 'display_name' ],
			'number'         => 10,
			'fields'         => [ 'ID', 'display_name', 'user_email' ],
		] );

		$result = array_map( fn( $u ) => [
			'id'           => $u->ID,
			'display_name' => $u->display_name,
			'email'        => $u->user_email,
		], $users );

		wp_send_json( $result );
	}

	// -------------------------------------------------------------------------
	// Form handler — save / add membership
	// -------------------------------------------------------------------------

	public static function handle_save(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'Insufficient permissions.', 'culture-community' ) );
		}

		$posted_user_id = absint( $_POST['user_id'] ?? 0 );
		$new_user_id    = absint( $_POST['new_user_id'] ?? 0 );
		$user_id        = $posted_user_id ?: $new_user_id;

		check_admin_referer( 'culture_save_membership_' . $posted_user_id );

		if ( ! $user_id || ! get_user_by( 'id', $user_id ) ) {
			self::redirect_with_notice( 'error', __( 'User not found.', 'culture-community' ), $posted_user_id );
			return;
		}

		$tier        = in_array( $_POST['tier'] ?? '', [ 'patron', 'citizen' ], true ) ? $_POST['tier'] : 'patron';
		$status      = in_array( $_POST['status'] ?? '', [ 'active', 'cancelled', 'non-renewing', 'expired' ], true ) ? $_POST['status'] : 'active';
		$sub_type    = in_array( $_POST['sub_type'] ?? '', [ 'manual', 'paystack', 'stripe' ], true ) ? $_POST['sub_type'] : 'manual';
		$expiry_date = sanitize_text_field( $_POST['expiry_date'] ?? '' );
		$notes       = sanitize_textarea_field( $_POST['notes'] ?? '' );

		// Convert date string to Unix timestamp (0 = no expiry)
		$expiry_ts = 0;
		if ( $expiry_date ) {
			$dt = DateTime::createFromFormat( 'Y-m-d', $expiry_date, new DateTimeZone( 'UTC' ) );
			if ( $dt ) {
				// Set to end of day
				$dt->setTime( 23, 59, 59 );
				$expiry_ts = $dt->getTimestamp();
			}
		}

		update_user_meta( $user_id, '_culture_membership_tier',     $tier );
		update_user_meta( $user_id, '_culture_subscription_status', $status );
		update_user_meta( $user_id, '_culture_subscription_type',   $sub_type );
		update_user_meta( $user_id, '_culture_subscription_expiry', $expiry_ts );
		update_user_meta( $user_id, '_culture_subscription_notes',  $notes );

		// If downgraded to citizen via the form, remove secondary chapter
		if ( 'citizen' === $tier ) {
			delete_user_meta( $user_id, '_culture_secondary_chapter_id' );
		}

		self::redirect_with_notice(
			'updated',
			__( 'Membership saved successfully.', 'culture-community' ),
			$user_id
		);
	}

	// -------------------------------------------------------------------------
	// Quick downgrade action (from list view)
	// -------------------------------------------------------------------------

	public static function handle_downgrade(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'Insufficient permissions.', 'culture-community' ) );
		}

		$user_id = absint( $_GET['user_id'] ?? 0 );
		check_admin_referer( 'culture_downgrade_' . $user_id );

		if ( ! $user_id || ! get_user_by( 'id', $user_id ) ) {
			self::redirect_with_notice( 'error', __( 'User not found.', 'culture-community' ) );
			return;
		}

		update_user_meta( $user_id, '_culture_membership_tier',     'citizen' );
		update_user_meta( $user_id, '_culture_subscription_status', 'cancelled' );
		delete_user_meta( $user_id, '_culture_secondary_chapter_id' );

		self::redirect_with_notice( 'updated', __( 'User downgraded to Citizen.', 'culture-community' ) );
	}

	// -------------------------------------------------------------------------
	// Status counts for tabs
	// -------------------------------------------------------------------------

	private static function get_status_counts(): array {
		global $wpdb;

		$rows = $wpdb->get_results(
			"SELECT m2.meta_value AS status, COUNT(*) AS cnt
			 FROM {$wpdb->usermeta} m1
			 INNER JOIN {$wpdb->usermeta} m2
			   ON m1.user_id = m2.user_id
			  AND m2.meta_key = '_culture_subscription_status'
			 WHERE m1.meta_key  = '_culture_membership_tier'
			   AND m1.meta_value = 'patron'
			 GROUP BY m2.meta_value"
		);

		$counts = [];
		foreach ( $rows as $row ) {
			$counts[ $row->status ] = (int) $row->cnt;
		}
		return $counts;
	}

	// -------------------------------------------------------------------------
	// Helpers
	// -------------------------------------------------------------------------

	private static function redirect_with_notice( string $type, string $message, int $user_id = 0 ): void {
		$url = admin_url( 'admin.php?page=culture-memberships' );
		if ( $user_id ) {
			$url .= '&action=edit&user_id=' . $user_id;
		}
		$url .= '&cm_notice=' . $type . '&cm_msg=' . rawurlencode( $message );
		wp_safe_redirect( $url );
		exit;
	}

	private static function render_notices(): void {
		if ( empty( $_GET['cm_notice'] ) ) {
			return;
		}
		$type    = 'updated' === sanitize_key( $_GET['cm_notice'] ) ? 'updated' : 'error';
		$message = sanitize_text_field( urldecode( $_GET['cm_msg'] ?? '' ) );
		printf( '<div class="notice %s is-dismissible"><p>%s</p></div>', esc_attr( $type ), esc_html( $message ) );
	}
}

Culture_Memberships::init();
