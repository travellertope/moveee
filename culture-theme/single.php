<?php
/**
 * Single post template - Magazine article layout.
 */

get_header();

while ( have_posts() ) :
    the_post();
?>

<article <?php post_class( 'ct-article' ); ?>>
    <header class="ct-article__header">
        <div class="ct-article__header-inner">
            <?php culture_theme_article_badge(); ?>
            <h1 class="ct-article__title"><?php the_title(); ?></h1>
            <?php culture_theme_post_meta(); ?>
        </div>
    </header>

    <?php if ( has_post_thumbnail() ) : ?>
        <div class="ct-article__hero">
            <?php the_post_thumbnail( 'culture-hero' ); ?>
            <?php
            $caption = get_the_post_thumbnail_caption();
            if ( $caption ) :
            ?>
                <figcaption class="ct-article__hero-caption"><?php echo esc_html( $caption ); ?></figcaption>
            <?php endif; ?>
        </div>
    <?php endif; ?>

    <div class="ct-article__content">
        <?php the_content(); ?>

        <?php
        wp_link_pages( array(
            'before' => '<nav class="ct-page-links"><span class="ct-page-links__label">' . esc_html__( 'Pages:', 'culture-theme' ) . '</span>',
            'after'  => '</nav>',
        ) );
        ?>
    </div>

    <footer class="ct-article__footer">
        <?php
        $tags = get_the_tags();
        if ( $tags ) :
        ?>
            <div class="ct-article__tags">
                <?php foreach ( $tags as $tag ) : ?>
                    <a href="<?php echo esc_url( get_tag_link( $tag ) ); ?>" class="ct-tag"><?php echo esc_html( $tag->name ); ?></a>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>

        <?php
        // Share bar.
        $share_url   = rawurlencode( get_permalink() );
        $share_title = rawurlencode( get_the_title() );
        ?>
        <div class="ct-share">
            <span class="ct-share__label"><?php esc_html_e( 'Share', 'culture-theme' ); ?></span>
            <a href="https://twitter.com/intent/tweet?url=<?php echo $share_url; ?>&text=<?php echo $share_title; ?>" target="_blank" rel="noopener noreferrer" class="ct-share__link" aria-label="Share on X">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="https://www.facebook.com/sharer/sharer.php?u=<?php echo $share_url; ?>" target="_blank" rel="noopener noreferrer" class="ct-share__link" aria-label="Share on Facebook">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
            <button class="ct-share__link ct-share__copy" data-url="<?php echo esc_url( get_permalink() ); ?>" aria-label="<?php esc_attr_e( 'Copy link', 'culture-theme' ); ?>">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            </button>
        </div>

        <?php culture_theme_author_bio(); ?>
    </footer>
</article>

<?php
    culture_theme_post_navigation();
    culture_theme_related_posts();

    if ( comments_open() || get_comments_number() ) :
        comments_template();
    endif;

endwhile;

get_footer();
