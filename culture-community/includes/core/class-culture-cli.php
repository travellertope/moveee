<?php
/**
 * WP-CLI integration for Culture Community.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Culture_CLI {

    /**
     * Migrate data from MailPoet to Culture Community.
     *
     * ## OPTIONS
     *
     * <type>
     * : Type of data to migrate. Options: subscribers, campaigns
     *
     * [--publish]
     * : For campaigns: set post_status to publish immediately.
     *
     * [--sideload]
     * : For campaigns: download images to local media library.
     *
     * ## EXAMPLES
     *
     *     wp culture migrate-mailpoet subscribers
     *     wp culture migrate-mailpoet campaigns --publish --sideload
     */
    public function migrate_mailpoet( $args, $assoc_args ) {
        $type = $args[0] ?? '';

        if ( 'subscribers' === $type ) {
            $this->migrate_subscribers();
        } elseif ( 'campaigns' === $type ) {
            $this->migrate_campaigns( $assoc_args );
        } else {
            WP_CLI::error( "Invalid migration type: {$type}. Use 'subscribers' or 'campaigns'." );
        }
    }

    /**
     * Sync subscribers from MailPoet.
     */
    private function migrate_subscribers() {
        global $wpdb;

        if ( ! class_exists( 'Culture_Subscribers' ) ) {
            WP_CLI::error( 'Culture_Subscribers class not found.' );
        }

        $table = $wpdb->prefix . 'mailpoet_subscribers';
        $exists = $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $table ) );

        if ( ! $exists ) {
            WP_CLI::error( 'MailPoet subscribers table not found.' );
        }

        WP_CLI::log( 'Fetching active subscribers from MailPoet...' );

        $rows = $wpdb->get_results(
            "SELECT email, first_name, last_name FROM {$table}
             WHERE status = 'subscribed'
               AND deleted_at IS NULL
               AND email != ''"
        );

        if ( empty( $rows ) ) {
            WP_CLI::success( 'No active subscribers found in MailPoet.' );
            return;
        }

        $items = array();
        foreach ( $rows as $row ) {
            $items[] = array(
                'email'    => $row->email,
                'name'     => trim( $row->first_name . ' ' . $row->last_name ),
                'location' => '',
            );
        }

        // Reflection to access private merge_subscribers if needed, 
        // or just use handle_import_mailpoet logic.
        // Actually merge_subscribers is private in Class_Culture_Subscribers.
        // Let's use a workaround or make it public.
        
        // For now, I'll replicate the logic here to keep it clean for CLI.
        $count = $this->merge_subscribers_cli( $items );

        WP_CLI::success( "Successfully synced {$count} subscribers from MailPoet." );
    }

    /**
     * Import campaigns from MailPoet.
     */
    private function migrate_campaigns( $assoc_args ) {
        global $wpdb;

        if ( ! class_exists( 'Culture_Newsletter_Importer' ) ) {
            WP_CLI::error( 'Culture_Newsletter_Importer class not found.' );
        }

        $publish  = isset( $assoc_args['publish'] );
        $sideload = isset( $assoc_args['sideload'] );

        $table = $wpdb->prefix . 'mailpoet_newsletters';
        $exists = $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $table ) );

        if ( ! $exists ) {
            WP_CLI::error( 'MailPoet newsletters table not found.' );
        }

        WP_CLI::log( 'Fetching sent standard campaigns from MailPoet...' );

        $rows = $wpdb->get_results(
            "SELECT id, subject FROM {$table}
             WHERE type = 'standard'
               AND status IN ('sent', 'sending')
               AND deleted_at IS NULL
             ORDER BY sent_at DESC"
        );

        if ( empty( $rows ) ) {
            WP_CLI::success( 'No sent campaigns found in MailPoet.' );
            return;
        }

        $imported = 0;
        $skipped  = 0;

        $progress = \WP_CLI\Utils\make_progress_bar( 'Importing Campaigns', count( $rows ) );

        foreach ( $rows as $row ) {
            // Use reflection or make import_campaign public.
            // Since I just made it private static, I should probably make it protected or public if I want to reuse it here.
            // Actually, in the Importer class it's private static. I'll make it public static.
            
            $result = Culture_Newsletter_Importer::import_campaign( $row->id, $publish, $sideload );
            
            if ( 'imported' === $result ) {
                $imported++;
            } elseif ( 'skipped' === $result ) {
                $skipped++;
            }
            $progress->tick();
        }

        $progress->finish();

        WP_CLI::success( "Import complete: {$imported} imported, {$skipped} skipped." );
    }

    /**
     * CLI version of merge_subscribers to avoid visibility issues.
     */
    private function merge_subscribers_cli( array $items ) {
        $subscribers = get_option( 'culture_newsletter_subscribers', array() );
        $existing_emails = array();
        foreach ( $subscribers as $sub ) {
            $existing_emails[] = strtolower( trim( is_array( $sub ) ? $sub['email'] : $sub ) );
        }
        $existing_emails = array_unique( $existing_emails );

        $added = 0;
        $now   = current_time( 'mysql' );

        foreach ( $items as $item ) {
            $email = sanitize_email( $item['email'] );
            if ( ! $email || ! is_email( $email ) ) continue;
            if ( in_array( strtolower( $email ), $existing_emails, true ) ) continue;

            $subscribers[] = array(
                'email'    => $email,
                'name'     => sanitize_text_field( $item['name'] ?? '' ),
                'location' => sanitize_text_field( $item['location'] ?? '' ),
                'date'     => $now,
            );
            $existing_emails[] = strtolower( $email );
            $added++;
        }

        if ( $added > 0 ) {
            update_option( 'culture_newsletter_subscribers', $subscribers );
        }

        return $added;
    }
}
