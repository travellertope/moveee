<?php
/**
 * Registers Custom Post Types and Taxonomies.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Culture_Post_Types {

    public static function init() {
        // Register CPTs and taxonomies directly since init() is called during the init hook.
        self::register_post_types();
        self::register_taxonomies();
        self::register_rest_meta_fields();
        add_action( 'add_meta_boxes', array( __CLASS__, 'register_meta_boxes' ) );
        add_action( 'wp_ajax_culture_generate_checkin_token', array( __CLASS__, 'ajax_generate_checkin_token' ) );
        add_action( 'save_post', array( __CLASS__, 'save_meta_boxes' ) );
        add_action( 'acf/save_post', array( __CLASS__, 'cache_event_showcase_urls' ), 20 );
        add_action( 'graphql_register_types', array( __CLASS__, 'register_graphql_fields' ) );
        add_action( 'init', array( __CLASS__, 'register_as_told_to_meta' ) );
        add_action( 'rest_after_insert_post', array( __CLASS__, 'save_as_told_to_rest' ), 10, 2 );
        add_filter( 'rest_culture_event_query', array( __CLASS__, 'exclude_expired_events' ), 10, 2 );

        // Issue taxonomy admin form fields
        add_action( 'issue_add_form_fields',  array( __CLASS__, 'issue_add_form_fields' ) );
        add_action( 'issue_edit_form_fields', array( __CLASS__, 'issue_edit_form_fields' ), 10, 2 );
        add_action( 'created_issue',          array( __CLASS__, 'issue_save_meta' ) );
        add_action( 'edited_issue',           array( __CLASS__, 'issue_save_meta' ) );
    }

    /**
     * Expose key private meta fields via the WP REST API so the Next.js
     * REST fallback can read them (e.g. isAiGenerated on events).
     */
    public static function register_rest_meta_fields() {
        $event_meta = array(
            '_culture_ai_generated'       => array( 'type' => 'string' ),
            '_culture_event_date'         => array( 'type' => 'string' ),
            '_culture_event_end_date'     => array( 'type' => 'string' ),
            '_culture_location'           => array( 'type' => 'string' ),
            '_culture_event_city'         => array( 'type' => 'string' ),
            '_culture_admission'          => array( 'type' => 'string' ),
            '_culture_ticketing_url'      => array( 'type' => 'string' ),
            '_culture_tagline'            => array( 'type' => 'string' ),
            '_culture_is_featured'        => array( 'type' => 'string' ),
            '_culture_event_is_literati'  => array( 'type' => 'string' ),
            '_culture_event_image_url'    => array( 'type' => 'string' ),
            '_culture_opening_hours'      => array( 'type' => 'string' ),
            '_culture_event_organiser_id'  => array( 'type' => 'integer' ),
            '_culture_event_showcase_urls' => array( 'type' => 'string' ),
            '_culture_event_pro_only'      => array( 'type' => 'boolean' ),
        );
        // Expose AIOSEO meta on standard posts so REST-based fetches can read them
        foreach ( array( '_aioseo_title', '_aioseo_description' ) as $aioseo_key ) {
            register_post_meta( 'post', $aioseo_key, array(
                'type'         => 'string',
                'single'       => true,
                'show_in_rest' => true,
                'auth_callback' => function() { return current_user_can( 'edit_posts' ); },
            ) );
        }

        foreach ( $event_meta as $meta_key => $args ) {
            register_post_meta( 'culture_event', $meta_key, array(
                'type'         => $args['type'],
                'single'       => true,
                'show_in_rest' => true,
                'auth_callback' => function() { return current_user_can( 'edit_posts' ); },
            ) );
        }

        // Expose culture_interest taxonomy terms as objects on the culture_event REST response
        // so the Next.js REST fallback mapper can read category name/slug directly.
        register_rest_field( 'culture_event', 'culture_interests', array(
            'get_callback' => function ( $post_arr ) {
                $terms = get_the_terms( $post_arr['id'], 'culture_interest' );
                if ( ! $terms || is_wp_error( $terms ) ) {
                    return array();
                }
                return array_map( function ( $t ) {
                    return array( 'id' => $t->term_id, 'name' => $t->name, 'slug' => $t->slug );
                }, array_values( $terms ) );
            },
            'schema' => null,
        ) );

        // Expose all core event meta as a single REST field so the Next.js
        // frontend can reliably read these fields even when GraphQL returns nulls.
        register_rest_field( 'culture_event', 'culture_event_meta', array(
            'get_callback' => function ( $post_arr ) {
                $id = $post_arr['id'];
                return array(
                    'event_date'    => get_post_meta( $id, '_culture_event_date',    true ),
                    'end_date'      => get_post_meta( $id, '_culture_event_end_date', true ),
                    'location'      => get_post_meta( $id, '_culture_location',      true ),
                    'city'          => get_post_meta( $id, '_culture_event_city',    true ),
                    'admission'     => get_post_meta( $id, '_culture_admission',     true ),
                    'ticketing_url' => get_post_meta( $id, '_culture_ticketing_url', true ),
                    'image_url'     => get_post_meta( $id, '_culture_event_image_url', true ),
                    'opening_hours' => get_post_meta( $id, '_culture_opening_hours', true ),
                    'tagline'       => get_post_meta( $id, '_culture_tagline',       true ),
                    'attribution'   => get_post_meta( $id, '_culture_attribution',   true ),
                    'ai_generated'  => get_post_meta( $id, '_culture_ai_generated',  true ),
                    'organiser_id'  => (int) get_post_meta( $id, '_culture_event_organiser_id', true ) ?: null,
                    'organiser_name' => ( function() use ( $id ) {
                        $oid = (int) get_post_meta( $id, '_culture_event_organiser_id', true );
                        return $oid ? get_the_title( $oid ) : null;
                    } )(),
                    'organiser_slug' => ( function() use ( $id ) {
                        $oid = (int) get_post_meta( $id, '_culture_event_organiser_id', true );
                        return $oid ? get_post_field( 'post_name', $oid ) : null;
                    } )(),
                    'is_featured'  => (bool) get_post_meta( $id, '_culture_is_featured', true ),
                    'is_literati'  => (bool) get_post_meta( $id, '_culture_event_is_literati', true ),
                    'rsvp_count'   => ( function() use ( $post_arr ) {
                        global $wpdb;
                        $t = $wpdb->prefix . 'culture_event_rsvp';
                        return (int) $wpdb->get_var( $wpdb->prepare(
                            "SELECT COUNT(*) FROM {$t} WHERE event_slug = %s AND status = 'confirmed'",
                            $post_arr['slug']
                        ) );
                    } )(),
                );
            },
            'schema' => null,
        ) );

        // community post meta (Phase 3 + Phase 4)
        $community_post_meta = array(
            '_template_type'       => 'string',
            '_linked_directory_id' => 'integer',
            '_star_rating'         => 'integer',
            '_location_name'       => 'string',
            '_location_lat'        => 'number',
            '_location_lng'        => 'number',
            '_poll_options'        => 'string',
            '_poll_expires_at'     => 'string',
            '_poll_voters'         => 'string',
            '_itinerary_stops'     => 'string',
            '_gallery_images'      => 'string',
            '_video_url'           => 'string',
            '_food_dish_name'      => 'string',
            '_food_rating_taste'   => 'integer',
            '_food_rating_value'   => 'integer',
            '_food_rating_vibe'    => 'integer',
            // Community-organiser event template (separate from the culture_event CPT above)
            '_event_date'              => 'string',
            '_event_end_date'          => 'string',
            '_event_venue'             => 'string',
            '_event_city'              => 'string',
            '_event_address'           => 'string',
            '_event_admission'         => 'string',
            '_event_ticket_url'        => 'string',
            '_event_category'          => 'string',
            '_culture_event_organiser_id' => 'integer',
            '_culture_rsvp_enabled'    => 'boolean',
            '_culture_rsvp_capacity'   => 'integer',
            '_culture_is_featured'     => 'boolean',
        );
        foreach ( $community_post_meta as $meta_key => $type ) {
            register_post_meta( 'culture_post', $meta_key, array(
                'type'          => $type,
                'single'        => true,
                'show_in_rest'  => true,
                'auth_callback' => function() { return current_user_can( 'edit_posts' ); },
            ) );
        }

        // Resolved organiser + RSVP fields for community-organiser events, mirroring
        // culture_event_meta above. Kept as a single REST field (rather than raw meta)
        // so the Next.js feed mapper doesn't need a second request per event to resolve
        // the organiser directory entry or live RSVP count.
        register_rest_field( 'culture_post', 'community_event_meta', array(
            'get_callback' => function ( $post_arr ) {
                $id = $post_arr['id'];
                if ( get_post_meta( $id, '_template_type', true ) !== 'event' ) {
                    return null;
                }
                $organiser_id = (int) get_post_meta( $id, '_culture_event_organiser_id', true );
                $rsvp_enabled = (bool) get_post_meta( $id, '_culture_rsvp_enabled', true );
                return array(
                    'organiser_id'   => $organiser_id ?: null,
                    'organiser_name' => $organiser_id ? get_the_title( $organiser_id ) : null,
                    'organiser_slug' => $organiser_id ? get_post_field( 'post_name', $organiser_id ) : null,
                    'rsvp_enabled'   => $rsvp_enabled,
                    'rsvp_capacity'  => (int) get_post_meta( $id, '_culture_rsvp_capacity', true ),
                    'rsvp_count'     => $rsvp_enabled && class_exists( 'Culture_Community_RSVP' )
                        ? Culture_Community_RSVP::get_count( $id )
                        : 0,
                    'is_featured'    => (bool) get_post_meta( $id, '_culture_is_featured', true ),
                );
            },
            'schema' => null,
        ) );

        // directory entry meta (Phase 3)
        $directory_meta = array(
            '_community_review_count' => 'integer',
            '_average_rating'         => 'number',
            '_is_partner'             => 'boolean',
            '_partner_status'         => 'string',
            '_partner_perk_template'  => 'string',
            '_entry_city'             => 'string',
            // Rich detail fields for mobile DirectoryDetailScreen
            '_about_fields'           => 'string',   // JSON: [{label, value}]
            '_entry_quote'            => 'string',   // featured quote for Concept/Book blockquote
            '_selected_works'         => 'string',   // JSON: [{imageUrl?, caption}]
            '_related_entries'        => 'string',   // JSON: [{id, title, type, slug}]
        );
        foreach ( $directory_meta as $meta_key => $type ) {
            register_post_meta( 'culture_directory', $meta_key, array(
                'type'          => $type,
                'single'        => true,
                'show_in_rest'  => true,
                'auth_callback' => function() { return current_user_can( 'edit_posts' ); },
            ) );
        }

        // House Fellowship cluster meta (Literati Connect plan, Phase 1).
        $cluster_meta = array(
            '_cluster_name'                 => 'string',
            '_cluster_city'                 => 'string',
            '_cluster_street'               => 'string',
            '_cluster_country'              => 'string',
            '_cluster_lat'                  => 'number',
            '_cluster_lng'                  => 'number',
            '_cluster_status'               => 'string',
            '_cluster_founder_id'           => 'integer',
            '_cluster_host_id'              => 'integer',
            '_cluster_host_mechanism'       => 'string',
            '_cluster_capacity'             => 'integer',
            '_cluster_meeting_day'          => 'string',
            '_cluster_meeting_time'         => 'string',
            '_cluster_meeting_location_note' => 'string',
            '_cluster_created_at'           => 'string',
            '_cluster_activated_at'         => 'string',
            '_cluster_election_open_until'  => 'string',
            '_cluster_election_votes'       => 'string', // JSON: {voter_user_id: candidate_user_id}
            // Host onboarding fields (added with onboarding flow).
            '_cluster_venue_type'              => 'string',  // home|cafe|coworking|other
            '_cluster_host_note'               => 'string',  // context note visible to confirmed members
            '_cluster_realistic_capacity'      => 'integer', // physical gathering size (distinct from enrollment cap)
            '_cluster_accessible'              => 'integer', // 1 if step-free/accessible
            '_cluster_address_visible'         => 'string',  // members_only|on_request|area_only
            '_cluster_host_locality_confirmed' => 'integer', // 1 if host confirmed local presence
        );
        foreach ( $cluster_meta as $meta_key => $type ) {
            register_post_meta( 'culture_cluster', $meta_key, array(
                'type'          => $type,
                'single'        => true,
                'show_in_rest'  => true,
                'auth_callback' => function() { return current_user_can( 'edit_posts' ); },
            ) );
        }
    }

    /**
     * Register custom meta fields on WPGraphQL types so the Next.js frontend
     * can query them.
     */
    public static function register_graphql_fields() {
        if ( ! function_exists( 'register_graphql_field' ) ) {
            return;
        }

        // 0a. AIOSEO SEO title & description — expose so Next.js generateMetadata can use them
        foreach ( array( '_aioseo_title' => 'seoTitle', '_aioseo_description' => 'seoDescription' ) as $meta_key => $field_name ) {
            $key = $meta_key; // capture for closure
            register_graphql_field( 'Post', $field_name, array(
                'type'        => 'String',
                'description' => "AIOSEO custom {$field_name} stored in {$meta_key}.",
                'resolve'     => function( $post ) use ( $key ) {
                    return (string) get_post_meta( $post->databaseId, $key, true );
                },
            ) );
        }

        // 0b. As-told-to byline for standard posts
        register_graphql_field( 'Post', 'asToldTo', array(
            'type'        => 'String',
            'description' => 'Guest/subject name for as-told-to stories. When set, byline reads "Words by [guest], as told to [WP author]".',
            'resolve'     => function( $post ) {
                return (string) get_post_meta( $post->databaseId, 'as_told_to', true );
            },
        ) );

        // 1. Quotes
        $quote_fields = array(
            'quoteSource'        => array( 'type' => 'String', 'meta_key' => '_quote_source' ),
            'quoteLikes'         => array( 'type' => 'Int',    'meta_key' => '_quote_likes' ),
            'quoteReports'       => array( 'type' => 'Int',    'meta_key' => '_quote_reports' ),
            'quoteUserId'        => array( 'type' => 'Int',    'meta_key' => '_quote_user_id' ),
            'quoteSharingReason' => array( 'type' => 'String', 'meta_key' => '_quote_sharing_reason' ),
            'quoteType'          => array( 'type' => 'String', 'meta_key' => '_quote_type' ),
        );

        foreach ( $quote_fields as $field_name => $config ) {
            $meta_key = $config['meta_key'];
            $type     = $config['type'];
            register_graphql_field( 'CultureQuote', $field_name, array(
                'type'    => $type,
                'resolve' => function( $post ) use ( $meta_key, $type ) {
                    $value = get_post_meta( $post->databaseId, $meta_key, true );
                    return $type === 'Int' ? (int) $value : (string) $value;
                },
            ) );
        }

        // 2. Events & Posts
        $event_fields = array(
            'location'      => array( 'type' => 'String',  'meta_key' => 'location' ),
            'eventLocation' => array( 'type' => 'String',  'meta_key' => 'location' ), // alias
            'eventDate'     => array( 'type' => 'String',  'meta_key' => '_culture_event_date' ),
            'endDate'       => array( 'type' => 'String',  'meta_key' => 'end_date' ),
            'attribution'   => array( 'type' => 'String',  'meta_key' => 'attribution' ),
            'tagline'       => array( 'type' => 'String',  'meta_key' => 'tagline' ),
            'isFeatured'    => array( 'type' => 'Boolean', 'meta_key' => 'is_featured' ),
            'admission'     => array( 'type' => 'String',  'meta_key' => 'admission' ),
            'isPhysical'    => array( 'type' => 'Boolean', 'meta_key' => '_culture_is_physical' ),
            'capacity'      => array( 'type' => 'Int',     'meta_key' => '_culture_capacity' ),
            'openingHours'  => array( 'type' => 'String',  'meta_key' => 'opening_hours' ),
        );

        // Register on Post (backwards-compat)
        foreach ( $event_fields as $field_name => $config ) {
            $meta_key = $config['meta_key'];
            $type     = $config['type'];
            register_graphql_field( 'Post', $field_name, array(
                'type'    => $type,
                'resolve' => function( $post ) use ( $meta_key, $type ) {
                    $db_id = isset( $post->databaseId ) ? $post->databaseId : (isset($post->ID) ? $post->ID : 0);
                    $value = get_post_meta( $db_id, $meta_key, true );
                    if ( $type === 'Boolean' ) return (bool) $value;
                    if ( $type === 'Int' ) return (int) $value;
                    return (string) $value;
                },
            ) );
        }

        // Register on CultureEvent
        foreach ( $event_fields as $field_name => $config ) {
            $meta_key = $config['meta_key'];
            $type     = $config['type'];
            register_graphql_field( 'CultureEvent', $field_name, array(
                'type'    => $type,
                'resolve' => function( $post ) use ( $meta_key, $type ) {
                    $value = get_post_meta( $post->databaseId, $meta_key, true );
                    if ( $type === 'Boolean' ) return (bool) $value;
                    if ( $type === 'Int' ) return (int) $value;
                    return (string) $value;
                },
            ) );
        }

        // 4. Object Types (Register first)

        register_graphql_object_type( 'CultureEventImageNode', array(
            'fields' => array(
                'sourceUrl' => array( 'type' => 'String' ),
                'altText'   => array( 'type' => 'String' ),
            ),
        ) );

        register_graphql_object_type( 'CultureEventImageWrapper', array(
            'fields' => array(
                'node' => array( 'type' => 'CultureEventImageNode' ),
            ),
        ) );

        register_graphql_object_type( 'CultureEventTicketType', array(
            'fields' => array(
                'ticketName'     => array( 'type' => 'String' ),
                'ticketSlug'     => array( 'type' => 'String' ),
                'ticketInfo'     => array( 'type' => 'String' ),
                'ticketPrice'    => array( 'type' => 'String' ),
                'ticketAmount'   => array( 'type' => 'Int' ),
                'ticketCurrency' => array( 'type' => 'String' ),
            ),
        ) );

        register_graphql_object_type( 'CultureEventMetric', array(
            'fields' => array(
                'label' => array( 'type' => 'String' ),
                'value' => array( 'type' => 'String' ),
            ),
        ) );

        register_graphql_object_type( 'CultureEventScheduleItem', array(
            'fields' => array(
                'time'        => array( 'type' => 'String' ),
                'title'       => array( 'type' => 'String' ),
                'description' => array( 'type' => 'String' ),
                'access'      => array( 'type' => 'String' ),
            ),
        ) );

        register_graphql_object_type( 'CultureEventShowcaseItem', array(
            'fields' => array(
                'title'      => array( 'type' => 'String' ),
                'media'      => array( 'type' => 'String' ),
                'dimensions' => array( 'type' => 'String' ),
                'year'       => array( 'type' => 'String' ),
                'price'      => array( 'type' => 'String' ),
                'imageUrl'   => array(
                    'type'    => 'String',
                    'resolve' => function( $item ) {
                        if ( empty( $item['image'] ) ) return null;
                        $img_id = is_array( $item['image'] ) ? ( $item['image']['ID'] ?? $item['image']['id'] ?? null ) : $item['image'];
                        if ( ! $img_id ) return null;
                        return wp_get_attachment_url( (int) $img_id ) ?: null;
                    },
                ),
            ),
        ) );

        register_graphql_object_type( 'CultureEventPressDetails', array(
            'fields' => array(
                'eyebrow' => array( 'type' => 'String' ),
                'title'   => array( 'type' => 'String' ),
                'content' => array( 'type' => 'String' ),
                'link'    => array( 'type' => 'String' ),
            ),
        ) );

        // Journey Object Types
        register_graphql_object_type( 'CultureJourneyMeta', array(
            'fields' => array(
                'journeyEdition'    => array( 'type' => 'String' ),
                'journeyDates'      => array( 'type' => 'String' ),
                'journeyLocation'   => array( 'type' => 'String' ),
                'journeyPrice'      => array( 'type' => 'String' ),
                'journeySpots'      => array( 'type' => 'String' ),
                'journeyStatus'     => array( 'type' => 'String' ),
                'journeyInclusions' => array( 'type' => 'String' ),
                'journeyExclusions' => array( 'type' => 'String' ),
            ),
        ) );

        register_graphql_object_type( 'CultureJourneyDay', array(
            'fields' => array(
                'dayNumber'      => array( 'type' => 'String' ),
                'dayTitle'       => array( 'type' => 'String' ),
                'dayLocation'    => array( 'type' => 'String' ),
                'dayDescription' => array( 'type' => 'String' ),
                'activities'     => array( 'type' => array( 'list_of' => 'CultureJourneyActivity' ) ),
            ),
        ) );

        register_graphql_object_type( 'CultureJourneyActivity', array(
            'fields' => array(
                'activityTime'        => array( 'type' => 'String' ),
                'activityTitle'       => array( 'type' => 'String' ),
                'activityDescription' => array( 'type' => 'String' ),
                'activityType'        => array( 'type' => 'String' ),
            ),
        ) );

        register_graphql_object_type( 'CultureJourneyHost', array(
            'fields' => array(
                'hostName' => array( 'type' => 'String' ),
                'hostRole' => array( 'type' => 'String' ),
                'hostBio'  => array( 'type' => 'String' ),
                'hostImage' => array(
                    'type'    => 'MediaItem',
                    'resolve' => function( $host ) {
                        return isset( $host['hostImage'] ) ? get_post( $host['hostImage'] ) : null;
                    },
                ),
            ),
        ) );

        // 5. Advanced Event Fields (ACF Based)
        register_graphql_field( 'CultureEvent', 'metrics', array(
            'type'    => array( 'list_of' => 'CultureEventMetric' ),
            'resolve' => function( $post ) { 
                return function_exists('get_field') ? get_field( 'metrics', $post->databaseId ) : null; 
            },
        ) );
        register_graphql_field( 'CultureEvent', 'schedule', array(
            'type'    => array( 'list_of' => 'CultureEventScheduleItem' ),
            'resolve' => function( $post ) { 
                return function_exists('get_field') ? get_field( 'schedule', $post->databaseId ) : null; 
            },
        ) );
        register_graphql_field( 'CultureEvent', 'showcase', array(
            'type'    => array( 'list_of' => 'CultureEventShowcaseItem' ),
            'resolve' => function( $post ) { 
                return function_exists('get_field') ? get_field( 'showcase', $post->databaseId ) : null; 
            },
        ) );
        register_graphql_field( 'CultureEvent', 'pressDetails', array(
            'type'    => 'CultureEventPressDetails',
            'resolve' => function( $post ) { 
                return function_exists('get_field') ? get_field( 'press_details', $post->databaseId ) : null; 
            },
        ) );

        // New display / RSVP fields
        $new_event_acf_fields = array(
            'eventSubtype'       => array( 'type' => 'String', 'acf_key' => 'event_subtype' ),
            'aboutLabel'         => array( 'type' => 'String', 'acf_key' => 'about_label' ),
            'showcaseLabel'      => array( 'type' => 'String', 'acf_key' => 'showcase_label' ),
            'artistSectionLabel' => array( 'type' => 'String', 'acf_key' => 'artist_section_label' ),
            'artistLinkLabel'    => array( 'type' => 'String', 'acf_key' => 'artist_link_label' ),
            'venueAddress'       => array( 'type' => 'String', 'acf_key' => 'venue_address' ),
            'rsvpMembersNote'    => array( 'type' => 'String', 'acf_key' => 'rsvp_members_note' ),
            'rsvpCapacity'       => array( 'type' => 'Int',    'acf_key' => 'rsvp_capacity' ),
        );

        foreach ( $new_event_acf_fields as $field_name => $config ) {
            $acf_key    = $config['acf_key'];
            $field_type = $config['type'];
            register_graphql_field( 'CultureEvent', $field_name, array(
                'type'    => $field_type,
                'resolve' => function( $post ) use ( $acf_key, $field_type ) {
                    $value = function_exists('get_field') ? get_field( $acf_key, $post->databaseId ) : null;
                    if ( $field_type === 'Int' ) return (int) $value;
                    return (string) $value;
                },
            ) );
        }

        register_graphql_field( 'CultureEvent', 'rsvpTicketTypes', array(
            'type'    => array( 'list_of' => 'CultureEventTicketType' ),
            'resolve' => function( $post ) {
                if ( ! function_exists('get_field') ) return null;
                $rows = get_field( 'rsvp_ticket_types', $post->databaseId );
                if ( ! is_array( $rows ) ) return null;
                return array_map( function( $row ) {
                    return array(
                        'ticketName'     => $row['ticket_name']     ?? '',
                        'ticketSlug'     => $row['ticket_slug']     ?? '',
                        'ticketInfo'     => $row['ticket_info']     ?? '',
                        'ticketPrice'    => $row['ticket_price']    ?? null,
                        'ticketAmount'   => isset( $row['ticket_amount'] ) ? (int) $row['ticket_amount'] : 0,
                        'ticketCurrency' => $row['ticket_currency'] ?? 'NGN',
                    );
                }, $rows );
            },
        ) );

        // Relationship Resolvers
        register_graphql_field( 'CultureEvent', 'featuredHost', array(
            'type'    => 'CultureDirectory',
            'resolve' => function( $post, $args, $context ) {
                $host = function_exists('get_field') ? get_field( 'featured_host', $post->databaseId ) : null;
                if ( ! $host ) return null;
                if ( is_object( $host ) && isset( $host->ID ) ) {
                    $host_id = $host->ID;
                } elseif ( is_array( $host ) ) {
                    $host_id = $host['ID'] ?? $host['id'] ?? null;
                } else {
                    $host_id = is_numeric( $host ) ? (int) $host : null;
                }
                if ( ! $host_id ) return null;
                return $context->get_loader( 'post' )->load_deferred( (int) $host_id );
            },
        ) );
        register_graphql_field( 'CultureEvent', 'associatedJourney', array(
            'type'    => 'CultureJourney',
            'resolve' => function( $post ) {
                $journey_id = function_exists('get_field') ? get_field( 'associated_journey', $post->databaseId ) : null;
                if ( ! $journey_id ) return null;
                $journey_obj = get_post( $journey_id );
                return ( $journey_obj && $journey_obj->post_type === 'culture_journey' ) ? $journey_obj : null;
            },
        ) );

        // 6. Core Event Fields (Hybrid: Priority on ACF, fallback to Native Meta)
        $event_meta_fields = array(
            'eventDate'    => array( 'type' => 'String',  'acf_key' => 'event_date',  'meta_key' => '_culture_event_date' ),
            'endDate'      => array( 'type' => 'String',  'acf_key' => 'end_date',    'meta_key' => '_culture_event_end_date' ),
            'location'     => array( 'type' => 'String',  'acf_key' => 'location',    'meta_key' => '_culture_location' ),
            'admission'    => array( 'type' => 'String',  'acf_key' => 'admission',   'meta_key' => '_culture_admission' ),
            'isFeatured'     => array( 'type' => 'Boolean', 'acf_key' => 'is_featured',    'meta_key' => '_culture_is_featured' ),
            'isLiterati'     => array( 'type' => 'Boolean', 'acf_key' => 'event_is_literati', 'meta_key' => '_culture_event_is_literati' ),
            'isAiGenerated'  => array( 'type' => 'Boolean', 'acf_key' => 'ai_generated',  'meta_key' => '_culture_ai_generated' ),
            'tagline'      => array( 'type' => 'String',  'acf_key' => 'tagline',     'meta_key' => '_culture_tagline' ),
            'attribution'  => array( 'type' => 'String',  'acf_key' => 'attribution', 'meta_key' => '_culture_attribution' ),
            'openingHours' => array( 'type' => 'String',  'acf_key' => 'opening_hours', 'meta_key' => '_culture_opening_hours' ),
            'ticketingUrl' => array( 'type' => 'String',  'acf_key' => 'ticketing_url', 'meta_key' => '_culture_ticketing_url' ),
            'eventImageUrl'=> array( 'type' => 'String',  'acf_key' => 'event_image_url', 'meta_key' => '_culture_event_image_url' ),
        );

        foreach ( array( 'Post', 'CultureEvent' ) as $type_name ) {
            foreach ( $event_meta_fields as $field_name => $config ) {
                $acf_key  = $config['acf_key'];
                $meta_key = $config['meta_key'];
                $field_type = $config['type'];
                register_graphql_field( $type_name, $field_name, array(
                    'type'    => $field_type,
                    'resolve' => function( $post ) use ( $acf_key, $meta_key, $field_type ) {
                        // Priority 1: ACF field (non-prefixed)
                        $value = function_exists('get_field') ? get_field( $acf_key, $post->databaseId ) : null;
                        
                        // Priority 2: Native meta fallback (prefixed with _culture_)
                        if ( empty($value) ) {
                            $value = get_post_meta( $post->databaseId, $meta_key, true );
                        }

                        if ( $field_type === 'Boolean' ) return (bool) $value;
                        if ( empty( $value ) ) return null;
                        return (string) $value;
                    },
                ) );
            }
        }

        // 7. Journey Fields – Curated cultural journeys metadata
        register_graphql_field( 'CultureJourney', 'journeyMeta', array(
            'type'    => 'CultureJourneyMeta',
            'resolve' => function( $post ) {
                return function_exists('get_field') ? get_field( 'journey_meta', $post->databaseId ) : null;
            },
        ) );
        register_graphql_field( 'CultureJourney', 'journeyItinerary', array(
            'type'    => array( 'list_of' => 'CultureJourneyDay' ),
            'resolve' => function( $post ) {
                return function_exists('get_field') ? get_field( 'journey_itinerary', $post->databaseId ) : array();
            },
        ) );
        register_graphql_field( 'CultureJourney', 'journeyHosts', array(
            'type'    => array( 'list_of' => 'CultureJourneyHost' ),
            'resolve' => function( $post ) {
                return function_exists('get_field') ? get_field( 'journey_hosts', $post->databaseId ) : array();
            },
        ) );

        // Journey Meta Fields (individual properties for easier querying)
        $journey_meta_fields = array(
            'journeyEdition'    => array( 'type' => 'String',  'acf_key' => 'journey_edition' ),
            'journeyDates'      => array( 'type' => 'String',  'acf_key' => 'journey_dates' ),
            'journeyLocation'   => array( 'type' => 'String',  'acf_key' => 'journey_location' ),
            'journeyPrice'      => array( 'type' => 'String',  'acf_key' => 'journey_price' ),
            'journeySpots'      => array( 'type' => 'String',  'acf_key' => 'journey_spots' ),
            'journeyStatus'     => array( 'type' => 'String',  'acf_key' => 'journey_status' ), // active, completed, upcoming
            'journeyInclusions' => array( 'type' => 'String',  'acf_key' => 'journey_inclusions' ),
            'journeyExclusions' => array( 'type' => 'String',  'acf_key' => 'journey_exclusions' ),
        );

        foreach ( $journey_meta_fields as $field_name => $config ) {
            $acf_key = $config['acf_key'];
            $field_type = $config['type'];
            register_graphql_field( 'CultureJourney', $field_name, array(
                'type'    => $field_type,
                'resolve' => function( $post ) use ( $acf_key ) {
                    return function_exists('get_field') ? get_field( $acf_key, $post->databaseId ) : null;
                },
            ) );
        }

        // 8. Directory Profile Extensions
        register_graphql_field( 'CultureDirectory', 'websiteUrl', array(
            'type'    => 'String',
            'resolve' => function( $post ) {
                return function_exists('get_field') ? get_field( 'website_url', $post->databaseId ) : get_post_meta($post->databaseId, 'website_url', true);
            },
        ) );
        register_graphql_field( 'CultureDirectory', 'instagramHandle', array(
            'type'    => 'String',
            'resolve' => function( $post ) {
                return function_exists('get_field') ? get_field( 'instagram_handle', $post->databaseId ) : get_post_meta($post->databaseId, 'instagram_handle', true);
            },
        ) );
        register_graphql_field( 'CultureDirectory', 'twitterHandle', array(
            'type'    => 'String',
            'resolve' => function( $post ) {
                return function_exists('get_field') ? get_field( 'twitter_handle', $post->databaseId ) : get_post_meta($post->databaseId, 'twitter_handle', true);
            },
        ) );

        // Selected Works repeater field.
        register_graphql_object_type( 'CultureDirectoryWork', array(
            'description' => 'A single item in the Selected Works / Portfolio repeater.',
            'fields'      => array(
                'title'    => array( 'type' => 'String' ),
                'imageUrl' => array( 'type' => 'String' ),
            ),
        ) );

        register_graphql_field( 'CultureDirectory', 'selectedWorks', array(
            'type'    => array( 'list_of' => 'CultureDirectoryWork' ),
            'resolve' => function( $post ) {
                $rows = function_exists('get_field')
                    ? get_field( 'selected_works', $post->databaseId )
                    : array();
                if ( empty( $rows ) || ! is_array( $rows ) ) return array();
                return array_map( function( $row ) {
                    $image_url = '';
                    if ( ! empty( $row['image'] ) ) {
                        // Return format is 'id', so resolve to URL.
                        $image_url = is_numeric( $row['image'] )
                            ? wp_get_attachment_url( (int) $row['image'] )
                            : ( is_array( $row['image'] ) ? ( $row['image']['url'] ?? '' ) : $row['image'] );
                    }
                    return array(
                        'title'    => $row['title'] ?? '',
                        'imageUrl' => $image_url ?: '',
                    );
                }, $rows );
            },
        ) );

        // 9. Directory Infobox — flat object with per-type metadata fields.
        $infobox_meta_map = array(
            // person
            'born'               => 'dir_infobox_born',
            'died'               => 'dir_infobox_died',
            'nationality'        => 'dir_infobox_nationality',
            'occupation'         => 'dir_infobox_occupation',
            'knownFor'           => 'dir_infobox_known_for',
            'originCity'         => 'dir_infobox_origin_city',
            'activeYears'        => 'dir_infobox_active_years',
            'awards'             => 'dir_infobox_awards',
            'labels'             => 'dir_infobox_labels',
            'education'          => 'dir_infobox_education',
            // place
            'country'            => 'dir_infobox_country',
            'region'             => 'dir_infobox_region',
            'population'         => 'dir_infobox_population',
            'officialLanguage'   => 'dir_infobox_official_language',
            'currency'           => 'dir_infobox_currency',
            'founded'            => 'dir_infobox_founded',
            'area'               => 'dir_infobox_area',
            // movement
            'founders'           => 'dir_infobox_founders',
            'originCountry'      => 'dir_infobox_origin_country',
            'activePeriod'       => 'dir_infobox_active_period',
            'ideology'           => 'dir_infobox_ideology',
            'keyFigures'         => 'dir_infobox_key_figures',
            'relatedMovements'   => 'dir_infobox_related_movements',
            // genre
            'originDecade'       => 'dir_infobox_origin_decade',
            'instruments'        => 'dir_infobox_instruments',
            'tempoBpm'           => 'dir_infobox_tempo_bpm',
            'keyArtists'         => 'dir_infobox_key_artists',
            'relatedGenres'      => 'dir_infobox_related_genres',
            'subgenres'          => 'dir_infobox_subgenres',
            // concept
            'keyThinkers'        => 'dir_infobox_key_thinkers',
            'period'             => 'dir_infobox_period',
            'knownFor2'          => 'dir_infobox_known_for',   // alias: concept shares knownFor with person
            'relatedConcepts'    => 'dir_infobox_related_concepts',
            // film
            'director'           => 'dir_infobox_director',
            'year'               => 'dir_infobox_year',
            'starring'           => 'dir_infobox_starring',
            'cinematographer'    => 'dir_infobox_cinematographer',
            'language'           => 'dir_infobox_language',
            'distributor'        => 'dir_infobox_distributor',
            'runtime'            => 'dir_infobox_runtime',
            'productionCompany'  => 'dir_infobox_production_company',
            // book
            'author'             => 'dir_infobox_author',
            'yearPublished'      => 'dir_infobox_year_published',
            'genre'              => 'dir_infobox_genre',
            'publisher'          => 'dir_infobox_publisher',
            'pages'              => 'dir_infobox_pages',
            'isbn'               => 'dir_infobox_isbn',
            // artwork
            'artist'             => 'dir_infobox_artist',
            'medium'             => 'dir_infobox_medium',
            'dimensions'         => 'dir_infobox_dimensions',
            'currentLocation'    => 'dir_infobox_current_location',
            'artCollection'      => 'dir_infobox_art_collection',
            'style'              => 'dir_infobox_style',
            // food
            'foodType'           => 'dir_infobox_food_type',
            'mainIngredients'    => 'dir_infobox_main_ingredients',
            'alsoKnownAs'        => 'dir_infobox_also_known_as',
            'culturalContext'    => 'dir_infobox_cultural_context',
            // fashion
            'origin'             => 'dir_infobox_origin',
            'era'                => 'dir_infobox_era',
            'keyDesigners'       => 'dir_infobox_key_designers',
            'materials'          => 'dir_infobox_materials',
            'culturalSignificance' => 'dir_infobox_cultural_significance',
            // tv-series
            'creator'            => 'dir_infobox_creator',
            'network'            => 'dir_infobox_network',
            'seasons'            => 'dir_infobox_seasons',
            'years'              => 'dir_infobox_years',
        );

        // Build per-field resolvers for the infobox sub-type.
        $infobox_gql_fields = array();
        foreach ( $infobox_meta_map as $gql_name => $meta_key ) {
            // knownFor2 is an internal alias; expose it as knownFor on the type.
            $field_name = ( $gql_name === 'knownFor2' ) ? 'knownFor' : $gql_name;
            if ( ! isset( $infobox_gql_fields[ $field_name ] ) ) {
                $infobox_gql_fields[ $field_name ] = array(
                    'type'    => 'String',
                    'resolve' => function( $source ) use ( $meta_key ) {
                        return isset( $source[ $meta_key ] ) ? $source[ $meta_key ] : null;
                    },
                );
            }
        }

        register_graphql_object_type( 'CultureDirectoryInfobox', array(
            'description' => 'Per-type infobox metadata for a Culture Directory entry.',
            'fields'      => $infobox_gql_fields,
        ) );

        register_graphql_field( 'CultureDirectory', 'infobox', array(
            'type'    => 'CultureDirectoryInfobox',
            'resolve' => function( $post ) use ( $infobox_meta_map ) {
                $id   = $post->databaseId;
                $data = array();
                $has  = false;
                foreach ( $infobox_meta_map as $gql_name => $meta_key ) {
                    $val = get_post_meta( $id, $meta_key, true );
                    if ( ! empty( $val ) ) {
                        $data[ $meta_key ] = (string) $val;
                        $has = true;
                    } else {
                        $data[ $meta_key ] = null;
                    }
                }
                return $has ? $data : null;
            },
        ) );

        // 9b. Directory entry Phase 3 fields (partner, community aggregates)
        register_graphql_field( 'CultureDirectory', 'isPartner', array(
            'type'    => 'Boolean',
            'resolve' => function( $post ) {
                return get_post_meta( $post->databaseId, '_is_partner', true ) === '1';
            },
        ) );
        register_graphql_field( 'CultureDirectory', 'partnerStatus', array(
            'type'    => 'String',
            'resolve' => function( $post ) {
                return (string) get_post_meta( $post->databaseId, '_partner_status', true );
            },
        ) );
        register_graphql_field( 'CultureDirectory', 'partnerPerk', array(
            'type'    => 'String',
            'resolve' => function( $post ) {
                return (string) get_post_meta( $post->databaseId, '_partner_perk_template', true );
            },
        ) );
        register_graphql_field( 'CultureDirectory', 'communityReviewCount', array(
            'type'    => 'Int',
            'resolve' => function( $post ) {
                return (int) get_post_meta( $post->databaseId, '_community_review_count', true );
            },
        ) );
        register_graphql_field( 'CultureDirectory', 'averageRating', array(
            'type'    => 'Float',
            'resolve' => function( $post ) {
                $val = get_post_meta( $post->databaseId, '_average_rating', true );
                return $val ? (float) $val : null;
            },
        ) );

        // 10. Global Membership Settings
        register_graphql_object_type( 'CultureMembershipSettings', array(
            'description' => __( 'Global membership pricing and tier labels', 'culture-community' ),
            'fields'      => array(
                'patronLabel' => array( 'type' => 'String' ),
                'citizenLabel' => array( 'type' => 'String' ),
                'monthlyNgn'  => array( 'type' => 'Int' ),
                'yearlyNgn'   => array( 'type' => 'Int' ),
                'monthlyUsd'  => array( 'type' => 'Int' ),
                'yearlyUsd'   => array( 'type' => 'Int' ),
            ),
        ) );

        register_graphql_field( 'RootQuery', 'membershipSettings', array(
            'type'    => 'CultureMembershipSettings',
            'resolve' => function() {
                if ( ! class_exists( 'Culture_Settings' ) ) return null;
                return array(
                    'patronLabel' => Culture_Settings::get( 'culture_patron_label' ),
                    'citizenLabel' => Culture_Settings::get( 'culture_citizen_label' ),
                    'monthlyNgn'  => Culture_Settings::get( 'culture_paystack_amount_monthly_ngn' ),
                    'yearlyNgn'   => Culture_Settings::get( 'culture_paystack_amount_yearly_ngn' ),
                    'monthlyUsd'  => Culture_Settings::get( 'culture_paystack_amount_monthly_usd' ),
                    'yearlyUsd'   => Culture_Settings::get( 'culture_paystack_amount_yearly_usd' ),
                );
            },
        ) );

        // 10. Ad Settings
        register_graphql_object_type( 'CultureAdSettings', array(
            'description' => __( 'Google Ads / AdSense configuration managed from WP Admin → Advertising', 'culture-community' ),
            'fields'      => array(
                'adsEnabled'               => array( 'type' => 'Boolean' ),
                'publisherId'              => array( 'type' => 'String' ),
                'customScript'             => array( 'type' => 'String' ),
                'slotLeaderboardTop'       => array( 'type' => 'String' ),
                'slotLeaderboardMid'       => array( 'type' => 'String' ),
                'slotLeaderboardPreQuotes' => array( 'type' => 'String' ),
                'slotHeroSidebar'          => array( 'type' => 'String' ),
            ),
        ) );

        register_graphql_field( 'RootQuery', 'adSettings', array(
            'type'        => 'CultureAdSettings',
            'description' => __( 'Google Ads / AdSense slot configuration', 'culture-community' ),
            'resolve'     => function() {
                if ( ! class_exists( 'Culture_Settings' ) ) return null;
                return array(
                    'adsEnabled'               => (bool) Culture_Settings::get( 'culture_ads_enabled' ),
                    'publisherId'              => Culture_Settings::get( 'culture_ads_publisher_id' )                ?: null,
                    'customScript'             => Culture_Settings::get( 'culture_ads_custom_script' )              ?: null,
                    'slotLeaderboardTop'       => Culture_Settings::get( 'culture_ads_slot_leaderboard_top' )        ?: null,
                    'slotLeaderboardMid'       => Culture_Settings::get( 'culture_ads_slot_leaderboard_mid' )        ?: null,
                    'slotLeaderboardPreQuotes' => Culture_Settings::get( 'culture_ads_slot_leaderboard_pre_quotes' ) ?: null,
                    'slotHeroSidebar'          => Culture_Settings::get( 'culture_ads_slot_hero_sidebar' )           ?: null,
                );
            },
        ) );

        // Newsletter list field — exposed explicitly because metaValue() blocks underscore-prefixed meta.
        register_graphql_field( 'CultureNewsletter', 'nlList', array(
            'type'        => 'String',
            'description' => 'Which newsletter list this post belongs to (getmelit, culture-drop, etc.).',
            'resolve'     => function( $post ) {
                return (string) ( get_post_meta( $post->databaseId, '_culture_nl_list', true ) ?: '' );
            },
        ) );

        error_log( 'Culture Community: GraphQL fields registration completed.' );
    }

    /**
     * Register all custom post types.
     */
    public static function register_post_types() {
        // Event CPT – nested under Culture Community menu.
        register_post_type( 'culture_event', array(
            'labels' => array(
                'name'               => __( 'Community Events', 'culture-community' ),
                'singular_name'      => __( 'Community Event', 'culture-community' ),
                'add_new'            => __( 'Add New', 'culture-community' ),
                'add_new_item'       => __( 'Add New Community Event', 'culture-community' ),
                'edit_item'          => __( 'Edit Community Event', 'culture-community' ),
                'view_item'          => __( 'View Community Event', 'culture-community' ),
                'all_items'          => __( 'Events', 'culture-community' ),
                'search_items'       => __( 'Search Community Events', 'culture-community' ),
                'not_found'          => __( 'No community events found', 'culture-community' ),
            ),
            'public'              => true,
            'has_archive'         => true,
            'show_in_menu'        => 'culture-community',
            'menu_icon'           => 'dashicons-calendar-alt',
            'supports'            => array( 'title', 'editor', 'thumbnail', 'excerpt' ),
            'rewrite'             => array( 'slug' => 'events' ),
            'show_in_rest'        => true,
            'capability_type'     => 'post',
            // WPGraphQL support.
            'show_in_graphql'     => true,
            'graphql_single_name' => 'cultureEvent',
            'graphql_plural_name' => 'cultureEvents',
        ) );

        // Culture Directory CPT – wiki-like entries for people, places, movements, etc.
        register_post_type( 'culture_directory', array(
            'labels' => array(
                'name'               => __( 'Community Directory', 'culture-community' ),
                'singular_name'      => __( 'Directory Entry', 'culture-community' ),
                'add_new'            => __( 'Add New', 'culture-community' ),
                'add_new_item'       => __( 'Add New Entry', 'culture-community' ),
                'edit_item'          => __( 'Edit Entry', 'culture-community' ),
                'view_item'          => __( 'View Entry', 'culture-community' ),
                'all_items'          => __( 'Directory', 'culture-community' ),
                'search_items'       => __( 'Search Directory', 'culture-community' ),
                'not_found'          => __( 'No entries found', 'culture-community' ),
            ),
            'public'              => true,
            'show_ui'             => true,
            'has_archive'         => true,
            'show_in_menu'        => 'culture-community',
            'menu_icon'           => 'dashicons-book-alt',
            'supports'            => array( 'title', 'editor', 'thumbnail', 'excerpt', 'revisions' ),
            'rewrite'             => array( 'slug' => 'directory' ),
            'show_in_rest'        => true,
            'capability_type'     => 'post',
            // WPGraphQL support.
            'show_in_graphql'     => true,
            'graphql_single_name' => 'cultureDirectory',
            'graphql_plural_name' => 'cultureDirectories',
        ) );

        // Newsletter / Cultural Digest CPT – nested under Culture Community menu.
        register_post_type( 'culture_newsletter', array(
            'labels' => array(
                'name'               => __( 'Newsletters', 'culture-community' ),
                'singular_name'      => __( 'Newsletter', 'culture-community' ),
                'add_new'            => __( 'Add New', 'culture-community' ),
                'add_new_item'       => __( 'Add New Newsletter', 'culture-community' ),
                'edit_item'          => __( 'Edit Newsletter', 'culture-community' ),
                'view_item'          => __( 'View Newsletter', 'culture-community' ),
                'all_items'          => __( 'Newsletters', 'culture-community' ),
                'search_items'       => __( 'Search Newsletters', 'culture-community' ),
                'not_found'          => __( 'No newsletters found', 'culture-community' ),
            ),
            'public'              => true,
            'has_archive'         => true,
            'show_in_menu'        => 'culture-community',
            'menu_icon'           => 'dashicons-email-alt',
            'supports'            => array( 'title', 'editor', 'thumbnail', 'excerpt', 'comments' ),
            'rewrite'             => array( 'slug' => 'digest' ),
            'show_in_rest'        => true,
            'capability_type'     => 'post',
            // WPGraphQL support.
            'show_in_graphql'     => true,
            'graphql_single_name' => 'cultureNewsletter',
            'graphql_plural_name' => 'cultureNewsletters',
        ) );

        // Expose _culture_nl_list so the frontend knows which newsletter each post belongs to.
        register_post_meta( 'culture_newsletter', '_culture_nl_list', array(
            'type'         => 'string',
            'single'       => true,
            'default'      => '',
            'show_in_rest' => true,
        ) );
        // Expose _culture_nl_segment so the frontend can group regional editions.
        register_post_meta( 'culture_newsletter', '_culture_nl_segment', array(
            'type'         => 'string',
            'single'       => true,
            'default'      => '',
            'show_in_rest' => true,
        ) );

        // Quote CPT – nested under Culture Community menu.
        register_post_type( 'culture_quote', array(
            'labels' => array(
                'name'               => __( 'Quotes', 'culture-community' ),
                'singular_name'      => __( 'Quote', 'culture-community' ),
                'add_new'            => __( 'Add New', 'culture-community' ),
                'add_new_item'       => __( 'Add New Quote', 'culture-community' ),
                'edit_item'          => __( 'Edit Quote', 'culture-community' ),
                'view_item'          => __( 'View Quote', 'culture-community' ),
                'all_items'          => __( 'Quotes', 'culture-community' ),
                'search_items'       => __( 'Search Quotes', 'culture-community' ),
                'not_found'          => __( 'No quotes found', 'culture-community' ),
            ),
            'public'              => true,
            'has_archive'         => true,
            'show_in_menu'        => 'culture-community',
            'menu_icon'           => 'dashicons-format-quote',
            'supports'            => array( 'title', 'editor' ),
            'rewrite'             => array( 'slug' => 'quotes' ),
            'show_in_rest'        => true,
            'capability_type'     => 'post',
            // WPGraphQL support.
            'show_in_graphql'     => true,
            'graphql_single_name' => 'cultureQuote',
            'graphql_plural_name' => 'cultureQuotes',
        ) );

        // Journey CPT – curated cultural journeys.
        // Community Post CPT — member-submitted posts in the Connect feed.
        register_post_type( 'culture_post', array(
            'labels' => array(
                'name'               => __( 'Community Posts', 'culture-community' ),
                'singular_name'      => __( 'Community Post', 'culture-community' ),
                'add_new'            => __( 'Add New', 'culture-community' ),
                'add_new_item'       => __( 'Add New Community Post', 'culture-community' ),
                'edit_item'          => __( 'Edit Community Post', 'culture-community' ),
                'view_item'          => __( 'View Community Post', 'culture-community' ),
                'all_items'          => __( 'All Community Posts', 'culture-community' ),
                'search_items'       => __( 'Search Community Posts', 'culture-community' ),
                'not_found'          => __( 'No community posts found', 'culture-community' ),
            ),
            'public'              => true,
            'has_archive'         => false,
            'show_in_menu'        => 'culture-community',
            'menu_icon'           => 'dashicons-groups',
            'supports'            => array( 'title', 'editor', 'custom-fields', 'comments' ),
            'rewrite'             => array( 'slug' => 'community' ),
            'show_in_rest'        => true,
            'rest_base'           => 'community-posts',
            'capability_type'     => 'post',
        ) );

        register_post_type( 'culture_journey', array(
            'labels' => array(
                'name'               => __( 'Journeys', 'culture-community' ),
                'singular_name'      => __( 'Journey', 'culture-community' ),
                'add_new'            => __( 'Add New', 'culture-community' ),
                'add_new_item'       => __( 'Add New Journey', 'culture-community' ),
                'edit_item'          => __( 'Edit Journey', 'culture-community' ),
                'view_item'          => __( 'View Journey', 'culture-community' ),
                'all_items'          => __( 'Journeys', 'culture-community' ),
                'search_items'       => __( 'Search Journeys', 'culture-community' ),
                'not_found'          => __( 'No journeys found', 'culture-community' ),
            ),
            'public'              => true,
            'has_archive'         => true,
            'show_in_menu'        => 'culture-community',
            'menu_icon'           => 'dashicons-palmtree',
            'supports'            => array( 'title', 'editor', 'thumbnail', 'excerpt' ),
            'rewrite'             => array( 'slug' => 'journeys' ),
            'show_in_rest'        => true,
            'capability_type'     => 'post',
            'show_in_graphql'     => true,
            'graphql_single_name' => 'cultureJourney',
            'graphql_plural_name' => 'cultureJourneys',
        ) );

        // House Fellowship cluster CPT — structured entity, not a rendered page
        // (same rationale as culture_directory's earlier public=>false siblings:
        // it's surfaced only through dedicated screens/endpoints).
        register_post_type( 'culture_cluster', array(
            'labels' => array(
                'name'               => __( 'House Fellowship Clusters', 'culture-community' ),
                'singular_name'      => __( 'Cluster', 'culture-community' ),
                'add_new'            => __( 'Add New', 'culture-community' ),
                'add_new_item'       => __( 'Add New Cluster', 'culture-community' ),
                'edit_item'          => __( 'Edit Cluster', 'culture-community' ),
                'view_item'          => __( 'View Cluster', 'culture-community' ),
                'all_items'          => __( 'Clusters', 'culture-community' ),
                'search_items'       => __( 'Search Clusters', 'culture-community' ),
                'not_found'          => __( 'No clusters found', 'culture-community' ),
            ),
            'public'              => false,
            'show_ui'             => true,
            'show_in_menu'        => 'culture-community',
            'menu_icon'           => 'dashicons-groups',
            'supports'            => array( 'title' ),
            'show_in_rest'        => true,
            'rest_base'           => 'clusters',
            'capability_type'     => 'post',
        ) );
    }

    /**
     * Register custom taxonomies.
     */
    public static function register_taxonomies() {
        register_taxonomy( 'culture_access', array( 'post', 'culture_newsletter', 'culture_directory' ), array(
            'labels' => array(
                'name'              => __( 'Access Level', 'culture-community' ),
                'singular_name'     => __( 'Access Level', 'culture-community' ),
                'search_items'      => __( 'Search Access Levels', 'culture-community' ),
                'all_items'         => __( 'All Access Levels', 'culture-community' ),
                'edit_item'         => __( 'Edit Access Level', 'culture-community' ),
                'add_new_item'      => __( 'Add New Access Level', 'culture-community' ),
                'not_found'         => __( 'No access levels found', 'culture-community' ),
                'choose_from_most_used' => __( 'Choose from common access levels', 'culture-community' ),
            ),
            'hierarchical'        => true,
            'public'              => false,
            'publicly_queryable'  => false,
            'show_ui'             => true,
            'show_in_menu'        => true,
            'show_admin_column'   => true,
            'show_in_nav_menus'   => false,
            'show_tagcloud'       => false,
            'show_in_quick_edit'  => true,
            'show_in_rest'        => true,
            'rest_base'           => 'culture-access',
            'rewrite'             => false,
            'query_var'           => false,
            'show_in_graphql'     => true,
            'graphql_single_name' => 'cultureAccess',
            'graphql_plural_name' => 'cultureAccesses',
        ) );

        register_taxonomy( 'culture_quote_author', array( 'culture_quote' ), array(
            'labels' => array(
                'name'          => __( 'Quote Authors', 'culture-community' ),
                'singular_name' => __( 'Quote Author', 'culture-community' ),
                'search_items'  => __( 'Search Authors', 'culture-community' ),
                'all_items'     => __( 'All Authors', 'culture-community' ),
                'edit_item'     => __( 'Edit Author', 'culture-community' ),
                'add_new_item'  => __( 'Add New Author', 'culture-community' ),
            ),
            'hierarchical'        => false,
            'public'              => true,
            'show_in_rest'        => true,
            'show_in_menu'        => true,
            'rewrite'             => array( 'slug' => 'quotes-author' ),
            'show_in_graphql'     => true,
            'graphql_single_name' => 'quoteAuthor',
            'graphql_plural_name' => 'quoteAuthors',
        ) );

        register_taxonomy( 'culture_interest', array( 'culture_event', 'culture_newsletter', 'culture_directory' ), array(
            'labels' => array(
                'name'          => __( 'Interests', 'culture-community' ),
                'singular_name' => __( 'Interest', 'culture-community' ),
                'search_items'  => __( 'Search Interests', 'culture-community' ),
                'all_items'     => __( 'All Interests', 'culture-community' ),
                'edit_item'     => __( 'Edit Interest', 'culture-community' ),
                'add_new_item'  => __( 'Add New Interest', 'culture-community' ),
            ),
            'hierarchical'        => false,
            'public'              => true,
            'show_in_rest'        => true,
            'show_in_menu'        => true,
            'rewrite'             => array( 'slug' => 'interest' ),
            'show_in_graphql'     => true,
            'graphql_single_name' => 'cultureInterest',
            'graphql_plural_name' => 'cultureInterests',
        ) );

        register_taxonomy( 'culture_dir_type', array( 'culture_directory' ), array(
            'labels' => array(
                'name'          => __( 'Entry Type', 'culture-community' ),
                'singular_name' => __( 'Entry Type', 'culture-community' ),
                'search_items'  => __( 'Search Types', 'culture-community' ),
                'all_items'     => __( 'All Types', 'culture-community' ),
                'edit_item'         => __( 'Edit Type', 'culture-community' ),
                'add_new_item'      => __( 'Add New Type', 'culture-community' ),
            ),
            'hierarchical'        => false,
            'public'              => false,
            'publicly_queryable'  => false,
            'show_ui'             => true,
            'show_admin_column'   => true,
            'show_in_nav_menus'   => false,
            'show_tagcloud'       => false,
            'show_in_quick_edit'  => true,
            'show_in_rest'        => true,
            'rest_base'           => 'culture-dir-type',
            'rewrite'             => false,
            'query_var'           => false,
            'show_in_graphql'     => true,
            'graphql_single_name' => 'cultureDirectoryType',
            'graphql_plural_name' => 'cultureDirectoryTypes',
        ) );

        register_taxonomy( 'issue', array( 'post' ), array(
            'labels' => array(
                'name'              => __( 'Issues', 'culture-community' ),
                'singular_name'     => __( 'Issue', 'culture-community' ),
                'search_items'      => __( 'Search Issues', 'culture-community' ),
                'all_items'         => __( 'All Issues', 'culture-community' ),
                'edit_item'         => __( 'Edit Issue', 'culture-community' ),
                'add_new_item'      => __( 'Add New Issue', 'culture-community' ),
                'not_found'         => __( 'No issues found', 'culture-community' ),
                'menu_name'         => __( 'Issues', 'culture-community' ),
            ),
            'hierarchical'        => false,
            'public'              => true,
            'publicly_queryable'  => true,
            'show_ui'             => true,
            'show_in_menu'        => true,
            'show_admin_column'   => true,
            'show_in_nav_menus'   => true,
            'show_tagcloud'       => false,
            'show_in_quick_edit'  => true,
            'show_in_rest'        => true,
            'rest_base'           => 'issues',
            'rewrite'             => array( 'slug' => 'issue', 'with_front' => false ),
            'query_var'           => true,
            'show_in_graphql'     => true,
            'graphql_single_name' => 'issue',
            'graphql_plural_name' => 'issues',
        ) );

        // Register term meta for issues
        register_term_meta( 'issue', 'issue_number', array(
            'type'              => 'integer',
            'single'            => true,
            'show_in_rest'      => true,
            'sanitize_callback' => 'absint',
        ) );
        register_term_meta( 'issue', 'issue_subtitle', array(
            'type'              => 'string',
            'single'            => true,
            'show_in_rest'      => true,
            'sanitize_callback' => 'sanitize_text_field',
        ) );
        register_term_meta( 'issue', 'issue_editorial_note', array(
            'type'              => 'string',
            'single'            => true,
            'show_in_rest'      => true,
            'sanitize_callback' => 'sanitize_textarea_field',
        ) );
        register_term_meta( 'issue', 'issue_cover_image_url', array(
            'type'              => 'string',
            'single'            => true,
            'show_in_rest'      => true,
            'sanitize_callback' => 'esc_url_raw',
        ) );
    }

    /**
     * Register meta boxes for custom post types.
     */
    public static function register_meta_boxes() {
        add_meta_box( 'culture_event_meta', __( 'Event Details', 'culture-community' ), array( __CLASS__, 'render_event_meta_box' ), 'culture_event', 'normal', 'high' );
        add_meta_box( 'culture_event_checkin', __( 'Event Check-in QR', 'culture-community' ), array( __CLASS__, 'render_event_checkin_meta_box' ), 'culture_event', 'side', 'high' );
        add_meta_box( 'culture_directory_meta', __( 'Directory Entry Details', 'culture-community' ), array( __CLASS__, 'render_directory_meta_box' ), 'culture_directory', 'side', 'high' );
        add_meta_box( 'culture_partner_meta', __( 'Partner Programme', 'culture-community' ), array( __CLASS__, 'render_partner_meta_box' ), 'culture_directory', 'side', 'default' );
        add_meta_box( 'culture_quote_meta', __( 'Quote Details', 'culture-community' ), array( __CLASS__, 'render_quote_meta_box' ), 'culture_quote', 'normal', 'high' );
        add_meta_box( 'culture_as_told_to', __( 'As-Told-To', 'culture-community' ), array( __CLASS__, 'render_as_told_to_meta_box' ), 'post', 'side', 'high' );
    }

    public static function render_event_checkin_meta_box( $post ) {
        $has_token = ! empty( get_post_meta( $post->ID, '_event_checkin_token_hash', true ) );
        $nonce     = wp_create_nonce( 'culture_checkin_nonce_' . $post->ID );
        ?>
        <div id="culture-checkin-box">
            <?php if ( $has_token ) : ?>
                <p style="color:#16a34a;margin:0 0 8px">✓ Token generated</p>
            <?php endif; ?>
            <button type="button" class="button" onclick="cultureGenerateCheckin(<?php echo (int) $post->ID; ?>, '<?php echo esc_js( $nonce ); ?>')">
                <?php echo $has_token ? 'Regenerate QR' : 'Generate QR Token'; ?>
            </button>
            <div id="culture-checkin-result" style="margin-top:12px"></div>
        </div>
        <script>
        function cultureGenerateCheckin(eventId, nonce) {
            var fd = new FormData();
            fd.append('action', 'culture_generate_checkin_token');
            fd.append('event_id', eventId);
            fd.append('nonce', nonce);
            fetch(ajaxurl, { method: 'POST', body: fd })
                .then(function(r){ return r.json(); })
                .then(function(d){
                    if (d.success) {
                        var url = d.data.checkin_url;
                        document.getElementById('culture-checkin-result').innerHTML =
                            '<p style="word-break:break-all;font-size:11px;margin:0 0 8px"><strong>URL:</strong><br>' + url + '</p>' +
                            '<img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=' + encodeURIComponent(url) + '" style="max-width:180px;display:block">';
                    } else {
                        alert('Error generating token');
                    }
                });
        }
        </script>
        <?php
    }

    /** Saves as_told_to when Gutenberg updates the post via the REST API. */
    public static function ajax_generate_checkin_token() {
        $event_id = (int) ( $_POST['event_id'] ?? 0 );
        if ( ! check_ajax_referer( 'culture_checkin_nonce_' . $event_id, 'nonce', false ) ) {
            wp_send_json_error( 'Invalid nonce' );
        }
        if ( ! current_user_can( 'edit_posts' ) || get_post_type( $event_id ) !== 'culture_event' ) {
            wp_send_json_error( 'Unauthorized' );
        }
        $token = bin2hex( random_bytes( 16 ) );
        update_post_meta( $event_id, '_event_checkin_token_hash', hash( 'sha256', $token ) );
        $url = "https://web.themoveee.com/events/checkin?id={$event_id}&t={$token}";
        wp_send_json_success( array( 'checkin_url' => $url ) );
    }

    public static function save_as_told_to_rest( $post, $request ) {
        $params = $request->get_json_params();
        if ( isset( $params['meta']['as_told_to'] ) ) {
            update_post_meta( $post->ID, 'as_told_to', sanitize_text_field( $params['meta']['as_told_to'] ) );
        }
    }

    public static function register_as_told_to_meta() {
        register_post_meta( 'post', 'as_told_to', array(
            'type'              => 'string',
            'single'            => true,
            'show_in_rest'      => true,
            'default'           => '',
            'sanitize_callback' => 'sanitize_text_field',
            'auth_callback'     => function() { return current_user_can( 'edit_posts' ); },
        ) );
    }

    public static function render_as_told_to_meta_box( $post ) {
        wp_nonce_field( 'culture_as_told_to', 'culture_as_told_to_nonce' );
        $value = get_post_meta( $post->ID, 'as_told_to', true );
        ?>
        <p style="margin-bottom:6px;">
            <label for="as_told_to" style="display:block;margin-bottom:4px;font-weight:600;">
                <?php esc_html_e( 'Guest / Subject name', 'culture-community' ); ?>
            </label>
            <input
                type="text"
                id="as_told_to"
                name="as_told_to"
                value="<?php echo esc_attr( $value ); ?>"
                style="width:100%;"
                placeholder="e.g. Nonye Jennifer Amaechi"
            >
        </p>
        <p class="description" style="font-size:11px;color:#666;">
            <?php esc_html_e( 'When set, the byline reads: "Words by [Guest], as told to [WP Author]".', 'culture-community' ); ?>
        </p>
        <?php
    }

    public static function render_event_meta_box( $post ) {
        wp_nonce_field( 'culture_event_meta', 'culture_event_meta_nonce' );
        $event_date   = get_post_meta( $post->ID, '_culture_event_date', true );
        $is_physical  = get_post_meta( $post->ID, '_culture_is_physical', true );
        $capacity     = get_post_meta( $post->ID, '_culture_capacity', true );
        $organiser_id = (int) get_post_meta( $post->ID, '_culture_event_organiser_id', true );
        $organiser_title = $organiser_id ? get_the_title( $organiser_id ) : '';
        ?>
        <table class="form-table">
            <tr><th><label for="culture_event_date">Event Date</label></th><td><input type="datetime-local" id="culture_event_date" name="culture_event_date" value="<?php echo esc_attr( $event_date ); ?>" /></td></tr>
            <tr><th><label for="culture_is_physical">Physical Event</label></th><td><input type="checkbox" id="culture_is_physical" name="culture_is_physical" value="1" <?php checked( $is_physical, '1' ); ?> /></td></tr>
            <tr><th><label for="culture_capacity">Capacity</label></th><td><input type="number" id="culture_capacity" name="culture_capacity" value="<?php echo esc_attr( $capacity ); ?>" min="0" /></td></tr>
            <tr>
                <th><label for="culture_event_organiser_id">Organiser (Directory ID)</label></th>
                <td>
                    <input type="number" id="culture_event_organiser_id" name="culture_event_organiser_id" value="<?php echo esc_attr( $organiser_id ?: '' ); ?>" min="1" style="width:100px;" />
                    <?php if ( $organiser_title ) : ?>
                        <span style="margin-left:8px;color:#2e7d32;font-weight:600;"><?php echo esc_html( $organiser_title ); ?></span>
                    <?php endif; ?>
                    <p class="description">Enter the post ID of a Culture Directory entry. Leave blank for none.</p>
                </td>
            </tr>
        </table>
        <?php
    }

    public static function render_directory_meta_box( $post ) {
        wp_nonce_field( 'culture_directory_meta', 'culture_directory_meta_nonce' );
        $ai_generated  = get_post_meta( $post->ID, '_culture_dir_ai_generated', true );
        $submitted_by  = get_post_meta( $post->ID, '_culture_dir_submitted_by', true );
        $submitter     = $submitted_by ? get_userdata( (int) $submitted_by ) : null;
        $city          = get_post_meta( $post->ID, '_entry_city', true );
        ?>
        <table class="form-table">
            <tr><th><label for="culture_dir_city">City / Location</label></th><td><input type="text" id="culture_dir_city" name="culture_dir_city" value="<?php echo esc_attr( $city ); ?>" class="regular-text" placeholder="e.g. London, Lagos, New York" /></td></tr>
            <tr><th><label for="culture_dir_ai_generated">AI Generated</label></th><td><input type="checkbox" id="culture_dir_ai_generated" name="culture_dir_ai_generated" value="1" <?php checked( $ai_generated, '1' ); ?> /></td></tr>
            <?php if ( $submitter ) : ?><tr><th>Submitted By</th><td><a href="<?php echo esc_url( get_edit_user_link( $submitter->ID ) ); ?>"><?php echo esc_html( $submitter->display_name ); ?></a></td></tr><?php endif; ?>
        </table>
        <?php
    }

    public static function render_partner_meta_box( $post ) {
        wp_nonce_field( 'culture_partner_meta', 'culture_partner_meta_nonce' );
        $is_partner   = get_post_meta( $post->ID, '_is_partner', true );
        $status       = get_post_meta( $post->ID, '_partner_status', true ) ?: 'pending';
        $perk         = get_post_meta( $post->ID, '_partner_perk_template', true );
        $review_count = (int) get_post_meta( $post->ID, '_community_review_count', true );
        $avg_rating   = (float) get_post_meta( $post->ID, '_average_rating', true );
        ?>
        <table class="form-table">
            <tr>
                <th><label for="culture_is_partner">Is Partner</label></th>
                <td><input type="checkbox" id="culture_is_partner" name="culture_is_partner" value="1" <?php checked( $is_partner, '1' ); ?> /></td>
            </tr>
            <tr>
                <th><label for="culture_partner_status">Status</label></th>
                <td>
                    <select id="culture_partner_status" name="culture_partner_status">
                        <option value="pending"  <?php selected( $status, 'pending' ); ?>>Pending</option>
                        <option value="active"   <?php selected( $status, 'active' ); ?>>Active</option>
                        <option value="paused"   <?php selected( $status, 'paused' ); ?>>Paused</option>
                    </select>
                </td>
            </tr>
            <tr>
                <th><label for="culture_partner_perk">Default Perk</label></th>
                <td><input type="text" id="culture_partner_perk" name="culture_partner_perk" value="<?php echo esc_attr( $perk ); ?>" class="regular-text" placeholder="e.g. £5 off a £20 spend" /></td>
            </tr>
            <?php if ( $review_count || $avg_rating ) : ?>
            <tr>
                <th>Community</th>
                <td><?php echo absint( $review_count ); ?> review<?php echo $review_count !== 1 ? 's' : ''; ?><?php if ( $avg_rating ) echo ' · ' . number_format( $avg_rating, 1 ) . '★'; ?></td>
            </tr>
            <?php endif; ?>
        </table>
        <?php
    }

    public static function render_quote_meta_box( $post ) {
        wp_nonce_field( 'culture_quote_meta', 'culture_quote_meta_nonce' );
        $source  = get_post_meta( $post->ID, '_quote_source', true );
        $user_id = get_post_meta( $post->ID, '_quote_user_id', true );
        $likes   = get_post_meta( $post->ID, '_quote_likes', true ) ?: 0;
        $reports = get_post_meta( $post->ID, '_quote_reports', true ) ?: 0;
        ?>
        <table class="form-table">
            <tr><th><label for="quote_source">Source</label></th><td><input type="text" id="quote_source" name="quote_source" value="<?php echo esc_attr( $source ); ?>" class="regular-text" /></td></tr>
            <tr><th><label for="quote_user_id">Submitted By (User ID)</label></th><td><input type="number" id="quote_user_id" name="quote_user_id" value="<?php echo esc_attr( $user_id ); ?>" /></td></tr>
            <tr><th>Stats</th><td>Likes: <?php echo absint( $likes ); ?> | Reports: <?php echo absint( $reports ); ?></td></tr>
        </table>
        <?php
    }

    public static function save_meta_boxes( $post_id ) {
        // Nonce verification alone proves the request originated from the
        // edit screen, not that this user is allowed to edit this specific
        // post — save_post can still fire from contexts where that capability
        // isn't guaranteed (e.g. another plugin calling wp_insert_post()
        // directly). Check it once up front for all nonce-gated blocks below.
        if ( ! current_user_can( 'edit_post', $post_id ) ) {
            return;
        }

        if ( isset( $_POST['culture_directory_meta_nonce'] ) && wp_verify_nonce( $_POST['culture_directory_meta_nonce'], 'culture_directory_meta' ) ) {
            update_post_meta( $post_id, '_culture_dir_ai_generated', isset( $_POST['culture_dir_ai_generated'] ) ? '1' : '0' );
            if ( isset( $_POST['culture_dir_city'] ) ) {
                update_post_meta( $post_id, '_entry_city', sanitize_text_field( $_POST['culture_dir_city'] ) );
            }
        }
        if ( isset( $_POST['culture_partner_meta_nonce'] ) && wp_verify_nonce( $_POST['culture_partner_meta_nonce'], 'culture_partner_meta' ) ) {
            update_post_meta( $post_id, '_is_partner', isset( $_POST['culture_is_partner'] ) ? '1' : '0' );
            if ( isset( $_POST['culture_partner_status'] ) ) {
                $allowed_statuses = array( 'pending', 'active', 'paused' );
                $status = sanitize_key( $_POST['culture_partner_status'] );
                update_post_meta( $post_id, '_partner_status', in_array( $status, $allowed_statuses, true ) ? $status : 'pending' );
            }
            if ( isset( $_POST['culture_partner_perk'] ) ) {
                update_post_meta( $post_id, '_partner_perk_template', sanitize_text_field( $_POST['culture_partner_perk'] ) );
            }
        }
        if ( isset( $_POST['culture_event_meta_nonce'] ) && wp_verify_nonce( $_POST['culture_event_meta_nonce'], 'culture_event_meta' ) ) {
            if ( isset( $_POST['culture_event_date'] ) ) update_post_meta( $post_id, '_culture_event_date', sanitize_text_field( $_POST['culture_event_date'] ) );
            update_post_meta( $post_id, '_culture_is_physical', isset( $_POST['culture_is_physical'] ) ? '1' : '0' );
            if ( isset( $_POST['culture_capacity'] ) ) update_post_meta( $post_id, '_culture_capacity', absint( $_POST['culture_capacity'] ) );
            if ( isset( $_POST['culture_event_organiser_id'] ) ) {
                $oid = absint( $_POST['culture_event_organiser_id'] );
                if ( $oid > 0 ) {
                    update_post_meta( $post_id, '_culture_event_organiser_id', $oid );
                } else {
                    delete_post_meta( $post_id, '_culture_event_organiser_id' );
                }
            }
        }
        if ( isset( $_POST['culture_quote_meta_nonce'] ) && wp_verify_nonce( $_POST['culture_quote_meta_nonce'], 'culture_quote_meta' ) ) {
            if ( isset( $_POST['quote_source'] ) ) update_post_meta( $post_id, '_quote_source', sanitize_text_field( $_POST['quote_source'] ) );
            if ( isset( $_POST['quote_user_id'] ) ) update_post_meta( $post_id, '_quote_user_id', absint( $_POST['quote_user_id'] ) );
        }
        if ( isset( $_POST['culture_as_told_to_nonce'] ) && wp_verify_nonce( $_POST['culture_as_told_to_nonce'], 'culture_as_told_to' ) ) {
            update_post_meta( $post_id, 'as_told_to', sanitize_text_field( $_POST['as_told_to'] ?? '' ) );
        }
        // Gutenberg saves via REST — the nonce above won't be present, so also save
        // when the field arrives without a nonce (capability check is sufficient here
        // because register_post_meta auth_callback already guards REST writes).
        if ( ! isset( $_POST['culture_as_told_to_nonce'] ) && isset( $_POST['as_told_to'] ) && current_user_can( 'edit_post', $post_id ) ) {
            update_post_meta( $post_id, 'as_told_to', sanitize_text_field( $_POST['as_told_to'] ) );
        }
    }

    /**
     * After ACF saves a culture_event, resolve showcase image attachment IDs to
     * URLs and store them in _culture_event_showcase_urls (JSON). The Next.js
     * frontend reads this field to avoid batching media API calls at render time.
     * Runs at acf/save_post priority 20 (after ACF writes its fields at priority 5).
     */
    public static function cache_event_showcase_urls( $post_id ) {
        if ( get_post_type( $post_id ) !== 'culture_event' ) {
            return;
        }
        if ( ! function_exists( 'get_field' ) ) {
            return;
        }
        $showcase = get_field( 'showcase', $post_id );
        if ( ! is_array( $showcase ) || empty( $showcase ) ) {
            return;
        }
        $urls = array();
        foreach ( $showcase as $item ) {
            $img = $item['image'] ?? null;
            $url = '';
            if ( is_array( $img ) ) {
                $url = $img['url'] ?? $img['sizes']['large'] ?? $img['sizes']['full'] ?? '';
            } elseif ( is_numeric( $img ) ) {
                $src = wp_get_attachment_image_url( (int) $img, 'large' );
                $url = $src ?: wp_get_attachment_url( (int) $img ) ?: '';
            } elseif ( is_string( $img ) ) {
                $url = $img;
            }
            $urls[] = esc_url_raw( $url );
        }
        update_post_meta( $post_id, '_culture_event_showcase_urls', wp_json_encode( $urls ) );
    }

    // ── Issue taxonomy admin UI ──────────────────────────────────────────

    public static function issue_add_form_fields() {
        wp_nonce_field( 'issue_meta_save', 'issue_meta_nonce' );
        ?>
        <div class="form-field">
            <label for="issue_number"><?php esc_html_e( 'Issue Number', 'culture-community' ); ?></label>
            <input type="number" id="issue_number" name="issue_number" value="" min="1" style="width:80px;">
        </div>
        <div class="form-field">
            <label for="issue_subtitle"><?php esc_html_e( 'Subtitle / Theme', 'culture-community' ); ?></label>
            <input type="text" id="issue_subtitle" name="issue_subtitle" value="">
        </div>
        <div class="form-field">
            <label for="issue_editorial_note"><?php esc_html_e( 'Editorial Note', 'culture-community' ); ?></label>
            <textarea id="issue_editorial_note" name="issue_editorial_note" rows="4" cols="40"></textarea>
            <p class="description"><?php esc_html_e( 'Short editor\'s note shown on the issue page and homepage.', 'culture-community' ); ?></p>
        </div>
        <div class="form-field">
            <label for="issue_cover_image_url"><?php esc_html_e( 'Cover Image URL', 'culture-community' ); ?></label>
            <input type="url" id="issue_cover_image_url" name="issue_cover_image_url" value="">
            <p class="description"><?php esc_html_e( 'Full URL of the cover image (upload to Media Library and copy the URL).', 'culture-community' ); ?></p>
        </div>
        <?php
    }

    public static function issue_edit_form_fields( $term ) {
        $number   = get_term_meta( $term->term_id, 'issue_number', true );
        $subtitle = get_term_meta( $term->term_id, 'issue_subtitle', true );
        $note     = get_term_meta( $term->term_id, 'issue_editorial_note', true );
        $cover    = get_term_meta( $term->term_id, 'issue_cover_image_url', true );
        wp_nonce_field( 'issue_meta_save', 'issue_meta_nonce' );
        ?>
        <tr class="form-field">
            <th scope="row"><label for="issue_number"><?php esc_html_e( 'Issue Number', 'culture-community' ); ?></label></th>
            <td><input type="number" id="issue_number" name="issue_number" value="<?php echo esc_attr( $number ); ?>" min="1" style="width:80px;"></td>
        </tr>
        <tr class="form-field">
            <th scope="row"><label for="issue_subtitle"><?php esc_html_e( 'Subtitle / Theme', 'culture-community' ); ?></label></th>
            <td><input type="text" id="issue_subtitle" name="issue_subtitle" value="<?php echo esc_attr( $subtitle ); ?>"></td>
        </tr>
        <tr class="form-field">
            <th scope="row"><label for="issue_editorial_note"><?php esc_html_e( 'Editorial Note', 'culture-community' ); ?></label></th>
            <td>
                <textarea id="issue_editorial_note" name="issue_editorial_note" rows="4" cols="50"><?php echo esc_textarea( $note ); ?></textarea>
                <p class="description"><?php esc_html_e( 'Short editor\'s note shown on the issue page and homepage.', 'culture-community' ); ?></p>
            </td>
        </tr>
        <tr class="form-field">
            <th scope="row"><label for="issue_cover_image_url"><?php esc_html_e( 'Cover Image URL', 'culture-community' ); ?></label></th>
            <td>
                <?php if ( $cover ) : ?>
                    <img src="<?php echo esc_url( $cover ); ?>" style="max-width:120px;display:block;margin-bottom:8px;">
                <?php endif; ?>
                <input type="url" id="issue_cover_image_url" name="issue_cover_image_url" value="<?php echo esc_attr( $cover ); ?>" style="width:100%;">
                <p class="description"><?php esc_html_e( 'Full URL — upload to Media Library, open the image, and copy the File URL.', 'culture-community' ); ?></p>
            </td>
        </tr>
        <?php
    }

    public static function issue_save_meta( $term_id ) {
        if ( ! isset( $_POST['issue_meta_nonce'] ) || ! wp_verify_nonce( $_POST['issue_meta_nonce'], 'issue_meta_save' ) ) {
            return;
        }
        if ( isset( $_POST['issue_number'] ) ) {
            update_term_meta( $term_id, 'issue_number', absint( $_POST['issue_number'] ) );
        }
        if ( isset( $_POST['issue_subtitle'] ) ) {
            update_term_meta( $term_id, 'issue_subtitle', sanitize_text_field( $_POST['issue_subtitle'] ) );
        }
        if ( isset( $_POST['issue_editorial_note'] ) ) {
            update_term_meta( $term_id, 'issue_editorial_note', sanitize_textarea_field( $_POST['issue_editorial_note'] ) );
        }
        if ( isset( $_POST['issue_cover_image_url'] ) ) {
            update_term_meta( $term_id, 'issue_cover_image_url', esc_url_raw( $_POST['issue_cover_image_url'] ) );
        }
    }

    /**
     * Exclude expired culture_event posts from the WP REST API.
     * An event is expired when today is past its end_date, or past its
     * event_date if no end_date is set.
     *
     * Implemented as a single raw-SQL lookup (2 LEFT JOINs) rather than a
     * WP_Query meta_query, which previously expanded into ~5 separate
     * LEFT JOINs against the unindexed wp_postmeta.meta_value column
     * (one OR-branch used NOT EXISTS, two used DATE-cast comparisons) and
     * was timing out in production. See "Raw SQL REST endpoints" in
     * CLAUDE.md for the established pattern this follows.
     */
    public static function exclude_expired_events( $args, $request ) {
        global $wpdb;
        $today = gmdate( 'Y-m-d' );

        $ids = $wpdb->get_col( $wpdb->prepare(
            "SELECT p.ID FROM {$wpdb->posts} p
             LEFT JOIN {$wpdb->postmeta} end_meta ON end_meta.post_id = p.ID AND end_meta.meta_key = '_culture_event_end_date'
             LEFT JOIN {$wpdb->postmeta} date_meta ON date_meta.post_id = p.ID AND date_meta.meta_key = '_culture_event_date'
             WHERE p.post_type = 'culture_event'
               AND (
                 ( end_meta.meta_value IS NOT NULL AND end_meta.meta_value != '' AND CAST(end_meta.meta_value AS DATE) >= %s )
                 OR
                 ( ( end_meta.meta_value IS NULL OR end_meta.meta_value = '' ) AND CAST(date_meta.meta_value AS DATE) >= %s )
               )",
            $today,
            $today
        ) );

        $ids = array_map( 'intval', $ids );

        if ( empty( $ids ) ) {
            // No upcoming events — force an empty result set (an empty
            // post__in array is ignored by WP_Query and would return
            // everything instead of nothing).
            $ids = array( 0 );
        }

        if ( ! empty( $args['post__in'] ) ) {
            $ids = array_values( array_intersect( $args['post__in'], $ids ) );
            if ( empty( $ids ) ) $ids = array( 0 );
        }

        $args['post__in'] = $ids;

        return $args;
    }
}
