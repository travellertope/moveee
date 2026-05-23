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
     * Filters by _culture_nl_list post meta so each newsletter only goes to
     * its own list. Legacy plain-string subscribers are treated as GetMeLit subscribers.
     *
     * @param int $post_id Newsletter post ID.
     * @return int|false Total count queued, or false if no subscribers.
     */
    public static function schedule_send( $post_id ) {
        $subscribers = get_option( 'culture_newsletter_subscribers', array() );

        if ( empty( $subscribers ) ) {
            return false;
        }

        // Determine which list and segment this newsletter targets.
        $nl_list    = get_post_meta( $post_id, '_culture_nl_list',    true ) ?: '';
        $nl_segment = get_post_meta( $post_id, '_culture_nl_segment', true ) ?: '';

        // Standardize to email strings for the snapshot, filtering by list and segment.
        $emails = array();
        foreach ( $subscribers as $sub ) {
            $e = is_array( $sub ) ? ( $sub['email'] ?? '' ) : $sub;
            if ( ! is_email( $e ) ) continue;

            if ( $nl_list ) {
                $sub_lists = is_array( $sub ) ? ( $sub['lists'] ?? array() ) : array();

                if ( ! empty( $sub_lists ) ) {
                    // Object subscriber: must have the target list.
                    if ( ! in_array( $nl_list, $sub_lists, true ) ) continue;
                } else {
                    // Legacy plain-string subscriber: treat as GetMeLit only.
                    if ( 'getmelit' !== $nl_list ) continue;
                }
            }

            // Segment filter: if a segment is set, only include subscribers with that segment.
            if ( $nl_segment ) {
                $sub_segment = is_array( $sub ) ? ( $sub['segment'] ?? '' ) : '';
                if ( $sub_segment !== $nl_segment ) continue;
            }

            $emails[] = $e;
        }

        if ( empty( $emails ) ) {
            return false;
        }

        // Snapshot into a transient so changes to the list mid-send don't affect this job.
        set_transient( "culture_nl_job_{$post_id}", $emails, DAY_IN_SECONDS );

        update_post_meta( $post_id, '_culture_nl_send_status', 'sending' );
        update_post_meta( $post_id, '_culture_nl_send_total', count( $emails ) );
        update_post_meta( $post_id, '_culture_nl_send_offset', 0 );
        delete_post_meta( $post_id, '_culture_nl_sent_at' );

        // Fire first batch after 5 seconds to allow the AJAX response to return first.
        wp_schedule_single_event( time() + 5, self::CRON_HOOK, array( $post_id, 0 ) );

        return count( $emails );
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
            // Transient expired. Check if all batches already completed.
            $total  = (int) get_post_meta( $post_id, '_culture_nl_send_total',  true );
            $offset = (int) get_post_meta( $post_id, '_culture_nl_send_offset', true );
            if ( $total > 0 && $offset >= $total ) {
                self::mark_complete( $post_id );
            } else {
                update_post_meta( $post_id, '_culture_nl_send_status', 'idle' );
            }
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

        $title          = get_the_title( $post_id );
        $unsub_token    = self::generate_unsub_token( $email );
        $tracking_token = Culture_NL_Analytics::generate_token( $email, $post_id );

        $frontend_url = rtrim( get_option( 'culture_frontend_url', home_url( '/' ) ), '/' );
        $permalink    = $frontend_url . '/newsletter/' . $post->post_name;
        $unsub_url    = $frontend_url . '/newsletter/unsubscribe'
                      . '?email=' . rawurlencode( $email )
                      . '&token=' . rawurlencode( $unsub_token )
                      . '&c='    . $post_id;

        $nl_list = get_post_meta( $post_id, '_culture_nl_list', true ) ?: 'getmelit';
        $content = self::render_content( $post );
        $body    = self::build_email( $title, $content, $permalink, $unsub_url, false, $post_id, $tracking_token, $nl_list );

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

        $frontend_url = rtrim( get_option( 'culture_frontend_url', home_url( '/' ) ), '/' );
        $title     = '[TEST] ' . get_the_title( $post_id );
        $permalink = $frontend_url . '/newsletter/' . $post->post_name;
        $nl_list_test = get_post_meta( $post_id, '_culture_nl_list', true ) ?: 'getmelit';
        $content   = self::render_content( $post );
        $body      = self::build_email( $title, $content, $permalink, '#', true, 0, '', $nl_list_test );

        return wp_mail(
            $test_email,
            $title,
            $body,
            array( 'Content-Type: text/html; charset=UTF-8' )
        );
    }

    /**
     * Render a post's content for email delivery.
     *
     * Runs the_content filters (so blocks/shortcodes work) but FIRST removes
     * any image-optimisation or lazy-load hooks (Optimole, Smush, etc.) so
     * that email clients receive real <img src> values. Those plugins rely on
     * JavaScript to swap placeholder images for the real ones; email clients
     * don't run JavaScript, so without this suspension images simply never
     * appear.
     *
     * @param WP_Post $post
     * @return string Rendered HTML, safe for email.
     */
    private static function render_content( $post ) {
        global $more, $page, $pages, $multipage, $preview;
        $prev_more      = $more;
        $prev_page      = isset( $page )      ? $page      : 1;
        $prev_pages     = isset( $pages )     ? $pages     : array();
        $prev_multipage = isset( $multipage ) ? $multipage : false;

        $more      = 1;
        $page      = 1;
        $pages     = array( $post->post_content );
        $multipage = false;

        $prev_post       = isset( $GLOBALS['post'] ) ? $GLOBALS['post'] : null;
        $GLOBALS['post'] = $post;
        setup_postdata( $post );

        // Suspend Optimole / lazy-load hooks before running the_content so
        // images are rendered with their real src URLs, not JS placeholders.
        $suspended = self::suspend_image_filters();

        $content = apply_filters( 'the_content', $post->post_content );

        // Immediately restore so normal page rendering is unaffected.
        self::restore_image_filters( $suspended );

        $more            = $prev_more;
        $page            = $prev_page;
        $pages           = $prev_pages;
        $multipage       = $prev_multipage;
        $GLOBALS['post'] = $prev_post;
        wp_reset_postdata();

        // Strip residual <!--more--> comments.
        $content = preg_replace( '/<!--more(.*?)-->/i', '', $content );

        // Rewrite CMS-domain page links → frontend URL.
        // IMPORTANT: Use href-scoped regex, NOT a blanket str_replace.
        // Optimole CDN URLs embed the original WordPress domain in their path:
        //   https://cdn.optimole.com/.../https://cms.themoveee.com/wp-content/uploads/img.jpg
        // A str_replace( $cms_url, $frontend_url ) would corrupt that embedded
        // domain, making Optimole try to fetch from the Next.js server → 403.
        $cms_url      = rtrim( home_url( '/' ), '/' );
        $frontend_url = rtrim( get_option( 'culture_frontend_url', '' ), '/' );
        if ( $frontend_url && $cms_url !== $frontend_url ) {
            $content = preg_replace(
                '/(href=["\'])' . preg_quote( $cms_url, '/' ) . '/',
                '$1' . $frontend_url,
                $content
            );
        }

        return $content;
    }

    /**
     * Remove any image-optimisation / lazy-load callbacks from the_content.
     *
     * Scans all registered the_content callbacks and removes those whose
     * class or function name contains a known image-plugin keyword. This is
     * version-agnostic — it works regardless of how Optimole names its hooks
     * internally.
     *
     * @return array Descriptors needed to re-add the callbacks.
     */
    private static function suspend_image_filters() {
        global $wp_filter;

        $suspended = array();

        if ( empty( $wp_filter['the_content'] ) ) {
            return $suspended;
        }

        // Keywords that identify image-optimisation / lazy-load plugins.
        $keywords = array(
            'optml',
            'optimole',
            'smush',
            'lazyload',
            'lazy_load',
            'lazy-load',
            'jetpack_lazy',
            'rocket_lazy',
            'bj_lazy',
        );

        foreach ( $wp_filter['the_content']->callbacks as $priority => $callbacks ) {
            foreach ( $callbacks as $id => $callback ) {
                $func = $callback['function'];

                if ( is_string( $func ) ) {
                    $cb_str = $func;
                } elseif ( is_array( $func ) && isset( $func[1] ) ) {
                    $obj    = $func[0];
                    $cb_str = ( is_object( $obj ) ? get_class( $obj ) : (string) $obj ) . '::' . $func[1];
                } else {
                    $cb_str = $id; // Closure — use WP's internal unique key
                }

                $cb_lower = strtolower( $cb_str );

                foreach ( $keywords as $kw ) {
                    if ( strpos( $cb_lower, $kw ) !== false ) {
                        remove_filter( 'the_content', $func, $priority );
                        $suspended[] = array(
                            'function'      => $func,
                            'priority'      => $priority,
                            'accepted_args' => $callback['accepted_args'],
                        );
                        break;
                    }
                }
            }
        }

        return $suspended;
    }

    /**
     * Re-attach callbacks removed by suspend_image_filters().
     *
     * @param array $suspended Return value of suspend_image_filters().
     */
    private static function restore_image_filters( array $suspended ) {
        foreach ( $suspended as $cb ) {
            add_filter( 'the_content', $cb['function'], $cb['priority'], $cb['accepted_args'] );
        }
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
            $sub_email = is_array( $s ) ? ( $s['email'] ?? '' ) : $s;
            return strtolower( trim( $sub_email ) ) !== strtolower( $email );
        } ) );
        update_option( 'culture_newsletter_subscribers', $updated );

        Culture_NL_Analytics::log_unsub( $email, $campaign_id );

        $site_name = get_bloginfo( 'name' );
        $home_url  = home_url( '/' );

        wp_die(
            '<div style="font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',sans-serif;max-width:480px;margin:80px auto;text-align:center;color:#14110d;">'
            . '<p style="font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#7a6f5c;margin-bottom:16px;">' . esc_html( $site_name ) . '</p>'
            . '<h2 style="font-size:28px;font-weight:300;margin:0 0 16px;">You\'ve been unsubscribed.</h2>'
            . '<p style="color:#7a6f5c;font-size:15px;line-height:1.6;margin-bottom:28px;">'
            . esc_html( $email ) . ' has been unsubscribed from The Moveee newsletters.'
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
     * @param string $title
     * @param string $content
     * @param string $permalink
     * @param string $unsub_url
     * @param bool   $is_test
     * @param int    $campaign_id
     * @param string $tracking_token
     * @return string
     */
    private static function build_email(
        $title,
        $content,
        $permalink,
        $unsub_url,
        $is_test        = false,
        $campaign_id    = 0,
        $tracking_token = '',
        $nl_list        = 'getmelit'
    ) {
        $site_name = get_bloginfo( 'name' );
        $nl_labels = array( 'getmelit' => 'GetMeLit', 'culture-drop' => 'Culture Drop' );
        $nl_label  = $nl_labels[ $nl_list ] ?? 'GetMeLit';

        // ── Link rewriting (click tracking) ──────────────────────────────────
        if ( ! $is_test && $campaign_id && $tracking_token ) {
            $track_base = rest_url( 'culture/v1/track/click' );

            $content = preg_replace_callback(
                '/href=(["\'])(https?:\/\/[^"\'>\s]+)\1/i',
                function ( $m ) use ( $campaign_id, $tracking_token, $track_base ) {
                    $url = $m[2];
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
  body { margin:0; padding:0; background:#ffffff; font-family:Georgia,'Times New Roman',serif; color:#14110d; }
  .wrap { max-width:600px; margin:0 auto; background:#ffffff; }
  .content { padding:32px 32px 24px; font-size:16px; line-height:1.75; }
  .content p { margin:0 0 20px; }
  .content h1,.content h2,.content h3 { font-weight:400; line-height:1.3; margin:32px 0 14px; }
  .content h2 { font-size:22px; }
  .content h3 { font-size:18px; }
  .content a { color:#8b6f47; }
  .content img { max-width:100%; height:auto; display:block; margin:24px 0; }
  .content hr { border:none; border-top:1px solid #e8e0d4; margin:32px 0; }
  .read-more { display:block; margin:32px 0 8px; }
  .read-more a { display:inline-block; font-family:-apple-system,BlinkMacSystemFont,'Courier New',monospace; font-size:11px; letter-spacing:.15em; text-transform:uppercase; color:#14110d; text-decoration:none; border:1px solid #14110d; padding:10px 24px; }
  .footer { padding:24px 32px 36px; border-top:1px solid #e8e0d4; font-family:-apple-system,BlinkMacSystemFont,'Courier New',monospace; font-size:10px; letter-spacing:.1em; color:#a09080; }
  .footer a { color:#7a6f5c; text-decoration:none; }
</style>
</head>
<body>
<div class="wrap">
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
      You are receiving this because you subscribed to <?php echo esc_html( $nl_label ); ?>.<br>
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
