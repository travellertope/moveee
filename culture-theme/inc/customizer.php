<?php
/**
 * Culture Theme Customizer settings.
 */

function culture_theme_customize_register( $wp_customize ) {

    // ── Colors Section (extend existing) ──
    $wp_customize->add_setting( 'culture_primary_color', array(
        'default'           => '#2c3e50',
        'sanitize_callback' => 'sanitize_hex_color',
        'transport'         => 'postMessage',
    ) );
    $wp_customize->add_control( new WP_Customize_Color_Control( $wp_customize, 'culture_primary_color', array(
        'label'   => __( 'Primary Color', 'culture-theme' ),
        'section' => 'colors',
    ) ) );

    $wp_customize->add_setting( 'culture_accent_color', array(
        'default'           => '#e67e22',
        'sanitize_callback' => 'sanitize_hex_color',
        'transport'         => 'postMessage',
    ) );
    $wp_customize->add_control( new WP_Customize_Color_Control( $wp_customize, 'culture_accent_color', array(
        'label'   => __( 'Accent Color', 'culture-theme' ),
        'section' => 'colors',
    ) ) );

    // ── Theme Options Panel ──
    $wp_customize->add_panel( 'culture_theme_options', array(
        'title'    => __( 'Culture Theme Options', 'culture-theme' ),
        'priority' => 30,
    ) );

    // ── General Section ──
    $wp_customize->add_section( 'culture_general', array(
        'title' => __( 'General', 'culture-theme' ),
        'panel' => 'culture_theme_options',
    ) );

    $wp_customize->add_setting( 'culture_dark_mode', array(
        'default'           => false,
        'sanitize_callback' => 'culture_theme_sanitize_checkbox',
    ) );
    $wp_customize->add_control( 'culture_dark_mode', array(
        'label'   => __( 'Enable Dark Mode', 'culture-theme' ),
        'section' => 'culture_general',
        'type'    => 'checkbox',
    ) );

    $wp_customize->add_setting( 'culture_sticky_header', array(
        'default'           => true,
        'sanitize_callback' => 'culture_theme_sanitize_checkbox',
    ) );
    $wp_customize->add_control( 'culture_sticky_header', array(
        'label'   => __( 'Sticky Header', 'culture-theme' ),
        'section' => 'culture_general',
        'type'    => 'checkbox',
    ) );

    $wp_customize->add_setting( 'culture_show_mobile_bar', array(
        'default'           => true,
        'sanitize_callback' => 'culture_theme_sanitize_checkbox',
    ) );
    $wp_customize->add_control( 'culture_show_mobile_bar', array(
        'label'   => __( 'Show Mobile Bottom Navigation', 'culture-theme' ),
        'section' => 'culture_general',
        'type'    => 'checkbox',
    ) );

    // ═══════════════════════════════════════════
    //  Typography
    // ═══════════════════════════════════════════

    $wp_customize->add_section( 'culture_typography', array(
        'title'       => __( 'Typography', 'culture-theme' ),
        'panel'       => 'culture_theme_options',
        'priority'    => 3,
        'description' => __( 'Customise fonts, sizes, weights, and spacing across the entire site.', 'culture-theme' ),
    ) );

    // -- Font Families --

    $font_choices = array(
        // Sans-serif
        'Inter'              => 'Inter',
        'Poppins'            => 'Poppins',
        'Montserrat'         => 'Montserrat',
        'Open Sans'          => 'Open Sans',
        'Lato'               => 'Lato',
        'Nunito'             => 'Nunito',
        'Raleway'            => 'Raleway',
        'Work Sans'          => 'Work Sans',
        'DM Sans'            => 'DM Sans',
        'Source Sans 3'      => 'Source Sans 3',
        'Rubik'              => 'Rubik',
        'Manrope'            => 'Manrope',
        // Serif
        'Playfair Display'   => 'Playfair Display',
        'Merriweather'       => 'Merriweather',
        'Lora'               => 'Lora',
        'Libre Baskerville'  => 'Libre Baskerville',
        'Crimson Text'       => 'Crimson Text',
        'EB Garamond'        => 'EB Garamond',
        'Cormorant Garamond' => 'Cormorant Garamond',
        'Noto Serif'         => 'Noto Serif',
        // System stacks
        'System Sans-Serif'  => 'System Sans-Serif',
        'System Serif'       => 'System Serif',
    );

    $wp_customize->add_setting( 'culture_font_body', array(
        'default'           => 'Inter',
        'sanitize_callback' => 'culture_theme_sanitize_select',
        'transport'         => 'postMessage',
    ) );
    $wp_customize->add_control( 'culture_font_body', array(
        'label'   => __( 'Body Font', 'culture-theme' ),
        'section' => 'culture_typography',
        'type'    => 'select',
        'choices' => $font_choices,
    ) );

    $wp_customize->add_setting( 'culture_font_heading', array(
        'default'           => 'Playfair Display',
        'sanitize_callback' => 'culture_theme_sanitize_select',
        'transport'         => 'postMessage',
    ) );
    $wp_customize->add_control( 'culture_font_heading', array(
        'label'   => __( 'Heading Font', 'culture-theme' ),
        'section' => 'culture_typography',
        'type'    => 'select',
        'choices' => $font_choices,
    ) );

    // -- Font Sizes --

    $wp_customize->add_setting( 'culture_font_size_base', array(
        'default'           => 16,
        'sanitize_callback' => 'absint',
        'transport'         => 'postMessage',
    ) );
    $wp_customize->add_control( 'culture_font_size_base', array(
        'label'       => __( 'Base Font Size (px)', 'culture-theme' ),
        'section'     => 'culture_typography',
        'type'        => 'number',
        'input_attrs' => array( 'min' => 12, 'max' => 24, 'step' => 1 ),
    ) );

    $wp_customize->add_setting( 'culture_font_size_h1', array(
        'default'           => 36,
        'sanitize_callback' => 'absint',
        'transport'         => 'postMessage',
    ) );
    $wp_customize->add_control( 'culture_font_size_h1', array(
        'label'       => __( 'H1 Font Size (px)', 'culture-theme' ),
        'section'     => 'culture_typography',
        'type'        => 'number',
        'input_attrs' => array( 'min' => 20, 'max' => 72, 'step' => 1 ),
    ) );

    $wp_customize->add_setting( 'culture_font_size_h2', array(
        'default'           => 28,
        'sanitize_callback' => 'absint',
        'transport'         => 'postMessage',
    ) );
    $wp_customize->add_control( 'culture_font_size_h2', array(
        'label'       => __( 'H2 Font Size (px)', 'culture-theme' ),
        'section'     => 'culture_typography',
        'type'        => 'number',
        'input_attrs' => array( 'min' => 16, 'max' => 56, 'step' => 1 ),
    ) );

    $wp_customize->add_setting( 'culture_font_size_h3', array(
        'default'           => 22,
        'sanitize_callback' => 'absint',
        'transport'         => 'postMessage',
    ) );
    $wp_customize->add_control( 'culture_font_size_h3', array(
        'label'       => __( 'H3 Font Size (px)', 'culture-theme' ),
        'section'     => 'culture_typography',
        'type'        => 'number',
        'input_attrs' => array( 'min' => 14, 'max' => 40, 'step' => 1 ),
    ) );

    $wp_customize->add_setting( 'culture_font_size_h4', array(
        'default'           => 18,
        'sanitize_callback' => 'absint',
        'transport'         => 'postMessage',
    ) );
    $wp_customize->add_control( 'culture_font_size_h4', array(
        'label'       => __( 'H4 Font Size (px)', 'culture-theme' ),
        'section'     => 'culture_typography',
        'type'        => 'number',
        'input_attrs' => array( 'min' => 12, 'max' => 32, 'step' => 1 ),
    ) );

    // -- Line Heights --

    $wp_customize->add_setting( 'culture_line_height_body', array(
        'default'           => '1.6',
        'sanitize_callback' => 'culture_theme_sanitize_float',
        'transport'         => 'postMessage',
    ) );
    $wp_customize->add_control( 'culture_line_height_body', array(
        'label'       => __( 'Body Line Height', 'culture-theme' ),
        'section'     => 'culture_typography',
        'type'        => 'number',
        'input_attrs' => array( 'min' => 1.0, 'max' => 2.4, 'step' => 0.1 ),
    ) );

    $wp_customize->add_setting( 'culture_line_height_heading', array(
        'default'           => '1.2',
        'sanitize_callback' => 'culture_theme_sanitize_float',
        'transport'         => 'postMessage',
    ) );
    $wp_customize->add_control( 'culture_line_height_heading', array(
        'label'       => __( 'Heading Line Height', 'culture-theme' ),
        'section'     => 'culture_typography',
        'type'        => 'number',
        'input_attrs' => array( 'min' => 0.9, 'max' => 2.0, 'step' => 0.05 ),
    ) );

    // -- Font Weights --

    $wp_customize->add_setting( 'culture_font_weight_body', array(
        'default'           => '400',
        'sanitize_callback' => 'culture_theme_sanitize_select',
        'transport'         => 'postMessage',
    ) );
    $wp_customize->add_control( 'culture_font_weight_body', array(
        'label'   => __( 'Body Font Weight', 'culture-theme' ),
        'section' => 'culture_typography',
        'type'    => 'select',
        'choices' => array(
            '300' => __( 'Light (300)', 'culture-theme' ),
            '400' => __( 'Regular (400)', 'culture-theme' ),
            '500' => __( 'Medium (500)', 'culture-theme' ),
        ),
    ) );

    $wp_customize->add_setting( 'culture_font_weight_heading', array(
        'default'           => '700',
        'sanitize_callback' => 'culture_theme_sanitize_select',
        'transport'         => 'postMessage',
    ) );
    $wp_customize->add_control( 'culture_font_weight_heading', array(
        'label'   => __( 'Heading Font Weight', 'culture-theme' ),
        'section' => 'culture_typography',
        'type'    => 'select',
        'choices' => array(
            '400' => __( 'Regular (400)', 'culture-theme' ),
            '500' => __( 'Medium (500)', 'culture-theme' ),
            '600' => __( 'Semi-Bold (600)', 'culture-theme' ),
            '700' => __( 'Bold (700)', 'culture-theme' ),
            '800' => __( 'Extra-Bold (800)', 'culture-theme' ),
            '900' => __( 'Black (900)', 'culture-theme' ),
        ),
    ) );

    // -- Letter Spacing --

    $wp_customize->add_setting( 'culture_letter_spacing_body', array(
        'default'           => '0',
        'sanitize_callback' => 'culture_theme_sanitize_float',
        'transport'         => 'postMessage',
    ) );
    $wp_customize->add_control( 'culture_letter_spacing_body', array(
        'label'       => __( 'Body Letter Spacing (px)', 'culture-theme' ),
        'section'     => 'culture_typography',
        'type'        => 'number',
        'input_attrs' => array( 'min' => -1, 'max' => 3, 'step' => 0.25 ),
    ) );

    $wp_customize->add_setting( 'culture_letter_spacing_heading', array(
        'default'           => '-0.5',
        'sanitize_callback' => 'culture_theme_sanitize_float',
        'transport'         => 'postMessage',
    ) );
    $wp_customize->add_control( 'culture_letter_spacing_heading', array(
        'label'       => __( 'Heading Letter Spacing (px)', 'culture-theme' ),
        'section'     => 'culture_typography',
        'type'        => 'number',
        'input_attrs' => array( 'min' => -3, 'max' => 5, 'step' => 0.25 ),
    ) );

    // -- Text Transform --

    $wp_customize->add_setting( 'culture_text_transform_heading', array(
        'default'           => 'none',
        'sanitize_callback' => 'culture_theme_sanitize_select',
        'transport'         => 'postMessage',
    ) );
    $wp_customize->add_control( 'culture_text_transform_heading', array(
        'label'   => __( 'Heading Text Transform', 'culture-theme' ),
        'section' => 'culture_typography',
        'type'    => 'select',
        'choices' => array(
            'none'       => __( 'None', 'culture-theme' ),
            'uppercase'  => __( 'UPPERCASE', 'culture-theme' ),
            'capitalize' => __( 'Capitalize', 'culture-theme' ),
            'lowercase'  => __( 'lowercase', 'culture-theme' ),
        ),
    ) );

    // -- Paragraph Spacing --

    $wp_customize->add_setting( 'culture_paragraph_spacing', array(
        'default'           => '1.2',
        'sanitize_callback' => 'culture_theme_sanitize_float',
        'transport'         => 'postMessage',
    ) );
    $wp_customize->add_control( 'culture_paragraph_spacing', array(
        'label'       => __( 'Paragraph Spacing (em)', 'culture-theme' ),
        'description' => __( 'Space between paragraphs.', 'culture-theme' ),
        'section'     => 'culture_typography',
        'type'        => 'number',
        'input_attrs' => array( 'min' => 0.5, 'max' => 3, 'step' => 0.1 ),
    ) );

    // ── Logo Size Section ──
    $wp_customize->add_section( 'culture_logo_size', array(
        'title'       => __( 'Logo Size', 'culture-theme' ),
        'panel'       => 'culture_theme_options',
        'description' => __( 'Set the logo height in pixels. The width adjusts automatically based on the image aspect ratio.', 'culture-theme' ),
        'priority'    => 5,
    ) );

    $wp_customize->add_setting( 'culture_logo_height_desktop', array(
        'default'           => 36,
        'sanitize_callback' => 'absint',
        'transport'         => 'postMessage',
    ) );
    $wp_customize->add_control( 'culture_logo_height_desktop', array(
        'label'       => __( 'Desktop Logo Height (px)', 'culture-theme' ),
        'section'     => 'culture_logo_size',
        'type'        => 'number',
        'input_attrs' => array( 'min' => 16, 'max' => 200, 'step' => 1 ),
    ) );

    $wp_customize->add_setting( 'culture_logo_height_mobile', array(
        'default'           => 28,
        'sanitize_callback' => 'absint',
        'transport'         => 'postMessage',
    ) );
    $wp_customize->add_control( 'culture_logo_height_mobile', array(
        'label'       => __( 'Mobile Logo Height (px)', 'culture-theme' ),
        'section'     => 'culture_logo_size',
        'type'        => 'number',
        'input_attrs' => array( 'min' => 12, 'max' => 120, 'step' => 1 ),
    ) );

    // ═══════════════════════════════════════════
    //  Hero Section
    // ═══════════════════════════════════════════

    $wp_customize->add_section( 'culture_hero', array(
        'title'       => __( 'Hero Section', 'culture-theme' ),
        'panel'       => 'culture_theme_options',
        'priority'    => 15,
        'description' => __( 'Customise the hero banner on the homepage — text, colours, background and layout.', 'culture-theme' ),
    ) );

    // -- Hero Texts --

    $wp_customize->add_setting( 'culture_hero_heading', array(
        'default'           => __( 'Culture Community', 'culture-theme' ),
        'sanitize_callback' => 'sanitize_text_field',
        'transport'         => 'postMessage',
    ) );
    $wp_customize->add_control( 'culture_hero_heading', array(
        'label'   => __( 'Heading', 'culture-theme' ),
        'section' => 'culture_hero',
        'type'    => 'text',
    ) );

    $wp_customize->add_setting( 'culture_hero_subheading', array(
        'default'           => __( 'Where culture lives, breathes, and connects.', 'culture-theme' ),
        'sanitize_callback' => 'sanitize_text_field',
        'transport'         => 'postMessage',
    ) );
    $wp_customize->add_control( 'culture_hero_subheading', array(
        'label'   => __( 'Subheading', 'culture-theme' ),
        'section' => 'culture_hero',
        'type'    => 'text',
    ) );

    $wp_customize->add_setting( 'culture_hero_cta_text', array(
        'default'           => __( 'Join the Community', 'culture-theme' ),
        'sanitize_callback' => 'sanitize_text_field',
        'transport'         => 'postMessage',
    ) );
    $wp_customize->add_control( 'culture_hero_cta_text', array(
        'label'   => __( 'CTA Button Text', 'culture-theme' ),
        'section' => 'culture_hero',
        'type'    => 'text',
    ) );

    $wp_customize->add_setting( 'culture_hero_cta_url', array(
        'default'           => '/register/',
        'sanitize_callback' => 'esc_url_raw',
    ) );
    $wp_customize->add_control( 'culture_hero_cta_url', array(
        'label'   => __( 'CTA Button URL', 'culture-theme' ),
        'section' => 'culture_hero',
        'type'    => 'url',
    ) );

    // -- Hero Background --

    $wp_customize->add_setting( 'culture_hero_bg_type', array(
        'default'           => 'solid',
        'sanitize_callback' => 'culture_theme_sanitize_select',
    ) );
    $wp_customize->add_control( 'culture_hero_bg_type', array(
        'label'       => __( 'Background Type', 'culture-theme' ),
        'section'     => 'culture_hero',
        'type'        => 'select',
        'choices'     => array(
            'solid'    => __( 'Solid Colour', 'culture-theme' ),
            'gradient' => __( 'Gradient', 'culture-theme' ),
            'image'    => __( 'Image', 'culture-theme' ),
        ),
    ) );

    // Solid colour.
    $wp_customize->add_setting( 'culture_hero_bg_color', array(
        'default'           => '#2c3e50',
        'sanitize_callback' => 'sanitize_hex_color',
        'transport'         => 'postMessage',
    ) );
    $wp_customize->add_control( new WP_Customize_Color_Control( $wp_customize, 'culture_hero_bg_color', array(
        'label'   => __( 'Background Colour', 'culture-theme' ),
        'section' => 'culture_hero',
    ) ) );

    // Gradient start.
    $wp_customize->add_setting( 'culture_hero_gradient_start', array(
        'default'           => '#2c3e50',
        'sanitize_callback' => 'sanitize_hex_color',
        'transport'         => 'postMessage',
    ) );
    $wp_customize->add_control( new WP_Customize_Color_Control( $wp_customize, 'culture_hero_gradient_start', array(
        'label'   => __( 'Gradient Start Colour', 'culture-theme' ),
        'section' => 'culture_hero',
    ) ) );

    // Gradient end.
    $wp_customize->add_setting( 'culture_hero_gradient_end', array(
        'default'           => '#1a252f',
        'sanitize_callback' => 'sanitize_hex_color',
        'transport'         => 'postMessage',
    ) );
    $wp_customize->add_control( new WP_Customize_Color_Control( $wp_customize, 'culture_hero_gradient_end', array(
        'label'   => __( 'Gradient End Colour', 'culture-theme' ),
        'section' => 'culture_hero',
    ) ) );

    // Gradient angle.
    $wp_customize->add_setting( 'culture_hero_gradient_angle', array(
        'default'           => 135,
        'sanitize_callback' => 'absint',
        'transport'         => 'postMessage',
    ) );
    $wp_customize->add_control( 'culture_hero_gradient_angle', array(
        'label'       => __( 'Gradient Angle (degrees)', 'culture-theme' ),
        'section'     => 'culture_hero',
        'type'        => 'number',
        'input_attrs' => array( 'min' => 0, 'max' => 360, 'step' => 1 ),
    ) );

    // Background image.
    $wp_customize->add_setting( 'culture_hero_bg_image', array(
        'default'           => '',
        'sanitize_callback' => 'esc_url_raw',
    ) );
    $wp_customize->add_control( new WP_Customize_Image_Control( $wp_customize, 'culture_hero_bg_image', array(
        'label'   => __( 'Background Image', 'culture-theme' ),
        'section' => 'culture_hero',
    ) ) );

    // Image overlay colour.
    $wp_customize->add_setting( 'culture_hero_overlay_color', array(
        'default'           => '#000000',
        'sanitize_callback' => 'sanitize_hex_color',
        'transport'         => 'postMessage',
    ) );
    $wp_customize->add_control( new WP_Customize_Color_Control( $wp_customize, 'culture_hero_overlay_color', array(
        'label'       => __( 'Image Overlay Colour', 'culture-theme' ),
        'description' => __( 'Colour laid over the background image for text readability.', 'culture-theme' ),
        'section'     => 'culture_hero',
    ) ) );

    // Image overlay opacity.
    $wp_customize->add_setting( 'culture_hero_overlay_opacity', array(
        'default'           => 50,
        'sanitize_callback' => 'absint',
        'transport'         => 'postMessage',
    ) );
    $wp_customize->add_control( 'culture_hero_overlay_opacity', array(
        'label'       => __( 'Image Overlay Opacity (%)', 'culture-theme' ),
        'section'     => 'culture_hero',
        'type'        => 'range',
        'input_attrs' => array( 'min' => 0, 'max' => 100, 'step' => 5 ),
    ) );

    // -- Hero Text Colours --

    $wp_customize->add_setting( 'culture_hero_heading_color', array(
        'default'           => '#ffffff',
        'sanitize_callback' => 'sanitize_hex_color',
        'transport'         => 'postMessage',
    ) );
    $wp_customize->add_control( new WP_Customize_Color_Control( $wp_customize, 'culture_hero_heading_color', array(
        'label'   => __( 'Heading Colour', 'culture-theme' ),
        'section' => 'culture_hero',
    ) ) );

    $wp_customize->add_setting( 'culture_hero_sub_color', array(
        'default'           => '#ffffff',
        'sanitize_callback' => 'sanitize_hex_color',
        'transport'         => 'postMessage',
    ) );
    $wp_customize->add_control( new WP_Customize_Color_Control( $wp_customize, 'culture_hero_sub_color', array(
        'label'   => __( 'Subheading Colour', 'culture-theme' ),
        'section' => 'culture_hero',
    ) ) );

    $wp_customize->add_setting( 'culture_hero_sub_opacity', array(
        'default'           => 85,
        'sanitize_callback' => 'absint',
        'transport'         => 'postMessage',
    ) );
    $wp_customize->add_control( 'culture_hero_sub_opacity', array(
        'label'       => __( 'Subheading Opacity (%)', 'culture-theme' ),
        'section'     => 'culture_hero',
        'type'        => 'range',
        'input_attrs' => array( 'min' => 0, 'max' => 100, 'step' => 5 ),
    ) );

    // -- Hero Button Colours --

    $wp_customize->add_setting( 'culture_hero_btn_bg', array(
        'default'           => '',
        'sanitize_callback' => 'sanitize_hex_color',
        'transport'         => 'postMessage',
    ) );
    $wp_customize->add_control( new WP_Customize_Color_Control( $wp_customize, 'culture_hero_btn_bg', array(
        'label'       => __( 'Button Background', 'culture-theme' ),
        'description' => __( 'Leave empty to use the accent colour.', 'culture-theme' ),
        'section'     => 'culture_hero',
    ) ) );

    $wp_customize->add_setting( 'culture_hero_btn_color', array(
        'default'           => '#ffffff',
        'sanitize_callback' => 'sanitize_hex_color',
        'transport'         => 'postMessage',
    ) );
    $wp_customize->add_control( new WP_Customize_Color_Control( $wp_customize, 'culture_hero_btn_color', array(
        'label'   => __( 'Button Text Colour', 'culture-theme' ),
        'section' => 'culture_hero',
    ) ) );

    // -- Hero Layout --

    $wp_customize->add_setting( 'culture_hero_text_align', array(
        'default'           => 'center',
        'sanitize_callback' => 'culture_theme_sanitize_select',
        'transport'         => 'postMessage',
    ) );
    $wp_customize->add_control( 'culture_hero_text_align', array(
        'label'   => __( 'Text Alignment', 'culture-theme' ),
        'section' => 'culture_hero',
        'type'    => 'select',
        'choices' => array(
            'left'   => __( 'Left', 'culture-theme' ),
            'center' => __( 'Centre', 'culture-theme' ),
            'right'  => __( 'Right', 'culture-theme' ),
        ),
    ) );

    $wp_customize->add_setting( 'culture_hero_padding_top', array(
        'default'           => 80,
        'sanitize_callback' => 'absint',
        'transport'         => 'postMessage',
    ) );
    $wp_customize->add_control( 'culture_hero_padding_top', array(
        'label'       => __( 'Padding Top (px)', 'culture-theme' ),
        'section'     => 'culture_hero',
        'type'        => 'number',
        'input_attrs' => array( 'min' => 0, 'max' => 300, 'step' => 5 ),
    ) );

    $wp_customize->add_setting( 'culture_hero_padding_bottom', array(
        'default'           => 60,
        'sanitize_callback' => 'absint',
        'transport'         => 'postMessage',
    ) );
    $wp_customize->add_control( 'culture_hero_padding_bottom', array(
        'label'       => __( 'Padding Bottom (px)', 'culture-theme' ),
        'section'     => 'culture_hero',
        'type'        => 'number',
        'input_attrs' => array( 'min' => 0, 'max' => 300, 'step' => 5 ),
    ) );

    $wp_customize->add_setting( 'culture_hero_min_height', array(
        'default'           => 0,
        'sanitize_callback' => 'absint',
        'transport'         => 'postMessage',
    ) );
    $wp_customize->add_control( 'culture_hero_min_height', array(
        'label'       => __( 'Minimum Height (px)', 'culture-theme' ),
        'description' => __( '0 = auto height.', 'culture-theme' ),
        'section'     => 'culture_hero',
        'type'        => 'number',
        'input_attrs' => array( 'min' => 0, 'max' => 1000, 'step' => 10 ),
    ) );

    // ═══════════════════════════════════════════
    //  Homepage Toggles
    // ═══════════════════════════════════════════

    $wp_customize->add_section( 'culture_homepage', array(
        'title'    => __( 'Homepage Sections', 'culture-theme' ),
        'panel'    => 'culture_theme_options',
        'priority' => 20,
    ) );

    $wp_customize->add_setting( 'culture_show_events_section', array(
        'default'           => true,
        'sanitize_callback' => 'culture_theme_sanitize_checkbox',
    ) );
    $wp_customize->add_control( 'culture_show_events_section', array(
        'label'   => __( 'Show Upcoming Events Section', 'culture-theme' ),
        'section' => 'culture_homepage',
        'type'    => 'checkbox',
    ) );

    $wp_customize->add_setting( 'culture_show_chapters_section', array(
        'default'           => true,
        'sanitize_callback' => 'culture_theme_sanitize_checkbox',
    ) );
    $wp_customize->add_control( 'culture_show_chapters_section', array(
        'label'   => __( 'Show Chapters Section', 'culture-theme' ),
        'section' => 'culture_homepage',
        'type'    => 'checkbox',
    ) );

    $wp_customize->add_setting( 'culture_show_magazine_section', array(
        'default'           => true,
        'sanitize_callback' => 'culture_theme_sanitize_checkbox',
    ) );
    $wp_customize->add_control( 'culture_show_magazine_section', array(
        'label'   => __( 'Show Magazine/Editorial Section', 'culture-theme' ),
        'section' => 'culture_homepage',
        'type'    => 'checkbox',
    ) );

    $wp_customize->add_setting( 'culture_magazine_posts_count', array(
        'default'           => 6,
        'sanitize_callback' => 'absint',
    ) );
    $wp_customize->add_control( 'culture_magazine_posts_count', array(
        'label'       => __( 'Number of Magazine Posts on Homepage', 'culture-theme' ),
        'section'     => 'culture_homepage',
        'type'        => 'number',
        'input_attrs' => array( 'min' => 2, 'max' => 12 ),
    ) );

    // ═══════════════════════════════════════════
    //  Events Section Styling
    // ═══════════════════════════════════════════

    $wp_customize->add_section( 'culture_hp_events', array(
        'title'    => __( 'Events Section', 'culture-theme' ),
        'panel'    => 'culture_theme_options',
        'priority' => 22,
    ) );

    $wp_customize->add_setting( 'culture_events_title', array(
        'default'           => __( 'Upcoming Events', 'culture-theme' ),
        'sanitize_callback' => 'sanitize_text_field',
        'transport'         => 'postMessage',
    ) );
    $wp_customize->add_control( 'culture_events_title', array(
        'label'   => __( 'Section Title', 'culture-theme' ),
        'section' => 'culture_hp_events',
        'type'    => 'text',
    ) );

    $wp_customize->add_setting( 'culture_events_bg_color', array(
        'default'           => '',
        'sanitize_callback' => 'sanitize_hex_color',
        'transport'         => 'postMessage',
    ) );
    $wp_customize->add_control( new WP_Customize_Color_Control( $wp_customize, 'culture_events_bg_color', array(
        'label'       => __( 'Background Colour', 'culture-theme' ),
        'description' => __( 'Leave empty for default.', 'culture-theme' ),
        'section'     => 'culture_hp_events',
    ) ) );

    $wp_customize->add_setting( 'culture_events_bg_image', array(
        'default'           => '',
        'sanitize_callback' => 'esc_url_raw',
    ) );
    $wp_customize->add_control( new WP_Customize_Image_Control( $wp_customize, 'culture_events_bg_image', array(
        'label'   => __( 'Background Image', 'culture-theme' ),
        'section' => 'culture_hp_events',
    ) ) );

    $wp_customize->add_setting( 'culture_events_title_color', array(
        'default'           => '',
        'sanitize_callback' => 'sanitize_hex_color',
        'transport'         => 'postMessage',
    ) );
    $wp_customize->add_control( new WP_Customize_Color_Control( $wp_customize, 'culture_events_title_color', array(
        'label'   => __( 'Title Colour', 'culture-theme' ),
        'section' => 'culture_hp_events',
    ) ) );

    $wp_customize->add_setting( 'culture_events_padding', array(
        'default'           => 60,
        'sanitize_callback' => 'absint',
        'transport'         => 'postMessage',
    ) );
    $wp_customize->add_control( 'culture_events_padding', array(
        'label'       => __( 'Vertical Padding (px)', 'culture-theme' ),
        'section'     => 'culture_hp_events',
        'type'        => 'number',
        'input_attrs' => array( 'min' => 0, 'max' => 200, 'step' => 5 ),
    ) );

    // ═══════════════════════════════════════════
    //  Magazine Section Styling
    // ═══════════════════════════════════════════

    $wp_customize->add_section( 'culture_magazine', array(
        'title'    => __( 'Magazine / Editorial', 'culture-theme' ),
        'panel'    => 'culture_theme_options',
        'priority' => 24,
    ) );

    $wp_customize->add_setting( 'culture_magazine_title', array(
        'default'           => __( 'The Culture Edit', 'culture-theme' ),
        'sanitize_callback' => 'sanitize_text_field',
        'transport'         => 'postMessage',
    ) );
    $wp_customize->add_control( 'culture_magazine_title', array(
        'label'   => __( 'Section Title', 'culture-theme' ),
        'section' => 'culture_magazine',
        'type'    => 'text',
    ) );

    $wp_customize->add_setting( 'culture_magazine_bg_color', array(
        'default'           => '',
        'sanitize_callback' => 'sanitize_hex_color',
        'transport'         => 'postMessage',
    ) );
    $wp_customize->add_control( new WP_Customize_Color_Control( $wp_customize, 'culture_magazine_bg_color', array(
        'label'       => __( 'Background Colour', 'culture-theme' ),
        'description' => __( 'Leave empty for default.', 'culture-theme' ),
        'section'     => 'culture_magazine',
    ) ) );

    $wp_customize->add_setting( 'culture_magazine_bg_image', array(
        'default'           => '',
        'sanitize_callback' => 'esc_url_raw',
    ) );
    $wp_customize->add_control( new WP_Customize_Image_Control( $wp_customize, 'culture_magazine_bg_image', array(
        'label'   => __( 'Background Image', 'culture-theme' ),
        'section' => 'culture_magazine',
    ) ) );

    $wp_customize->add_setting( 'culture_magazine_title_color', array(
        'default'           => '',
        'sanitize_callback' => 'sanitize_hex_color',
        'transport'         => 'postMessage',
    ) );
    $wp_customize->add_control( new WP_Customize_Color_Control( $wp_customize, 'culture_magazine_title_color', array(
        'label'   => __( 'Title Colour', 'culture-theme' ),
        'section' => 'culture_magazine',
    ) ) );

    $wp_customize->add_setting( 'culture_magazine_padding', array(
        'default'           => 60,
        'sanitize_callback' => 'absint',
        'transport'         => 'postMessage',
    ) );
    $wp_customize->add_control( 'culture_magazine_padding', array(
        'label'       => __( 'Vertical Padding (px)', 'culture-theme' ),
        'section'     => 'culture_magazine',
        'type'        => 'number',
        'input_attrs' => array( 'min' => 0, 'max' => 200, 'step' => 5 ),
    ) );

    $wp_customize->add_setting( 'culture_magazine_layout', array(
        'default'           => 'grid',
        'sanitize_callback' => 'culture_theme_sanitize_select',
    ) );
    $wp_customize->add_control( 'culture_magazine_layout', array(
        'label'   => __( 'Archive Layout', 'culture-theme' ),
        'section' => 'culture_magazine',
        'type'    => 'select',
        'choices' => array(
            'grid'    => __( 'Grid', 'culture-theme' ),
            'list'    => __( 'List', 'culture-theme' ),
            'masonry' => __( 'Masonry', 'culture-theme' ),
        ),
    ) );

    $wp_customize->add_setting( 'culture_show_reading_time', array(
        'default'           => true,
        'sanitize_callback' => 'culture_theme_sanitize_checkbox',
    ) );
    $wp_customize->add_control( 'culture_show_reading_time', array(
        'label'   => __( 'Show Reading Time', 'culture-theme' ),
        'section' => 'culture_magazine',
        'type'    => 'checkbox',
    ) );

    $wp_customize->add_setting( 'culture_show_author_bio', array(
        'default'           => true,
        'sanitize_callback' => 'culture_theme_sanitize_checkbox',
    ) );
    $wp_customize->add_control( 'culture_show_author_bio', array(
        'label'   => __( 'Show Author Bio on Articles', 'culture-theme' ),
        'section' => 'culture_magazine',
        'type'    => 'checkbox',
    ) );

    $wp_customize->add_setting( 'culture_show_related_posts', array(
        'default'           => true,
        'sanitize_callback' => 'culture_theme_sanitize_checkbox',
    ) );
    $wp_customize->add_control( 'culture_show_related_posts', array(
        'label'   => __( 'Show Related Posts', 'culture-theme' ),
        'section' => 'culture_magazine',
        'type'    => 'checkbox',
    ) );

    // ═══════════════════════════════════════════
    //  Chapters Section Styling
    // ═══════════════════════════════════════════

    $wp_customize->add_section( 'culture_hp_chapters', array(
        'title'    => __( 'Chapters Section', 'culture-theme' ),
        'panel'    => 'culture_theme_options',
        'priority' => 26,
    ) );

    $wp_customize->add_setting( 'culture_chapters_title', array(
        'default'           => __( 'Explore Chapters', 'culture-theme' ),
        'sanitize_callback' => 'sanitize_text_field',
        'transport'         => 'postMessage',
    ) );
    $wp_customize->add_control( 'culture_chapters_title', array(
        'label'   => __( 'Section Title', 'culture-theme' ),
        'section' => 'culture_hp_chapters',
        'type'    => 'text',
    ) );

    $wp_customize->add_setting( 'culture_chapters_bg_color', array(
        'default'           => '',
        'sanitize_callback' => 'sanitize_hex_color',
        'transport'         => 'postMessage',
    ) );
    $wp_customize->add_control( new WP_Customize_Color_Control( $wp_customize, 'culture_chapters_bg_color', array(
        'label'       => __( 'Background Colour', 'culture-theme' ),
        'description' => __( 'Leave empty for default.', 'culture-theme' ),
        'section'     => 'culture_hp_chapters',
    ) ) );

    $wp_customize->add_setting( 'culture_chapters_bg_image', array(
        'default'           => '',
        'sanitize_callback' => 'esc_url_raw',
    ) );
    $wp_customize->add_control( new WP_Customize_Image_Control( $wp_customize, 'culture_chapters_bg_image', array(
        'label'   => __( 'Background Image', 'culture-theme' ),
        'section' => 'culture_hp_chapters',
    ) ) );

    $wp_customize->add_setting( 'culture_chapters_title_color', array(
        'default'           => '',
        'sanitize_callback' => 'sanitize_hex_color',
        'transport'         => 'postMessage',
    ) );
    $wp_customize->add_control( new WP_Customize_Color_Control( $wp_customize, 'culture_chapters_title_color', array(
        'label'   => __( 'Title Colour', 'culture-theme' ),
        'section' => 'culture_hp_chapters',
    ) ) );

    $wp_customize->add_setting( 'culture_chapters_padding', array(
        'default'           => 60,
        'sanitize_callback' => 'absint',
        'transport'         => 'postMessage',
    ) );
    $wp_customize->add_control( 'culture_chapters_padding', array(
        'label'       => __( 'Vertical Padding (px)', 'culture-theme' ),
        'section'     => 'culture_hp_chapters',
        'type'        => 'number',
        'input_attrs' => array( 'min' => 0, 'max' => 200, 'step' => 5 ),
    ) );

    // ═══════════════════════════════════════════
    //  Digest Section Styling
    // ═══════════════════════════════════════════

    $wp_customize->add_section( 'culture_hp_digest', array(
        'title'    => __( 'Digest Section', 'culture-theme' ),
        'panel'    => 'culture_theme_options',
        'priority' => 28,
    ) );

    $wp_customize->add_setting( 'culture_digest_bg_color', array(
        'default'           => '',
        'sanitize_callback' => 'sanitize_hex_color',
        'transport'         => 'postMessage',
    ) );
    $wp_customize->add_control( new WP_Customize_Color_Control( $wp_customize, 'culture_digest_bg_color', array(
        'label'       => __( 'Banner Background Colour', 'culture-theme' ),
        'description' => __( 'Leave empty to use the primary colour.', 'culture-theme' ),
        'section'     => 'culture_hp_digest',
    ) ) );

    $wp_customize->add_setting( 'culture_digest_text_color', array(
        'default'           => '#ffffff',
        'sanitize_callback' => 'sanitize_hex_color',
        'transport'         => 'postMessage',
    ) );
    $wp_customize->add_control( new WP_Customize_Color_Control( $wp_customize, 'culture_digest_text_color', array(
        'label'   => __( 'Banner Text Colour', 'culture-theme' ),
        'section' => 'culture_hp_digest',
    ) ) );

    $wp_customize->add_setting( 'culture_digest_padding', array(
        'default'           => 60,
        'sanitize_callback' => 'absint',
        'transport'         => 'postMessage',
    ) );
    $wp_customize->add_control( 'culture_digest_padding', array(
        'label'       => __( 'Section Vertical Padding (px)', 'culture-theme' ),
        'section'     => 'culture_hp_digest',
        'type'        => 'number',
        'input_attrs' => array( 'min' => 0, 'max' => 200, 'step' => 5 ),
    ) );

    // ═══════════════════════════════════════════
    //  Footer Section
    // ═══════════════════════════════════════════

    $wp_customize->add_section( 'culture_footer', array(
        'title'    => __( 'Footer', 'culture-theme' ),
        'panel'    => 'culture_theme_options',
        'priority' => 50,
    ) );

    $wp_customize->add_setting( 'culture_footer_text', array(
        'default'           => '',
        'sanitize_callback' => 'wp_kses_post',
    ) );
    $wp_customize->add_control( 'culture_footer_text', array(
        'label'   => __( 'Footer Tagline', 'culture-theme' ),
        'section' => 'culture_footer',
        'type'    => 'textarea',
    ) );
}
add_action( 'customize_register', 'culture_theme_customize_register' );

/**
 * Sanitize checkbox.
 */
function culture_theme_sanitize_checkbox( $input ) {
    return (bool) $input;
}

/**
 * Sanitize select.
 */
function culture_theme_sanitize_select( $input, $setting ) {
    $choices = $setting->manager->get_control( $setting->id )->choices;
    return array_key_exists( $input, $choices ) ? $input : $setting->default;
}

/**
 * Sanitize float values (e.g. line-height, letter-spacing).
 */
function culture_theme_sanitize_float( $input ) {
    return floatval( $input );
}

/**
 * Enqueue Customizer live-preview script.
 */
function culture_theme_customizer_preview_js() {
    wp_enqueue_script(
        'culture-theme-customizer-preview',
        get_template_directory_uri() . '/assets/js/customizer-preview.js',
        array( 'customize-preview' ),
        CULTURE_THEME_VERSION,
        true
    );
}
add_action( 'customize_preview_init', 'culture_theme_customizer_preview_js' );

/**
 * Enqueue Customizer panel control script (show/hide conditional controls).
 */
function culture_theme_customizer_controls_js() {
    wp_enqueue_script(
        'culture-theme-customizer-controls',
        get_template_directory_uri() . '/assets/js/customizer-controls.js',
        array( 'customize-controls' ),
        CULTURE_THEME_VERSION,
        true
    );
}
add_action( 'customize_controls_enqueue_scripts', 'culture_theme_customizer_controls_js' );
