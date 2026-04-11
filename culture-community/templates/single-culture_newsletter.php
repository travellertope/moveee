<?php
/**
 * Template: Single Newsletter (Cultural Digest)
 *
 * Override by copying to: yourtheme/culture-community/single-culture_newsletter.php
 */

get_header();

while ( have_posts() ) :
    the_post();

    $post_id = get_the_ID();
    $content = apply_filters( 'the_content', get_the_content() );
    $paragraphs = preg_split( '/<\/p>/', $content );
    $reactions   = array(
        'fire'  => "\xF0\x9F\x94\xA5",
        'heart' => "\xE2\x9D\xA4\xEF\xB8\x8F",
        'think' => "\xF0\x9F\xA4\x94",
        'clap'  => "\xF0\x9F\x91\x8F",
    );

    $interests = get_the_terms( $post_id, 'culture_interest' );

    // Previous and next newsletters.
    $prev = get_adjacent_post( false, '', true );
    $next = get_adjacent_post( false, '', false );
    ?>

    <article <?php post_class( 'culture-template culture-single-newsletter' ); ?>>
        <header class="culture-single-newsletter__header">
            <h1 class="culture-single-newsletter__title"><?php the_title(); ?></h1>

            <div class="culture-single-newsletter__meta">
                <time datetime="<?php echo esc_attr( get_the_date( 'c' ) ); ?>">
                    <?php echo esc_html( get_the_date() ); ?>
                </time>
                <?php if ( $interests && ! is_wp_error( $interests ) ) : ?>
                    <span class="culture-single-newsletter__topics">
                        <?php foreach ( $interests as $interest ) : ?>
                            <span class="culture-single-newsletter__topic-tag"><?php echo esc_html( $interest->name ); ?></span>
                        <?php endforeach; ?>
                    </span>
                <?php endif; ?>
            </div>
        </header>

        <div class="culture-single-newsletter__content culture-digest__content" data-post-id="<?php echo esc_attr( $post_id ); ?>">
            <?php foreach ( $paragraphs as $idx => $paragraph ) :
                $paragraph = trim( $paragraph );
                if ( empty( strip_tags( $paragraph ) ) ) continue;

                $meta_key = "_culture_reactions_{$idx}";
                $para_reactions = get_post_meta( $post_id, $meta_key, true );
                $para_reactions = is_array( $para_reactions ) ? $para_reactions : array();
            ?>
                <div class="culture-digest__paragraph" data-paragraph="<?php echo esc_attr( $idx ); ?>">
                    <div class="culture-digest__text"><?php echo wp_kses_post( $paragraph . '</p>' ); ?></div>
                    <div class="culture-digest__reactions">
                        <?php foreach ( $reactions as $key => $emoji ) :
                            $count = isset( $para_reactions[ $key ] ) ? count( $para_reactions[ $key ] ) : 0;
                        ?>
                            <button class="culture-digest__reaction js-culture-react"
                                    data-reaction="<?php echo esc_attr( $key ); ?>"
                                    data-post-id="<?php echo esc_attr( $post_id ); ?>"
                                    data-paragraph="<?php echo esc_attr( $idx ); ?>">
                                <span class="culture-digest__reaction-emoji"><?php echo $emoji; ?></span>
                                <span class="culture-digest__reaction-count"><?php echo esc_html( $count ); ?></span>
                            </button>
                        <?php endforeach; ?>
                        <button class="culture-digest__comment-toggle js-culture-comment-toggle">
                            <?php esc_html_e( 'Comment', 'culture-community' ); ?>
                        </button>
                    </div>
                    <div class="culture-digest__comments" style="display:none;">
                        <?php
                        $comments = get_comments( array(
                            'post_id'    => $post_id,
                            'status'     => 'approve',
                            'meta_query' => array(
                                array(
                                    'key'   => '_culture_paragraph_idx',
                                    'value' => $idx,
                                ),
                            ),
                        ) );
                        foreach ( $comments as $comment ) : ?>
                            <div class="culture-digest__comment">
                                <strong><?php echo esc_html( $comment->comment_author ); ?></strong>
                                <p><?php echo esc_html( $comment->comment_content ); ?></p>
                            </div>
                        <?php endforeach; ?>
                        <?php if ( is_user_logged_in() ) : ?>
                            <form class="culture-digest__comment-form js-culture-comment-form" data-post-id="<?php echo esc_attr( $post_id ); ?>" data-paragraph="<?php echo esc_attr( $idx ); ?>">
                                <textarea placeholder="<?php esc_attr_e( 'Share your thoughts...', 'culture-community' ); ?>" required></textarea>
                                <button type="submit" class="culture-btn"><?php esc_html_e( 'Post', 'culture-community' ); ?></button>
                            </form>
                        <?php endif; ?>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>

        <nav class="culture-single-newsletter__nav">
            <?php if ( $prev ) : ?>
                <a href="<?php echo esc_url( get_permalink( $prev ) ); ?>" class="culture-single-newsletter__prev">
                    <span class="culture-single-newsletter__nav-label"><?php esc_html_e( '&laquo; Previous Issue', 'culture-community' ); ?></span>
                    <span class="culture-single-newsletter__nav-title"><?php echo esc_html( $prev->post_title ); ?></span>
                </a>
            <?php endif; ?>
            <?php if ( $next ) : ?>
                <a href="<?php echo esc_url( get_permalink( $next ) ); ?>" class="culture-single-newsletter__next">
                    <span class="culture-single-newsletter__nav-label"><?php esc_html_e( 'Next Issue &raquo;', 'culture-community' ); ?></span>
                    <span class="culture-single-newsletter__nav-title"><?php echo esc_html( $next->post_title ); ?></span>
                </a>
            <?php endif; ?>
        </nav>
    </article>

<?php
endwhile;

get_footer();
