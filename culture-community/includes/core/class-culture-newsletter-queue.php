<?php
/**
 * Newsletter send queue — batched WP-Cron dispatch, email builder, unsubscribe handling.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Culture_Newsletter_Queue {

    const CRON_HOOK  = 'culture_nl_process_batch';
    const BATCH_SIZE = 50;

    public static function init() {
        add_action( self::CRON_HOOK, array( __CLASS__, 'process_batch' ), 10, 2 );
        add_action( 'init', array( __CLASS__, 'handle_unsubscribe' ) );
    }

    /**
     * Snapshot subscribers and schedule the first batch.
     *
     * @param int $post_id Newsletter post ID.
     * @return int|false Total count queued, or false if no subscribers.
     */
    public static function schedule_send( $post_id ) {
        $subscribers = get_option( 'culture_newsletter_subscribers', array() );

        if ( empty( $subscribers ) ) {
            return false;
        }

        $subscribers = array_values( array_filter( $subscribers, 'is_email' ) );

        // Snapshot into a transient so changes to the list mid-send don't affect this job.
        set_transient( "culture_nl_job_{$post_id}", $subscribers, DAY_IN_SECONDS );

        update_post_meta( $post_id, '_culture_nl_send_status', 'sending' );
        update_post_meta( $post_id, '_culture_nl_send_total', count( $subscribers ) );
        update_post_meta( $post_id, '_culture_nl_send_offset', 0 );
        delete_post_meta( $post_id, '_culture_nl_sent_at' );

        // Fire first batch after 5 seconds to allow the AJAX response to return first.
        wp_schedule_single_event( time() + 5, self::CRON_HOOK, array( $post_id, 0 ) );

        return count( $subscribers );
    }

    /**
     * WP-Cron callback: process one batch and schedule the next.
     *
     * @param int $post_id Newsletter post ID.
     * @param int $offset  Current position in the subscriber list.
     */
    public static function process_batch( $post_id, $offset ) {
        $subscribers = get_transient( "culture_nl_job_{$post_id}" );

        if ( false === $subscribers ) {
            update_post_meta( $post_id, '_culture_nl_send_status', 'idle' );
            return;
        }

        $batch = array_slice( $subscribers, $offset, self::BATCH_SIZE );

        if ( empty( $batch ) ) {
            self::mark_complete( $post_id );
            return;
        }

        foreach ( $batch as $email ) {
            self::send_to( $email, $post_id );
        }

        $new_offset = $offset + count( $batch );
        update_post_meta( $post_id, '_culture_nl_send_offset', $new_offset );

        if ( $new_offset >= count( $subscribers ) ) {
            self::mark_complete( $post_id );
        } else {
            // Next batch in 60 seconds — keeps us well within ZeptoMail rate limits.
            wp_schedule_single_event( time() + 60, self::CRON_HOOK, array( $post_id, $new_offset ) );
        }
    }

    /**
     * Mark a send job as complete.
     *
     * @param int $post_id
     */
    private static function mark_complete( $post_id ) {
        update_post_meta( $post_id, '_culture_nl_send_status', 'sent' );
        update_post_meta( $post_id, '_culture_nl_sent_at', current_time( 'mysql' ) );
        delete_transient( "culture_nl_job_{$post_id}" );
    }

    /**
     * Send the newsletter to a single email address.
     *
     * @param string $email
     * @param int    $post_id
     */
    public static function send_to( $email, $post_id ) {
        if ( ! is_email( $email ) ) {
            return;
        }

        $post = get_post( $post_id );
        if ( ! $post ) {
            return;
        }

        $title     = get_the_title( $post_id );
        $permalink = get_permalink( $post_id );
        $token     = self::generate_unsub_token( $email );
        $unsub_url = add_query_arg( array(
            'culture_unsubscribe' => '1',
            'email'               => rawurlencode( $email ),
            'token'               => $token,
        ), home_url( '/' ) );

        $content = apply_filters( 'the_content', $post->post_content );
        $body    = self::build_email( $title, $content, $permalink, $unsub_url );

        wp_mail(
            $email,
            $title,
            $body,
            array( 'Content-Type: text/html; charset=UTF-8' )
        );
    }

    /**
     * Send a test copy to a specific address without touching send state.
     *
     * @param int    $post_id
     * @param string $test_email
     * @return bool
     */
    public static function send_test( $post_id, $test_email ) {
        if ( ! is_email( $test_email ) ) {
            return false;
        }

        $post = get_post( $post_id );
        if ( ! $post ) {
            return false;
        }

        $title     = '[TEST] ' . get_the_title( $post_id );
        $permalink = get_permalink( $post_id );
        $content   = apply_filters( 'the_content', $post->post_content );
        $body      = self::build_email( $title, $content, $permalink, '#', true );

        return wp_mail(
            $test_email,
            $title,
            $body,
            array( 'Content-Type: text/html; charset=UTF-8' )
        );
    }

    /**
     * Generate an HMAC unsubscribe token.
     *
     * @param string $email
     * @return string
     */
    public static function generate_unsub_token( $email ) {
        return hash_hmac( 'sha256', strtolower( trim( $email ) ), AUTH_SALT );
    }

    /**
     * Verify an unsubscribe token.
     *
     * @param string $email
     * @param string $token
     * @return bool
     */
    public static function verify_unsub_token( $email, $token ) {
        return hash_equals( self::generate_unsub_token( $email ), $token );
    }

    /**
     * Handle ?culture_unsubscribe=1 on any page load.
     * Removes the subscriber and shows a confirmation screen.
     */
    public static function handle_unsubscribe() {
        if ( empty( $_GET['culture_unsubscribe'] ) ) {
            return;
        }

        $email = isset( $_GET['email'] ) ? sanitize_email( rawurldecode( $_GET['email'] ) ) : '';
        $token = isset( $_GET['token'] ) ? sanitize_text_field( $_GET['token'] ) : '';

        if ( ! $email || ! $token || ! self::verify_unsub_token( $email, $token ) ) {
            wp_die(
                esc_html__( 'Invalid unsubscribe link. Please contact us if you need assistance.', 'culture-community' ),
                esc_html__( 'Unsubscribe Error', 'culture-community' ),
                array( 'response' => 400 )
            );
        }

        $subscribers = get_option( 'culture_newsletter_subscribers', array() );
        $updated     = array_values( array_filter( $subscribers, function ( $s ) use ( $email ) {
            return strtolower( trim( $s ) ) !== strtolower( $email );
        } ) );
        update_option( 'culture_newsletter_subscribers', $updated );

        $site_name = get_bloginfo( 'name' );
        $home_url  = home_url( '/' );

        wp_die(
            '<div style="font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',sans-serif;max-width:480px;margin:80px auto;text-align:center;color:#14110d;">'
            . '<p style="font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#7a6f5c;margin-bottom:16px;">' . esc_html( $site_name ) . '</p>'
            . '<h2 style="font-size:28px;font-weight:300;margin:0 0 16px;">You\'ve been unsubscribed.</h2>'
            . '<p style="color:#7a6f5c;font-size:15px;line-height:1.6;margin-bottom:28px;">'
            . esc_html( $email ) . ' has been removed from The Cultural Digest.'
            . '</p>'
            . '<a href="' . esc_url( $home_url ) . '" style="font-size:11px;letter-spacing:.15em;text-transform:uppercase;color:#14110d;text-decoration:none;border-bottom:1px solid currentColor;padding-bottom:2px;">Return Home</a>'
            . '</div>',
            esc_html__( 'Unsubscribed', 'culture-community' ),
            array( 'response' => 200 )
        );
    }

    /**
     * Get the current send status for a newsletter post.
     *
     * @param int $post_id
     * @return array { status, total, offset, percent, sent_at }
     */
    public static function get_send_status( $post_id ) {
        $status  = get_post_meta( $post_id, '_culture_nl_send_status', true ) ?: 'idle';
        $total   = (int) get_post_meta( $post_id, '_culture_nl_send_total', true );
        $offset  = (int) get_post_meta( $post_id, '_culture_nl_send_offset', true );
        $sent_at = get_post_meta( $post_id, '_culture_nl_sent_at', true );

        return array(
            'status'  => $status,
            'total'   => $total,
            'offset'  => $offset,
            'percent' => $total > 0 ? min( 100, (int) round( ( $offset / $total ) * 100 ) ) : 0,
            'sent_at' => $sent_at,
        );
    }
}
