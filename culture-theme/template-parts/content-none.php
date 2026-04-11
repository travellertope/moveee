<?php
/**
 * Template part: No content found.
 */
?>

<div class="ct-empty">
    <h2><?php esc_html_e( 'Nothing here yet', 'culture-theme' ); ?></h2>
    <?php if ( is_search() ) : ?>
        <p><?php esc_html_e( 'No results matched your search. Try different keywords.', 'culture-theme' ); ?></p>
        <?php get_search_form(); ?>
    <?php else : ?>
        <p><?php esc_html_e( 'It seems we can\'t find what you\'re looking for. Check back soon!', 'culture-theme' ); ?></p>
    <?php endif; ?>
</div>
