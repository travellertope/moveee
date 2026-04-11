<?php
/**
 * Shortcodes for frontend rendering.
 *
 * [culture_passport]       - User profile, badges, QR code.
 * [culture_chapter_events] - Upcoming events for user's chapter(s).
 * [culture_digest]         - Newsletter with paragraph-level comments/reactions.
 * [culture_chapter_map]    - Leaflet map of all chapters.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Culture_Shortcodes {

    public static function init() {
        add_shortcode( 'culture_passport', array( __CLASS__, 'render_passport' ) );
        add_shortcode( 'culture_chapter_events', array( __CLASS__, 'render_chapter_events' ) );
        add_shortcode( 'culture_digest', array( __CLASS__, 'render_digest' ) );
        add_shortcode( 'culture_chapter_map', array( __CLASS__, 'render_chapter_map' ) );
    }

    /**
     * [culture_passport] - Render user passport with badges, points, and QR code.
     */
    public static function render_passport( $atts ) {
        if ( ! is_user_logged_in() ) {
            return '<p class="culture-login-prompt">' . esc_html__( 'Please log in to view your passport.', 'culture-community' ) . '</p>';
        }

        $user_id = get_current_user_id();
        $user    = wp_get_current_user();
        $tier    = get_user_meta( $user_id, '_culture_membership_tier', true ) ?: 'citizen';
        $points  = Culture_Gamification::get_points( $user_id );
        $badges  = Culture_Gamification::get_badges_with_status( $user_id );
        $primary   = get_user_meta( $user_id, '_culture_primary_chapter_id', true );
        $secondary = get_user_meta( $user_id, '_culture_secondary_chapter_id', true );
        $phone     = get_user_meta( $user_id, '_culture_phone', true );
        $whatsapp  = get_user_meta( $user_id, '_culture_whatsapp', true );

        // QR code data: JSON with user ID and a verification hash.
        $qr_data = wp_json_encode( array(
            'uid'  => $user_id,
            'hash' => wp_hash( 'culture_qr_' . $user_id ),
        ) );

        ob_start();
        ?>
        <div class="culture-passport" data-user-id="<?php echo esc_attr( $user_id ); ?>">
            <div class="culture-passport__header">
                <div class="culture-passport__avatar">
                    <?php echo get_avatar( $user_id, 96 ); ?>
                </div>
                <div class="culture-passport__info">
                    <h2 class="culture-passport__name"><?php echo esc_html( $user->display_name ); ?></h2>
                    <span class="culture-passport__tier culture-passport__tier--<?php echo esc_attr( $tier ); ?>">
                        <?php echo esc_html( ucfirst( $tier ) ); ?>
                    </span>
                    <div class="culture-passport__points">
                        <strong><?php echo esc_html( $points ); ?></strong> <?php esc_html_e( 'Culture Points', 'culture-community' ); ?>
                    </div>
                </div>
            </div>

            <?php if ( $phone && culture_can_view_phone( $user_id ) ) : ?>
                <div class="culture-passport__contact">
                    <h3><?php esc_html_e( 'Contact', 'culture-community' ); ?></h3>
                    <div class="culture-passport__contact-row">
                        <span class="culture-passport__contact-label"><?php esc_html_e( 'Phone:', 'culture-community' ); ?></span>
                        <a href="tel:<?php echo esc_attr( $phone ); ?>"><?php echo esc_html( $phone ); ?></a>
                    </div>
                    <div class="culture-passport__contact-row">
                        <span class="culture-passport__contact-label"><?php esc_html_e( 'WhatsApp:', 'culture-community' ); ?></span>
                        <?php
                        $wa_number = $whatsapp ? $whatsapp : $phone;
                        $wa_digits = preg_replace( '/[^0-9]/', '', $wa_number );
                        ?>
                        <a href="https://wa.me/<?php echo esc_attr( $wa_digits ); ?>" target="_blank" rel="noopener noreferrer"><?php echo esc_html( $wa_number ); ?></a>
                    </div>
                </div>
            <?php endif; ?>

            <div class="culture-passport__chapters">
                <h3><?php esc_html_e( 'Chapters', 'culture-community' ); ?></h3>
                <?php if ( $primary ) : ?>
                    <div class="culture-passport__chapter">
                        <span class="culture-passport__chapter-label"><?php esc_html_e( 'Primary:', 'culture-community' ); ?></span>
                        <?php echo esc_html( get_the_title( $primary ) ); ?>
                    </div>
                <?php endif; ?>
                <?php if ( $secondary ) : ?>
                    <div class="culture-passport__chapter">
                        <span class="culture-passport__chapter-label"><?php esc_html_e( 'Secondary:', 'culture-community' ); ?></span>
                        <?php echo esc_html( get_the_title( $secondary ) ); ?>
                    </div>
                <?php endif; ?>
            </div>

            <div class="culture-passport__qr">
                <h3><?php esc_html_e( 'Your QR Code', 'culture-community' ); ?></h3>
                <div class="culture-passport__qr-code" data-qr="<?php echo esc_attr( $qr_data ); ?>">
                    <img src="<?php echo esc_url( admin_url( 'admin-ajax.php?action=culture_generate_qr&user_id=' . $user_id . '&nonce=' . wp_create_nonce( 'culture_qr_' . $user_id ) ) ); ?>" alt="<?php esc_attr_e( 'Your passport QR code', 'culture-community' ); ?>" />
                </div>
            </div>

            <div class="culture-passport__badges">
                <h3><?php esc_html_e( 'Badges', 'culture-community' ); ?></h3>
                <div class="culture-passport__badge-grid">
                    <?php foreach ( $badges as $slug => $badge ) : ?>
                        <div class="culture-passport__badge <?php echo $badge['earned'] ? 'culture-passport__badge--earned' : 'culture-passport__badge--locked'; ?>">
                            <span class="dashicons <?php echo esc_attr( $badge['icon'] ); ?>"></span>
                            <span class="culture-passport__badge-name"><?php echo esc_html( $badge['name'] ); ?></span>
                            <span class="culture-passport__badge-desc"><?php echo esc_html( $badge['description'] ); ?></span>
                        </div>
                    <?php endforeach; ?>
                </div>
            </div>

            <?php if ( 'citizen' === $tier ) : ?>
                <div class="culture-passport__upgrade">
                    <p><?php esc_html_e( 'Upgrade to Patron for physical event access and dual chapter membership!', 'culture-community' ); ?></p>
                    <a href="<?php echo esc_url( Culture_Paystack::get_checkout_url( $user_id ) ); ?>" class="culture-btn culture-btn--primary">
                        <?php esc_html_e( 'Upgrade to Patron', 'culture-community' ); ?>
                    </a>
                </div>
            <?php endif; ?>
        </div>
        <?php
        return ob_get_clean();
    }

    /**
     * [culture_chapter_events] - List upcoming events for user's chapter(s).
     */
    public static function render_chapter_events( $atts ) {
        $atts = shortcode_atts( array(
            'chapter_id' => 0,
            'limit'      => 10,
        ), $atts );

        $user_id = get_current_user_id();
        $chapter_ids = array();

        if ( $atts['chapter_id'] ) {
            $chapter_ids[] = absint( $atts['chapter_id'] );
        } elseif ( $user_id ) {
            $primary   = get_user_meta( $user_id, '_culture_primary_chapter_id', true );
            $secondary = get_user_meta( $user_id, '_culture_secondary_chapter_id', true );
            if ( $primary ) $chapter_ids[] = (int) $primary;
            if ( $secondary ) $chapter_ids[] = (int) $secondary;
        }

        $meta_query = array(
            array(
                'key'     => '_culture_event_date',
                'value'   => current_time( 'Y-m-d\TH:i' ),
                'compare' => '>=',
                'type'    => 'DATETIME',
            ),
        );

        if ( ! empty( $chapter_ids ) ) {
            $meta_query[] = array(
                'key'     => '_culture_chapter_id',
                'value'   => $chapter_ids,
                'compare' => 'IN',
            );
        }

        $events = get_posts( array(
            'post_type'      => 'culture_event',
            'posts_per_page' => absint( $atts['limit'] ),
            'meta_query'     => $meta_query,
            'meta_key'       => '_culture_event_date',
            'orderby'        => 'meta_value',
            'order'          => 'ASC',
        ) );

        ob_start();
        ?>
        <div class="culture-events">
            <?php if ( empty( $events ) ) : ?>
                <p><?php esc_html_e( 'No upcoming events found.', 'culture-community' ); ?></p>
            <?php else : ?>
                <?php foreach ( $events as $event ) :
                    $event_date  = get_post_meta( $event->ID, '_culture_event_date', true );
                    $is_physical = get_post_meta( $event->ID, '_culture_is_physical', true );
                    $capacity    = get_post_meta( $event->ID, '_culture_capacity', true );
                    $chapter_id  = get_post_meta( $event->ID, '_culture_chapter_id', true );
                    $chapter_name = $chapter_id ? get_the_title( $chapter_id ) : '';
                ?>
                    <div class="culture-event" data-event-id="<?php echo esc_attr( $event->ID ); ?>">
                        <div class="culture-event__header">
                            <h3 class="culture-event__title"><?php echo esc_html( $event->post_title ); ?></h3>
                            <?php if ( '1' === $is_physical ) : ?>
                                <span class="culture-event__badge culture-event__badge--physical"><?php esc_html_e( 'In-Person', 'culture-community' ); ?></span>
                            <?php else : ?>
                                <span class="culture-event__badge culture-event__badge--virtual"><?php esc_html_e( 'Virtual', 'culture-community' ); ?></span>
                            <?php endif; ?>
                        </div>
                        <div class="culture-event__meta">
                            <span class="culture-event__date"><?php echo esc_html( date_i18n( get_option( 'date_format' ) . ' ' . get_option( 'time_format' ), strtotime( $event_date ) ) ); ?></span>
                            <?php if ( $chapter_name ) : ?>
                                <span class="culture-event__chapter"><?php echo esc_html( $chapter_name ); ?></span>
                            <?php endif; ?>
                            <?php if ( $capacity ) : ?>
                                <span class="culture-event__capacity"><?php printf( esc_html__( 'Capacity: %d', 'culture-community' ), $capacity ); ?></span>
                            <?php endif; ?>
                        </div>
                        <div class="culture-event__excerpt">
                            <?php echo wp_kses_post( wp_trim_words( $event->post_content, 30 ) ); ?>
                        </div>
                        <div class="culture-event__actions">
                            <button class="culture-btn culture-btn--rsvp js-culture-rsvp" data-event-id="<?php echo esc_attr( $event->ID ); ?>">
                                <?php esc_html_e( 'RSVP', 'culture-community' ); ?>
                            </button>
                        </div>
                    </div>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>
        <?php
        return ob_get_clean();
    }

    /**
     * [culture_digest] - Render newsletter with paragraph-level interactions.
     */
    public static function render_digest( $atts ) {
        $atts = shortcode_atts( array(
            'id' => 0,
        ), $atts );

        $post_id = absint( $atts['id'] );
        if ( ! $post_id ) {
            // Get the latest newsletter.
            $latest = get_posts( array(
                'post_type'      => 'culture_newsletter',
                'posts_per_page' => 1,
                'orderby'        => 'date',
                'order'          => 'DESC',
            ) );
            if ( empty( $latest ) ) {
                return '<p>' . esc_html__( 'No newsletters found.', 'culture-community' ) . '</p>';
            }
            $post_id = $latest[0]->ID;
        }

        $post = get_post( $post_id );
        if ( ! $post || 'culture_newsletter' !== $post->post_type ) {
            return '<p>' . esc_html__( 'Newsletter not found.', 'culture-community' ) . '</p>';
        }

        $content    = apply_filters( 'the_content', $post->post_content );
        $paragraphs = preg_split( '/<\/p>/', $content );
        $reactions   = array( 'fire' => "\xF0\x9F\x94\xA5", 'heart' => "\xE2\x9D\xA4\xEF\xB8\x8F", 'think' => "\xF0\x9F\xA4\x94", 'clap' => "\xF0\x9F\x91\x8F" );

        ob_start();
        ?>
        <article class="culture-digest" data-post-id="<?php echo esc_attr( $post_id ); ?>">
            <header class="culture-digest__header">
                <h2><?php echo esc_html( $post->post_title ); ?></h2>
                <time datetime="<?php echo esc_attr( $post->post_date ); ?>">
                    <?php echo esc_html( date_i18n( get_option( 'date_format' ), strtotime( $post->post_date ) ) ); ?>
                </time>
            </header>

            <div class="culture-digest__content">
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
        </article>
        <?php
        return ob_get_clean();
    }

    /**
     * [culture_chapter_map] - Leaflet.js map showing all chapters.
     */
    public static function render_chapter_map( $atts ) {
        $chapters = get_posts( array(
            'post_type'      => 'culture_chapter',
            'posts_per_page' => -1,
            'post_status'    => 'publish',
        ) );

        $markers = array();
        foreach ( $chapters as $chapter ) {
            $lat = get_post_meta( $chapter->ID, '_culture_location_lat', true );
            $lng = get_post_meta( $chapter->ID, '_culture_location_lng', true );
            if ( $lat && $lng ) {
                $markers[] = array(
                    'id'    => $chapter->ID,
                    'title' => $chapter->post_title,
                    'lat'   => (float) $lat,
                    'lng'   => (float) $lng,
                    'url'   => get_permalink( $chapter->ID ),
                );
            }
        }

        wp_enqueue_style( 'leaflet', 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css', array(), '1.9.4' );
        wp_enqueue_script( 'leaflet', 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js', array(), '1.9.4', true );

        ob_start();
        ?>
        <div id="culture-chapter-map" class="culture-chapter-map" style="height: 500px;"></div>
        <script>
        document.addEventListener('DOMContentLoaded', function() {
            var map = L.map('culture-chapter-map').setView([20, 0], 2);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(map);
            var markers = <?php echo wp_json_encode( $markers ); ?>;
            markers.forEach(function(m) {
                L.marker([m.lat, m.lng])
                    .addTo(map)
                    .bindPopup('<a href="' + m.url + '">' + m.title + '</a>');
            });
            if (markers.length > 0) {
                var bounds = L.latLngBounds(markers.map(function(m) { return [m.lat, m.lng]; }));
                map.fitBounds(bounds, { padding: [50, 50] });
            }
        });
        </script>
        <?php
        return ob_get_clean();
    }
}
