<?php
/**
 * 404 Not Found template.
 */

get_header();
?>

<div class="ct-404">
    <div class="ct-404__inner">
        <span class="ct-404__code">404</span>
        <h1 class="ct-404__title"><?php esc_html_e( 'Page not found', 'culture-theme' ); ?></h1>
        <p class="ct-404__desc"><?php esc_html_e( 'The page you\'re looking for doesn\'t exist or has been moved.', 'culture-theme' ); ?></p>
        <div class="ct-404__actions">
            <a href="<?php echo esc_url( home_url( '/' ) ); ?>" class="ct-btn ct-btn--accent"><?php esc_html_e( 'Go Home', 'culture-theme' ); ?></a>
        </div>
        <div class="ct-404__search">
            <?php get_search_form(); ?>
        </div>
    </div>
</div>

<?php
get_footer();
