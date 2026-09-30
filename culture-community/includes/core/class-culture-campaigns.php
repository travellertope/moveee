<?php
/**
 * One-off email campaigns — a send that is NOT tied to any
 * culture_newsletter/getmelit/culture_drop post at all. An admin writes a
 * subject + body, picks one or more lists from the registry
 * (Culture_Newsletter_Lists), and sends once. Reuses the exact
 * batching/build_email/unsubscribe/tracking machinery
 * Culture_Newsletter_Queue already has — see that class for the
 * newsletter-issue-based sends this mirrors.
 *
 * Backed by the `culture_campaign` CPT (September 2026) — was a plain
 * $wpdb-table row (wp_culture_campaigns), rewritten so a campaign gets
 * WordPress's native Gutenberg block editor for its body, same as
 * culture_newsletter/getmelit/culture_drop, per explicit user request. The
 * old table is left in place, untouched, as a historical snapshot — see
 * maybe_migrate_legacy_table() below — never write to it again.
 *
 * subject => post_title, body => post_content (native fields, so the block
 * editor "just works"); everything else (list_ids/status/send progress)
 * lives on postmeta, since none of it has a native WP_Post equivalent.
 * created_by => post_author, created_at => post_date — also native, so
 * these were dropped from postmeta entirely rather than duplicated.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Culture_Campaigns {

    const POST_TYPE  = 'culture_campaign';
    const CRON_HOOK  = 'culture_campaign_process_batch';
    const BATCH_SIZE = 50;

    const STATUS_DRAFT   = 'draft';
    const STATUS_SENDING = 'sending';
    const STATUS_SENT    = 'sent';

    /**
     * The legacy $wpdb table — kept only so maybe_migrate_legacy_table() has
     * something to read from once, and so an un-migrated site's table isn't
     * orphaned by a dbDelta call disappearing. Never written to again after
     * migration; nothing else in this class reads it.
     */
    public static function table() {
        global $wpdb;
        return $wpdb->prefix . 'culture_campaigns';
    }

    public static function create_table() {
        global $wpdb;
        $charset_collate = $wpdb->get_charset_collate();
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';

        $table = self::table();
        dbDelta( "CREATE TABLE {$table} (
            id bigint(20) NOT NULL AUTO_INCREMENT,
            subject varchar(255) NOT NULL DEFAULT '',
            body longtext NOT NULL,
            list_ids text NOT NULL,
            status varchar(20) NOT NULL DEFAULT 'draft',
            send_total int(11) NOT NULL DEFAULT 0,
            send_offset int(11) NOT NULL DEFAULT 0,
            created_by bigint(20) NOT NULL DEFAULT 0,
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            sent_at datetime DEFAULT NULL,
            PRIMARY KEY  (id),
            KEY status_idx (status)
        ) {$charset_collate};" );
    }

    public static function init() {
        add_action( self::CRON_HOOK, array( __CLASS__, 'process_batch' ), 10, 2 );
        add_action( 'init', array( __CLASS__, 'maybe_migrate_legacy_table' ), 20 );
    }

    /**
     * One-time migration of any pre-existing wp_culture_campaigns rows into
     * real culture_campaign posts — gated so it only ever runs once, same
     * shape as every other maybe_migrate/maybe_backfill helper in this plugin
     * (e.g. Culture_Subscribers_DB::maybe_migrate_from_options()). Priority
     * 20 on 'init' so the culture_campaign post type (registered at the
     * default priority 10 by Culture_Post_Types::register_post_types(), also
     * hooked on 'init') is guaranteed to already exist.
     *
     * The old table is left in place afterward, untouched — never dropped,
     * never written to again.
     */
    public static function maybe_migrate_legacy_table() {
        if ( get_option( 'culture_campaigns_migrated_to_cpt' ) ) {
            return;
        }
        if ( ! post_type_exists( self::POST_TYPE ) ) {
            return;
        }

        global $wpdb;
        $table = self::table();
        // Bail quietly (without setting the gate) if the legacy table doesn't
        // exist at all yet — e.g. a brand-new install that never ran the old
        // create_table() before this class was rewritten. The gate only gets
        // set once we've actually had a chance to read it.
        if ( $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $table ) ) !== $table ) {
            update_option( 'culture_campaigns_migrated_to_cpt', 1 );
            return;
        }

        $rows = $wpdb->get_results( "SELECT * FROM {$table}", ARRAY_A );
        foreach ( $rows as $row ) {
            $post_id = wp_insert_post( array(
                'post_type'    => self::POST_TYPE,
                'post_title'   => $row['subject'],
                'post_content' => $row['body'],
                'post_status'  => 'publish',
                'post_author'  => (int) $row['created_by'],
                'post_date'    => $row['created_at'],
            ), true );

            if ( is_wp_error( $post_id ) ) {
                continue;
            }

            update_post_meta( $post_id, '_campaign_list_ids', $row['list_ids'] );
            update_post_meta( $post_id, '_campaign_status', $row['status'] );
            update_post_meta( $post_id, '_campaign_send_total', (int) $row['send_total'] );
            update_post_meta( $post_id, '_campaign_send_offset', (int) $row['send_offset'] );
            if ( $row['sent_at'] ) {
                update_post_meta( $post_id, '_campaign_sent_at', $row['sent_at'] );
            }
        }

        update_option( 'culture_campaigns_migrated_to_cpt', 1 );
    }

    // ── CRUD ─────────────────────────────────────────────────────────────

    public static function get( $id ) {
        $post = get_post( $id );
        if ( ! $post || self::POST_TYPE !== $post->post_type ) {
            return null;
        }
        return self::format( $post );
    }

    public static function all() {
        $posts = get_posts( array(
            'post_type'      => self::POST_TYPE,
            'post_status'    => 'publish',
            'posts_per_page' => -1,
            'orderby'        => 'date',
            'order'          => 'DESC',
        ) );
        return array_map( array( __CLASS__, 'format' ), $posts );
    }

    private static function format( WP_Post $post ) {
        $send_total  = (int) get_post_meta( $post->ID, '_campaign_send_total', true );
        $send_offset = (int) get_post_meta( $post->ID, '_campaign_send_offset', true );
        $raw_filters = json_decode( get_post_meta( $post->ID, '_campaign_segment_filters', true ), true );
        return array(
            'id'             => $post->ID,
            'subject'        => $post->post_title,
            'body'           => $post->post_content,
            'listIds'        => array_map( 'intval', (array) json_decode( get_post_meta( $post->ID, '_campaign_list_ids', true ), true ) ?: array() ),
            'segmentFilters' => is_array( $raw_filters ) ? Culture_Newsletter_Lists::normalize_segment_filters( $raw_filters ) : array(),
            'status'         => get_post_meta( $post->ID, '_campaign_status', true ) ?: self::STATUS_DRAFT,
            'sendTotal'      => $send_total,
            'sendOffset'     => $send_offset,
            'percent'        => $send_total > 0 ? min( 100, (int) round( ( $send_offset / $send_total ) * 100 ) ) : 0,
            'createdBy'      => (int) $post->post_author,
            'createdAt'      => $post->post_date,
            'sentAt'         => get_post_meta( $post->ID, '_campaign_sent_at', true ) ?: null,
        );
    }

    /**
     * @return int|WP_Error Campaign ID.
     */
    public static function create( array $data, $user_id ) {
        $subject = sanitize_text_field( $data['subject'] ?? '' );
        if ( '' === $subject ) {
            return new WP_Error( 'missing_subject', 'A subject line is required.', array( 'status' => 400 ) );
        }
        $body = wp_kses_post( $data['body'] ?? '' );
        if ( '' === trim( wp_strip_all_tags( $body ) ) ) {
            return new WP_Error( 'missing_body', 'The campaign body cannot be empty.', array( 'status' => 400 ) );
        }
        $list_ids = array_values( array_filter( array_map( 'intval', (array) ( $data['list_ids'] ?? array() ) ) ) );
        if ( ! $list_ids ) {
            return new WP_Error( 'missing_lists', 'Select at least one list to send this campaign to.', array( 'status' => 400 ) );
        }

        $post_id = wp_insert_post( array(
            'post_type'    => self::POST_TYPE,
            'post_title'   => $subject,
            'post_content' => $body,
            'post_status'  => 'publish',
            'post_author'  => (int) $user_id,
        ), true );

        if ( is_wp_error( $post_id ) ) {
            return $post_id;
        }

        update_post_meta( $post_id, '_campaign_list_ids', wp_json_encode( $list_ids ) );
        if ( isset( $data['segment_filters'] ) ) {
            $filters = Culture_Newsletter_Lists::normalize_segment_filters( $data['segment_filters'] );
            if ( $filters ) {
                update_post_meta( $post_id, '_campaign_segment_filters', wp_json_encode( $filters ) );
            }
        }
        update_post_meta( $post_id, '_campaign_status', self::STATUS_DRAFT );
        update_post_meta( $post_id, '_campaign_send_total', 0 );
        update_post_meta( $post_id, '_campaign_send_offset', 0 );

        return $post_id;
    }

    public static function update( $id, array $data ) {
        $existing = self::get( $id );
        if ( ! $existing ) {
            return new WP_Error( 'not_found', 'Campaign not found.', array( 'status' => 404 ) );
        }
        if ( self::STATUS_DRAFT !== $existing['status'] ) {
            return new WP_Error( 'not_draft', 'Only draft campaigns can be edited.', array( 'status' => 400 ) );
        }

        $post_update = array( 'ID' => $id );
        if ( isset( $data['subject'] ) ) {
            $post_update['post_title'] = sanitize_text_field( $data['subject'] );
        }
        if ( isset( $data['body'] ) ) {
            $post_update['post_content'] = wp_kses_post( $data['body'] );
        }
        if ( count( $post_update ) > 1 ) {
            wp_update_post( $post_update );
        }

        if ( isset( $data['list_ids'] ) ) {
            $list_ids = array_values( array_filter( array_map( 'intval', (array) $data['list_ids'] ) ) );
            update_post_meta( $id, '_campaign_list_ids', wp_json_encode( $list_ids ) );
        }

        if ( isset( $data['segment_filters'] ) ) {
            $filters = Culture_Newsletter_Lists::normalize_segment_filters( $data['segment_filters'] );
            if ( $filters ) {
                update_post_meta( $id, '_campaign_segment_filters', wp_json_encode( $filters ) );
            } else {
                delete_post_meta( $id, '_campaign_segment_filters' );
            }
        }

        return self::get( $id );
    }

    /**
     * Trashes (not hard-deletes) a draft campaign — recoverable via WP's
     * native Trash, matching this codebase's standing "never hard-delete"
     * convention. The old $wpdb-backed version did a real SQL DELETE; a real
     * post can just go through wp_trash_post() instead now that there's a
     * post to trash.
     */
    public static function delete( $id ) {
        $existing = self::get( $id );
        if ( ! $existing ) {
            return new WP_Error( 'not_found', 'Campaign not found.', array( 'status' => 404 ) );
        }
        if ( self::STATUS_SENDING === $existing['status'] ) {
            return new WP_Error( 'in_progress', 'Cannot delete a campaign while it is sending.', array( 'status' => 400 ) );
        }
        wp_trash_post( $id );
        delete_transient( "culture_campaign_job_{$id}" );
        return true;
    }

    // ── Sending ──────────────────────────────────────────────────────────

    /**
     * Snapshot recipients and schedule the first batch — mirrors
     * Culture_Newsletter_Queue::schedule_send() but resolves recipients
     * from the campaign's own list_ids (a union across every list, not a
     * single content-list + region-filter pair).
     * @return int|WP_Error Total recipients queued.
     */
    public static function send( $id ) {
        $campaign = self::get( $id );
        if ( ! $campaign ) {
            return new WP_Error( 'not_found', 'Campaign not found.', array( 'status' => 404 ) );
        }
        if ( self::STATUS_DRAFT !== $campaign['status'] ) {
            return new WP_Error( 'already_sent', 'This campaign has already been sent or is currently sending.', array( 'status' => 400 ) );
        }

        $emails = Culture_Subscribers_DB::resolve_emails_for_lists( $campaign['listIds'] );
        $emails = Culture_Subscribers_DB::apply_segment_filters( $emails, $campaign['segmentFilters'] );
        if ( ! $emails ) {
            return new WP_Error( 'no_recipients', 'No subscribers match the selected list(s) and segment filter(s).', array( 'status' => 400 ) );
        }

        set_transient( "culture_campaign_job_{$id}", $emails, DAY_IN_SECONDS );

        update_post_meta( $id, '_campaign_status', self::STATUS_SENDING );
        update_post_meta( $id, '_campaign_send_total', count( $emails ) );
        update_post_meta( $id, '_campaign_send_offset', 0 );

        wp_schedule_single_event( time() + 5, self::CRON_HOOK, array( $id, 0 ) );

        return count( $emails );
    }

    public static function send_test( $id, $test_email ) {
        $campaign = self::get( $id );
        if ( ! $campaign || ! is_email( $test_email ) ) {
            return false;
        }

        $body = Culture_Newsletter_Queue::build_campaign_email(
            '[TEST] ' . $campaign['subject'],
            $campaign['body'],
            '#',
            true,
            0,
            '',
            'This Campaign'
        );

        return wp_mail( $test_email, '[TEST] ' . $campaign['subject'], $body, array( 'Content-Type: text/html; charset=UTF-8' ) );
    }

    public static function process_batch( $id, $offset ) {
        $recipients = get_transient( "culture_campaign_job_{$id}" );

        if ( false === $recipients ) {
            $campaign = self::get( $id );
            if ( $campaign && $campaign['sendTotal'] > 0 && $campaign['sendOffset'] >= $campaign['sendTotal'] ) {
                self::mark_complete( $id );
            }
            return;
        }

        $batch = array_slice( $recipients, $offset, self::BATCH_SIZE );
        if ( empty( $batch ) ) {
            self::mark_complete( $id );
            return;
        }

        $campaign = self::get( $id );
        if ( ! $campaign ) {
            delete_transient( "culture_campaign_job_{$id}" );
            return;
        }

        foreach ( $batch as $email ) {
            self::send_to( $email, $campaign );
        }

        $new_offset = $offset + count( $batch );
        update_post_meta( $id, '_campaign_send_offset', $new_offset );

        if ( $new_offset >= count( $recipients ) ) {
            self::mark_complete( $id );
        } else {
            wp_schedule_single_event( time() + 60, self::CRON_HOOK, array( $id, $new_offset ) );
        }
    }

    private static function send_to( $email, array $campaign ) {
        if ( ! is_email( $email ) ) {
            return;
        }

        $unsub_token    = Culture_Newsletter_Queue::generate_unsub_token( $email );
        $tracking_token = Culture_NL_Analytics::generate_token( $email, 'campaign-' . $campaign['id'] );
        $frontend_url   = rtrim( get_option( 'culture_frontend_url', home_url( '/' ) ), '/' );
        $unsub_url      = $frontend_url . '/newsletter/unsubscribe'
                        . '?email=' . rawurlencode( $email )
                        . '&token=' . rawurlencode( $unsub_token )
                        . '&campaign=' . $campaign['id'];

        $body = Culture_Newsletter_Queue::build_campaign_email(
            $campaign['subject'],
            $campaign['body'],
            '',
            false,
            $campaign['id'],
            $tracking_token,
            'this campaign',
            $unsub_url,
            $email
        );

        wp_mail( $email, $campaign['subject'], $body, array( 'Content-Type: text/html; charset=UTF-8' ) );
    }

    private static function mark_complete( $id ) {
        update_post_meta( $id, '_campaign_status', self::STATUS_SENT );
        update_post_meta( $id, '_campaign_sent_at', current_time( 'mysql' ) );
        delete_transient( "culture_campaign_job_{$id}" );
    }
}
