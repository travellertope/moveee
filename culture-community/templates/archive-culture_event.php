<?php
/**
 * Template: Event Archive
 *
 * Override by copying to: yourtheme/culture-community/archive-culture_event.php
 */

get_header();
?>

<div class="culture-template culture-archive-event">
    <header class="culture-archive-event__header">
        <h1><?php esc_html_e( 'Events', 'culture-community' ); ?></h1>
        <p class="culture-archive-event__intro">
            <?php esc_html_e( 'Discover upcoming cultural events in your chapter and beyond.', 'culture-community' ); ?>
        </p>
    </header>

    <?php if ( have_posts() ) : ?>
        <div class="culture-archive-event__list">
            <?php while ( have_posts() ) : the_post();
                $event_id    = get_the_ID();
                $event_date  = get_post_meta( $event_id, '_culture_event_date', true );
                $chapter_id  = get_post_meta( $event_id, '_culture_chapter_id', true );
                $is_physical = get_post_meta( $event_id, '_culture_is_physical', true );
                $capacity    = get_post_meta( $event_id, '_culture_capacity', true );

                $chapter_name = $chapter_id ? get_the_title( $chapter_id ) : '';
                $formatted_date = $event_date ? date_i18n( get_option( 'date_format' ) . ' ' . get_option( 'time_format' ), strtotime( $event_date ) ) : '';

                $interests = get_the_terms( $event_id, 'culture_interest' );
            ?>
                <article <?php post_class( 'culture-archive-event__card' ); ?>>
                    <?php if ( has_post_thumbnail() ) : ?>
                        <div class="culture-archive-event__thumb">
                            <a href="<?php the_permalink(); ?>">
                                <?php the_post_thumbnail( 'medium' ); ?>
                            </a>
                        </div>
                    <?php endif; ?>

                    <div class="culture-archive-event__body">
                        <div class="culture-archive-event__top">
                            <?php if ( $formatted_date ) : ?>
                                <time class="culture-archive-event__date" datetime="<?php echo esc_attr( $event_date ); ?>">
                                    <?php echo esc_html( $formatted_date ); ?>
                                </time>
                            <?php endif; ?>
                            <?php if ( '1' === $is_physical ) : ?>
                                <span class="culture-event__badge culture-event__badge--physical"><?php esc_html_e( 'In-Person', 'culture-community' ); ?></span>
                            <?php else : ?>
                                <span class="culture-event__badge culture-event__badge--virtual"><?php esc_html_e( 'Virtual', 'culture-community' ); ?></span>
                            <?php endif; ?>
                        </div>

                        <h2 class="culture-archive-event__title">
                            <a href="<?php the_permalink(); ?>"><?php the_title(); ?></a>
                        </h2>

                        <div class="culture-archive-event__meta">
                            <?php if ( $chapter_name ) : ?>
                                <span class="culture-archive-event__chapter">
                                    <span class="dashicons dashicons-location-alt"></span>
                                    <?php echo esc_html( $chapter_name ); ?>
                                </span>
                            <?php endif; ?>
                            <?php if ( $capacity ) : ?>
                                <span class="culture-archive-event__capacity">
                                    <?php printf( esc_html__( 'Capacity: %d', 'culture-community' ), (int) $capacity ); ?>
                                </span>
                            <?php endif; ?>
                        </div>

                        <?php if ( $interests && ! is_wp_error( $interests ) ) : ?>
                            <div class="culture-archive-event__interests">
                                <?php foreach ( $interests as $interest ) : ?>
                                    <span class="culture-archive-event__tag"><?php echo esc_html( $interest->name ); ?></span>
                                <?php endforeach; ?>
                            </div>
                        <?php endif; ?>

                        <div class="culture-archive-event__excerpt">
                            <?php the_excerpt(); ?>
                        </div>

                        <a href="<?php the_permalink(); ?>" class="culture-btn culture-btn--primary">
                            <?php esc_html_e( 'View Event', 'culture-community' ); ?>
                        </a>
                    </div>
                </article>
            <?php endwhile; ?>
        </div>

        <div class="culture-archive-event__pagination">
            <?php the_posts_pagination( array(
                'prev_text' => __( '&laquo; Previous', 'culture-community' ),
                'next_text' => __( 'Next &raquo;', 'culture-community' ),
            ) ); ?>
        </div>

    <?php else : ?>
        <p class="culture-archive-event__empty">
            <?php esc_html_e( 'No events scheduled yet. Check back soon!', 'culture-community' ); ?>
        </p>
    <?php endif; ?>
</div>

<?php
get_footer();
