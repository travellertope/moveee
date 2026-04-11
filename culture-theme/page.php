<?php
/**
 * Default page template.
 */

get_header();

while ( have_posts() ) :
    the_post();
?>

<article <?php post_class( 'ct-page' ); ?>>
    <div class="ct-page__inner">
        <h1 class="ct-page__title"><?php the_title(); ?></h1>
        <div class="ct-page__content">
            <?php the_content(); ?>
        </div>
    </div>
</article>

<?php
    if ( comments_open() || get_comments_number() ) :
        comments_template();
    endif;

endwhile;

get_footer();
