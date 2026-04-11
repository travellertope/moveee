<?php
/**
 * Template part: Article card for archives and grids.
 */
?>

<article <?php post_class( 'ct-card' ); ?>>
    <?php if ( has_post_thumbnail() ) : ?>
        <a href="<?php the_permalink(); ?>" class="ct-card__thumb">
            <?php the_post_thumbnail( 'culture-card' ); ?>
        </a>
    <?php endif; ?>
    <div class="ct-card__body">
        <?php
        $categories = get_the_category();
        if ( ! empty( $categories ) ) :
        ?>
            <span class="ct-badge ct-badge--sm ct-badge--<?php echo esc_attr( $categories[0]->slug ); ?>">
                <?php echo esc_html( $categories[0]->name ); ?>
            </span>
        <?php endif; ?>

        <h3 class="ct-card__title">
            <a href="<?php the_permalink(); ?>"><?php the_title(); ?></a>
        </h3>

        <div class="ct-card__excerpt">
            <?php the_excerpt(); ?>
        </div>

        <div class="ct-card__meta">
            <span class="ct-card__author"><?php the_author(); ?></span>
            <time datetime="<?php echo esc_attr( get_the_date( 'c' ) ); ?>"><?php echo esc_html( get_the_date() ); ?></time>
            <?php if ( get_theme_mod( 'culture_show_reading_time', true ) ) : ?>
                <span class="ct-card__reading-time">
                    <?php
                    $mins = culture_theme_reading_time();
                    printf( esc_html( _n( '%d min', '%d min', $mins, 'culture-theme' ) ), $mins );
                    ?>
                </span>
            <?php endif; ?>
        </div>
    </div>
</article>
