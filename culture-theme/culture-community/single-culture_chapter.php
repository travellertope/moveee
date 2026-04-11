<?php
/**
 * Template: Single Chapter (Theme Override)
 *
 * Rich chapter page with stats, upcoming events, members, and map.
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
    $primary_members = get_users( array(
        'meta_key'   => '_culture_primary_chapter_id',
        'meta_value' => $chapter_id,
        'fields'     => 'ID',
    ) );
    $secondary_members = get_users( array(
        'meta_key'   => '_culture_secondary_chapter_id',
        'meta_value' => $chapter_id,
        'fields'     => 'ID',
    ) );
    $primary_count   = count( $primary_members );
    $secondary_count = count( $secondary_members );
    $total_members   = $primary_count + $secondary_count;

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

    // Past events count.
    $past_events = get_posts( array(
        'post_type'      => 'culture_event',
        'posts_per_page' => -1,
        'fields'         => 'ids',
        'meta_query'     => array(
            array(
                'key'   => '_culture_chapter_id',
                'value' => $chapter_id,
            ),
            array(
                'key'     => '_culture_event_date',
                'value'   => current_time( 'Y-m-d\TH:i' ),
                'compare' => '<',
                'type'    => 'DATETIME',
            ),
        ),
    ) );
    $past_event_count = count( $past_events );

    // Interests taxonomy.
    $interests = get_the_terms( $chapter_id, 'culture_interest' );

    // Recent members (get actual user objects for avatars — limit to 8).
    $all_member_ids = array_unique( array_merge( $primary_members, $secondary_members ) );
    $display_members = array_slice( $all_member_ids, 0, 8 );
?>

<article <?php post_class( 'ct-single-chapter' ); ?>>

    <!-- Hero Banner -->
    <div class="ct-single-chapter__hero">
        <?php if ( has_post_thumbnail() ) : ?>
            <div class="ct-single-chapter__hero-bg">
                <?php the_post_thumbnail( 'culture-hero' ); ?>
                <div class="ct-single-chapter__hero-overlay"></div>
            </div>
        <?php else : ?>
            <div class="ct-single-chapter__hero-bg ct-single-chapter__hero-bg--fallback">
                <div class="ct-single-chapter__hero-overlay"></div>
            </div>
        <?php endif; ?>

        <div class="ct-single-chapter__hero-content">
            <div class="ct-single-chapter__hero-inner">
                <h1 class="ct-single-chapter__title"><?php the_title(); ?></h1>
                <?php if ( $leader ) : ?>
                    <p class="ct-single-chapter__leader">
                        <?php echo get_avatar( $leader_id, 28 ); ?>
                        <span>
                            <?php
                            printf(
                                /* translators: %s: leader display name */
                                esc_html__( 'Led by %s', 'culture-community' ),
                                esc_html( $leader->display_name )
                            );
                            ?>
                        </span>
                    </p>
                <?php endif; ?>
                <?php if ( $interests && ! is_wp_error( $interests ) ) : ?>
                    <div class="ct-single-chapter__tags">
                        <?php foreach ( $interests as $interest ) : ?>
                            <span class="ct-badge ct-badge--sm"><?php echo esc_html( $interest->name ); ?></span>
                        <?php endforeach; ?>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </div>

    <!-- Stats Bar -->
    <div class="ct-single-chapter__stats">
        <div class="ct-single-chapter__stats-inner">
            <div class="ct-single-chapter__stat">
                <span class="ct-single-chapter__stat-value"><?php echo esc_html( $total_members ); ?></span>
                <span class="ct-single-chapter__stat-label"><?php echo esc_html( _n( 'Member', 'Members', $total_members, 'culture-community' ) ); ?></span>
            </div>
            <div class="ct-single-chapter__stat">
                <span class="ct-single-chapter__stat-value"><?php echo esc_html( count( $events ) ); ?></span>
                <span class="ct-single-chapter__stat-label"><?php esc_html_e( 'Upcoming Events', 'culture-community' ); ?></span>
            </div>
            <div class="ct-single-chapter__stat">
                <span class="ct-single-chapter__stat-value"><?php echo esc_html( $past_event_count ); ?></span>
                <span class="ct-single-chapter__stat-label"><?php esc_html_e( 'Past Events', 'culture-community' ); ?></span>
            </div>
            <?php if ( $lat && $lng ) : ?>
                <div class="ct-single-chapter__stat">
                    <svg class="ct-single-chapter__stat-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                    <span class="ct-single-chapter__stat-label"><?php esc_html_e( 'Physical Location', 'culture-community' ); ?></span>
                </div>
            <?php endif; ?>
        </div>
    </div>

    <div class="ct-single-chapter__body">
        <div class="ct-single-chapter__body-inner">

            <!-- Main Content Column -->
            <div class="ct-single-chapter__main">

                <!-- About Section -->
                <section class="ct-single-chapter__section">
                    <h2 class="ct-single-chapter__section-title">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                        <?php esc_html_e( 'About This Chapter', 'culture-community' ); ?>
                    </h2>
                    <div class="ct-single-chapter__content">
                        <?php the_content(); ?>
                    </div>
                </section>

                <!-- Upcoming Events -->
                <?php if ( ! empty( $events ) ) : ?>
                    <section class="ct-single-chapter__section">
                        <h2 class="ct-single-chapter__section-title">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            <?php esc_html_e( 'Upcoming Events', 'culture-community' ); ?>
                        </h2>
                        <div class="ct-single-chapter__events">
                            <?php foreach ( $events as $event ) :
                                $event_date  = get_post_meta( $event->ID, '_culture_event_date', true );
                                $is_physical = get_post_meta( $event->ID, '_culture_is_physical', true );
                                $capacity    = get_post_meta( $event->ID, '_culture_capacity', true );
                            ?>
                                <a href="<?php echo esc_url( get_permalink( $event->ID ) ); ?>" class="ct-event-card">
                                    <div class="ct-event-card__date-block">
                                        <span class="ct-event-card__month"><?php echo esc_html( date_i18n( 'M', strtotime( $event_date ) ) ); ?></span>
                                        <span class="ct-event-card__day"><?php echo esc_html( date_i18n( 'd', strtotime( $event_date ) ) ); ?></span>
                                    </div>
                                    <div class="ct-event-card__body">
                                        <h3 class="ct-event-card__title"><?php echo esc_html( $event->post_title ); ?></h3>
                                        <div class="ct-event-card__meta">
                                            <span><?php echo esc_html( date_i18n( 'l, g:i A', strtotime( $event_date ) ) ); ?></span>
                                            <?php if ( $capacity ) : ?>
                                                <span><?php printf( esc_html__( '%d spots', 'culture-community' ), (int) $capacity ); ?></span>
                                            <?php endif; ?>
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
                        <?php if ( count( $events ) >= 5 ) : ?>
                            <a href="<?php echo esc_url( get_post_type_archive_link( 'culture_event' ) ); ?>" class="ct-single-chapter__view-all">
                                <?php esc_html_e( 'View All Events', 'culture-community' ); ?> &rarr;
                            </a>
                        <?php endif; ?>
                    </section>
                <?php endif; ?>

                <!-- Map Section -->
                <?php if ( $lat && $lng ) : ?>
                    <section class="ct-single-chapter__section">
                        <h2 class="ct-single-chapter__section-title">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                            <?php esc_html_e( 'Location', 'culture-community' ); ?>
                        </h2>
                        <?php
                        wp_enqueue_style( 'leaflet', 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css', array(), '1.9.4' );
                        wp_enqueue_script( 'leaflet', 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js', array(), '1.9.4', true );
                        ?>
                        <div id="culture-chapter-map" class="ct-single-chapter__map"></div>
                        <script>
                        document.addEventListener('DOMContentLoaded', function() {
                            var map = L.map('culture-chapter-map').setView([<?php echo esc_js( $lat ); ?>, <?php echo esc_js( $lng ); ?>], 13);
                            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                                attribution: '&copy; OpenStreetMap contributors'
                            }).addTo(map);
                            L.marker([<?php echo esc_js( $lat ); ?>, <?php echo esc_js( $lng ); ?>])
                                .addTo(map)
                                .bindPopup('<?php echo esc_js( get_the_title() ); ?>');
                        });
                        </script>
                    </section>
                <?php endif; ?>
            </div>

            <!-- Sidebar -->
            <aside class="ct-single-chapter__sidebar">

                <!-- Members Card -->
                <div class="ct-single-chapter__sidebar-card">
                    <h3 class="ct-single-chapter__sidebar-title">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        <?php esc_html_e( 'Members', 'culture-community' ); ?>
                    </h3>
                    <?php if ( ! empty( $display_members ) ) : ?>
                        <div class="ct-single-chapter__member-faces">
                            <?php foreach ( $display_members as $member_id ) : ?>
                                <div class="ct-single-chapter__member-avatar" title="<?php echo esc_attr( get_userdata( $member_id )->display_name ); ?>">
                                    <?php echo get_avatar( $member_id, 40 ); ?>
                                </div>
                            <?php endforeach; ?>
                            <?php if ( $total_members > 8 ) : ?>
                                <div class="ct-single-chapter__member-more">
                                    +<?php echo esc_html( $total_members - 8 ); ?>
                                </div>
                            <?php endif; ?>
                        </div>
                    <?php endif; ?>
                    <div class="ct-single-chapter__member-breakdown">
                        <div class="ct-single-chapter__member-row">
                            <span><?php esc_html_e( 'Primary members', 'culture-community' ); ?></span>
                            <strong><?php echo esc_html( $primary_count ); ?></strong>
                        </div>
                        <div class="ct-single-chapter__member-row">
                            <span><?php esc_html_e( 'Secondary members', 'culture-community' ); ?></span>
                            <strong><?php echo esc_html( $secondary_count ); ?></strong>
                        </div>
                    </div>
                </div>

                <!-- Chapter Leader Card -->
                <?php if ( $leader ) : ?>
                    <div class="ct-single-chapter__sidebar-card">
                        <h3 class="ct-single-chapter__sidebar-title">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                            <?php esc_html_e( 'Chapter Leader', 'culture-community' ); ?>
                        </h3>
                        <div class="ct-single-chapter__leader-card">
                            <div class="ct-single-chapter__leader-avatar">
                                <?php echo get_avatar( $leader_id, 56 ); ?>
                            </div>
                            <div class="ct-single-chapter__leader-info">
                                <strong><?php echo esc_html( $leader->display_name ); ?></strong>
                                <?php if ( $leader->description ) : ?>
                                    <p><?php echo esc_html( wp_trim_words( $leader->description, 15 ) ); ?></p>
                                <?php endif; ?>
                            </div>
                        </div>
                    </div>
                <?php endif; ?>

                <!-- Quick Facts Card -->
                <div class="ct-single-chapter__sidebar-card">
                    <h3 class="ct-single-chapter__sidebar-title">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                        <?php esc_html_e( 'Quick Facts', 'culture-community' ); ?>
                    </h3>
                    <div class="ct-single-chapter__facts">
                        <div class="ct-single-chapter__fact-row">
                            <span><?php esc_html_e( 'Total events held', 'culture-community' ); ?></span>
                            <strong><?php echo esc_html( $past_event_count + count( $events ) ); ?></strong>
                        </div>
                        <div class="ct-single-chapter__fact-row">
                            <span><?php esc_html_e( 'Created', 'culture-community' ); ?></span>
                            <strong><?php echo esc_html( get_the_date() ); ?></strong>
                        </div>
                        <?php if ( $lat && $lng ) : ?>
                            <div class="ct-single-chapter__fact-row">
                                <span><?php esc_html_e( 'Type', 'culture-community' ); ?></span>
                                <strong><?php esc_html_e( 'Physical + Virtual', 'culture-community' ); ?></strong>
                            </div>
                        <?php else : ?>
                            <div class="ct-single-chapter__fact-row">
                                <span><?php esc_html_e( 'Type', 'culture-community' ); ?></span>
                                <strong><?php esc_html_e( 'Virtual', 'culture-community' ); ?></strong>
                            </div>
                        <?php endif; ?>
                    </div>
                </div>

                <!-- Browse Other Chapters -->
                <?php
                $other_chapters = get_posts( array(
                    'post_type'      => 'culture_chapter',
                    'posts_per_page' => 3,
                    'post__not_in'   => array( $chapter_id ),
                    'orderby'        => 'rand',
                ) );
                if ( ! empty( $other_chapters ) ) :
                ?>
                    <div class="ct-single-chapter__sidebar-card">
                        <h3 class="ct-single-chapter__sidebar-title">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                            <?php esc_html_e( 'Other Chapters', 'culture-community' ); ?>
                        </h3>
                        <div class="ct-single-chapter__other-chapters">
                            <?php foreach ( $other_chapters as $other ) :
                                $other_count = count( get_users( array(
                                    'meta_key'   => '_culture_primary_chapter_id',
                                    'meta_value' => $other->ID,
                                    'fields'     => 'ID',
                                ) ) );
                            ?>
                                <a href="<?php echo esc_url( get_permalink( $other ) ); ?>" class="ct-single-chapter__other-item">
                                    <?php if ( has_post_thumbnail( $other ) ) : ?>
                                        <div class="ct-single-chapter__other-thumb">
                                            <?php echo get_the_post_thumbnail( $other, 'culture-thumbnail' ); ?>
                                        </div>
                                    <?php endif; ?>
                                    <div class="ct-single-chapter__other-info">
                                        <strong><?php echo esc_html( $other->post_title ); ?></strong>
                                        <span>
                                            <?php printf( esc_html( _n( '%d member', '%d members', $other_count, 'culture-community' ) ), $other_count ); ?>
                                        </span>
                                    </div>
                                </a>
                            <?php endforeach; ?>
                        </div>
                        <a href="<?php echo esc_url( get_post_type_archive_link( 'culture_chapter' ) ); ?>" class="ct-single-chapter__view-all">
                            <?php esc_html_e( 'All Chapters', 'culture-community' ); ?> &rarr;
                        </a>
                    </div>
                <?php endif; ?>

            </aside>
        </div>
    </div>

</article>

<?php
endwhile;

get_footer();
