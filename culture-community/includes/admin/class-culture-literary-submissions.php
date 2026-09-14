<?php
/**
 * The Moveee Literary — Submissions Manager (WP Admin only).
 *
 * Writers still submit by emailing literary@themoveee.com with a subject
 * line like "Poetry Submission — Ada Nwosu" (see the Submissions page,
 * apps/site/app/literary/submit/page.tsx) — this tool does not replace that
 * intake channel or add a public-facing form. It's where an editor logs
 * each emailed submission and tracks it through decision: status, the $3
 * quarterly fee (Flash has none), the $15–$25 contributor payment ($10 flat
 * for Flash), an assigned reviewer, internal notes, and the 8–12 week (4
 * week for Flash) response-time promise made on that same page.
 *
 * Storage: a single wp_options row, `culture_literary_submissions`, an
 * array of submission objects — same pattern as Culture_Redirects (a small,
 * manually-curated list; a dedicated dbDelta table would be overkill here).
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Culture_Literary_Submissions {

    const OPTION_KEY = 'culture_literary_submissions';
    const NONCE      = 'culture_lit_submission_nonce';

    /** Sections a writer can submit to, and the terms that apply to each. */
    const SECTIONS = array(
        'fiction'       => array(
            'label'         => 'Fiction',
            'response_days' => 84, // 12 weeks
            'fee'           => 3,
            'payment_label' => '$15–$25',
        ),
        'poetry'        => array(
            'label'         => 'Poetry',
            'response_days' => 84,
            'fee'           => 3,
            'payment_label' => '$15–$25',
        ),
        'essays'        => array(
            'label'         => 'Essays',
            'response_days' => 84,
            'fee'           => 3,
            'payment_label' => '$15–$25',
        ),
        'conversations' => array(
            'label'         => 'Conversations',
            'response_days' => 84,
            'fee'           => 3,
            'payment_label' => '$15–$25',
        ),
        'translation'   => array(
            'label'         => 'In Translation',
            'response_days' => 84,
            'fee'           => 3,
            'payment_label' => '$15–$25',
        ),
        'notes'         => array(
            'label'         => 'Notes',
            'response_days' => 84,
            'fee'           => 3,
            'payment_label' => '$15–$25',
        ),
        'flash'         => array(
            'label'         => 'The Moveee Flash',
            'response_days' => 28, // 4 weeks
            'fee'           => 0,
            'payment_label' => '$10 flat',
        ),
    );

    const STATUSES = array(
        'received'  => array( 'label' => 'Received',  'color' => '#e9ecef' ),
        'in_review' => array( 'label' => 'In Review',  'color' => '#fff3cd' ),
        'accepted'  => array( 'label' => 'Accepted',   'color' => '#d4edda' ),
        'rejected'  => array( 'label' => 'Rejected',   'color' => '#f8d7da' ),
        'published' => array( 'label' => 'Published',  'color' => '#cce5ff' ),
    );

    /** Statuses that count as "still awaiting a decision" for deadline tracking. */
    const OPEN_STATUSES = array( 'received', 'in_review' );

    const FEE_STATUSES = array(
        'n_a'     => 'N/A — no submission fee',
        'pending' => 'Pending',
        'paid'    => 'Paid',
        'waived'  => 'Waived',
    );

    const PAYMENT_STATUSES = array(
        'unpaid' => 'Unpaid',
        'paid'   => 'Paid',
    );

    /**
     * The literary category (see packages/shared/lib/wp.ts's LITERARY_CATEGORY_SLUG)
     * and the plain WP tag each section maps to when pushed to WordPress —
     * same tag names as LITERARY_GENRES[].label in that file, so a pushed post
     * shows up on the matching /literary/{genre} archive automatically.
     * 'flash' deliberately has no tag: there is no dedicated Flash genre page,
     * so a pushed Flash piece surfaces in the main /literary feed only, same
     * as any other untagged literary post (documented, graceful behaviour).
     */
    const LITERARY_CATEGORY_SLUG = 'literary';
    const GENRE_TAG_NAMES        = array(
        'fiction'       => 'Fiction',
        'poetry'        => 'Poetry',
        'essays'        => 'Essays',
        'conversations' => 'Conversations',
        'translation'   => 'In Translation',
        'notes'         => 'Notes',
        'flash'         => null,
    );

    public static function init(): void {
        add_action( 'admin_menu', array( __CLASS__, 'register_menu' ) );
        add_action( 'admin_post_culture_lit_submission_save',   array( __CLASS__, 'handle_save' ) );
        add_action( 'admin_post_culture_lit_submission_delete', array( __CLASS__, 'handle_delete' ) );
        add_action( 'admin_post_culture_lit_submission_status', array( __CLASS__, 'handle_quick_status' ) );
        add_action( 'admin_post_culture_lit_submission_export', array( __CLASS__, 'handle_export' ) );
        add_action( 'admin_post_culture_lit_submission_push',   array( __CLASS__, 'handle_push' ) );
    }

    // ── Storage helpers ───────────────────────────────────────────────────────

    public static function get_all(): array {
        return (array) get_option( self::OPTION_KEY, array() );
    }

    private static function save_all( array $submissions ): void {
        update_option( self::OPTION_KEY, array_values( $submissions ), false );
    }

    private static function response_days( string $section ): int {
        return self::SECTIONS[ $section ]['response_days'] ?? 84;
    }

    private static function deadline_ts( array $submission ): int {
        $received_ts = strtotime( $submission['received_at'] ?? '' ) ?: current_time( 'timestamp' );
        return $received_ts + ( self::response_days( $submission['section'] ?? '' ) * DAY_IN_SECONDS );
    }

    /** 'overdue' | 'due_soon' | 'on_track' | 'closed' */
    private static function deadline_state( array $submission ): string {
        if ( ! in_array( $submission['status'] ?? '', self::OPEN_STATUSES, true ) ) {
            return 'closed';
        }
        $now      = current_time( 'timestamp' );
        $deadline = self::deadline_ts( $submission );
        if ( $now >= $deadline ) {
            return 'overdue';
        }
        if ( $now >= ( $deadline - ( 7 * DAY_IN_SECONDS ) ) ) {
            return 'due_soon';
        }
        return 'on_track';
    }

    private static function count_overdue( array $submissions ): int {
        $n = 0;
        foreach ( $submissions as $s ) {
            if ( 'overdue' === self::deadline_state( $s ) ) {
                $n++;
            }
        }
        return $n;
    }

    /**
     * Email the writer when a status change lands on 'accepted'/'rejected' —
     * called from handle_save()/handle_quick_status() with the status as it
     * was *before* this request, so an unrelated edit (notes, reviewer, etc.)
     * that leaves status unchanged never re-fires the email.
     *
     * @return string 'sent' | 'skipped_no_change' | 'skipped_no_email'
     */
    private static function maybe_notify_writer( array $submission, string $old_status ): string {
        $new_status = $submission['status'] ?? '';
        if ( $new_status === $old_status || ! in_array( $new_status, array( 'accepted', 'rejected' ), true ) ) {
            return 'skipped_no_change';
        }
        if ( empty( $submission['writer_email'] ) ) {
            return 'skipped_no_email';
        }

        $section_meta = self::SECTIONS[ $submission['section'] ] ?? self::SECTIONS['fiction'];
        Culture_Emails::send_literary_submission_decision(
            $submission['writer_email'],
            $submission['writer_name'] ?? '',
            $section_meta['label'],
            $submission['title'] ?? '',
            $new_status,
            $section_meta['payment_label']
        );

        return 'sent';
    }

    /**
     * Create or update the linked WordPress draft post from a submission's
     * title/content — "processing into publishing" stops here on purpose:
     * this hands the editor a real draft in the `literary` category with the
     * right genre tag pre-set, not a finished, auto-published piece. Author,
     * featured image, and the final publish click still happen by hand in
     * the normal post editor.
     *
     * @return int|WP_Error New/updated post ID, or an error to show the editor.
     */
    private static function push_to_wordpress( array $submission ) {
        if ( empty( $submission['content'] ) ) {
            return new WP_Error( 'no_content', 'Add the piece content before pushing to WordPress.' );
        }

        $literary_term = get_term_by( 'slug', self::LITERARY_CATEGORY_SLUG, 'category' );
        if ( ! $literary_term ) {
            return new WP_Error( 'no_category', 'The "literary" category does not exist on this site yet — create it first.' );
        }

        // Prefer the submitting writer's own WP account, if they have one, so
        // the byline is real; otherwise the editor doing the push is the
        // author of record until someone reassigns it in the post editor.
        $author_id = get_current_user_id();
        if ( ! empty( $submission['writer_email'] ) ) {
            $writer_user = get_user_by( 'email', $submission['writer_email'] );
            if ( $writer_user ) {
                $author_id = $writer_user->ID;
            }
        }

        $postarr = array(
            'post_title'   => $submission['title'] ?: ( $submission['writer_name'] . ' — untitled' ),
            'post_content' => wp_kses_post( $submission['content'] ),
            'post_status'  => 'draft',
            'post_type'    => 'post',
            'post_author'  => $author_id,
            'post_category' => array( (int) $literary_term->term_id ),
        );

        if ( ! empty( $submission['wp_post_id'] ) && get_post( $submission['wp_post_id'] ) ) {
            $postarr['ID'] = (int) $submission['wp_post_id'];
            $post_id       = wp_update_post( $postarr, true );
        } else {
            $post_id = wp_insert_post( $postarr, true );
        }

        if ( is_wp_error( $post_id ) ) {
            return $post_id;
        }

        $genre_tag = self::GENRE_TAG_NAMES[ $submission['section'] ] ?? null;
        if ( $genre_tag ) {
            wp_set_post_tags( $post_id, array( $genre_tag ), true );
        }

        update_post_meta( $post_id, '_lit_submission_id', $submission['id'] );
        update_post_meta( $post_id, '_lit_submission_writer_name', $submission['writer_name'] ?? '' );

        return $post_id;
    }

    // ── Menu ──────────────────────────────────────────────────────────────────

    public static function register_menu(): void {
        $overdue = self::count_overdue( self::get_all() );
        $title   = __( 'Literary Submissions', 'culture-community' );
        if ( $overdue > 0 ) {
            $title .= sprintf(
                ' <span class="awaiting-mod count-%1$d"><span class="pending-count">%1$d</span></span>',
                $overdue
            );
        }

        add_submenu_page(
            'culture-community',
            __( 'Literary Submissions', 'culture-community' ),
            $title,
            'manage_options',
            'culture-literary-submissions',
            array( __CLASS__, 'render_page' )
        );
    }

    // ── Form handlers ─────────────────────────────────────────────────────────

    public static function handle_save(): void {
        check_admin_referer( self::NONCE );
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( 'Forbidden' );
        }

        $section = sanitize_key( wp_unslash( $_POST['section'] ?? '' ) );
        if ( ! isset( self::SECTIONS[ $section ] ) ) {
            $section = 'fiction';
        }

        $writer_name = sanitize_text_field( wp_unslash( $_POST['writer_name'] ?? '' ) );
        $received_at = sanitize_text_field( wp_unslash( $_POST['received_at'] ?? '' ) );
        if ( ! $writer_name || ! $received_at ) {
            wp_redirect( add_query_arg( 'error', 'missing', admin_url( 'admin.php?page=culture-literary-submissions' ) ) );
            exit;
        }

        $status      = sanitize_key( wp_unslash( $_POST['status'] ?? 'received' ) );
        $status      = isset( self::STATUSES[ $status ] ) ? $status : 'received';

        $fee_status = self::SECTIONS[ $section ]['fee'] > 0
            ? sanitize_key( wp_unslash( $_POST['fee_status'] ?? 'pending' ) )
            : 'n_a';
        if ( ! isset( self::FEE_STATUSES[ $fee_status ] ) ) {
            $fee_status = self::SECTIONS[ $section ]['fee'] > 0 ? 'pending' : 'n_a';
        }

        $payment_status = sanitize_key( wp_unslash( $_POST['payment_status'] ?? 'unpaid' ) );
        if ( ! isset( self::PAYMENT_STATUSES[ $payment_status ] ) ) {
            $payment_status = 'unpaid';
        }

        $entry = array(
            'id'             => sanitize_text_field( wp_unslash( $_POST['edit_id'] ?? '' ) ) ?: uniqid( 'lit_', false ),
            'writer_name'    => $writer_name,
            'writer_email'   => sanitize_email( wp_unslash( $_POST['writer_email'] ?? '' ) ),
            'section'        => $section,
            'title'          => sanitize_text_field( wp_unslash( $_POST['title'] ?? '' ) ),
            'subject_line'   => sanitize_text_field( wp_unslash( $_POST['subject_line'] ?? '' ) ),
            'status'         => $status,
            'fee_status'     => $fee_status,
            'payment_status' => $payment_status,
            'reviewer_id'    => absint( $_POST['reviewer_id'] ?? 0 ),
            'received_at'    => $received_at,
            'notes'          => sanitize_textarea_field( wp_unslash( $_POST['notes'] ?? '' ) ),
            // The edited manuscript, pasted in by the editor — this is what
            // push_to_wordpress() sends over as the draft post_content.
            'content'        => wp_kses_post( wp_unslash( $_POST['content'] ?? '' ) ),
        );

        $submissions = self::get_all();
        $edit_id     = sanitize_text_field( wp_unslash( $_POST['edit_id'] ?? '' ) );
        $found       = false;
        $old_status  = 'received';

        if ( $edit_id ) {
            foreach ( $submissions as &$s ) {
                if ( $s['id'] === $edit_id ) {
                    $old_status          = $s['status'] ?? 'received';
                    $entry['created_at'] = $s['created_at'] ?? current_time( 'mysql' );
                    // wp_post_id is only ever set by handle_push() — never a
                    // form field — so a plain edit save can't clear the link.
                    $entry['wp_post_id'] = $s['wp_post_id'] ?? 0;
                    $s                   = array_merge( $s, $entry );
                    $found               = true;
                    break;
                }
            }
            unset( $s );
        }

        if ( ! $found ) {
            $entry['created_at'] = current_time( 'mysql' );
            $entry['wp_post_id'] = 0;
            $submissions[]       = $entry;
        }

        self::save_all( $submissions );

        $notify_result = self::maybe_notify_writer( $entry, $old_status );
        $redirect_args = array( 'saved' => '1' );
        if ( 'skipped_no_email' === $notify_result ) {
            $redirect_args['notice'] = 'no_email';
        }

        wp_redirect( add_query_arg( $redirect_args, admin_url( 'admin.php?page=culture-literary-submissions' ) ) );
        exit;
    }

    public static function handle_delete(): void {
        check_admin_referer( self::NONCE );
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( 'Forbidden' );
        }

        $id          = sanitize_text_field( wp_unslash( $_POST['submission_id'] ?? '' ) );
        $submissions = array_filter( self::get_all(), fn( $s ) => $s['id'] !== $id );

        self::save_all( array_values( $submissions ) );
        wp_redirect( add_query_arg( 'deleted', '1', admin_url( 'admin.php?page=culture-literary-submissions' ) ) );
        exit;
    }

    /** Fast row-level status change (Mark In Review / Accepted / Rejected / Published). */
    public static function handle_quick_status(): void {
        $id = sanitize_text_field( wp_unslash( $_GET['id'] ?? '' ) );
        check_admin_referer( 'culture_lit_submission_status_' . $id );
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( 'Forbidden' );
        }

        $status = sanitize_key( wp_unslash( $_GET['status'] ?? '' ) );
        if ( ! isset( self::STATUSES[ $status ] ) ) {
            wp_die( 'Invalid status' );
        }

        $submissions   = self::get_all();
        $old_status    = 'received';
        $updated_entry = null;

        foreach ( $submissions as &$s ) {
            if ( $s['id'] === $id ) {
                $old_status    = $s['status'] ?? 'received';
                $s['status']   = $status;
                $updated_entry = $s;
                break;
            }
        }
        unset( $s );

        self::save_all( $submissions );

        $notify_result = $updated_entry ? self::maybe_notify_writer( $updated_entry, $old_status ) : 'skipped_no_change';
        $qs            = self::redirect_qs();
        if ( 'skipped_no_email' === $notify_result ) {
            $qs .= '&notice=no_email';
        }

        wp_safe_redirect( admin_url( 'admin.php?' . $qs ) );
        exit;
    }

    /** Create/update the linked WordPress draft post from a submission's content. */
    public static function handle_push(): void {
        $id = sanitize_text_field( wp_unslash( $_GET['id'] ?? '' ) );
        check_admin_referer( 'culture_lit_submission_push_' . $id );
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( 'Forbidden' );
        }

        $submissions = self::get_all();
        $target      = null;
        foreach ( $submissions as &$s ) {
            if ( $s['id'] === $id ) {
                $target = &$s;
                break;
            }
        }
        unset( $s );

        if ( ! $target ) {
            wp_die( 'Submission not found' );
        }

        $result = self::push_to_wordpress( $target );

        $qs = self::redirect_qs();
        if ( is_wp_error( $result ) ) {
            wp_safe_redirect( admin_url( 'admin.php?' . $qs . '&push_error=' . rawurlencode( $result->get_error_message() ) ) );
            exit;
        }

        $target['wp_post_id'] = (int) $result;
        self::save_all( $submissions );

        wp_safe_redirect( admin_url( 'admin.php?' . $qs . '&pushed=1' ) );
        exit;
    }

    public static function handle_export(): void {
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( 'Unauthorised', 403 );
        }
        check_admin_referer( 'culture_export_lit_submissions' );

        $rows = self::filtered( self::get_all() );

        $filename = 'literary-submissions-' . gmdate( 'Y-m-d' ) . '.csv';
        header( 'Content-Type: text/csv; charset=UTF-8' );
        header( 'Content-Disposition: attachment; filename="' . $filename . '"' );
        header( 'Pragma: no-cache' );

        $out = fopen( 'php://output', 'w' );
        fputcsv( $out, array(
            'Writer', 'Email', 'Section', 'Title', 'Status', 'Fee Status', 'Payment Status',
            'Reviewer', 'Received', 'Deadline', 'Deadline Status', 'Notes',
        ) );

        foreach ( $rows as $s ) {
            $reviewer = $s['reviewer_id'] ? get_userdata( $s['reviewer_id'] ) : null;
            fputcsv( $out, array(
                $s['writer_name'] ?? '',
                $s['writer_email'] ?? '',
                self::SECTIONS[ $s['section'] ]['label'] ?? $s['section'],
                $s['title'] ?? '',
                self::STATUSES[ $s['status'] ]['label'] ?? $s['status'],
                self::FEE_STATUSES[ $s['fee_status'] ] ?? $s['fee_status'],
                self::PAYMENT_STATUSES[ $s['payment_status'] ] ?? $s['payment_status'],
                $reviewer ? $reviewer->display_name : '',
                $s['received_at'] ?? '',
                gmdate( 'Y-m-d', self::deadline_ts( $s ) ),
                self::deadline_state( $s ),
                $s['notes'] ?? '',
            ) );
        }
        fclose( $out );
        exit;
    }

    private static function redirect_qs(): string {
        return http_build_query( array_filter( array(
            'page'    => 'culture-literary-submissions',
            'status'  => sanitize_text_field( wp_unslash( $_GET['status'] ?? '' ) ),
            'section' => sanitize_text_field( wp_unslash( $_GET['section'] ?? '' ) ),
            'overdue' => sanitize_text_field( wp_unslash( $_GET['overdue'] ?? '' ) ),
            's'       => sanitize_text_field( wp_unslash( $_GET['s'] ?? '' ) ),
        ) ) );
    }

    // ── Filtering ─────────────────────────────────────────────────────────────

    private static function filtered( array $submissions ): array {
        $status      = sanitize_text_field( wp_unslash( $_GET['status'] ?? '' ) );
        $section     = sanitize_text_field( wp_unslash( $_GET['section'] ?? '' ) );
        $overdue_only = ! empty( $_GET['overdue'] );
        $search      = strtolower( trim( sanitize_text_field( wp_unslash( $_GET['s'] ?? '' ) ) ) );

        return array_values( array_filter( $submissions, function ( $s ) use ( $status, $section, $overdue_only, $search ) {
            if ( $status && ( $s['status'] ?? '' ) !== $status ) {
                return false;
            }
            if ( $section && ( $s['section'] ?? '' ) !== $section ) {
                return false;
            }
            if ( $overdue_only && 'overdue' !== self::deadline_state( $s ) ) {
                return false;
            }
            if ( $search ) {
                $haystack = strtolower( ( $s['writer_name'] ?? '' ) . ' ' . ( $s['writer_email'] ?? '' ) . ' ' . ( $s['title'] ?? '' ) );
                if ( false === strpos( $haystack, $search ) ) {
                    return false;
                }
            }
            return true;
        } ) );
    }

    // ── Render ────────────────────────────────────────────────────────────────

    public static function render_page(): void {
        $all         = self::get_all();
        // Newest received first.
        usort( $all, fn( $a, $b ) => strcmp( $b['received_at'] ?? '', $a['received_at'] ?? '' ) );
        $submissions = self::filtered( $all );

        $edit = null;
        if ( ! empty( $_GET['edit'] ) ) {
            $edit_id = sanitize_text_field( wp_unslash( $_GET['edit'] ) );
            foreach ( $all as $s ) {
                if ( $s['id'] === $edit_id ) {
                    $edit = $s;
                    break;
                }
            }
        }

        $saved   = isset( $_GET['saved'] );
        $deleted = isset( $_GET['deleted'] );
        $error   = sanitize_text_field( wp_unslash( $_GET['error'] ?? '' ) );

        $total       = count( $all );
        $overdue     = self::count_overdue( $all );
        $awaiting    = count( array_filter( $all, fn( $s ) => in_array( $s['status'] ?? '', self::OPEN_STATUSES, true ) ) );

        $reviewers = get_users( array( 'capability' => 'edit_posts', 'orderby' => 'display_name' ) );

        $status_f  = sanitize_text_field( wp_unslash( $_GET['status'] ?? '' ) );
        $section_f = sanitize_text_field( wp_unslash( $_GET['section'] ?? '' ) );
        $overdue_f = ! empty( $_GET['overdue'] );
        $search_f  = sanitize_text_field( wp_unslash( $_GET['s'] ?? '' ) );
        ?>
        <div class="wrap">
            <h1 class="wp-heading-inline"><?php esc_html_e( 'Literary Submissions', 'culture-community' ); ?></h1>
            <span style="margin-left:12px;color:#666;">
                <?php echo esc_html( number_format( $total ) ); ?> total
                &nbsp;·&nbsp; <?php echo esc_html( number_format( $awaiting ) ); ?> awaiting decision
                <?php if ( $overdue > 0 ) : ?>
                    &nbsp;·&nbsp; <strong style="color:#a00;"><?php echo esc_html( number_format( $overdue ) ); ?> overdue</strong>
                <?php endif; ?>
            </span>
            <hr class="wp-header-end">

            <p style="color:#666;max-width:760px;">
                Writers submit by emailing <code>literary@themoveee.com</code> with the section and
                their name in the subject line — e.g. &ldquo;Poetry Submission &mdash; Ada Nwosu&rdquo;
                or &ldquo;Flash Submission &mdash; Ada Nwosu.&rdquo; Paste that subject line below and
                the writer name and section will fill in automatically.
            </p>

            <?php if ( $saved )   : ?><div class="notice notice-success is-dismissible"><p>Submission saved.</p></div><?php endif; ?>
            <?php if ( $deleted ) : ?><div class="notice notice-success is-dismissible"><p>Submission deleted.</p></div><?php endif; ?>
            <?php if ( $error === 'missing' ) : ?><div class="notice notice-error is-dismissible"><p>Writer name and received date are required.</p></div><?php endif; ?>
            <?php if ( isset( $_GET['pushed'] ) ) : ?>
                <div class="notice notice-success is-dismissible"><p>Pushed to WordPress as a draft.</p></div>
            <?php endif; ?>
            <?php if ( ! empty( $_GET['push_error'] ) ) : ?>
                <div class="notice notice-error is-dismissible"><p><?php echo esc_html( sanitize_text_field( wp_unslash( $_GET['push_error'] ) ) ); ?></p></div>
            <?php endif; ?>
            <?php if ( 'no_email' === sanitize_text_field( wp_unslash( $_GET['notice'] ?? '' ) ) ) : ?>
                <div class="notice notice-warning is-dismissible"><p>Status updated, but there's no email address on file — the writer wasn't notified.</p></div>
            <?php endif; ?>

            <!-- Add / Edit form -->
            <div style="background:#fff;border:1px solid #ccd0d4;padding:24px 28px;max-width:820px;margin-bottom:30px;">
                <h2 style="margin-top:0;"><?php echo $edit ? 'Edit Submission' : 'Log a New Submission'; ?></h2>
                <form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
                    <?php wp_nonce_field( self::NONCE ); ?>
                    <input type="hidden" name="action"  value="culture_lit_submission_save">
                    <input type="hidden" name="edit_id" value="<?php echo esc_attr( $edit['id'] ?? '' ); ?>">

                    <table class="form-table" style="margin:0;">
                        <tr>
                            <th style="width:160px;padding:8px 0;">Email subject line</th>
                            <td>
                                <input type="text" id="lit-subject" name="subject_line"
                                       value="<?php echo esc_attr( $edit['subject_line'] ?? '' ); ?>"
                                       placeholder="Poetry Submission — Ada Nwosu" class="large-text">
                                <p class="description">Paste it verbatim — Writer Name and Section below fill in automatically.</p>
                            </td>
                        </tr>
                        <tr>
                            <th style="padding:8px 0;">Writer name</th>
                            <td>
                                <input type="text" id="lit-writer-name" name="writer_name"
                                       value="<?php echo esc_attr( $edit['writer_name'] ?? '' ); ?>"
                                       class="regular-text" required>
                            </td>
                        </tr>
                        <tr>
                            <th style="padding:8px 0;">Writer email</th>
                            <td>
                                <input type="email" name="writer_email"
                                       value="<?php echo esc_attr( $edit['writer_email'] ?? '' ); ?>"
                                       class="regular-text" placeholder="ada@example.com">
                            </td>
                        </tr>
                        <tr>
                            <th style="padding:8px 0;">Section</th>
                            <td>
                                <select id="lit-section" name="section">
                                    <?php foreach ( self::SECTIONS as $slug => $s ) : ?>
                                        <option value="<?php echo esc_attr( $slug ); ?>" <?php selected( $edit['section'] ?? 'fiction', $slug ); ?>>
                                            <?php echo esc_html( $s['label'] ); ?>
                                        </option>
                                    <?php endforeach; ?>
                                </select>
                                <p class="description" id="lit-section-terms"></p>
                            </td>
                        </tr>
                        <tr>
                            <th style="padding:8px 0;">Piece title</th>
                            <td>
                                <input type="text" name="title" value="<?php echo esc_attr( $edit['title'] ?? '' ); ?>"
                                       class="regular-text" placeholder="Optional — working title">
                            </td>
                        </tr>
                        <tr>
                            <th style="padding:8px 0;">Received</th>
                            <td>
                                <input type="date" name="received_at"
                                       value="<?php echo esc_attr( $edit['received_at'] ?? gmdate( 'Y-m-d' ) ); ?>" required>
                            </td>
                        </tr>
                        <tr>
                            <th style="padding:8px 0;">Status</th>
                            <td>
                                <select name="status">
                                    <?php foreach ( self::STATUSES as $slug => $s ) : ?>
                                        <option value="<?php echo esc_attr( $slug ); ?>" <?php selected( $edit['status'] ?? 'received', $slug ); ?>>
                                            <?php echo esc_html( $s['label'] ); ?>
                                        </option>
                                    <?php endforeach; ?>
                                </select>
                                <p class="description">Saving with this changed to Accepted or Rejected emails the writer automatically.</p>
                            </td>
                        </tr>
                        <tr>
                            <th style="padding:8px 0;vertical-align:top;">Piece content</th>
                            <td>
                                <?php
                                wp_editor(
                                    $edit['content'] ?? '',
                                    'lit_content',
                                    array(
                                        'textarea_name' => 'content',
                                        'textarea_rows' => 14,
                                        'media_buttons' => false,
                                        'teeny'         => true,
                                    )
                                );
                                ?>
                                <p class="description">
                                    Paste the (edited) manuscript here — this is what "Push to WordPress" sends over as
                                    the draft post body. Leave blank if you're only tracking the submission for now.
                                </p>
                            </td>
                        </tr>
                        <tr>
                            <th style="padding:8px 0;">Submission fee</th>
                            <td>
                                <select id="lit-fee-status" name="fee_status">
                                    <?php foreach ( self::FEE_STATUSES as $slug => $label ) : ?>
                                        <option value="<?php echo esc_attr( $slug ); ?>" <?php selected( $edit['fee_status'] ?? 'pending', $slug ); ?>>
                                            <?php echo esc_html( $label ); ?>
                                        </option>
                                    <?php endforeach; ?>
                                </select>
                                <p class="description">The $3 quarterly fee (waivable) — Flash has no fee.</p>
                            </td>
                        </tr>
                        <tr>
                            <th style="padding:8px 0;">Contributor payment</th>
                            <td>
                                <select name="payment_status">
                                    <?php foreach ( self::PAYMENT_STATUSES as $slug => $label ) : ?>
                                        <option value="<?php echo esc_attr( $slug ); ?>" <?php selected( $edit['payment_status'] ?? 'unpaid', $slug ); ?>>
                                            <?php echo esc_html( $label ); ?>
                                        </option>
                                    <?php endforeach; ?>
                                </select>
                                <p class="description" id="lit-payment-terms"></p>
                            </td>
                        </tr>
                        <tr>
                            <th style="padding:8px 0;">Assigned reviewer</th>
                            <td>
                                <select name="reviewer_id">
                                    <option value="0">— Unassigned —</option>
                                    <?php foreach ( $reviewers as $user ) : ?>
                                        <option value="<?php echo esc_attr( $user->ID ); ?>" <?php selected( (int) ( $edit['reviewer_id'] ?? 0 ), $user->ID ); ?>>
                                            <?php echo esc_html( $user->display_name ); ?>
                                        </option>
                                    <?php endforeach; ?>
                                </select>
                            </td>
                        </tr>
                        <tr>
                            <th style="padding:8px 0;">Internal notes</th>
                            <td>
                                <textarea name="notes" rows="3" class="large-text"
                                          placeholder="Editorial discussion, decision rationale, follow-ups…"><?php echo esc_textarea( $edit['notes'] ?? '' ); ?></textarea>
                            </td>
                        </tr>
                    </table>

                    <p style="margin-top:16px;">
                        <?php submit_button( $edit ? 'Update Submission' : 'Log Submission', 'primary', 'submit', false ); ?>
                        <?php if ( $edit ) : ?>
                            &nbsp;<a href="<?php echo esc_url( admin_url( 'admin.php?page=culture-literary-submissions' ) ); ?>" class="button">Cancel</a>
                        <?php endif; ?>
                    </p>
                </form>
            </div>

            <!-- Filters -->
            <form method="get" style="margin:16px 0;display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
                <input type="hidden" name="page" value="culture-literary-submissions">

                <input type="text" name="s" value="<?php echo esc_attr( $search_f ); ?>"
                       placeholder="Search writer, email, title…" class="regular-text">

                <select name="section" onchange="this.form.submit()">
                    <option value="">— All Sections —</option>
                    <?php foreach ( self::SECTIONS as $slug => $s ) : ?>
                        <option value="<?php echo esc_attr( $slug ); ?>" <?php selected( $section_f, $slug ); ?>>
                            <?php echo esc_html( $s['label'] ); ?>
                        </option>
                    <?php endforeach; ?>
                </select>

                <select name="status" onchange="this.form.submit()">
                    <option value="">— All Statuses —</option>
                    <?php foreach ( self::STATUSES as $slug => $s ) : ?>
                        <option value="<?php echo esc_attr( $slug ); ?>" <?php selected( $status_f, $slug ); ?>>
                            <?php echo esc_html( $s['label'] ); ?>
                        </option>
                    <?php endforeach; ?>
                </select>

                <label>
                    <input type="checkbox" name="overdue" value="1" <?php checked( $overdue_f ); ?> onchange="this.form.submit()">
                    Overdue only
                </label>

                <button type="submit" class="button">Filter</button>
                <a href="<?php echo esc_url( admin_url( 'admin.php?page=culture-literary-submissions' ) ); ?>" class="button">Reset</a>

                <a href="<?php echo esc_url( admin_url( 'admin-post.php?' . self::redirect_qs() . '&action=culture_lit_submission_export&_wpnonce=' . wp_create_nonce( 'culture_export_lit_submissions' ) ) ); ?>"
                   class="button" style="margin-left:auto;">
                    Export CSV
                </a>
            </form>

            <?php if ( empty( $submissions ) ) : ?>
                <p style="color:#666;">No submissions match these filters.</p>
            <?php else : ?>
                <table class="wp-list-table widefat fixed striped">
                    <thead>
                        <tr>
                            <th>Writer</th>
                            <th>Section</th>
                            <th>Title</th>
                            <th>Status</th>
                            <th>Fee</th>
                            <th>Payment</th>
                            <th>Reviewer</th>
                            <th>Received</th>
                            <th>Deadline</th>
                            <th>WordPress</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ( $submissions as $s ) : ?>
                            <?php
                            $section_meta   = self::SECTIONS[ $s['section'] ] ?? self::SECTIONS['fiction'];
                            $status_meta    = self::STATUSES[ $s['status'] ] ?? self::STATUSES['received'];
                            $deadline_state = self::deadline_state( $s );
                            $reviewer       = ! empty( $s['reviewer_id'] ) ? get_userdata( $s['reviewer_id'] ) : null;

                            $deadline_colors = array(
                                'overdue'  => array( '#a00', 'Overdue' ),
                                'due_soon' => array( '#8a6d00', 'Due soon' ),
                                'on_track' => array( '#666',  '' ),
                                'closed'   => array( '#999',  'Responded' ),
                            );
                            [ $dl_color, $dl_label ] = $deadline_colors[ $deadline_state ];
                            $row_qs = http_build_query( array( 'id' => $s['id'] ) ) . '&' . self::redirect_qs();
                            ?>
                            <tr>
                                <td>
                                    <strong><?php echo esc_html( $s['writer_name'] ); ?></strong>
                                    <?php if ( ! empty( $s['writer_email'] ) ) : ?>
                                        <br><a href="mailto:<?php echo esc_attr( $s['writer_email'] ); ?>"><?php echo esc_html( $s['writer_email'] ); ?></a>
                                    <?php endif; ?>
                                </td>
                                <td><?php echo esc_html( $section_meta['label'] ); ?></td>
                                <td><?php echo esc_html( $s['title'] ?: '—' ); ?></td>
                                <td>
                                    <span style="background:<?php echo esc_attr( $status_meta['color'] ); ?>;padding:2px 8px;border-radius:3px;font-size:12px;">
                                        <?php echo esc_html( $status_meta['label'] ); ?>
                                    </span>
                                </td>
                                <td style="font-size:12px;color:#666;"><?php echo esc_html( self::FEE_STATUSES[ $s['fee_status'] ] ?? '—' ); ?></td>
                                <td style="font-size:12px;color:#666;">
                                    <?php echo esc_html( self::PAYMENT_STATUSES[ $s['payment_status'] ] ?? '—' ); ?>
                                    <br><small style="color:#aaa;"><?php echo esc_html( $section_meta['payment_label'] ); ?></small>
                                </td>
                                <td><?php echo esc_html( $reviewer ? $reviewer->display_name : '—' ); ?></td>
                                <td><?php echo esc_html( $s['received_at'] ?? '' ); ?></td>
                                <td>
                                    <span style="color:<?php echo esc_attr( $dl_color ); ?>;<?php echo 'overdue' === $deadline_state ? 'font-weight:600;' : ''; ?>">
                                        <?php echo esc_html( gmdate( 'd M Y', self::deadline_ts( $s ) ) ); ?>
                                        <?php if ( $dl_label ) : ?><br><small><?php echo esc_html( $dl_label ); ?></small><?php endif; ?>
                                    </span>
                                </td>
                                <td style="white-space:nowrap;font-size:12px;">
                                    <?php $wp_post = ! empty( $s['wp_post_id'] ) ? get_post( $s['wp_post_id'] ) : null; ?>
                                    <?php if ( $wp_post ) : ?>
                                        <a href="<?php echo esc_url( get_edit_post_link( $wp_post->ID ) ); ?>">Edit draft &rarr;</a>
                                        <br><span style="color:#999;"><?php echo esc_html( ucfirst( $wp_post->post_status ) ); ?></span>
                                        <br>
                                        <a href="<?php echo esc_url( wp_nonce_url( admin_url( 'admin-post.php?action=culture_lit_submission_push&' . $row_qs ), 'culture_lit_submission_push_' . $s['id'] ) ); ?>">
                                            Re-push edits
                                        </a>
                                    <?php elseif ( in_array( $s['status'], array( 'accepted', 'published' ), true ) ) : ?>
                                        <a href="<?php echo esc_url( wp_nonce_url( admin_url( 'admin-post.php?action=culture_lit_submission_push&' . $row_qs ), 'culture_lit_submission_push_' . $s['id'] ) ); ?>"
                                           class="button button-small">
                                            Push to WordPress
                                        </a>
                                    <?php else : ?>
                                        <span style="color:#bbb;">—</span>
                                    <?php endif; ?>
                                </td>
                                <td style="white-space:nowrap;">
                                    <a href="<?php echo esc_url( add_query_arg( array( 'page' => 'culture-literary-submissions', 'edit' => $s['id'] ), admin_url( 'admin.php' ) ) ); ?>">Edit</a>

                                    <?php foreach ( array( 'in_review' => 'In Review', 'accepted' => 'Accepted', 'rejected' => 'Rejected', 'published' => 'Published' ) as $next_status => $next_label ) : ?>
                                        <?php if ( $s['status'] !== $next_status ) : ?>
                                            &nbsp;·&nbsp;
                                            <a href="<?php echo esc_url( wp_nonce_url( admin_url( 'admin-post.php?action=culture_lit_submission_status&status=' . $next_status . '&' . $row_qs ), 'culture_lit_submission_status_' . $s['id'] ) ); ?>">
                                                <?php echo esc_html( $next_label ); ?>
                                            </a>
                                        <?php endif; ?>
                                    <?php endforeach; ?>

                                    &nbsp;·&nbsp;
                                    <form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" style="display:inline;"
                                          onsubmit="return confirm('Delete this submission record?');">
                                        <?php wp_nonce_field( self::NONCE ); ?>
                                        <input type="hidden" name="action" value="culture_lit_submission_delete">
                                        <input type="hidden" name="submission_id" value="<?php echo esc_attr( $s['id'] ); ?>">
                                        <button type="submit" class="button-link" style="color:#a00;">Delete</button>
                                    </form>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php endif; ?>
        </div>

        <script>
        (function () {
            var SECTION_TERMS = <?php echo wp_json_encode( array_map( fn( $s ) => array(
                'fee'     => $s['fee'] > 0 ? '$' . $s['fee'] . ' submission fee' : 'No submission fee',
                'payment' => $s['payment_label'],
            ), self::SECTIONS ) ); ?>;

            // "Poetry Submission — Ada Nwosu" / "Flash Submission - Ada Nwosu" → section + name.
            var SECTION_ALIASES = {
                fiction: 'fiction', poetry: 'poetry', essays: 'essays', essay: 'essays',
                conversations: 'conversations', conversation: 'conversations',
                translation: 'translation', notes: 'notes', note: 'notes', flash: 'flash'
            };

            var subjectEl  = document.getElementById('lit-subject');
            var nameEl     = document.getElementById('lit-writer-name');
            var sectionEl  = document.getElementById('lit-section');
            var feeEl      = document.getElementById('lit-fee-status');
            var termsEl    = document.getElementById('lit-section-terms');
            var paymentEl  = document.getElementById('lit-payment-terms');

            function parseSubject() {
                var val = (subjectEl.value || '').trim();
                if (!val) return;
                // Accepts any run of dash-like characters (hyphen, en dash, em dash,
                // horizontal bar, minus sign) or a colon as the separator, so
                // "Poetry Submission - Ada", "— Ada", "-- Ada", ": Ada" all parse.
                var m = val.match(/^\s*(\w+)\s+submission\s*[-‐‑‒–—―−:]+\s*(.+)$/i);
                if (!m) return;
                var slug = SECTION_ALIASES[m[1].toLowerCase()];
                if (slug) {
                    sectionEl.value = slug;
                    updateSectionTerms();
                }
                if (m[2] && !nameEl.value) {
                    nameEl.value = m[2].trim();
                }
            }

            function updateSectionTerms() {
                var terms = SECTION_TERMS[sectionEl.value];
                if (!terms) return;
                termsEl.textContent = terms.fee + ' · Contributor payment: ' + terms.payment;
                paymentEl.textContent = 'This section pays ' + terms.payment + '.';
                if (feeEl) {
                    if (terms.fee.indexOf('No submission fee') === 0) {
                        feeEl.value = 'n_a';
                        feeEl.disabled = true;
                    } else {
                        feeEl.disabled = false;
                        if (feeEl.value === 'n_a') feeEl.value = 'pending';
                    }
                }
            }

            if (subjectEl) {
                subjectEl.addEventListener('blur', parseSubject);
                subjectEl.addEventListener('change', parseSubject);
            }
            if (sectionEl) {
                sectionEl.addEventListener('change', updateSectionTerms);
                updateSectionTerms();
            }
        })();
        </script>
        <?php
    }
}
