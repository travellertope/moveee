<?php
/**
 * Comments template.
 */

if ( post_password_required() ) {
    return;
}
?>

<section id="comments" class="ct-comments">
    <?php if ( have_comments() ) : ?>
        <h2 class="ct-comments__title">
            <?php
            printf(
                esc_html( _n( '%d Comment', '%d Comments', get_comments_number(), 'culture-theme' ) ),
                get_comments_number()
            );
            ?>
        </h2>

        <ol class="ct-comments__list">
            <?php
            wp_list_comments( array(
                'style'       => 'ol',
                'short_ping'  => true,
                'avatar_size' => 48,
                'callback'    => 'culture_theme_comment',
            ) );
            ?>
        </ol>

        <?php if ( get_comment_pages_count() > 1 && get_option( 'page_comments' ) ) : ?>
            <nav class="ct-comments__nav">
                <?php previous_comments_link( esc_html__( '&larr; Older Comments', 'culture-theme' ) ); ?>
                <?php next_comments_link( esc_html__( 'Newer Comments &rarr;', 'culture-theme' ) ); ?>
            </nav>
        <?php endif; ?>

    <?php endif; ?>

    <?php if ( ! comments_open() && get_comments_number() && post_type_supports( get_post_type(), 'comments' ) ) : ?>
        <p class="ct-comments__closed"><?php esc_html_e( 'Comments are closed.', 'culture-theme' ); ?></p>
    <?php endif; ?>

    <?php
    comment_form( array(
        'class_form'    => 'ct-comment-form',
        'title_reply'   => esc_html__( 'Leave a Comment', 'culture-theme' ),
        'comment_field' => '<p class="ct-comment-form__field"><label for="comment" class="screen-reader-text">' . esc_html__( 'Comment', 'culture-theme' ) . '</label><textarea id="comment" name="comment" cols="45" rows="6" required></textarea></p>',
        'submit_button' => '<button type="submit" name="%1$s" id="%2$s" class="ct-btn ct-btn--accent">%4$s</button>',
    ) );
    ?>
</section>

<?php
/**
 * Custom comment callback.
 */
function culture_theme_comment( $comment, $args, $depth ) {
    $tag = ( 'div' === $args['style'] ) ? 'div' : 'li';
    ?>
    <<?php echo $tag; ?> id="comment-<?php comment_ID(); ?>" <?php comment_class( 'ct-comment' ); ?>>
        <div class="ct-comment__body">
            <div class="ct-comment__avatar">
                <?php echo get_avatar( $comment, $args['avatar_size'] ); ?>
            </div>
            <div class="ct-comment__content">
                <div class="ct-comment__header">
                    <span class="ct-comment__author"><?php comment_author_link(); ?></span>
                    <time class="ct-comment__date" datetime="<?php comment_time( 'c' ); ?>">
                        <?php comment_date(); ?>
                    </time>
                </div>
                <?php if ( '0' === $comment->comment_approved ) : ?>
                    <p class="ct-comment__pending"><?php esc_html_e( 'Your comment is awaiting moderation.', 'culture-theme' ); ?></p>
                <?php endif; ?>
                <div class="ct-comment__text">
                    <?php comment_text(); ?>
                </div>
                <div class="ct-comment__actions">
                    <?php
                    comment_reply_link( array_merge( $args, array(
                        'depth'     => $depth,
                        'max_depth' => $args['max_depth'],
                        'before'    => '<span class="ct-comment__reply">',
                        'after'     => '</span>',
                    ) ) );
                    edit_comment_link( esc_html__( 'Edit', 'culture-theme' ), '<span class="ct-comment__edit">', '</span>' );
                    ?>
                </div>
            </div>
        </div>
    <?php
}
