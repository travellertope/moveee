<?php
/**
 * Newsletter analytics engine.
 *
 * Responsibilities:
 *  - DB table management (opens, clicks, unsubs) — see create_tables().
 *  - Per-email tracking tokens: self-contained base64url(email).hmac32 pairs
 *    that encode the subscriber address without any DB lookup.
 *  - REST endpoints: GET /culture/v1/track/open  → 1×1 GIF + log
 *                    GET /culture/v1/track/click → log + 302 redirect
 *  - Query helpers used by the analytics admin dashboard.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Culture_NL_Analytics {

    const TABLE_OPENS  = 'culture_nl_opens';
    const TABLE_CLICKS = 'culture_nl_clicks';
    const TABLE_UNSUBS = 'culture_nl_unsubs';

    // 1×1 transparent GIF bytes.
    const GIF_PIXEL = "\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff"
                    . "\x00\x00\x00\x21\xf9\x04\x00\x00\x00\x00\x00\x2c\x00\x00\x00\x00"
                    . "\x01\x00\x01\x00\x00\x02\x02\x44\x01\x00\x3b";

    public static function init() {
        add_action( 'rest_api_init', array( __CLASS__, 'register_routes' ) );
    }

    // ── TABLE CREATION ────────────────────────────────────────────────────────

    /**
     * Create the three analytics tables. Called from Culture_Activator::create_tables().
     */
    public static function create_tables() {
        global $wpdb;

        $charset = $wpdb->get_charset_collate();
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';

        $opens  = $wpdb->prefix . self::TABLE_OPENS;
        $clicks = $wpdb->prefix . self::TABLE_CLICKS;
        $unsubs = $wpdb->prefix . self::TABLE_UNSUBS;

        dbDelta( "CREATE TABLE {$opens} (
            id           BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            campaign_id  BIGINT(20) UNSIGNED NOT NULL,
            subscriber   VARCHAR(254)        NOT NULL,
            opened_at    DATETIME            NOT NULL,
            ip_address   VARCHAR(45)         NOT NULL DEFAULT '',
            user_agent   VARCHAR(500)        NOT NULL DEFAULT '',
            PRIMARY KEY  (id),
            KEY idx_campaign    (campaign_id),
            KEY idx_subscriber  (subscriber(20)),
            KEY idx_opened_at   (opened_at)
        ) {$charset};" );

        dbDelta( "CREATE TABLE {$clicks} (
            id           BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            campaign_id  BIGINT(20) UNSIGNED NOT NULL,
            subscriber   VARCHAR(254)        NOT NULL,
            url          TEXT                NOT NULL,
            clicked_at   DATETIME            NOT NULL,
            ip_address   VARCHAR(45)         NOT NULL DEFAULT '',
            user_agent   VARCHAR(500)        NOT NULL DEFAULT '',
            PRIMARY KEY  (id),
            KEY idx_campaign    (campaign_id),
            KEY idx_subscriber  (subscriber(20)),
            KEY idx_clicked_at  (clicked_at)
        ) {$charset};" );

        dbDelta( "CREATE TABLE {$unsubs} (
            id           BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            campaign_id  BIGINT(20) UNSIGNED     NULL,
            subscriber   VARCHAR(254)        NOT NULL,
            unsubbed_at  DATETIME            NOT NULL,
            ip_address   VARCHAR(45)         NOT NULL DEFAULT '',
            PRIMARY KEY  (id),
            KEY idx_campaign    (campaign_id),
            KEY idx_subscriber  (subscriber(20)),
            KEY idx_unsubbed_at (unsubbed_at)
        ) {$charset};" );
    }

    // ── TRACKING TOKENS ───────────────────────────────────────────────────────

    /**
     * Generate a self-contained tracking token for one subscriber+campaign pair.
     *
     * Format: base64url(email) . '.' . hmac_sha256(campaign_id:email)[0:32]
     *
     * The email is embedded in the token (base64url-encoded) so the tracking
     * endpoints can reverse-look-up the subscriber with zero DB queries.
     * The HMAC suffix prevents forgery or enumeration attacks.
     *
     * @param string $email       Subscriber email.
     * @param int    $campaign_id Newsletter post ID.
     * @return string
     */
    public static function generate_token( $email, $campaign_id ) {
        $email  = strtolower( trim( $email ) );
        $b64    = rtrim( strtr( base64_encode( $email ), '+/', '-_' ), '=' );
        $hmac   = substr( hash_hmac( 'sha256', $campaign_id . ':' . $email, AUTH_SALT ), 0, 32 );
        return $b64 . '.' . $hmac;
    }

    /**
     * Sign a single click-through destination URL for one subscriber+campaign.
     *
     * The campaign-level token (generate_token) verifies the subscriber but is
     * not bound to any particular destination — without this, a recipient
     * could swap the `u` query param on their own valid tracking link to any
     * URL and the click endpoint would redirect through the trusted domain
     * (open redirect / phishing vector). Binding the URL into the signature
     * means tampering with `u` invalidates `s` and the redirect falls back
     * to home.
     *
     * @param string $url
     * @param int    $campaign_id
     * @param string $email
     * @return string
     */
    public static function sign_url( $url, $campaign_id, $email ) {
        $email = strtolower( trim( $email ) );
        return substr( hash_hmac( 'sha256', $campaign_id . ':' . $email . ':' . $url, AUTH_SALT ), 0, 32 );
    }

    /**
     * Verify a URL signature produced by sign_url().
     *
     * @param string $url
     * @param string $sig
     * @param int    $campaign_id
     * @param string $email
     * @return bool
     */
    public static function verify_url_signature( $url, $sig, $campaign_id, $email ) {
        if ( ! $sig ) {
            return false;
        }
        $expected = self::sign_url( $url, $campaign_id, $email );
        return hash_equals( $expected, $sig );
    }

    /**
     * Verify a token and return the subscriber email, or false on failure.
     *
     * @param string $token
     * @param int    $campaign_id
     * @return string|false Verified email, or false.
     */
    public static function verify_token( $token, $campaign_id ) {
        $parts = explode( '.', $token, 2 );
        if ( count( $parts ) !== 2 ) {
            return false;
        }

        $email = base64_decode( strtr( $parts[0], '-_', '+/' ) );
        if ( ! $email || ! is_email( $email ) ) {
            return false;
        }

        $email    = strtolower( trim( $email ) );
        $expected = substr( hash_hmac( 'sha256', $campaign_id . ':' . $email, AUTH_SALT ), 0, 32 );

        if ( ! hash_equals( $expected, $parts[1] ) ) {
            return false;
        }

        return $email;
    }

    // ── REST ENDPOINTS ────────────────────────────────────────────────────────

    public static function register_routes() {
        register_rest_route( 'culture/v1', '/track/open', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_open' ),
            'permission_callback' => '__return_true',
            'args'                => array(
                'c' => array( 'required' => true, 'sanitize_callback' => 'absint' ),
                't' => array( 'required' => true, 'sanitize_callback' => 'sanitize_text_field' ),
            ),
        ) );

        register_rest_route( 'culture/v1', '/track/click', array(
            'methods'             => 'GET',
            'callback'            => array( __CLASS__, 'handle_click' ),
            'permission_callback' => '__return_true',
            'args'                => array(
                'c' => array( 'required' => true, 'sanitize_callback' => 'absint' ),
                't' => array( 'required' => true, 'sanitize_callback' => 'sanitize_text_field' ),
                'u' => array( 'required' => true, 'sanitize_callback' => 'esc_url_raw' ),
                's' => array( 'required' => false, 'sanitize_callback' => 'sanitize_text_field' ),
            ),
        ) );
    }

    /**
     * Open-tracking endpoint.
     * Logs the open event (if token verifies) and returns a 1×1 transparent GIF.
     * Duplicate opens by the same subscriber on the same campaign ARE recorded —
     * the dashboard distinguishes "total opens" from "unique opens".
     *
     * @param WP_REST_Request $req
     */
    public static function handle_open( $req ) {
        $campaign_id = (int) $req->get_param( 'c' );
        $token       = $req->get_param( 't' );
        $email       = self::verify_token( $token, $campaign_id );

        if ( $email ) {
            global $wpdb;
            $wpdb->insert(
                $wpdb->prefix . self::TABLE_OPENS,
                array(
                    'campaign_id' => $campaign_id,
                    'subscriber'  => $email,
                    'opened_at'   => current_time( 'mysql' ),
                    'ip_address'  => self::client_ip(),
                    'user_agent'  => substr( sanitize_text_field( $_SERVER['HTTP_USER_AGENT'] ?? '' ), 0, 500 ),
                ),
                array( '%d', '%s', '%s', '%s', '%s' )
            );
        }

        // Bypass the WP REST JSON response — output raw GIF.
        if ( ! headers_sent() ) {
            header( 'Content-Type: image/gif' );
            header( 'Content-Length: ' . strlen( self::GIF_PIXEL ) );
            header( 'Cache-Control: no-cache, no-store, must-revalidate' );
            header( 'Pragma: no-cache' );
            header( 'Expires: 0' );
        }
        // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
        echo self::GIF_PIXEL;
        exit;
    }

    /**
     * Click-tracking endpoint.
     * Logs the click (if token verifies) then 302-redirects to the destination.
     * If the destination URL is invalid or empty we fall back to home.
     *
     * @param WP_REST_Request $req
     */
    public static function handle_click( $req ) {
        $campaign_id = (int) $req->get_param( 'c' );
        $token       = $req->get_param( 't' );
        $url         = $req->get_param( 'u' );
        $sig         = $req->get_param( 's' );
        $email       = self::verify_token( $token, $campaign_id );

        // The campaign token only proves who the subscriber is — it isn't
        // bound to a destination, so the URL signature is what stops a
        // recipient from swapping `u` to redirect through our trusted
        // domain to an arbitrary site (open redirect / phishing).
        $url_verified = $email && $url && self::verify_url_signature( $url, $sig, $campaign_id, $email );

        if ( $email && $url && $url_verified ) {
            global $wpdb;
            $wpdb->insert(
                $wpdb->prefix . self::TABLE_CLICKS,
                array(
                    'campaign_id' => $campaign_id,
                    'subscriber'  => $email,
                    'url'         => $url,
                    'clicked_at'  => current_time( 'mysql' ),
                    'ip_address'  => self::client_ip(),
                    'user_agent'  => substr( sanitize_text_field( $_SERVER['HTTP_USER_AGENT'] ?? '' ), 0, 500 ),
                ),
                array( '%d', '%s', '%s', '%s', '%s', '%s' )
            );
        }

        $destination = ( $url_verified && wp_http_validate_url( $url ) ) ? $url : home_url( '/' );

        if ( ! headers_sent() ) {
            wp_redirect( $destination, 302 );
        }
        exit;
    }

    // ── QUERY HELPERS ─────────────────────────────────────────────────────────

    /**
     * Aggregate stats for a single campaign.
     *
     * Returns:
     *   sent, total_opens, unique_opens, open_rate,
     *   total_clicks, unique_clicks, ctr, ctor,
     *   unsubs, top_links[], opens_by_hour[], clicks_by_hour[]
     *
     * @param  int   $campaign_id Newsletter post ID.
     * @return array
     */
    public static function get_campaign_stats( $campaign_id ) {
        global $wpdb;

        $ot = $wpdb->prefix . self::TABLE_OPENS;
        $ct = $wpdb->prefix . self::TABLE_CLICKS;
        $ut = $wpdb->prefix . self::TABLE_UNSUBS;

        $sent = (int) get_post_meta( $campaign_id, '_culture_nl_send_total', true );

        $opens = $wpdb->get_row( $wpdb->prepare(
            "SELECT COUNT(*) AS total, COUNT(DISTINCT subscriber) AS uniq
             FROM {$ot} WHERE campaign_id = %d",
            $campaign_id
        ) );

        $clicks = $wpdb->get_row( $wpdb->prepare(
            "SELECT COUNT(*) AS total, COUNT(DISTINCT subscriber) AS uniq
             FROM {$ct} WHERE campaign_id = %d",
            $campaign_id
        ) );

        $unsubs = (int) $wpdb->get_var( $wpdb->prepare(
            "SELECT COUNT(*) FROM {$ut} WHERE campaign_id = %d",
            $campaign_id
        ) );

        $unique_opens  = (int) ( $opens->uniq  ?? 0 );
        $unique_clicks = (int) ( $clicks->uniq ?? 0 );

        $open_rate = $sent > 0 ? round( $unique_opens  / $sent * 100, 1 ) : 0.0;
        $ctr       = $sent > 0 ? round( $unique_clicks / $sent * 100, 1 ) : 0.0;
        $ctor      = $unique_opens > 0 ? round( $unique_clicks / $unique_opens * 100, 1 ) : 0.0;

        // Top links (up to 25).
        $top_links = $wpdb->get_results( $wpdb->prepare(
            "SELECT url,
                    COUNT(*)                    AS total_clicks,
                    COUNT(DISTINCT subscriber)  AS unique_clickers
             FROM   {$ct}
             WHERE  campaign_id = %d
             GROUP  BY url
             ORDER  BY total_clicks DESC
             LIMIT  25",
            $campaign_id
        ), ARRAY_A );

        // Opens per hour (for area chart).
        $opens_by_hour = $wpdb->get_results( $wpdb->prepare(
            "SELECT DATE_FORMAT(opened_at, '%%Y-%%m-%%d %%H:00') AS hour,
                    COUNT(*) AS count
             FROM   {$ot}
             WHERE  campaign_id = %d
             GROUP  BY hour
             ORDER  BY hour ASC",
            $campaign_id
        ), ARRAY_A );

        // Clicks per hour (for area chart).
        $clicks_by_hour = $wpdb->get_results( $wpdb->prepare(
            "SELECT DATE_FORMAT(clicked_at, '%%Y-%%m-%%d %%H:00') AS hour,
                    COUNT(*) AS count
             FROM   {$ct}
             WHERE  campaign_id = %d
             GROUP  BY hour
             ORDER  BY hour ASC",
            $campaign_id
        ), ARRAY_A );

        return array(
            'sent'           => $sent,
            'total_opens'    => (int) ( $opens->total  ?? 0 ),
            'unique_opens'   => $unique_opens,
            'open_rate'      => $open_rate,
            'total_clicks'   => (int) ( $clicks->total ?? 0 ),
            'unique_clicks'  => $unique_clicks,
            'ctr'            => $ctr,
            'ctor'           => $ctor,
            'unsubs'         => $unsubs,
            'top_links'      => $top_links      ?: array(),
            'opens_by_hour'  => $opens_by_hour  ?: array(),
            'clicks_by_hour' => $clicks_by_hour ?: array(),
        );
    }

    /**
     * Paginated list of subscribers who OPENED a campaign.
     *
     * @param  int $campaign_id
     * @param  int $page     1-based.
     * @param  int $per_page
     * @return array { rows[], total, pages }
     */
    public static function get_campaign_openers( $campaign_id, $page = 1, $per_page = 50 ) {
        global $wpdb;

        $ot     = $wpdb->prefix . self::TABLE_OPENS;
        $ct     = $wpdb->prefix . self::TABLE_CLICKS;
        $offset = ( max( 1, $page ) - 1 ) * $per_page;

        $total = (int) $wpdb->get_var( $wpdb->prepare(
            "SELECT COUNT(DISTINCT subscriber) FROM {$ot} WHERE campaign_id = %d",
            $campaign_id
        ) );

        $rows = $wpdb->get_results( $wpdb->prepare(
            "SELECT
               o.subscriber,
               MIN(o.opened_at)  AS first_open,
               COUNT(o.id)       AS open_count,
               (SELECT COUNT(*) FROM {$ct} c
                WHERE c.campaign_id = %d AND c.subscriber = o.subscriber) AS click_count
             FROM   {$ot} o
             WHERE  o.campaign_id = %d
             GROUP  BY o.subscriber
             ORDER  BY first_open ASC
             LIMIT  %d OFFSET %d",
            $campaign_id, $campaign_id, $per_page, $offset
        ), ARRAY_A );

        return array(
            'rows'  => $rows ?: array(),
            'total' => $total,
            'pages' => (int) ceil( max( 1, $total ) / $per_page ),
        );
    }

    /**
     * Lifetime stats for a single subscriber.
     *
     * @param  string $email
     * @return array
     */
    public static function get_subscriber_stats( $email ) {
        global $wpdb;

        $email = strtolower( trim( $email ) );
        $ot    = $wpdb->prefix . self::TABLE_OPENS;
        $ct    = $wpdb->prefix . self::TABLE_CLICKS;

        $opens = $wpdb->get_row( $wpdb->prepare(
            "SELECT COUNT(*) AS total,
                    COUNT(DISTINCT campaign_id) AS campaigns,
                    MIN(opened_at) AS first_open,
                    MAX(opened_at) AS last_open
             FROM   {$ot}
             WHERE  subscriber = %s",
            $email
        ) );

        $clicks = $wpdb->get_row( $wpdb->prepare(
            "SELECT COUNT(*) AS total,
                    COUNT(DISTINCT campaign_id) AS campaigns,
                    MAX(clicked_at) AS last_click
             FROM   {$ct}
             WHERE  subscriber = %s",
            $email
        ) );

        // Campaign-by-campaign history — only campaigns with data.
        $history = $wpdb->get_results( $wpdb->prepare(
            "SELECT
               p.ID                                            AS campaign_id,
               p.post_title                                   AS title,
               pm_sent.meta_value                             AS sent_at,
               pm_total.meta_value                            AS sent_total,
               (SELECT COUNT(*) FROM {$ot} o2
                WHERE o2.campaign_id = p.ID
                  AND o2.subscriber = %s)                     AS opened,
               (SELECT COUNT(*) FROM {$ct} c2
                WHERE c2.campaign_id = p.ID
                  AND c2.subscriber = %s)                     AS clicks
             FROM   {$wpdb->posts}    p
             LEFT   JOIN {$wpdb->postmeta} pm_sent
                    ON pm_sent.post_id  = p.ID
                   AND pm_sent.meta_key = '_culture_nl_sent_at'
             LEFT   JOIN {$wpdb->postmeta} pm_total
                    ON pm_total.post_id  = p.ID
                   AND pm_total.meta_key = '_culture_nl_send_total'
             WHERE  p.post_type = 'culture_newsletter'
               AND  p.ID IN (
                     SELECT DISTINCT campaign_id FROM {$ot} WHERE subscriber = %s
                     UNION
                     SELECT DISTINCT campaign_id FROM {$ct} WHERE subscriber = %s
               )
             ORDER  BY pm_sent.meta_value DESC",
            $email, $email, $email, $email
        ), ARRAY_A );

        $campaigns_opened = (int) ( $opens->campaigns  ?? 0 );
        $history_count    = count( $history );
        $open_rate        = $history_count > 0
            ? round( $campaigns_opened / $history_count * 100, 1 )
            : 0.0;

        return array(
            'email'             => $email,
            'total_opens'       => (int) ( $opens->total     ?? 0 ),
            'campaigns_opened'  => $campaigns_opened,
            'first_open'        => $opens->first_open  ?? null,
            'last_open'         => $opens->last_open   ?? null,
            'total_clicks'      => (int) ( $clicks->total    ?? 0 ),
            'campaigns_clicked' => (int) ( $clicks->campaigns ?? 0 ),
            'last_click'        => $clicks->last_click ?? null,
            'open_rate'         => $open_rate,
            'engagement'        => self::engagement_tier( $open_rate, (int) ( $clicks->total ?? 0 ) ),
            'history'           => $history ?: array(),
        );
    }

    /** Human-readable labels for newsletter lists and segments. */
    const LIST_LABELS = array(
        'getmelit'                  => 'GetMeLit',
        'culture-drop'              => 'Culture Drop',
        'culture-narratives-digest' => 'Culture Narratives Digest',
        'vendor-letter'             => 'The Vendor Letter',
        'origins-field-notes'       => 'Origins Field Notes',
    );
    const SEGMENT_LABELS = array(
        'us'  => 'The Moveee America (US)',
        'uk'  => 'The British Moveee (UK)',
        'ng'  => 'Nigeria',
        'gh'  => 'Ghana',
        'ca'  => 'Canada',
        'au'  => 'Australia',
        'pro' => 'Moveee Pro Members',
    );

    /**
     * Overview data across all sent campaigns.
     * Each campaign entry now includes list + segment metadata.
     * Returns per-list subscriber breakdowns in list_counts[].
     *
     * @return array { campaigns[], avg_open_rate, avg_ctr, total_sent, subscribers, list_counts[] }
     */
    public static function get_overview() {
        global $wpdb;

        $ot = $wpdb->prefix . self::TABLE_OPENS;
        $ct = $wpdb->prefix . self::TABLE_CLICKS;

        // Query newsletters that completed (have _culture_nl_sent_at set)
        // OR that were marked sent before that meta existed.
        $posts = get_posts( array(
            'post_type'      => 'culture_newsletter',
            'posts_per_page' => -1,
            'meta_query'     => array(
                'relation' => 'OR',
                'sent_at_clause' => array(
                    'key'     => '_culture_nl_sent_at',
                    'compare' => 'EXISTS',
                ),
                array(
                    'key'   => '_culture_nl_send_status',
                    'value' => 'sent',
                ),
            ),
            'orderby'        => array( 'sent_at_clause' => 'DESC', 'date' => 'DESC' ),
        ) );

        $campaign_data = array();

        foreach ( $posts as $post ) {
            $sent          = (int) get_post_meta( $post->ID, '_culture_nl_send_total', true );
            $nl_list       = get_post_meta( $post->ID, '_culture_nl_list',    true ) ?: 'getmelit';
            $nl_segment    = get_post_meta( $post->ID, '_culture_nl_segment', true ) ?: '';
            $unique_opens  = (int) $wpdb->get_var( $wpdb->prepare(
                "SELECT COUNT(DISTINCT subscriber) FROM {$ot} WHERE campaign_id = %d",
                $post->ID
            ) );
            $unique_clicks = (int) $wpdb->get_var( $wpdb->prepare(
                "SELECT COUNT(DISTINCT subscriber) FROM {$ct} WHERE campaign_id = %d",
                $post->ID
            ) );

            $campaign_data[] = array(
                'id'            => $post->ID,
                'title'         => $post->post_title,
                'list'          => $nl_list,
                'list_label'    => self::LIST_LABELS[ $nl_list ] ?? $nl_list,
                'segment'       => $nl_segment,
                'segment_label' => $nl_segment ? ( self::SEGMENT_LABELS[ $nl_segment ] ?? $nl_segment ) : '',
                'sent_at'       => get_post_meta( $post->ID, '_culture_nl_sent_at', true ),
                'sent'          => $sent,
                'opens'         => $unique_opens,
                'open_rate'     => $sent > 0 ? round( $unique_opens  / $sent * 100, 1 ) : 0.0,
                'clicks'        => $unique_clicks,
                'ctr'           => $sent > 0 ? round( $unique_clicks / $sent * 100, 1 ) : 0.0,
            );
        }

        $n             = count( $campaign_data );
        $avg_open_rate = $n > 0
            ? round( array_sum( array_column( $campaign_data, 'open_rate' ) ) / $n, 1 )
            : 0.0;
        $avg_ctr       = $n > 0
            ? round( array_sum( array_column( $campaign_data, 'ctr' ) ) / $n, 1 )
            : 0.0;
        $total_sent       = array_sum( array_column( $campaign_data, 'sent' ) );
        $subscribers_list = get_option( 'culture_newsletter_subscribers', array() );
        $subscribers      = is_array( $subscribers_list ) ? count( $subscribers_list ) : 0;

        // Per-list (and per-list+segment) subscriber counts.
        $list_counts = array_fill_keys( array_keys( self::LIST_LABELS ), 0 );
        foreach ( $subscribers_list as $sub ) {
            $sub_lists   = is_array( $sub ) ? ( $sub['lists']   ?? array() ) : array();
            if ( empty( $sub_lists ) ) {
                // Legacy plain-string subscriber counts as GetMeLit.
                $list_counts['getmelit'] = ( $list_counts['getmelit'] ?? 0 ) + 1;
            } else {
                foreach ( array_keys( $list_counts ) as $lk ) {
                    if ( in_array( $lk, $sub_lists, true ) ) {
                        $list_counts[ $lk ]++;
                    }
                }
            }
        }

        return array(
            'campaigns'     => $campaign_data,
            'avg_open_rate' => $avg_open_rate,
            'avg_ctr'       => $avg_ctr,
            'total_sent'    => $total_sent,
            'subscribers'   => $subscribers,
            'list_counts'   => $list_counts,
        );
    }

    /**
     * Find a subscriber's raw record from the subscribers option.
     * Returns the record array (object subscriber) or a synthesised array for
     * legacy plain-string entries. Returns null if not found.
     *
     * @param  string $email
     * @return array|null
     */
    public static function get_subscriber_record( $email ) {
        $email       = strtolower( trim( $email ) );
        $subscribers = get_option( 'culture_newsletter_subscribers', array() );

        foreach ( $subscribers as $sub ) {
            $sub_email = is_array( $sub ) ? ( $sub['email'] ?? '' ) : $sub;
            if ( strtolower( trim( $sub_email ) ) === $email ) {
                if ( is_array( $sub ) ) {
                    return $sub;
                }
                // Normalise legacy plain-string entry.
                return array(
                    'email'   => $email,
                    'name'    => '',
                    'date'    => '',
                    'lists'   => array( 'getmelit' ),
                    'segment' => '',
                );
            }
        }

        return null;
    }

    /**
     * Log an unsubscribe event to the tracking table.
     *
     * @param string   $email
     * @param int|null $campaign_id Nullable — not all unsubs come from a campaign link.
     */
    public static function log_unsub( $email, $campaign_id = null ) {
        global $wpdb;

        $wpdb->insert(
            $wpdb->prefix . self::TABLE_UNSUBS,
            array(
                'campaign_id' => $campaign_id ? (int) $campaign_id : null,
                'subscriber'  => strtolower( trim( $email ) ),
                'unsubbed_at' => current_time( 'mysql' ),
                'ip_address'  => self::client_ip(),
            ),
            array( '%d', '%s', '%s', '%s' )
        );
    }

    // ── HELPERS ───────────────────────────────────────────────────────────────

    /**
     * Resolve the real client IP, respecting common proxy headers.
     *
     * @return string
     */
    private static function client_ip() {
        $ip = $_SERVER['REMOTE_ADDR'] ?? '';

        if ( ! empty( $_SERVER['HTTP_X_FORWARDED_FOR'] ) ) {
            $forwarded = explode( ',', $_SERVER['HTTP_X_FORWARDED_FOR'] );
            $ip        = trim( $forwarded[0] );
        } elseif ( ! empty( $_SERVER['HTTP_X_REAL_IP'] ) ) {
            $ip = trim( $_SERVER['HTTP_X_REAL_IP'] );
        }

        return sanitize_text_field( substr( $ip, 0, 45 ) );
    }

    /**
     * Classify a subscriber into an engagement tier.
     *
     * @param  float $open_rate    Percentage (0–100).
     * @param  int   $total_clicks Lifetime click count.
     * @return string 'hot' | 'warm' | 'cold' | 'unengaged'
     */
    public static function engagement_tier( $open_rate, $total_clicks ) {
        if ( $open_rate >= 60 || $total_clicks >= 10 ) {
            return 'hot';
        }
        if ( $open_rate >= 25 || $total_clicks >= 3 ) {
            return 'warm';
        }
        if ( $open_rate >= 5 || $total_clicks >= 1 ) {
            return 'cold';
        }
        return 'unengaged';
    }
}
