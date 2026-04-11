<?php
/**
 * Template override system for Culture Community CPTs.
 *
 * Provides default single and archive templates for:
 * - culture_chapter (single + archive)
 * - culture_event (single + archive)
 * - culture_newsletter (single + archive)
 *
 * Themes can override by placing matching template files in a
 * `culture-community/` subdirectory within the theme.
 *
 * Lookup order:
 * 1. {child-theme}/culture-community/{template}.php
 * 2. {parent-theme}/culture-community/{template}.php
 * 3. {plugin}/templates/{template}.php
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Culture_Templates {

    /** CPT slugs handled by this loader. */
    const POST_TYPES = array( 'culture_chapter', 'culture_event', 'culture_newsletter' );

    public static function init() {
        add_filter( 'single_template', array( __CLASS__, 'load_single_template' ) );
        add_filter( 'archive_template', array( __CLASS__, 'load_archive_template' ) );
    }

    /**
     * Load custom single template for our CPTs.
     *
     * @param string $template Current template path.
     * @return string
     */
    public static function load_single_template( $template ) {
        $post_type = get_post_type();

        if ( ! in_array( $post_type, self::POST_TYPES, true ) ) {
            return $template;
        }

        $file = 'single-' . $post_type . '.php';
        $custom = self::locate_template( $file );

        return $custom ? $custom : $template;
    }

    /**
     * Load custom archive template for our CPTs.
     *
     * @param string $template Current template path.
     * @return string
     */
    public static function load_archive_template( $template ) {
        $post_type = get_query_var( 'post_type' );

        if ( is_array( $post_type ) ) {
            $post_type = reset( $post_type );
        }

        if ( ! in_array( $post_type, self::POST_TYPES, true ) ) {
            return $template;
        }

        $file = 'archive-' . $post_type . '.php';
        $custom = self::locate_template( $file );

        return $custom ? $custom : $template;
    }

    /**
     * Locate a template file.
     *
     * Checks theme directories first, falls back to plugin templates dir.
     *
     * @param string $file Template filename.
     * @return string|false Full path or false if not found.
     */
    public static function locate_template( $file ) {
        $theme_paths = array(
            get_stylesheet_directory() . '/culture-community/' . $file,
            get_template_directory() . '/culture-community/' . $file,
        );

        foreach ( $theme_paths as $path ) {
            if ( file_exists( $path ) ) {
                return $path;
            }
        }

        $plugin_path = CULTURE_PLUGIN_DIR . 'templates/' . $file;
        if ( file_exists( $plugin_path ) ) {
            return $plugin_path;
        }

        return false;
    }

    /**
     * Helper: get the plugin header/footer wrappers.
     * Used by templates to maintain theme layout consistency.
     */
    public static function get_wrapper_start() {
        echo '<div id="culture-community-content" class="culture-template-wrapper">';
    }

    public static function get_wrapper_end() {
        echo '</div><!-- .culture-template-wrapper -->';
    }
}
