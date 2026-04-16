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
        add_action( 'add_meta_boxes', array( __CLASS__, 'register_meta_boxes' ) );
        add_action( 'save_post', array( __CLASS__, 'save_meta_boxes' ) );
        add_action( 'graphql_register_types', array( __CLASS__, 'register_graphql_fields' ) );
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

        // 6. Core Event Fields (Hybrid: Priority on ACF, fallback to Native Meta)
        $event_meta_fields = array(
            'eventDate'    => array( 'type' => 'String',  'acf_key' => 'event_date',  'meta_key' => '_culture_event_date' ),
            'endDate'      => array( 'type' => 'String',  'acf_key' => 'end_date',    'meta_key' => '_culture_end_date' ),
            'location'     => array( 'type' => 'String',  'acf_key' => 'location',    'meta_key' => '_culture_location' ),
            'admission'    => array( 'type' => 'String',  'acf_key' => 'admission',   'meta_key' => '_culture_admission' ),
            'isFeatured'   => array( 'type' => 'Boolean', 'acf_key' => 'is_featured', 'meta_key' => '_culture_is_featured' ),
            'tagline'      => array( 'type' => 'String',  'acf_key' => 'tagline',     'meta_key' => '_culture_tagline' ),
            'attribution'  => array( 'type' => 'String',  'acf_key' => 'attribution', 'meta_key' => '_culture_attribution' ),
            'openingHours' => array( 'type' => 'String',  'acf_key' => 'opening_hours', 'meta_key' => '_culture_opening_hours' ),
        );

        foreach ( array( 'Post', 'CultureEvent' ) as $type_name ) {
            foreach ( $event_meta_fields as $field_name => $config ) {
                $acf_key  = $config['acf_key'];
                $meta_key = $config['meta_key'];
                $field_type = $config['type'];
                register_graphql_field( $type_name, $field_name, array(
                    'type'    => $field_type,
                    'resolve' => function( $post ) use ( $acf_key, $meta_key, $field_type ) {
                        // Priority 1: ACF field
                        $value = function_exists('get_field') ? get_field( $acf_key, $post->databaseId ) : null;
                        
                        // Priority 2: Native meta fallback
                        if ( empty($value) ) {
                            $value = get_post_meta( $post->databaseId, $meta_key, true );
                        }

                        // Special Fallback for eventDate -> use post publication date
                        if ( $acf_key === 'event_date' && empty($value) ) {
                            $value = get_the_date( 'Y-m-d\TH:i:s', $post->databaseId );
                        }

                        if ( $field_type === 'Boolean' ) return (bool) $value;
                        return (string) $value;
                    },
                ) );
            }
        }

        // 7. Directory Profile Extensions
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
                'all_items'          => __( 'All Community Events', 'culture-community' ),
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
                'all_items'          => __( 'All Entries', 'culture-community' ),
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
            'supports'            => array( 'title', 'editor', 'thumbnail', 'comments' ),
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
                'all_items'          => __( 'All Journeys', 'culture-community' ),
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
