<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo( 'charset' ); ?>">
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<a class="ct-skip-link" href="#ct-main"><?php esc_html_e( 'Skip to content', 'culture-theme' ); ?></a>

<header class="ct-header<?php echo get_theme_mod( 'culture_sticky_header', true ) ? ' ct-header--sticky' : ''; ?>" id="ct-header">
    <div class="ct-header__inner">
        <div class="ct-header__brand">
            <?php if ( has_custom_logo() ) : ?>
                <?php the_custom_logo(); ?>
            <?php else : ?>
                <a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="ct-header__site-name">
                    <?php bloginfo( 'name' ); ?>
                </a>
            <?php endif; ?>
        </div>

        <nav class="ct-header__nav" id="ct-nav" aria-label="<?php esc_attr_e( 'Primary navigation', 'culture-theme' ); ?>">
            <?php
            wp_nav_menu( array(
                'theme_location' => 'primary',
                'container'      => false,
                'menu_class'     => 'ct-nav-list',
                'depth'          => 2,
                'fallback_cb'    => 'culture_theme_fallback_menu',
            ) );
            ?>
        </nav>

        <div class="ct-header__actions">
            <button class="ct-header__search-toggle" aria-label="<?php esc_attr_e( 'Toggle search', 'culture-theme' ); ?>" data-toggle="search">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </button>

            <?php if ( culture_theme_plugin_active() && is_user_logged_in() ) : ?>
                <a href="<?php echo esc_url( home_url( '/passport/' ) ); ?>" class="ct-header__avatar" aria-label="<?php esc_attr_e( 'Your Passport', 'culture-theme' ); ?>">
                    <?php echo get_avatar( get_current_user_id(), 32 ); ?>
                </a>
            <?php elseif ( ! is_user_logged_in() ) : ?>
                <a href="<?php echo esc_url( wp_login_url( get_permalink() ) ); ?>" class="ct-header__login-btn">
                    <?php esc_html_e( 'Sign In', 'culture-theme' ); ?>
                </a>
            <?php endif; ?>

            <button class="ct-header__hamburger" aria-label="<?php esc_attr_e( 'Open menu', 'culture-theme' ); ?>" aria-expanded="false" data-toggle="menu">
                <span></span><span></span><span></span>
            </button>
        </div>
    </div>

    <!-- Search overlay -->
    <div class="ct-search-overlay" id="ct-search-overlay" hidden>
        <div class="ct-search-overlay__inner">
            <?php get_search_form(); ?>
            <button class="ct-search-overlay__close" data-toggle="search" aria-label="<?php esc_attr_e( 'Close search', 'culture-theme' ); ?>">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
        </div>
    </div>
</header>

<!-- Mobile slide-out menu -->
<div class="ct-mobile-menu" id="ct-mobile-menu" hidden>
    <div class="ct-mobile-menu__overlay" data-toggle="menu"></div>
    <div class="ct-mobile-menu__panel">
        <div class="ct-mobile-menu__header">
            <span class="ct-mobile-menu__brand"><?php bloginfo( 'name' ); ?></span>
            <button class="ct-mobile-menu__close" data-toggle="menu" aria-label="<?php esc_attr_e( 'Close menu', 'culture-theme' ); ?>">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
        </div>
        <?php
        wp_nav_menu( array(
            'theme_location' => 'primary',
            'container'      => false,
            'menu_class'     => 'ct-mobile-menu__list',
            'depth'          => 2,
            'fallback_cb'    => 'culture_theme_fallback_menu',
        ) );
        ?>
        <?php if ( ! is_user_logged_in() ) : ?>
            <div class="ct-mobile-menu__cta">
                <a href="<?php echo esc_url( home_url( '/register/' ) ); ?>" class="ct-btn ct-btn--accent ct-btn--block"><?php esc_html_e( 'Join Now', 'culture-theme' ); ?></a>
            </div>
        <?php endif; ?>
    </div>
</div>

<main id="ct-main" class="ct-main">
<?php

/**
 * Fallback menu if no menu is assigned.
 */
function culture_theme_fallback_menu() {
    echo '<ul class="ct-nav-list">';
    echo '<li><a href="' . esc_url( home_url( '/' ) ) . '">' . esc_html__( 'Home', 'culture-theme' ) . '</a></li>';
    if ( culture_theme_plugin_active() ) {
        echo '<li><a href="' . esc_url( get_post_type_archive_link( 'culture_event' ) ) . '">' . esc_html__( 'Events', 'culture-theme' ) . '</a></li>';
        echo '<li><a href="' . esc_url( get_post_type_archive_link( 'culture_chapter' ) ) . '">' . esc_html__( 'Chapters', 'culture-theme' ) . '</a></li>';
        echo '<li><a href="' . esc_url( get_post_type_archive_link( 'culture_newsletter' ) ) . '">' . esc_html__( 'Digest', 'culture-theme' ) . '</a></li>';
    }
    echo '<li><a href="' . esc_url( home_url( '/blog/' ) ) . '">' . esc_html__( 'Magazine', 'culture-theme' ) . '</a></li>';
    echo '</ul>';
}
