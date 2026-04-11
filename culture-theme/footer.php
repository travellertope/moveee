</main><!-- .ct-main -->

<footer class="ct-footer">
    <div class="ct-footer__inner">
        <div class="ct-footer__widgets">
            <?php if ( is_active_sidebar( 'footer-1' ) ) : ?>
                <div class="ct-footer__col">
                    <?php dynamic_sidebar( 'footer-1' ); ?>
                </div>
            <?php endif; ?>
            <?php if ( is_active_sidebar( 'footer-2' ) ) : ?>
                <div class="ct-footer__col">
                    <?php dynamic_sidebar( 'footer-2' ); ?>
                </div>
            <?php endif; ?>
            <?php if ( is_active_sidebar( 'footer-3' ) ) : ?>
                <div class="ct-footer__col">
                    <?php dynamic_sidebar( 'footer-3' ); ?>
                </div>
            <?php endif; ?>
        </div>

        <?php if ( has_nav_menu( 'footer' ) ) : ?>
            <nav class="ct-footer__nav" aria-label="<?php esc_attr_e( 'Footer navigation', 'culture-theme' ); ?>">
                <?php wp_nav_menu( array(
                    'theme_location' => 'footer',
                    'container'      => false,
                    'menu_class'     => 'ct-footer__menu',
                    'depth'          => 1,
                ) ); ?>
            </nav>
        <?php endif; ?>

        <div class="ct-footer__bottom">
            <?php
            $footer_text = get_theme_mod( 'culture_footer_text', '' );
            if ( $footer_text ) :
            ?>
                <p class="ct-footer__tagline"><?php echo wp_kses_post( $footer_text ); ?></p>
            <?php endif; ?>
            <p class="ct-footer__copy">
                &copy; <?php echo esc_html( date_i18n( 'Y' ) ); ?> <?php bloginfo( 'name' ); ?>.
                <?php esc_html_e( 'All rights reserved.', 'culture-theme' ); ?>
            </p>
        </div>
    </div>
</footer>

<?php if ( get_theme_mod( 'culture_show_mobile_bar', true ) ) : ?>
    <nav class="ct-mobile-bar" aria-label="<?php esc_attr_e( 'Mobile navigation', 'culture-theme' ); ?>">
        <a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="ct-mobile-bar__item<?php echo is_front_page() ? ' ct-mobile-bar__item--active' : ''; ?>">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <span><?php esc_html_e( 'Home', 'culture-theme' ); ?></span>
        </a>
        <?php if ( culture_theme_plugin_active() ) : ?>
            <a href="<?php echo esc_url( get_post_type_archive_link( 'culture_event' ) ); ?>" class="ct-mobile-bar__item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                <span><?php esc_html_e( 'Events', 'culture-theme' ); ?></span>
            </a>
            <a href="<?php echo esc_url( get_post_type_archive_link( 'culture_newsletter' ) ); ?>" class="ct-mobile-bar__item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                <span><?php esc_html_e( 'Digest', 'culture-theme' ); ?></span>
            </a>
        <?php endif; ?>
        <a href="<?php echo esc_url( home_url( '/blog/' ) ); ?>" class="ct-mobile-bar__item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            <span><?php esc_html_e( 'Read', 'culture-theme' ); ?></span>
        </a>
        <?php if ( is_user_logged_in() ) : ?>
            <a href="<?php echo esc_url( home_url( '/passport/' ) ); ?>" class="ct-mobile-bar__item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <span><?php esc_html_e( 'Me', 'culture-theme' ); ?></span>
            </a>
        <?php else : ?>
            <a href="<?php echo esc_url( wp_login_url() ); ?>" class="ct-mobile-bar__item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                <span><?php esc_html_e( 'Sign In', 'culture-theme' ); ?></span>
            </a>
        <?php endif; ?>
    </nav>
<?php endif; ?>

<?php wp_footer(); ?>
</body>
</html>
