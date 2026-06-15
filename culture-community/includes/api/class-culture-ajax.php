<?php
/**
 * AJAX handlers for frontend interactions (RSVP, reactions, chapter selection).
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Culture_Ajax {

    public static function init() {
        // Authenticated AJAX handlers.
        add_action( 'wp_ajax_culture_rsvp', array( __CLASS__, 'handle_rsvp' ) );
        add_action( 'wp_ajax_culture_react', array( __CLASS__, 'handle_reaction' ) );
        add_action( 'wp_ajax_culture_paragraph_comment', array( __CLASS__, 'handle_paragraph_comment' ) );
        add_action( 'wp_ajax_culture_generate_qr', array( __CLASS__, 'handle_generate_qr' ) );

        // Unauthenticated handlers - return login prompt.
        add_action( 'wp_ajax_nopriv_culture_rsvp', array( __CLASS__, 'require_login' ) );
        add_action( 'wp_ajax_nopriv_culture_react', array( __CLASS__, 'require_login' ) );
        add_action( 'wp_ajax_nopriv_culture_paragraph_comment', array( __CLASS__, 'require_login' ) );
        add_action( 'wp_ajax_nopriv_culture_generate_qr', array( __CLASS__, 'require_login' ) );
    }

    /**
     * Standard response for unauthenticated requests.
     */
    public static function require_login() {
        wp_send_json_error( array(
            'message'  => __( 'Please log in to continue.', 'culture-community' ),
            'login_url' => wp_login_url( wp_get_referer() ),
        ) );
    }

    /**
     * Handle RSVP for an event.
     */
    public static function handle_rsvp() {
        check_ajax_referer( 'culture_nonce', 'nonce' );

        if ( ! is_user_logged_in() ) {
            wp_send_json_error( array( 'message' => __( 'Please log in to RSVP.', 'culture-community' ) ) );
        }

        $event_id = isset( $_POST['event_id'] ) ? absint( $_POST['event_id'] ) : 0;
        $user_id  = get_current_user_id();

        if ( ! $event_id ) {
            wp_send_json_error( array( 'message' => __( 'Invalid event.', 'culture-community' ) ) );
        }

        $event = get_post( $event_id );
        if ( ! $event || 'culture_event' !== $event->post_type ) {
            wp_send_json_error( array( 'message' => __( 'Event not found.', 'culture-community' ) ) );
        }

        // Capacity check.
        $capacity = (int) get_post_meta( $event_id, '_culture_capacity', true );
        if ( $capacity > 0 ) {
            global $wpdb;
            $table = $wpdb->prefix . 'culture_attendance';
            $count = (int) $wpdb->get_var( $wpdb->prepare(
                "SELECT COUNT(*) FROM {$table} WHERE event_id = %d AND status IN ('rsvp', 'checked_in')",
                $event_id
            ) );
            if ( $count >= $capacity ) {
                wp_send_json_error( array( 'message' => __( 'This event is at full capacity.', 'culture-community' ) ) );
            }
        }

        // Check for existing RSVP.
        global $wpdb;
        $table    = $wpdb->prefix . 'culture_attendance';
        $existing = $wpdb->get_var( $wpdb->prepare(
            "SELECT id FROM {$table} WHERE user_id = %d AND event_id = %d AND status IN ('rsvp', 'checked_in')",
            $user_id,
            $event_id
        ) );

        if ( $existing ) {
            wp_send_json_error( array( 'message' => __( 'You have already RSVP\'d to this event.', 'culture-community' ) ) );
        }

        // Create RSVP record.
        $wpdb->insert(
            $table,
            array(
                'user_id'      => $user_id,
                'event_id'     => $event_id,
                'status'       => 'rsvp',
                'checkin_time' => current_time( 'mysql' ),
            ),
            array( '%d', '%d', '%s', '%s' )
        );

        // Award points.
        Culture_Gamification::award_points( $user_id, 'event_rsvp' );

        wp_send_json_success( array(
            'message' => __( 'RSVP confirmed!', 'culture-community' ),
            'points'  => Culture_Gamification::get_points( $user_id ),
        ) );
    }

    /**
     * Handle newsletter paragraph reaction.
     */
    public static function handle_reaction() {
        check_ajax_referer( 'culture_nonce', 'nonce' );

        if ( ! is_user_logged_in() ) {
            wp_send_json_error( array( 'message' => __( 'Please log in.', 'culture-community' ) ) );
        }

        $post_id       = isset( $_POST['post_id'] ) ? absint( $_POST['post_id'] ) : 0;
        $paragraph_idx = isset( $_POST['paragraph'] ) ? absint( $_POST['paragraph'] ) : 0;
        $reaction_type = isset( $_POST['reaction'] ) ? sanitize_key( $_POST['reaction'] ) : '';
        $user_id       = get_current_user_id();

        $allowed_reactions = array( 'fire', 'heart', 'think', 'clap' );
        if ( ! in_array( $reaction_type, $allowed_reactions, true ) ) {
            wp_send_json_error( array( 'message' => __( 'Invalid reaction.', 'culture-community' ) ) );
        }

        $meta_key   = "_culture_reactions_{$paragraph_idx}";
        $reactions   = get_post_meta( $post_id, $meta_key, true );
        $reactions   = is_array( $reactions ) ? $reactions : array();

        // Toggle reaction.
        if ( isset( $reactions[ $reaction_type ] ) && in_array( $user_id, $reactions[ $reaction_type ], true ) ) {
            $reactions[ $reaction_type ] = array_diff( $reactions[ $reaction_type ], array( $user_id ) );
        } else {
            $reactions[ $reaction_type ][] = $user_id;
            Culture_Gamification::award_points( $user_id, 'newsletter_reaction' );
        }

        update_post_meta( $post_id, $meta_key, $reactions );

        // Build counts.
        $counts = array();
        foreach ( $allowed_reactions as $r ) {
            $counts[ $r ] = isset( $reactions[ $r ] ) ? count( $reactions[ $r ] ) : 0;
        }

        wp_send_json_success( array( 'counts' => $counts ) );
    }

    /**
     * Handle paragraph-level comment on a newsletter.
     */
    public static function handle_paragraph_comment() {
        check_ajax_referer( 'culture_nonce', 'nonce' );

        if ( ! is_user_logged_in() ) {
            wp_send_json_error( array( 'message' => __( 'Please log in.', 'culture-community' ) ) );
        }

        $post_id       = isset( $_POST['post_id'] ) ? absint( $_POST['post_id'] ) : 0;
        $paragraph_idx = isset( $_POST['paragraph'] ) ? absint( $_POST['paragraph'] ) : 0;
        $comment_text  = isset( $_POST['comment'] ) ? sanitize_textarea_field( $_POST['comment'] ) : '';
        $user_id       = get_current_user_id();
        $user          = wp_get_current_user();

        if ( ! $post_id || empty( $comment_text ) ) {
            wp_send_json_error( array( 'message' => __( 'Invalid comment data.', 'culture-community' ) ) );
        }

        $post = get_post( $post_id );
        if ( ! $post || 'culture_newsletter' !== $post->post_type ) {
            wp_send_json_error( array( 'message' => __( 'Newsletter not found.', 'culture-community' ) ) );
        }

        // Insert the comment.
        $comment_id = wp_insert_comment( array(
            'comment_post_ID' => $post_id,
            'comment_author'  => $user->display_name,
            'comment_author_email' => $user->user_email,
            'comment_content' => $comment_text,
            'user_id'         => $user_id,
            'comment_approved' => 1,
        ) );

        if ( ! $comment_id ) {
            wp_send_json_error( array( 'message' => __( 'Could not save comment.', 'culture-community' ) ) );
        }

        // Store paragraph index as comment meta.
        update_comment_meta( $comment_id, '_culture_paragraph_idx', $paragraph_idx );

        // Award gamification points.
        Culture_Gamification::award_points( $user_id, 'newsletter_comment' );

        wp_send_json_success( array(
            'comment_id' => $comment_id,
            'author'     => esc_html( $user->display_name ),
            'comment'    => esc_html( $comment_text ),
            'points'     => Culture_Gamification::get_points( $user_id ),
        ) );
    }

    /**
     * Generate QR code image for a user's passport.
     */
    public static function handle_generate_qr() {
        $user_id = isset( $_GET['user_id'] ) ? absint( $_GET['user_id'] ) : 0;
        $nonce   = isset( $_GET['nonce'] ) ? sanitize_text_field( $_GET['nonce'] ) : '';

        if ( ! $user_id || ! wp_verify_nonce( $nonce, 'culture_qr_' . $user_id ) ) {
            wp_die( esc_html__( 'Invalid request.', 'culture-community' ) );
        }

        $qr_data = wp_json_encode( array(
            'uid'  => $user_id,
            'hash' => wp_hash( 'culture_qr_' . $user_id ),
        ) );

        // Use chillerlan/php-qrcode library.
        $autoload = CULTURE_PLUGIN_DIR . 'vendor/autoload.php';
        if ( file_exists( $autoload ) ) {
            require_once $autoload;
        }

        if ( class_exists( '\\chillerlan\\QRCode\\QRCode' ) ) {
            $options = new \chillerlan\QRCode\QROptions( array(
                'outputType'   => \chillerlan\QRCode\Common\EccLevel::L,
                'scale'        => 10,
                'outputBase64' => false,
            ) );

            try {
                $qrcode = new \chillerlan\QRCode\QRCode();
                header( 'Content-Type: image/svg+xml' );
                echo $qrcode->render( $qr_data );
            } catch ( \Exception $e ) {
                // Fallback: render a simple SVG placeholder with the data.
                self::render_fallback_qr( $qr_data );
            }
        } else {
            // Fallback if library unavailable.
            self::render_fallback_qr( $qr_data );
        }

        exit;
    }

    /**
     * Render a simple SVG-based QR placeholder when the QR library is unavailable.
     */
    private static function render_fallback_qr( $data ) {
        $encoded = base64_encode( $data );
        header( 'Content-Type: image/svg+xml' );
        echo '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">';
        echo '<rect width="200" height="200" fill="#fff" stroke="#333" stroke-width="4" rx="8"/>';
        echo '<text x="100" y="90" text-anchor="middle" font-family="monospace" font-size="14" fill="#333">QR Code</text>';
        echo '<text x="100" y="115" text-anchor="middle" font-family="monospace" font-size="10" fill="#666">ID: ' . esc_attr( substr( $encoded, 0, 16 ) ) . '</text>';
        echo '</svg>';
    }
}
