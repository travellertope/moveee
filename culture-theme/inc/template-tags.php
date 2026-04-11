<?php
/**
 * Template tags for the Culture Theme.
 */

/**
 * Print the article type badge.
 */
function culture_theme_article_badge() {
    $type = culture_theme_article_type();
    if ( $type ) {
        $cat = get_the_category();
        $slug = ! empty( $cat ) ? $cat[0]->slug : 'default';
        printf(
            '<span class="ct-badge ct-badge--%s">%s</span>',
            esc_attr( $slug ),
            esc_html( $type )
        );
    }
}

/**
 * Print reading time.
 */
function culture_theme_print_reading_time() {
    if ( ! get_theme_mod( 'culture_show_reading_time', true ) ) {
        return;
    }
    $minutes = culture_theme_reading_time();
    printf(
        '<span class="ct-reading-time">%s</span>',
        sprintf(
            /* translators: %d: minutes */
            esc_html( _n( '%d min read', '%d min read', $minutes, 'culture-theme' ) ),
            $minutes
        )
    );
}

/**
 * Print post meta line.
 */
function culture_theme_post_meta() {
    ?>
    <div class="ct-post-meta">
        <span class="ct-post-meta__author">
            <?php
            printf(
                /* translators: %s: author name */
                esc_html__( 'By %s', 'culture-theme' ),
                '<a href="' . esc_url( get_author_posts_url( get_the_author_meta( 'ID' ) ) ) . '">' . esc_html( get_the_author() ) . '</a>'
            );
            ?>
        </span>
        <time class="ct-post-meta__date" datetime="<?php echo esc_attr( get_the_date( 'c' ) ); ?>">
            <?php echo esc_html( get_the_date() ); ?>
        </time>
        <?php culture_theme_print_reading_time(); ?>
    </div>
    <?php
}

/**
 * Print the author bio box.
 */
function culture_theme_author_bio() {
    if ( ! get_theme_mod( 'culture_show_author_bio', true ) ) {
        return;
    }

    $author_bio = get_the_author_meta( 'description' );
    if ( empty( $author_bio ) ) {
        return;
    }
    ?>
    <div class="ct-author-bio">
        <div class="ct-author-bio__avatar">
            <?php echo get_avatar( get_the_author_meta( 'ID' ), 80 ); ?>
        </div>
        <div class="ct-author-bio__content">
            <h4 class="ct-author-bio__name">
                <a href="<?php echo esc_url( get_author_posts_url( get_the_author_meta( 'ID' ) ) ); ?>">
                    <?php the_author(); ?>
                </a>
            </h4>
            <p class="ct-author-bio__desc"><?php echo esc_html( $author_bio ); ?></p>
        </div>
    </div>
    <?php
}

/**
 * Print related posts.
 */
function culture_theme_related_posts() {
    if ( ! get_theme_mod( 'culture_show_related_posts', true ) ) {
        return;
    }

    $categories = get_the_category();
    if ( empty( $categories ) ) {
        return;
    }

    $cat_ids = wp_list_pluck( $categories, 'term_id' );

    $related = get_posts( array(
        'post_type'      => 'post',
        'posts_per_page' => 3,
        'post__not_in'   => array( get_the_ID() ),
        'category__in'   => $cat_ids,
        'orderby'        => 'rand',
    ) );

    if ( empty( $related ) ) {
        return;
    }
    ?>
    <div class="ct-related">
        <h3 class="ct-related__title"><?php esc_html_e( 'You Might Also Like', 'culture-theme' ); ?></h3>
        <div class="ct-related__grid">
            <?php foreach ( $related as $post ) : setup_postdata( $post ); ?>
                <article class="ct-related__card">
                    <?php if ( has_post_thumbnail( $post ) ) : ?>
                        <a href="<?php echo esc_url( get_permalink( $post ) ); ?>" class="ct-related__thumb">
                            <?php echo get_the_post_thumbnail( $post, 'culture-thumbnail' ); ?>
                        </a>
                    <?php endif; ?>
                    <h4 class="ct-related__card-title">
                        <a href="<?php echo esc_url( get_permalink( $post ) ); ?>">
                            <?php echo esc_html( get_the_title( $post ) ); ?>
                        </a>
                    </h4>
                    <time class="ct-related__date" datetime="<?php echo esc_attr( get_the_date( 'c', $post ) ); ?>">
                        <?php echo esc_html( get_the_date( '', $post ) ); ?>
                    </time>
                </article>
            <?php endforeach; wp_reset_postdata(); ?>
        </div>
    </div>
    <?php
}

/**
 * Print post navigation.
 */
function culture_theme_post_navigation() {
    the_post_navigation( array(
        'prev_text' => '<span class="ct-post-nav__label">' . esc_html__( 'Previous', 'culture-theme' ) . '</span><span class="ct-post-nav__title">%title</span>',
        'next_text' => '<span class="ct-post-nav__label">' . esc_html__( 'Next', 'culture-theme' ) . '</span><span class="ct-post-nav__title">%title</span>',
        'class'     => 'ct-post-nav',
    ) );
}
