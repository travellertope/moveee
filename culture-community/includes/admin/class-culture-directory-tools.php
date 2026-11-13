<?php
/**
 * Directory Tools admin page.
 *
 * Provides a no-code interface for:
 *   1. Wikipedia Backfill – enrich all published entries from Wikipedia/Wikidata.
 *   2. Wikipedia Seeder   – seed new entries from a Wikipedia category or title list.
 *
 * Both panels call the Wikipedia/Wikidata APIs directly (no Vercel round-trip needed).
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Culture_Directory_Tools {

	public static function init() {
		add_action( 'admin_menu',            array( __CLASS__, 'register_menu' ) );
		// Wikipedia seeder
		add_action( 'wp_ajax_culture_dir_wiki_fetch',          array( __CLASS__, 'ajax_wiki_fetch' ) );
		add_action( 'wp_ajax_culture_dir_wiki_seed',           array( __CLASS__, 'ajax_wiki_seed' ) );
		add_action( 'wp_ajax_culture_dir_wiki_backfill',       array( __CLASS__, 'ajax_wiki_backfill' ) );
		add_action( 'wp_ajax_culture_dir_wiki_audit',          array( __CLASS__, 'ajax_wiki_audit' ) );
		add_action( 'wp_ajax_culture_dir_wiki_infobox_fill',   array( __CLASS__, 'ajax_wiki_infobox_fill' ) );
		add_action( 'wp_ajax_culture_dir_wiki_title_cleanup',  array( __CLASS__, 'ajax_wiki_title_cleanup' ) );
		// Per-entry refetch metabox
		add_action( 'wp_ajax_culture_dir_wiki_refetch_single', array( __CLASS__, 'ajax_wiki_refetch_single' ) );
		add_action( 'add_meta_boxes',        array( __CLASS__, 'register_wiki_metabox' ) );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_assets' ) );
	}

	public static function register_menu() {
		add_submenu_page(
			'culture-content-manager',
			__( 'Directory Tools', 'culture-community' ),
			__( 'Directory Tools', 'culture-community' ),
			'manage_options',
			'culture-directory-tools',
			array( __CLASS__, 'render_page' )
		);
	}

	public static function enqueue_assets( $hook ) {
		if ( 'culture-content-manager_page_culture-directory-tools' !== $hook ) {
			return;
		}
		wp_add_inline_style( 'wp-admin', self::inline_css() );
	}

	// ── Per-entry Wikipedia metabox ───────────────────────────────────────────

	public static function register_wiki_metabox() {
		add_meta_box(
			'culture_dir_wiki',
			'Wikipedia / Wikidata',
			array( __CLASS__, 'render_wiki_metabox' ),
			'culture_directory',
			'side',
			'default'
		);
	}

	public static function render_wiki_metabox( WP_Post $post ) {
		$wiki_title = get_post_meta( $post->ID, '_wiki_title', true );
		$wiki_url   = get_post_meta( $post->ID, '_wiki_url',   true );

		// Gather existing infobox values
		global $wpdb;
		$infobox_rows = $wpdb->get_results( $wpdb->prepare(
			"SELECT meta_key, meta_value FROM {$wpdb->postmeta}
			  WHERE post_id = %d AND meta_key LIKE 'dir_infobox_%'
			  ORDER BY meta_key",
			$post->ID
		), ARRAY_A );
		$infobox = array();
		foreach ( $infobox_rows as $row ) {
			$label = str_replace( 'dir_infobox_', '', $row['meta_key'] );
			$infobox[ $label ] = $row['meta_value'];
		}

		$nonce = wp_create_nonce( 'culture_dir_tools' );
		?>
		<div id="cdir-wiki-box" style="font-size:13px;">
			<?php if ( $wiki_title && $wiki_title !== '_not_found' ) : ?>
				<p style="margin:0 0 6px;">
					<strong>Matched:</strong>
					<?php if ( $wiki_url ) : ?>
						<a href="<?php echo esc_url( $wiki_url ); ?>" target="_blank" rel="noopener"><?php echo esc_html( $wiki_title ); ?></a>
					<?php else : ?>
						<?php echo esc_html( $wiki_title ); ?>
					<?php endif; ?>
				</p>
			<?php elseif ( $wiki_title === '_not_found' ) : ?>
				<p style="margin:0 0 6px;color:#a00;">Not found on Wikipedia.</p>
			<?php else : ?>
				<p style="margin:0 0 6px;color:#666;">Not yet searched.</p>
			<?php endif; ?>

			<?php if ( ! empty( $infobox ) ) : ?>
				<table style="width:100%;border-collapse:collapse;margin-bottom:8px;">
					<?php foreach ( $infobox as $label => $value ) : ?>
						<tr>
							<td style="padding:2px 6px 2px 0;color:#666;white-space:nowrap;text-transform:capitalize;"><?php echo esc_html( str_replace( '_', ' ', $label ) ); ?></td>
							<td style="padding:2px 0;word-break:break-word;"><?php echo esc_html( $value ); ?></td>
						</tr>
					<?php endforeach; ?>
				</table>
			<?php endif; ?>

			<button type="button" id="cdir-wiki-refetch-btn"
				data-post-id="<?php echo (int) $post->ID; ?>"
				data-nonce="<?php echo esc_attr( $nonce ); ?>"
				class="button button-secondary" style="width:100%;">
				Refetch from Wikipedia
			</button>
			<div id="cdir-wiki-refetch-msg" style="margin-top:6px;font-size:12px;"></div>
		</div>
		<script>
		(function(){
			var btn = document.getElementById('cdir-wiki-refetch-btn');
			var msg = document.getElementById('cdir-wiki-refetch-msg');
			if (!btn) return;
			btn.addEventListener('click', function(){
				btn.disabled = true;
				btn.textContent = 'Fetching…';
				msg.textContent = '';
				var fd = new FormData();
				fd.append('action',  'culture_dir_wiki_refetch_single');
				fd.append('nonce',   btn.dataset.nonce);
				fd.append('post_id', btn.dataset.postId);
				fetch(ajaxurl, { method:'POST', body: fd })
					.then(function(r){ return r.json(); })
					.then(function(d){
						btn.disabled = false;
						btn.textContent = 'Refetch from Wikipedia';
						if (d.success) {
							msg.style.color = '#096';
							var info = d.data;
							var parts = [];
							if (info.wiki_title) parts.push('Matched: ' + info.wiki_title);
							if (info.infobox_saved && info.infobox_saved.length) parts.push('Saved: ' + info.infobox_saved.join(', '));
							if (!parts.length) parts.push('No new data found.');
							msg.textContent = parts.join(' · ');
							if (info.infobox_saved && info.infobox_saved.length) {
								setTimeout(function(){ location.reload(); }, 1200);
							}
						} else {
							msg.style.color = '#a00';
							msg.textContent = (d.data && d.data.message) ? d.data.message : 'Fetch failed.';
						}
					})
					.catch(function(){ btn.disabled=false; btn.textContent='Refetch from Wikipedia'; msg.style.color='#a00'; msg.textContent='Network error.'; });
			});
		})();
		</script>
		<?php
	}

	/**
	 * AJAX: Refetch Wikipedia/Wikidata data for a single directory entry.
	 * Always overwrites infobox fields (force fresh data).
	 */
	public static function ajax_wiki_refetch_single() {
		check_ajax_referer( 'culture_dir_tools', 'nonce' );
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( array( 'message' => 'Forbidden.' ) );
		}

		$post_id = (int) ( $_POST['post_id'] ?? 0 );
		$post    = $post_id ? get_post( $post_id ) : null;

		if ( ! $post || 'culture_directory' !== $post->post_type ) {
			wp_send_json_error( array( 'message' => 'Post not found.' ) );
		}

		$terms      = wp_get_object_terms( $post_id, 'culture_dir_type', array( 'fields' => 'slugs' ) );
		$entry_type = ( ! is_wp_error( $terms ) && ! empty( $terms ) ) ? $terms[0] : '';

		// Clear previous wiki tracking so a fresh search can overwrite it
		delete_post_meta( $post_id, '_wiki_title' );
		delete_post_meta( $post_id, '_wiki_url' );

		$wiki_title = self::wiki_opensearch( $post->post_title, $entry_type );

		if ( ! $wiki_title ) {
			update_post_meta( $post_id, '_wiki_title', '_not_found' );
			wp_send_json_error( array( 'message' => 'No Wikipedia article found for "' . esc_html( $post->post_title ) . '".' ) );
		}

		$pages = self::wiki_fetch_pages_batch( array( $wiki_title ) );
		$page  = $pages[ $wiki_title ] ?? null;
		if ( ! $page ) {
			foreach ( $pages as $pt => $pd ) {
				if ( strcasecmp( $pt, $wiki_title ) === 0 ) { $page = $pd; break; }
			}
		}

		if ( ! $page ) {
			update_post_meta( $post_id, '_wiki_title', '_not_found' );
			wp_send_json_error( array( 'message' => 'Wikipedia article not found after fetch.' ) );
		}

		$real_title = $page['title'] ?? $wiki_title;

		// Apply all wiki data with overwrite=true so infobox always updates
		$changes = self::apply_wiki_data_to_post( $post_id, $post, $page, true, $entry_type );

		update_post_meta( $post_id, '_wiki_title', $real_title );
		update_post_meta( $post_id, '_wiki_url',
			'https://en.wikipedia.org/wiki/' . rawurlencode( str_replace( ' ', '_', $real_title ) )
		);

		// Collect which infobox keys were saved
		global $wpdb;
		$infobox_keys = $wpdb->get_col( $wpdb->prepare(
			"SELECT meta_key FROM {$wpdb->postmeta}
			  WHERE post_id = %d AND meta_key LIKE 'dir_infobox_%'",
			$post_id
		) );
		$infobox_labels = array_map( function( $k ) {
			return str_replace( array( 'dir_infobox_', '_' ), array( '', ' ' ), $k );
		}, $infobox_keys );

		wp_send_json_success( array(
			'wiki_title'    => $real_title,
			'changes'       => $changes,
			'infobox_saved' => $infobox_labels,
		) );
	}

	// ── AJAX: Wikipedia seeder ────────────────────────────────────────────────

	/**
	 * Fetch article titles from a Wikipedia category or a manual list.
	 * POST params: nonce, source ("category"|"manual"), category (string), titles (string)
	 */
	public static function ajax_wiki_fetch() {
		check_ajax_referer( 'culture_dir_tools', 'nonce' );
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( array( 'message' => 'Forbidden.' ) );
		}

		$source = sanitize_text_field( $_POST['source'] ?? 'category' );

		if ( $source === 'manual' ) {
			$raw   = sanitize_textarea_field( $_POST['titles'] ?? '' );
			$lines = array_values( array_filter( array_map( 'trim', explode( "\n", $raw ) ) ) );
			if ( empty( $lines ) ) {
				wp_send_json_error( array( 'message' => 'No titles provided.' ) );
			}
			$titles = array_slice( $lines, 0, 100 );
		} else {
			$category = sanitize_text_field( $_POST['category'] ?? '' );
			if ( empty( $category ) ) {
				wp_send_json_error( array( 'message' => 'No category provided.' ) );
			}
			if ( stripos( $category, 'Category:' ) !== 0 ) {
				$category = 'Category:' . $category;
			}

			$url = add_query_arg( array(
				'action'      => 'query',
				'list'        => 'categorymembers',
				'cmtitle'     => $category,
				'cmlimit'     => '100',
				'cmtype'      => 'page',
				'cmnamespace' => '0',
				'format'      => 'json',
			), 'https://en.wikipedia.org/w/api.php' );

			$response = wp_remote_get( $url, array( 'timeout' => 15 ) );
			if ( is_wp_error( $response ) ) {
				wp_send_json_error( array( 'message' => $response->get_error_message() ) );
			}

			$body    = json_decode( wp_remote_retrieve_body( $response ), true );
			$members = $body['query']['categorymembers'] ?? array();
			if ( empty( $members ) ) {
				wp_send_json_error( array( 'message' => "Category '$category' returned no articles. Check the spelling." ) );
			}

			$titles = array_column( $members, 'title' );
		}

		// Filter out titles already in the directory (published or pending)
		$existing   = self::get_all_directory_titles();
		$new_titles = array_values( array_filter( $titles, function( $t ) use ( $existing ) {
			return ! in_array( strtolower( trim( $t ) ), $existing, true );
		} ) );

		wp_send_json_success( array(
			'titles'  => $new_titles,
			'skipped' => count( $titles ) - count( $new_titles ),
			'total'   => count( $titles ),
		) );
	}

	/**
	 * Seed selected Wikipedia articles as pending culture_directory entries.
	 * POST params: nonce, titles[] (array of article titles), entry_type (string)
	 */
	public static function ajax_wiki_seed() {
		check_ajax_referer( 'culture_dir_tools', 'nonce' );
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( array( 'message' => 'Forbidden.' ) );
		}

		$titles     = array_map( 'sanitize_text_field', (array) ( $_POST['titles'] ?? array() ) );
		$entry_type = sanitize_text_field( $_POST['entry_type'] ?? 'concept' );

		if ( empty( $titles ) ) {
			wp_send_json_error( array( 'message' => 'No titles provided.' ) );
		}

		$titles  = array_slice( $titles, 0, 50 ); // hard cap per request
		$seeded  = 0;
		$skipped = 0;
		$results = array();

		// Fetch Wikipedia page data in batches of 20
		$batch_size = 20;
		for ( $i = 0; $i < count( $titles ); $i += $batch_size ) {
			$batch      = array_slice( $titles, $i, $batch_size );
			$pages_data = self::wiki_fetch_pages_batch( $batch );

			foreach ( $batch as $title ) {
				$page = $pages_data[ $title ] ?? null;
				if ( ! $page ) {
					foreach ( $pages_data as $pt => $pd ) {
						if ( strcasecmp( $pt, $title ) === 0 ) { $page = $pd; break; }
					}
				}

				$post_id = self::create_wiki_directory_entry( $title, $page ?? array(), $entry_type );
				if ( $post_id ) {
					$seeded++;
					$results[] = array( 'title' => $title, 'success' => true );
				} else {
					$skipped++;
					$results[] = array( 'title' => $title, 'success' => false );
				}
			}
		}

		wp_send_json_success( array(
			'seeded'  => $seeded,
			'skipped' => $skipped,
			'results' => $results,
		) );
	}

	/** Fetch page extracts + thumbnails + Wikidata QID for up to 20 titles in one API call. */
	private static function wiki_fetch_pages_batch( array $titles ): array {
		$url = add_query_arg( array(
			'action'      => 'query',
			'prop'        => 'extracts|pageimages|pageprops',
			'exintro'     => '1',
			'exsentences' => '10',
			'pithumbsize' => '640',
			'pilicense'   => 'any',
			'titles'      => implode( '|', $titles ),
			'redirects'   => '1',
			'format'      => 'json',
		), 'https://en.wikipedia.org/w/api.php' );

		$response = wp_remote_get( $url, array( 'timeout' => 20 ) );
		if ( is_wp_error( $response ) ) {
			return array();
		}

		$body  = json_decode( wp_remote_retrieve_body( $response ), true );
		$pages = $body['query']['pages'] ?? array();
		$out   = array();

		foreach ( $pages as $page ) {
			if ( isset( $page['missing'] ) ) {
				continue;
			}
			// Skip disambiguation pages — they contain no useful content
			if ( isset( $page['pageprops']['disambiguation'] ) ) {
				continue;
			}
			$out[ $page['title'] ] = $page;
		}

		return $out;
	}

	/** Create one pending culture_directory entry from Wikipedia page data. */
	private static function create_wiki_directory_entry( string $title, array $page, string $entry_type ): int {
		$extract = strip_tags( $page['extract'] ?? '' );
		$excerpt = '';
		$content = '';

		// Strip Wikipedia disambiguation suffix for the display title: "(2026 film)", "(novel)", etc.
		$display_title = trim( preg_replace( '/\s*\([^)]+\)\s*$/', '', $title ) );
		if ( empty( $display_title ) ) $display_title = $title;

		if ( $extract ) {
			$dot     = strpos( $extract, '. ' );
			$excerpt = $dot !== false
				? substr( $extract, 0, $dot + 1 )
				: substr( $extract, 0, 220 );

			// Content starts AFTER the first sentence so the app does not show the excerpt twice.
			$content_text = ( $dot !== false && $dot + 2 < strlen( $extract ) )
				? ltrim( substr( $extract, $dot + 2 ) )
				: $extract;

			$paras   = array_filter( array_map( 'trim', preg_split( '/\n{2,}/', $content_text ) ) );
			$content = implode( "\n\n", array_map( function ( $p ) {
				return '<p>' . wp_kses_post( $p ) . '</p>';
			}, $paras ) );
		}

		if ( empty( $excerpt ) ) $excerpt = $display_title;
		if ( empty( $content ) ) $content = '<p>' . esc_html( $display_title ) . '</p>';

		// Skip if a directory entry with this exact (Wikipedia or display) title already exists.
		$existing = get_page_by_title( $title, OBJECT, 'culture_directory' )
		         ?? get_page_by_title( $display_title, OBJECT, 'culture_directory' );
		if ( $existing ) {
			return 0;
		}

		$post_id = wp_insert_post( array(
			'post_type'    => 'culture_directory',
			'post_status'  => 'pending',
			'post_title'   => $display_title,
			'post_excerpt' => wp_strip_all_tags( $excerpt ),
			'post_content' => $content,
		), true );

		if ( is_wp_error( $post_id ) || ! $post_id ) {
			return 0;
		}

		// Assign entry type taxonomy term
		$term = get_term_by( 'slug', $entry_type, 'culture_dir_type' );
		if ( $term ) {
			wp_set_object_terms( $post_id, array( $term->term_id ), 'culture_dir_type' );
		}

		// Cover image meta from Wikipedia thumbnail
		$cover = $page['thumbnail']['source'] ?? '';
		if ( $cover ) {
			update_post_meta( $post_id, '_external_cover_url', esc_url_raw( $cover ) );
			update_post_meta( $post_id, '_culture_dir_image_url', esc_url_raw( $cover ) );
		}

		update_post_meta( $post_id, '_external_source', 'wikipedia' );
		update_post_meta( $post_id, '_external_id', $page['title'] ?? $title );
		update_post_meta( $post_id, '_ai_generated', '0' );
		update_post_meta( $post_id, '_wiki_title', $page['title'] ?? $title );

		// Fetch and save Wikidata structured fields (director, year, cast, genre, etc.)
		$qid = $page['pageprops']['wikibase_item'] ?? '';
		if ( $qid && $entry_type ) {
			$wd_fields = self::wiki_wikidata_fields( $qid, $entry_type );
			if ( ! empty( $wd_fields ) ) {
				self::save_infobox_to_acf( $post_id, $wd_fields, true );
			}
		}

		return $post_id;
	}

	// ── AJAX: Wikipedia backfill for existing published entries ──────────────

	/**
	 * Process one batch of published directory entries that have not yet been
	 * enriched from Wikipedia. Called repeatedly by JS until done:true.
	 *
	 * POST params: nonce, batch (int, 0-based page), overwrite (bool)
	 * Returns: { processed, updated, batch, total, done, results[] }
	 */
	public static function ajax_wiki_backfill() {
		check_ajax_referer( 'culture_dir_tools', 'nonce' );
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( array( 'message' => 'Forbidden.' ) );
		}

		@set_time_limit( 120 );

		global $wpdb;

		$batch_num    = max( 0, (int) ( $_POST['batch'] ?? 0 ) );
		$batch_size   = 5;
		$overwrite    = ! empty( $_POST['overwrite'] );
		$retry_failed = ! empty( $_POST['retry_failed'] );
		$offset       = $batch_num * $batch_size;

		if ( $retry_failed ) {
			// Retry mode: entries that were previously searched but not found.
			$total = (int) $wpdb->get_var(
				"SELECT COUNT(DISTINCT p.ID)
				 FROM {$wpdb->posts} p
				 INNER JOIN {$wpdb->postmeta} pm
				     ON pm.post_id = p.ID AND pm.meta_key = '_wiki_title'
				 WHERE p.post_type = 'culture_directory'
				   AND p.post_status = 'publish'
				   AND pm.meta_value = '_not_found'"
			);

			$ids = $wpdb->get_col( $wpdb->prepare(
				"SELECT DISTINCT p.ID
				 FROM {$wpdb->posts} p
				 INNER JOIN {$wpdb->postmeta} pm
				     ON pm.post_id = p.ID AND pm.meta_key = '_wiki_title'
				 WHERE p.post_type = 'culture_directory'
				   AND p.post_status = 'publish'
				   AND pm.meta_value = '_not_found'
				 ORDER BY p.ID ASC
				 LIMIT %d OFFSET %d",
				$batch_size,
				$offset
			) );

			// Clear the _not_found marker so a re-match can be saved.
			foreach ( $ids as $id ) {
				delete_post_meta( (int) $id, '_wiki_title' );
			}
		} else {
			// Normal mode: entries not yet processed (no _wiki_title meta row).
			$total = (int) $wpdb->get_var(
				"SELECT COUNT(DISTINCT p.ID)
				 FROM {$wpdb->posts} p
				 LEFT JOIN {$wpdb->postmeta} pm
				     ON pm.post_id = p.ID AND pm.meta_key = '_wiki_title'
				 WHERE p.post_type = 'culture_directory'
				   AND p.post_status = 'publish'
				   AND pm.meta_value IS NULL"
			);

			$ids = $wpdb->get_col( $wpdb->prepare(
				"SELECT DISTINCT p.ID
				 FROM {$wpdb->posts} p
				 LEFT JOIN {$wpdb->postmeta} pm
				     ON pm.post_id = p.ID AND pm.meta_key = '_wiki_title'
				 WHERE p.post_type = 'culture_directory'
				   AND p.post_status = 'publish'
				   AND pm.meta_value IS NULL
				 ORDER BY p.ID ASC
				 LIMIT %d OFFSET %d",
				$batch_size,
				$offset
			) );
		}

		if ( empty( $ids ) ) {
			wp_send_json_success( array(
				'processed' => 0,
				'updated'   => 0,
				'batch'     => $batch_num,
				'total'     => $total,
				'done'      => true,
				'results'   => array(),
			) );
		}

		$updated = 0;
		$results = array();

		foreach ( $ids as $post_id ) {
			$post = get_post( (int) $post_id );
			if ( ! $post ) continue;

			// Determine entry type for search hint
			$terms      = wp_get_object_terms( (int) $post_id, 'culture_dir_type', array( 'fields' => 'slugs' ) );
			$entry_type = ( ! is_wp_error( $terms ) && ! empty( $terms ) ) ? $terms[0] : '';

			// Search Wikipedia
			$wiki_title = self::wiki_opensearch( $post->post_title, $entry_type );

			if ( ! $wiki_title ) {
				update_post_meta( (int) $post_id, '_wiki_title', '_not_found' );
				$results[] = array( 'title' => $post->post_title, 'found' => false );
				continue;
			}

			// Fetch page data (extract + thumbnail + Wikidata QID)
			$pages = self::wiki_fetch_pages_batch( array( $wiki_title ) );
			$page  = $pages[ $wiki_title ] ?? null;

			if ( ! $page ) {
				foreach ( $pages as $pt => $pd ) {
					if ( strcasecmp( $pt, $wiki_title ) === 0 ) { $page = $pd; break; }
				}
			}

			if ( ! $page ) {
				update_post_meta( (int) $post_id, '_wiki_title', '_not_found' );
				$results[] = array( 'title' => $post->post_title, 'found' => false );
				continue;
			}

			$real_title = $page['title'] ?? $wiki_title;
			$changes    = self::apply_wiki_data_to_post( (int) $post_id, $post, $page, $overwrite, $entry_type );

			update_post_meta( (int) $post_id, '_wiki_title', $real_title );
			update_post_meta( (int) $post_id, '_wiki_url',
				'https://en.wikipedia.org/wiki/' . rawurlencode( str_replace( ' ', '_', $real_title ) )
			);

			if ( ! empty( $changes ) ) $updated++;

			$results[] = array(
				'title'   => $post->post_title,
				'found'   => true,
				'changes' => $changes,
			);
		}

		$done = count( $ids ) < $batch_size || ( $offset + count( $ids ) ) >= $total;

		wp_send_json_success( array(
			'processed' => count( $ids ),
			'updated'   => $updated,
			'batch'     => $batch_num,
			'total'     => $total,
			'done'      => $done,
			'results'   => $results,
		) );
	}

	/**
	 * Audit all enriched directory entries for bad Wikipedia matches and clear them.
	 *
	 * Scans every published entry that has a _wiki_title set (and not _not_found),
	 * runs wiki_title_matches() against it, and for every mismatch: deletes _wiki_title,
	 * _wiki_url, and all dir_infobox_* meta so a subsequent backfill re-fetches
	 * correct (or no) data.
	 *
	 * Returns: { checked, cleared, entries[] }
	 */
	public static function ajax_wiki_audit() {
		check_ajax_referer( 'culture_dir_tools', 'nonce' );
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( 'Insufficient permissions.' );
		}

		global $wpdb;

		// Fetch all published entries that have a real (non-"_not_found") _wiki_title.
		$rows = $wpdb->get_results(
			"SELECT p.ID, p.post_title, pm.meta_value AS wiki_title
			   FROM {$wpdb->posts} p
			   INNER JOIN {$wpdb->postmeta} pm
			       ON pm.post_id = p.ID AND pm.meta_key = '_wiki_title'
			  WHERE p.post_type   = 'culture_directory'
			    AND p.post_status = 'publish'
			    AND pm.meta_value != '_not_found'",
			ARRAY_A
		);

		$checked = 0;
		$cleared = 0;
		$entries = array();

		foreach ( $rows as $row ) {
			$post_id    = (int) $row['ID'];
			$post_title = $row['post_title'];
			$wiki_title = $row['wiki_title'];

			$checked++;

			if ( ! self::wiki_title_matches( $post_title, $wiki_title ) ) {
				// Remove the Wikipedia tracking meta.
				delete_post_meta( $post_id, '_wiki_title' );
				delete_post_meta( $post_id, '_wiki_url' );

				// Remove all infobox fields that the backfiller may have written.
				$infobox_keys = $wpdb->get_col( $wpdb->prepare(
					"SELECT DISTINCT meta_key FROM {$wpdb->postmeta}
					  WHERE post_id = %d AND meta_key LIKE 'dir_infobox_%'",
					$post_id
				) );
				foreach ( $infobox_keys as $key ) {
					delete_post_meta( $post_id, $key );
				}

				$cleared++;
				$entries[] = array(
					'id'        => $post_id,
					'title'     => $post_title,
					'wiki_was'  => $wiki_title,
				);
			}
		}

		wp_send_json_success( array(
			'checked' => $checked,
			'cleared' => $cleared,
			'entries' => $entries,
		) );
	}

	/**
	 * Strip diacritics from a UTF-8 string and return plain ASCII lowercase.
	 * "Candomblé" → "candomble", "Ògún" → "ogun". Uses iconv TRANSLIT which
	 * is available in virtually every PHP setup.
	 */
	private static function ascii_lower( string $text ): string {
		$ascii = iconv( 'UTF-8', 'ASCII//TRANSLIT//IGNORE', $text );
		return strtolower( $ascii !== false ? $ascii : $text );
	}

	/**
	 * Checks whether a Wikipedia article title is a plausible match for the
	 * original directory entry title. At least one significant word (4+ chars,
	 * not a stopword) from the original must appear as a whole word in the
	 * candidate, or vice versa.
	 *
	 * Handles:
	 *  - Diacritics: "Candomblé" matches "Candomblé" after ASCII normalisation.
	 *  - Simple plurals: "Festival" matches "Festivals" and vice versa.
	 *  - Prevents false positives: "Water Margin" ≠ "Women on the Margins".
	 */
	private static function wiki_title_matches( string $original, string $candidate ): bool {
		static $stopwords = array( 'the', 'and', 'for', 'with', 'from', 'that', 'this', 'into', 'also', 'more', 'over', 'some', 'have', 'been', 'were', 'their' );

		$sig_words = function( string $text ) use ( $stopwords ): array {
			$words = preg_split( '/[^a-z0-9]+/', self::ascii_lower( $text ), -1, PREG_SPLIT_NO_EMPTY );
			return array_values( array_filter( $words, function( $w ) use ( $stopwords ) {
				return strlen( $w ) >= 4 && ! in_array( $w, $stopwords, true );
			} ) );
		};

		$orig_words = $sig_words( $original );
		$cand_words = $sig_words( $candidate );

		// Very short or all-stopword titles (e.g. "1984", "It") — skip validation.
		if ( empty( $orig_words ) ) return true;

		$cand_ascii = self::ascii_lower( $candidate );
		$orig_ascii = self::ascii_lower( $original );

		// Check a word (and its de-pluralised/pluralised form) against a haystack string.
		// Plural tolerance is only applied when the stem is 7+ characters long, which
		// avoids false positives like "margins" (stem "margin", 6 chars) matching "margin"
		// in "Water Margin", while still allowing "festivals" (stem "festival", 8 chars)
		// to match "festival" and vice versa.
		$word_in = function( string $word, string $haystack ): bool {
			if ( preg_match( '/\b' . preg_quote( $word, '/' ) . '\b/', $haystack ) ) {
				return true;
			}
			// Plural query word → check stem in haystack (only for long stems).
			if ( substr( $word, -1 ) === 's' ) {
				$stem = substr( $word, 0, -1 );
				if ( strlen( $stem ) >= 7 && preg_match( '/\b' . preg_quote( $stem, '/' ) . '\b/', $haystack ) ) {
					return true;
				}
			}
			// Singular query word → check pluralised form in haystack (only for long words).
			if ( strlen( $word ) >= 7 && preg_match( '/\b' . preg_quote( $word, '/' ) . 's\b/', $haystack ) ) {
				return true;
			}
			return false;
		};

		// For multi-word titles, require ≥2 matches in either direction so a
		// single shared word can't cause cross-matching between unrelated titles
		// (e.g. "Women on the Margins" ≠ "In the Margins").
		$min_match = count( $orig_words ) >= 2 ? 2 : 1;

		$orig_in_cand = 0;
		foreach ( $orig_words as $word ) {
			if ( $word_in( $word, $cand_ascii ) ) {
				$orig_in_cand++;
				if ( $orig_in_cand >= $min_match ) return true;
			}
		}

		$cand_in_orig = 0;
		foreach ( $cand_words as $word ) {
			if ( $word_in( $word, $orig_ascii ) ) {
				$cand_in_orig++;
				if ( $cand_in_orig >= $min_match ) return true;
			}
		}

		return false;
	}

	/** Search Wikipedia for the best-matching article title. */
	private static function wiki_opensearch( string $title, string $entry_type ): ?string {
		static $hints = array( 'film' => 'film', 'book' => 'novel', 'album' => 'album' );
		$hint = $hints[ $entry_type ] ?? '';

		// Inner helper: run opensearch for a given query string and validate
		// that the returned title is actually related to the original.
		$search = function( string $q, string $validate_against ) use ( $hint ): ?string {
			$query = $hint ? "$q $hint" : $q;
			$url   = add_query_arg( array(
				'action'    => 'opensearch',
				'search'    => $query,
				'limit'     => '5',
				'redirects' => 'resolve',
				'format'    => 'json',
			), 'https://en.wikipedia.org/w/api.php' );

			$response = wp_remote_get( $url, array( 'timeout' => 10 ) );
			if ( is_wp_error( $response ) ) return null;

			$body   = json_decode( wp_remote_retrieve_body( $response ), true );
			$titles = $body[1] ?? array();

			// Return the first result that shares at least one significant word
			// with the original title (whole-word match, bidirectional).
			// Skip disambiguation pages by title suffix.
			foreach ( $titles as $candidate ) {
				if ( ! empty( $candidate )
					&& strpos( (string) $candidate, '(disambiguation)' ) === false
					&& self::wiki_title_matches( $validate_against, (string) $candidate ) ) {
					return (string) $candidate;
				}
			}
			return null;
		};

		// Pass 0: if the title already has a parenthetical qualifier (e.g. "The Thomas Crown Affair (1999 film)"),
		// try fetching that exact Wikipedia title directly. wiki_fetch_pages_batch skips disambiguation pages,
		// so if the exact article exists and is not a disambiguation page it's returned here.
		if ( preg_match( '/\s*\([^)]+\)\s*$/', $title ) ) {
			$pages = self::wiki_fetch_pages_batch( array( $title ) );
			if ( ! empty( $pages ) ) {
				$exact_page = reset( $pages );
				return (string) ( $exact_page['title'] ?? $title );
			}
		}

		// Pass 1: full title.
		$result = $search( $title, $title );
		if ( $result ) return $result;

		// Pass 2: strip trailing disambiguation suffix in parentheses —
		// e.g. "Game of Thrones (TV series)" → "Game of Thrones",
		//      "Squid Game (TV series)" → "Squid Game",
		//      "Black Panther (film)" → "Black Panther".
		$paren_base = preg_replace( '/\s*\([^)]+\)\s*$/', '', $title );
		if ( $paren_base && $paren_base !== $title ) {
			$result = $search( $paren_base, $paren_base );
			if ( $result ) return $result;
		}

		// Pass 3: strip subtitle after ': ' — e.g. "The Tortured Poets Department: The Anthology"
		// → "The Tortured Poets Department".
		$colon_pos = strpos( $title, ': ' );
		if ( $colon_pos !== false ) {
			$colon_base = substr( $title, 0, $colon_pos );
			$result     = $search( $colon_base, $colon_base );
			if ( $result ) return $result;
		}

		// Pass 4: strip edition/variant suffix after ' - ' —
		// e.g. "Sense and Sensibility - Illustrated Edition" → "Sense and Sensibility".
		$dash_pos = strpos( $title, ' - ' );
		if ( $dash_pos !== false ) {
			$dash_base = substr( $title, 0, $dash_pos );
			$result    = $search( $dash_base, $dash_base );
			if ( $result ) return $result;
		}

		// Pass 5: Wikipedia CirrusSearch full-text — handles cases where the article title
		// differs substantially from the stored entry title, e.g. "The Odyssey of Homer" → "Odyssey".
		$query    = $hint ? "$title $hint" : $title;
		$fts_url  = add_query_arg( array(
			'action'   => 'query',
			'list'     => 'search',
			'srsearch' => $query,
			'srlimit'  => '3',
			'srinfo'   => '',
			'srprop'   => 'titlesnippet',
			'format'   => 'json',
		), 'https://en.wikipedia.org/w/api.php' );

		$fts_response = wp_remote_get( $fts_url, array( 'timeout' => 10 ) );
		if ( ! is_wp_error( $fts_response ) ) {
			$fts_body    = json_decode( wp_remote_retrieve_body( $fts_response ), true );
			$fts_results = $fts_body['query']['search'] ?? array();
			foreach ( $fts_results as $fts_result ) {
				$fts_title = $fts_result['title'] ?? '';
				if ( $fts_title && self::wiki_title_matches( $title, $fts_title ) ) {
					return (string) $fts_title;
				}
			}
		}

		return null;
	}

	/**
	 * Wikidata property → ACF field name, per entry type.
	 * 'multi' entries collect multiple claim values (e.g. cast members).
	 */
	private static function wikidata_prop_map(): array {
		return array(
			'film' => array(
				'P57'   => array( 'acf' => 'dir_infobox_director',           'multi' => false ),
				'P577'  => array( 'acf' => 'dir_infobox_year',               'multi' => false, 'type' => 'time' ),
				'P2047' => array( 'acf' => 'dir_infobox_runtime',            'multi' => false, 'type' => 'quantity', 'suffix' => ' min' ),
				'P495'  => array( 'acf' => 'dir_infobox_country',            'multi' => false ),
				'P364'  => array( 'acf' => 'dir_infobox_language',           'multi' => false ),
				'P750'  => array( 'acf' => 'dir_infobox_distributor',        'multi' => false ),
				'P272'  => array( 'acf' => 'dir_infobox_production_company', 'multi' => false ),
				'P344'  => array( 'acf' => 'dir_infobox_cinematographer',    'multi' => false ),
				'P161'  => array( 'acf' => 'dir_infobox_starring',           'multi' => true, 'max' => 8 ),
				'P136'  => array( 'acf' => 'dir_infobox_genre',              'multi' => false ),
			),
			'book' => array(
				'P50'   => array( 'acf' => 'dir_infobox_author',             'multi' => false ),
				'P577'  => array( 'acf' => 'dir_infobox_year_published',     'multi' => false, 'type' => 'time' ),
				'P1104' => array( 'acf' => 'dir_infobox_pages',              'multi' => false, 'type' => 'quantity' ),
				'P136'  => array( 'acf' => 'dir_infobox_genre',              'multi' => false ),
				'P123'  => array( 'acf' => 'dir_infobox_publisher',          'multi' => false ),
				'P407'  => array( 'acf' => 'dir_infobox_language',           'multi' => false ),
				'P495'  => array( 'acf' => 'dir_infobox_country',            'multi' => false ),
			),
			'album' => array(
				'P175'  => array( 'acf' => 'dir_infobox_artist',             'multi' => false ),
				'P264'  => array( 'acf' => 'dir_infobox_record_label',       'multi' => false ),
				'P577'  => array( 'acf' => 'dir_infobox_year',               'multi' => false, 'type' => 'time' ),
				'P136'  => array( 'acf' => 'dir_infobox_genre',              'multi' => false ),
				'P2554' => array( 'acf' => 'dir_infobox_producer',           'multi' => false ),
				'P495'  => array( 'acf' => 'dir_infobox_country_of_origin',  'multi' => false ),
			),
			'person' => array(
				'P569'  => array( 'acf' => 'dir_infobox_born',               'multi' => false, 'type' => 'time' ),
				'P570'  => array( 'acf' => 'dir_infobox_died',               'multi' => false, 'type' => 'time' ),
				'P27'   => array( 'acf' => 'dir_infobox_nationality',        'multi' => false ),
				'P106'  => array( 'acf' => 'dir_infobox_occupation',         'multi' => false ),
				'P19'   => array( 'acf' => 'dir_infobox_origin_city',        'multi' => false ),
			),
			'place' => array(
				'P17'   => array( 'acf' => 'dir_infobox_country',            'multi' => false ),
				'P131'  => array( 'acf' => 'dir_infobox_region',             'multi' => false ),
				'P571'  => array( 'acf' => 'dir_infobox_founded',            'multi' => false, 'type' => 'time' ),
			),
		);
	}

	/**
	 * Fetch structured Wikidata fields for a QID and return them as an
	 * associative array keyed by ACF field name (e.g. 'dir_infobox_director').
	 * Entity-reference QIDs are batch-resolved to English labels.
	 */
	private static function wiki_wikidata_fields( string $qid, string $entry_type ): array {
		$prop_map = self::wikidata_prop_map()[ $entry_type ] ?? array();
		if ( empty( $prop_map ) ) return array();

		$url = add_query_arg( array(
			'action' => 'wbgetentities',
			'ids'    => $qid,
			'props'  => 'claims',
			'format' => 'json',
		), 'https://www.wikidata.org/w/api.php' );

		$response = wp_remote_get( $url, array( 'timeout' => 15 ) );
		if ( is_wp_error( $response ) ) return array();

		$body   = json_decode( wp_remote_retrieve_body( $response ), true );
		$claims = $body['entities'][ $qid ]['claims'] ?? array();
		if ( empty( $claims ) ) return array();

		$fields      = array();
		$entity_qids = array();
		$qid_to_acf  = array();

		foreach ( $prop_map as $prop_id => $spec ) {
			$acf_key   = $spec['acf'];
			$claim_arr = $claims[ $prop_id ] ?? array();
			if ( empty( $claim_arr ) ) continue;

			$is_multi = ! empty( $spec['multi'] );
			$max      = $is_multi ? ( $spec['max'] ?? 5 ) : PHP_INT_MAX;
			$values   = array();

			// Sort so preferred-rank claims come first; iterate all claims and
			// skip deprecated/novalue/somevalue sentinels rather than slicing up
			// front — a sentinel as the first entry would otherwise silently drop
			// the whole field (e.g. a director with a novalue placeholder claim).
			$sorted_claims = $claim_arr;
			usort( $sorted_claims, function( $a, $b ) {
				$rank = array( 'preferred' => 0, 'normal' => 1, 'deprecated' => 2 );
				return ( $rank[ $a['rank'] ?? 'normal' ] ?? 1 ) - ( $rank[ $b['rank'] ?? 'normal' ] ?? 1 );
			} );

			foreach ( $sorted_claims as $claim ) {
				if ( count( $values ) >= $max ) break;
				if ( ( $claim['rank'] ?? '' ) === 'deprecated' ) continue;
				$snak = $claim['mainsnak'] ?? array();
				if ( ( $snak['snaktype'] ?? '' ) !== 'value' ) continue;
				$val = $snak['datavalue']['value'] ?? null;
				if ( $val === null ) continue;

				if ( is_string( $val ) ) {
					$values[] = $val;
				} elseif ( is_array( $val ) ) {
					if ( isset( $val['text'] ) ) {
						$values[] = (string) $val['text'];
					} elseif ( isset( $val['amount'] ) && ( $spec['type'] ?? '' ) === 'quantity' ) {
						$num = (string) abs( (float) $val['amount'] );
						$values[] = $num . ( $spec['suffix'] ?? '' );
					} elseif ( isset( $val['time'] ) && ( $spec['type'] ?? '' ) === 'time' ) {
						$year = ltrim( substr( $val['time'], 1, 4 ), '0' );
						if ( $year && $year !== '0' ) $values[] = $year;
					} elseif ( isset( $val['id'] ) ) {
						$entity_qids[] = (string) $val['id'];
						$qid_to_acf[ (string) $val['id'] ] = $acf_key;
					}
				}
			}

			if ( ! empty( $values ) ) {
				$fields[ $acf_key ] = $is_multi
					? implode( "\n", $values )
					: $values[0];
			}
		}

		// Batch-resolve entity-reference labels (director name, genre, etc.)
		if ( ! empty( $entity_qids ) ) {
			$label_url = add_query_arg( array(
				'action'    => 'wbgetentities',
				'ids'       => implode( '|', array_unique( array_slice( $entity_qids, 0, 50 ) ) ),
				'props'     => 'labels',
				'languages' => 'en',
				'format'    => 'json',
			), 'https://www.wikidata.org/w/api.php' );

			$label_resp = wp_remote_get( $label_url, array( 'timeout' => 15 ) );
			if ( ! is_wp_error( $label_resp ) ) {
				$label_body   = json_decode( wp_remote_retrieve_body( $label_resp ), true );
				$entities     = $label_body['entities'] ?? array();
				$multi_values = array();

				foreach ( $entity_qids as $eq ) {
					$label = $entities[ $eq ]['labels']['en']['value'] ?? null;
					if ( ! $label ) continue;
					$acf = $qid_to_acf[ $eq ] ?? null;
					if ( ! $acf ) continue;
					$multi_values[ $acf ][] = $label;
				}

				foreach ( $multi_values as $acf => $labels ) {
					$spec     = array_values( array_filter( self::wikidata_prop_map()[ $entry_type ], function ( $s ) use ( $acf ) {
						return $s['acf'] === $acf;
					} ) )[0] ?? array();
					$is_multi = ! empty( $spec['multi'] );
					if ( ! isset( $fields[ $acf ] ) ) {
						$fields[ $acf ] = $is_multi
							? implode( "\n", $labels )
							: $labels[0];
					}
				}
			}
		}

		return $fields;
	}

	/**
	 * Save a Wikidata infobox fields array to ACF post meta.
	 * Skips any field that already has a value unless $overwrite is true.
	 * Also syncs the genre field to the culture_dir_genre taxonomy.
	 * Returns the list of ACF field names that were written.
	 */
	private static function save_infobox_to_acf( int $post_id, array $fields, bool $overwrite = false ): array {
		$saved = array();
		foreach ( $fields as $acf_key => $value ) {
			if ( ! $value ) continue;
			$existing = get_post_meta( $post_id, $acf_key, true );
			if ( $existing && ! $overwrite ) continue;
			update_post_meta( $post_id, $acf_key, sanitize_textarea_field( $value ) );
			$saved[] = $acf_key;

			// Auto-sync genre to taxonomy for filterable queries
			if ( $acf_key === 'dir_infobox_genre' ) {
				$genre_terms = array_values( array_filter(
					array_map( 'trim', preg_split( '/[\n,]+/', $value ) )
				) );
				if ( ! empty( $genre_terms ) ) {
					// overwrite=true → replace existing; overwrite=false → append
					wp_set_object_terms( $post_id, $genre_terms, 'culture_dir_genre', ! $overwrite );
				}
			}
		}
		return $saved;
	}

	/**
	 * Apply Wikipedia page data to an existing directory entry.
	 * Also fetches Wikidata structured fields and saves them to ACF post meta.
	 * Returns an array of field names that were changed.
	 */
	private static function apply_wiki_data_to_post( int $post_id, WP_Post $post, array $page, bool $overwrite, string $entry_type = '' ): array {
		$changes = array();
		$extract = strip_tags( $page['extract'] ?? '' );
		$cover   = $page['thumbnail']['source'] ?? '';

		// Update content when empty / very thin, or when overwrite is set
		if ( $extract ) {
			$content_len = strlen( strip_tags( $post->post_content ) );
			if ( $overwrite || $content_len < 120 ) {
				$paras   = array_filter( array_map( 'trim', preg_split( '/\n{2,}/', $extract ) ) );
				$content = implode( "\n\n", array_map( function ( $p ) {
					return '<p>' . wp_kses_post( $p ) . '</p>';
				}, $paras ) );
				wp_update_post( array( 'ID' => $post_id, 'post_content' => $content ) );
				$changes[] = 'content';
			}
		}

		// Update excerpt when empty
		if ( $extract && empty( trim( $post->post_excerpt ) ) ) {
			$dot     = strpos( $extract, '. ' );
			$excerpt = $dot !== false ? substr( $extract, 0, $dot + 1 ) : substr( $extract, 0, 220 );
			wp_update_post( array( 'ID' => $post_id, 'post_excerpt' => wp_strip_all_tags( $excerpt ) ) );
			$changes[] = 'excerpt';
		}

		// Update cover meta:
		//   • always when no cover exists
		//   • always when the entry was AI-generated (_ai_generated=1)
		//   • when overwrite is explicitly requested
		// A manually set WP featured image is never touched (admin intent).
		if ( $cover ) {
			$has_thumb = (bool) get_the_post_thumbnail_url( $post_id, 'thumbnail' );
			$has_meta  = get_post_meta( $post_id, '_external_cover_url', true )
			          ?: get_post_meta( $post_id, '_culture_dir_image_url', true );
			$is_ai     = get_post_meta( $post_id, '_ai_generated', true ) === '1';

			if ( ! $has_thumb && ( ! $has_meta || $is_ai || $overwrite ) ) {
				update_post_meta( $post_id, '_external_cover_url', esc_url_raw( $cover ) );
				update_post_meta( $post_id, '_culture_dir_image_url', esc_url_raw( $cover ) );
				$changes[] = 'cover';
			}
		}

		// Fetch and save Wikidata structured fields (director, year, cast, genre, etc.)
		$qid = $page['pageprops']['wikibase_item'] ?? '';
		if ( $qid && $entry_type ) {
			$wd_fields = self::wiki_wikidata_fields( $qid, $entry_type );
			if ( ! empty( $wd_fields ) ) {
				$saved = self::save_infobox_to_acf( $post_id, $wd_fields, $overwrite );
				if ( ! empty( $saved ) ) {
					$changes[] = 'infobox';
				}
			}
		}

		return $changes;
	}

	/** All directory titles regardless of post status (lowercase, for de-dup). */
	private static function get_all_directory_titles(): array {
		$posts = get_posts( array(
			'post_type'              => 'culture_directory',
			'post_status'            => array( 'publish', 'pending', 'draft' ),
			'posts_per_page'         => -1,
			'fields'                 => 'all',
			'no_found_rows'          => true,
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
		) );
		return array_map( function ( $p ) {
			return strtolower( trim( $p->post_title ) );
		}, $posts );
	}

	// ── AJAX: Infobox backfill for seeded entries missing Wikidata fields ────

	/**
	 * Finds entries with _wiki_title set (any post status, non-"_not_found") but
	 * no dir_infobox_* meta. For each, re-fetches the Wikipedia page to get the
	 * Wikidata QID, then fetches and saves structured infobox fields.
	 *
	 * POST params: nonce, batch (int), overwrite (bool)
	 * Returns: { processed, updated, batch, total, done, results[] }
	 */
	public static function ajax_wiki_infobox_fill() {
		check_ajax_referer( 'culture_dir_tools', 'nonce' );
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( array( 'message' => 'Forbidden.' ) );
		}

		@set_time_limit( 120 );
		global $wpdb;

		$batch_num  = max( 0, (int) ( $_POST['batch'] ?? 0 ) );
		$batch_size = 5;
		$overwrite  = ! empty( $_POST['overwrite'] );
		$offset     = $batch_num * $batch_size;

		// Entries that have a matched Wikipedia title but no dir_infobox_* meta at all.
		$total = (int) $wpdb->get_var(
			"SELECT COUNT(DISTINCT p.ID)
			 FROM {$wpdb->posts} p
			 INNER JOIN {$wpdb->postmeta} pm
			     ON pm.post_id = p.ID AND pm.meta_key = '_wiki_title'
			 LEFT JOIN {$wpdb->postmeta} pm2
			     ON pm2.post_id = p.ID AND pm2.meta_key LIKE 'dir_infobox_%'
			 WHERE p.post_type = 'culture_directory'
			   AND pm.meta_value != '_not_found'
			   AND pm2.meta_key IS NULL"
		);

		$ids = $wpdb->get_col( $wpdb->prepare(
			"SELECT DISTINCT p.ID
			 FROM {$wpdb->posts} p
			 INNER JOIN {$wpdb->postmeta} pm
			     ON pm.post_id = p.ID AND pm.meta_key = '_wiki_title'
			 LEFT JOIN {$wpdb->postmeta} pm2
			     ON pm2.post_id = p.ID AND pm2.meta_key LIKE 'dir_infobox_%'
			 WHERE p.post_type = 'culture_directory'
			   AND pm.meta_value != '_not_found'
			   AND pm2.meta_key IS NULL
			 ORDER BY p.ID ASC
			 LIMIT %d OFFSET %d",
			$batch_size,
			$offset
		) );

		if ( empty( $ids ) ) {
			wp_send_json_success( array(
				'processed' => 0,
				'updated'   => 0,
				'batch'     => $batch_num,
				'total'     => $total,
				'done'      => true,
				'results'   => array(),
			) );
		}

		$updated = 0;
		$results = array();

		foreach ( $ids as $post_id ) {
			$post = get_post( (int) $post_id );
			if ( ! $post ) continue;

			$wiki_title = get_post_meta( (int) $post_id, '_wiki_title', true );
			if ( ! $wiki_title || $wiki_title === '_not_found' ) continue;

			$terms      = wp_get_object_terms( (int) $post_id, 'culture_dir_type', array( 'fields' => 'slugs' ) );
			$entry_type = ( ! is_wp_error( $terms ) && ! empty( $terms ) ) ? $terms[0] : '';

			// Re-fetch the Wikipedia page to get the Wikidata QID.
			$pages = self::wiki_fetch_pages_batch( array( $wiki_title ) );
			$page  = $pages[ $wiki_title ] ?? null;
			if ( ! $page ) {
				foreach ( $pages as $pt => $pd ) {
					if ( strcasecmp( $pt, $wiki_title ) === 0 ) { $page = $pd; break; }
				}
			}

			if ( ! $page ) {
				$results[] = array( 'title' => $post->post_title, 'found' => false, 'msg' => 'Page not found on Wikipedia' );
				continue;
			}

			$qid = $page['pageprops']['wikibase_item'] ?? '';
			if ( ! $qid || ! $entry_type ) {
				$results[] = array( 'title' => $post->post_title, 'found' => true, 'msg' => empty( $qid ) ? 'No Wikidata QID' : 'No entry type set' );
				continue;
			}

			$wd_fields = self::wiki_wikidata_fields( $qid, $entry_type );
			if ( ! empty( $wd_fields ) ) {
				$saved = self::save_infobox_to_acf( (int) $post_id, $wd_fields, $overwrite );
				if ( ! empty( $saved ) ) {
					$updated++;
					$results[] = array( 'title' => $post->post_title, 'found' => true, 'msg' => 'Saved: ' . implode( ', ', $saved ) );
					continue;
				}
			}

			$results[] = array( 'title' => $post->post_title, 'found' => true, 'msg' => 'No Wikidata fields returned for QID ' . $qid );
		}

		$done = count( $ids ) < $batch_size;

		wp_send_json_success( array(
			'processed' => count( $ids ),
			'updated'   => $updated,
			'batch'     => $batch_num,
			'total'     => $total,
			'done'      => $done,
			'results'   => $results,
		) );
	}

	// ── AJAX: Title cleanup for seeded entries with disambiguation suffixes ───

	/**
	 * Strips Wikipedia disambiguation suffixes like "(2026 film)" from the
	 * post_title of all entries with _external_source = 'wikipedia'.
	 * Leaves _wiki_title (the original Wikipedia title) untouched.
	 *
	 * Returns: { checked, updated, entries[] }
	 */
	public static function ajax_wiki_title_cleanup() {
		check_ajax_referer( 'culture_dir_tools', 'nonce' );
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( array( 'message' => 'Forbidden.' ) );
		}

		global $wpdb;

		$rows = $wpdb->get_results(
			"SELECT p.ID, p.post_title
			 FROM {$wpdb->posts} p
			 INNER JOIN {$wpdb->postmeta} pm
			     ON pm.post_id = p.ID AND pm.meta_key = '_external_source'
			 WHERE p.post_type = 'culture_directory'
			   AND pm.meta_value = 'wikipedia'",
			ARRAY_A
		);

		$checked = 0;
		$updated = 0;
		$entries = array();

		foreach ( $rows as $row ) {
			$checked++;
			$old_title = $row['post_title'];
			$new_title = trim( preg_replace( '/\s*\([^)]+\)\s*$/', '', $old_title ) );

			if ( empty( $new_title ) || $new_title === $old_title ) continue;

			wp_update_post( array(
				'ID'         => (int) $row['ID'],
				'post_title' => $new_title,
			) );

			$updated++;
			$entries[] = array( 'old' => $old_title, 'new' => $new_title );
		}

		wp_send_json_success( array(
			'checked' => $checked,
			'updated' => $updated,
			'entries' => $entries,
		) );
	}

	// ── Page renderer ─────────────────────────────────────────────────────────

	public static function render_page() {
		global $wpdb;

		$backfill_pending = (int) $wpdb->get_var(
			"SELECT COUNT(DISTINCT p.ID)
			 FROM {$wpdb->posts} p
			 LEFT JOIN {$wpdb->postmeta} pm
			     ON pm.post_id = p.ID AND pm.meta_key = '_wiki_title'
			 WHERE p.post_type = 'culture_directory'
			   AND p.post_status = 'publish'
			   AND pm.meta_value IS NULL"
		);
		$backfill_done = (int) $wpdb->get_var(
			"SELECT COUNT(DISTINCT p.ID)
			 FROM {$wpdb->posts} p
			 INNER JOIN {$wpdb->postmeta} pm
			     ON pm.post_id = p.ID AND pm.meta_key = '_wiki_title'
			 WHERE p.post_type = 'culture_directory'
			   AND p.post_status = 'publish'"
		);
		$backfill_total_pub = $backfill_pending + $backfill_done;

		$nonce = wp_create_nonce( 'culture_dir_tools' );
		?>
		<div class="wrap cdt-wrap">
			<h1><?php esc_html_e( 'Directory Tools', 'culture-community' ); ?></h1>

			<?php /* ── WIKIPEDIA BACKFILL PANEL ── */ ?>
			<div class="cdt-panel">
				<h2><?php esc_html_e( 'Wikipedia Backfill', 'culture-community' ); ?></h2>
				<p class="description">
					<?php esc_html_e( 'Enrich all published directory entries that have not yet been matched to a Wikipedia article. For each entry the tool finds the best Wikipedia match, fills in the full description if the existing content is thin (< 120 characters), sets the cover image if none exists, and populates all infobox fields (director, year, cast, genre, etc.) from Wikidata. Genre is also saved to the directory genre taxonomy for filtering. Entries already processed are skipped automatically.', 'culture-community' ); ?>
				</p>

				<div class="cdt-progress-block">
					<div class="cdt-progress-label">
						<strong id="cdwb-done-count"><?php echo esc_html( $backfill_done ); ?></strong>
						<?php esc_html_e( ' of ', 'culture-community' ); ?>
						<strong><?php echo esc_html( $backfill_total_pub ); ?></strong>
						<?php esc_html_e( ' published entries enriched', 'culture-community' ); ?>
						<span class="cdt-pct" id="cdwb-pct"><?php echo $backfill_total_pub > 0 ? round( $backfill_done / $backfill_total_pub * 100 ) : 0; ?>%</span>
					</div>
					<div class="cdt-progress-bar">
						<div class="cdt-progress-fill" id="cdwb-fill" style="width:<?php echo $backfill_total_pub > 0 ? round( $backfill_done / $backfill_total_pub * 100 ) : 0; ?>%"></div>
					</div>
					<p class="description" style="margin-top:6px;" id="cdwb-remaining">
						<?php if ( $backfill_pending > 0 ) : ?>
							<?php echo esc_html( $backfill_pending ); ?><?php esc_html_e( ' entries still need enrichment', 'culture-community' ); ?>
						<?php else : ?>
							<span style="color:#00a32a;">&#10003; <?php esc_html_e( 'All published entries have been processed.', 'culture-community' ); ?></span>
						<?php endif; ?>
					</p>
				</div>

				<?php
				$backfill_not_found = (int) $wpdb->get_var(
					"SELECT COUNT(DISTINCT p.ID)
					 FROM {$wpdb->posts} p
					 INNER JOIN {$wpdb->postmeta} pm
					     ON pm.post_id = p.ID AND pm.meta_key = '_wiki_title'
					 WHERE p.post_type = 'culture_directory'
					   AND p.post_status = 'publish'
					   AND pm.meta_value = '_not_found'"
				);
				?>

				<label style="display:block;margin-bottom:12px;">
					<input type="checkbox" id="cdwb-overwrite">
					<?php esc_html_e( 'Overwrite existing content and cover on all entries (AI-generated covers are always replaced even without this)', 'culture-community' ); ?>
				</label>

				<button id="cdwb-start-btn" class="button button-primary" <?php echo $backfill_pending < 1 ? 'disabled' : ''; ?>>
					<?php esc_html_e( 'Start backfill →', 'culture-community' ); ?>
				</button>
				<button id="cdwb-retry-btn" class="button button-secondary" style="margin-left:8px;" <?php echo $backfill_not_found < 1 ? 'disabled' : ''; ?>>
					<?php printf( esc_html__( 'Retry %d not-found →', 'culture-community' ), $backfill_not_found ); ?>
				</button>
				<button id="cdwb-stop-btn" class="button" style="display:none;margin-left:8px;">
					<?php esc_html_e( 'Stop', 'culture-community' ); ?>
				</button>
				<span class="spinner" id="cdwb-spinner" style="float:none;vertical-align:middle;margin-left:4px;"></span>
				<div id="cdwb-log" style="display:none;margin-top:12px;max-height:240px;overflow-y:auto;border:1px solid #c3c4c7;border-radius:3px;padding:8px 12px;background:#fafafa;font-size:12px;font-family:monospace;"></div>
			</div>

			<div class="cdt-panel" style="margin-top:16px;">
				<h3 style="margin-top:0;"><?php esc_html_e( 'Audit: clear bad Wikipedia matches', 'culture-community' ); ?></h3>
				<p class="description">
					<?php esc_html_e( 'Scans all enriched entries and removes data for any entry whose stored Wikipedia article title does not share a significant word with the entry\'s own title (e.g. "Water Margin" stored for "Women on the Margins"). Cleared entries will be re-processed on the next backfill run.', 'culture-community' ); ?>
				</p>
				<button id="cdwb-audit-btn" class="button button-secondary">
					<?php esc_html_e( 'Audit & clear bad matches →', 'culture-community' ); ?>
				</button>
				<span class="spinner" id="cdwb-audit-spinner" style="float:none;vertical-align:middle;margin-left:4px;display:none;"></span>
				<div id="cdwb-audit-log" style="display:none;margin-top:12px;max-height:240px;overflow-y:auto;border:1px solid #c3c4c7;border-radius:3px;padding:8px 12px;background:#fafafa;font-size:12px;font-family:monospace;"></div>
			</div>

			<?php /* ── INFOBOX BACKFILL PANEL ── */ ?>
			<div class="cdt-panel">
				<h2><?php esc_html_e( 'Infobox Backfill (Seeded Entries)', 'culture-community' ); ?></h2>
				<p class="description">
					<?php esc_html_e( 'Populates missing Wikidata structured fields (director, year, cast, genre, etc.) for entries that were seeded from Wikipedia but are lacking infobox data. Only entries that already have a matched Wikipedia title but no dir_infobox_* meta are processed — others are skipped automatically.', 'culture-community' ); ?>
				</p>

				<p>
					<label>
						<input type="checkbox" id="cdif-overwrite">
						<?php esc_html_e( 'Overwrite existing infobox fields (if any)', 'culture-community' ); ?>
					</label>
				</p>

				<button id="cdif-start-btn" class="button button-secondary"><?php esc_html_e( 'Start infobox backfill →', 'culture-community' ); ?></button>
				<button id="cdif-stop-btn" class="button" style="display:none;"><?php esc_html_e( 'Stop', 'culture-community' ); ?></button>
				<span class="spinner" id="cdif-spinner" style="float:none;vertical-align:middle;margin-left:4px;display:none;"></span>
				<div id="cdif-log" style="display:none;margin-top:12px;max-height:240px;overflow-y:auto;border:1px solid #c3c4c7;border-radius:3px;padding:8px 12px;background:#fafafa;font-size:12px;font-family:monospace;"></div>
			</div>

			<?php /* ── TITLE CLEANUP PANEL ── */ ?>
			<div class="cdt-panel">
				<h3 style="margin-top:0;"><?php esc_html_e( 'Clean up seeded entry titles', 'culture-community' ); ?></h3>
				<p class="description">
					<?php esc_html_e( 'Strips Wikipedia disambiguation suffixes like "(2026 film)" or "(novel)" from the display title of all Wikipedia-seeded entries. The original Wikipedia title stored in _wiki_title is left untouched.', 'culture-community' ); ?>
				</p>
				<button id="cdt-title-cleanup-btn" class="button button-secondary">
					<?php esc_html_e( 'Clean up titles →', 'culture-community' ); ?>
				</button>
				<span class="spinner" id="cdt-title-cleanup-spinner" style="float:none;vertical-align:middle;margin-left:4px;display:none;"></span>
				<div id="cdt-title-cleanup-log" style="display:none;margin-top:12px;max-height:240px;overflow-y:auto;border:1px solid #c3c4c7;border-radius:3px;padding:8px 12px;background:#fafafa;font-size:12px;font-family:monospace;"></div>
			</div>

			<?php /* ── WIKIPEDIA SEEDER PANEL ── */ ?>
			<div class="cdt-panel">
				<h2><?php esc_html_e( 'Wikipedia Seeder', 'culture-community' ); ?></h2>
				<p class="description">
					<?php esc_html_e( 'Seed directory entries from Wikipedia categories or a manual title list. Each entry is created as a draft (pending review) with the Wikipedia intro as its content, the Wikipedia thumbnail as its cover, and all infobox fields (director, year, genre, etc.) populated from Wikidata. Genre is automatically saved to the directory genre taxonomy.', 'culture-community' ); ?>
				</p>

				<table class="form-table cdt-form-table">
					<tr>
						<th><label for="cdw-entry-type"><?php esc_html_e( 'Entry type', 'culture-community' ); ?></label></th>
						<td>
							<select id="cdw-entry-type">
								<?php
								$dir_types = get_terms( array( 'taxonomy' => 'culture_dir_type', 'hide_empty' => false ) );
								if ( is_array( $dir_types ) ) {
									foreach ( $dir_types as $t ) {
										echo '<option value="' . esc_attr( $t->slug ) . '">' . esc_html( $t->name ) . '</option>';
									}
								}
								?>
							</select>
						</td>
					</tr>
					<tr>
						<th><label><?php esc_html_e( 'Source', 'culture-community' ); ?></label></th>
						<td>
							<label><input type="radio" name="cdw-source" value="category" checked> Wikipedia Category</label>
							&nbsp;&nbsp;
							<label><input type="radio" name="cdw-source" value="manual"> Manual title list</label>
						</td>
					</tr>
					<tr id="cdw-row-category">
						<th><label for="cdw-category"><?php esc_html_e( 'Category slug', 'culture-community' ); ?></label></th>
						<td>
							<input type="text" id="cdw-category" class="regular-text" placeholder="e.g. Nigerian_films  or  Category:Afrobeats_musicians">
							<p class="description"><?php esc_html_e( 'The "Category:…" prefix is optional — it will be added automatically.', 'culture-community' ); ?></p>
						</td>
					</tr>
					<tr id="cdw-row-manual" style="display:none;">
						<th><label for="cdw-manual-titles"><?php esc_html_e( 'Titles', 'culture-community' ); ?></label></th>
						<td>
							<textarea id="cdw-manual-titles" class="large-text" rows="6" placeholder="One Wikipedia article title per line"></textarea>
						</td>
					</tr>
				</table>

				<button id="cdw-fetch-btn" class="button button-secondary"><?php esc_html_e( 'Fetch article list →', 'culture-community' ); ?></button>
				<span class="spinner" id="cdw-fetch-spinner" style="float:none;vertical-align:middle;margin-left:4px;"></span>
				<div id="cdw-fetch-result" class="cdt-result" style="display:none;"></div>

				<div id="cdw-seed-panel" style="display:none;margin-top:20px;">
					<div id="cdw-checklist" style="max-height:280px;overflow-y:auto;border:1px solid #c3c4c7;border-radius:3px;padding:8px 12px;margin-bottom:12px;background:#fafafa;font-size:13px;"></div>
					<div style="margin-bottom:10px;">
						<label><input type="checkbox" id="cdw-check-all"> <?php esc_html_e( 'Select / deselect all', 'culture-community' ); ?></label>
					</div>
					<button id="cdw-seed-btn" class="button button-primary"><?php esc_html_e( 'Seed selected →', 'culture-community' ); ?></button>
					<span class="spinner" id="cdw-seed-spinner" style="float:none;vertical-align:middle;margin-left:4px;"></span>
					<div id="cdw-seed-result" class="cdt-result" style="display:none;"></div>
				</div>
			</div>
		</div>

		<script>
		(function($) {
			var ajaxUrl = '<?php echo esc_js( admin_url( 'admin-ajax.php' ) ); ?>';
			var nonce   = '<?php echo esc_js( $nonce ); ?>';

			/* ── Wikipedia Backfill ── */
			(function() {
				var running = false;
				var currentBatch = 0;
				var totalProcessed = 0;
				var totalUpdated = 0;
				var retryMode = false;

				function log(text, isError) {
					var $log = $('#cdwb-log').show();
					var color = isError ? '#d63638' : '#3c434a';
					$log.append('<div style="color:' + color + ';">' + $('<span>').text(text).html() + '</div>');
					$log.scrollTop($log[0].scrollHeight);
				}

				function tick() {
					if (!running) return;

					$.post(ajaxUrl, {
						action:        'culture_dir_wiki_backfill',
						nonce:         nonce,
						batch:         currentBatch,
						overwrite:     $('#cdwb-overwrite').is(':checked') ? '1' : '',
						retry_failed:  retryMode ? '1' : '',
					})
					.done(function(res) {
						if (!running) return;

						if (!res.success) {
							log('Error: ' + (res.data && res.data.message ? res.data.message : 'unknown'), true);
							stop();
							return;
						}

						var d = res.data;
						totalProcessed += d.processed;
						totalUpdated   += d.updated;
						currentBatch++;

						(d.results || []).forEach(function(r) {
							var suffix = r.found
								? (r.changes && r.changes.length ? ' → updated: ' + r.changes.join(', ') : ' → no changes needed')
								: ' → not found on Wikipedia';
							log((r.found ? '✓' : '–') + ' ' + r.title + suffix);
						});

						log('Batch ' + currentBatch + ': ' + d.processed + ' processed, ' + d.updated + ' updated. ' + (d.total - (currentBatch * 5)) + ' remaining.');

						if (d.done) {
							log('Done — ' + totalProcessed + ' entries processed, ' + totalUpdated + ' updated.', false);
							stop();
							setTimeout(function() { location.reload(); }, 2000);
							return;
						}

						setTimeout(tick, 400);
					})
					.fail(function() {
						log('Request failed — stopping.', true);
						stop();
					});
				}

				function stop() {
					running = false;
					$('#cdwb-start-btn, #cdwb-retry-btn').prop('disabled', false);
					$('#cdwb-stop-btn').hide();
					$('#cdwb-spinner').hide();
				}

				function start(isRetry) {
					running = true;
					retryMode = !!isRetry;
					currentBatch = 0;
					totalProcessed = 0;
					totalUpdated = 0;
					$('#cdwb-start-btn, #cdwb-retry-btn').prop('disabled', true);
					$('#cdwb-stop-btn').show();
					$('#cdwb-spinner').show();
					$('#cdwb-log').empty().show();
					if (isRetry) log('Retrying not-found entries with improved subtitle search…');
					tick();
				}

				$('#cdwb-start-btn').on('click', function() { start(false); });
				$('#cdwb-retry-btn').on('click', function() { start(true); });

				$('#cdwb-stop-btn').on('click', function() {
					log('Stopped by user.');
					stop();
				});
			}());

			/* ── Audit: clear bad Wikipedia matches ── */
			$('#cdwb-audit-btn').on('click', function() {
				var $btn     = $(this);
				var $spinner = $('#cdwb-audit-spinner');
				var $log     = $('#cdwb-audit-log');

				$btn.prop('disabled', true);
				$spinner.show();
				$log.empty().show().append('<div>Scanning all enriched entries…</div>');

				$.post(ajaxurl, {
					action: 'culture_dir_wiki_audit',
					nonce:  '<?php echo esc_js( wp_create_nonce( 'culture_dir_tools' ) ); ?>',
				})
				.done(function(res) {
					$spinner.hide();
					$btn.prop('disabled', false);
					if (!res.success) {
						$log.append('<div style="color:red;">Error: ' + (res.data || 'Unknown error') + '</div>');
						return;
					}
					var d = res.data;
					$log.append('<div><strong>' + d.checked + '</strong> entries checked, <strong>' + d.cleared + '</strong> bad matches cleared.</div>');
					if (d.entries && d.entries.length) {
						$log.append('<div style="margin-top:6px;color:#8a2d10;font-weight:600;">Cleared entries (will be re-processed on next backfill):</div>');
						$.each(d.entries, function(i, e) {
							$log.append('<div>✕ ' + $('<span>').text(e.title).html() + ' <span style="color:#999;">(was: ' + $('<span>').text(e.wiki_was).html() + ')</span></div>');
						});
					} else {
						$log.append('<div style="color:green;">No bad matches found — all stored Wikipedia titles look correct.</div>');
					}
					if (d.cleared > 0) {
						$log.append('<div style="margin-top:8px;">Run <strong>Start backfill</strong> to re-enrich the cleared entries.</div>');
					}
				})
				.fail(function() {
					$spinner.hide();
					$btn.prop('disabled', false);
					$log.append('<div style="color:red;">Request failed.</div>');
				});
			});

			/* ── Infobox Backfill ── */
			(function() {
				var running = false;
				var currentBatch = 0;
				var totalProcessed = 0;
				var totalUpdated = 0;

				function log(text, isError) {
					var $log = $('#cdif-log').show();
					var color = isError ? '#d63638' : '#3c434a';
					$log.append('<div style="color:' + color + ';">' + $('<span>').text(text).html() + '</div>');
					$log.scrollTop($log[0].scrollHeight);
				}

				function tick() {
					if (!running) return;
					$.post(ajaxUrl, {
						action:    'culture_dir_wiki_infobox_fill',
						nonce:     nonce,
						batch:     currentBatch,
						overwrite: $('#cdif-overwrite').is(':checked') ? '1' : '',
					})
					.done(function(res) {
						if (!running) return;
						if (!res.success) {
							log('Error: ' + (res.data && res.data.message ? res.data.message : 'unknown'), true);
							stop();
							return;
						}
						var d = res.data;
						totalProcessed += d.processed;
						totalUpdated   += d.updated;
						currentBatch++;

						(d.results || []).forEach(function(r) {
							log((r.found ? '✓' : '–') + ' ' + r.title + ' — ' + (r.msg || ''));
						});

						log('Batch ' + currentBatch + ': ' + d.processed + ' processed, ' + d.updated + ' updated.');

						if (d.done) {
							log('Done — ' + totalProcessed + ' checked, ' + totalUpdated + ' infoboxes saved.', false);
							stop();
							return;
						}
						setTimeout(tick, 400);
					})
					.fail(function() { log('Request failed — stopping.', true); stop(); });
				}

				function stop() {
					running = false;
					$('#cdif-start-btn').prop('disabled', false);
					$('#cdif-stop-btn').hide();
					$('#cdif-spinner').hide();
				}

				$('#cdif-start-btn').on('click', function() {
					running = true;
					currentBatch = 0;
					totalProcessed = 0;
					totalUpdated = 0;
					$('#cdif-start-btn').prop('disabled', true);
					$('#cdif-stop-btn').show();
					$('#cdif-spinner').show();
					$('#cdif-log').empty().show();
					tick();
				});

				$('#cdif-stop-btn').on('click', function() { log('Stopped by user.'); stop(); });
			}());

			/* ── Title Cleanup ── */
			$('#cdt-title-cleanup-btn').on('click', function() {
				var $btn     = $(this).prop('disabled', true);
				var $spinner = $('#cdt-title-cleanup-spinner').show();
				var $log     = $('#cdt-title-cleanup-log').empty().show().append('<div>Scanning seeded entries…</div>');

				$.post(ajaxUrl, {
					action: 'culture_dir_wiki_title_cleanup',
					nonce:  nonce,
				})
				.done(function(res) {
					$spinner.hide();
					$btn.prop('disabled', false);
					if (!res.success) {
						$log.append('<div style="color:red;">Error: ' + (res.data && res.data.message ? res.data.message : 'unknown') + '</div>');
						return;
					}
					var d = res.data;
					$log.append('<div><strong>' + d.checked + '</strong> entries checked, <strong>' + d.updated + '</strong> titles cleaned.</div>');
					if (d.entries && d.entries.length) {
						$.each(d.entries, function(i, e) {
							$log.append('<div>✓ ' + $('<span>').text(e.old).html() + ' → <em>' + $('<span>').text(e.new).html() + '</em></div>');
						});
					} else {
						$log.append('<div style="color:green;">No disambiguation suffixes found — all titles already clean.</div>');
					}
				})
				.fail(function() {
					$spinner.hide();
					$btn.prop('disabled', false);
					$log.append('<div style="color:red;">Request failed.</div>');
				});
			});

			/* ── Wikipedia Seeder ── */
			$('input[name="cdw-source"]').on('change', function() {
				var v = $(this).val();
				$('#cdw-row-category').toggle(v === 'category');
				$('#cdw-row-manual').toggle(v === 'manual');
			});

			$('#cdw-fetch-btn').on('click', function() {
				var source   = $('input[name="cdw-source"]:checked').val();
				var category = $('#cdw-category').val().trim();
				var manual   = $('#cdw-manual-titles').val().trim();

				if (source === 'category' && !category) { alert('Enter a Wikipedia category slug.'); return; }
				if (source === 'manual'   && !manual)   { alert('Enter at least one title.'); return; }

				var $btn = $(this).prop('disabled', true);
				var $sp  = $('#cdw-fetch-spinner').show();
				var $res = $('#cdw-fetch-result').hide();
				$('#cdw-seed-panel').hide();

				$.post(ajaxUrl, {
					action:   'culture_dir_wiki_fetch',
					nonce:    nonce,
					source:   source,
					category: category,
					titles:   manual,
				})
				.done(function(r) {
					if (!r.success) {
						$res.html('<div class="notice notice-error inline"><p>' + $('<span>').text(r.data.message).html() + '</p></div>').show();
						return;
					}
					var d       = r.data;
					var titles  = d.titles || [];
					var skipped = d.skipped || 0;

					if (!titles.length) {
						$res.html('<div class="notice notice-warning inline"><p>No new articles found (all ' + d.total + ' already in directory).</p></div>').show();
						return;
					}

					$res.html(
						'<p class="description">' + titles.length + ' new article(s) found' +
						(skipped ? ' · ' + skipped + ' already in directory (skipped)' : '') + '.</p>'
					).show();

					var $list = $('#cdw-checklist').empty();
					titles.forEach(function(t) {
						$list.append(
							'<label style="display:block;padding:3px 0;"><input type="checkbox" class="cdw-title-cb" value="' +
							$('<span>').text(t).html().replace(/"/g, '&quot;') +
							'" checked> ' + $('<span>').text(t).html() + '</label>'
						);
					});
					$('#cdw-seed-panel').show();
				})
				.fail(function() { $res.html('<div class="notice notice-error inline"><p>Request failed.</p></div>').show(); })
				.always(function() { $btn.prop('disabled', false); $sp.hide(); });
			});

			$('#cdw-check-all').on('change', function() {
				$('.cdw-title-cb').prop('checked', $(this).is(':checked'));
			});

			$('#cdw-seed-btn').on('click', function() {
				var titles = [];
				$('.cdw-title-cb:checked').each(function() { titles.push($(this).val()); });
				if (!titles.length) { alert('Select at least one article.'); return; }

				var entryType = $('#cdw-entry-type').val();
				var $btn = $(this).prop('disabled', true);
				var $sp  = $('#cdw-seed-spinner').show();
				var $res = $('#cdw-seed-result').hide().html('');

				$.post(ajaxUrl, {
					action:     'culture_dir_wiki_seed',
					nonce:      nonce,
					titles:     titles,
					entry_type: entryType,
				})
				.done(function(r) {
					if (!r.success) {
						$res.html('<div class="notice notice-error inline"><p>' + $('<span>').text(r.data.message).html() + '</p></div>').show();
						return;
					}
					var d    = r.data;
					var html = '<div class="notice notice-success inline"><p><strong>' + d.seeded + ' entr' + (d.seeded === 1 ? 'y' : 'ies') + ' created as pending.</strong>';
					if (d.skipped) html += ' ' + d.skipped + ' skipped (already exist).';
					html += '</p></div>';
					if (d.results && d.results.length) {
						html += '<ul style="margin-top:8px;max-height:200px;overflow-y:auto;font-size:12px;">';
						d.results.forEach(function(r) {
							html += '<li>' + (r.success ? '&#10003;' : '&#8211;') + ' ' + $('<span>').text(r.title).html() + '</li>';
						});
						html += '</ul>';
					}
					$res.html(html).show();
				})
				.fail(function() { $res.html('<div class="notice notice-error inline"><p>Request failed.</p></div>').show(); })
				.always(function() { $btn.prop('disabled', false); $sp.hide(); });
			});

		}(jQuery));
		</script>
		<?php
	}

	// ── Inline CSS ────────────────────────────────────────────────────────────

	private static function inline_css() {
		return '
		.cdt-wrap h1 { margin-bottom: 20px; }
		.cdt-panel {
			background: #fff;
			border: 1px solid #c3c4c7;
			border-radius: 3px;
			padding: 24px 28px;
			margin-bottom: 24px;
			max-width: 900px;
		}
		.cdt-panel h2 { margin-top: 0; padding-top: 0; border: none; }
		.cdt-progress-block { margin: 16px 0 24px; }
		.cdt-progress-label { font-size: 13px; margin-bottom: 8px; }
		.cdt-pct { margin-left: 8px; color: #646970; }
		.cdt-progress-bar {
			height: 12px;
			background: #f0f0f0;
			border-radius: 6px;
			overflow: hidden;
			border: 1px solid #dcdcde;
		}
		.cdt-progress-fill {
			height: 100%;
			background: linear-gradient(90deg, #00a32a, #72aee6);
			border-radius: 6px;
			transition: width 0.4s;
		}
		.cdt-remaining-list { color: #646970; font-size: 12px; }
		.cdt-form-table th { width: 160px; }
		.cdt-result { margin-top: 16px; }
		.cdt-result ul { margin: 4px 0 0 16px; list-style: disc; font-size: 13px; }
		';
	}
}
