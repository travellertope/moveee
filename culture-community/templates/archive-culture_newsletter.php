<?php
/**
 * Template: Newsletter Archive (Cultural Digest)
 *
 * Override by copying to: yourtheme/culture-community/archive-culture_newsletter.php
 */

get_header();
?>

<div class="culture-template culture-archive-newsletter">
    <header class="culture-archive-newsletter__header">
        <h1><?php esc_html_e( 'The Cultural Digest', 'culture-community' ); ?></h1>
        <p class="culture-archive-newsletter__intro">
            <?php esc_html_e( 'Read past issues of the Cultural Digest. React, comment, and engage with the community.', 'culture-community' ); ?>
        </p>
    </header>

    <?php if ( have_posts() ) : ?>
        <div class="culture-archive-newsletter__list">
            <?php while ( have_posts() ) : the_post();
                $post_id   = get_the_ID();
                $interests = get_the_terms( $post_id, 'culture_interest' );

                // Count paragraph reactions.
                $total_reactions = 0;
                $reaction_meta = get_post_meta( $post_id );
                foreach ( $reaction_meta as $key => $val ) {
                    if ( strpos( $key, '_culture_reactions_' ) === 0 ) {
                        $data = maybe_unserialize( $val[0] );
                        if ( is_array( $data ) ) {
                            foreach ( $data as $users ) {
                                if ( is_array( $users ) ) {
                                    $total_reactions += count( $users );
                                }
                            }
                        }
                    }
                }

                // Count comments.
                $comment_count = get_comments_number( $post_id );
            ?>
                <article <?php post_class( 'culture-archive-newsletter__card' ); ?>>
                    <?php if ( has_post_thumbnail() ) : ?>
                        <div class="culture-archive-newsletter__thumb">
                            <a href="<?php the_permalink(); ?>">
                                <?php the_post_thumbnail( 'medium' ); ?>
                            </a>
                        </div>
                    <?php endif; ?>

                    <div class="culture-archive-newsletter__body">
                        <time class="culture-archive-newsletter__date" datetime="<?php echo esc_attr( get_the_date( 'c' ) ); ?>">
                            <?php echo esc_html( get_the_date() ); ?>
                        </time>

                        <h2 class="culture-archive-newsletter__title">
                            <a href="<?php the_permalink(); ?>"><?php the_title(); ?></a>
                        </h2>

                        <?php if ( $interests && ! is_wp_error( $interests ) ) : ?>
                            <div class="culture-archive-newsletter__interests">
                                <?php foreach ( $interests as $interest ) : ?>
                                    <span class="culture-archive-newsletter__tag"><?php echo esc_html( $interest->name ); ?></span>
                                <?php endforeach; ?>
                            </div>
                        <?php endif; ?>

                        <div class="culture-archive-newsletter__excerpt">
                            <?php the_excerpt(); ?>
                        </div>

                        <div class="culture-archive-newsletter__stats">
                            <span class="culture-archive-newsletter__stat">
                                <?php printf( esc_html__( '%d reactions', 'culture-community' ), $total_reactions ); ?>
                            </span>
                            <span class="culture-archive-newsletter__stat">
                                <?php printf( esc_html( _n( '%d comment', '%d comments', $comment_count, 'culture-community' ) ), $comment_count ); ?>
                            </span>
                        </div>

                        <a href="<?php the_permalink(); ?>" class="culture-btn culture-btn--primary">
                            <?php esc_html_e( 'Read &amp; React', 'culture-community' ); ?>
                        </a>
                    </div>
                </article>
            <?php endwhile; ?>
        </div>

        <div class="culture-archive-newsletter__pagination">
            <?php the_posts_pagination( array(
                'prev_text' => __( '&laquo; Previous', 'culture-community' ),
                'next_text' => __( 'Next &raquo;', 'culture-community' ),
            ) ); ?>
        </div>

    <?php else : ?>
        <p class="culture-archive-newsletter__empty">
            <?php esc_html_e( 'No newsletters published yet. Stay tuned!', 'culture-community' ); ?>
        </p>
    <?php endif; ?>
</div>

<?php
get_footer();
