<?php
/**
 * Archive template - Magazine grid layout.
 */

get_header();

$layout = get_theme_mod( 'culture_magazine_layout', 'grid' );
?>

<div class="ct-archive">
    <header class="ct-archive__header">
        <div class="ct-section__inner">
            <?php
            the_archive_title( '<h1 class="ct-archive__title">', '</h1>' );
            the_archive_description( '<p class="ct-archive__desc">', '</p>' );
            ?>
        </div>
    </header>

    <?php if ( has_nav_menu( 'magazine' ) ) : ?>
        <nav class="ct-category-nav">
            <div class="ct-section__inner">
                <?php wp_nav_menu( array(
                    'theme_location' => 'magazine',
                    'container'      => false,
                    'menu_class'     => 'ct-category-nav__list',
                    'depth'          => 1,
                ) ); ?>
            </div>
        </nav>
    <?php endif; ?>

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
                    'class'     => 'ct-pagination__nav',
                ) ); ?>
            </div>
        <?php else : ?>
            <?php get_template_part( 'template-parts/content', 'none' ); ?>
        <?php endif; ?>
    </div>
</div>

<?php
get_footer();
