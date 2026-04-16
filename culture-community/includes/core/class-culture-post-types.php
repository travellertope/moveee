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
     * can query them. Without this, querying quoteSource/quoteLikes/etc. on
     * CultureQuote returns GraphQL errors and getWPData returns null.
     */
    public static function register_graphql_fields() {
        if ( ! function_exists( 'register_graphql_field' ) ) {
            return;
        }

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

        // Event fields on Post type (to support both standard posts and culture_event CPT in StoryFields)
        $event_fields = array(
            'location'    => array( 'type' => 'String', 'meta_key' => 'location' ),
            'eventLocation' => array( 'type' => 'String', 'meta_key' => 'location' ), // alias
            'eventDate'   => array( 'type' => 'String', 'meta_key' => '_culture_event_date' ),
            'isFeatured'  => array( 'type' => 'Boolean', 'meta_key' => 'is_featured' ),
            'admission'   => array( 'type' => 'String', 'meta_key' => 'admission' ),
            'isPhysical'  => array( 'type' => 'Boolean', 'meta_key' => '_culture_is_physical' ),
        );

        foreach ( $event_fields as $field_name => $config ) {
            $meta_key = $config['meta_key'];
            $type     = $config['type'];
            register_graphql_field( 'Post', $field_name, array(
                'type'    => $type,
                'resolve' => function( $post ) use ( $meta_key, $type ) {
                    $value = get_post_meta( $post->databaseId, $meta_key, true );
                    if ( $type === 'Boolean' ) return (bool) $value;
                    return (string) $value;
                },
            ) );
        }

        // Specific fields on CultureEvent type
        foreach ( $event_fields as $field_name => $config ) {
            $meta_key = $config['meta_key'];
            $type     = $config['type'];
            register_graphql_field( 'CultureEvent', $field_name, array(
                'type'    => $type,
                'resolve' => function( $post ) use ( $meta_key, $type ) {
                    $value = get_post_meta( $post->databaseId, $meta_key, true );
                    if ( $type === 'Boolean' ) return (bool) $value;
                    return (string) $value;
                },
            ) );
        }

        // Chapter fields on cultureChapter type
        $chapter_fields = array(
            'latitude'  => array( 'type' => 'String', 'meta_key' => '_culture_location_lat' ),
            'longitude' => array( 'type' => 'String', 'meta_key' => '_culture_location_lng' ),
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

        // Leader Name (convenience field)
        register_graphql_field( 'CultureChapter', 'leaderName', array(
            'type'    => 'String',
            'resolve' => function( $post ) {
                $leader_id = get_post_meta( $post->databaseId, '_culture_chapter_leader_id', true );
                if ( ! $leader_id ) return null;
                $leader = get_userdata( $leader_id );
                return $leader ? $leader->display_name : null;
            },
        ) );

        // Member Count (total primary + secondary)
        register_graphql_field( 'CultureChapter', 'memberCount', array(
            'type'    => 'Int',
            'resolve' => function( $post ) {
                $p_count = count( get_users( array(
                    'meta_key'   => '_culture_primary_chapter_id',
                    'meta_value' => $post->databaseId,
                    'fields'     => 'ID',
                ) ) );
                $s_count = count( get_users( array(
                    'meta_key'   => '_culture_secondary_chapter_id',
                    'meta_value' => $post->databaseId,
                    'fields'     => 'ID',
                ) ) );
                return $p_count + $s_count;
            },
        ) );

        // Related Upcoming Events for a Chapter
        register_graphql_field( 'CultureChapter', 'relatedEvents', array(
            'type'    => array( 'list_of' => 'Post' ),
            'resolve' => function( $post ) {
                $events = get_posts( array(
                    'post_type'      => 'culture_event',
                    'posts_per_page' => 10,
                    'meta_query'     => array(
                        array(
                            'key'   => '_culture_chapter_id',
                            'value' => $post->databaseId,
                        ),
                        array(
                            'key'     => '_culture_event_date',
                            'value'   => current_time( 'Y-m-d\TH:i' ),
                            'compare' => '>=',
                            'type'    => 'DATETIME',
                        ),
                    ),
                    'meta_key' => '_culture_event_date',
                    'orderby'  => 'meta_value',
                    'order'    => 'ASC',
                ) );
                return $events;
            },
        ) );
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
            'public'       => true,
            'has_archive'  => true,
            'show_in_menu' => 'culture-community',
            'menu_icon'    => 'dashicons-location-alt',
            'supports'     => array( 'title', 'editor', 'thumbnail' ),
            'rewrite'      => array( 'slug' => 'chapters' ),
            'show_in_rest' => true,
            'capability_type' => 'post',
            // WPGraphQL support.
            'show_in_graphql'     => true,
            'graphql_single_name' => 'cultureChapter',
            'graphql_plural_name' => 'cultureChapters',
        ) );

        // Event CPT – nested under Culture Community menu.
        register_post_type( 'culture_event', array(
            'labels' => array(
                'name'               => __( 'Events', 'culture-community' ),
                'singular_name'      => __( 'Event', 'culture-community' ),
                'add_new'            => __( 'Add New', 'culture-community' ),
                'add_new_item'       => __( 'Add New Event', 'culture-community' ),
                'edit_item'          => __( 'Edit Event', 'culture-community' ),
                'view_item'          => __( 'View Event', 'culture-community' ),
                'all_items'          => __( 'Events', 'culture-community' ),
                'search_items'       => __( 'Search Events', 'culture-community' ),
                'not_found'          => __( 'No events found', 'culture-community' ),
            ),
            'public'       => true,
            'has_archive'  => true,
            'show_in_menu' => 'culture-community',
            'menu_icon'    => 'dashicons-calendar-alt',
            'supports'     => array( 'title', 'editor', 'thumbnail' ),
            'rewrite'      => array( 'slug' => 'events' ),
            'show_in_rest' => true,
            'capability_type' => 'post',
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
    }

    /**
     * Register custom taxonomies.
     */
    public static function register_taxonomies() {
        /**
         * Content access-level taxonomy.
         *
         * Non-public (no archive URLs, not in WP REST API) but visible in the
         * WordPress admin and exposed via WPGraphQL so the Next.js frontend can
         * read it and enforce access gates.
         *
         * Terms:
         *   member-only  – logged-in users of any tier (Citizen + Patron)
         *   patron-only  – Patron-tier members only
         *
         * No term = fully public (default for all content).
         */
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
            'hierarchical'        => true,   // shown as a checklist like categories
            'public'              => false,  // no public archive pages
            'publicly_queryable'  => false,  // not queryable via standard WP REST
            'show_ui'             => true,   // visible in WP admin editor
            'show_in_menu'        => true,
            'show_admin_column'   => true,   // appear in post list tables
            'show_in_nav_menus'   => false,
            'show_tagcloud'       => false,
            'show_in_quick_edit'  => true,
            // Must be true so the block editor (Gutenberg) renders the taxonomy
            // panel on post / newsletter edit screens.  The taxonomy terms
            // themselves are not sensitive, so REST exposure is fine.
            // Archive pages and public WP_Query usage are still disabled via
            // public => false and publicly_queryable => false above.
            'show_in_rest'        => true,
            'rest_base'           => 'culture-access',
            'rewrite'             => false,  // no URL rewrites
            'query_var'           => false,
            // WPGraphQL — exposes as cultureAccesses { nodes { slug } } on Post
            // and CultureNewsletter types.
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
            // WPGraphQL support.
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
            // WPGraphQL support.
            'show_in_graphql'     => true,
            'graphql_single_name' => 'cultureInterest',
            'graphql_plural_name' => 'cultureInterests',
        ) );

        /**
         * Directory entry type taxonomy.
         *
         * Classifies culture_directory entries by kind:
         *   person, place, movement, genre, concept, artwork, food, fashion
         *
         * Non-public (no archive URLs), shown in block editor sidebar and admin.
         * Exposed via WPGraphQL so the Next.js frontend can display the type badge.
         */
        register_taxonomy( 'culture_dir_type', array( 'culture_directory' ), array(
            'labels' => array(
                'name'          => __( 'Entry Type', 'culture-community' ),
                'singular_name' => __( 'Entry Type', 'culture-community' ),
                'search_items'  => __( 'Search Types', 'culture-community' ),
                'all_items'     => __( 'All Types', 'culture-community' ),
                'edit_item'     => __( 'Edit Type', 'culture-community' ),
                'add_new_item'  => __( 'Add New Type', 'culture-community' ),
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
            // WPGraphQL.
            'show_in_graphql'     => true,
            'graphql_single_name' => 'cultureDirectoryType',
            'graphql_plural_name' => 'cultureDirectoryTypes',
        ) );
    }

    /**
     * Register meta boxes for custom post types.
     */
    public static function register_meta_boxes() {
        // Chapter meta box.
        add_meta_box(
            'culture_chapter_meta',
            __( 'Chapter Details', 'culture-community' ),
            array( __CLASS__, 'render_chapter_meta_box' ),
            'culture_chapter',
            'normal',
            'high'
        );

        // Event meta box.
        add_meta_box(
            'culture_event_meta',
            __( 'Event Details', 'culture-community' ),
            array( __CLASS__, 'render_event_meta_box' ),
            'culture_event',
            'normal',
            'high'
        );

        // Directory entry meta box.
        add_meta_box(
            'culture_directory_meta',
            __( 'Directory Entry Details', 'culture-community' ),
            array( __CLASS__, 'render_directory_meta_box' ),
            'culture_directory',
            'side',
            'high'
        );

        // Quote meta box.
        add_meta_box(
            'culture_quote_meta',
            __( 'Quote Details', 'culture-community' ),
            array( __CLASS__, 'render_quote_meta_box' ),
            'culture_quote',
            'normal',
            'high'
        );
    }

    /**
     * Render the Chapter meta box.
     */
    public static function render_chapter_meta_box( $post ) {
        wp_nonce_field( 'culture_chapter_meta', 'culture_chapter_meta_nonce' );

        $lat       = get_post_meta( $post->ID, '_culture_location_lat', true );
        $lng       = get_post_meta( $post->ID, '_culture_location_lng', true );
        $leader_id = get_post_meta( $post->ID, '_culture_chapter_leader_id', true );
        ?>
        <table class="form-table">
            <tr>
                <th><label for="culture_location_lat"><?php esc_html_e( 'Latitude', 'culture-community' ); ?></label></th>
                <td><input type="text" id="culture_location_lat" name="culture_location_lat" value="<?php echo esc_attr( $lat ); ?>" /></td>
            </tr>
            <tr>
                <th><label for="culture_location_lng"><?php esc_html_e( 'Longitude', 'culture-community' ); ?></label></th>
                <td><input type="text" id="culture_location_lng" name="culture_location_lng" value="<?php echo esc_attr( $lng ); ?>" /></td>
            </tr>
            <tr>
                <th><label for="culture_chapter_leader_id"><?php esc_html_e( 'Chapter Leader', 'culture-community' ); ?></label></th>
                <td>
                    <?php
                    $leaders = get_users( array( 'role__in' => array( 'chapter_leader', 'administrator' ) ) );
                    ?>
                    <select id="culture_chapter_leader_id" name="culture_chapter_leader_id">
                        <option value=""><?php esc_html_e( '-- Select --', 'culture-community' ); ?></option>
                        <?php foreach ( $leaders as $leader ) : ?>
                            <option value="<?php echo esc_attr( $leader->ID ); ?>" <?php selected( $leader_id, $leader->ID ); ?>>
                                <?php echo esc_html( $leader->display_name ); ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </td>
            </tr>
        </table>
        <?php
    }

    /**
     * Render the Event meta box.
     */
    public static function render_event_meta_box( $post ) {
        wp_nonce_field( 'culture_event_meta', 'culture_event_meta_nonce' );

        $event_date  = get_post_meta( $post->ID, '_culture_event_date', true );
        $chapter_id  = get_post_meta( $post->ID, '_culture_chapter_id', true );
        $is_physical = get_post_meta( $post->ID, '_culture_is_physical', true );
        $capacity    = get_post_meta( $post->ID, '_culture_capacity', true );
        ?>
        <table class="form-table">
            <tr>
                <th><label for="culture_event_date"><?php esc_html_e( 'Event Date', 'culture-community' ); ?></label></th>
                <td><input type="datetime-local" id="culture_event_date" name="culture_event_date" value="<?php echo esc_attr( $event_date ); ?>" /></td>
            </tr>
            <tr>
                <th><label for="culture_chapter_id"><?php esc_html_e( 'Chapter', 'culture-community' ); ?></label></th>
                <td>
                    <?php
                    $chapters = get_posts( array( 'post_type' => 'culture_chapter', 'numberposts' => -1 ) );
                    ?>
                    <select id="culture_chapter_id" name="culture_chapter_id">
                        <option value=""><?php esc_html_e( '-- Select --', 'culture-community' ); ?></option>
                        <?php foreach ( $chapters as $chapter ) : ?>
                            <option value="<?php echo esc_attr( $chapter->ID ); ?>" <?php selected( $chapter_id, $chapter->ID ); ?>>
                                <?php echo esc_html( $chapter->post_title ); ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </td>
            </tr>
            <tr>
                <th><label for="culture_is_physical"><?php esc_html_e( 'Physical Event', 'culture-community' ); ?></label></th>
                <td><input type="checkbox" id="culture_is_physical" name="culture_is_physical" value="1" <?php checked( $is_physical, '1' ); ?> /></td>
            </tr>
            <tr>
                <th><label for="culture_capacity"><?php esc_html_e( 'Capacity', 'culture-community' ); ?></label></th>
                <td><input type="number" id="culture_capacity" name="culture_capacity" value="<?php echo esc_attr( $capacity ); ?>" min="0" /></td>
            </tr>
        </table>
        <?php
    }

    /**
     * Render the Directory Entry meta box.
     */
    public static function render_directory_meta_box( $post ) {
        wp_nonce_field( 'culture_directory_meta', 'culture_directory_meta_nonce' );

        $ai_generated  = get_post_meta( $post->ID, '_culture_dir_ai_generated', true );
        $submitted_by  = get_post_meta( $post->ID, '_culture_dir_submitted_by', true );
        $submitter     = $submitted_by ? get_userdata( (int) $submitted_by ) : null;
        ?>
        <table class="form-table">
            <tr>
                <th><label for="culture_dir_ai_generated"><?php esc_html_e( 'AI Generated', 'culture-community' ); ?></label></th>
                <td>
                    <input type="checkbox" id="culture_dir_ai_generated" name="culture_dir_ai_generated" value="1" <?php checked( $ai_generated, '1' ); ?> />
                    <span class="description"><?php esc_html_e( 'Stub was generated by Gemini AI', 'culture-community' ); ?></span>
                </td>
            </tr>
            <?php if ( $submitter ) : ?>
            <tr>
                <th><?php esc_html_e( 'Submitted By', 'culture-community' ); ?></th>
                <td>
                    <a href="<?php echo esc_url( get_edit_user_link( $submitter->ID ) ); ?>">
                        <?php echo esc_html( $submitter->display_name ); ?>
                    </a>
                </td>
            </tr>
            <?php endif; ?>
        </table>
        <?php
    }

    /**
     * Render the Quote meta box.
     */
    public static function render_quote_meta_box( $post ) {
        wp_nonce_field( 'culture_quote_meta', 'culture_quote_meta_nonce' );

        $source  = get_post_meta( $post->ID, '_quote_source', true );
        $user_id = get_post_meta( $post->ID, '_quote_user_id', true );
        $likes   = get_post_meta( $post->ID, '_quote_likes', true ) ?: 0;
        $reports = get_post_meta( $post->ID, '_quote_reports', true ) ?: 0;
        ?>
        <table class="form-table">
            <tr>
                <th><label for="quote_source"><?php esc_html_e( 'Source', 'culture-community' ); ?></label></th>
                <td><input type="text" id="quote_source" name="quote_source" value="<?php echo esc_attr( $source ); ?>" class="regular-text" placeholder="e.g. Things Fall Apart" /></td>
            </tr>
            <tr>
                <th><label for="quote_user_id"><?php esc_html_e( 'Submitted By (User ID)', 'culture-community' ); ?></label></th>
                <td><input type="number" id="quote_user_id" name="quote_user_id" value="<?php echo esc_attr( $user_id ); ?>" /></td>
            </tr>
            <tr>
                <th><?php esc_html_e( 'Stats', 'culture-community' ); ?></th>
                <td>
                    <strong><?php esc_html_e( 'Likes:', 'culture-community' ); ?></strong> <?php echo absint( $likes ); ?> |
                    <strong><?php esc_html_e( 'Reports:', 'culture-community' ); ?></strong> <?php echo absint( $reports ); ?>
                </td>
            </tr>
        </table>
        <?php
    }

    /**
     * Save meta box data.
     */
    public static function save_meta_boxes( $post_id ) {
        // Chapter meta.
        if ( isset( $_POST['culture_chapter_meta_nonce'] )
            && wp_verify_nonce( $_POST['culture_chapter_meta_nonce'], 'culture_chapter_meta' ) ) {

            if ( isset( $_POST['culture_location_lat'] ) ) {
                update_post_meta( $post_id, '_culture_location_lat', sanitize_text_field( $_POST['culture_location_lat'] ) );
            }
            if ( isset( $_POST['culture_location_lng'] ) ) {
                update_post_meta( $post_id, '_culture_location_lng', sanitize_text_field( $_POST['culture_location_lng'] ) );
            }
            if ( isset( $_POST['culture_chapter_leader_id'] ) ) {
                update_post_meta( $post_id, '_culture_chapter_leader_id', absint( $_POST['culture_chapter_leader_id'] ) );
            }
        }

        // Directory entry meta.
        if ( isset( $_POST['culture_directory_meta_nonce'] )
            && wp_verify_nonce( $_POST['culture_directory_meta_nonce'], 'culture_directory_meta' ) ) {

            $ai_generated = isset( $_POST['culture_dir_ai_generated'] ) ? '1' : '0';
            update_post_meta( $post_id, '_culture_dir_ai_generated', $ai_generated );
        }

        // Event meta.
        if ( isset( $_POST['culture_event_meta_nonce'] )
            && wp_verify_nonce( $_POST['culture_event_meta_nonce'], 'culture_event_meta' ) ) {

            if ( isset( $_POST['culture_event_date'] ) ) {
                update_post_meta( $post_id, '_culture_event_date', sanitize_text_field( $_POST['culture_event_date'] ) );
            }
            if ( isset( $_POST['culture_chapter_id'] ) ) {
                update_post_meta( $post_id, '_culture_chapter_id', absint( $_POST['culture_chapter_id'] ) );
            }
            $is_physical = isset( $_POST['culture_is_physical'] ) ? '1' : '0';
            update_post_meta( $post_id, '_culture_is_physical', $is_physical );
            if ( isset( $_POST['culture_capacity'] ) ) {
                update_post_meta( $post_id, '_culture_capacity', absint( $_POST['culture_capacity'] ) );
            }
        }

        // Quote meta.
        if ( isset( $_POST['culture_quote_meta_nonce'] )
            && wp_verify_nonce( $_POST['culture_quote_meta_nonce'], 'culture_quote_meta' ) ) {

            if ( isset( $_POST['quote_source'] ) ) {
                update_post_meta( $post_id, '_quote_source', sanitize_text_field( $_POST['quote_source'] ) );
            }
            if ( isset( $_POST['quote_user_id'] ) ) {
                update_post_meta( $post_id, '_quote_user_id', absint( $_POST['quote_user_id'] ) );
            }
        }
    }
}
