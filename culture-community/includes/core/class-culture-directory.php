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
        $image_base64      = $request->get_param( 'image_base64' );
        $filename          = sanitize_file_name( $request->get_param( 'filename' ) ?: 'directory-image.jpg' );
        $image_title       = sanitize_text_field( $request->get_param( 'image_title' ) ?: '' );
        $image_description = sanitize_textarea_field( $request->get_param( 'image_description' ) ?: '' );
        $image_alt         = sanitize_text_field( $request->get_param( 'image_alt' ) ?: '' );

        if ( ! $post_id || ! $image_base64 ) {
            return new WP_Error(
                'missing_params',
                __( 'post_id and image_base64 are required.', 'culture-community' ),
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

        // Decode the base64 image data.
        $image_data = base64_decode( $image_base64, true );
        if ( false === $image_data ) {
            return new WP_Error(
                'invalid_image',
                __( 'Could not decode base64 image data.', 'culture-community' ),
                array( 'status' => 400 )
            );
        }

        // Upload into the WordPress uploads directory.
        $upload = wp_upload_bits( $filename, null, $image_data );
        if ( ! empty( $upload['error'] ) ) {
            return new WP_Error(
                'upload_failed',
                $upload['error'],
                array( 'status' => 500 )
            );
        }

        // Determine MIME type from the filename extension.
        $mime = wp_check_filetype( $filename );

        // Create the media attachment post.
        // Use visual metadata when provided so the Visuals library is searchable
        // by what is visible in the illustration, not the directory entry topic.
        $att_title = $image_title ?: sanitize_text_field( pathinfo( $filename, PATHINFO_FILENAME ) );
        $attachment_id = wp_insert_attachment(
            array(
                'post_mime_type' => $mime['type'] ?: 'image/jpeg',
                'post_title'     => $att_title,
                'post_content'   => $image_description,
                'post_excerpt'   => $image_alt,
                'post_status'    => 'inherit',
            ),
            $upload['file'],
            $post_id
        );

        if ( is_wp_error( $attachment_id ) ) {
            return new WP_Error(
                'attachment_failed',
                $attachment_id->get_error_message(),
                array( 'status' => 500 )
            );
        }

        // Generate image size metadata (thumbnails etc.).
        if ( ! function_exists( 'wp_generate_attachment_metadata' ) ) {
            require_once ABSPATH . 'wp-admin/includes/image.php';
        }
        $meta = wp_generate_attachment_metadata( $attachment_id, $upload['file'] );
        wp_update_attachment_metadata( $attachment_id, $meta );

        // Set alt text (stored as post meta, separate from the attachment post).
        if ( $image_alt ) {
            update_post_meta( $attachment_id, '_wp_attachment_image_alt', $image_alt );
        }

        // Mark as a Culture Directory visual so it persists in /visuals even if
        // the parent directory entry is later deleted. Store enough entry context
        // (slug, title, type) so the gallery can display the card without needing
        // the parent post to still exist.
        $entry_type = '';
        if ( taxonomy_exists( 'culture_dir_type' ) ) {
            $terms = wp_get_post_terms( $post_id, 'culture_dir_type', array( 'fields' => 'slugs' ) );
            if ( ! is_wp_error( $terms ) && ! empty( $terms ) ) {
                $entry_type = $terms[0];
            }
        }

        update_post_meta( $attachment_id, '_culture_dir_visual',      '1' );
        update_post_meta( $attachment_id, '_culture_dir_entry_slug',  $post->post_name );
        update_post_meta( $attachment_id, '_culture_dir_entry_title', $post->post_title );
        update_post_meta( $attachment_id, '_culture_dir_entry_type',  $entry_type );

        // Set as the post's featured image.
        set_post_thumbnail( $post_id, $attachment_id );

        return rest_ensure_response( array(
            'success'       => true,
            'attachment_id' => $attachment_id,
            'url'           => $upload['url'],
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
    public static function handle_search( WP_REST_Request $request ) {
        $q    = sanitize_text_field( $request->get_param( 'q' ) );
        $type = sanitize_key( $request->get_param( 'type' ) );

        $args = array(
            'post_type'      => 'culture_directory',
            'post_status'    => 'publish',
            'posts_per_page' => 10,
            's'              => $q,
            'orderby'        => 'relevance',
        );

        if ( $type ) {
            $args['tax_query'] = array( array(
                'taxonomy' => 'culture_dir_type',
                'field'    => 'slug',
                'terms'    => $type,
            ) );
        }

        $query   = new WP_Query( $args );
        $results = array();

        foreach ( $query->posts as $post ) {
            $type_terms = get_the_terms( $post->ID, 'culture_dir_type' );
            $type_slug  = ( $type_terms && ! is_wp_error( $type_terms ) ) ? $type_terms[0]->slug : '';
            $thumb      = get_the_post_thumbnail_url( $post->ID, 'thumbnail' );

            $results[] = array(
                'id'        => $post->ID,
                'title'     => $post->post_title,
                'slug'      => $post->post_name,
                'type'      => $type_slug,
                'thumbnail' => $thumb ?: null,
            );
        }

        return rest_ensure_response( $results );
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

        if ( empty( $title ) ) {
            return new WP_Error( 'missing_title', __( 'Title is required.', 'culture-community' ), array( 'status' => 400 ) );
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

        // Award reputation for creating a directory entry.
        if ( class_exists( 'Culture_Gamification' ) && $user_id > 0 ) {
            Culture_Gamification::award_reputation( $user_id, 15, 'directory_entry', $post_id );
            Culture_Gamification::award_credits( $user_id, 2, 'directory_entry', $post_id );
        }

        return rest_ensure_response( array(
            'id'    => $post_id,
            'slug'  => get_post_field( 'post_name', $post_id ),
            'title' => $title,
        ) );
    }

    // ── Phase 3: Directory posts endpoint ────────────────────────────────────

    /**
     * GET /culture/v1/directory/{id}/posts
     *
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
