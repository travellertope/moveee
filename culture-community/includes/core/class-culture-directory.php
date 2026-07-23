<?php
/**
 * Culture Directory – REST endpoint for community entry submissions.
 *
 * Flow:
 *   1. Next.js frontend posts to /culture/v1/directory/submit (with Bearer secret).
 *   2. This handler creates a pending culture_directory post and sets meta/terms.
 *   3. Gamification: 25 XP awarded to the submitter immediately.
 *   4. Admin reviews and publishes the entry via WP admin.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Culture_Directory {

    /**
     * Coarse region buckets for the Discover region filter. There is no
     * dedicated country/region field on culture_directory — only the free-text
     * _entry_city meta — so regions are resolved by substring-matching city
     * keywords. Extend this list as new regions are needed; matching is
     * case-insensitive against _entry_city.
     */
    const REGION_CITY_KEYWORDS = array(
        'nigeria'      => array( 'nigeria', 'lagos', 'abuja', 'ibadan', 'port harcourt', 'kano', 'enugu' ),
        'ghana'        => array( 'ghana', 'accra', 'kumasi' ),
        'uk'           => array( 'uk', 'united kingdom', 'london', 'manchester', 'birmingham', 'bristol' ),
        'usa'          => array( 'usa', 'united states', 'new york', 'los angeles', 'atlanta', 'chicago', 'houston' ),
        'pan-african'  => array( 'africa', 'pan-african', 'senegal', 'dakar', 'kenya', 'nairobi', 'south africa', 'johannesburg', 'cape town' ),
    );

    /**
     * Verify the shared bearer secret sent from the Next.js backend.
     *
     * The secret is stored in the WP option `culture_api_secret` and must match
     * the CULTURE_API_SECRET environment variable on the Next.js side.
     */
    public static function verify_secret( WP_REST_Request $request ) {
        $secret = get_option( 'culture_api_secret', '' );

        if ( empty( $secret ) ) {
            return new WP_Error(
                'no_secret',
                __( 'API secret not configured on the server.', 'culture-community' ),
                array( 'status' => 503 )
            );
        }

        $auth = $request->get_header( 'Authorization' );
        if ( ! $auth ) {
            return new WP_Error(
                'unauthorized',
                __( 'Missing Authorization header.', 'culture-community' ),
                array( 'status' => 401 )
            );
        }

        $token = trim( str_replace( 'Bearer', '', $auth ) );
        if ( ! hash_equals( $secret, $token ) ) {
            return new WP_Error(
                'forbidden',
                __( 'Invalid API secret.', 'culture-community' ),
                array( 'status' => 403 )
            );
        }

        return true;
    }

    /**
     * Handle a new directory entry submission from the Next.js frontend.
     */
    public static function handle_submit( WP_REST_Request $request ) {
        $user_id        = $request->get_param( 'user_id' );
        $title          = $request->get_param( 'title' );
        $excerpt        = $request->get_param( 'excerpt' );
        $content        = $request->get_param( 'content' );
        $entry_type     = $request->get_param( 'entry_type' );
        $interests      = (array) $request->get_param( 'interests' );
        $ai_gen         = (bool) $request->get_param( 'ai_generated' );
        $improving_slug = $request->get_param( 'improving_slug' );

        // Validate the submitting user exists.
        if ( $user_id > 0 && ! get_userdata( $user_id ) ) {
            return new WP_Error(
                'invalid_user',
                __( 'Submitting user not found.', 'culture-community' ),
                array( 'status' => 404 )
            );
        }

        // auto_publish flag: set by the auto-populate system job only.
        // Human submissions always go to pending for editorial review.
        $auto_publish = (bool) $request->get_param( 'auto_publish' );
        $post_status  = $auto_publish ? 'publish' : 'pending';

        // Create the post.
        $post_id = wp_insert_post( array(
            'post_title'   => $title,
            'post_excerpt' => $excerpt,
            'post_content' => $content,
            'post_status'  => $post_status,
            'post_type'    => 'culture_directory',
            'post_author'  => $user_id > 0 ? $user_id : 0,
        ), true );

        if ( is_wp_error( $post_id ) ) {
            return new WP_Error(
                'insert_failed',
                $post_id->get_error_message(),
                array( 'status' => 500 )
            );
        }

        // Persist meta.
        update_post_meta( $post_id, '_culture_dir_submitted_by', $user_id );
        update_post_meta( $post_id, '_culture_dir_ai_generated', $ai_gen ? '1' : '0' );

        // When this is an improvement of an existing entry, record the reference.
        if ( ! empty( $improving_slug ) ) {
            update_post_meta( $post_id, '_culture_dir_improves', sanitize_title( $improving_slug ) );
        }

        // Assign entry type term.
        if ( $entry_type && taxonomy_exists( 'culture_dir_type' ) ) {
            wp_set_object_terms( $post_id, $entry_type, 'culture_dir_type' );
        }

        // Assign interest terms (slugs passed from the AI output).
        if ( ! empty( $interests ) && taxonomy_exists( 'culture_interest' ) ) {
            $clean_slugs = array_map( 'sanitize_key', $interests );
            // Only set terms that actually exist to avoid creating orphan terms.
            $valid = array();
            foreach ( $clean_slugs as $slug ) {
                if ( term_exists( $slug, 'culture_interest' ) ) {
                    $valid[] = $slug;
                }
            }
            if ( ! empty( $valid ) ) {
                wp_set_object_terms( $post_id, $valid, 'culture_interest' );
            }
        }

        // Save per-type infobox meta fields.
        $infobox = $request->get_param( 'infobox' );
        if ( ! empty( $infobox ) && is_array( $infobox ) ) {
            $allowed_keys = array(
                // person
                'born', 'died', 'nationality', 'occupation', 'known_for', 'origin_city', 'active_years', 'awards', 'labels', 'education',
                // place
                'country', 'region', 'population', 'official_language', 'currency', 'founded', 'area',
                // movement
                'founders', 'origin_country', 'active_period', 'ideology', 'key_figures', 'related_movements',
                // genre
                'origin_country', 'origin_decade', 'instruments', 'tempo_bpm', 'key_artists', 'related_genres', 'subgenres',
                // concept
                'origin_country', 'key_thinkers', 'period', 'known_for', 'related_concepts',
                // film
                'director', 'year', 'starring', 'cinematographer', 'country', 'language', 'distributor', 'runtime', 'production_company',
                // book
                'author', 'year_published', 'genre', 'publisher', 'language', 'pages', 'isbn',
                // artwork
                'artist', 'year', 'medium', 'dimensions', 'current_location', 'art_collection', 'style',
                // food
                'origin_country', 'food_type', 'main_ingredients', 'also_known_as', 'cultural_context',
                // fashion
                'origin', 'era', 'key_designers', 'materials', 'style', 'cultural_significance',
                // tv-series
                'creator', 'network', 'seasons', 'years', 'starring', 'country', 'language', 'genre',
            );
            foreach ( $allowed_keys as $snake_key ) {
                // Accept both snake_case and camelCase from the JSON body.
                $camel_key = lcfirst( str_replace( '_', '', ucwords( $snake_key, '_' ) ) );
                $value     = $infobox[ $snake_key ] ?? $infobox[ $camel_key ] ?? null;
                if ( isset( $value ) && $value !== '' ) {
                    update_post_meta( $post_id, 'dir_infobox_' . $snake_key, sanitize_text_field( (string) $value ) );
                }
            }
        }

        // Award gamification points to the submitter.
        $points_awarded = 25;
        if ( $user_id > 0 && class_exists( 'Culture_Gamification' ) ) {
            Culture_Gamification::award_points( $user_id, 'directory_submission', $points_awarded );
        }

        $post = get_post( $post_id );
        $slug = $post->post_name ?: sanitize_title( $title );

        return rest_ensure_response( array(
            'success'        => true,
            'post_id'        => $post_id,
            'slug'           => $slug,
            'points_awarded' => $points_awarded,
        ) );
    }

    /**
     * GET /culture/v1/directory/extra-topics
     *
     * Returns the list of manually- or AI-added seed topics stored in the
     * `culture_dir_extra_topics` WP option.
     */
    public static function handle_get_extra_topics( WP_REST_Request $request ) {
        $raw    = get_option( 'culture_dir_extra_topics', '[]' );
        $topics = json_decode( $raw, true );
        if ( ! is_array( $topics ) ) {
            $topics = array();
        }
        return rest_ensure_response( array( 'topics' => array_values( $topics ) ) );
    }

    /**
     * GET /culture/v1/visuals
     *
     * Returns all attachment posts that were created by the directory seeder
     * (identified by _culture_dir_visual = 1). Images survive here even after
     * their parent directory entry is deleted, because WordPress keeps orphaned
     * attachments in the media library.
     */
    public static function handle_get_visuals( WP_REST_Request $request ) {
        $posts = get_posts( array(
            'post_type'      => 'attachment',
            'post_status'    => 'inherit',
            'posts_per_page' => 300,
            'orderby'        => 'date',
            'order'          => 'DESC',
            'meta_query'     => array(
                array(
                    'key'   => '_culture_dir_visual',
                    'value' => '1',
                ),
            ),
        ) );

        $visuals = array();
        foreach ( $posts as $post ) {
            $sizes = wp_get_attachment_image_src( $post->ID, 'full' );
            $visuals[] = array(
                'id'         => $post->ID,
                'entrySlug'  => get_post_meta( $post->ID, '_culture_dir_entry_slug',  true ) ?: '',
                'entryTitle' => get_post_meta( $post->ID, '_culture_dir_entry_title', true ) ?: $post->post_title,
                'entryType'  => get_post_meta( $post->ID, '_culture_dir_entry_type',  true ) ?: 'entry',
                'imageTitle' => $post->post_title,
                'altText'    => get_post_meta( $post->ID, '_wp_attachment_image_alt', true ) ?: '',
                'sourceUrl'  => wp_get_attachment_url( $post->ID ),
                'width'      => $sizes ? (int) $sizes[1] : 0,
                'height'     => $sizes ? (int) $sizes[2] : 0,
            );
        }

        return rest_ensure_response( array(
            'visuals' => $visuals,
            'count'   => count( $visuals ),
        ) );
    }

    /**
     * GET /culture/v1/directory/processed-topics
     *
     * Returns the list of original seed topic strings that have already been
     * submitted to the directory. Used by the seeder to prevent re-seeding a
     * topic even when Gemini generates a different title for the entry.
     */
    public static function handle_get_processed_topics( WP_REST_Request $request ) {
        $raw    = get_option( 'culture_dir_processed_topics', '[]' );
        $topics = json_decode( $raw, true );
        if ( ! is_array( $topics ) ) {
            $topics = array();
        }
        return rest_ensure_response( array( 'topics' => array_values( $topics ) ) );
    }

    /**
     * POST /culture/v1/directory/processed-topics
     *
     * Merges the supplied topic strings into the processed list (no duplicates).
     * Body: { "topics": ["Fela Kuti", "Lagos", …] }
     */
    public static function handle_post_processed_topics( WP_REST_Request $request ) {
        $new_topics = (array) $request->get_param( 'topics' );
        $new_topics = array_filter( array_map( 'sanitize_text_field', $new_topics ) );

        $raw      = get_option( 'culture_dir_processed_topics', '[]' );
        $existing = json_decode( $raw, true );
        if ( ! is_array( $existing ) ) {
            $existing = array();
        }

        $existing_lower = array_map( 'strtolower', $existing );
        foreach ( $new_topics as $topic ) {
            if ( ! in_array( strtolower( $topic ), $existing_lower, true ) ) {
                $existing[]       = $topic;
                $existing_lower[] = strtolower( $topic );
            }
        }

        update_option( 'culture_dir_processed_topics', wp_json_encode( array_values( $existing ) ) );

        return rest_ensure_response( array(
            'success' => true,
            'count'   => count( $existing ),
        ) );
    }

    /**
     * POST /culture/v1/directory/extra-topics
     *
     * Merges the supplied topics array into the stored list (no duplicates).
     * Body: { "topics": ["Topic A", "Topic B", …] }
     */
    public static function handle_post_extra_topics( WP_REST_Request $request ) {
        $new_topics = (array) $request->get_param( 'topics' );
        $new_topics = array_filter( array_map( 'sanitize_text_field', $new_topics ) );

        $raw      = get_option( 'culture_dir_extra_topics', '[]' );
        $existing = json_decode( $raw, true );
        if ( ! is_array( $existing ) ) {
            $existing = array();
        }

        $existing_lower = array_map( 'strtolower', $existing );
        foreach ( $new_topics as $topic ) {
            if ( ! in_array( strtolower( $topic ), $existing_lower, true ) ) {
                $existing[]       = $topic;
                $existing_lower[] = strtolower( $topic );
            }
        }

        update_option( 'culture_dir_extra_topics', wp_json_encode( array_values( $existing ) ) );

        return rest_ensure_response( array(
            'success' => true,
            'count'   => count( $existing ),
            'topics'  => array_values( $existing ),
        ) );
    }

    /**
     * POST /culture/v1/directory/attach-image
     *
     * Accepts a base64-encoded JPEG image, uploads it to the WordPress
     * media library, and sets it as the featured image of the given post.
     *
     * Request body:
     *   post_id      int     Required. The culture_directory post ID.
     *   image_base64 string  Required. Base64-encoded JPEG data.
     *   filename     string  Optional. Suggested filename (default: image.jpg).
     */
    public static function handle_attach_image( WP_REST_Request $request ) {
        $post_id           = (int) $request->get_param( 'post_id' );
        $image_url         = esc_url_raw( $request->get_param( 'image_url' ) ?: '' );
        $image_title       = sanitize_text_field( $request->get_param( 'image_title' ) ?: '' );
        $image_description = sanitize_textarea_field( $request->get_param( 'image_description' ) ?: '' );
        $image_alt         = sanitize_text_field( $request->get_param( 'image_alt' ) ?: '' );

        if ( ! $post_id || ! $image_url ) {
            return new WP_Error(
                'missing_params',
                __( 'post_id and image_url are required.', 'culture-community' ),
                array( 'status' => 400 )
            );
        }

        // Verify the target post exists and is a directory entry.
        $post = get_post( $post_id );
        if ( ! $post || 'culture_directory' !== $post->post_type ) {
            return new WP_Error(
                'invalid_post',
                __( 'Post not found or is not a directory entry.', 'culture-community' ),
                array( 'status' => 404 )
            );
        }

        // Store the R2 URL as post meta — no WordPress media attachment needed.
        update_post_meta( $post_id, '_culture_dir_image_url', $image_url );
        update_post_meta( $post_id, '_culture_dir_image_alt', $image_alt );

        return rest_ensure_response( array(
            'success' => true,
            'url'     => $image_url,
        ) );
    }

    // ── Phase 3: Aggregate recomputation ─────────────────────────────────────

    /**
     * Hooked to save_post_{culture_post} — recomputes rating/review count on
     * the linked directory entry whenever a community post is saved/deleted.
     */
    public static function recompute_aggregates_on_post_save( $post_id, $post ) {
        if ( wp_is_post_revision( $post_id ) || wp_is_post_autosave( $post_id ) ) {
            return;
        }
        $dir_id = (int) get_post_meta( $post_id, '_linked_directory_id', true );
        if ( $dir_id > 0 ) {
            self::recompute_directory_aggregates( $dir_id );
        }
    }

    /**
     * Recompute _community_review_count and _average_rating on a directory entry.
     */
    public static function recompute_directory_aggregates( $dir_id ) {
        global $wpdb;
        $results = $wpdb->get_results( $wpdb->prepare(
            "SELECT pm.meta_value AS rating
             FROM {$wpdb->posts} p
             JOIN {$wpdb->postmeta} pm_link ON pm_link.post_id = p.ID AND pm_link.meta_key = '_linked_directory_id' AND pm_link.meta_value = %d
             LEFT JOIN {$wpdb->postmeta} pm ON pm.post_id = p.ID AND pm.meta_key = '_star_rating'
             WHERE p.post_type = 'culture_post' AND p.post_status = 'publish'",
            $dir_id
        ) );

        $count      = count( $results );
        $rated      = array_filter( $results, fn( $r ) => $r->rating > 0 );
        $avg_rating = count( $rated ) > 0
            ? round( array_sum( array_column( $rated, 'rating' ) ) / count( $rated ), 1 )
            : 0;

        update_post_meta( $dir_id, '_community_review_count', $count );
        update_post_meta( $dir_id, '_average_rating', $avg_rating );
    }

    // ── Phase 3: Lightweight search ──────────────────────────────────────────

    /**
     * GET /culture/v1/directory/search?q=&type=
     *
     * Returns a list of matching directory entries for post-composer autocomplete.
     * Public endpoint — no auth needed.
     */
    /**
     * Reads a single labelled value out of the generic `_about_fields` JSON
     * blob (format: [{label, value}], used by the mobile DirectoryDetailScreen
     * "About" section) — e.g. get_about_field( $id, 'Author' ) for book entries.
     */
    private static function get_about_field( $post_id, $label ) {
        $raw = get_post_meta( $post_id, '_about_fields', true );
        if ( ! $raw ) {
            return '';
        }
        $fields = json_decode( $raw, true );
        if ( ! is_array( $fields ) ) {
            return '';
        }
        foreach ( $fields as $field ) {
            if ( isset( $field['label'], $field['value'] ) && $field['label'] === $label ) {
                return $field['value'];
            }
        }
        return '';
    }

    /**
     * First labelled value in the generic _about_fields blob, regardless of
     * label — an entry only ever has one bio-like field set (Author for
     * books, Artist for music, Director for film, …), so "first" is
     * equivalent to "the one that matters" without the caller needing to
     * know which label a given directory type uses.
     */
    private static function get_first_about_field( $post_id ) {
        $raw = get_post_meta( $post_id, '_about_fields', true );
        if ( ! $raw ) {
            return '';
        }
        $fields = json_decode( $raw, true );
        if ( ! is_array( $fields ) || empty( $fields[0]['value'] ) ) {
            return '';
        }
        return $fields[0]['value'];
    }

    /**
     * A directory entry already linked to this external catalog ID, if any —
     * dedup check for API-assisted quick-create (Google Books/Spotify/TMDB),
     * so multiple reviewers picking "the same" work always share one entry
     * instead of each spawning a duplicate.
     */
    private static function find_by_external_id( $source, $external_id ) {
        $query = new WP_Query( array(
            'post_type'      => 'culture_directory',
            'post_status'    => 'publish',
            'posts_per_page' => 1,
            'meta_query'     => array(
                array( 'key' => '_external_source', 'value' => $source ),
                array( 'key' => '_external_id',     'value' => $external_id ),
            ),
        ) );
        return $query->posts ? $query->posts[0] : null;
    }

    public static function handle_search( WP_REST_Request $request ) {
        $q    = sanitize_text_field( $request->get_param( 'q' ) );
        $type = sanitize_key( $request->get_param( 'type' ) );

        // Search title only — WP's 's' parameter also searches content which
        // returns unrelated entries when there's no exact title match.
        $title_filter = function( $where ) use ( $q ) {
            global $wpdb;
            $like   = '%' . $wpdb->esc_like( $q ) . '%';
            $where .= $wpdb->prepare( " AND {$wpdb->posts}.post_title LIKE %s", $like );
            return $where;
        };
        add_filter( 'posts_where', $title_filter );

        $args = array(
            'post_type'      => 'culture_directory',
            'post_status'    => 'publish',
            'posts_per_page' => 10,
            'orderby'        => 'title',
            'order'          => 'ASC',
        );

        if ( $type ) {
            $args['tax_query'] = array( array(
                'taxonomy' => 'culture_dir_type',
                'field'    => 'slug',
                'terms'    => $type,
            ) );
        }

        $query = new WP_Query( $args );
        remove_filter( 'posts_where', $title_filter );
        $results = array();

        foreach ( $query->posts as $post ) {
            $type_terms = get_the_terms( $post->ID, 'culture_dir_type' );
            $type_slug  = ( $type_terms && ! is_wp_error( $type_terms ) ) ? $type_terms[0]->slug : '';
            // Falls back to the external API's cover/poster URL (Google
            // Books/Spotify/TMDB quick-create) when there's no real WP
            // featured image — see _external_cover_url in handle_quick_create().
            $thumb      = get_the_post_thumbnail_url( $post->ID, 'thumbnail' )
                ?: ( get_post_meta( $post->ID, '_external_cover_url', true ) ?: false );

            $results[] = array(
                'id'        => $post->ID,
                'title'     => $post->post_title,
                'slug'      => $post->post_name,
                'type'      => $type_slug,
                'thumbnail' => $thumb ?: null,
                'city'      => get_post_meta( $post->ID, '_entry_city', true ) ?: '',
                // 'about' is the generic field (Author/Artist/Director/…);
                // 'author' is kept alongside it as a back-compat alias.
                'about'     => self::get_first_about_field( $post->ID ),
                'author'    => self::get_about_field( $post->ID, 'Author' ),
            );
        }

        return rest_ensure_response( $results );
    }

    // ── Discover: paginated browse with filters ──────────────────────────────

    /**
     * GET /culture/v1/directory/browse?q=&type=&region=&sort=&page=&per_page=
     *
     * Powers the Discover screen's "Recently Added" rail + 2-column grid, plus
     * the filter sheet's live "Show N entries" count (via the `total` field).
     * Public endpoint — no auth needed.
     *
     * - `type` accepts a comma-separated list of culture_dir_type slugs (multi-select).
     * - `region` accepts a single slug from REGION_CITY_KEYWORDS, matched against
     *   _entry_city via substring (case-insensitive).
     * - `sort` is one of: relevant (title match relevance when `q` set, else recent),
     *   recent (post_date desc), rating (_average_rating desc), trending
     *   (_community_review_count desc), random (seeded shuffle — pass the same
     *   `seed` back on subsequent pages to keep pagination stable within a
     *   single Discover visit; a new seed should be generated client-side on
     *   each fresh visit to the screen).
     */
    public static function handle_browse( WP_REST_Request $request ) {
        global $wpdb;

        $q        = sanitize_text_field( $request->get_param( 'q' ) );
        $types    = array_filter( array_map( 'sanitize_key', explode( ',', (string) $request->get_param( 'type' ) ) ) );
        $region   = sanitize_key( $request->get_param( 'region' ) );
        $sort     = sanitize_key( $request->get_param( 'sort' ) ) ?: 'relevant';
        $page     = max( 1, (int) $request->get_param( 'page' ) );
        $per_page = min( 50, max( 1, (int) $request->get_param( 'per_page' ) ?: 20 ) );

        $args = array(
            'post_type'      => 'culture_directory',
            'post_status'    => 'publish',
            'posts_per_page' => $per_page,
            'paged'          => $page,
        );

        if ( $types ) {
            $args['tax_query'] = array( array(
                'taxonomy' => 'culture_dir_type',
                'field'    => 'slug',
                'terms'    => $types,
            ) );
        }

        $title_filter = null;
        if ( $q !== '' ) {
            $title_filter = function( $where ) use ( $q ) {
                global $wpdb;
                $like   = '%' . $wpdb->esc_like( $q ) . '%';
                $where .= $wpdb->prepare( " AND {$wpdb->posts}.post_title LIKE %s", $like );
                return $where;
            };
            add_filter( 'posts_where', $title_filter );
        }

        // Region: resolve matching post IDs via a single raw-SQL lookup against
        // _entry_city before passing to WP_Query, same pattern documented in
        // CLAUDE.md for meta_query OR-branch slowness — avoids a meta_query join.
        if ( $region && isset( self::REGION_CITY_KEYWORDS[ $region ] ) ) {
            $keywords  = self::REGION_CITY_KEYWORDS[ $region ];
            $like_sql  = array();
            $like_args = array();
            foreach ( $keywords as $kw ) {
                $like_sql[]  = 'meta_value LIKE %s';
                $like_args[] = '%' . $wpdb->esc_like( $kw ) . '%';
            }
            $sql = "SELECT post_id FROM {$wpdb->postmeta} WHERE meta_key = '_entry_city' AND (" . implode( ' OR ', $like_sql ) . ')';
            $matching_ids = $wpdb->get_col( $wpdb->prepare( $sql, $like_args ) );
            $args['post__in'] = $matching_ids ?: array( 0 );
        }

        $random_filter = null;
        $seed          = 0;
        if ( $sort === 'recent' || ( $sort === 'relevant' && $q === '' ) ) {
            $args['orderby'] = 'date';
            $args['order']   = 'DESC';
        } elseif ( $sort === 'rating' ) {
            $args['meta_key'] = '_average_rating';
            $args['orderby']  = 'meta_value_num';
            $args['order']    = 'DESC';
        } elseif ( $sort === 'trending' ) {
            $args['meta_key'] = '_community_review_count';
            $args['orderby']  = 'meta_value_num';
            $args['order']    = 'DESC';
        } elseif ( $sort === 'random' ) {
            // Seeded MySQL RAND() — a single seed value keeps ordering stable
            // across paginated requests within one Discover visit, while a
            // fresh seed (generated client-side per screen visit) reshuffles
            // the grid on the next visit.
            $seed = (int) $request->get_param( 'seed' ) ?: wp_rand( 1, PHP_INT_MAX );
            $random_filter = function( $orderby ) use ( $seed, $wpdb ) {
                return $wpdb->prepare( 'RAND(%d)', $seed );
            };
            add_filter( 'posts_orderby', $random_filter );
        } else {
            $args['orderby'] = 'title';
            $args['order']   = 'ASC';
        }

        $args['update_post_term_cache'] = true;
        $args['update_post_meta_cache'] = true;

        $query = new WP_Query( $args );
        if ( $title_filter ) {
            remove_filter( 'posts_where', $title_filter );
        }
        if ( $random_filter ) {
            remove_filter( 'posts_orderby', $random_filter );
        }

        $post_ids = wp_list_pluck( $query->posts, 'ID' );

        // Batch-prime the meta cache for all posts in one query instead of
        // 3 × get_post_meta() per post (N+1). WP_Query's built-in
        // update_post_meta_cache only fires for the main query object —
        // calling update_meta_cache explicitly ensures it for REST contexts.
        if ( $post_ids ) {
            update_meta_cache( 'post', $post_ids );
        }

        // Batch-load thumbnail attachment URLs (avoids N per-post queries for
        // _thumbnail_id → attachment URL resolution).
        $thumb_map = array();
        if ( $post_ids ) {
            $thumb_ids_raw = array();
            foreach ( $post_ids as $pid ) {
                $tid = get_post_meta( $pid, '_thumbnail_id', true );
                if ( $tid ) {
                    $thumb_ids_raw[ $pid ] = (int) $tid;
                }
            }
            if ( $thumb_ids_raw ) {
                $att_ids     = array_unique( array_values( $thumb_ids_raw ) );
                $placeholder = implode( ',', array_fill( 0, count( $att_ids ), '%d' ) );
                $att_rows    = $wpdb->get_results( $wpdb->prepare(
                    "SELECT ID, guid FROM {$wpdb->posts} WHERE ID IN ($placeholder)",
                    $att_ids
                ), OBJECT_K );
                foreach ( $thumb_ids_raw as $pid => $att_id ) {
                    if ( isset( $att_rows[ $att_id ] ) ) {
                        $thumb_map[ $pid ] = $att_rows[ $att_id ]->guid;
                    }
                }
            }
        }

        $today = current_time( 'Y-m-d' );
        $entries = array();

        foreach ( $query->posts as $post ) {
            $type_terms     = get_the_terms( $post->ID, 'culture_dir_type' );
            $type_slug      = ( $type_terms && ! is_wp_error( $type_terms ) ) ? $type_terms[0]->slug : '';
            $interest_terms = get_the_terms( $post->ID, 'culture_interest' );
            $subtype        = ( $interest_terms && ! is_wp_error( $interest_terms ) ) ? $interest_terms[0]->name : '';

            $excerpt = $post->post_excerpt
                ? wp_trim_words( $post->post_excerpt, 20 )
                : wp_trim_words( wp_strip_all_tags( $post->post_content ), 20 );

            $entries[] = array(
                'id'            => $post->ID,
                'title'         => $post->post_title,
                'slug'          => $post->post_name,
                'type'          => $type_slug,
                'subtype'       => $subtype,
                'excerpt'       => $excerpt,
                'thumbnail'     => isset( $thumb_map[ $post->ID ] ) ? $thumb_map[ $post->ID ] : null,
                'city'          => get_post_meta( $post->ID, '_entry_city', true ) ?: '',
                'averageRating' => (float) get_post_meta( $post->ID, '_average_rating', true ) ?: null,
                'reviewCount'   => (int) get_post_meta( $post->ID, '_community_review_count', true ),
                'dateAdded'     => $post->post_date,
                'isNew'         => substr( $post->post_date, 0, 10 ) === $today,
            );
        }

        return rest_ensure_response( array(
            'entries' => $entries,
            'total'   => (int) $query->found_posts,
            'page'    => $page,
            'perPage' => $per_page,
            'seed'    => $seed ?: null,
        ) );
    }

    // ── Phase 3: Quick-create stub ───────────────────────────────────────────

    /**
     * POST /culture/v1/directory/quick-create
     *
     * Creates a minimal published directory stub from the post composer.
     * Authenticated — requires a valid logged-in user.
     */
    public static function handle_quick_create( WP_REST_Request $request ) {
        $user_id      = (int) $request->get_param( 'user_id' );
        $title        = sanitize_text_field( $request->get_param( 'title' ) );
        $entry_type   = sanitize_key( $request->get_param( 'entry_type' ) );
        $location_name = sanitize_text_field( $request->get_param( 'location_name' ) );
        $lat          = (float) $request->get_param( 'location_lat' );
        $lng          = (float) $request->get_param( 'location_lng' );
        $city         = sanitize_text_field( $request->get_param( 'city' ) );
        // Generic labelled "about" field (Author/Artist/Director/…) — `author`
        // is kept as a back-compat alias for existing Book Review callers,
        // always labelled "Author" when used that way.
        $about_label  = sanitize_text_field( $request->get_param( 'about_label' ) );
        $about_value  = sanitize_text_field( $request->get_param( 'about_value' ) );
        $author       = sanitize_text_field( $request->get_param( 'author' ) );
        if ( $author && ! $about_value ) {
            $about_label = 'Author';
            $about_value = $author;
        }
        // External catalog dedup (Google Books/Spotify/TMDB quick-create).
        $external_source = sanitize_key( $request->get_param( 'external_source' ) );
        $external_id     = sanitize_text_field( $request->get_param( 'external_id' ) );
        // Cover art from the external API — stored as a plain URL rather than
        // sideloaded into the media library (no local re-hosting for v1).
        $cover_image_url = esc_url_raw( $request->get_param( 'cover_image_url' ) );

        if ( empty( $title ) ) {
            return new WP_Error( 'missing_title', __( 'Title is required.', 'culture-community' ), array( 'status' => 400 ) );
        }

        // Find-or-create: an entry already linked to this external ID
        // short-circuits creation entirely.
        if ( $external_source && $external_id ) {
            $existing = self::find_by_external_id( $external_source, $external_id );
            if ( $existing ) {
                return rest_ensure_response( array(
                    'id'        => $existing->ID,
                    'slug'      => $existing->post_name,
                    'title'     => $existing->post_title,
                    'city'      => get_post_meta( $existing->ID, '_entry_city', true ) ?: '',
                    'about'     => self::get_first_about_field( $existing->ID ),
                    'thumbnail' => get_the_post_thumbnail_url( $existing->ID, 'thumbnail' )
                        ?: ( get_post_meta( $existing->ID, '_external_cover_url', true ) ?: null ),
                ) );
            }
        }

        $post_id = wp_insert_post( array(
            'post_type'   => 'culture_directory',
            'post_title'  => $title,
            'post_status' => 'publish',
            'post_author' => $user_id,
        ), true );

        if ( is_wp_error( $post_id ) ) {
            return new WP_Error( 'create_failed', $post_id->get_error_message(), array( 'status' => 500 ) );
        }

        update_post_meta( $post_id, '_culture_dir_submitted_by', $user_id );
        update_post_meta( $post_id, '_culture_dir_ai_generated', '0' );

        if ( $entry_type && taxonomy_exists( 'culture_dir_type' ) ) {
            wp_set_object_terms( $post_id, $entry_type, 'culture_dir_type' );
        }
        if ( $location_name ) {
            update_post_meta( $post_id, 'dir_infobox_location_name', $location_name );
        }
        if ( $lat ) update_post_meta( $post_id, 'dir_infobox_lat', $lat );
        if ( $lng ) update_post_meta( $post_id, 'dir_infobox_lng', $lng );
        if ( $city ) {
            update_post_meta( $post_id, '_entry_city', $city );
        }
        if ( $about_label && $about_value ) {
            update_post_meta( $post_id, '_about_fields', wp_json_encode( array( array( 'label' => $about_label, 'value' => $about_value ) ) ) );
        }
        if ( $external_source && $external_id ) {
            update_post_meta( $post_id, '_external_source', $external_source );
            update_post_meta( $post_id, '_external_id', $external_id );
        }
        if ( $cover_image_url ) {
            update_post_meta( $post_id, '_external_cover_url', $cover_image_url );
        }

        // Award reputation for creating a directory entry.
        if ( class_exists( 'Culture_Gamification' ) && $user_id > 0 ) {
            Culture_Gamification::award_reputation( $user_id, Culture_Gamification::get_point_value( 'directory_entry' ), 'directory_entry', $post_id );
            Culture_Gamification::award_credits( $user_id, Culture_Gamification::get_credit_bonus( 'directory_entry' ), 'directory_entry', $post_id );
        }

        return rest_ensure_response( array(
            'id'        => $post_id,
            'slug'      => get_post_field( 'post_name', $post_id ),
            'title'     => $title,
            'city'      => $city,
            'about'     => $about_value,
            'author'    => $about_value, // back-compat alias, see get_first_about_field()
            'thumbnail' => $cover_image_url ?: null,
        ) );
    }

    // ── Stub enrichment endpoint ─────────────────────────────────────────────

    /**
     * POST /culture/v1/directory/{id}/enrich
     *
     * Updates an existing stub post with AI-generated content, excerpt,
     * infobox meta, entry type, and (optionally) a featured image.
     * Auth: Bearer API secret only.
     */
    public static function handle_enrich_stub( WP_REST_Request $request ) {
        $post_id = (int) $request->get_param( 'id' );
        $post    = get_post( $post_id );

        if ( ! $post || 'culture_directory' !== $post->post_type ) {
            return new WP_Error( 'not_found', 'Directory entry not found.', array( 'status' => 404 ) );
        }

        $content    = wp_kses_post( $request->get_param( 'content' ) ?? '' );
        $excerpt    = sanitize_text_field( $request->get_param( 'excerpt' ) ?? '' );
        $entry_type = sanitize_key( $request->get_param( 'entry_type' ) ?? '' );
        $interests  = (array) ( $request->get_param( 'interests' ) ?? array() );
        $infobox    = (array) ( $request->get_param( 'infobox' ) ?? array() );

        $update_data = array(
            'ID'           => $post_id,
            'post_content' => $content,
            'post_excerpt' => $excerpt,
        );
        wp_update_post( $update_data );

        update_post_meta( $post_id, '_culture_dir_ai_generated', '1' );

        if ( $entry_type && taxonomy_exists( 'culture_dir_type' ) ) {
            wp_set_object_terms( $post_id, $entry_type, 'culture_dir_type' );
        }

        if ( ! empty( $interests ) && taxonomy_exists( 'culture_interest' ) ) {
            wp_set_object_terms( $post_id, $interests, 'culture_interest' );
        }

        foreach ( $infobox as $key => $value ) {
            $clean_key   = 'dir_infobox_' . sanitize_key( $key );
            $clean_value = sanitize_text_field( $value );
            if ( $clean_value ) {
                update_post_meta( $post_id, $clean_key, $clean_value );
            }
        }

        return rest_ensure_response( array( 'success' => true, 'post_id' => $post_id ) );
    }

    // ── Phase 3: Directory posts endpoint ────────────────────────────────────

    /**
     * GET /culture/v1/directory/{id}/posts
     *
     * Returns published community posts linked to a directory entry,
     * plus aggregate summary (total, average rating, counts by template).
     */
    /**
     * Returns upcoming culture_event posts where the organiser is this directory entry.
     */
    public static function handle_directory_events( WP_REST_Request $request ) {
        $dir_id = (int) $request->get_param( 'id' );

        if ( ! get_post( $dir_id ) ) {
            return new WP_Error( 'not_found', __( 'Directory entry not found.', 'culture-community' ), array( 'status' => 404 ) );
        }

        $query = new WP_Query( array(
            'post_type'      => 'culture_event',
            'post_status'    => 'publish',
            'posts_per_page' => 20,
            'orderby'        => 'meta_value',
            'meta_key'       => '_culture_event_date',
            'order'          => 'ASC',
            'meta_query'     => array( array(
                'key'     => '_culture_event_organiser_id',
                'value'   => $dir_id,
                'type'    => 'NUMERIC',
                'compare' => '=',
            ) ),
        ) );

        $today  = new DateTime( 'today', new DateTimeZone( 'UTC' ) );
        $events = array();

        foreach ( $query->posts as $post ) {
            $event_date = get_post_meta( $post->ID, '_culture_event_date', true );
            $end_date   = get_post_meta( $post->ID, '_culture_event_end_date', true );

            // Skip events that have already passed.
            $compare_date = $end_date ?: $event_date;
            if ( $compare_date ) {
                $d = new DateTime( $compare_date, new DateTimeZone( 'UTC' ) );
                if ( $d < $today ) continue;
            }

            $thumb_id = get_post_thumbnail_id( $post->ID );
            $image    = $thumb_id ? wp_get_attachment_image_url( $thumb_id, 'medium' ) : null;

            $events[] = array(
                'id'         => $post->ID,
                'slug'       => $post->post_name,
                'title'      => get_the_title( $post->ID ),
                'href'       => '/events/' . $post->post_name,
                'event_date' => $event_date,
                'end_date'   => $end_date,
                'location'   => get_post_meta( $post->ID, '_culture_location', true ),
                'city'       => get_post_meta( $post->ID, '_culture_event_city', true ),
                'admission'  => get_post_meta( $post->ID, '_culture_admission', true ),
                'image'      => $image,
            );
        }

        return rest_ensure_response( array( 'events' => $events, 'total' => count( $events ) ) );
    }

    /**
     * Returns published community posts linked to a directory entry,
     * plus aggregate summary (total, average rating, counts by template).
     */
    public static function handle_directory_posts( WP_REST_Request $request ) {
        $dir_id = (int) $request->get_param( 'id' );

        if ( ! get_post( $dir_id ) ) {
            return new WP_Error( 'not_found', __( 'Directory entry not found.', 'culture-community' ), array( 'status' => 404 ) );
        }

        $query = new WP_Query( array(
            'post_type'      => 'culture_post',
            'post_status'    => 'publish',
            'posts_per_page' => 50,
            'orderby'        => 'date',
            'order'          => 'DESC',
            'meta_query'     => array( array(
                'key'   => '_linked_directory_id',
                'value' => $dir_id,
                'type'  => 'NUMERIC',
            ) ),
        ) );

        $posts      = array();
        $ratings    = array();
        $by_template = array();

        foreach ( $query->posts as $post ) {
            $author      = get_userdata( $post->post_author );
            $avatar_url  = get_avatar_url( $post->post_author, array( 'size' => 48 ) );
            $tier        = get_user_meta( $post->post_author, '_culture_tier', true ) ?: 'citizen';
            $template    = get_post_meta( $post->ID, '_template_type', true ) ?: 'post';
            $star_rating = (int) get_post_meta( $post->ID, '_star_rating', true );
            $reactions   = json_decode( get_post_meta( $post->ID, 'community_reactions', true ) ?: '{}', true ) ?: array();

            if ( $star_rating > 0 ) $ratings[] = $star_rating;
            $by_template[ $template ] = ( $by_template[ $template ] ?? 0 ) + 1;

            $posts[] = array(
                'id'            => $post->ID,
                'slug'          => $post->post_name,
                'template_type' => $template,
                'content'       => wp_trim_words( $post->post_content, 60 ),
                'star_rating'   => $star_rating ?: null,
                'author'        => array(
                    'name'   => $author ? $author->display_name : 'Member',
                    'avatar' => $avatar_url,
                    'tier'   => $tier,
                ),
                'reactions'     => $reactions,
                'created_at'    => get_post_time( 'c', true, $post ),
            );
        }

        $avg_rating = count( $ratings ) > 0
            ? round( array_sum( $ratings ) / count( $ratings ), 1 )
            : null;

        return rest_ensure_response( array(
            'posts'   => $posts,
            'summary' => array(
                'total_posts'    => $query->found_posts,
                'average_rating' => $avg_rating,
                'by_template'    => $by_template,
            ),
        ) );
    }
}
