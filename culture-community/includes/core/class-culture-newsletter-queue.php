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
     * Embeds a per-subscriber tracking token for open and click analytics.
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

        $title          = get_the_title( $post_id );
        $unsub_token    = self::generate_unsub_token( $email );
        $tracking_token = Culture_NL_Analytics::generate_token( $email, $post_id );

        // Use the public Next.js frontend URL for all subscriber-facing links.
        // The WordPress backend (cms.*) must never appear in emails.
        $frontend_url = rtrim( get_option( 'culture_frontend_url', home_url( '/' ) ), '/' );
        $permalink    = $frontend_url . '/newsletter/' . $post->post_name;
        $unsub_url    = $frontend_url . '/newsletter/unsubscribe'
                      . '?email=' . rawurlencode( $email )
                      . '&token=' . rawurlencode( $unsub_token )
                      . '&c='    . $post_id;

        $content = apply_filters( 'the_content', $post->post_content );
        $body    = self::build_email( $title, $content, $permalink, $unsub_url, false, $post_id, $tracking_token );

        wp_mail(
            $email,
            $title,
            $body,
            array( 'Content-Type: text/html; charset=UTF-8' )
        );
    }

    /**
     * Send a test copy to a specific address without touching send state.
     * Test emails have tracking disabled — no pixel, no link rewriting.
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
        // Pass $is_test = true → no tracking pixel, no link rewriting.
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
     * Removes the subscriber, logs the event, and shows a confirmation screen.
     */
    public static function handle_unsubscribe() {
        if ( empty( $_GET['culture_unsubscribe'] ) ) {
            return;
        }

        $email       = isset( $_GET['email'] ) ? sanitize_email( rawurldecode( $_GET['email'] ) ) : '';
        $token       = isset( $_GET['token'] ) ? sanitize_text_field( $_GET['token'] ) : '';
        $campaign_id = ! empty( $_GET['c'] ) ? absint( $_GET['c'] ) : null;

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

        // Record the unsubscribe event for analytics.
        Culture_NL_Analytics::log_unsub( $email, $campaign_id );

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
     * Build the full HTML email body.
     *
     * When $campaign_id and $tracking_token are provided (i.e. a real send, not
     * a test), this method:
     *   1. Rewrites all http/https links in $content to pass through the
     *      click-tracking endpoint, preserving the original destination as a
     *      query parameter.
     *   2. Appends a 1×1 transparent GIF tracking pixel so we can record opens.
     *
     * Test sends ($is_test = true) skip both steps so no phantom data appears
     * in the analytics dashboard.
     *
     * @param string $title          Email / newsletter title.
     * @param string $content        Rendered post HTML content.
     * @param string $permalink      Public URL of the newsletter issue.
     * @param string $unsub_url      Unsubscribe URL for this subscriber.
     * @param bool   $is_test        Skip tracking when true.
     * @param int    $campaign_id    Newsletter post ID (required for tracking).
     * @param string $tracking_token Per-subscriber token (required for tracking).
     * @return string Complete HTML email body.
     */
    private static function build_email(
        $title,
        $content,
        $permalink,
        $unsub_url,
        $is_test        = false,
        $campaign_id    = 0,
        $tracking_token = ''
    ) {
        $site_name = get_bloginfo( 'name' );

        // ── Link rewriting (click tracking) ──────────────────────────────────
        if ( ! $is_test && $campaign_id && $tracking_token ) {
            $track_base = rest_url( 'culture/v1/track/click' );

            $content = preg_replace_callback(
                '/href=(["\'])(https?:\/\/[^"\'>\s]+)\1/i',
                function ( $m ) use ( $campaign_id, $tracking_token, $track_base ) {
                    $url = $m[2];
                    // Never rewrite the unsubscribe link or existing tracking URLs.
                    if ( strpos( $url, 'culture_unsubscribe' ) !== false
                        || strpos( $url, 'track/click' ) !== false ) {
                        return $m[0];
                    }
                    $tracked = esc_url( add_query_arg( array(
                        'c' => $campaign_id,
                        't' => $tracking_token,
                        'u' => rawurlencode( $url ),
                    ), $track_base ) );
                    return 'href=' . $m[1] . $tracked . $m[1];
                },
                $content
            );
        }

        // ── Tracking pixel ───────────────────────────────────────────────────
        $pixel_html = '';
        if ( ! $is_test && $campaign_id && $tracking_token ) {
            $pixel_url  = esc_url( add_query_arg( array(
                'c' => $campaign_id,
                't' => $tracking_token,
            ), rest_url( 'culture/v1/track/open' ) ) );
            $pixel_html = '<img src="' . $pixel_url . '" width="1" height="1"'
                        . ' style="position:absolute;visibility:hidden;width:1px;height:1px;" alt="">';
        }

        // ── HTML template ────────────────────────────────────────────────────
        ob_start();
        ?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title><?php echo esc_html( $title ); ?></title>
<style>
  body { margin:0; padding:0; background:#f5f0e8; font-family:Georgia,'Times New Roman',serif; color:#14110d; }
  .wrap { max-width:600px; margin:0 auto; background:#fffdf8; }
  .header { padding:36px 48px 28px; border-bottom:2px solid #14110d; }
  .header-label { font-family:-apple-system,BlinkMacSystemFont,'Courier New',monospace; font-size:10px; letter-spacing:.25em; text-transform:uppercase; color:#7a6f5c; margin:0 0 8px; }
  .header-title { font-size:26px; font-weight:400; line-height:1.25; margin:0; color:#14110d; }
  .content { padding:40px 48px 32px; font-size:16px; line-height:1.75; }
  .content p { margin:0 0 20px; }
  .content h1,.content h2,.content h3 { font-weight:400; line-height:1.3; margin:32px 0 14px; }
  .content h2 { font-size:22px; }
  .content h3 { font-size:18px; }
  .content a { color:#8b6f47; }
  .content img { max-width:100%; height:auto; display:block; margin:24px 0; }
  .content hr { border:none; border-top:1px solid #e8e0d4; margin:32px 0; }
  .read-more { display:block; margin:32px 0 8px; }
  .read-more a { display:inline-block; font-family:-apple-system,BlinkMacSystemFont,'Courier New',monospace; font-size:11px; letter-spacing:.15em; text-transform:uppercase; color:#14110d; text-decoration:none; border:1px solid #14110d; padding:10px 24px; }
  .footer { padding:24px 48px 36px; border-top:1px solid #e8e0d4; font-family:-apple-system,BlinkMacSystemFont,'Courier New',monospace; font-size:10px; letter-spacing:.1em; color:#a09080; }
  .footer a { color:#7a6f5c; text-decoration:none; }
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <p class="header-label"><?php echo esc_html( $site_name ); ?> &mdash; The Cultural Digest</p>
    <h1 class="header-title"><?php echo esc_html( $title ); ?></h1>
  </div>
  <div class="content">
    <?php
    // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
    echo $content;
    ?>
  </div>
  <?php if ( $permalink && '#' !== $permalink ) : ?>
  <div class="read-more">
    <a href="<?php echo esc_url( $permalink ); ?>">
      Read online &rarr;
    </a>
  </div>
  <?php endif; ?>
  <div class="footer">
    <p>
      You are receiving this because you subscribed to The Cultural Digest.<br>
      <a href="<?php echo esc_url( $unsub_url ); ?>">Unsubscribe</a>
    </p>
  </div>
  <?php
  // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
  echo $pixel_html;
  ?>
</div>
</body>
</html>
        <?php
        return ob_get_clean();
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
