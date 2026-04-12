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
    }

    /**
     * Register custom taxonomies.
     */
    public static function register_taxonomies() {
        register_taxonomy( 'culture_interest', array( 'culture_event', 'culture_newsletter', 'culture_chapter' ), array(
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
    }
}
