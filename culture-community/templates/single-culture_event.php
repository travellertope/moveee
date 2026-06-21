<?php
/**
 * Template: Single Event
 *
 * Override by copying to: yourtheme/culture-community/single-culture_event.php
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
    $table     = $wpdb->prefix . 'culture_attendance';
    $rsvp_count = (int) $wpdb->get_var( $wpdb->prepare(
        "SELECT COUNT(*) FROM {$table} WHERE event_id = %d AND status IN ('rsvp', 'checked_in')",
        $event_id
    ) );

    $spots_left = $capacity ? max( 0, (int) $capacity - $rsvp_count ) : null;

    $user_id   = get_current_user_id();
    $is_restricted = false;

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

    // Format date.
    $formatted_date = $event_date ? date_i18n( get_option( 'date_format' ) . ' ' . get_option( 'time_format' ), strtotime( $event_date ) ) : '';
    ?>

    <article <?php post_class( 'culture-template culture-single-event' ); ?>>
        <?php if ( has_post_thumbnail() ) : ?>
            <div class="culture-single-event__hero">
                <?php the_post_thumbnail( 'large' ); ?>
                <?php if ( '1' === $is_physical ) : ?>
                    <span class="culture-single-event__type-badge culture-single-event__type-badge--physical"><?php esc_html_e( 'In-Person', 'culture-community' ); ?></span>
                <?php else : ?>
                    <span class="culture-single-event__type-badge culture-single-event__type-badge--virtual"><?php esc_html_e( 'Virtual', 'culture-community' ); ?></span>
                <?php endif; ?>
            </div>
        <?php endif; ?>

        <header class="culture-single-event__header">
            <h1 class="culture-single-event__title"><?php the_title(); ?></h1>

            <div class="culture-single-event__details">
                <?php if ( $formatted_date ) : ?>
                    <div class="culture-single-event__detail">
                        <span class="dashicons dashicons-calendar-alt"></span>
                        <span><?php echo esc_html( $formatted_date ); ?></span>
                    </div>
                <?php endif; ?>

                <?php if ( $capacity ) : ?>
                    <div class="culture-single-event__detail">
                        <span class="dashicons dashicons-groups"></span>
                        <span>
                            <?php
                            if ( null !== $spots_left ) {
                                printf(
                                    /* translators: %1$d: spots left, %2$d: total capacity */
                                    esc_html__( '%1$d of %2$d spots remaining', 'culture-community' ),
                                    $spots_left,
                                    (int) $capacity
                                );
                            }
                            ?>
                        </span>
                    </div>
                <?php endif; ?>

                <div class="culture-single-event__detail">
                    <span class="dashicons dashicons-tickets-alt"></span>
                    <span>
                        <?php
                        printf(
                            /* translators: %d: number of RSVPs */
                            esc_html( _n( '%d RSVP', '%d RSVPs', $rsvp_count, 'culture-community' ) ),
                            $rsvp_count
                        );
                        ?>
                    </span>
                </div>
            </div>

            <?php if ( $interests && ! is_wp_error( $interests ) ) : ?>
                <div class="culture-single-event__interests">
                    <?php foreach ( $interests as $interest ) : ?>
                        <span class="culture-single-event__interest-tag"><?php echo esc_html( $interest->name ); ?></span>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
        </header>

        <div class="culture-single-event__content">
            <?php the_content(); ?>
        </div>

        <div class="culture-single-event__actions">
            <?php if ( ! is_user_logged_in() ) : ?>
                <p class="culture-single-event__notice">
                    <?php
                    printf(
                        /* translators: %s: login URL */
                        wp_kses_post( __( '<a href="%s">Log in</a> to RSVP for this event.', 'culture-community' ) ),
                        esc_url( wp_login_url( get_permalink() ) )
                    );
                    ?>
                </p>
            <?php elseif ( $is_restricted ) : ?>
                <div class="culture-single-event__restricted">
                    <p><?php esc_html_e( 'This is a physical event. Patron membership is required to attend.', 'culture-community' ); ?></p>
                    <a href="<?php echo esc_url( Culture_Paystack::get_checkout_url( $user_id ) ); ?>" class="culture-btn culture-btn--primary">
                        <?php esc_html_e( 'Upgrade to Patron', 'culture-community' ); ?>
                    </a>
                </div>
            <?php elseif ( $has_rsvp ) : ?>
                <div class="culture-single-event__rsvped">
                    <span class="dashicons dashicons-yes-alt"></span>
                    <span><?php esc_html_e( 'You have RSVPed for this event!', 'culture-community' ); ?></span>
                </div>
            <?php else : ?>
                <button class="culture-btn culture-btn--rsvp js-culture-rsvp" data-event-id="<?php echo esc_attr( $event_id ); ?>">
                    <?php esc_html_e( 'RSVP Now', 'culture-community' ); ?>
                </button>
            <?php endif; ?>
        </div>
    </article>

<?php
endwhile;

get_footer();
