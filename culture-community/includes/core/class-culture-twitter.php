<?php
/**
 * Twitter / X auto-poster for Moveee Pulse stories.
 *
 * Uses Twitter API v2 (POST /2/tweets) with OAuth 1.0a User Context.
 * Credentials are stored in Culture_Settings (Automation tab).
 *
 * Usage:
 *   Culture_Twitter::tweet_latest_pulse();   // called by Culture_Cron
 *   Culture_Twitter::post_tweet( $text );    // post any text directly
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Culture_Twitter {

    const TWITTER_API_URL = 'https://api.twitter.com/2/tweets';

    // ── Public entry point ────────────────────────────────────────────────

    /**
     * Find the most-recent unposted pulse_story and tweet it.
     * Marks the post with _culture_tweeted = 1 on success.
     */
    public static function tweet_latest_pulse() {
        if ( ! self::is_configured() ) {
            error_log( '[Culture Twitter] Skipped — Twitter credentials not configured or posting disabled.' );
            return;
        }

        $stories = get_posts( array(
            'post_type'      => 'pulse_story',
            'post_status'    => 'publish',
            'posts_per_page' => 1,
            'orderby'        => 'date',
            'order'          => 'DESC',
            'meta_query'     => array(
                'relation' => 'OR',
                array(
                    'key'     => '_culture_tweeted',
                    'compare' => 'NOT EXISTS',
                ),
                array(
                    'key'     => '_culture_tweeted',
                    'value'   => '1',
                    'compare' => '!=',
                ),
            ),
        ) );

        if ( empty( $stories ) ) {
            error_log( '[Culture Twitter] No unposted pulse stories found.' );
            return;
        }

        $story = $stories[0];
        $title = html_entity_decode( get_the_title( $story ), ENT_QUOTES, 'UTF-8' );

        // Prefer the original external URL; fall back to the internal pulse page.
        $external_url = get_post_meta( $story->ID, 'pulse_external_url', true );
        $frontend_url = rtrim( Culture_Settings::get( 'culture_frontend_url' ), '/' );
        $url          = ! empty( $external_url ) ? $external_url : $frontend_url . '/pulse/' . $story->post_name;

        $text   = self::build_tweet_text( $story, $title, $url );
        $result = self::post_tweet( $text );

        if ( $result ) {
            update_post_meta( $story->ID, '_culture_tweeted',    '1' );
            update_post_meta( $story->ID, '_culture_tweeted_at', current_time( 'mysql' ) );
            error_log( '[Culture Twitter] Tweeted: ' . $title );
        }
    }

    /**
     * Post any text string as a tweet.
     *
     * @param  string $text Tweet text (max 280 chars).
     * @return bool   True on success, false on failure.
     */
    public static function post_tweet( $text ) {
        $body     = wp_json_encode( array( 'text' => $text ) );
        $auth     = self::build_oauth_header( 'POST', self::TWITTER_API_URL );

        $response = wp_remote_post( self::TWITTER_API_URL, array(
            'timeout' => 30,
            'headers' => array(
                'Content-Type'  => 'application/json',
                'Authorization' => $auth,
            ),
            'body' => $body,
        ) );

        if ( is_wp_error( $response ) ) {
            error_log( '[Culture Twitter] WP_Error: ' . $response->get_error_message() );
            return false;
        }

        $code = wp_remote_retrieve_response_code( $response );
        if ( $code >= 200 && $code < 300 ) {
            return true;
        }

        error_log( '[Culture Twitter] HTTP ' . $code . ': ' . wp_remote_retrieve_body( $response ) );
        return false;
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    public static function is_configured() {
        return '1' === Culture_Settings::get( 'culture_twitter_enabled' )
            && '' !== Culture_Settings::get( 'culture_twitter_api_key' )
            && '' !== Culture_Settings::get( 'culture_twitter_api_secret' )
            && '' !== Culture_Settings::get( 'culture_twitter_access_token' )
            && '' !== Culture_Settings::get( 'culture_twitter_access_token_secret' );
    }

    /**
     * Build the tweet text, respecting Twitter's 280-char limit.
     * URLs always count as ~23 chars regardless of actual length.
     */
    private static function build_tweet_text( $story, $title, $url ) {
        // Build hashtags from pulse_arm taxonomy (e.g. #lifestyle #happenings).
        $arms      = wp_get_post_terms( $story->ID, 'pulse_arm', array( 'fields' => 'names' ) );
        $hashtags  = '';
        if ( ! is_wp_error( $arms ) && ! empty( $arms ) ) {
            $tags     = array_map(
                function ( $name ) {
                    return '#' . preg_replace( '/[^a-zA-Z0-9]/u', '', ucfirst( strtolower( $name ) ) );
                },
                array_slice( $arms, 0, 2 )
            );
            $hashtags = implode( ' ', array_filter( $tags ) );
        }

        // Twitter t.co wraps URLs to ~23 chars.
        $url_chars = 23;
        $separator = "\n\n";
        $tag_line  = ! empty( $hashtags ) ? "\n" . $hashtags : '';

        // Available chars for the title.
        $max_title = 280 - $url_chars - mb_strlen( $separator ) - mb_strlen( $tag_line );

        if ( mb_strlen( $title ) > $max_title ) {
            $title = mb_substr( $title, 0, $max_title - 1 ) . '…';
        }

        return $title . $separator . $url . $tag_line;
    }

    /**
     * Build an OAuth 1.0a Authorization header for Twitter API v2.
     *
     * JSON bodies are NOT included in the signature base string —
     * only OAuth params and any URL query parameters go in.
     *
     * @param  string $method HTTP method (POST, GET).
     * @param  string $url    Request URL without query string.
     * @return string         Value for the Authorization header.
     */
    private static function build_oauth_header( $method, $url ) {
        $api_key      = Culture_Settings::get( 'culture_twitter_api_key' );
        $api_secret   = Culture_Settings::get( 'culture_twitter_api_secret' );
        $access_token = Culture_Settings::get( 'culture_twitter_access_token' );
        $token_secret = Culture_Settings::get( 'culture_twitter_access_token_secret' );

        $oauth = array(
            'oauth_consumer_key'     => $api_key,
            'oauth_nonce'            => bin2hex( random_bytes( 16 ) ),
            'oauth_signature_method' => 'HMAC-SHA1',
            'oauth_timestamp'        => (string) time(),
            'oauth_token'            => $access_token,
            'oauth_version'          => '1.0',
        );

        // Signature base string: method + url + sorted params.
        $params = $oauth;
        ksort( $params );
        $param_string = http_build_query( $params, '', '&', PHP_QUERY_RFC3986 );
        $base_string  = strtoupper( $method ) . '&'
            . rawurlencode( $url ) . '&'
            . rawurlencode( $param_string );

        $signing_key             = rawurlencode( $api_secret ) . '&' . rawurlencode( $token_secret );
        $oauth['oauth_signature'] = base64_encode( hash_hmac( 'sha1', $base_string, $signing_key, true ) );

        // Build the Authorization header value.
        ksort( $oauth );
        $parts = array();
        foreach ( $oauth as $k => $v ) {
            $parts[] = rawurlencode( $k ) . '="' . rawurlencode( $v ) . '"';
        }

        return 'OAuth ' . implode( ', ', $parts );
    }
}
