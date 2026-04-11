<?php
/**
 * Search results template.
 */

get_header();
?>

<div class="ct-archive ct-search-results">
    <header class="ct-archive__header">
        <div class="ct-section__inner">
            <h1 class="ct-archive__title">
                <?php printf( esc_html__( 'Search results for: %s', 'culture-theme' ), '<span>' . esc_html( get_search_query() ) . '</span>' ); ?>
            </h1>
        </div>
    </header>

    <div class="ct-section__inner">
        <?php if ( have_posts() ) : ?>
            <div class="ct-archive__grid ct-archive__grid--list">
                <?php while ( have_posts() ) : the_post(); ?>
                    <?php get_template_part( 'template-parts/content', 'card' ); ?>
                <?php endwhile; ?>
            </div>

            <div class="ct-pagination">
                <?php the_posts_pagination(); ?>
            </div>
        <?php else : ?>
            <div class="ct-empty">
                <h2><?php esc_html_e( 'Nothing found', 'culture-theme' ); ?></h2>
                <p><?php esc_html_e( 'Sorry, no results matched your search. Try different keywords.', 'culture-theme' ); ?></p>
                <?php get_search_form(); ?>
            </div>
        <?php endif; ?>
    </div>
</div>

<?php
get_footer();
