<?php
/**
 * One-off email campaigns — a send that is NOT tied to any
 * culture_newsletter/getmelit/culture_drop post, has no CPT, and never
 * appears on the public /newsletter archive. An admin writes a subject +
 * body, picks one or more lists from the registry (Culture_Newsletter_Lists),
 * and sends once. Reuses the exact batching/build_email/unsubscribe/tracking
 * machinery Culture_Newsletter_Queue already has — see that class for the
 * newsletter-issue-based sends this mirrors.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Culture_Campaigns {

    const CRON_HOOK  = 'culture_campaign_process_batch';
    const BATCH_SIZE = 50;

    const STATUS_DRAFT   = 'draft';
    const STATUS_SENDING = 'sending';
    const STATUS_SENT    = 'sent';

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
    }

    // ── CRUD ─────────────────────────────────────────────────────────────

    public static function get( $id ) {
        global $wpdb;
        $row = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM " . self::table() . " WHERE id = %d", $id ), ARRAY_A );
        return $row ? self::format( $row ) : null;
    }

    public static function all() {
        global $wpdb;
        $rows = $wpdb->get_results( "SELECT * FROM " . self::table() . " ORDER BY created_at DESC", ARRAY_A );
        return array_map( array( __CLASS__, 'format' ), $rows ?: array() );
    }

    private static function format( array $row ) {
        return array(
            'id'         => (int) $row['id'],
            'subject'    => $row['subject'],
            'body'       => $row['body'],
            'listIds'    => array_map( 'intval', (array) json_decode( $row['list_ids'], true ) ?: array() ),
            'status'     => $row['status'],
            'sendTotal'  => (int) $row['send_total'],
            'sendOffset' => (int) $row['send_offset'],
            'percent'    => $row['send_total'] > 0 ? min( 100, (int) round( ( $row['send_offset'] / $row['send_total'] ) * 100 ) ) : 0,
            'createdBy'  => (int) $row['created_by'],
            'createdAt'  => $row['created_at'],
            'sentAt'     => $row['sent_at'],
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

        global $wpdb;
        $wpdb->insert( self::table(), array(
            'subject'    => $subject,
            'body'       => $body,
            'list_ids'   => wp_json_encode( $list_ids ),
            'status'     => self::STATUS_DRAFT,
            'created_by' => (int) $user_id,
            'created_at' => current_time( 'mysql' ),
        ), array( '%s', '%s', '%s', '%s', '%d', '%s' ) );

        return (int) $wpdb->insert_id;
    }

    public static function update( $id, array $data ) {
        $existing = self::get( $id );
        if ( ! $existing ) {
            return new WP_Error( 'not_found', 'Campaign not found.', array( 'status' => 404 ) );
        }
        if ( self::STATUS_DRAFT !== $existing['status'] ) {
            return new WP_Error( 'not_draft', 'Only draft campaigns can be edited.', array( 'status' => 400 ) );
        }

        global $wpdb;
        $set    = array();
        $format = array();

        if ( isset( $data['subject'] ) ) {
            $set['subject'] = sanitize_text_field( $data['subject'] );
            $format[]       = '%s';
        }
        if ( isset( $data['body'] ) ) {
            $set['body'] = wp_kses_post( $data['body'] );
            $format[]    = '%s';
        }
        if ( isset( $data['list_ids'] ) ) {
            $list_ids       = array_values( array_filter( array_map( 'intval', (array) $data['list_ids'] ) ) );
            $set['list_ids'] = wp_json_encode( $list_ids );
            $format[]        = '%s';
        }

        if ( $set ) {
            $wpdb->update( self::table(), $set, array( 'id' => $id ), $format, array( '%d' ) );
        }

        return self::get( $id );
    }

    public static function delete( $id ) {
        $existing = self::get( $id );
        if ( ! $existing ) {
            return new WP_Error( 'not_found', 'Campaign not found.', array( 'status' => 404 ) );
        }
        if ( self::STATUS_SENDING === $existing['status'] ) {
            return new WP_Error( 'in_progress', 'Cannot delete a campaign while it is sending.', array( 'status' => 400 ) );
        }
        global $wpdb;
        $wpdb->delete( self::table(), array( 'id' => $id ), array( '%d' ) );
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
        if ( ! $emails ) {
            return new WP_Error( 'no_recipients', 'No subscribers on the selected list(s).', array( 'status' => 400 ) );
        }

        set_transient( "culture_campaign_job_{$id}", $emails, DAY_IN_SECONDS );

        global $wpdb;
        $wpdb->update( self::table(), array(
            'status'      => self::STATUS_SENDING,
            'send_total'  => count( $emails ),
            'send_offset' => 0,
        ), array( 'id' => $id ), array( '%s', '%d', '%d' ), array( '%d' ) );

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
        global $wpdb;
        $wpdb->update( self::table(), array( 'send_offset' => $new_offset ), array( 'id' => $id ), array( '%d' ), array( '%d' ) );

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
        global $wpdb;
        $wpdb->update( self::table(), array(
            'status'  => self::STATUS_SENT,
            'sent_at' => current_time( 'mysql' ),
        ), array( 'id' => $id ), array( '%s', '%s' ), array( '%d' ) );
        delete_transient( "culture_campaign_job_{$id}" );
    }
}
