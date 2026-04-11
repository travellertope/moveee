<?php
/**
 * Template: Chapter Archive
 *
 * Override by copying to: yourtheme/culture-community/archive-culture_chapter.php
 */

get_header();
?>

<div class="culture-template culture-archive-chapter">
    <header class="culture-archive-chapter__header">
        <h1><?php esc_html_e( 'Chapters', 'culture-community' ); ?></h1>
        <p class="culture-archive-chapter__intro">
            <?php esc_html_e( 'Find a chapter near you and join the community.', 'culture-community' ); ?>
        </p>
    </header>

    <?php if ( have_posts() ) : ?>
        <div class="culture-archive-chapter__grid">
            <?php while ( have_posts() ) : the_post();
                $chapter_id = get_the_ID();
                $lat        = get_post_meta( $chapter_id, '_culture_location_lat', true );
                $lng        = get_post_meta( $chapter_id, '_culture_location_lng', true );
                $leader_id  = get_post_meta( $chapter_id, '_culture_chapter_leader_id', true );
                $leader     = $leader_id ? get_userdata( $leader_id ) : null;

                $member_count = count( get_users( array(
                    'meta_key'   => '_culture_primary_chapter_id',
                    'meta_value' => $chapter_id,
                    'fields'     => 'ID',
                ) ) );

                $interests = get_the_terms( $chapter_id, 'culture_interest' );
            ?>
                <article <?php post_class( 'culture-archive-chapter__card' ); ?>>
                    <?php if ( has_post_thumbnail() ) : ?>
                        <div class="culture-archive-chapter__thumb">
                            <a href="<?php the_permalink(); ?>">
                                <?php the_post_thumbnail( 'medium_large' ); ?>
                            </a>
                        </div>
                    <?php endif; ?>

                    <div class="culture-archive-chapter__body">
                        <h2 class="culture-archive-chapter__title">
                            <a href="<?php the_permalink(); ?>"><?php the_title(); ?></a>
                        </h2>

                        <div class="culture-archive-chapter__meta">
                            <?php if ( $leader ) : ?>
                                <span><?php printf( esc_html__( 'Led by %s', 'culture-community' ), esc_html( $leader->display_name ) ); ?></span>
                            <?php endif; ?>
                            <span><?php printf( esc_html( _n( '%d member', '%d members', $member_count, 'culture-community' ) ), $member_count ); ?></span>
                        </div>

                        <?php if ( $interests && ! is_wp_error( $interests ) ) : ?>
                            <div class="culture-archive-chapter__interests">
                                <?php foreach ( $interests as $interest ) : ?>
                                    <span class="culture-archive-chapter__tag"><?php echo esc_html( $interest->name ); ?></span>
                                <?php endforeach; ?>
                            </div>
                        <?php endif; ?>

                        <div class="culture-archive-chapter__excerpt">
                            <?php the_excerpt(); ?>
                        </div>

                        <a href="<?php the_permalink(); ?>" class="culture-btn culture-btn--primary">
                            <?php esc_html_e( 'View Chapter', 'culture-community' ); ?>
                        </a>
                    </div>
                </article>
            <?php endwhile; ?>
        </div>

        <div class="culture-archive-chapter__pagination">
            <?php the_posts_pagination( array(
                'prev_text' => __( '&laquo; Previous', 'culture-community' ),
                'next_text' => __( 'Next &raquo;', 'culture-community' ),
            ) ); ?>
        </div>

    <?php else : ?>
        <p class="culture-archive-chapter__empty">
            <?php esc_html_e( 'No chapters found yet. Check back soon!', 'culture-community' ); ?>
        </p>
    <?php endif; ?>
</div>

<?php
get_footer();
