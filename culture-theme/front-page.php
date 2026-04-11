<?php
/**
 * Homepage template.
 *
 * Combines Culture Community plugin sections with the magazine editorial.
 */

get_header();

$plugin_active = culture_theme_plugin_active();
?>

<!-- Hero Section -->
<section class="ct-hero">
    <div class="ct-hero__inner">
        <h1 class="ct-hero__heading"><?php echo esc_html( get_theme_mod( 'culture_hero_heading', __( 'Culture Community', 'culture-theme' ) ) ); ?></h1>
        <p class="ct-hero__sub"><?php echo esc_html( get_theme_mod( 'culture_hero_subheading', __( 'Where culture lives, breathes, and connects.', 'culture-theme' ) ) ); ?></p>
        <?php
        $cta_text = get_theme_mod( 'culture_hero_cta_text', __( 'Join the Community', 'culture-theme' ) );
        $cta_url  = get_theme_mod( 'culture_hero_cta_url', '/register/' );
        if ( $cta_text && $cta_url ) :
        ?>
            <a href="<?php echo esc_url( $cta_url ); ?>" class="ct-btn ct-btn--accent ct-btn--lg">
                <?php echo esc_html( $cta_text ); ?>
            </a>
        <?php endif; ?>
    </div>
</section>

<?php
// ── Featured Post (Sticky or Latest) ──
$featured = get_posts( array(
    'posts_per_page'      => 1,
    'post__in'            => get_option( 'sticky_posts' ),
    'ignore_sticky_posts' => false,
) );

if ( empty( $featured ) ) {
    $featured = get_posts( array( 'posts_per_page' => 1 ) );
}

if ( ! empty( $featured ) ) :
    $feat = $featured[0];
    setup_postdata( $feat );
?>
    <section class="ct-section ct-featured">
        <div class="ct-section__inner">
            <article class="ct-featured__card">
                <?php if ( has_post_thumbnail( $feat ) ) : ?>
                    <a href="<?php echo esc_url( get_permalink( $feat ) ); ?>" class="ct-featured__image">
                        <?php echo get_the_post_thumbnail( $feat, 'culture-hero' ); ?>
                    </a>
                <?php endif; ?>
                <div class="ct-featured__content">
                    <?php
                    $cat = get_the_category( $feat->ID );
                    if ( ! empty( $cat ) ) :
                    ?>
                        <span class="ct-badge ct-badge--<?php echo esc_attr( $cat[0]->slug ); ?>">
                            <?php echo esc_html( $cat[0]->name ); ?>
                        </span>
                    <?php endif; ?>
                    <h2 class="ct-featured__title">
                        <a href="<?php echo esc_url( get_permalink( $feat ) ); ?>"><?php echo esc_html( get_the_title( $feat ) ); ?></a>
                    </h2>
                    <p class="ct-featured__excerpt"><?php echo esc_html( wp_trim_words( $feat->post_content, 35 ) ); ?></p>
                    <div class="ct-featured__meta">
                        <span><?php echo esc_html( get_the_author_meta( 'display_name', $feat->post_author ) ); ?></span>
                        <time datetime="<?php echo esc_attr( get_the_date( 'c', $feat ) ); ?>"><?php echo esc_html( get_the_date( '', $feat ) ); ?></time>
                    </div>
                </div>
            </article>
        </div>
    </section>
<?php
    wp_reset_postdata();
endif;
?>

<?php
// ── Upcoming Events Section ──
if ( $plugin_active && get_theme_mod( 'culture_show_events_section', true ) ) :
    $events = get_posts( array(
        'post_type'      => 'culture_event',
        'posts_per_page' => 4,
        'meta_key'       => '_culture_event_date',
        'orderby'        => 'meta_value',
        'order'          => 'ASC',
        'meta_query'     => array(
            array(
                'key'     => '_culture_event_date',
                'value'   => current_time( 'Y-m-d\TH:i' ),
                'compare' => '>=',
                'type'    => 'DATETIME',
            ),
        ),
    ) );

    if ( ! empty( $events ) ) :
?>
    <section class="ct-section ct-section--events">
        <div class="ct-section__inner">
            <div class="ct-section__header">
                <h2 class="ct-section__title"><?php echo esc_html( get_theme_mod( 'culture_events_title', __( 'Upcoming Events', 'culture-theme' ) ) ); ?></h2>
                <a href="<?php echo esc_url( get_post_type_archive_link( 'culture_event' ) ); ?>" class="ct-section__link"><?php esc_html_e( 'View All', 'culture-theme' ); ?> &rarr;</a>
            </div>
            <div class="ct-events-grid">
                <?php foreach ( $events as $event ) :
                    $event_date  = get_post_meta( $event->ID, '_culture_event_date', true );
                    $is_physical = get_post_meta( $event->ID, '_culture_is_physical', true );
                    $chapter_id  = get_post_meta( $event->ID, '_culture_chapter_id', true );
                    $chapter_name = $chapter_id ? get_the_title( $chapter_id ) : '';
                ?>
                    <a href="<?php echo esc_url( get_permalink( $event ) ); ?>" class="ct-event-card">
                        <div class="ct-event-card__date-block">
                            <span class="ct-event-card__month"><?php echo esc_html( date_i18n( 'M', strtotime( $event_date ) ) ); ?></span>
                            <span class="ct-event-card__day"><?php echo esc_html( date_i18n( 'd', strtotime( $event_date ) ) ); ?></span>
                        </div>
                        <div class="ct-event-card__body">
                            <h3 class="ct-event-card__title"><?php echo esc_html( $event->post_title ); ?></h3>
                            <div class="ct-event-card__meta">
                                <?php if ( $chapter_name ) : ?>
                                    <span><?php echo esc_html( $chapter_name ); ?></span>
                                <?php endif; ?>
                                <span><?php echo esc_html( date_i18n( 'g:i A', strtotime( $event_date ) ) ); ?></span>
                            </div>
                        </div>
                        <?php if ( '1' === $is_physical ) : ?>
                            <span class="ct-event-card__type ct-event-card__type--physical"><?php esc_html_e( 'IRL', 'culture-theme' ); ?></span>
                        <?php else : ?>
                            <span class="ct-event-card__type ct-event-card__type--virtual"><?php esc_html_e( 'Virtual', 'culture-theme' ); ?></span>
                        <?php endif; ?>
                    </a>
                <?php endforeach; ?>
            </div>
        </div>
    </section>
<?php
    endif;
endif;
?>

<?php
// ── Magazine / Editorial Section ──
if ( get_theme_mod( 'culture_show_magazine_section', true ) ) :
    $mag_count = get_theme_mod( 'culture_magazine_posts_count', 6 );
    $mag_title = get_theme_mod( 'culture_magazine_title', __( 'The Culture Edit', 'culture-theme' ) );
    $sticky    = get_option( 'sticky_posts' );

    $mag_posts = get_posts( array(
        'posts_per_page'      => $mag_count,
        'post__not_in'        => ! empty( $featured ) ? array( $featured[0]->ID ) : array(),
        'ignore_sticky_posts' => true,
    ) );

    if ( ! empty( $mag_posts ) ) :
?>
    <section class="ct-section ct-section--magazine">
        <div class="ct-section__inner">
            <div class="ct-section__header">
                <h2 class="ct-section__title"><?php echo esc_html( $mag_title ); ?></h2>
                <a href="<?php echo esc_url( home_url( '/blog/' ) ); ?>" class="ct-section__link"><?php esc_html_e( 'All Articles', 'culture-theme' ); ?> &rarr;</a>
            </div>
            <div class="ct-magazine-grid">
                <?php foreach ( $mag_posts as $post ) : setup_postdata( $post ); ?>
                    <article class="ct-card">
                        <?php if ( has_post_thumbnail( $post ) ) : ?>
                            <a href="<?php echo esc_url( get_permalink( $post ) ); ?>" class="ct-card__thumb">
                                <?php echo get_the_post_thumbnail( $post, 'culture-card' ); ?>
                            </a>
                        <?php endif; ?>
                        <div class="ct-card__body">
                            <?php
                            $cat = get_the_category( $post->ID );
                            if ( ! empty( $cat ) ) :
                            ?>
                                <span class="ct-badge ct-badge--sm ct-badge--<?php echo esc_attr( $cat[0]->slug ); ?>">
                                    <?php echo esc_html( $cat[0]->name ); ?>
                                </span>
                            <?php endif; ?>
                            <h3 class="ct-card__title">
                                <a href="<?php echo esc_url( get_permalink( $post ) ); ?>"><?php echo esc_html( get_the_title( $post ) ); ?></a>
                            </h3>
                            <div class="ct-card__meta">
                                <span><?php echo esc_html( get_the_author_meta( 'display_name', $post->post_author ) ); ?></span>
                                <time datetime="<?php echo esc_attr( get_the_date( 'c', $post ) ); ?>"><?php echo esc_html( get_the_date( '', $post ) ); ?></time>
                            </div>
                        </div>
                    </article>
                <?php endforeach; wp_reset_postdata(); ?>
            </div>
        </div>
    </section>
<?php
    endif;
endif;
?>

<?php
// ── Chapters Section ──
if ( $plugin_active && get_theme_mod( 'culture_show_chapters_section', true ) ) :
    $chapters = get_posts( array(
        'post_type'      => 'culture_chapter',
        'posts_per_page' => 6,
        'post_status'    => 'publish',
    ) );

    if ( ! empty( $chapters ) ) :
?>
    <section class="ct-section ct-section--chapters">
        <div class="ct-section__inner">
            <div class="ct-section__header">
                <h2 class="ct-section__title"><?php echo esc_html( get_theme_mod( 'culture_chapters_title', __( 'Explore Chapters', 'culture-theme' ) ) ); ?></h2>
                <a href="<?php echo esc_url( get_post_type_archive_link( 'culture_chapter' ) ); ?>" class="ct-section__link"><?php esc_html_e( 'All Chapters', 'culture-theme' ); ?> &rarr;</a>
            </div>
            <div class="ct-chapters-grid">
                <?php foreach ( $chapters as $chapter ) : ?>
                    <a href="<?php echo esc_url( get_permalink( $chapter ) ); ?>" class="ct-chapter-card">
                        <?php if ( has_post_thumbnail( $chapter ) ) : ?>
                            <div class="ct-chapter-card__thumb">
                                <?php echo get_the_post_thumbnail( $chapter, 'culture-card' ); ?>
                            </div>
                        <?php endif; ?>
                        <div class="ct-chapter-card__body">
                            <h3 class="ct-chapter-card__title"><?php echo esc_html( $chapter->post_title ); ?></h3>
                            <?php
                            $member_count = count( get_users( array(
                                'meta_key'   => '_culture_primary_chapter_id',
                                'meta_value' => $chapter->ID,
                                'fields'     => 'ID',
                            ) ) );
                            ?>
                            <span class="ct-chapter-card__count">
                                <?php printf( esc_html( _n( '%d member', '%d members', $member_count, 'culture-theme' ) ), $member_count ); ?>
                            </span>
                        </div>
                    </a>
                <?php endforeach; ?>
            </div>
        </div>
    </section>
<?php
    endif;
endif;
?>

<?php
// ── Latest Digest ──
if ( $plugin_active ) :
    $latest_digest = get_posts( array(
        'post_type'      => 'culture_newsletter',
        'posts_per_page' => 1,
    ) );

    if ( ! empty( $latest_digest ) ) :
        $digest = $latest_digest[0];
?>
    <section class="ct-section ct-section--digest">
        <div class="ct-section__inner">
            <div class="ct-digest-banner">
                <div class="ct-digest-banner__text">
                    <span class="ct-badge ct-badge--accent"><?php esc_html_e( 'Latest Digest', 'culture-theme' ); ?></span>
                    <h2><?php echo esc_html( $digest->post_title ); ?></h2>
                    <p><?php echo esc_html( wp_trim_words( $digest->post_content, 30 ) ); ?></p>
                </div>
                <a href="<?php echo esc_url( get_permalink( $digest ) ); ?>" class="ct-btn ct-btn--accent">
                    <?php esc_html_e( 'Read & React', 'culture-theme' ); ?>
                </a>
            </div>
        </div>
    </section>
<?php
    endif;
endif;

get_footer();
