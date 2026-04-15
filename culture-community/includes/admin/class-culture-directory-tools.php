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
        add_action( 'wp_ajax_culture_dir_run_seeder',         array( __CLASS__, 'ajax_run_seeder' ) );
        add_action( 'wp_ajax_culture_run_quote_seeder',      array( __CLASS__, 'ajax_run_quote_seeder' ) );
        add_action( 'wp_ajax_culture_import_quotes',         array( __CLASS__, 'ajax_import_quotes' ) );
        add_action( 'wp_ajax_culture_dir_generate_image',     array( __CLASS__, 'ajax_generate_image' ) );
        add_action( 'wp_ajax_culture_dir_save_extra_topics', array( __CLASS__, 'ajax_save_extra_topics' ) );
        add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_assets' ) );
    }

    public static function register_menu() {
        add_submenu_page(
            'culture-community',
            __( 'Directory Tools', 'culture-community' ),
            __( 'Directory Tools', 'culture-community' ),
            'manage_options',
            'culture-directory-tools',
            array( __CLASS__, 'render_page' )
        );
    }

    public static function enqueue_assets( $hook ) {
        if ( 'culture-community_page_culture-directory-tools' !== $hook ) {
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
            'post_type'      => 'culture_directory',
            'post_status'    => 'publish',
            'posts_per_page' => -1,
            'fields'         => 'all',
        ) );
        return array_map( function ( $p ) {
            return strtolower( trim( $p->post_title ) );
        }, $posts );
    }

    /** Returns published culture_directory posts that have no featured image. */
    private static function get_posts_without_images() {
        return get_posts( array(
            'post_type'      => 'culture_directory',
            'post_status'    => 'publish',
            'posts_per_page' => -1,
            'meta_query'     => array(
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

    // ── AJAX: run quote seeder ────────────────────────────────────────────────

    public static function ajax_run_quote_seeder() {
        check_ajax_referer( 'culture_dir_tools', 'nonce' );
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_send_json_error( array( 'message' => 'Forbidden.' ) );
        }

        if ( ! self::is_configured() ) {
            wp_send_json_error( array( 'message' => 'Frontend URL or Cron Secret not configured.' ) );
        }

        $response = wp_remote_post(
            self::get_frontend_url() . '/api/quotes/auto-populate',
            array(
                'headers' => array(
                    'Authorization' => 'Bearer ' . self::get_cron_secret(),
                    'Content-Type'  => 'application/json',
                ),
                'body'    => wp_json_encode( array() ),
                'timeout' => 120,
            )
        );

        if ( is_wp_error( $response ) ) {
            wp_send_json_error( array( 'message' => $response->get_error_message() ) );
        }

        $code = wp_remote_retrieve_response_code( $response );
        $body = json_decode( wp_remote_retrieve_body( $response ), true );

        if ( $code !== 200 ) {
            wp_send_json_error( array( 'message' => $body['error'] ?? "HTTP $code from quote seeder." ) );
        }

        wp_send_json_success( $body );
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

        // Normalise line endings and parse.
        $lines   = explode( "\n", str_replace( "\r", "", $raw_data ) );
        $created = 0;
        $skipped = 0;
        $results = array();

        foreach ( $lines as $line ) {
            $line = trim( $line );
            if ( empty( $line ) ) {
                continue;
            }

            // Simple CSV parser for "text", "author", "source"
            $data = str_getcsv( $line );
            if ( count( $data ) < 2 ) {
                $results[] = array( 'title' => substr( $line, 0, 30 ) . '...', 'success' => false, 'error' => 'Invalid format.' );
                $skipped++;
                continue;
            }

            $text   = trim( $data[0] );
            $author = trim( $data[1] );
            $source = trim( $data[2] ?? '' );

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
                    <?php esc_html_e( 'Automatically generate and publish notable African & diaspora culture entries using Gemini AI. Each batch picks a random selection of topics not yet in the directory.', 'culture-community' ); ?>
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

            <?php /* ── QUOTE SEEDER PANEL ── */ ?>
            <div class="cdt-panel">
                <h2><?php esc_html_e( 'Quote Seeder', 'culture-community' ); ?></h2>
                <p class="description">
                    <?php esc_html_e( 'Populate the Moveee Quote Database with a curated selection of 10 high-impact quotes from James Baldwin, Chimamanda Ngozi Adichie, Toni Morrison, and more.', 'culture-community' ); ?>
                </p>

                <p>
                    <button id="cdt-run-quote-seeder" class="button button-primary" <?php echo $configured ? '' : 'disabled'; ?>>
                        <?php esc_html_e( 'Seed Moveee Quotes', 'culture-community' ); ?>
                    </button>
                    <span id="cdt-quote-spinner" class="spinner" style="float:none;vertical-align:middle;display:none;"></span>
                </p>

                <div id="cdt-quote-result" class="cdt-result" style="display:none;"></div>
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

            /* ── Quote Seeder ── */
            $('#cdt-run-quote-seeder').on('click', function() {
                var $btn = $(this);
                var $spinner = $('#cdt-quote-spinner');
                var $result  = $('#cdt-quote-result');

                $btn.prop('disabled', true);
                $spinner.show();
                $result.hide().html('');

                $.post(ajaxUrl, {
                    action: 'culture_run_quote_seeder',
                    nonce:  nonce,
                })
                .done(function(res) {
                    if (res.success) {
                        var d = res.data;
                        var html = '<div class="notice notice-success inline"><p><strong>' +
                            d.created + ' quote(s) created successfully.</strong></p></div>';

                        if (d.results && d.results.length) {
                            html += '<ul style="margin-top:8px;max-height:200px;overflow-y:auto;border:1px solid #f0f0f1;padding:10px;background:#f6f7f7;">';
                            d.results.forEach(function(r) {
                                var errSpan = r.error ? ' <span style="color:#d63638;font-size:11px;">(' + $('<span>').text(r.error).html() + ')</span>' : '';
                                html += '<li>' + (r.success ? '&#10003;' : '&#10007;') + ' ' + $('<span>').text(r.title).html() + errSpan + '</li>';
                            });
                            html += '</ul>';
                        }
                        $result.html(html).show();
                    } else {
                        $result.html('<div class="notice notice-error inline"><p>' + $('<span>').text(res.data.message).html() + '</p></div>').show();
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
        .cdt-img-table { margin-top: 12px; }
        .cdt-img-table th,
        .cdt-img-table td { vertical-align: middle; }
        ';
    }
}
