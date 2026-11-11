<?php
/**
 * Directory Tools admin page.
 *
 * Provides a no-code interface for:
 *   1. Seeder  – trigger the Next.js auto-populate job with a chosen batch size.
 *   2. Images  – generate Imagen 3 featured images for published entries that
 *                currently have none.
 *
 * Both panels proxy their requests through WP Admin AJAX → PHP → Next.js API,
 * so no credentials are ever exposed to the browser.
 *
 * Required WP options (set via Settings → General tab):
 *   culture_frontend_url   e.g. https://themoveee.com
 *   culture_cron_secret    must match CRON_SECRET on Vercel
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Culture_Directory_Tools {

    /**
     * Canonical seed topic list – kept in sync with
     * app/api/directory/auto-populate/route.ts → SEED_TOPICS.
     */
    private static $seed_topics = array(
        // People
        'Fela Kuti', 'Miriam Makeba', 'Chinua Achebe', 'Wole Soyinka',
        'Chimamanda Ngozi Adichie', 'Toni Morrison', 'Langston Hughes',
        'Jean-Michel Basquiat', 'Kwame Nkrumah', 'Steve Biko',
        'Nina Simone', 'James Baldwin', 'Frantz Fanon', 'Octavia Butler',
        'Wizkid', 'Burna Boy', 'Angélique Kidjo', 'Hugh Masekela',
        'Aimé Césaire', 'Édouard Glissant', 'El Anatsui', 'Malick Sidibé',
        'Yinka Shonibare', 'Njideka Akunyili Crosby', 'Kehinde Wiley',
        // Places
        'Lagos', 'Accra', 'Nairobi', 'Dakar', 'Harlem', 'Brixton',
        'Johannesburg', 'Kingston (Jamaica)', 'Port-of-Spain',
        'Marrakech', 'Cape Town', 'Abidjan',
        // Movements & Genres
        'Afrobeats', 'Highlife', 'Afrobeat', 'Jùjú music', 'Afrofuturism',
        'Pan-Africanism', 'Negritude', 'Black Arts Movement',
        'Harlem Renaissance', 'Nollywood', 'New African Cinema',
        'Afropunk', 'Amapiano',
        // Concepts & Practices
        'Ubuntu (philosophy)', 'Sankofa', 'Diaspora aesthetics',
        'African wax print', 'Ankara fabric', 'Kente cloth',
        'Adinkra symbols', 'Djembe', 'Griot tradition',
        // Food & Fashion
        'Jollof Rice', 'Egusi soup', 'Suya', 'Thieboudienne',
        'Piri Piri', 'Akara', 'Sadza',
        // Artworks / Landmarks
        'Black Panther (film)', 'I Am Not Your Negro (film)',
        'Things Fall Apart (novel)', 'Song of Solomon (novel)',
        'Beloved (novel)', 'Purple Hibiscus (novel)',
        'Sankofa (film)', 'Beasts of No Nation (film)',
    );

    public static function init() {
        add_action( 'admin_menu',            array( __CLASS__, 'register_menu' ) );
        add_action( 'wp_ajax_culture_dir_run_seeder',               array( __CLASS__, 'ajax_run_seeder' ) );
        add_action( 'wp_ajax_culture_dir_run_bulk_seed_real',       array( __CLASS__, 'ajax_run_bulk_seed_real' ) );
        add_action( 'wp_ajax_culture_dir_reset_bulk_seed_state',    array( __CLASS__, 'ajax_reset_bulk_seed_state' ) );
        add_action( 'wp_ajax_culture_dir_delete_imported_books',    array( __CLASS__, 'ajax_delete_imported_books' ) );
        add_action( 'wp_ajax_culture_import_quotes',                array( __CLASS__, 'ajax_import_quotes' ) );
        add_action( 'wp_ajax_culture_dir_generate_image',          array( __CLASS__, 'ajax_generate_image' ) );
        add_action( 'wp_ajax_culture_dir_save_extra_topics',       array( __CLASS__, 'ajax_save_extra_topics' ) );
        add_action( 'wp_ajax_culture_dir_backfill_image_meta',     array( __CLASS__, 'ajax_backfill_image_meta' ) );
        // Wikipedia seeder
        add_action( 'wp_ajax_culture_dir_wiki_fetch',              array( __CLASS__, 'ajax_wiki_fetch' ) );
        add_action( 'wp_ajax_culture_dir_wiki_seed',               array( __CLASS__, 'ajax_wiki_seed' ) );
        add_action( 'wp_ajax_culture_dir_wiki_backfill',           array( __CLASS__, 'ajax_wiki_backfill' ) );
        add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_assets' ) );
    }

    public static function register_menu() {
        // Nested under the Moveee Content top-level menu (September 2026;
        // was Culture Community) — it manages the Directory CPT's own
        // seeder/image tools, so it belongs alongside Directory itself.
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
        // Hook suffix is derived from the parent menu slug
        // ({parent_slug}_page_{slug}) — see the "WP Admin menu structure"
        // gotcha note in CLAUDE.md: this had to change when the parent moved
        // from culture-community to culture-content-manager.
        if ( 'culture-content-manager_page_culture-directory-tools' !== $hook ) {
            return;
        }
        // Inline styles so we don't need a separate CSS file.
        wp_add_inline_style( 'wp-admin', self::inline_css() );
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private static function get_frontend_url() {
        return untrailingslashit( get_option( 'culture_frontend_url', '' ) );
    }

    private static function get_cron_secret() {
        return get_option( 'culture_cron_secret', '' );
    }

    private static function is_configured() {
        return ! empty( self::get_frontend_url() ) && ! empty( self::get_cron_secret() );
    }

    /** Returns published culture_directory titles (lowercase) already in WP. */
    private static function get_seeded_titles() {
        $posts = get_posts( array(
            'post_type'              => 'culture_directory',
            'post_status'            => 'publish',
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

    /** Returns published culture_directory posts that have no featured image. */
    private static function get_posts_without_images() {
        return get_posts( array(
            'post_type'              => 'culture_directory',
            'post_status'            => 'publish',
            'posts_per_page'         => -1,
            'fields'                 => 'ids',
            'no_found_rows'          => true,
            'update_post_meta_cache' => false,
            'update_post_term_cache' => false,
            'meta_query'             => array(
                array(
                    'key'     => '_thumbnail_id',
                    'compare' => 'NOT EXISTS',
                ),
            ),
        ) );
    }

    // ── AJAX: run seeder ──────────────────────────────────────────────────────

    public static function ajax_run_seeder() {
        check_ajax_referer( 'culture_dir_tools', 'nonce' );
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_send_json_error( array( 'message' => 'Forbidden.' ) );
        }

        if ( ! self::is_configured() ) {
            wp_send_json_error( array( 'message' => 'Frontend URL or Cron Secret not configured. Go to Settings → General.' ) );
        }

        $batch_size      = max( 1, min( 20, (int) ( $_POST['batch_size'] ?? 5 ) ) );
        $generate_images = ! empty( $_POST['generate_images'] );

        $response = wp_remote_post(
            self::get_frontend_url() . '/api/directory/auto-populate',
            array(
                'headers' => array(
                    'Authorization' => 'Bearer ' . self::get_cron_secret(),
                    'Content-Type'  => 'application/json',
                ),
                'body'    => wp_json_encode( array(
                    'batchSize'      => $batch_size,
                    'generateImages' => $generate_images,
                ) ),
                'timeout' => 295,
            )
        );

        if ( is_wp_error( $response ) ) {
            wp_send_json_error( array( 'message' => $response->get_error_message() ) );
        }

        $code = wp_remote_retrieve_response_code( $response );
        $body = json_decode( wp_remote_retrieve_body( $response ), true );

        if ( $code !== 200 ) {
            wp_send_json_error( array( 'message' => $body['error'] ?? "HTTP $code from seeder." ) );
        }

        wp_send_json_success( $body );
    }

    /**
     * AJAX handler for the "Bulk Seed Real Entries" panel — each click calls
     * /api/directory/bulk-seed-real exactly once (one bounded chunk of one
     * category; see that route's own docblock), so this never needs the
     * admin to have or paste CRON_SECRET anywhere — it's read from the same
     * stored WP option the Seeder panel above already uses. The page's own
     * JS calls this repeatedly (with a short pause between calls) until the
     * response reports done:true or the admin clicks Stop.
     */
    public static function ajax_run_bulk_seed_real() {
        check_ajax_referer( 'culture_dir_tools', 'nonce' );
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_send_json_error( array( 'message' => 'Forbidden.' ) );
        }

        if ( ! self::is_configured() ) {
            wp_send_json_error( array( 'message' => 'Frontend URL or Cron Secret not configured. Go to Settings → General.' ) );
        }

        $response = wp_remote_post(
            self::get_frontend_url() . '/api/directory/bulk-seed-real',
            array(
                'headers' => array(
                    'Authorization' => 'Bearer ' . self::get_cron_secret(),
                    'Content-Type'  => 'application/json',
                ),
                'body'    => '{}',
                'timeout' => 115, // matches that route's own maxDuration (120s) with margin
            )
        );

        if ( is_wp_error( $response ) ) {
            wp_send_json_error( array( 'message' => $response->get_error_message() ) );
        }

        $code = wp_remote_retrieve_response_code( $response );
        $body = json_decode( wp_remote_retrieve_body( $response ), true );

        if ( $code !== 200 ) {
            wp_send_json_error( array( 'message' => $body['error'] ?? "HTTP $code from bulk-seed-real." ) );
        }

        wp_send_json_success( $body );
    }

    /**
     * AJAX handler: clear the bulk-seed-real progress counters so the seeder
     * starts fresh. Does NOT delete any directory entries already imported.
     */
    public static function ajax_reset_bulk_seed_state() {
        check_ajax_referer( 'culture_dir_tools', 'nonce' );
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_send_json_error( array( 'message' => 'Forbidden.' ) );
        }
        delete_option( 'culture_dir_bulk_seed_state' );
        wp_send_json_success( array( 'message' => 'Seed state cleared.' ) );
    }

    /**
     * AJAX handler: permanently delete all book entries imported by the
     * bulk-seed-real seeder (external_source = 'google_books').
     * Does NOT touch AI-generated entries or manually added books.
     */
    public static function ajax_delete_imported_books() {
        check_ajax_referer( 'culture_dir_tools', 'nonce' );
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_send_json_error( array( 'message' => 'Forbidden.' ) );
        }

        global $wpdb;
        // Find all culture_directory posts where _external_source = 'google_books'
        $ids = $wpdb->get_col( $wpdb->prepare(
            "SELECT post_id FROM {$wpdb->postmeta}
             WHERE meta_key = '_external_source' AND meta_value = %s",
            'google_books'
        ) );

        $deleted = 0;
        foreach ( $ids as $post_id ) {
            if ( wp_delete_post( (int) $post_id, true ) ) {
                $deleted++;
            }
        }

        wp_send_json_success( array(
            'deleted' => $deleted,
            'message' => "Deleted {$deleted} imported book entr" . ( $deleted === 1 ? 'y' : 'ies' ) . '.',
        ) );
    }

    /**
     * AJAX handler to bulk-import quotes from CSV text or uploaded file.
     * Expected format: "Quote Text", "Author", "Source"
     */
    public static function ajax_import_quotes() {
        check_ajax_referer( 'culture_dir_tools', 'nonce' );
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_send_json_error( array( 'message' => 'Forbidden.' ) );
        }

        $raw_data = '';

        // Case 1: File upload.
        if ( ! empty( $_FILES['csv_file']['tmp_name'] ) ) {
            $raw_data = file_get_contents( $_FILES['csv_file']['tmp_name'] );
        }
        // Case 2: Manual text paste.
        elseif ( ! empty( $_POST['csv_text'] ) ) {
            $raw_data = $_POST['csv_text'];
        }

        if ( empty( $raw_data ) ) {
            wp_send_json_error( array( 'message' => 'No data or file provided.' ) );
        }

        // 1. Pre-Normalization: Resolve smart quotes and inconsistent padding.
        $search   = array( '“', '”', '«', '»', '‘', '’', '–', '—' );
        $replace  = array( '"', '"', '"', '"', "'", "'", '-', '-' );
        $raw_data = str_replace( $search, $replace, $raw_data );

        /**
         * 2. DELIMITER SANITIZATION:
         * Standard CSV parsers fail if there is a space before the opening quote.
         * We surgically remove spaces around commas ONLY when they sit between quotes.
         */
        $raw_data = preg_replace( '/,\s+"/', ',"', $raw_data ); // Fixes: , "Field"
        $raw_data = preg_replace( '/"\s+,/', '",', $raw_data ); // Fixes: "Field" ,

        // Ensure consistent line endings for the stream parser.
        $raw_data = str_replace( array( "\r\n", "\r" ), "\n", $raw_data );

        // 3. STREAM-BASED PARSING: The native PHP way to handle multi-line quotes and internal commas.
        $stream = fopen( 'php://temp', 'r+' );
        fwrite( $stream, $raw_data );
        rewind( $stream );

        $created = 0;
        $skipped = 0;
        $results = array();
        $is_first_row = true;

        while ( ( $data = fgetcsv( $stream, 0, ',', '"' ) ) !== false ) {
            // Skip empty rows.
            if ( empty( $data ) || ( count( $data ) === 1 && empty( $data[0] ) ) ) {
                continue;
            }

            // Detect and skip header row.
            if ( $is_first_row ) {
                $is_first_row = false;
                $first_val = strtolower( trim( $data[0] ?? '' ) );
                if ( in_array( $first_val, array( 'quote', 'text', 'content' ), true ) ) {
                    continue;
                }
            }

            if ( count( $data ) < 2 ) {
                $line_preview = substr( trim( $data[0] ?? '' ), 0, 30 ) . '...';
                $results[] = array( 'title' => $line_preview, 'success' => false, 'error' => 'Invalid format. Ensure fields are quoted.' );
                $skipped++;
                continue;
            }

            $text   = trim( $data[0] );
            $author = trim( $data[1] );
            $source = isset( $data[2] ) ? trim( $data[2] ) : '';

            if ( empty( $text ) || empty( $author ) ) {
                $skipped++;
                continue;
            }

            // Duplicate detection: compare normalised content hash.
            $hash = md5( strtolower( trim( wp_strip_all_tags( $text ) ) ) );
            $existing = get_posts( array(
                'post_type'      => 'culture_quote',
                'post_status'    => array( 'publish', 'pending' ),
                'posts_per_page' => 1,
                'meta_query'     => array(
                    array(
                        'key'     => '_quote_content_hash',
                        'value'   => $hash,
                        'compare' => '=',
                    ),
                ),
            ) );

            if ( ! empty( $existing ) ) {
                $results[] = array( 'title' => $author, 'success' => false, 'error' => 'Already exists.' );
                $skipped++;
                continue;
            }

            // Create the post.
            $post_id = wp_insert_post( array(
                'post_title'   => wp_trim_words( $text, 10 ),
                'post_content' => $text,
                'post_status'  => 'publish',
                'post_type'    => 'culture_quote',
                'post_author'  => get_current_user_id(),
            ) );

            if ( is_wp_error( $post_id ) ) {
                $results[] = array( 'title' => $author, 'success' => false, 'error' => $post_id->get_error_message() );
                $skipped++;
                continue;
            }

            // Set author taxonomy.
            wp_set_object_terms( $post_id, $author, 'culture_quote_author' );

            // Set meta.
            update_post_meta( $post_id, '_quote_source', $source );
            update_post_meta( $post_id, '_quote_user_id', get_current_user_id() );
            update_post_meta( $post_id, '_quote_likes', 0 );
            update_post_meta( $post_id, '_quote_reports', 0 );
            update_post_meta( $post_id, '_quote_content_hash', $hash );
            update_post_meta( $post_id, '_culture_like_count', 0 );

            $results[] = array( 'title' => $author, 'success' => true );
            $created++;
        }

        fclose( $stream );

        wp_send_json_success( array(
            'created' => $created,
            'skipped' => $skipped,
            'results' => $results,
        ) );
    }

    // ── AJAX: generate image for one post ─────────────────────────────────────

    public static function ajax_generate_image() {
        check_ajax_referer( 'culture_dir_tools', 'nonce' );
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_send_json_error( array( 'message' => 'Forbidden.' ) );
        }

        if ( ! self::is_configured() ) {
            wp_send_json_error( array( 'message' => 'Frontend URL or Cron Secret not configured.' ) );
        }

        $post_id = (int) ( $_POST['post_id'] ?? 0 );
        if ( ! $post_id ) {
            wp_send_json_error( array( 'message' => 'Missing post_id.' ) );
        }

        $post = get_post( $post_id );
        if ( ! $post || 'culture_directory' !== $post->post_type ) {
            wp_send_json_error( array( 'message' => 'Post not found or not a directory entry.' ) );
        }

        $type_terms = wp_get_post_terms( $post_id, 'culture_dir_type' );
        $entry_type = ( ! is_wp_error( $type_terms ) && ! empty( $type_terms ) )
            ? $type_terms[0]->slug
            : 'entry';

        $response = wp_remote_post(
            self::get_frontend_url() . '/api/directory/generate-image',
            array(
                'headers' => array(
                    'Authorization' => 'Bearer ' . self::get_cron_secret(),
                    'Content-Type'  => 'application/json',
                ),
                'body'    => wp_json_encode( array(
                    'postId'    => $post_id,
                    'title'     => $post->post_title,
                    'entryType' => $entry_type,
                    'excerpt'   => $post->post_excerpt,
                ) ),
                'timeout' => 60,
            )
        );

        if ( is_wp_error( $response ) ) {
            wp_send_json_error( array( 'message' => $response->get_error_message() ) );
        }

        $code = wp_remote_retrieve_response_code( $response );
        $body = json_decode( wp_remote_retrieve_body( $response ), true );

        if ( $code !== 200 ) {
            wp_send_json_error( array( 'message' => $body['error'] ?? "HTTP $code from image generator." ) );
        }

        wp_send_json_success( $body );
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

            $url      = add_query_arg( array(
                'action'     => 'query',
                'list'       => 'categorymembers',
                'cmtitle'    => $category,
                'cmlimit'    => '100',
                'cmtype'     => 'page',
                'cmnamespace' => '0',
                'format'     => 'json',
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
        $existing = self::get_all_directory_titles();
        $new_titles = array_values( array_filter( $titles, function( $t ) use ( $existing ) {
            return ! in_array( strtolower( trim( $t ) ), $existing, true );
        } ) );

        wp_send_json_success( array(
            'titles'   => $new_titles,
            'skipped'  => count( $titles ) - count( $new_titles ),
            'total'    => count( $titles ),
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

        $titles   = array_slice( $titles, 0, 50 ); // hard cap per request
        $seeded   = 0;
        $skipped  = 0;
        $results  = array();

        // Fetch Wikipedia page data in batches of 20
        $batch_size = 20;
        for ( $i = 0; $i < count( $titles ); $i += $batch_size ) {
            $batch      = array_slice( $titles, $i, $batch_size );
            $pages_data = self::wiki_fetch_pages_batch( $batch );

            foreach ( $batch as $title ) {
                $page = $pages_data[ $title ] ?? null;
                if ( ! $page ) {
                    // Try case-insensitive match (Wikipedia may normalise the title)
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

    /** Fetch page extracts + thumbnails for up to 20 titles in one API call. */
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
        $extract  = strip_tags( $page['extract'] ?? '' );
        $excerpt  = '';
        $content  = '';

        if ( $extract ) {
            // First sentence as excerpt
            $dot = strpos( $extract, '. ' );
            $excerpt = $dot !== false
                ? substr( $extract, 0, $dot + 1 )
                : substr( $extract, 0, 220 );

            // Format full extract as paragraphs
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

        // Fetch and save Wikidata structured fields (director, year, cast, etc.)
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

        $batch_num  = max( 0, (int) ( $_POST['batch'] ?? 0 ) );
        $batch_size = 5; // small batch — each entry needs one HTTP call
        $overwrite  = ! empty( $_POST['overwrite'] );
        $offset     = $batch_num * $batch_size;

        // Count entries not yet Wikipedia-enriched (no _wiki_title meta row)
        $total = (int) $wpdb->get_var(
            "SELECT COUNT(DISTINCT p.ID)
             FROM {$wpdb->posts} p
             LEFT JOIN {$wpdb->postmeta} pm
                 ON pm.post_id = p.ID AND pm.meta_key = '_wiki_title'
             WHERE p.post_type = 'culture_directory'
               AND p.post_status = 'publish'
               AND pm.meta_value IS NULL"
        );

        // Get this batch
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
                // Mark as checked so this entry is skipped on subsequent runs
                update_post_meta( (int) $post_id, '_wiki_title', '_not_found' );
                $results[] = array( 'title' => $post->post_title, 'found' => false );
                continue;
            }

            // Fetch page data (extract + thumbnail)
            $pages = self::wiki_fetch_pages_batch( array( $wiki_title ) );
            $page  = $pages[ $wiki_title ] ?? null;

            // Fallback: try normalised title match
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

        // done when this batch contained fewer entries than the batch_size
        // (last page), or the offset now equals total.
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
        $hint  = $hints[ $entry_type ] ?? '';
        $query = $hint ? "$title $hint" : $title;

        $url = add_query_arg( array(
            'action'    => 'opensearch',
            'search'    => $query,
            'limit'     => '3',
            'redirects' => 'resolve',
            'format'    => 'json',
        ), 'https://en.wikipedia.org/w/api.php' );

        $response = wp_remote_get( $url, array( 'timeout' => 10 ) );
        if ( is_wp_error( $response ) ) return null;

        $body   = json_decode( wp_remote_retrieve_body( $response ), true );
        $titles = $body[1] ?? array();
        return ! empty( $titles[0] ) ? (string) $titles[0] : null;
    }

    /**
     * Wikidata property → ACF field name, per entry type.
     * 'multi' entries collect multiple claim values (e.g. cast members).
     */
    private static function wikidata_prop_map(): array {
        return array(
            'film' => array(
                'P57'  => array( 'acf' => 'dir_infobox_director',            'multi' => false ),
                'P577' => array( 'acf' => 'dir_infobox_year',                'multi' => false, 'type' => 'time' ),
                'P2047'=> array( 'acf' => 'dir_infobox_runtime',             'multi' => false, 'type' => 'quantity', 'suffix' => ' min' ),
                'P495' => array( 'acf' => 'dir_infobox_country',             'multi' => false ),
                'P364' => array( 'acf' => 'dir_infobox_language',            'multi' => false ),
                'P750' => array( 'acf' => 'dir_infobox_distributor',         'multi' => false ),
                'P272' => array( 'acf' => 'dir_infobox_production_company',  'multi' => false ),
                'P344' => array( 'acf' => 'dir_infobox_cinematographer',     'multi' => false ),
                'P161' => array( 'acf' => 'dir_infobox_starring',            'multi' => true, 'max' => 8 ),
                'P136' => array( 'acf' => 'dir_infobox_genre',               'multi' => false ),
            ),
            'book' => array(
                'P50'  => array( 'acf' => 'dir_infobox_author',              'multi' => false ),
                'P577' => array( 'acf' => 'dir_infobox_year_published',      'multi' => false, 'type' => 'time' ),
                'P1104'=> array( 'acf' => 'dir_infobox_pages',               'multi' => false, 'type' => 'quantity' ),
                'P136' => array( 'acf' => 'dir_infobox_genre',               'multi' => false ),
                'P123' => array( 'acf' => 'dir_infobox_publisher',           'multi' => false ),
                'P407' => array( 'acf' => 'dir_infobox_language',            'multi' => false ),
                'P495' => array( 'acf' => 'dir_infobox_country',             'multi' => false ),
            ),
            'album' => array(
                'P175' => array( 'acf' => 'dir_infobox_artist',              'multi' => false ),
                'P264' => array( 'acf' => 'dir_infobox_record_label',        'multi' => false ),
                'P577' => array( 'acf' => 'dir_infobox_year',                'multi' => false, 'type' => 'time' ),
                'P136' => array( 'acf' => 'dir_infobox_genre',               'multi' => false ),
                'P2554'=> array( 'acf' => 'dir_infobox_producer',            'multi' => false ),
                'P495' => array( 'acf' => 'dir_infobox_country_of_origin',   'multi' => false ),
            ),
            'person' => array(
                'P569' => array( 'acf' => 'dir_infobox_born',                'multi' => false, 'type' => 'time' ),
                'P570' => array( 'acf' => 'dir_infobox_died',                'multi' => false, 'type' => 'time' ),
                'P27'  => array( 'acf' => 'dir_infobox_nationality',         'multi' => false ),
                'P106' => array( 'acf' => 'dir_infobox_occupation',          'multi' => false ),
                'P19'  => array( 'acf' => 'dir_infobox_origin_city',         'multi' => false ),
            ),
            'place' => array(
                'P17'  => array( 'acf' => 'dir_infobox_country',             'multi' => false ),
                'P131' => array( 'acf' => 'dir_infobox_region',              'multi' => false ),
                'P571' => array( 'acf' => 'dir_infobox_founded',             'multi' => false, 'type' => 'time' ),
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

        // Fetch claims
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

        $fields       = array();
        $entity_qids  = array(); // QIDs needing label resolution
        $qid_to_acf   = array(); // QID → ACF key

        foreach ( $prop_map as $prop_id => $spec ) {
            $acf_key = $spec['acf'];
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
                        // monolingualtext
                        $values[] = (string) $val['text'];
                    } elseif ( isset( $val['amount'] ) && ( $spec['type'] ?? '' ) === 'quantity' ) {
                        $num = (string) abs( (float) $val['amount'] );
                        $values[] = $num . ( $spec['suffix'] ?? '' );
                    } elseif ( isset( $val['time'] ) && ( $spec['type'] ?? '' ) === 'time' ) {
                        $year = ltrim( substr( $val['time'], 1, 4 ), '0' );
                        if ( $year && $year !== '0' ) $values[] = $year;
                    } elseif ( isset( $val['id'] ) ) {
                        // entity reference — resolve label later
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
                $label_body = json_decode( wp_remote_retrieve_body( $label_resp ), true );
                $entities   = $label_body['entities'] ?? array();

                // For multi-value fields, collect all resolved labels per ACF key
                $multi_values = array();
                foreach ( $entity_qids as $eq ) {
                    $label = $entities[ $eq ]['labels']['en']['value'] ?? null;
                    if ( ! $label ) continue;
                    $acf = $qid_to_acf[ $eq ] ?? null;
                    if ( ! $acf ) continue;
                    $multi_values[ $acf ][] = $label;
                }
                foreach ( $multi_values as $acf => $labels ) {
                    $spec = array_values( array_filter( self::wikidata_prop_map()[ $entry_type ], function ( $s ) use ( $acf ) {
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
        }
        return $saved;
    }

    /**
     * Apply Wikipedia page data to an existing directory entry.
     * Also fetches Wikidata structured fields (director, year, cast, etc.) and
     * saves them to ACF post meta so the infobox boxes in WP Admin are populated.
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

        // Fetch and save Wikidata structured fields (director, year, cast, etc.)
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

    // ── AJAX: save extra topics ───────────────────────────────────────────────

    public static function ajax_save_extra_topics() {
        check_ajax_referer( 'culture_dir_tools', 'nonce' );
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_send_json_error( array( 'message' => 'Forbidden.' ) );
        }

        $raw_input = sanitize_textarea_field( $_POST['topics'] ?? '' );
        $lines     = array_filter(
            array_map( 'trim', explode( "\n", $raw_input ) )
        );

        if ( empty( $lines ) ) {
            wp_send_json_error( array( 'message' => 'No topics provided.' ) );
        }

        // Merge with existing stored topics.
        $stored   = get_option( 'culture_dir_extra_topics', '[]' );
        $existing = json_decode( $stored, true );
        if ( ! is_array( $existing ) ) {
            $existing = array();
        }

        $existing_lower = array_map( 'strtolower', $existing );
        $added          = 0;
        foreach ( $lines as $topic ) {
            $topic = sanitize_text_field( $topic );
            if ( ! in_array( strtolower( $topic ), $existing_lower, true ) ) {
                $existing[]       = $topic;
                $existing_lower[] = strtolower( $topic );
                $added++;
            }
        }

        update_option( 'culture_dir_extra_topics', wp_json_encode( array_values( $existing ) ) );

        wp_send_json_success( array(
            'added' => $added,
            'total' => count( $existing ),
        ) );
    }

    // ── Page renderer ─────────────────────────────────────────────────────────

    public static function render_page() {
        $configured     = self::is_configured();
        $seeded_titles  = self::get_seeded_titles();
        $total          = count( self::$seed_topics );
        $seeded_count   = 0;
        $remaining      = array();

        // Bulk-seed-real progress — the same option
        // apps/site/app/api/directory/bulk-seed-real/route.ts reads/writes
        // via GET/POST /culture/v1/directory/bulk-seed-state. Read directly
        // here (no Next.js round trip needed just to display it).
        $bulk_state_raw   = get_option( 'culture_dir_bulk_seed_state', '{}' );
        $bulk_state       = json_decode( $bulk_state_raw, true );
        $bulk_film        = (int) ( $bulk_state['film']['created'] ?? 0 );
        $bulk_music       = (int) ( $bulk_state['music']['created'] ?? 0 );
        $bulk_book        = (int) ( $bulk_state['book']['created'] ?? 0 );
        $bulk_total       = $bulk_film + $bulk_music + $bulk_book;
        $bulk_target_each = array( 'film' => 334, 'music' => 333, 'book' => 333 );
        $bulk_pct         = round( ( $bulk_total / 1000 ) * 100 );

        // Load extra (admin-added + AI-generated) topics.
        $extra_topics_raw  = get_option( 'culture_dir_extra_topics', '[]' );
        $extra_topics      = json_decode( $extra_topics_raw, true );
        if ( ! is_array( $extra_topics ) ) {
            $extra_topics = array();
        }

        foreach ( self::$seed_topics as $topic ) {
            if ( in_array( strtolower( trim( $topic ) ), $seeded_titles, true ) ) {
                $seeded_count++;
            } else {
                $remaining[] = $topic;
            }
        }

        $no_image_posts = self::get_posts_without_images();
        $nonce          = wp_create_nonce( 'culture_dir_tools' );
        $pct            = $total > 0 ? round( ( $seeded_count / $total ) * 100 ) : 0;
        ?>
        <div class="wrap cdt-wrap">
            <h1><?php esc_html_e( 'Directory Tools', 'culture-community' ); ?></h1>

            <?php if ( ! $configured ) : ?>
            <div class="notice notice-warning">
                <p>
                    <?php esc_html_e( 'Please configure the ', 'culture-community' ); ?>
                    <a href="<?php echo esc_url( admin_url( 'admin.php?page=culture-community&tab=general' ) ); ?>">
                        <?php esc_html_e( 'Frontend Site URL and Cron Secret', 'culture-community' ); ?>
                    </a>
                    <?php esc_html_e( ' before using these tools.', 'culture-community' ); ?>
                </p>
            </div>
            <?php endif; ?>

            <?php /* ── SEEDER PANEL ── */ ?>
            <div class="cdt-panel">
                <h2><?php esc_html_e( 'Directory Seeder', 'culture-community' ); ?></h2>
                <p class="description">
                    <?php esc_html_e( 'Automatically generate and publish notable culture entries using Gemini AI, favouring African, Caribbean, and Black diaspora topics. Each batch picks a random selection of topics not yet in the directory.', 'culture-community' ); ?>
                </p>

                <div class="cdt-progress-block">
                    <div class="cdt-progress-label">
                        <strong><?php echo esc_html( $seeded_count ); ?></strong>
                        <?php esc_html_e( ' of ', 'culture-community' ); ?>
                        <strong><?php echo esc_html( $total ); ?></strong>
                        <?php esc_html_e( ' seed topics published', 'culture-community' ); ?>
                        <span class="cdt-pct"><?php echo esc_html( $pct ); ?>%</span>
                    </div>
                    <div class="cdt-progress-bar">
                        <div class="cdt-progress-fill" style="width:<?php echo esc_attr( $pct ); ?>%"></div>
                    </div>
                    <?php if ( count( $remaining ) > 0 ) : ?>
                    <p class="description" style="margin-top:6px;">
                        <?php echo esc_html( count( $remaining ) ); ?><?php esc_html_e( ' remaining: ', 'culture-community' ); ?>
                        <span class="cdt-remaining-list"><?php echo esc_html( implode( ', ', array_slice( $remaining, 0, 10 ) ) ); ?><?php echo count( $remaining ) > 10 ? esc_html( ' … +' . ( count( $remaining ) - 10 ) . ' more' ) : ''; ?></span>
                    </p>
                    <?php else : ?>
                    <p class="description" style="margin-top:6px;color:#00a32a;">&#10003; <?php esc_html_e( 'All seed topics have been published!', 'culture-community' ); ?></p>
                    <?php endif; ?>
                </div>

                <table class="form-table cdt-form-table">
                    <tr>
                        <th><?php esc_html_e( 'Batch size', 'culture-community' ); ?></th>
                        <td>
                            <select id="cdt-batch-size">
                                <option value="5">5 entries</option>
                                <option value="10">10 entries</option>
                                <option value="15">15 entries</option>
                                <option value="20">20 entries (max)</option>
                            </select>
                            <p class="description"><?php esc_html_e( 'How many topics to generate in this run. Larger batches take longer (up to 5 min for 20 entries).', 'culture-community' ); ?></p>
                        </td>
                    </tr>
                    <tr>
                        <th><?php esc_html_e( 'Featured images', 'culture-community' ); ?></th>
                        <td>
                            <label>
                                <input type="checkbox" id="cdt-generate-images" checked>
                                <?php esc_html_e( 'Generate an AI image for each new entry', 'culture-community' ); ?>
                            </label>
                            <p class="description"><?php esc_html_e( 'Adds ~10 s per entry. Uncheck to seed text-only entries faster.', 'culture-community' ); ?></p>
                        </td>
                    </tr>
                </table>

                <p>
                    <button id="cdt-run-seeder" class="button button-primary" <?php echo $configured ? '' : 'disabled'; ?>>
                        <?php esc_html_e( 'Run Seeder Now', 'culture-community' ); ?>
                    </button>
                    <span id="cdt-seeder-spinner" class="spinner" style="float:none;vertical-align:middle;display:none;"></span>
                </p>

                <div id="cdt-seeder-result" class="cdt-result" style="display:none;"></div>
            </div>

            <?php /* ── BULK SEED REAL ENTRIES PANEL ── */ ?>
            <div class="cdt-panel">
                <h2><?php esc_html_e( 'Bulk Seed Real Entries', 'culture-community' ); ?></h2>
                <p class="description">
                    <?php esc_html_e( 'One-time import of 1000 real (not AI-generated) directory entries — ~334 film, ~333 music, ~333 book — sourced from TMDB (trending/top-rated/latest), Apple\'s music charts, and Google Books. Click Start, then leave this page open: it keeps calling itself a few seconds apart, one small batch at a time, until the target is reached. You can stop and resume any time — progress is saved after every call.', 'culture-community' ); ?>
                </p>

                <div class="cdt-progress-block">
                    <div class="cdt-progress-label">
                        <strong id="cbsr-total"><?php echo esc_html( $bulk_total ); ?></strong>
                        <?php esc_html_e( ' of 1000 created', 'culture-community' ); ?>
                        <span class="cdt-pct" id="cbsr-pct"><?php echo esc_html( $bulk_pct ); ?>%</span>
                    </div>
                    <div class="cdt-progress-bar">
                        <div class="cdt-progress-fill" id="cbsr-fill" style="width:<?php echo esc_attr( $bulk_pct ); ?>%"></div>
                    </div>
                    <p class="description" style="margin-top:6px;">
                        <?php esc_html_e( 'Film: ', 'culture-community' ); ?><strong id="cbsr-film"><?php echo esc_html( $bulk_film ); ?></strong>/<?php echo esc_html( $bulk_target_each['film'] ); ?>
                        &nbsp;·&nbsp;
                        <?php esc_html_e( 'Music: ', 'culture-community' ); ?><strong id="cbsr-music"><?php echo esc_html( $bulk_music ); ?></strong>/<?php echo esc_html( $bulk_target_each['music'] ); ?>
                        &nbsp;·&nbsp;
                        <?php esc_html_e( 'Book: ', 'culture-community' ); ?><strong id="cbsr-book"><?php echo esc_html( $bulk_book ); ?></strong>/<?php echo esc_html( $bulk_target_each['book'] ); ?>
                    </p>
                </div>

                <p>
                    <button id="cbsr-start" class="button button-primary" <?php echo $configured ? '' : 'disabled'; ?>>
                        <?php esc_html_e( 'Start', 'culture-community' ); ?>
                    </button>
                    <button id="cbsr-stop" class="button" style="display:none;">
                        <?php esc_html_e( 'Stop', 'culture-community' ); ?>
                    </button>
                    <button id="cbsr-reset" class="button" style="margin-left:12px;">
                        <?php esc_html_e( 'Reset Seed State', 'culture-community' ); ?>
                    </button>
                    <button id="cbsr-delete-books" class="button" style="margin-left:12px;color:#d63638;border-color:#d63638;">
                        <?php esc_html_e( 'Delete Imported Books', 'culture-community' ); ?>
                    </button>
                    <span id="cbsr-spinner" class="spinner" style="float:none;vertical-align:middle;display:none;"></span>
                </p>

                <div id="cbsr-status" class="cdt-result" style="display:none;"></div>
                <div id="cbsr-log" style="display:none;max-height:180px;overflow-y:auto;font-family:monospace;font-size:12px;background:#f6f7f7;border:1px solid #dcdcde;border-radius:4px;padding:8px 10px;margin-top:10px;"></div>
            </div>

            <?php /* ── BULK QUOTE IMPORTER PANEL ── */ ?>
            <div class="cdt-panel">
                <h2><?php esc_html_e( 'Bulk Quote Importer', 'culture-community' ); ?></h2>
                <p class="description">
                    <?php esc_html_e( 'Manually import quotes in bulk. Use the text area to paste CSV data, or upload a .csv file.', 'culture-community' ); ?>
                    <br><strong><?php esc_html_e( 'Format:', 'culture-community' ); ?></strong> <code>"Quote Text", "Author", "Source"</code>
                </p>

                <div style="margin-top:15px;">
                    <textarea id="cdt-quote-csv-text" rows="5" style="width:100%;max-width:600px;font-family:monospace;" 
                              placeholder="<?php esc_attr_e( '"Success is not final...", "Winston Churchill", "Speech"' , 'culture-community' ); ?>"></textarea>
                </div>

                <div style="margin-top:10px;">
                    <label for="cdt-quote-csv-file"><strong><?php esc_html_e( 'Or upload CSV file:', 'culture-community' ); ?></strong></label><br>
                    <input type="file" id="cdt-quote-csv-file" accept=".csv" style="margin-top:5px;">
                </div>

                <p style="margin-top:20px;">
                    <button id="cdt-import-quotes-btn" class="button button-primary" <?php echo $configured ? '' : 'disabled'; ?>>
                        <?php esc_html_e( 'Import Quotes', 'culture-community' ); ?>
                    </button>
                    <span id="cdt-import-spinner" class="spinner" style="float:none;vertical-align:middle;display:none;"></span>
                </p>

                <div id="cdt-import-result" class="cdt-result" style="display:none;"></div>
            </div>

            <?php /* ── CUSTOM TOPICS PANEL ── */ ?>
            <div class="cdt-panel">
                <h2><?php esc_html_e( 'Custom Topic Seeds', 'culture-community' ); ?></h2>
                <p class="description">
                    <?php esc_html_e( 'Add your own topics for the AI to generate entries for. One topic per line. These are merged with the built-in seed list — duplicates are ignored.', 'culture-community' ); ?>
                    <?php esc_html_e( 'The AI also auto-appends new suggestions here whenever the seed list runs out.', 'culture-community' ); ?>
                </p>

                <?php if ( ! empty( $extra_topics ) ) : ?>
                <p class="description">
                    <strong><?php echo esc_html( count( $extra_topics ) ); ?></strong>
                    <?php esc_html_e( ' extra topics currently stored:', 'culture-community' ); ?>
                    <span style="color:#646970;">
                        <?php echo esc_html( implode( ', ', array_slice( $extra_topics, 0, 12 ) ) ); ?>
                        <?php echo count( $extra_topics ) > 12 ? esc_html( ' … +' . ( count( $extra_topics ) - 12 ) . ' more' ) : ''; ?>
                    </span>
                </p>
                <?php endif; ?>

                <textarea id="cdt-extra-topics" rows="8" style="width:100%;max-width:600px;font-family:monospace;font-size:13px;"
                          placeholder="<?php esc_attr_e( "Afro Punk\nSapeur culture\nOctavia Butler\nKuramo Beach\nYorubaland", 'culture-community' ); ?>"></textarea>

                <p>
                    <button id="cdt-save-topics" class="button button-primary">
                        <?php esc_html_e( 'Add Topics', 'culture-community' ); ?>
                    </button>
                    <span id="cdt-topics-spinner" class="spinner" style="float:none;vertical-align:middle;display:none;"></span>
                </p>
                <div id="cdt-topics-result" style="display:none;margin-top:8px;"></div>
            </div>

            <?php /* ── IMAGES PANEL ── */ ?>
            <div class="cdt-panel">
                <h2><?php esc_html_e( 'Featured Image Generator', 'culture-community' ); ?></h2>
                <p class="description">
                    <?php esc_html_e( 'Generate Imagen 3 editorial-style featured images for published directory entries that currently have none. Each image takes ~10 seconds.', 'culture-community' ); ?>
                </p>

                <?php if ( empty( $no_image_posts ) ) : ?>
                <p style="color:#00a32a;font-weight:600;">&#10003; <?php esc_html_e( 'All published entries already have a featured image.', 'culture-community' ); ?></p>
                <?php else : ?>
                <p>
                    <strong><?php echo esc_html( count( $no_image_posts ) ); ?></strong>
                    <?php esc_html_e( ' entries without a featured image:', 'culture-community' ); ?>
                </p>

                <table class="widefat striped cdt-img-table">
                    <thead>
                        <tr>
                            <th><?php esc_html_e( 'Title', 'culture-community' ); ?></th>
                            <th><?php esc_html_e( 'Type', 'culture-community' ); ?></th>
                            <th><?php esc_html_e( 'Action', 'culture-community' ); ?></th>
                            <th><?php esc_html_e( 'Status', 'culture-community' ); ?></th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ( $no_image_posts as $post ) :
                            $type_terms = wp_get_post_terms( $post->ID, 'culture_dir_type' );
                            $type_label = ( ! is_wp_error( $type_terms ) && ! empty( $type_terms ) ) ? $type_terms[0]->name : '—';
                        ?>
                        <tr id="cdt-img-row-<?php echo esc_attr( $post->ID ); ?>">
                            <td>
                                <a href="<?php echo esc_url( get_edit_post_link( $post->ID ) ); ?>" target="_blank">
                                    <?php echo esc_html( $post->post_title ); ?>
                                </a>
                            </td>
                            <td><?php echo esc_html( $type_label ); ?></td>
                            <td>
                                <button class="button cdt-gen-img-btn"
                                        data-post-id="<?php echo esc_attr( $post->ID ); ?>"
                                        data-nonce="<?php echo esc_attr( $nonce ); ?>"
                                        <?php echo $configured ? '' : 'disabled'; ?>>
                                    <?php esc_html_e( 'Generate Image', 'culture-community' ); ?>
                                </button>
                            </td>
                            <td class="cdt-img-status" id="cdt-img-status-<?php echo esc_attr( $post->ID ); ?>">—</td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>

                <p style="margin-top:16px;">
                    <button id="cdt-gen-all-btn" class="button button-primary" <?php echo $configured ? '' : 'disabled'; ?>>
                        <?php esc_html_e( 'Generate All Images', 'culture-community' ); ?>
                    </button>
                    <span class="description" style="margin-left:10px;"><?php esc_html_e( '(runs sequentially — do not close this tab)', 'culture-community' ); ?></span>
                </p>
                <?php endif; ?>
            </div>
        </div>

        <!-- ── Backfill Image Visual Metadata ── -->
        <div class="cdt-panel">
            <h2><?php esc_html_e( 'Backfill Image Visual Metadata', 'culture-community' ); ?></h2>
            <p>
                <?php esc_html_e( 'Updates the title, description, caption, and alt text of every existing directory featured image so the Visuals library is searchable by visual keywords (illustration style, palette, composition) rather than the entry topic name.', 'culture-community' ); ?>
            </p>
            <?php
            $backfill_q = new WP_Query( array(
                'post_type'      => 'culture_directory',
                'post_status'    => 'publish',
                'posts_per_page' => 1,
                'fields'         => 'ids',
                'no_found_rows'  => false,
                'meta_query'     => array( array( 'key' => '_thumbnail_id', 'compare' => 'EXISTS' ) ),
            ) );
            $backfill_total = $backfill_q->found_posts;
            ?>
            <p>
                <strong><?php echo esc_html( $backfill_total ); ?></strong>
                <?php esc_html_e( ' directory entries with featured images found.', 'culture-community' ); ?>
            </p>
            <div class="cdt-progress-block" id="cdt-backfill-progress" style="display:none;">
                <div class="cdt-progress-label">
                    <?php esc_html_e( 'Progress:', 'culture-community' ); ?>
                    <span id="cdt-backfill-pct" class="cdt-pct">0%</span>
                </div>
                <div class="cdt-progress-bar"><div class="cdt-progress-fill" id="cdt-backfill-fill" style="width:0%"></div></div>
                <p class="cdt-remaining-list" id="cdt-backfill-status"></p>
            </div>
            <button id="cdt-backfill-btn" class="button button-primary" <?php echo $backfill_total ? '' : 'disabled'; ?>>
                <?php esc_html_e( 'Backfill Visual Metadata', 'culture-community' ); ?>
            </button>
            <span class="spinner" id="cdt-backfill-spinner" style="float:none;vertical-align:middle;margin-left:4px;"></span>
            <div id="cdt-backfill-result" class="cdt-result" style="display:none;"></div>
        </div>

        <?php /* ── WIKIPEDIA BACKFILL PANEL ── */ ?>
        <?php
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
        ?>
        <div class="cdt-panel">
            <h2><?php esc_html_e( 'Wikipedia Backfill', 'culture-community' ); ?></h2>
            <p class="description">
                <?php esc_html_e( 'Enrich all published directory entries that have not yet been matched to a Wikipedia article. For each entry the tool finds the best Wikipedia match, fills in the full description if the existing content is thin (< 120 characters), and sets the cover image if none exists. Entries already processed are skipped automatically.', 'culture-community' ); ?>
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

            <label style="display:block;margin-bottom:12px;">
                <input type="checkbox" id="cdwb-overwrite">
                <?php esc_html_e( 'Overwrite existing content and cover on all entries (AI-generated covers are always replaced even without this)', 'culture-community' ); ?>
            </label>

            <button id="cdwb-start-btn" class="button button-primary" <?php echo $backfill_pending < 1 ? 'disabled' : ''; ?>>
                <?php esc_html_e( 'Start backfill →', 'culture-community' ); ?>
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
                <?php esc_html_e( 'Seed directory entries from Wikipedia categories or a manual title list. Each entry is created as a draft (pending review) with the Wikipedia intro as its content and the Wikipedia thumbnail as its cover.', 'culture-community' ); ?>
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

        <script>
        (function($) {
            var ajaxUrl = '<?php echo esc_js( admin_url( 'admin-ajax.php' ) ); ?>';
            var nonce   = '<?php echo esc_js( $nonce ); ?>';

            /* ── Seeder ── */
            $('#cdt-run-seeder').on('click', function() {
                var $btn = $(this);
                var $spinner = $('#cdt-seeder-spinner');
                var $result  = $('#cdt-seeder-result');

                $btn.prop('disabled', true);
                $spinner.show();
                $result.hide().html('');

                $.post(ajaxUrl, {
                    action:          'culture_dir_run_seeder',
                    nonce:           nonce,
                    batch_size:      $('#cdt-batch-size').val(),
                    generate_images: $('#cdt-generate-images').is(':checked') ? '1' : '',
                })
                .done(function(res) {
                    if (res.success) {
                        var d = res.data;
                        var html = '<div class="notice notice-success inline"><p><strong>' +
                            d.created + ' new entr' + (d.created === 1 ? 'y' : 'ies') + ' created.</strong>' +
                            ' Remaining in seed list: ' + d.remaining + '.</p></div>';

                        if (d.results && d.results.length) {
                            html += '<ul style="margin-top:8px;">';
                            d.results.forEach(function(r) {
                                var errSpan = r.error ? ' <span style="color:#d63638;font-size:11px;">(' + $('<span>').text(r.error).html() + ')</span>' : '';
                                html += '<li>' + (r.success ? '&#10003;' : '&#10007;') + ' ' + $('<span>').text(r.title).html() + errSpan + '</li>';
                            });
                            html += '</ul>';
                        }
                        $result.html(html).show();
                        // Reload page after 3 s so progress bar updates
                        setTimeout(function() { location.reload(); }, 3000);
                    } else {
                        $result.html('<div class="notice notice-error inline"><p>' + $('<span>').text(res.data.message).html() + '</p></div>').show();
                    }
                })
                .fail(function() {
                    $result.html('<div class="notice notice-error inline"><p>Request failed. The batch may have timed out — check the directory for new entries before retrying.</p></div>').show();
                })
                .always(function() {
                    $btn.prop('disabled', false);
                    $spinner.hide();
                });
            });

            /* ── Bulk seed real entries ── */
            var cbsrRunning = false;

            function cbsrLog(text, isError) {
                var $log = $('#cbsr-log').show();
                var color = isError ? '#d63638' : '#3c434a';
                $log.append('<div style="color:' + color + ';">' + $('<span>').text(text).html() + '</div>');
                $log.scrollTop($log[0].scrollHeight);
            }

            function cbsrUpdateProgress(progress) {
                var total = progress.total || 0;
                var pct = Math.round((total / 1000) * 100);
                $('#cbsr-total').text(total);
                $('#cbsr-pct').text(pct + '%');
                $('#cbsr-fill').css('width', pct + '%');
                $('#cbsr-film').text(progress.film || 0);
                $('#cbsr-music').text(progress.music || 0);
                $('#cbsr-book').text(progress.book || 0);
            }

            function cbsrTick() {
                if (!cbsrRunning) { return; }

                $.post(ajaxUrl, {
                    action: 'culture_dir_run_bulk_seed_real',
                    nonce:  nonce,
                })
                .done(function(res) {
                    if (!cbsrRunning) { return; }

                    if (!res.success) {
                        cbsrLog('Error: ' + (res.data && res.data.message ? res.data.message : 'unknown error'), true);
                        cbsrStop();
                        return;
                    }

                    var d = res.data;
                    cbsrUpdateProgress(d.progress);
                    cbsrLog((d.category || '?') + ': +' + d.createdThisCall + ' new' + (d.note ? ' (' + d.note + ')' : ''));

                    if (d.done) {
                        cbsrLog('Done — target reached or sources exhausted.');
                        cbsrStop();
                        return;
                    }

                    setTimeout(cbsrTick, 1500);
                })
                .fail(function() {
                    cbsrLog('Request failed — retrying in 5s.', true);
                    setTimeout(cbsrTick, 5000);
                });
            }

            function cbsrStop() {
                cbsrRunning = false;
                $('#cbsr-start').show().prop('disabled', false);
                $('#cbsr-stop').hide();
                $('#cbsr-spinner').hide();
            }

            $('#cbsr-start').on('click', function() {
                cbsrRunning = true;
                $('#cbsr-status').hide();
                $(this).hide();
                $('#cbsr-stop').show();
                $('#cbsr-spinner').show();
                cbsrLog('Starting…');
                cbsrTick();
            });

            $('#cbsr-stop').on('click', function() {
                cbsrLog('Stopped by user. Click Start again any time to resume.');
                cbsrStop();
            });

            $('#cbsr-reset').on('click', function() {
                if (!confirm('Reset seed state? This clears the progress counters so the seeder starts fresh. It does NOT delete any directory entries that were already imported.')) return;
                var $btn = $(this);
                $btn.prop('disabled', true).text('Resetting…');
                $.post(ajaxUrl, { action: 'culture_dir_reset_bulk_seed_state', nonce: nonce })
                .done(function(res) {
                    if (res.success) {
                        $('#cbsr-total').text('0');
                        $('#cbsr-film').text('0');
                        $('#cbsr-music').text('0');
                        $('#cbsr-book').text('0');
                        $('#cbsr-pct').text('0%');
                        $('#cbsr-fill').css('width', '0%');
                        $('#cbsr-status').show().html('<span style="color:#00a32a;">&#10003; Seed state reset. You can now Start a fresh import.</span>');
                    } else {
                        $('#cbsr-status').show().html('<span style="color:#d63638;">Reset failed: ' + $('<span>').text((res.data && res.data.message) || 'Unknown error').html() + '</span>');
                    }
                })
                .fail(function() { $('#cbsr-status').show().html('<span style="color:#d63638;">Request failed.</span>'); })
                .always(function() { $btn.prop('disabled', false).text('Reset Seed State'); });
            });

            $('#cbsr-delete-books').on('click', function() {
                if (!confirm('Delete ALL books imported by the real-data seeder (google_books source)? This is permanent and cannot be undone. AI-generated and manually added entries are NOT affected.')) return;
                var $btn = $(this);
                $btn.prop('disabled', true).text('Deleting…');
                $.post(ajaxUrl, { action: 'culture_dir_delete_imported_books', nonce: nonce })
                .done(function(res) {
                    if (res.success) {
                        $('#cbsr-book').text('0');
                        $('#cbsr-status').show().html('<span style="color:#00a32a;">&#10003; ' + $('<span>').text(res.data.message).html() + '</span>');
                    } else {
                        $('#cbsr-status').show().html('<span style="color:#d63638;">Delete failed: ' + $('<span>').text((res.data && res.data.message) || 'Unknown error').html() + '</span>');
                    }
                })
                .fail(function() { $('#cbsr-status').show().html('<span style="color:#d63638;">Request failed.</span>'); })
                .always(function() { $btn.prop('disabled', false).text('Delete Imported Books'); });
            });

            /* ── Single image generate ── */
            function generateImage(postId, $btn, $status) {
                $btn.prop('disabled', true).text('Generating…');
                $status.html('<span style="color:#888;">Working…</span>');

                return $.post(ajaxUrl, {
                    action:   'culture_dir_generate_image',
                    nonce:    nonce,
                    post_id:  postId,
                })
                .done(function(res) {
                    if (res.success) {
                        $status.html('<span style="color:#00a32a;">&#10003; Done</span>');
                        $btn.closest('tr').css('opacity', '0.5');
                    } else {
                        $status.html('<span style="color:#d63638;">&#10007; ' + $('<span>').text(res.data.message).html() + '</span>');
                        $btn.prop('disabled', false).text('Retry');
                    }
                })
                .fail(function() {
                    $status.html('<span style="color:#d63638;">&#10007; Request failed</span>');
                    $btn.prop('disabled', false).text('Retry');
                });
            }

            $('.cdt-gen-img-btn').on('click', function() {
                var postId  = $(this).data('post-id');
                var $btn    = $(this);
                var $status = $('#cdt-img-status-' + postId);
                generateImage(postId, $btn, $status);
            });

            /* ── Generate all (sequential) ── */
            $('#cdt-gen-all-btn').on('click', function() {
                var $allBtn = $(this).prop('disabled', true).text('Running…');
                var $rows   = $('.cdt-gen-img-btn:not(:disabled)');
                var index   = 0;

                function next() {
                    if (index >= $rows.length) {
                        $allBtn.text('All done — reload to confirm');
                        return;
                    }
                    var $btn    = $($rows[index]);
                    var postId  = $btn.data('post-id');
                    var $status = $('#cdt-img-status-' + postId);
                    index++;
                    generateImage(postId, $btn, $status).always(function() {
                        setTimeout(next, 1000); // brief pause between calls
                    });
                }
                next();
            });

            /* ── Custom topics save ── */
            $('#cdt-save-topics').on('click', function() {
                var topics = $('#cdt-extra-topics').val().trim();
                if (!topics) return;

                var $btn     = $(this).prop('disabled', true);
                var $spinner = $('#cdt-topics-spinner').show();
                var $result  = $('#cdt-topics-result').hide();

                $.post(ajaxUrl, {
                    action: 'culture_dir_save_extra_topics',
                    nonce:  nonce,
                    topics: topics,
                })
                .done(function(res) {
                    if (res.success) {
                        $result.html(
                            '<div class="notice notice-success inline"><p>' +
                            res.data.added + ' topic(s) added. ' +
                            res.data.total + ' total extra topics stored.</p></div>'
                        ).show();
                        $('#cdt-extra-topics').val('');
                        setTimeout(function() { location.reload(); }, 2000);
                    } else {
                        $result.html(
                            '<div class="notice notice-error inline"><p>' +
                            $('<span>').text(res.data.message).html() + '</p></div>'
                        ).show();
                    }
                })
                .fail(function() {
                    $result.html('<div class="notice notice-error inline"><p>Request failed.</p></div>').show();
                })
                .always(function() {
                    $btn.prop('disabled', false);
                    $spinner.hide();
                });
            });

            /* ── Bulk Quote Import ── */
            $('#cdt-import-quotes-btn').on('click', function() {
                var $btn     = $(this);
                var $spinner = $('#cdt-import-spinner');
                var $result  = $('#cdt-import-result');
                var csvText  = $('#cdt-quote-csv-text').val().trim();
                var fileInput = $('#cdt-quote-csv-file')[0];

                if (!csvText && (!fileInput.files || !fileInput.files.length)) {
                    alert('Please provide CSV text or select a file.');
                    return;
                }

                $btn.prop('disabled', true);
                $spinner.show();
                $result.hide().html('');

                var formData = new FormData();
                formData.append('action', 'culture_import_quotes');
                formData.append('nonce', nonce);
                if (csvText) formData.append('csv_text', csvText);
                if (fileInput.files.length) formData.append('csv_file', fileInput.files[0]);

                $.ajax({
                    url:         ajaxUrl,
                    type:        'POST',
                    data:        formData,
                    processData: false,
                    contentType: false,
                    success: function(res) {
                        if (res.success) {
                            var d = res.data;
                            var html = '<div class="notice notice-success inline"><p><strong>' +
                                d.created + ' quote(s) imported.</strong> ' + d.skipped + ' skipped.</p></div>';
                            
                            if (d.results && d.results.length) {
                                html += '<ul style="margin-top:8px;max-height:200px;overflow-y:auto;border:1px solid #f0f0f1;padding:10px;background:#f6f7f7;">';
                                d.results.forEach(function(r) {
                                    var errSpan = r.error ? ' <span style="color:#d63638;font-size:11px;">(' + $('<span>').text(r.error).html() + ')</span>' : '';
                                    html += '<li>' + (r.success ? '&#10003;' : '&#10007;') + ' ' + $('<span>').text(r.title).html() + errSpan + '</li>';
                                });
                                html += '</ul>';
                            }
                            $result.html(html).show();
                            $('#cdt-quote-csv-text').val('');
                            $('#cdt-quote-csv-file').val('');
                        } else {
                            $result.html('<div class="notice notice-error inline"><p>' + $('<span>').text(res.data.message).html() + '</p></div>').show();
                        }
                    },
                    error: function() {
                        $result.html('<div class="notice notice-error inline"><p>Request failed.</p></div>').show();
                    },
                    complete: function() {
                        $btn.prop('disabled', false);
                        $spinner.hide();
                    }
                });
            });

            /* ── Backfill Image Visual Metadata ── */
            (function() {
                var $btn      = $('#cdt-backfill-btn');
                var $spinner  = $('#cdt-backfill-spinner');
                var $progress = $('#cdt-backfill-progress');
                var $fill     = $('#cdt-backfill-fill');
                var $pct      = $('#cdt-backfill-pct');
                var $status   = $('#cdt-backfill-status');
                var $result   = $('#cdt-backfill-result');
                var allResults = [];

                function runBatch(batch, total) {
                    $.post(ajaxUrl, {
                        action: 'culture_dir_backfill_image_meta',
                        nonce:  nonce,
                        batch:  batch,
                    })
                    .done(function(res) {
                        if (!res.success) {
                            $result.html('<div class="notice notice-error inline"><p>' + $('<span>').text(res.data.message || 'Error').html() + '</p></div>').show();
                            $btn.prop('disabled', false);
                            $spinner.hide();
                            return;
                        }
                        var d = res.data;
                        allResults = allResults.concat(d.results || []);
                        var pct = d.total > 0 ? Math.round((d.processed / d.total) * 100) : 100;
                        $fill.css('width', pct + '%');
                        $pct.text(pct + '%');
                        $status.text(d.processed + ' of ' + d.total + ' processed — ' + d.updated + ' updated this batch.');

                        if (d.done) {
                            var html = '<div class="notice notice-success inline"><p><strong>' + d.total + ' image(s) backfilled.</strong></p></div>';
                            html += '<ul style="margin-top:8px;max-height:200px;overflow-y:auto;border:1px solid #f0f0f1;padding:10px;background:#f6f7f7;">';
                            allResults.forEach(function(r) {
                                html += '<li>&#10003; <strong>' + $('<span>').text(r.post).html() + '</strong> (' + $('<span>').text(r.type).html() + ') &rarr; ' + $('<span>').text(r.title).html() + '</li>';
                            });
                            html += '</ul>';
                            $result.html(html).show();
                            $btn.prop('disabled', true).text('Done');
                            $spinner.hide();
                        } else {
                            runBatch(batch + 1, d.total);
                        }
                    })
                    .fail(function() {
                        $result.html('<div class="notice notice-error inline"><p>Request failed.</p></div>').show();
                        $btn.prop('disabled', false);
                        $spinner.hide();
                    });
                }

                $btn.on('click', function() {
                    $btn.prop('disabled', true);
                    $spinner.show();
                    $progress.show();
                    $result.hide().html('');
                    allResults = [];
                    runBatch(0, <?php echo (int) $backfill_total; ?>);
                });
            }());

            /* ── Wikipedia Backfill ── */
            (function() {
                var running = false;
                var currentBatch = 0;
                var totalProcessed = 0;
                var totalUpdated = 0;

                function log(text, isError) {
                    var $log = $('#cdwb-log').show();
                    var color = isError ? '#d63638' : '#3c434a';
                    $log.append('<div style="color:' + color + ';">' + $('<span>').text(text).html() + '</div>');
                    $log.scrollTop($log[0].scrollHeight);
                }

                function tick() {
                    if (!running) return;

                    $.post(ajaxUrl, {
                        action:    'culture_dir_wiki_backfill',
                        nonce:     nonce,
                        batch:     currentBatch,
                        overwrite: $('#cdwb-overwrite').is(':checked') ? '1' : '',
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

                        // Log each result
                        (d.results || []).forEach(function(r) {
                            var suffix = r.found
                                ? (r.changes && r.changes.length ? ' → updated: ' + r.changes.join(', ') : ' → no changes needed')
                                : ' → not found on Wikipedia';
                            log((r.found ? '✓' : '–') + ' ' + r.title + suffix);
                        });

                        log('Batch ' + (currentBatch) + ': ' + d.processed + ' processed, ' + d.updated + ' updated. ' + (d.total - (currentBatch * 5)) + ' remaining.');

                        if (d.done) {
                            log('Done — ' + totalProcessed + ' entries processed, ' + totalUpdated + ' updated.', false);
                            stop();
                            setTimeout(function() { location.reload(); }, 2000);
                            return;
                        }

                        setTimeout(tick, 400); // small delay between batches
                    })
                    .fail(function() {
                        log('Request failed — stopping.', true);
                        stop();
                    });
                }

                function stop() {
                    running = false;
                    $('#cdwb-start-btn').prop('disabled', false).show();
                    $('#cdwb-stop-btn').hide();
                    $('#cdwb-spinner').hide();
                }

                $('#cdwb-start-btn').on('click', function() {
                    running = true;
                    currentBatch = 0;
                    totalProcessed = 0;
                    totalUpdated = 0;
                    $(this).prop('disabled', true);
                    $('#cdwb-stop-btn').show();
                    $('#cdwb-spinner').show();
                    $('#cdwb-log').empty().show();
                    tick();
                });

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
                        var id = 'cdw-t-' + Math.random().toString(36).slice(2);
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

    // ── Backfill image visual metadata ───────────────────────────────────────

    /**
     * Classify an entry-type slug into one of three illustration templates,
     * mirroring classifyTemplateType() in lib/gemini.ts.
     */
    private static function classify_template_type( $entry_type ) {
        $t = strtolower( trim( preg_replace( '/[-_\s]+/', ' ', $entry_type ) ) );

        if ( preg_match( '/\b(person|people|figure|artist|musician|singer|rapper|writer|author|poet|novelist|activist|filmmaker|director|actor|actress|politician|philosopher|leader|thinker|sculptor|painter|photographer|dancer|athlete|architect|designer|chef|scholar|academic|intellectual|icon|legend|pioneer)\b/', $t ) ) {
            return 'portrait';
        }
        if ( preg_match( '/\b(film|documentary|movie|cinema|short film)\b/', $t ) ) {
            return 'scene';
        }
        if ( preg_match( '/\b(food|dish|cuisine|drink|beverage|meal|snack|recipe|ingredient|fashion|clothing|garment|textile|fabric|cloth|print|pattern|weave|embroidery|craft|jewellery|jewelry|accessory|artefact|artifact|instrument|tool|object|product|sculpture|painting|installation|novel|book|album|song|artwork|piece|collection|ceramic|pottery|bead|wax print|kente|gele|headwrap|adire)\b/', $t ) ) {
            return 'object';
        }
        return 'scene';
    }

    /**
     * Build descriptive visual metadata for an attachment, mirroring
     * buildImageMetadata() in lib/gemini.ts.
     */
    private static function build_image_metadata( $entry_type ) {
        $template   = self::classify_template_type( $entry_type );
        $type_label = strtolower( $entry_type );
        $palette    = 'Restricted palette: deep ink, burnt ochre, gold brass, cream paper, moss green, indigo. Matte finish, generous negative space, no photorealism.';

        if ( 'portrait' === $template ) {
            return array(
                'title'       => "Flat geometric portrait illustration — {$type_label}",
                'alt'         => 'Flat geometric editorial portrait. Simplified face as an architectural form with sharp shadow shapes. Geometric clothing in flat colour masses. Ochre, ink and gold editorial palette.',
                'description' => "Flat geometric editorial portrait illustration in The Moveee's signature visual style. Face rendered as a simplified architectural form — 2–3 iconic lines for eyes and mouth. Sharp geometric shadow shapes define volume. Stylised hair as a single dark geometric mass. Geometric clothing depicted as flat colour blocks. {$palette}",
            );
        }

        if ( 'object' === $template ) {
            return array(
                'title'       => "Flat geometric {$type_label} illustration — editorial icon style",
                'alt'         => "Flat geometric editorial illustration of a {$type_label} as a clean geometric icon. Crosshatch and stipple textures. Ochre, ink and gold editorial palette.",
                'description' => "Flat graphic editorial illustration of a {$type_label} in The Moveee's signature visual style. Subject rendered as a clean geometric icon with sharp high-contrast shadow shapes suggesting volume. Crosshatching or stippling texture for surface detail. Dramatic side or bird's-eye lighting. {$palette}",
            );
        }

        return array(
            'title'       => "Abstract geometric scene illustration — {$type_label}, editorial wide format",
            'alt'         => 'Wide abstract geometric editorial scene with minimal silhouette figures. Large colour blocks and sharp diagonal shapes in ochre, ink and gold palette.',
            'description' => "Abstract geometric scene illustration in The Moveee's signature editorial style. Wide format composition featuring minimal human silhouettes in the middle ground. Environment built from large colour blocks and sharp geometric shapes — circles, triangles, diagonal lines. Dramatic lighting via sharp shadow planes. Fine stippling and ink-bleed effects for depth. {$palette}",
        );
    }

    public static function ajax_backfill_image_meta() {
        check_ajax_referer( 'culture_dir_tools', 'nonce' );
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_send_json_error( array( 'message' => 'Forbidden.' ) );
        }

        $batch      = max( 0, (int) ( $_POST['batch'] ?? 0 ) );
        $batch_size = 20;

        $all_ids = get_posts( array(
            'post_type'      => 'culture_directory',
            'posts_per_page' => -1,
            'meta_query'     => array( array( 'key' => '_thumbnail_id', 'compare' => 'EXISTS' ) ),
            'fields'         => 'ids',
        ) );
        $total = count( $all_ids );

        $batch_ids = array_slice( $all_ids, $batch * $batch_size, $batch_size );

        $updated = 0;
        $results = array();

        foreach ( $batch_ids as $post_id ) {
            $attachment_id = (int) get_post_thumbnail_id( $post_id );
            if ( ! $attachment_id ) {
                continue;
            }

            $type_terms = wp_get_post_terms( $post_id, 'culture_dir_type', array( 'fields' => 'slugs' ) );
            $entry_type = ( ! is_wp_error( $type_terms ) && ! empty( $type_terms ) ) ? $type_terms[0] : 'concept';

            $meta = self::build_image_metadata( $entry_type );

            wp_update_post( array(
                'ID'           => $attachment_id,
                'post_title'   => $meta['title'],
                'post_content' => $meta['description'],
                'post_excerpt' => $meta['alt'],
            ) );
            update_post_meta( $attachment_id, '_wp_attachment_image_alt', $meta['alt'] );

            $results[] = array(
                'post'  => get_the_title( $post_id ),
                'type'  => $entry_type,
                'title' => $meta['title'],
            );
            $updated++;
        }

        $processed = ( $batch * $batch_size ) + count( $batch_ids );
        $done      = $processed >= $total || empty( $batch_ids );

        wp_send_json_success( array(
            'updated'   => $updated,
            'total'     => $total,
            'processed' => $processed,
            'done'      => $done,
            'results'   => $results,
        ) );
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
        .cdt-img-table { margin-top: 12px; }
        .cdt-img-table th,
        .cdt-img-table td { vertical-align: middle; }
        ';
    }

    /**
     * Normalise smart quotes, curly apostrophes, and padding in a CSV line.
     */
    private static function normalize_csv_line( $line ) {
        // Replace smart/curly quotes and apostrophes.
        $search  = array( '“', '”', '«', '»', '‘', '’', '–', '—' );
        $replace = array( '"', '"', '"', '"', "'", "'", '-', '-' );
        $line    = str_replace( $search, $replace, $line );

        // Remove spaces specifically after commas that are followed by quotes.
        // This fixes the ", "Author"" problem that breaks many CSV parsers.
        $line = preg_replace( '/,\s+"/', ',"', $line );
        
        return trim( $line );
    }
}
