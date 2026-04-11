<?php
/**
 * Fallback template.
 */

get_header();

$layout = get_theme_mod( 'culture_magazine_layout', 'grid' );
?>

<div class="ct-archive">
    <header class="ct-archive__header">
        <div class="ct-section__inner">
            <h1 class="ct-archive__title"><?php echo esc_html( get_theme_mod( 'culture_magazine_title', __( 'The Culture Edit', 'culture-theme' ) ) ); ?></h1>
        </div>
    </header>

    <div class="ct-section__inner">
        <?php if ( have_posts() ) : ?>
            <div class="ct-archive__grid ct-archive__grid--<?php echo esc_attr( $layout ); ?>">
                <?php while ( have_posts() ) : the_post(); ?>
                    <?php get_template_part( 'template-parts/content', 'card' ); ?>
                <?php endwhile; ?>
            </div>

            <div class="ct-pagination">
                <?php the_posts_pagination( array(
                    'prev_text' => '&larr; ' . __( 'Previous', 'culture-theme' ),
                    'next_text' => __( 'Next', 'culture-theme' ) . ' &rarr;',
                ) ); ?>
            </div>
        <?php else : ?>
            <?php get_template_part( 'template-parts/content', 'none' ); ?>
        <?php endif; ?>
    </div>
</div>

<?php
get_footer();
