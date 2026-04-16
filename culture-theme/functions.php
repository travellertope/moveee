<?php
/**
 * Culture Theme functions and definitions.
 */

if ( ! defined( 'CULTURE_THEME_VERSION' ) ) {
    define( 'CULTURE_THEME_VERSION', '1.0.0' );
}

/**
 * Theme setup.
 */
function culture_theme_setup() {
    // Add default posts and comments RSS feed links to head.
    add_theme_support( 'automatic-feed-links' );

    // Let WordPress manage the document title.
    add_theme_support( 'title-tag' );

    // Enable featured images.
    add_theme_support( 'post-thumbnails' );
    add_image_size( 'culture-hero', 1200, 600, true );
    add_image_size( 'culture-card', 600, 400, true );
    add_image_size( 'culture-thumbnail', 300, 200, true );

    // Register navigation menus.
    register_nav_menus( array(
        'primary'   => __( 'Primary Menu', 'culture-theme' ),
        'mobile'    => __( 'Mobile Bottom Bar', 'culture-theme' ),
        'footer'    => __( 'Footer Menu', 'culture-theme' ),
        'magazine'  => __( 'Magazine Categories', 'culture-theme' ),
    ) );

    // HTML5 markup.
    add_theme_support( 'html5', array(
        'search-form',
        'comment-form',
        'comment-list',
        'gallery',
        'caption',
        'style',
        'script',
        'navigation-widgets',
    ) );

    // Custom logo.
    add_theme_support( 'custom-logo', array(
        'height'      => 60,
        'width'       => 200,
        'flex-height' => true,
        'flex-width'  => true,
    ) );

    // Custom background.
    add_theme_support( 'custom-background', array(
        'default-color' => 'f4f4f4',
    ) );

    // Wide and full alignment for blocks.
    add_theme_support( 'align-wide' );

    // Responsive embeds.
    add_theme_support( 'responsive-embeds' );

    // Editor styles.
    add_theme_support( 'editor-styles' );

    // Custom content width.
    $GLOBALS['content_width'] = 960;
}
add_action( 'after_setup_theme', 'culture_theme_setup' );

/**
 * Register widget areas.
 */
function culture_theme_widgets_init() {
    register_sidebar( array(
        'name'          => __( 'Sidebar', 'culture-theme' ),
        'id'            => 'sidebar-1',
        'description'   => __( 'Add widgets here for the blog sidebar.', 'culture-theme' ),
        'before_widget' => '<section id="%1$s" class="ct-widget %2$s">',
        'after_widget'  => '</section>',
        'before_title'  => '<h3 class="ct-widget__title">',
        'after_title'   => '</h3>',
    ) );

    register_sidebar( array(
        'name'          => __( 'Footer Column 1', 'culture-theme' ),
        'id'            => 'footer-1',
        'before_widget' => '<div id="%1$s" class="ct-footer-widget %2$s">',
        'after_widget'  => '</div>',
        'before_title'  => '<h4 class="ct-footer-widget__title">',
        'after_title'   => '</h4>',
    ) );

    register_sidebar( array(
        'name'          => __( 'Footer Column 2', 'culture-theme' ),
        'id'            => 'footer-2',
        'before_widget' => '<div id="%1$s" class="ct-footer-widget %2$s">',
        'after_widget'  => '</div>',
        'before_title'  => '<h4 class="ct-footer-widget__title">',
        'after_title'   => '</h4>',
    ) );

    register_sidebar( array(
        'name'          => __( 'Footer Column 3', 'culture-theme' ),
        'id'            => 'footer-3',
        'before_widget' => '<div id="%1$s" class="ct-footer-widget %2$s">',
        'after_widget'  => '</div>',
        'before_title'  => '<h4 class="ct-footer-widget__title">',
        'after_title'   => '</h4>',
    ) );
}
add_action( 'widgets_init', 'culture_theme_widgets_init' );

/**
 * Enqueue scripts and styles.
 */
function culture_theme_scripts() {
    // Main theme stylesheet.
    wp_enqueue_style(
        'culture-theme',
        get_template_directory_uri() . '/assets/css/theme.css',
        array(),
        CULTURE_THEME_VERSION
    );

    // Google Fonts — dynamic based on Customizer.
    $body_font    = get_theme_mod( 'culture_font_body', 'Inter' );
    $heading_font = get_theme_mod( 'culture_font_heading', 'Playfair Display' );
    $gf_url       = culture_theme_google_fonts_url( $body_font, $heading_font );

    if ( $gf_url ) {
        wp_enqueue_style( 'culture-theme-fonts', $gf_url, array(), null );
    }

    // Theme JavaScript.
    wp_enqueue_script(
        'culture-theme-js',
        get_template_directory_uri() . '/assets/js/theme.js',
        array(),
        CULTURE_THEME_VERSION,
        true
    );

    // Inline CSS variables from Customizer.
    $primary    = get_theme_mod( 'culture_primary_color', '#2c3e50' );
    $accent     = get_theme_mod( 'culture_accent_color', '#e67e22' );
    $dark_mode  = get_theme_mod( 'culture_dark_mode', false );

    $css = ":root {
        --ct-primary: {$primary};
        --ct-accent: {$accent};
        --ct-success: #27ae60;
        --ct-error: #e74c3c;
        --ct-warning: #f39c12;
    }";

    if ( $dark_mode ) {
        $css .= "
        :root {
            --ct-bg: #1a1a2e;
            --ct-surface: #16213e;
            --ct-surface-alt: #0f3460;
            --ct-text: #e8e8e8;
            --ct-text-muted: #a0a0a0;
            --ct-border: #2a2a4a;
        }";
    }

    // Typography from Customizer.
    $typo_body_stack    = culture_theme_font_stack( $body_font );
    $typo_heading_stack = culture_theme_font_stack( $heading_font );
    $typo_size_base     = absint( get_theme_mod( 'culture_font_size_base', 16 ) );
    $typo_size_h1       = absint( get_theme_mod( 'culture_font_size_h1', 36 ) );
    $typo_size_h2       = absint( get_theme_mod( 'culture_font_size_h2', 28 ) );
    $typo_size_h3       = absint( get_theme_mod( 'culture_font_size_h3', 22 ) );
    $typo_size_h4       = absint( get_theme_mod( 'culture_font_size_h4', 18 ) );
    $typo_lh_body       = floatval( get_theme_mod( 'culture_line_height_body', 1.6 ) );
    $typo_lh_heading    = floatval( get_theme_mod( 'culture_line_height_heading', 1.2 ) );
    $typo_fw_body       = absint( get_theme_mod( 'culture_font_weight_body', 400 ) );
    $typo_fw_heading    = absint( get_theme_mod( 'culture_font_weight_heading', 700 ) );
    $typo_ls_body       = floatval( get_theme_mod( 'culture_letter_spacing_body', 0 ) );
    $typo_ls_heading    = floatval( get_theme_mod( 'culture_letter_spacing_heading', -0.5 ) );
    $typo_tt_heading    = sanitize_text_field( get_theme_mod( 'culture_text_transform_heading', 'none' ) );
    $typo_para_spacing  = floatval( get_theme_mod( 'culture_paragraph_spacing', 1.2 ) );

    $css .= ":root {
        --ct-font: {$typo_body_stack};
        --ct-font-serif: {$typo_heading_stack};
        --ct-font-size-base: {$typo_size_base}px;
        --ct-font-size-h1: {$typo_size_h1}px;
        --ct-font-size-h2: {$typo_size_h2}px;
        --ct-font-size-h3: {$typo_size_h3}px;
        --ct-font-size-h4: {$typo_size_h4}px;
        --ct-line-height: {$typo_lh_body};
        --ct-line-height-heading: {$typo_lh_heading};
        --ct-font-weight: {$typo_fw_body};
        --ct-font-weight-heading: {$typo_fw_heading};
        --ct-letter-spacing: {$typo_ls_body}px;
        --ct-letter-spacing-heading: {$typo_ls_heading}px;
        --ct-text-transform-heading: {$typo_tt_heading};
        --ct-paragraph-spacing: {$typo_para_spacing}em;
    }";

    // Logo height from Customizer.
    $logo_desktop = absint( get_theme_mod( 'culture_logo_height_desktop', 36 ) );
    $logo_mobile  = absint( get_theme_mod( 'culture_logo_height_mobile', 28 ) );

    $css .= ".ct-header__brand img { height: {$logo_desktop}px; width: auto; }";
    $css .= "@media (max-width: 768px) { .ct-header__brand img { height: {$logo_mobile}px; width: auto; } }";

    // ── Hero Section ──
    $hero_bg_type   = get_theme_mod( 'culture_hero_bg_type', 'solid' );
    $hero_bg_color  = get_theme_mod( 'culture_hero_bg_color', '#2c3e50' );
    $hero_pad_top   = absint( get_theme_mod( 'culture_hero_padding_top', 80 ) );
    $hero_pad_bot   = absint( get_theme_mod( 'culture_hero_padding_bottom', 60 ) );
    $hero_min_h     = absint( get_theme_mod( 'culture_hero_min_height', 0 ) );
    $hero_align     = get_theme_mod( 'culture_hero_text_align', 'center' );
    $hero_head_col  = get_theme_mod( 'culture_hero_heading_color', '#ffffff' );
    $hero_sub_col   = get_theme_mod( 'culture_hero_sub_color', '#ffffff' );
    $hero_sub_opa   = min( 100, absint( get_theme_mod( 'culture_hero_sub_opacity', 85 ) ) );
    $hero_btn_bg    = get_theme_mod( 'culture_hero_btn_bg', '' );
    $hero_btn_col   = get_theme_mod( 'culture_hero_btn_color', '#ffffff' );

    // Hero background.
    if ( 'gradient' === $hero_bg_type ) {
        $g_start = get_theme_mod( 'culture_hero_gradient_start', '#2c3e50' );
        $g_end   = get_theme_mod( 'culture_hero_gradient_end', '#1a252f' );
        $g_angle = absint( get_theme_mod( 'culture_hero_gradient_angle', 135 ) );
        $css .= ".ct-hero { background: linear-gradient({$g_angle}deg, {$g_start}, {$g_end}); }";
        $css .= ".ct-hero::before { background: none; }";
    } elseif ( 'image' === $hero_bg_type ) {
        $hero_img   = get_theme_mod( 'culture_hero_bg_image', '' );
        $ov_color   = get_theme_mod( 'culture_hero_overlay_color', '#000000' );
        $ov_opacity = min( 100, absint( get_theme_mod( 'culture_hero_overlay_opacity', 50 ) ) ) / 100;
        if ( $hero_img ) {
            $css .= ".ct-hero { background: url('" . esc_url( $hero_img ) . "') center/cover no-repeat; }";
            $css .= ".ct-hero::before { background: " . culture_theme_hex_rgba( $ov_color, $ov_opacity ) . "; }";
        }
    } else {
        $css .= ".ct-hero { background: {$hero_bg_color}; }";
    }

    // Hero layout.
    $css .= ".ct-hero { padding: {$hero_pad_top}px 20px {$hero_pad_bot}px; text-align: {$hero_align}; }";
    if ( $hero_min_h > 0 ) {
        $css .= ".ct-hero { min-height: {$hero_min_h}px; display: flex; align-items: center; justify-content: center; }";
    }

    // Hero inner alignment.
    if ( 'left' === $hero_align ) {
        $css .= ".ct-hero__inner { margin: 0; margin-right: auto; }";
    } elseif ( 'right' === $hero_align ) {
        $css .= ".ct-hero__inner { margin: 0; margin-left: auto; }";
    }

    // Hero text colours.
    $css .= ".ct-hero__heading { color: {$hero_head_col}; }";
    $sub_opa_dec = $hero_sub_opa / 100;
    $css .= ".ct-hero__sub { color: {$hero_sub_col}; opacity: {$sub_opa_dec}; }";

    // Hero button.
    if ( $hero_btn_bg ) {
        $css .= ".ct-hero .ct-btn--accent { background: {$hero_btn_bg}; }";
    }
    $css .= ".ct-hero .ct-btn--accent { color: {$hero_btn_col}; }";

    // ── Homepage Sections ──
    $sections = array(
        'events'   => '.ct-section--events',
        'magazine' => '.ct-section--magazine',
        'chapters' => '.ct-section--chapters',
    );
    foreach ( $sections as $key => $selector ) {
        $s_bg      = get_theme_mod( "culture_{$key}_bg_color", '' );
        $s_bg_img  = get_theme_mod( "culture_{$key}_bg_image", '' );
        $s_title_c = get_theme_mod( "culture_{$key}_title_color", '' );
        $s_padding = absint( get_theme_mod( "culture_{$key}_padding", 60 ) );

        $bg_parts = array();
        if ( $s_bg ) {
            $bg_parts[] = "background-color: {$s_bg}";
        }
        if ( $s_bg_img ) {
            $bg_parts[] = "background-image: url('" . esc_url( $s_bg_img ) . "')";
            $bg_parts[] = "background-size: cover";
            $bg_parts[] = "background-position: center";
        }
        $bg_parts[] = "padding: {$s_padding}px 20px";

        $css .= "{$selector} { " . implode( '; ', $bg_parts ) . "; }";

        if ( $s_title_c ) {
            $css .= "{$selector} .ct-section__title { color: {$s_title_c}; }";
        }
    }

    // Digest section.
    $digest_bg    = get_theme_mod( 'culture_digest_bg_color', '' );
    $digest_text  = get_theme_mod( 'culture_digest_text_color', '#ffffff' );
    $digest_pad   = absint( get_theme_mod( 'culture_digest_padding', 60 ) );

    if ( $digest_bg ) {
        $css .= ".ct-digest-banner { background: {$digest_bg}; }";
    }
    $css .= ".ct-digest-banner, .ct-digest-banner h2, .ct-digest-banner p { color: {$digest_text}; }";
    $css .= ".ct-section--digest { padding: {$digest_pad}px 20px; }";

    wp_add_inline_style( 'culture-theme', $css );

    // Comment reply script.
    if ( is_singular() && comments_open() && get_option( 'thread_comments' ) ) {
        wp_enqueue_script( 'comment-reply' );
    }
}
add_action( 'wp_enqueue_scripts', 'culture_theme_scripts' );

/**
 * Add webapp meta tags.
 */
function culture_theme_webapp_meta() {
    $accent = get_theme_mod( 'culture_accent_color', '#e67e22' );
    ?>
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <meta name="theme-color" content="<?php echo esc_attr( $accent ); ?>">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <meta name="mobile-web-app-capable" content="yes">
    <?php
}
add_action( 'wp_head', 'culture_theme_webapp_meta', 1 );

/**
 * Add body classes.
 */
function culture_theme_body_classes( $classes ) {
    if ( get_theme_mod( 'culture_dark_mode', false ) ) {
        $classes[] = 'ct-dark';
    }

    if ( is_singular() && ! has_post_thumbnail() ) {
        $classes[] = 'ct-no-thumbnail';
    }

    // Magazine category classes.
    if ( is_single() ) {
        $categories = get_the_category();
        foreach ( $categories as $cat ) {
            $classes[] = 'ct-category-' . $cat->slug;
        }
    }

    return $classes;
}
add_filter( 'body_class', 'culture_theme_body_classes' );

/**
 * Estimated reading time.
 *
 * @param int $post_id
 * @return int Minutes.
 */
function culture_theme_reading_time( $post_id = 0 ) {
    if ( ! $post_id ) {
        $post_id = get_the_ID();
    }
    $content = get_post_field( 'post_content', $post_id );
    $word_count = str_word_count( wp_strip_all_tags( $content ) );
    return max( 1, ceil( $word_count / 250 ) );
}

/**
 * Get magazine category label (for editorial badges).
 *
 * @return string
 */
function culture_theme_article_type() {
    $categories = get_the_category();
    if ( empty( $categories ) ) {
        return '';
    }

    $editorial_types = array(
        'interviews' => __( 'Interview', 'culture-theme' ),
        'profiles'   => __( 'Profile', 'culture-theme' ),
        'news'       => __( 'News', 'culture-theme' ),
        'reviews'    => __( 'Review', 'culture-theme' ),
        'essays'     => __( 'Essay', 'culture-theme' ),
        'poems'      => __( 'Poetry', 'culture-theme' ),
        'fiction'    => __( 'Fiction', 'culture-theme' ),
        'opinion'    => __( 'Opinion', 'culture-theme' ),
        'features'   => __( 'Feature', 'culture-theme' ),
    );

    foreach ( $categories as $cat ) {
        if ( isset( $editorial_types[ $cat->slug ] ) ) {
            return $editorial_types[ $cat->slug ];
        }
    }

    return $categories[0]->name;
}

/**
 * Check if Culture Community plugin is active.
 *
 * @return bool
 */
function culture_theme_plugin_active() {
    return class_exists( 'Culture_Gamification' );
}

/**
 * Excerpt length.
 */
function culture_theme_excerpt_length( $length ) {
    return 25;
}
add_filter( 'excerpt_length', 'culture_theme_excerpt_length' );

/**
 * Excerpt more.
 */
function culture_theme_excerpt_more( $more ) {
    return '&hellip;';
}
add_filter( 'excerpt_more', 'culture_theme_excerpt_more' );

/**
 * Convert hex colour to rgba string.
 *
 * @param string $hex   Hex colour (e.g. #000000).
 * @param float  $alpha Opacity 0-1.
 * @return string rgba() value.
 */
function culture_theme_hex_rgba( $hex, $alpha = 1 ) {
    $hex = ltrim( $hex, '#' );
    if ( strlen( $hex ) === 3 ) {
        $hex = $hex[0] . $hex[0] . $hex[1] . $hex[1] . $hex[2] . $hex[2];
    }
    $r = hexdec( substr( $hex, 0, 2 ) );
    $g = hexdec( substr( $hex, 2, 2 ) );
    $b = hexdec( substr( $hex, 4, 2 ) );
    return "rgba({$r},{$g},{$b},{$alpha})";
}

/**
 * Build the Google Fonts URL for the chosen body and heading fonts.
 *
 * @param string $body_font    Font family name.
 * @param string $heading_font Font family name.
 * @return string|false URL or false if only system fonts are selected.
 */
function culture_theme_google_fonts_url( $body_font, $heading_font ) {
    $google_families = array(
        'Inter'              => 'Inter:wght@300;400;500;600;700;800;900',
        'Poppins'            => 'Poppins:wght@300;400;500;600;700;800;900',
        'Montserrat'         => 'Montserrat:wght@300;400;500;600;700;800;900',
        'Open Sans'          => 'Open+Sans:wght@300;400;500;600;700;800',
        'Lato'               => 'Lato:wght@300;400;700;900',
        'Nunito'             => 'Nunito:wght@300;400;500;600;700;800;900',
        'Raleway'            => 'Raleway:wght@300;400;500;600;700;800;900',
        'Work Sans'          => 'Work+Sans:wght@300;400;500;600;700;800;900',
        'DM Sans'            => 'DM+Sans:wght@300;400;500;600;700',
        'Source Sans 3'      => 'Source+Sans+3:wght@300;400;500;600;700;800;900',
        'Rubik'              => 'Rubik:wght@300;400;500;600;700;800;900',
        'Manrope'            => 'Manrope:wght@300;400;500;600;700;800',
        'Playfair Display'   => 'Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,700',
        'Merriweather'       => 'Merriweather:ital,wght@0,300;0,400;0,700;0,900;1,400',
        'Lora'               => 'Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,700',
        'Libre Baskerville'  => 'Libre+Baskerville:ital,wght@0,400;0,700;1,400',
        'Crimson Text'       => 'Crimson+Text:ital,wght@0,400;0,600;0,700;1,400',
        'EB Garamond'        => 'EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400',
        'Cormorant Garamond' => 'Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400',
        'Noto Serif'         => 'Noto+Serif:ital,wght@0,400;0,700;1,400',
    );

    $families = array();
    if ( isset( $google_families[ $body_font ] ) ) {
        $families[] = $google_families[ $body_font ];
    }
    if ( $heading_font !== $body_font && isset( $google_families[ $heading_font ] ) ) {
        $families[] = $google_families[ $heading_font ];
    }

    if ( empty( $families ) ) {
        return false;
    }

    return 'https://fonts.googleapis.com/css2?family=' . implode( '&family=', $families ) . '&display=swap';
}

/**
 * Return a full CSS font-family stack for a given font name.
 *
 * @param string $font_name Font family name.
 * @return string CSS font-family value.
 */
function culture_theme_font_stack( $font_name ) {
    $sans_stack  = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    $serif_stack = "Georgia, 'Times New Roman', serif";

    $serif_fonts = array(
        'Playfair Display', 'Merriweather', 'Lora', 'Libre Baskerville',
        'Crimson Text', 'EB Garamond', 'Cormorant Garamond', 'Noto Serif',
    );

    if ( 'System Sans-Serif' === $font_name ) {
        return $sans_stack;
    }
    if ( 'System Serif' === $font_name ) {
        return $serif_stack;
    }

    $fallback = in_array( $font_name, $serif_fonts, true ) ? $serif_stack : $sans_stack;
    return "'{$font_name}', {$fallback}";
}

// Load Customizer settings.
require get_template_directory() . '/inc/customizer.php';

// Load template tags.
require get_template_directory() . '/inc/template-tags.php';

/**
 * Expose Masthead Ticker settings to WPGraphQL.
 */
add_action( 'graphql_register_types', function() {
    register_graphql_object_type( 'MastheadTicker', [
        'description' => __( 'Site masthead ticker settings', 'culture-theme' ),
        'fields' => [
            'issueText'        => [ 'type' => 'String' ],
            'issueUrl'         => [ 'type' => 'String' ],
            'announcementText' => [ 'type' => 'String' ],
            'announcementUrl'  => [ 'type' => 'String' ],
            'locations'        => [ 'type' => 'String' ],
        ],
    ] );

    register_graphql_field( 'RootQuery', 'mastheadTicker', [
        'type' => 'MastheadTicker',
        'description' => __( 'Site masthead ticker settings', 'culture-theme' ),
        'resolve' => function() {
            return [
                'issueText'        => get_theme_mod( 'culture_ticker_issue_text', 'Issue N°014' ),
                'issueUrl'         => get_theme_mod( 'culture_ticker_issue_url', '' ),
                'announcementText' => get_theme_mod( 'culture_ticker_announcement_text', 'Culture Narratives Vol I out now' ),
                'announcementUrl'  => get_theme_mod( 'culture_ticker_announcement_url', '' ),
                'locations'        => get_theme_mod( 'culture_ticker_locations', 'Lagos · London · Accra · NYC' ),
            ];
        }
    ] );
} );

/**
 * Redirect WordPress taxonomy pages to Next.js SEO-optimized clean URLs.
 */
function moveee_redirect_taxonomies() {
    $queried = get_queried_object();
    if ( ! $queried || ! isset( $queried->taxonomy ) || ! isset( $queried->slug ) ) {
        return;
    }

    $tax  = $queried->taxonomy;
    $slug = $queried->slug;
    
    // Use MOVE_FRONTEND_URL constant if defined (for local testing), otherwise default to production
    $frontend_url = defined('MOVE_FRONTEND_URL') ? MOVE_FRONTEND_URL : 'https://themoveee.com';
    $redirect_url = '';

    if ( $tax === 'category' ) {
        $redirect_url = $frontend_url . '/magazine/category/' . $slug;
    } elseif ( $tax === 'post_tag' ) {
        $redirect_url = $frontend_url . '/magazine/tag/' . $slug;
    } elseif ( $tax === 'series' ) {
        $redirect_url = $frontend_url . '/magazine/series/' . $slug;
    } elseif ( $tax === 'industry' || $tax === 'industries' ) {
        $redirect_url = $frontend_url . '/magazine/industry/' . $slug;
    } elseif ( $tax === 'country' || $tax === 'countries' ) {
        $redirect_url = $frontend_url . '/magazine/country/' . $slug;
    } elseif ( $tax === 'product_cat' ) {
        $redirect_url = $frontend_url . '/shop/category/' . $slug;
    } elseif ( $tax === 'product_tag' ) {
        $redirect_url = $frontend_url . '/shop/tag/' . $slug;
    } elseif ( $tax === 'product_brand' ) {
        $redirect_url = $frontend_url . '/shop/brand/' . $slug;
    }

    if ( ! empty( $redirect_url ) ) {
        wp_redirect( $redirect_url, 301 );
        exit;
    }
}
add_action( 'template_redirect', 'moveee_redirect_taxonomies' );
