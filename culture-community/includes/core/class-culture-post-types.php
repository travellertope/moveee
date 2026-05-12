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
        add_action( 'save_post', array( __CLASS__, 'save_meta_boxes' ) );
        add_action( 'graphql_register_types', array( __CLASS__, 'register_graphql_fields' ) );
    }

    /**
     * Expose key private meta fields via the WP REST API so the Next.js
     * REST fallback can read them (e.g. isAiGenerated on events).
     */
    public static function register_rest_meta_fields() {
        $event_meta = array(
            '_culture_ai_generated'  => array( 'type' => 'string' ),
            '_culture_event_date'    => array( 'type' => 'string' ),
            '_culture_end_date'      => array( 'type' => 'string' ),
            '_culture_location'      => array( 'type' => 'string' ),
            '_culture_event_city'    => array( 'type' => 'string' ),
            '_culture_admission'     => array( 'type' => 'string' ),
            '_culture_ticketing_url' => array( 'type' => 'string' ),
            '_culture_tagline'       => array( 'type' => 'string' ),
            '_culture_is_featured'   => array( 'type' => 'string' ),
        );
        foreach ( $event_meta as $meta_key => $args ) {
            register_post_meta( 'culture_event', $meta_key, array(
                'type'         => $args['type'],
                'single'       => true,
                'show_in_rest' => true,
                'auth_callback' => '__return_true',
            ) );
        }
    }

    /**
     * Register custom meta fields on WPGraphQL types so the Next.js frontend
     * can query them.
     */
    public static function register_graphql_fields() {
        error_log( 'Culture Community: Registering GraphQL fields...' );
        if ( ! function_exists( 'register_graphql_field' ) ) {
            error_log( 'Culture Community: register_graphql_field function not found!' );
            return;
        }

        // 1. Quotes
        $quote_fields = array(
            'quoteSource'  => array( 'type' => 'String', 'meta_key' => '_quote_source' ),
            'quoteLikes'   => array( 'type' => 'Int',    'meta_key' => '_quote_likes' ),
            'quoteReports' => array( 'type' => 'Int',    'meta_key' => '_quote_reports' ),
            'quoteUserId'  => array( 'type' => 'Int',    'meta_key' => '_quote_user_id' ),
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
            'chapterId'     => array( 'type' => 'Int',     'meta_key' => '_culture_chapter_id' ),
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

        // 3. Chapters
        $chapter_fields = array(
            'latitude'  => array( 'type' => 'String', 'meta_key' => '_culture_location_lat' ),
            'longitude' => array( 'type' => 'String', 'meta_key' => '_culture_location_lng' ),
            'lat'       => array( 'type' => 'String', 'meta_key' => '_culture_location_lat' ), // alias
            'lng'       => array( 'type' => 'String', 'meta_key' => '_culture_location_lng' ), // alias
            'leaderId'  => array( 'type' => 'Int',    'meta_key' => '_culture_chapter_leader_id' ),
        );

        foreach ( $chapter_fields as $field_name => $config ) {
            $meta_key = $config['meta_key'];
            $type     = $config['type'];
            register_graphql_field( 'CultureChapter', $field_name, array(
                'type'    => $type,
                'resolve' => function( $post ) use ( $meta_key, $type ) {
                    $value = get_post_meta( $post->databaseId, $meta_key, true );
                    if ( $type === 'Int' ) return (int) $value;
                    return (string) $value;
                },
            ) );
        }

        register_graphql_field( 'CultureChapter', 'leaderName', array(
            'type'    => 'String',
            'resolve' => function( $post ) {
                $leader_id = get_post_meta( $post->databaseId, '_culture_chapter_leader_id', true );
                if ( ! $leader_id ) return null;
                $leader = get_userdata( $leader_id );
                return $leader ? $leader->display_name : null;
            },
        ) );

        register_graphql_field( 'CultureChapter', 'memberCount', array(
            'type'    => 'Int',
            'resolve' => function( $post ) {
                $p_count = count( get_users( array('meta_key' => '_culture_primary_chapter_id', 'meta_value' => $post->databaseId, 'fields' => 'ID') ) );
                $s_count = count( get_users( array('meta_key' => '_culture_secondary_chapter_id', 'meta_value' => $post->databaseId, 'fields' => 'ID') ) );
                return $p_count + $s_count;
            },
        ) );

        register_graphql_field( 'CultureChapter', 'relatedEvents', array(
            'type'    => array( 'list_of' => 'Post' ),
            'resolve' => function( $post ) {
                return get_posts( array(
                    'post_type'      => 'culture_event',
                    'posts_per_page' => 10,
                    'meta_query'     => array(
                        array('key' => '_culture_chapter_id', 'value' => $post->databaseId),
                        array('key' => '_culture_event_date', 'value' => current_time( 'Y-m-d\TH:i' ), 'compare' => '>=', 'type' => 'DATETIME'),
                    ),
                    'meta_key' => '_culture_event_date', 'orderby' => 'meta_value', 'order' => 'ASC',
                ) );
            },
        ) );

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
                'image'      => array(
                    'type'    => 'MediaItem',
                    'resolve' => function( $item ) {
                        return isset( $item['image'] ) ? get_post( $item['image'] ) : null;
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
            'eventSubtype'   => array( 'type' => 'String', 'acf_key' => 'event_subtype' ),
            'aboutLabel'     => array( 'type' => 'String', 'acf_key' => 'about_label' ),
            'venueAddress'   => array( 'type' => 'String', 'acf_key' => 'venue_address' ),
            'galleryRunText' => array( 'type' => 'String', 'acf_key' => 'gallery_run_text' ),
            'rsvpMembersNote' => array( 'type' => 'String', 'acf_key' => 'rsvp_members_note' ),
            'rsvpCapacity'   => array( 'type' => 'Int',    'acf_key' => 'rsvp_capacity' ),
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

        register_graphql_field( 'CultureEvent', 'onViewImage', array(
            'type'    => 'CultureEventImageWrapper',
            'resolve' => function( $post ) {
                if ( ! function_exists('get_field') ) return null;
                $img = get_field( 'on_view_image', $post->databaseId );
                if ( empty( $img ) ) return null;
                return array(
                    'node' => array(
                        'sourceUrl' => $img['url'] ?? '',
                        'altText'   => $img['alt'] ?? '',
                    ),
                );
            },
        ) );

        // Relationship Resolvers (using native WP_Post objects for maximum stability)
        register_graphql_field( 'CultureEvent', 'featuredHost', array(
            'type'    => 'CultureDirectory',
            'resolve' => function( $post ) {
                $host_id = function_exists('get_field') ? get_field( 'featured_host', $post->databaseId ) : null;
                if ( ! $host_id ) return null;
                $host_obj = get_post( $host_id );
                return ( $host_obj && $host_obj->post_type === 'culture_directory' ) ? $host_obj : null;
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
            'endDate'      => array( 'type' => 'String',  'acf_key' => 'end_date',    'meta_key' => '_culture_end_date' ),
            'location'     => array( 'type' => 'String',  'acf_key' => 'location',    'meta_key' => '_culture_location' ),
            'admission'    => array( 'type' => 'String',  'acf_key' => 'admission',   'meta_key' => '_culture_admission' ),
            'isFeatured'     => array( 'type' => 'Boolean', 'acf_key' => 'is_featured',    'meta_key' => '_culture_is_featured' ),
            'isAiGenerated'  => array( 'type' => 'Boolean', 'acf_key' => 'ai_generated',  'meta_key' => '_culture_ai_generated' ),
            'tagline'      => array( 'type' => 'String',  'acf_key' => 'tagline',     'meta_key' => '_culture_tagline' ),
            'attribution'  => array( 'type' => 'String',  'acf_key' => 'attribution', 'meta_key' => '_culture_attribution' ),
            'openingHours' => array( 'type' => 'String',  'acf_key' => 'opening_hours', 'meta_key' => '_culture_opening_hours' ),
            'ticketingUrl' => array( 'type' => 'String',  'acf_key' => 'ticketing_url', 'meta_key' => '_culture_ticketing_url' ),
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

                        // Special Fallback for eventDate -> use post publication date
                        if ( $field_name === 'eventDate' && empty($value) ) {
                            $value = get_the_date( 'Y-m-d\TH:i:s', $post->databaseId );
                        }

                        if ( $field_type === 'Boolean' ) return (bool) $value;
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

        error_log( 'Culture Community: GraphQL fields registration completed.' );
    }

    /**
     * Register all custom post types.
     */
    public static function register_post_types() {
        // Chapter CPT – nested under Culture Community menu.
        register_post_type( 'culture_chapter', array(
            'labels' => array(
                'name'               => __( 'Chapters', 'culture-community' ),
                'singular_name'      => __( 'Chapter', 'culture-community' ),
                'add_new'            => __( 'Add New', 'culture-community' ),
                'add_new_item'       => __( 'Add New Chapter', 'culture-community' ),
                'edit_item'          => __( 'Edit Chapter', 'culture-community' ),
                'view_item'          => __( 'View Chapter', 'culture-community' ),
                'all_items'          => __( 'Chapters', 'culture-community' ),
                'search_items'       => __( 'Search Chapters', 'culture-community' ),
                'not_found'          => __( 'No chapters found', 'culture-community' ),
            ),
            'public'              => true,
            'has_archive'         => true,
            'show_in_menu'        => 'culture-community',
            'menu_icon'           => 'dashicons-location-alt',
            'supports'            => array( 'title', 'editor', 'thumbnail', 'excerpt' ),
            'rewrite'             => array( 'slug' => 'chapters' ),
            'show_in_rest'        => true,
            'capability_type'     => 'post',
            // WPGraphQL support.
            'show_in_graphql'     => true,
            'graphql_single_name' => 'cultureChapter',
            'graphql_plural_name' => 'cultureChapters',
        ) );

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

        register_taxonomy( 'culture_interest', array( 'culture_event', 'culture_newsletter', 'culture_chapter', 'culture_directory' ), array(
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
    }

    /**
     * Register meta boxes for custom post types.
     */
    public static function register_meta_boxes() {
        add_meta_box( 'culture_chapter_meta', __( 'Chapter Details', 'culture-community' ), array( __CLASS__, 'render_chapter_meta_box' ), 'culture_chapter', 'normal', 'high' );
        add_meta_box( 'culture_event_meta', __( 'Event Details', 'culture-community' ), array( __CLASS__, 'render_event_meta_box' ), 'culture_event', 'normal', 'high' );
        add_meta_box( 'culture_directory_meta', __( 'Directory Entry Details', 'culture-community' ), array( __CLASS__, 'render_directory_meta_box' ), 'culture_directory', 'side', 'high' );
        add_meta_box( 'culture_quote_meta', __( 'Quote Details', 'culture-community' ), array( __CLASS__, 'render_quote_meta_box' ), 'culture_quote', 'normal', 'high' );
    }

    public static function render_chapter_meta_box( $post ) {
        wp_nonce_field( 'culture_chapter_meta', 'culture_chapter_meta_nonce' );
        $lat       = get_post_meta( $post->ID, '_culture_location_lat', true );
        $lng       = get_post_meta( $post->ID, '_culture_location_lng', true );
        $leader_id = get_post_meta( $post->ID, '_culture_chapter_leader_id', true );
        ?>
        <table class="form-table">
            <tr><th><label for="culture_location_lat">Latitude</label></th><td><input type="text" id="culture_location_lat" name="culture_location_lat" value="<?php echo esc_attr( $lat ); ?>" /></td></tr>
            <tr><th><label for="culture_location_lng">Longitude</label></th><td><input type="text" id="culture_location_lng" name="culture_location_lng" value="<?php echo esc_attr( $lng ); ?>" /></td></tr>
            <tr><th><label for="culture_chapter_leader_id">Chapter Leader</label></th><td>
                <?php $leaders = get_users( array( 'role__in' => array( 'chapter_leader', 'administrator' ) ) ); ?>
                <select id="culture_chapter_leader_id" name="culture_chapter_leader_id">
                    <option value="">-- Select --</option>
                    <?php foreach ( $leaders as $leader ) : ?><option value="<?php echo esc_attr( $leader->ID ); ?>" <?php selected( $leader_id, $leader->ID ); ?>><?php echo esc_html( $leader->display_name ); ?></option><?php endforeach; ?>
                </select>
            </td></tr>
        </table>
        <?php
    }

    public static function render_event_meta_box( $post ) {
        wp_nonce_field( 'culture_event_meta', 'culture_event_meta_nonce' );
        $event_date  = get_post_meta( $post->ID, '_culture_event_date', true );
        $chapter_id  = get_post_meta( $post->ID, '_culture_chapter_id', true );
        $is_physical = get_post_meta( $post->ID, '_culture_is_physical', true );
        $capacity    = get_post_meta( $post->ID, '_culture_capacity', true );
        ?>
        <table class="form-table">
            <tr><th><label for="culture_event_date">Event Date</label></th><td><input type="datetime-local" id="culture_event_date" name="culture_event_date" value="<?php echo esc_attr( $event_date ); ?>" /></td></tr>
            <tr><th><label for="culture_chapter_id">Chapter</label></th><td>
                <?php $chapters = get_posts( array( 'post_type' => 'culture_chapter', 'numberposts' => -1 ) ); ?>
                <select id="culture_chapter_id" name="culture_chapter_id">
                    <option value="">-- Select --</option>
                    <?php foreach ( $chapters as $chapter ) : ?><option value="<?php echo esc_attr( $chapter->ID ); ?>" <?php selected( $chapter_id, $chapter->ID ); ?>><?php echo esc_html( $chapter->post_title ); ?></option><?php endforeach; ?>
                </select>
            </td></tr>
            <tr><th><label for="culture_is_physical">Physical Event</label></th><td><input type="checkbox" id="culture_is_physical" name="culture_is_physical" value="1" <?php checked( $is_physical, '1' ); ?> /></td></tr>
            <tr><th><label for="culture_capacity">Capacity</label></th><td><input type="number" id="culture_capacity" name="culture_capacity" value="<?php echo esc_attr( $capacity ); ?>" min="0" /></td></tr>
        </table>
        <?php
    }

    public static function render_directory_meta_box( $post ) {
        wp_nonce_field( 'culture_directory_meta', 'culture_directory_meta_nonce' );
        $ai_generated  = get_post_meta( $post->ID, '_culture_dir_ai_generated', true );
        $submitted_by  = get_post_meta( $post->ID, '_culture_dir_submitted_by', true );
        $submitter     = $submitted_by ? get_userdata( (int) $submitted_by ) : null;
        ?>
        <table class="form-table">
            <tr><th><label for="culture_dir_ai_generated">AI Generated</label></th><td><input type="checkbox" id="culture_dir_ai_generated" name="culture_dir_ai_generated" value="1" <?php checked( $ai_generated, '1' ); ?> /></td></tr>
            <?php if ( $submitter ) : ?><tr><th>Submitted By</th><td><a href="<?php echo esc_url( get_edit_user_link( $submitter->ID ) ); ?>"><?php echo esc_html( $submitter->display_name ); ?></a></td></tr><?php endif; ?>
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
        if ( isset( $_POST['culture_chapter_meta_nonce'] ) && wp_verify_nonce( $_POST['culture_chapter_meta_nonce'], 'culture_chapter_meta' ) ) {
            if ( isset( $_POST['culture_location_lat'] ) ) update_post_meta( $post_id, '_culture_location_lat', sanitize_text_field( $_POST['culture_location_lat'] ) );
            if ( isset( $_POST['culture_location_lng'] ) ) update_post_meta( $post_id, '_culture_location_lng', sanitize_text_field( $_POST['culture_location_lng'] ) );
            if ( isset( $_POST['culture_chapter_leader_id'] ) ) update_post_meta( $post_id, '_culture_chapter_leader_id', absint( $_POST['culture_chapter_leader_id'] ) );
        }
        if ( isset( $_POST['culture_directory_meta_nonce'] ) && wp_verify_nonce( $_POST['culture_directory_meta_nonce'], 'culture_directory_meta' ) ) {
            update_post_meta( $post_id, '_culture_dir_ai_generated', isset( $_POST['culture_dir_ai_generated'] ) ? '1' : '0' );
        }
        if ( isset( $_POST['culture_event_meta_nonce'] ) && wp_verify_nonce( $_POST['culture_event_meta_nonce'], 'culture_event_meta' ) ) {
            if ( isset( $_POST['culture_event_date'] ) ) update_post_meta( $post_id, '_culture_event_date', sanitize_text_field( $_POST['culture_event_date'] ) );
            if ( isset( $_POST['culture_chapter_id'] ) ) update_post_meta( $post_id, '_culture_chapter_id', absint( $_POST['culture_chapter_id'] ) );
            update_post_meta( $post_id, '_culture_is_physical', isset( $_POST['culture_is_physical'] ) ? '1' : '0' );
            if ( isset( $_POST['culture_capacity'] ) ) update_post_meta( $post_id, '_culture_capacity', absint( $_POST['culture_capacity'] ) );
        }
        if ( isset( $_POST['culture_quote_meta_nonce'] ) && wp_verify_nonce( $_POST['culture_quote_meta_nonce'], 'culture_quote_meta' ) ) {
            if ( isset( $_POST['quote_source'] ) ) update_post_meta( $post_id, '_quote_source', sanitize_text_field( $_POST['quote_source'] ) );
            if ( isset( $_POST['quote_user_id'] ) ) update_post_meta( $post_id, '_quote_user_id', absint( $_POST['quote_user_id'] ) );
        }
    }
}
