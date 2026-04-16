<?php
/**
 * Referral tracking system.
 *
 * Each user gets a unique referral code. When a new user registers with
 * a referral code, both the referrer and the referred user earn points.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Culture_Referrals {

    public static function init() {
        // Generate referral code on user registration.
        add_action( 'user_register', array( __CLASS__, 'generate_referral_code' ) );

        // Capture referral code from URL and store in cookie/session.
        add_action( 'template_redirect', array( __CLASS__, 'capture_referral_code' ) );

        // Process referral after registration completes.
        add_action( 'user_register', array( __CLASS__, 'process_referral' ), 20 );

        // AJAX handler for retrieving referral link.
        add_action( 'wp_ajax_culture_get_referral', array( __CLASS__, 'ajax_get_referral' ) );

        // Register shortcode.
        add_shortcode( 'culture_referral', array( __CLASS__, 'render_referral_widget' ) );
    }

    /**
     * Generate a unique referral code for a newly registered user.
     *
     * @param int $user_id
     */
    public static function generate_referral_code( $user_id ) {
        $existing = get_user_meta( $user_id, '_culture_referral_code', true );
        if ( ! empty( $existing ) ) {
            return;
        }

        $code = self::create_unique_code( $user_id );
        update_user_meta( $user_id, '_culture_referral_code', $code );
        update_user_meta( $user_id, '_culture_referral_count', 0 );
    }

    /**
     * Create a unique, URL-safe referral code.
     *
     * @param int $user_id
     * @return string 8-character alphanumeric code.
     */
    private static function create_unique_code( $user_id ) {
        return substr( wp_hash( 'culture_ref_' . $user_id . wp_rand() ), 0, 8 );
    }

    /**
     * Get a user's referral code, generating one if missing.
     *
     * @param int $user_id
     * @return string
     */
    public static function get_referral_code( $user_id ) {
        $code = get_user_meta( $user_id, '_culture_referral_code', true );
        if ( empty( $code ) ) {
            self::generate_referral_code( $user_id );
            $code = get_user_meta( $user_id, '_culture_referral_code', true );
        }
        return $code;
    }

    /**
     * Get the full referral URL for a user.
     *
     * @param int $user_id
     * @return string
     */
    public static function get_referral_url( $user_id ) {
        $code = self::get_referral_code( $user_id );
        
        // Use configured registration page if available, fallback to default.
        $reg_url = class_exists( 'Culture_Settings' ) ? Culture_Settings::get( 'culture_registration_page' ) : '';
        if ( empty( $reg_url ) ) {
            $reg_url = home_url( '/register/' );
        }

        return add_query_arg( 'ref', $code, $reg_url );
    }

    /**
     * Get total referral count for a user.
     *
     * @param int $user_id
     * @return int
     */
    public static function get_referral_count( $user_id ) {
        return (int) get_user_meta( $user_id, '_culture_referral_count', true );
    }

    /**
     * Capture referral code from URL query parameter and store in a cookie.
     */
    public static function capture_referral_code() {
        if ( ! isset( $_GET['ref'] ) ) {
            return;
        }

        $code = sanitize_key( $_GET['ref'] );
        if ( empty( $code ) ) {
            return;
        }

        // Don't overwrite an existing referral cookie.
        if ( isset( $_COOKIE['culture_ref'] ) ) {
            return;
        }

        // Validate the referral code belongs to a real user.
        $referrer = self::get_user_by_referral_code( $code );
        if ( ! $referrer ) {
            return;
        }

        // Store for configurable number of days.
        $cookie_days = class_exists( 'Culture_Settings' ) ? (int) Culture_Settings::get( 'culture_referral_cookie_days' ) : 30;
        setcookie( 'culture_ref', $code, time() + ( $cookie_days * DAY_IN_SECONDS ), COOKIEPATH, COOKIE_DOMAIN, is_ssl(), true );
    }

    /**
     * Process a referral when a new user registers.
     * Called at priority 20 so the referral code has been generated first.
     *
     * @param int $new_user_id
     */
    public static function process_referral( $new_user_id ) {
        $code = '';

        // Check cookie first.
        if ( isset( $_COOKIE['culture_ref'] ) ) {
            $code = sanitize_key( $_COOKIE['culture_ref'] );
        }

        // Check POST data (from registration form hidden field).
        if ( empty( $code ) && isset( $_POST['culture_referral_code'] ) ) {
            $code = sanitize_key( $_POST['culture_referral_code'] );
        }

        if ( empty( $code ) ) {
            return;
        }

        $referrer_id = self::get_user_by_referral_code( $code );
        if ( ! $referrer_id ) {
            return;
        }

        // Prevent self-referral.
        if ( $referrer_id === $new_user_id ) {
            return;
        }

        // Check if this new user was already referred (prevent double processing).
        $already_referred = get_user_meta( $new_user_id, '_culture_referred_by', true );
        if ( ! empty( $already_referred ) ) {
            return;
        }

        // Record the referral relationship.
        update_user_meta( $new_user_id, '_culture_referred_by', $referrer_id );

        // Increment referrer's count.
        $count = self::get_referral_count( $referrer_id );
        update_user_meta( $referrer_id, '_culture_referral_count', $count + 1 );

        // Award points to the referrer.
        Culture_Gamification::award_points( $referrer_id, 'referral' );

        // Clear the referral cookie.
        setcookie( 'culture_ref', '', time() - 3600, COOKIEPATH, COOKIE_DOMAIN, is_ssl(), true );

        do_action( 'culture_referral_completed', $referrer_id, $new_user_id );
    }

    /**
     * Look up a user ID by their referral code.
     *
     * @param string $code
     * @return int|false
     */
    public static function get_user_by_referral_code( $code ) {
        $users = get_users( array(
            'meta_key'   => '_culture_referral_code',
            'meta_value' => $code,
            'number'     => 1,
            'fields'     => 'ID',
        ) );

        return ! empty( $users ) ? (int) $users[0] : false;
    }

    /**
     * AJAX handler: return current user's referral link and stats.
     */
    public static function ajax_get_referral() {
        check_ajax_referer( 'culture_nonce', 'nonce' );

        if ( ! is_user_logged_in() ) {
            wp_send_json_error( array( 'message' => __( 'Please log in.', 'culture-community' ) ) );
        }

        $user_id = get_current_user_id();

        wp_send_json_success( array(
            'referral_url'   => self::get_referral_url( $user_id ),
            'referral_code'  => self::get_referral_code( $user_id ),
            'referral_count' => self::get_referral_count( $user_id ),
        ) );
    }

    /**
     * [culture_referral] - Render referral widget with share link and stats.
     */
    public static function render_referral_widget( $atts ) {
        if ( ! is_user_logged_in() ) {
            return '<p class="culture-login-prompt">' . esc_html__( 'Please log in to access your referral link.', 'culture-community' ) . '</p>';
        }

        $user_id      = get_current_user_id();
        $referral_url = self::get_referral_url( $user_id );
        $referral_count = self::get_referral_count( $user_id );

        ob_start();
        ?>
        <div class="culture-referral">
            <h3><?php esc_html_e( 'Invite Friends', 'culture-community' ); ?></h3>
            <p><?php
                printf(
                    /* translators: %d: number of points per referral */
                    esc_html__( 'Share your referral link and earn %d Culture Points for each friend who joins!', 'culture-community' ),
                    Culture_Gamification::get_point_value( 'referral' )
                );
            ?></p>

            <div class="culture-referral__link-box">
                <input type="text" readonly value="<?php echo esc_url( $referral_url ); ?>" class="culture-referral__url" id="culture-referral-url" />
                <button class="culture-btn culture-btn--primary js-culture-copy-referral" data-target="culture-referral-url">
                    <?php esc_html_e( 'Copy', 'culture-community' ); ?>
                </button>
            </div>

            <div class="culture-referral__stats">
                <div class="culture-referral__stat">
                    <span class="culture-referral__stat-value"><?php echo esc_html( $referral_count ); ?></span>
                    <span class="culture-referral__stat-label"><?php esc_html_e( 'Friends Referred', 'culture-community' ); ?></span>
                </div>
                <div class="culture-referral__stat">
                    <span class="culture-referral__stat-value"><?php echo esc_html( $referral_count * 25 ); ?></span>
                    <span class="culture-referral__stat-label"><?php esc_html_e( 'Referral Points Earned', 'culture-community' ); ?></span>
                </div>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }
}
