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
		add_action( 'wp_ajax_culture_dir_wiki_fetch',     array( __CLASS__, 'ajax_wiki_fetch' ) );
		add_action( 'wp_ajax_culture_dir_wiki_seed',      array( __CLASS__, 'ajax_wiki_seed' ) );
		add_action( 'wp_ajax_culture_dir_wiki_backfill',  array( __CLASS__, 'ajax_wiki_backfill' ) );
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
			$out[ $page['title'] ] = $page;
		}

		return $out;
	}

	/** Create one pending culture_directory entry from Wikipedia page data. */
	private static function create_wiki_directory_entry( string $title, array $page, string $entry_type ): int {
		$extract = strip_tags( $page['extract'] ?? '' );
		$excerpt = '';
		$content = '';

		if ( $extract ) {
			$dot     = strpos( $extract, '. ' );
			$excerpt = $dot !== false
				? substr( $extract, 0, $dot + 1 )
				: substr( $extract, 0, 220 );

			$paras   = array_filter( array_map( 'trim', preg_split( '/\n{2,}/', $extract ) ) );
			$content = implode( "\n\n", array_map( function ( $p ) {
				return '<p>' . wp_kses_post( $p ) . '</p>';
			}, $paras ) );
		}

		if ( empty( $excerpt ) ) $excerpt = $title;
		if ( empty( $content ) ) $content = '<p>' . esc_html( $title ) . '</p>';

		// Skip if a directory entry with this exact title already exists
		$existing = get_page_by_title( $title, OBJECT, 'culture_directory' );
		if ( $existing ) {
			return 0;
		}

		$post_id = wp_insert_post( array(
			'post_type'    => 'culture_directory',
			'post_status'  => 'pending',
			'post_title'   => $title,
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

	/** Search Wikipedia for the best-matching article title. */
	private static function wiki_opensearch( string $title, string $entry_type ): ?string {
		static $hints = array( 'film' => 'film', 'book' => 'novel', 'album' => 'album' );
		$hint = $hints[ $entry_type ] ?? '';

		// Inner helper: run opensearch for a given query string.
		$search = function( string $q ) use ( $hint ): ?string {
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
			return ! empty( $titles[0] ) ? (string) $titles[0] : null;
		};

		// First attempt: full title.
		$result = $search( $title );
		if ( $result ) return $result;

		// Fallback 1: strip trailing disambiguation suffix in parentheses —
		// e.g. "Game of Thrones (TV series)" → "Game of Thrones",
		//      "Squid Game (TV series)" → "Squid Game",
		//      "Black Panther (film)" → "Black Panther".
		// Directory entries are stored with these qualifiers to avoid ambiguity
		// but Wikipedia article titles usually omit them.
		$paren_base = preg_replace( '/\s*\([^)]+\)\s*$/', '', $title );
		if ( $paren_base && $paren_base !== $title ) {
			$result = $search( $paren_base );
			if ( $result ) return $result;
		}

		// Fallback 2: strip subtitle after ': ' — e.g. "The Tortured Poets Department: The Anthology"
		// → "The Tortured Poets Department". Many albums, films and books carry edition/sequel
		// subtitles not reflected in the Wikipedia article title.
		$colon_pos = strpos( $title, ': ' );
		if ( $colon_pos !== false ) {
			$colon_base = substr( $title, 0, $colon_pos );
			$result     = $search( $colon_base );
			if ( $result ) return $result;
		}

		// Fallback 3: strip edition/variant suffix after ' - ' —
		// e.g. "Sense and Sensibility - Illustrated Edition" → "Sense and Sensibility".
		$dash_pos = strpos( $title, ' - ' );
		if ( $dash_pos !== false ) {
			$dash_base = substr( $title, 0, $dash_pos );
			$result    = $search( $dash_base );
			if ( $result ) return $result;
		}

		// Fallback 4: Wikipedia full-text search — handles cases where the article title
		// differs substantially from the stored entry title, e.g. "The Odyssey of Homer"
		// stored in the directory but the Wikipedia article is simply "Odyssey".
		// Uses action=query&list=search (CirrusSearch) rather than opensearch, which only
		// does title prefix/fuzzy matching and misses these.
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
			if ( ! empty( $fts_results[0]['title'] ) ) {
				return (string) $fts_results[0]['title'];
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
			$max      = $is_multi ? ( $spec['max'] ?? 5 ) : 1;
			$values   = array();

			foreach ( array_slice( $claim_arr, 0, $is_multi ? $max : 1 ) as $claim ) {
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
