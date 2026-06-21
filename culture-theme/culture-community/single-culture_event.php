<?php
/**
 * Template: Single Event (Theme Override)
 *
 * Rich event page with details, RSVP, and related events.
 */

get_header();

while ( have_posts() ) :
    the_post();

    $event_id    = get_the_ID();
    $event_date  = get_post_meta( $event_id, '_culture_event_date', true );
    $is_physical = get_post_meta( $event_id, '_culture_is_physical', true );
    $capacity    = get_post_meta( $event_id, '_culture_capacity', true );

    // Count RSVPs.
    global $wpdb;
    $table      = $wpdb->prefix . 'culture_attendance';
    $rsvp_count = (int) $wpdb->get_var( $wpdb->prepare(
        "SELECT COUNT(*) FROM {$table} WHERE event_id = %d AND status IN ('rsvp', 'checked_in')",
        $event_id
    ) );

    $spots_left = $capacity ? max( 0, (int) $capacity - $rsvp_count ) : null;

    // User tier check.
    $user_id       = get_current_user_id();
    $user_tier     = $user_id ? get_user_meta( $user_id, '_culture_membership_tier', true ) : '';
    $is_restricted = ( '1' === $is_physical && 'patron' !== $user_tier );

    // Check if user already RSVPed.
    $has_rsvp = false;
    if ( $user_id ) {
        $has_rsvp = (bool) $wpdb->get_var( $wpdb->prepare(
            "SELECT id FROM {$table} WHERE user_id = %d AND event_id = %d AND status IN ('rsvp', 'checked_in')",
            $user_id,
            $event_id
        ) );
    }

    $interests = get_the_terms( $event_id, 'culture_interest' );

    // Date parts.
    $ts             = $event_date ? strtotime( $event_date ) : false;
    $formatted_date = $ts ? date_i18n( get_option( 'date_format' ), $ts ) : '';
    $formatted_time = $ts ? date_i18n( get_option( 'time_format' ), $ts ) : '';
    $day_name       = $ts ? date_i18n( 'l', $ts ) : '';
    $month_short    = $ts ? date_i18n( 'M', $ts ) : '';
    $day_num        = $ts ? date_i18n( 'd', $ts ) : '';
    $year           = $ts ? date_i18n( 'Y', $ts ) : '';

    // Is the event in the past?
    $is_past = $ts && $ts < current_time( 'timestamp' );

    // Related events (same interests, upcoming).
    $related_args = array(
        'post_type'      => 'culture_event',
        'posts_per_page' => 3,
        'post__not_in'   => array( $event_id ),
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
    );
    $related_events = get_posts( $related_args );
?>

<article <?php post_class( 'ct-single-event' ); ?>>

    <!-- Hero Banner -->
    <div class="ct-single-event__hero">
        <?php if ( has_post_thumbnail() ) : ?>
            <div class="ct-single-event__hero-bg">
                <?php the_post_thumbnail( 'culture-hero' ); ?>
                <div class="ct-single-event__hero-overlay"></div>
            </div>
        <?php else : ?>
            <div class="ct-single-event__hero-bg ct-single-event__hero-bg--fallback">
                <div class="ct-single-event__hero-overlay"></div>
            </div>
        <?php endif; ?>

        <div class="ct-single-event__hero-content">
            <div class="ct-single-event__hero-inner">
                <div class="ct-single-event__hero-badges">
                    <?php if ( '1' === $is_physical ) : ?>
                        <span class="ct-badge ct-badge--sm ct-single-event__type-badge ct-single-event__type-badge--physical"><?php esc_html_e( 'In-Person', 'culture-community' ); ?></span>
                    <?php else : ?>
                        <span class="ct-badge ct-badge--sm ct-single-event__type-badge ct-single-event__type-badge--virtual"><?php esc_html_e( 'Virtual', 'culture-community' ); ?></span>
                    <?php endif; ?>
                    <?php if ( $is_past ) : ?>
                        <span class="ct-badge ct-badge--sm ct-single-event__type-badge ct-single-event__type-badge--past"><?php esc_html_e( 'Past Event', 'culture-community' ); ?></span>
                    <?php endif; ?>
                </div>
                <h1 class="ct-single-event__title"><?php the_title(); ?></h1>
                <?php if ( $interests && ! is_wp_error( $interests ) ) : ?>
                    <div class="ct-single-event__tags">
                        <?php foreach ( $interests as $interest ) : ?>
                            <span class="ct-badge ct-badge--sm"><?php echo esc_html( $interest->name ); ?></span>
                        <?php endforeach; ?>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </div>

    <!-- Info Strip -->
    <div class="ct-single-event__info-strip">
        <div class="ct-single-event__info-inner">
            <?php if ( $ts ) : ?>
                <div class="ct-single-event__info-item">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    <div>
                        <strong><?php echo esc_html( $day_name . ', ' . $formatted_date ); ?></strong>
                        <span><?php echo esc_html( $formatted_time ); ?></span>
                    </div>
                </div>
            <?php endif; ?>
            <div class="ct-single-event__info-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <div>
                    <span><?php echo esc_html( '1' === $is_physical ? __( 'In-person event', 'culture-community' ) : __( 'Virtual event', 'culture-community' ) ); ?></span>
                </div>
            </div>
            <div class="ct-single-event__info-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                <div>
                    <strong>
                        <?php
                        printf(
                            esc_html( _n( '%d RSVP', '%d RSVPs', $rsvp_count, 'culture-community' ) ),
                            $rsvp_count
                        );
                        ?>
                    </strong>
                    <?php if ( $capacity ) : ?>
                        <span>
                            <?php
                            printf(
                                /* translators: %1$d: spots left, %2$d: total */
                                esc_html__( '%1$d of %2$d spots left', 'culture-community' ),
                                $spots_left,
                                (int) $capacity
                            );
                            ?>
                        </span>
                    <?php else : ?>
                        <span><?php esc_html_e( 'Unlimited capacity', 'culture-community' ); ?></span>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </div>

    <div class="ct-single-event__body">
        <div class="ct-single-event__body-inner">

            <!-- Main Content Column -->
            <div class="ct-single-event__main">

                <!-- About Section -->
                <section class="ct-single-event__section">
                    <h2 class="ct-single-event__section-title">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                        <?php esc_html_e( 'About This Event', 'culture-community' ); ?>
                    </h2>
                    <div class="ct-single-event__content">
                        <?php the_content(); ?>
                    </div>
                </section>

                <!-- Related Events -->
                <?php if ( ! empty( $related_events ) ) : ?>
                    <section class="ct-single-event__section">
                        <h2 class="ct-single-event__section-title">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                            <?php esc_html_e( 'More Events', 'culture-community' ); ?>
                        </h2>
                        <div class="ct-single-event__related-grid">
                            <?php foreach ( $related_events as $rel ) :
                                $rel_date     = get_post_meta( $rel->ID, '_culture_event_date', true );
                                $rel_physical = get_post_meta( $rel->ID, '_culture_is_physical', true );
                            ?>
                                <a href="<?php echo esc_url( get_permalink( $rel ) ); ?>" class="ct-event-card">
                                    <div class="ct-event-card__date-block">
                                        <span class="ct-event-card__month"><?php echo esc_html( date_i18n( 'M', strtotime( $rel_date ) ) ); ?></span>
                                        <span class="ct-event-card__day"><?php echo esc_html( date_i18n( 'd', strtotime( $rel_date ) ) ); ?></span>
                                    </div>
                                    <div class="ct-event-card__body">
                                        <h3 class="ct-event-card__title"><?php echo esc_html( $rel->post_title ); ?></h3>
                                        <div class="ct-event-card__meta">
                                            <span><?php echo esc_html( date_i18n( 'g:i A', strtotime( $rel_date ) ) ); ?></span>
                                        </div>
                                    </div>
                                    <?php if ( '1' === $rel_physical ) : ?>
                                        <span class="ct-event-card__type ct-event-card__type--physical"><?php esc_html_e( 'IRL', 'culture-theme' ); ?></span>
                                    <?php else : ?>
                                        <span class="ct-event-card__type ct-event-card__type--virtual"><?php esc_html_e( 'Virtual', 'culture-theme' ); ?></span>
                                    <?php endif; ?>
                                </a>
                            <?php endforeach; ?>
                        </div>
                    </section>
                <?php endif; ?>
            </div>

            <!-- Sidebar -->
            <aside class="ct-single-event__sidebar">

                <!-- RSVP Card -->
                <div class="ct-single-event__sidebar-card ct-single-event__rsvp-card">
                    <?php if ( $ts ) : ?>
                        <div class="ct-single-event__rsvp-date">
                            <div class="ct-single-event__rsvp-date-block">
                                <span class="ct-single-event__rsvp-month"><?php echo esc_html( $month_short ); ?></span>
                                <span class="ct-single-event__rsvp-day"><?php echo esc_html( $day_num ); ?></span>
                                <span class="ct-single-event__rsvp-year"><?php echo esc_html( $year ); ?></span>
                            </div>
                            <div class="ct-single-event__rsvp-time">
                                <strong><?php echo esc_html( $day_name ); ?></strong>
                                <span><?php echo esc_html( $formatted_time ); ?></span>
                            </div>
                        </div>
                    <?php endif; ?>

                    <?php if ( $capacity ) : ?>
                        <div class="ct-single-event__capacity-bar">
                            <?php $fill = $capacity ? min( 100, round( ( $rsvp_count / (int) $capacity ) * 100 ) ) : 0; ?>
                            <div class="ct-single-event__capacity-track">
                                <div class="ct-single-event__capacity-fill" style="width: <?php echo esc_attr( $fill ); ?>%"></div>
                            </div>
                            <div class="ct-single-event__capacity-text">
                                <?php
                                printf(
                                    esc_html__( '%1$d / %2$d spots filled', 'culture-community' ),
                                    $rsvp_count,
                                    (int) $capacity
                                );
                                ?>
                            </div>
                        </div>
                    <?php endif; ?>

                    <div class="ct-single-event__rsvp-action">
                        <?php if ( $is_past ) : ?>
                            <div class="ct-single-event__notice ct-single-event__notice--past">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                                <span><?php esc_html_e( 'This event has already taken place.', 'culture-community' ); ?></span>
                            </div>
                        <?php elseif ( ! is_user_logged_in() ) : ?>
                            <a href="<?php echo esc_url( wp_login_url( get_permalink() ) ); ?>" class="ct-btn ct-btn--accent ct-btn--block">
                                <?php esc_html_e( 'Log In to RSVP', 'culture-community' ); ?>
                            </a>
                            <p class="ct-single-event__rsvp-note"><?php esc_html_e( 'You need an account to RSVP for events.', 'culture-community' ); ?></p>
                        <?php elseif ( $is_restricted ) : ?>
                            <div class="ct-single-event__notice ct-single-event__notice--restricted">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                                <span><?php esc_html_e( 'Patron membership required for in-person events.', 'culture-community' ); ?></span>
                            </div>
                            <a href="<?php echo esc_url( Culture_Paystack::get_checkout_url( $user_id ) ); ?>" class="ct-btn ct-btn--accent ct-btn--block">
                                <?php esc_html_e( 'Upgrade to Patron', 'culture-community' ); ?>
                            </a>
                        <?php elseif ( $has_rsvp ) : ?>
                            <div class="ct-single-event__notice ct-single-event__notice--success">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                                <span><?php esc_html_e( "You're attending this event!", 'culture-community' ); ?></span>
                            </div>
                        <?php elseif ( null !== $spots_left && 0 === $spots_left ) : ?>
                            <div class="ct-single-event__notice ct-single-event__notice--full">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                                <span><?php esc_html_e( 'This event is at full capacity.', 'culture-community' ); ?></span>
                            </div>
                        <?php else : ?>
                            <button class="ct-btn ct-btn--accent ct-btn--block js-culture-rsvp" data-event-id="<?php echo esc_attr( $event_id ); ?>">
                                <?php esc_html_e( 'RSVP Now', 'culture-community' ); ?>
                            </button>
                        <?php endif; ?>
                    </div>
                </div>

                <!-- Event Details Card -->
                <div class="ct-single-event__sidebar-card">
                    <h3 class="ct-single-event__sidebar-title">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                        <?php esc_html_e( 'Event Details', 'culture-community' ); ?>
                    </h3>
                    <div class="ct-single-event__details-list">
                        <div class="ct-single-event__detail-row">
                            <span><?php esc_html_e( 'Format', 'culture-community' ); ?></span>
                            <strong><?php echo esc_html( '1' === $is_physical ? __( 'In-Person', 'culture-community' ) : __( 'Virtual', 'culture-community' ) ); ?></strong>
                        </div>
                        <?php if ( $capacity ) : ?>
                            <div class="ct-single-event__detail-row">
                                <span><?php esc_html_e( 'Capacity', 'culture-community' ); ?></span>
                                <strong><?php echo esc_html( $capacity ); ?></strong>
                            </div>
                        <?php endif; ?>
                        <div class="ct-single-event__detail-row">
                            <span><?php esc_html_e( 'RSVPs', 'culture-community' ); ?></span>
                            <strong><?php echo esc_html( $rsvp_count ); ?></strong>
                        </div>
                        <?php if ( '1' === $is_physical ) : ?>
                            <div class="ct-single-event__detail-row">
                                <span><?php esc_html_e( 'Access', 'culture-community' ); ?></span>
                                <strong><?php esc_html_e( 'Patron Only', 'culture-community' ); ?></strong>
                            </div>
                        <?php else : ?>
                            <div class="ct-single-event__detail-row">
                                <span><?php esc_html_e( 'Access', 'culture-community' ); ?></span>
                                <strong><?php esc_html_e( 'All Members', 'culture-community' ); ?></strong>
                            </div>
                        <?php endif; ?>
                    </div>
                </div>

                <!-- Share Card -->
                <div class="ct-single-event__sidebar-card">
                    <h3 class="ct-single-event__sidebar-title">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                        <?php esc_html_e( 'Share Event', 'culture-community' ); ?>
                    </h3>
                    <?php
                    $share_url   = rawurlencode( get_permalink() );
                    $share_title = rawurlencode( get_the_title() );
                    ?>
                    <div class="ct-single-event__share-links">
                        <a href="https://twitter.com/intent/tweet?url=<?php echo $share_url; ?>&text=<?php echo $share_title; ?>" target="_blank" rel="noopener noreferrer" class="ct-share__link" aria-label="Share on X">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                        </a>
                        <a href="https://www.facebook.com/sharer/sharer.php?u=<?php echo $share_url; ?>" target="_blank" rel="noopener noreferrer" class="ct-share__link" aria-label="Share on Facebook">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                        </a>
                        <button class="ct-share__link ct-share__copy" data-url="<?php echo esc_url( get_permalink() ); ?>" aria-label="<?php esc_attr_e( 'Copy link', 'culture-theme' ); ?>">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                        </button>
                    </div>
                </div>

            </aside>
        </div>
    </div>

</article>

<?php
endwhile;

get_footer();
