<?php
/**
 * Template: Single Chapter
 *
 * Override by copying to: yourtheme/culture-community/single-culture_chapter.php
 */

get_header();

while ( have_posts() ) :
    the_post();

    $chapter_id = get_the_ID();
    $lat        = get_post_meta( $chapter_id, '_culture_location_lat', true );
    $lng        = get_post_meta( $chapter_id, '_culture_location_lng', true );
    $leader_id  = get_post_meta( $chapter_id, '_culture_chapter_leader_id', true );
    $leader     = $leader_id ? get_userdata( $leader_id ) : null;

    // Count members.
    $primary_count = count( get_users( array(
        'meta_key'   => '_culture_primary_chapter_id',
        'meta_value' => $chapter_id,
        'fields'     => 'ID',
    ) ) );
    $secondary_count = count( get_users( array(
        'meta_key'   => '_culture_secondary_chapter_id',
        'meta_value' => $chapter_id,
        'fields'     => 'ID',
    ) ) );

    // Upcoming events for this chapter.
    $events = get_posts( array(
        'post_type'      => 'culture_event',
        'posts_per_page' => 5,
        'meta_query'     => array(
            array(
                'key'   => '_culture_chapter_id',
                'value' => $chapter_id,
            ),
            array(
                'key'     => '_culture_event_date',
                'value'   => current_time( 'Y-m-d\TH:i' ),
                'compare' => '>=',
                'type'    => 'DATETIME',
            ),
        ),
        'meta_key' => '_culture_event_date',
        'orderby'  => 'meta_value',
        'order'    => 'ASC',
    ) );

    // Interests taxonomy.
    $interests = get_the_terms( $chapter_id, 'culture_interest' );
    ?>

    <article <?php post_class( 'culture-template culture-single-chapter' ); ?>>
        <header class="culture-single-chapter__header">
            <?php if ( has_post_thumbnail() ) : ?>
                <div class="culture-single-chapter__thumbnail">
                    <?php the_post_thumbnail( 'large' ); ?>
                </div>
            <?php endif; ?>

            <h1 class="culture-single-chapter__title"><?php the_title(); ?></h1>

            <div class="culture-single-chapter__meta">
                <?php if ( $leader ) : ?>
                    <span class="culture-single-chapter__leader">
                        <?php
                        printf(
                            /* translators: %s: leader display name */
                            esc_html__( 'Led by %s', 'culture-community' ),
                            esc_html( $leader->display_name )
                        );
                        ?>
                    </span>
                <?php endif; ?>
                <span class="culture-single-chapter__members">
                    <?php
                    printf(
                        /* translators: %d: total member count */
                        esc_html( _n( '%d member', '%d members', $primary_count + $secondary_count, 'culture-community' ) ),
                        $primary_count + $secondary_count
                    );
                    ?>
                </span>
            </div>

            <?php if ( $interests && ! is_wp_error( $interests ) ) : ?>
                <div class="culture-single-chapter__interests">
                    <?php foreach ( $interests as $interest ) : ?>
                        <span class="culture-single-chapter__interest-tag">
                            <?php echo esc_html( $interest->name ); ?>
                        </span>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
        </header>

        <div class="culture-single-chapter__content">
            <?php the_content(); ?>
        </div>

        <?php if ( $lat && $lng ) : ?>
            <div class="culture-single-chapter__map-section">
                <h2><?php esc_html_e( 'Location', 'culture-community' ); ?></h2>
                <?php
                wp_enqueue_style( 'leaflet', 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css', array(), '1.9.4' );
                wp_enqueue_script( 'leaflet', 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js', array(), '1.9.4', true );
                ?>
                <div id="culture-single-chapter-map" class="culture-single-chapter__map" style="height:350px;"></div>
                <script>
                document.addEventListener('DOMContentLoaded', function() {
                    var map = L.map('culture-single-chapter-map').setView([<?php echo esc_js( $lat ); ?>, <?php echo esc_js( $lng ); ?>], 13);
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '&copy; OpenStreetMap contributors'
                    }).addTo(map);
                    L.marker([<?php echo esc_js( $lat ); ?>, <?php echo esc_js( $lng ); ?>])
                        .addTo(map)
                        .bindPopup('<?php echo esc_js( get_the_title() ); ?>');
                });
                </script>
            </div>
        <?php endif; ?>

        <?php if ( ! empty( $events ) ) : ?>
            <div class="culture-single-chapter__events">
                <h2><?php esc_html_e( 'Upcoming Events', 'culture-community' ); ?></h2>
                <div class="culture-events">
                    <?php foreach ( $events as $event ) :
                        $event_date  = get_post_meta( $event->ID, '_culture_event_date', true );
                        $is_physical = get_post_meta( $event->ID, '_culture_is_physical', true );
                    ?>
                        <div class="culture-event">
                            <div class="culture-event__header">
                                <h3 class="culture-event__title">
                                    <a href="<?php echo esc_url( get_permalink( $event->ID ) ); ?>">
                                        <?php echo esc_html( $event->post_title ); ?>
                                    </a>
                                </h3>
                                <?php if ( '1' === $is_physical ) : ?>
                                    <span class="culture-event__badge culture-event__badge--physical"><?php esc_html_e( 'In-Person', 'culture-community' ); ?></span>
                                <?php else : ?>
                                    <span class="culture-event__badge culture-event__badge--virtual"><?php esc_html_e( 'Virtual', 'culture-community' ); ?></span>
                                <?php endif; ?>
                            </div>
                            <div class="culture-event__meta">
                                <span class="culture-event__date"><?php echo esc_html( date_i18n( get_option( 'date_format' ) . ' ' . get_option( 'time_format' ), strtotime( $event_date ) ) ); ?></span>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
            </div>
        <?php endif; ?>
    </article>

<?php
endwhile;

get_footer();
