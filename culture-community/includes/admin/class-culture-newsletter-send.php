<?php
/**
 * Newsletter send meta box with Send Test and Send Issue buttons.
 * Registers AJAX handlers for test, send, and status polling.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Culture_Newsletter_Send {

    public static function init() {
        add_action( 'add_meta_boxes',                array( __CLASS__, 'register_meta_box' ) );
        add_action( 'admin_enqueue_scripts',          array( __CLASS__, 'enqueue_assets' ) );
        add_action( 'save_post_culture_newsletter',   array( __CLASS__, 'save_list_meta' ), 10, 2 );

        add_action( 'wp_ajax_culture_nl_send_test',  array( __CLASS__, 'ajax_send_test' ) );
        add_action( 'wp_ajax_culture_nl_send_issue', array( __CLASS__, 'ajax_send_issue' ) );
        add_action( 'wp_ajax_culture_nl_get_status', array( __CLASS__, 'ajax_get_status' ) );
    }

    /**
     * Save _culture_nl_list and _culture_nl_segment post meta when the newsletter is saved.
     */
    public static function save_list_meta( $post_id, $post ) {
        if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) return;
        if ( ! current_user_can( 'edit_post', $post_id ) ) return;
        if ( ! isset( $_POST['culture_nl_list_nonce'] ) ) return;
        if ( ! wp_verify_nonce( $_POST['culture_nl_list_nonce'], 'culture_nl_list_' . $post_id ) ) return;

        $allowed_lists = array( 'getmelit', 'culture-drop', 'culture-narratives-digest', 'vendor-letter', 'origins-field-notes' );
        $list = sanitize_key( $_POST['culture_nl_list'] ?? 'getmelit' );
        if ( in_array( $list, $allowed_lists, true ) ) {
            update_post_meta( $post_id, '_culture_nl_list', $list );
        }

        // Segment is optional — empty string means send to all segments of this list.
        $allowed_segments = array( '', 'us', 'uk', 'ng', 'gh', 'ca', 'au', 'pro' );
        $segment = sanitize_key( $_POST['culture_nl_segment'] ?? '' );
        if ( in_array( $segment, $allowed_segments, true ) ) {
            if ( $segment ) {
                update_post_meta( $post_id, '_culture_nl_segment', $segment );
            } else {
                delete_post_meta( $post_id, '_culture_nl_segment' );
            }
        }
    }

    /**
     * Register meta box on the culture_newsletter edit screen.
     */
    public static function register_meta_box() {
        add_meta_box(
            'culture_nl_send',
            __( 'Send Newsletter', 'culture-community' ),
            array( __CLASS__, 'render_meta_box' ),
            'culture_newsletter',
            'side',
            'high'
        );
    }

    /**
     * Enqueue CSS + JS only on the newsletter edit screen.
     *
     * @param string $hook
     */
    public static function enqueue_assets( $hook ) {
        if ( ! in_array( $hook, array( 'post.php', 'post-new.php' ), true ) ) {
            return;
        }

        $screen = get_current_screen();
        if ( ! $screen || 'culture_newsletter' !== $screen->post_type ) {
            return;
        }

        wp_enqueue_style(
            'culture-nl-send',
            CULTURE_PLUGIN_URL . 'assets/css/culture-newsletter-send.css',
            array(),
            CULTURE_VERSION
        );

        wp_enqueue_script(
            'culture-nl-send',
            CULTURE_PLUGIN_URL . 'assets/js/culture-newsletter-send.js',
            array( 'jquery' ),
            CULTURE_VERSION,
            true
        );

        wp_localize_script( 'culture-nl-send', 'cultureNLSend', array(
            'ajaxUrl' => admin_url( 'admin-ajax.php' ),
            'nonce'   => wp_create_nonce( 'culture_nl_send_nonce' ),
            'postId'  => get_the_ID(),
            'i18n'    => array(
                'confirmSend'   => __( 'Send this issue to all subscribers now? This cannot be undone.', 'culture-community' ),
                'confirmResend' => __( 'Resend to all current subscribers? They may receive a duplicate.', 'culture-community' ),
                'sending'       => __( 'Sending…', 'culture-community' ),
                'sendTest'      => __( 'Send Test', 'culture-community' ),
            ),
        ) );
    }

    /**
     * Render the meta box HTML.
     *
     * @param WP_Post $post
     */
    public static function render_meta_box( $post ) {
        $status_data  = Culture_Newsletter_Queue::get_send_status( $post->ID );
        $status       = $status_data['status'];
        $total        = $status_data['total'];
        $offset       = $status_data['offset'];
        $percent      = $status_data['percent'];
        $sent_at      = $status_data['sent_at'];
        $subscribers  = get_option( 'culture_newsletter_subscribers', array() );
        $current_user = wp_get_current_user();

        $nl_list    = get_post_meta( $post->ID, '_culture_nl_list',    true ) ?: 'getmelit';
        $nl_segment = get_post_meta( $post->ID, '_culture_nl_segment', true ) ?: '';

        $lists_config = array(
            'getmelit'                  => 'GetMeLit',
            'culture-drop'              => 'Culture Drop',
            'culture-narratives-digest' => 'Culture Narratives Digest (waitlist)',
            'vendor-letter'             => 'The Vendor Letter (waitlist)',
            'origins-field-notes'       => 'Origins Field Notes (waitlist)',
        );

        $segments_config = array(
            ''    => 'All segments',
            'us'  => 'The Moveee America (US)',
            'uk'  => 'The British Moveee (UK)',
            'ng'  => 'Nigeria',
            'gh'  => 'Ghana',
            'ca'  => 'Canada',
            'au'  => 'Australia',
            'pro' => 'Connect Pro Members',
        );

        // Build counts[list][segment] — empty string segment = whole list total.
        $counts_map = array(
            'getmelit'     => array( '' => 0 ),
            'culture-drop' => array( '' => 0 ),
        );

        if ( is_array( $subscribers ) ) {
            foreach ( $subscribers as $sub ) {
                $sub_lists   = is_array( $sub ) ? ( $sub['lists'] ?? array() ) : array();
                $sub_segment = is_array( $sub ) ? ( $sub['segment'] ?? '' ) : '';

                // Legacy entries (no lists field) count only towards getmelit.
                if ( empty( $sub_lists ) ) {
                    $counts_map['getmelit']['']++;
                    if ( $sub_segment ) {
                        $counts_map['getmelit'][ $sub_segment ] = ( $counts_map['getmelit'][ $sub_segment ] ?? 0 ) + 1;
                    }
                } else {
                    foreach ( array_keys( $counts_map ) as $lk ) {
                        if ( in_array( $lk, $sub_lists, true ) ) {
                            $counts_map[ $lk ]['']++;
                            if ( $sub_segment ) {
                                $counts_map[ $lk ][ $sub_segment ] = ( $counts_map[ $lk ][ $sub_segment ] ?? 0 ) + 1;
                            }
                        }
                    }
                }
            }
        }

        // Determine the count for the currently saved list/segment selection.
        if ( $nl_segment ) {
            $sub_count = $counts_map[ $nl_list ][ $nl_segment ] ?? 0;
        } else {
            $sub_count = $counts_map[ $nl_list ][''] ?? 0;
        }
        ?>
        <div class="culture-nl-box"
            data-post-id="<?php echo esc_attr( $post->ID ); ?>"
            data-counts="<?php echo esc_attr( wp_json_encode( $counts_map ) ); ?>"
            data-list-labels="<?php echo esc_attr( wp_json_encode( $lists_config ) ); ?>"
            data-seg-labels="<?php echo esc_attr( wp_json_encode( $segments_config ) ); ?>"
        >

            <?php /* ── LIST ASSIGNMENT ── */ ?>
            <div class="culture-nl-section" style="margin-bottom:0;">
                <label class="culture-nl-label"><?php esc_html_e( 'Newsletter List', 'culture-community' ); ?></label>
                <?php wp_nonce_field( 'culture_nl_list_' . $post->ID, 'culture_nl_list_nonce' ); ?>
                <select name="culture_nl_list" style="width:100%;margin-top:4px;">
                    <?php foreach ( $lists_config as $lk => $ln ) : ?>
                        <option value="<?php echo esc_attr( $lk ); ?>"<?php selected( $nl_list, $lk ); ?>>
                            <?php echo esc_html( $ln ); ?>
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>

            <?php /* ── SEGMENT FILTER ── */ ?>
            <div class="culture-nl-section" style="margin-top:12px;margin-bottom:0;">
                <label class="culture-nl-label"><?php esc_html_e( 'Send to Segment', 'culture-community' ); ?></label>
                <select name="culture_nl_segment" style="width:100%;margin-top:4px;">
                    <?php foreach ( $segments_config as $sk => $sn ) : ?>
                        <option value="<?php echo esc_attr( $sk ); ?>"<?php selected( $nl_segment, $sk ); ?>>
                            <?php echo esc_html( $sn ); ?>
                        </option>
                    <?php endforeach; ?>
                </select>
                <p style="font-size:11px;color:#666;margin:4px 0 0;">
                    <?php esc_html_e( 'Leave on "All segments" to send to everyone on this list.', 'culture-community' ); ?>
                </p>
            </div>

            <hr class="culture-nl-sep">

            <div class="culture-nl-sub-count">
                <span class="culture-nl-stat-num js-nl-count-num"><?php echo esc_html( number_format( $sub_count ) ); ?></span>
                <span class="culture-nl-stat-label js-nl-count-label">
                    <?php
                    $label = $lists_config[ $nl_list ] ?? '';
                    if ( $nl_segment && isset( $segments_config[ $nl_segment ] ) ) {
                        $label .= ' · ' . $segments_config[ $nl_segment ];
                    }
                    echo esc_html( sprintf( __( '%s Subscribers', 'culture-community' ), $label ) );
                    ?>
                </span>
            </div>

            <hr class="culture-nl-sep">

            <?php /* ── SEND STATUS ── */ ?>
            <div class="culture-nl-status-wrap js-nl-status" data-status="<?php echo esc_attr( $status ); ?>">
                <?php if ( 'sent' === $status ) : ?>
                    <div class="culture-nl-badge sent">
                        <span class="dashicons dashicons-yes-alt"></span>
                        <?php esc_html_e( 'Issue sent', 'culture-community' ); ?>
                    </div>
                    <p class="culture-nl-sent-detail">
                        <?php
                        printf(
                            /* translators: 1: subscriber count, 2: date/time */
                            esc_html__( '%1$s subscribers · %2$s', 'culture-community' ),
                            number_format( $total ),
                            date_i18n( get_option( 'date_format' ) . ' ' . get_option( 'time_format' ), strtotime( $sent_at ) )
                        );
                        ?>
                    </p>
                    <?php
                    // Quick analytics snapshot.
                    $quick = Culture_NL_Analytics::get_campaign_stats( $post->ID );
                    if ( $quick['unique_opens'] > 0 || $quick['unique_clicks'] > 0 ) :
                        $analytics_url = admin_url( 'admin.php?page=culture-nl-analytics&campaign=' . $post->ID );
                    ?>
                    <div class="culture-nl-quick-analytics">
                        <span class="culture-nl-qa-chip" title="<?php esc_attr_e( 'Open rate', 'culture-community' ); ?>">
                            <span class="dashicons dashicons-visibility"></span>
                            <?php echo esc_html( $quick['open_rate'] ); ?>%
                        </span>
                        <span class="culture-nl-qa-chip" title="<?php esc_attr_e( 'Click-through rate', 'culture-community' ); ?>">
                            <span class="dashicons dashicons-admin-links"></span>
                            <?php echo esc_html( $quick['ctr'] ); ?>%
                        </span>
                        <a href="<?php echo esc_url( $analytics_url ); ?>" class="culture-nl-qa-link">
                            <?php esc_html_e( 'Full analytics →', 'culture-community' ); ?>
                        </a>
                    </div>
                    <?php endif; ?>
                <?php elseif ( 'sending' === $status ) : ?>
                    <div class="culture-nl-badge sending">
                        <span class="dashicons dashicons-update-alt"></span>
                        <?php esc_html_e( 'Sending…', 'culture-community' ); ?>
                    </div>
                    <div class="culture-nl-progress">
                        <div class="culture-nl-progress-bar">
                            <div class="culture-nl-progress-fill js-nl-fill" style="width:<?php echo esc_attr( $percent ); ?>%"></div>
                        </div>
                        <span class="culture-nl-progress-text js-nl-progress-text">
                            <?php echo esc_html( number_format( $offset ) ); ?> / <?php echo esc_html( number_format( $total ) ); ?>
                        </span>
                    </div>
                <?php else : ?>
                    <div class="culture-nl-badge idle">
                        <?php esc_html_e( 'Not yet sent', 'culture-community' ); ?>
                    </div>
                <?php endif; ?>
            </div>

            <?php if ( 'sending' !== $status ) : ?>

                <hr class="culture-nl-sep">

                <?php /* ── SEND TEST ── */ ?>
                <div class="culture-nl-section">
                    <label class="culture-nl-label" for="culture-nl-test-email">
                        <?php esc_html_e( 'Send Test Email', 'culture-community' ); ?>
                    </label>
                    <input
                        type="email"
                        id="culture-nl-test-email"
                        class="widefat"
                        value="<?php echo esc_attr( $current_user->user_email ); ?>"
                        placeholder="test@example.com"
                    >
                    <button type="button" class="button button-secondary js-nl-test-btn" style="margin-top:6px;width:100%;">
                        <span class="dashicons dashicons-email" style="margin-top:3px;"></span>
                        <?php esc_html_e( 'Send Test', 'culture-community' ); ?>
                    </button>
                </div>

                <hr class="culture-nl-sep">

                <?php /* ── SEND TO ALL ── */ ?>
                <div class="culture-nl-section">
                    <label class="culture-nl-label">
                        <?php esc_html_e( 'Send to All Subscribers', 'culture-community' ); ?>
                    </label>

                    <?php if ( 0 === $sub_count ) : ?>
                        <p class="culture-nl-notice"><?php esc_html_e( 'No subscribers on this list yet.', 'culture-community' ); ?></p>
                    <?php else : ?>
                        <p class="culture-nl-notice">
                            <?php
                            printf(
                                /* translators: 1: formatted subscriber count, 2: list name */
                                esc_html__( 'Will email %1$s %2$s subscribers in batches of 50 per minute via your connected SMTP.', 'culture-community' ),
                                '<strong>' . number_format( $sub_count ) . '</strong>',
                                esc_html( $lists_config[ $nl_list ] ?? '' )
                            );
                            ?>
                        </p>
                        <?php if ( 'sent' === $status ) : ?>
                            <button type="button" class="button button-secondary js-nl-send-btn" style="width:100%;">
                                <span class="dashicons dashicons-controls-repeat" style="margin-top:3px;"></span>
                                <?php esc_html_e( 'Resend to All Subscribers', 'culture-community' ); ?>
                            </button>
                        <?php else : ?>
                            <button type="button" class="button button-primary js-nl-send-btn" style="width:100%;height:36px;line-height:34px;">
                                <span class="dashicons dashicons-megaphone" style="margin-top:7px;"></span>
                                <?php esc_html_e( 'Send Issue', 'culture-community' ); ?>
                            </button>
                        <?php endif; ?>
                    <?php endif; ?>
                </div>

            <?php endif; ?>

            <div class="culture-nl-feedback js-nl-feedback" style="display:none;"></div>

        </div>
        <?php
    }

    /**
     * AJAX: Send a test email.
     */
    public static function ajax_send_test() {
        check_ajax_referer( 'culture_nl_send_nonce', 'nonce' );

        if ( ! current_user_can( 'edit_posts' ) ) {
            wp_send_json_error( array( 'message' => __( 'Permission denied.', 'culture-community' ) ) );
        }

        $post_id    = absint( $_POST['post_id'] ?? 0 );
        $test_email = sanitize_email( $_POST['test_email'] ?? '' );

        if ( ! $post_id ) {
            wp_send_json_error( array( 'message' => __( 'Invalid post.', 'culture-community' ) ) );
        }

        if ( ! is_email( $test_email ) ) {
            wp_send_json_error( array( 'message' => __( 'Please enter a valid email address.', 'culture-community' ) ) );
        }

        $sent = Culture_Newsletter_Queue::send_test( $post_id, $test_email );

        if ( $sent ) {
            wp_send_json_success( array(
                /* translators: %s: email address */
                'message' => sprintf( __( 'Test sent to %s — check your inbox.', 'culture-community' ), $test_email ),
            ) );
        } else {
            wp_send_json_error( array( 'message' => __( 'Send failed. Please check your SMTP settings.', 'culture-community' ) ) );
        }
    }

    /**
     * AJAX: Queue the full send.
     */
    public static function ajax_send_issue() {
        check_ajax_referer( 'culture_nl_send_nonce', 'nonce' );

        if ( ! current_user_can( 'edit_posts' ) ) {
            wp_send_json_error( array( 'message' => __( 'Permission denied.', 'culture-community' ) ) );
        }

        $post_id = absint( $_POST['post_id'] ?? 0 );

        if ( ! $post_id ) {
            wp_send_json_error( array( 'message' => __( 'Invalid post.', 'culture-community' ) ) );
        }

        $count = Culture_Newsletter_Queue::schedule_send( $post_id );

        if ( false === $count ) {
            wp_send_json_error( array( 'message' => __( 'No subscribers found.', 'culture-community' ) ) );
        }

        wp_send_json_success( array(
            'message' => sprintf(
                /* translators: %s: formatted subscriber count */
                __( 'Queued for %s subscribers. Batches of 50 will go out every minute.', 'culture-community' ),
                number_format( $count )
            ),
            'total' => $count,
        ) );
    }

    /**
     * AJAX: Return current send status for progress polling.
     */
    public static function ajax_get_status() {
        check_ajax_referer( 'culture_nl_send_nonce', 'nonce' );

        if ( ! current_user_can( 'edit_posts' ) ) {
            wp_send_json_error();
        }

        $post_id = absint( $_POST['post_id'] ?? 0 );

        if ( ! $post_id ) {
            wp_send_json_error();
        }

        wp_send_json_success( Culture_Newsletter_Queue::get_send_status( $post_id ) );
    }
}
