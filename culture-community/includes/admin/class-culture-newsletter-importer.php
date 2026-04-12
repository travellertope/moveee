<?php
/**
 * MailPoet newsletter campaign importer.
 *
 * Pulls sent MailPoet campaigns and creates culture_newsletter posts from them.
 * Content is extracted from MailPoet's block-based body JSON so the result is
 * clean WordPress post content — not raw email HTML with inline styles.
 *
 * Duplicate detection: imported posts are tagged with _culture_mailpoet_id meta
 * so reimporting the same campaign is a no-op.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Culture_Newsletter_Importer {

    public static function init() {
        add_action( 'admin_menu', array( __CLASS__, 'register_menu' ) );
        add_action( 'admin_post_culture_import_newsletters', array( __CLASS__, 'handle_import' ) );
    }

    /**
     * Register submenu under Culture Community.
     */
    public static function register_menu() {
        add_submenu_page(
            'culture-community',
            __( 'Import Newsletters', 'culture-community' ),
            __( 'Import Newsletters', 'culture-community' ),
            'manage_options',
            'culture-import-newsletters',
            array( __CLASS__, 'render_page' )
        );
    }

    /**
     * Render the import page.
     */
    public static function render_page() {
        if ( ! self::is_mailpoet_active() ) {
            echo '<div class="wrap"><h1>' . esc_html__( 'Import Newsletters', 'culture-community' ) . '</h1>';
            echo '<p>' . esc_html__( 'MailPoet is not active on this site. Install and activate MailPoet to import campaigns.', 'culture-community' ) . '</p></div>';
            return;
        }

        $campaigns  = self::get_mailpoet_campaigns();
        $diagnostic = self::get_mailpoet_diagnostic();
        $notice     = '';

        if ( isset( $_GET['imported'] ) ) {
            $n      = absint( $_GET['imported'] );
            $skip   = absint( $_GET['skipped'] ?? 0 );
            $notice = sprintf(
                _n( '%s newsletter imported.', '%s newsletters imported.', $n, 'culture-community' ),
                number_format( $n )
            );
            if ( $skip ) {
                $notice .= ' ' . sprintf(
                    _n( '%s already existed and was skipped.', '%s already existed and were skipped.', $skip, 'culture-community' ),
                    number_format( $skip )
                );
            }
        }
        ?>
        <div class="wrap">
            <h1><?php esc_html_e( 'Import MailPoet Newsletters', 'culture-community' ); ?></h1>
            <p style="color:#646970;max-width:680px;">
                <?php esc_html_e( 'Select sent MailPoet campaigns below to import as Cultural Digest issues. Content is extracted from the campaign body — text, images, and buttons — and saved as clean WordPress post content. Already-imported campaigns are marked and skipped automatically.', 'culture-community' ); ?>
            </p>

            <?php if ( $notice ) : ?>
                <div class="notice notice-success is-dismissible"><p><?php echo esc_html( $notice ); ?></p></div>
            <?php endif; ?>

            <?php /* ── Diagnostic block ─────────────────────────────────── */ ?>
            <?php if ( $diagnostic ) : ?>
                <details style="margin:0 0 16px;font-size:12px;color:#646970;">
                    <summary style="cursor:pointer;font-weight:600;color:#1d2327;">
                        <?php esc_html_e( 'MailPoet table summary (expand to diagnose empty list)', 'culture-community' ); ?>
                    </summary>
                    <table class="wp-list-table widefat fixed striped" style="max-width:500px;margin-top:8px;">
                        <thead>
                            <tr>
                                <th><?php esc_html_e( 'Type', 'culture-community' ); ?></th>
                                <th><?php esc_html_e( 'Status', 'culture-community' ); ?></th>
                                <th><?php esc_html_e( 'Count', 'culture-community' ); ?></th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ( $diagnostic as $row ) : ?>
                                <tr>
                                    <td><?php echo esc_html( $row->type ); ?></td>
                                    <td><?php echo esc_html( $row->status ); ?></td>
                                    <td><?php echo esc_html( $row->cnt ); ?></td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                    <p style="margin-top:8px;">
                        <?php esc_html_e( 'If your newsletters appear above but are not listed below, check that their Type is "standard" and Status is "sent" or "sending".', 'culture-community' ); ?>
                    </p>
                </details>
            <?php endif; ?>

            <?php if ( empty( $campaigns ) ) : ?>
                <p style="color:#646970;"><?php esc_html_e( 'No sent MailPoet campaigns found.', 'culture-community' ); ?></p>
            <?php else : ?>

                <form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
                    <input type="hidden" name="action" value="culture_import_newsletters">
                    <?php wp_nonce_field( 'culture_import_newsletters' ); ?>

                    <div style="margin:16px 0 8px;display:flex;align-items:center;gap:16px;">
                        <label style="font-size:13px;">
                            <input type="checkbox" id="culture-select-all"> <?php esc_html_e( 'Select all', 'culture-community' ); ?>
                        </label>
                        <span style="font-size:12px;color:#646970;">
                            <?php
                            $not_imported = array_filter( $campaigns, function ( $c ) { return ! $c['already_imported']; } );
                            printf(
                                esc_html( _n( '%s campaign available to import', '%s campaigns available to import', count( $not_imported ), 'culture-community' ) ),
                                count( $not_imported )
                            );
                            ?>
                        </span>
                    </div>

                    <table class="wp-list-table widefat fixed striped" style="max-width:820px;">
                        <thead>
                            <tr>
                                <th scope="col" style="width:36px;"></th>
                                <th scope="col"><?php esc_html_e( 'Subject', 'culture-community' ); ?></th>
                                <th scope="col" style="width:150px;"><?php esc_html_e( 'Sent Date', 'culture-community' ); ?></th>
                                <th scope="col" style="width:100px;"><?php esc_html_e( 'Recipients', 'culture-community' ); ?></th>
                                <th scope="col" style="width:110px;"><?php esc_html_e( 'Status', 'culture-community' ); ?></th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ( $campaigns as $campaign ) : ?>
                                <tr style="<?php echo $campaign['already_imported'] ? 'opacity:.55;' : ''; ?>">
                                    <td>
                                        <?php if ( $campaign['already_imported'] ) : ?>
                                            <span title="<?php esc_attr_e( 'Already imported', 'culture-community' ); ?>">✓</span>
                                        <?php else : ?>
                                            <input
                                                type="checkbox"
                                                class="culture-campaign-cb"
                                                name="campaign_ids[]"
                                                value="<?php echo esc_attr( $campaign['id'] ); ?>"
                                            >
                                        <?php endif; ?>
                                    </td>
                                    <td>
                                        <strong><?php echo esc_html( $campaign['subject'] ); ?></strong>
                                        <?php if ( $campaign['preheader'] ) : ?>
                                            <br><span style="font-size:12px;color:#646970;"><?php echo esc_html( $campaign['preheader'] ); ?></span>
                                        <?php endif; ?>
                                    </td>
                                    <td style="font-size:12px;">
                                        <?php echo esc_html( $campaign['sent_at_formatted'] ); ?>
                                    </td>
                                    <td style="font-size:12px;">
                                        <?php echo esc_html( number_format( $campaign['recipients'] ) ); ?>
                                    </td>
                                    <td>
                                        <?php if ( $campaign['already_imported'] ) : ?>
                                            <span style="font-size:11px;background:#edfaef;color:#008a20;padding:2px 8px;border-radius:3px;">
                                                <?php esc_html_e( 'Imported', 'culture-community' ); ?>
                                            </span>
                                        <?php else : ?>
                                            <span style="font-size:11px;background:#f0f6fc;color:#2271b1;padding:2px 8px;border-radius:3px;">
                                                <?php esc_html_e( 'Available', 'culture-community' ); ?>
                                            </span>
                                        <?php endif; ?>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>

                    <div style="margin-top:16px;">
                        <button type="submit" class="button button-primary" id="culture-import-btn">
                            <?php esc_html_e( 'Import Selected', 'culture-community' ); ?>
                        </button>
                        <span style="margin-left:12px;font-size:12px;color:#646970;">
                            <?php esc_html_e( 'Each campaign will be created as a draft culture_newsletter post — review and publish from the Newsletters list.', 'culture-community' ); ?>
                        </span>
                    </div>
                </form>

                <script>
                document.getElementById('culture-select-all').addEventListener('change', function() {
                    document.querySelectorAll('.culture-campaign-cb').forEach(function(cb) {
                        cb.checked = document.getElementById('culture-select-all').checked;
                    });
                });
                document.querySelector('form').addEventListener('submit', function() {
                    var btn = document.getElementById('culture-import-btn');
                    btn.disabled = true;
                    btn.textContent = '<?php echo esc_js( __( 'Importing…', 'culture-community' ) ); ?>';
                });
                </script>

            <?php endif; ?>
        </div>
        <?php
    }

    /**
     * Handle the import POST action.
     */
    public static function handle_import() {
        check_admin_referer( 'culture_import_newsletters' );

        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( esc_html__( 'Permission denied.', 'culture-community' ) );
        }

        $campaign_ids = array_map( 'absint', $_POST['campaign_ids'] ?? array() );

        if ( empty( $campaign_ids ) ) {
            wp_safe_redirect( add_query_arg( array(
                'page'     => 'culture-import-newsletters',
                'imported' => 0,
                'skipped'  => 0,
            ), admin_url( 'admin.php' ) ) );
            exit;
        }

        $imported = 0;
        $skipped  = 0;

        foreach ( $campaign_ids as $mp_id ) {
            $result = self::import_campaign( $mp_id );
            if ( 'imported' === $result ) {
                $imported++;
            } elseif ( 'skipped' === $result ) {
                $skipped++;
            }
        }

        wp_safe_redirect( add_query_arg( array(
            'page'     => 'culture-import-newsletters',
            'imported' => $imported,
            'skipped'  => $skipped,
        ), admin_url( 'admin.php' ) ) );
        exit;
    }

    // ── INTERNALS ─────────────────────────────────────────────────────────────

    /**
     * Import a single MailPoet campaign as a culture_newsletter post.
     *
     * Supports both MailPoet's legacy block-JSON format and its newer
     * Block Editor (Gutenberg) format introduced in MailPoet 4.x+.
     *
     * @param int $mp_id MailPoet newsletter ID.
     * @return string 'imported' | 'skipped' | 'error'
     */
    private static function import_campaign( $mp_id ) {
        global $wpdb;

        // Already imported?
        $existing = get_posts( array(
            'post_type'      => 'culture_newsletter',
            'posts_per_page' => 1,
            'fields'         => 'ids',
            'meta_key'       => '_culture_mailpoet_id',
            'meta_value'     => $mp_id,
        ) );

        if ( ! empty( $existing ) ) {
            return 'skipped';
        }

        $campaign = $wpdb->get_row( $wpdb->prepare(
            "SELECT n.id, n.subject, n.preheader, n.body, n.sent_at, n.newsletter_date,
                    ( SELECT q.newsletter_rendered_body
                      FROM {$wpdb->prefix}mailpoet_sending_queues q
                      WHERE q.newsletter_id = n.id AND q.status = 'completed'
                      ORDER BY q.id DESC LIMIT 1 ) AS newsletter_rendered_body
             FROM {$wpdb->prefix}mailpoet_newsletters n
             WHERE n.id = %d AND n.type = 'standard' AND n.deleted_at IS NULL
             LIMIT 1",
            $mp_id
        ) );

        if ( ! $campaign ) {
            return 'error';
        }

        $content = self::extract_content( $campaign->body, $campaign->newsletter_rendered_body );

        // Determine post date — prefer sent_at, fall back to newsletter_date.
        $post_date = ! empty( $campaign->sent_at )
            ? $campaign->sent_at
            : ( ! empty( $campaign->newsletter_date ) ? $campaign->newsletter_date : current_time( 'mysql' ) );

        $post_id = wp_insert_post( array(
            'post_type'     => 'culture_newsletter',
            'post_title'    => sanitize_text_field( $campaign->subject ),
            'post_content'  => wp_kses_post( $content ),
            'post_excerpt'  => sanitize_text_field( $campaign->preheader ),
            'post_status'   => 'draft',
            'post_date'     => $post_date,
            'post_date_gmt' => get_gmt_from_date( $post_date ),
        ), true );

        if ( is_wp_error( $post_id ) ) {
            return 'error';
        }

        update_post_meta( $post_id, '_culture_mailpoet_id', $mp_id );

        return 'imported';
    }

    /**
     * Extract clean HTML content from a MailPoet campaign body.
     *
     * Detection order:
     *  1. Gutenberg block markup (MailPoet Block Editor, 4.x+) — body contains
     *     serialised <!-- wp:... --> blocks → run through do_blocks().
     *  2. Legacy MailPoet block JSON — body is a JSON object with a
     *     content.blocks array → recurse with extract_legacy_blocks().
     *  3. Fallback — use the pre-rendered HTML stored in sending_queues and
     *     strip the outer email scaffolding to keep only the inner content.
     *
     * @param  string|null $body          Raw value of mailpoet_newsletters.body.
     * @param  string|null $rendered_body Pre-rendered HTML from mailpoet_sending_queues.
     * @return string Clean HTML suitable for post_content.
     */
    private static function extract_content( $body, $rendered_body ) {
        // ── 1. Gutenberg / Block Editor format ───────────────────────────────
        if ( ! empty( $body ) && strpos( $body, '<!-- wp:' ) !== false ) {
            if ( function_exists( 'do_blocks' ) ) {
                return do_blocks( $body );
            }
            // do_blocks() unavailable in very early hooks; strip block comments.
            return wp_strip_all_tags( $body, false );
        }

        // ── 2. Legacy MailPoet block JSON ────────────────────────────────────
        if ( ! empty( $body ) ) {
            $body_data = json_decode( $body, true );
            if ( json_last_error() === JSON_ERROR_NONE && ! empty( $body_data['content']['blocks'] ) ) {
                return self::extract_legacy_blocks( $body_data['content']['blocks'] );
            }
        }

        // ── 3. Fallback: pre-rendered HTML ───────────────────────────────────
        if ( ! empty( $rendered_body ) ) {
            return self::strip_email_wrapper( $rendered_body );
        }

        return '';
    }

    /**
     * Recursively extract content from MailPoet's legacy block JSON into HTML.
     *
     * @param  array  $blocks MailPoet blocks array.
     * @return string Clean HTML.
     */
    private static function extract_legacy_blocks( array $blocks ) {
        $html = '';

        foreach ( $blocks as $block ) {
            $type = $block['type'] ?? '';

            switch ( $type ) {
                case 'text':
                    if ( ! empty( $block['text'] ) ) {
                        $html .= $block['text'];
                    }
                    break;

                case 'image':
                    if ( ! empty( $block['src'] ) ) {
                        $alt   = esc_attr( $block['alt'] ?? '' );
                        $src   = esc_url( $block['src'] );
                        $link  = ! empty( $block['link'] ) ? esc_url( $block['link'] ) : '';
                        $img   = '<img src="' . $src . '" alt="' . $alt . '" style="max-width:100%;height:auto;">';
                        $html .= $link ? '<p><a href="' . $link . '">' . $img . '</a></p>' : '<p>' . $img . '</p>';
                    }
                    break;

                case 'button':
                    if ( ! empty( $block['text'] ) ) {
                        $url   = ! empty( $block['url'] ) ? esc_url( $block['url'] ) : '#';
                        $html .= '<p><a href="' . $url . '">' . esc_html( $block['text'] ) . '</a></p>';
                    }
                    break;

                case 'divider':
                    $html .= '<hr>';
                    break;

                case 'spacer':
                    $html .= '<p>&nbsp;</p>';
                    break;

                case 'header':
                case 'footer':
                    // Skip — these contain unsubscribe links and branding that
                    // don't belong in the web version.
                    break;

                default:
                    // Recurse into container/column/section blocks.
                    if ( ! empty( $block['blocks'] ) && is_array( $block['blocks'] ) ) {
                        $html .= self::extract_legacy_blocks( $block['blocks'] );
                    }
                    break;
            }
        }

        return $html;
    }

    /**
     * Strip the outer email scaffold from MailPoet's pre-rendered HTML.
     *
     * MailPoet wraps every email in full <html><body> boilerplate with tables,
     * inline styles, and an unsubscribe footer. We pull out only the nodes
     * between the opening content table and the footer table so the result is
     * usable as post_content.
     *
     * @param  string $html Raw pre-rendered email HTML.
     * @return string Cleaned HTML excerpt.
     */
    private static function strip_email_wrapper( $html ) {
        // Use DOMDocument if available for robust extraction.
        if ( class_exists( 'DOMDocument' ) ) {
            $doc = new DOMDocument();
            libxml_use_internal_errors( true );
            $doc->loadHTML( '<?xml encoding="UTF-8">' . $html, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD );
            libxml_clear_errors();

            $xpath   = new DOMXPath( $doc );
            $content = '';

            // Grab all <p>, <h1-h6>, <img>, <a>, <ul>, <ol>, <blockquote>
            // nodes that are NOT inside a table row used for the footer
            // (MailPoet footer rows carry class="mailpoet_footer").
            $nodes = $xpath->query(
                '//*[not(ancestor::*[contains(@class,"mailpoet_footer")])]' .
                '[self::p or self::h1 or self::h2 or self::h3 or self::h4 or self::h5 or self::h6' .
                ' or self::img or self::ul or self::ol or self::blockquote or self::hr]'
            );

            if ( $nodes && $nodes->length > 0 ) {
                foreach ( $nodes as $node ) {
                    $content .= $doc->saveHTML( $node );
                }
                return $content;
            }
        }

        // Regex fallback: strip everything before first <p> and after footer marker.
        $html = preg_replace( '/<table[^>]*class="[^"]*mailpoet_footer[^"]*".*$/is', '', $html );
        $html = strip_tags( $html, '<p><h1><h2><h3><h4><h5><h6><img><a><ul><ol><li><blockquote><hr><strong><em><br>' );

        return trim( $html );
    }

    /**
     * Fetch all sent MailPoet standard campaigns with import status.
     *
     * @return array
     */
    private static function get_mailpoet_campaigns() {
        global $wpdb;

        // Include 'sent' and 'sending' so campaigns mid-send are visible too.
        // All non-aggregated columns are listed in GROUP BY to satisfy
        // MySQL's ONLY_FULL_GROUP_BY mode (default since MySQL 5.7).
        $rows = $wpdb->get_results(
            "SELECT
                n.id,
                n.subject,
                n.preheader,
                n.status,
                n.sent_at,
                COALESCE( SUM( q.count_total ), 0 ) AS recipients
             FROM {$wpdb->prefix}mailpoet_newsletters n
             LEFT JOIN {$wpdb->prefix}mailpoet_sending_queues q
                    ON q.newsletter_id = n.id AND q.status = 'completed'
             WHERE n.type = 'standard'
               AND n.status IN ( 'sent', 'sending' )
               AND n.deleted_at IS NULL
             GROUP BY n.id, n.subject, n.preheader, n.status, n.sent_at
             ORDER BY n.sent_at DESC"
        );

        if ( empty( $rows ) ) {
            return array();
        }

        // Build a lookup of already-imported MailPoet IDs.
        $imported_ids = get_posts( array(
            'post_type'      => 'culture_newsletter',
            'posts_per_page' => -1,
            'fields'         => 'ids',
            'meta_key'       => '_culture_mailpoet_id',
        ) );

        $imported_meta = array();
        foreach ( $imported_ids as $post_id ) {
            $imported_meta[] = (int) get_post_meta( $post_id, '_culture_mailpoet_id', true );
        }

        $campaigns = array();
        foreach ( $rows as $row ) {
            $campaigns[] = array(
                'id'               => (int) $row->id,
                'subject'          => $row->subject,
                'preheader'        => $row->preheader,
                'sent_at_formatted' => $row->sent_at
                    ? date_i18n( get_option( 'date_format' ) . ' ' . get_option( 'time_format' ), strtotime( $row->sent_at ) )
                    : __( 'Unknown', 'culture-community' ),
                'recipients'       => (int) $row->recipients,
                'already_imported' => in_array( (int) $row->id, $imported_meta, true ),
            );
        }

        return $campaigns;
    }

    /**
     * Return a summary of newsletter types/statuses in the MailPoet table.
     * Used as a diagnostic aid when the main list comes back empty.
     *
     * @return array|null Rows with type, status, cnt — or null if table doesn't exist.
     */
    private static function get_mailpoet_diagnostic() {
        global $wpdb;
        $table = $wpdb->prefix . 'mailpoet_newsletters';
        // Silently check the table exists first.
        $exists = $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $table ) );
        if ( ! $exists ) {
            return null;
        }
        return $wpdb->get_results(
            "SELECT type, status, COUNT(*) AS cnt
             FROM {$table}
             WHERE deleted_at IS NULL
             GROUP BY type, status
             ORDER BY cnt DESC"
        ) ?: null;
    }

    /**
     * Check whether MailPoet is active and its newsletters table exists.
     *
     * @return bool
     */
    private static function is_mailpoet_active() {
        global $wpdb;

        if ( ! function_exists( 'is_plugin_active' ) ) {
            require_once ABSPATH . 'wp-admin/includes/plugin.php';
        }

        $active = is_plugin_active( 'mailpoet/mailpoet.php' )
               || is_plugin_active( 'wysija-newsletters/index.php' );

        if ( ! $active ) {
            return false;
        }

        $table  = $wpdb->prefix . 'mailpoet_newsletters';
        $exists = $wpdb->get_var( $wpdb->prepare( 'SHOW TABLES LIKE %s', $table ) );

        return ! empty( $exists );
    }
}
