<?php
/**
 * Redirect Manager — WP Admin UI + REST endpoint.
 *
 * Stores redirects in wp_options as a JSON array.
 * Next.js middleware reads GET /wp-json/culture/v1/redirects (public)
 * and applies them at the edge on every request, no redeploy needed.
 */

if ( ! defined( 'ABSPATH' ) ) exit;

class Culture_Redirects {

    const OPTION_KEY = 'culture_redirects';
    const NONCE      = 'culture_redirects_nonce';

    public static function init() {
        add_action( 'admin_menu',    [ __CLASS__, 'add_menu'          ] );
        add_action( 'rest_api_init', [ __CLASS__, 'register_rest'     ] );
        add_action( 'admin_post_culture_redirect_save',   [ __CLASS__, 'handle_save'   ] );
        add_action( 'admin_post_culture_redirect_delete', [ __CLASS__, 'handle_delete' ] );
    }

    // ── Storage helpers ───────────────────────────────────────────────────────

    public static function get_all(): array {
        return (array) get_option( self::OPTION_KEY, [] );
    }

    private static function save_all( array $redirects ): void {
        update_option( self::OPTION_KEY, array_values( $redirects ), false );
    }

    // ── REST endpoint — public GET for Next.js middleware ─────────────────────

    public static function register_rest(): void {
        register_rest_route( 'culture/v1', '/redirects', [
            [
                'methods'             => 'GET',
                'callback'            => [ __CLASS__, 'rest_get' ],
                'permission_callback' => '__return_true',
            ],
        ] );
    }

    public static function rest_get(): WP_REST_Response {
        $data = array_map( function( $r ) {
            return [
                'from'      => $r['from'],
                'to'        => $r['to'],
                'permanent' => ! empty( $r['permanent'] ),
            ];
        }, self::get_all() );

        $response = new WP_REST_Response( $data, 200 );
        $response->header( 'Cache-Control', 'public, s-maxage=120, stale-while-revalidate=300' );
        return $response;
    }

    // ── Admin form handlers ───────────────────────────────────────────────────

    public static function handle_save(): void {
        check_admin_referer( self::NONCE );
        if ( ! current_user_can( 'manage_options' ) ) wp_die( 'Forbidden' );

        $from      = '/' . ltrim( untrailingslashit( sanitize_text_field( wp_unslash( $_POST['from'] ?? '' ) ) ), '/' );
        $to        = sanitize_text_field( wp_unslash( $_POST['to']   ?? '' ) );
        $permanent = ! empty( $_POST['permanent'] );
        $note      = sanitize_text_field( wp_unslash( $_POST['note'] ?? '' ) );
        $edit_id   = sanitize_text_field( wp_unslash( $_POST['edit_id'] ?? '' ) );

        if ( ! $from || ! $to ) {
            wp_redirect( add_query_arg( 'error', 'missing', admin_url( 'admin.php?page=culture-redirects' ) ) );
            exit;
        }

        $redirects = self::get_all();

        if ( $edit_id !== '' ) {
            // Update existing entry.
            foreach ( $redirects as &$r ) {
                if ( $r['id'] === $edit_id ) {
                    $r['from']      = $from;
                    $r['to']        = $to;
                    $r['permanent'] = $permanent;
                    $r['note']      = $note;
                    break;
                }
            }
            unset( $r );
        } else {
            // Check for duplicate source.
            foreach ( $redirects as $r ) {
                if ( $r['from'] === $from ) {
                    wp_redirect( add_query_arg( 'error', 'duplicate', admin_url( 'admin.php?page=culture-redirects' ) ) );
                    exit;
                }
            }

            $redirects[] = [
                'id'         => uniqid( 'rdr_', false ),
                'from'       => $from,
                'to'         => $to,
                'permanent'  => $permanent,
                'note'       => $note,
                'hits'       => 0,
                'created_at' => current_time( 'mysql' ),
            ];
        }

        self::save_all( $redirects );
        wp_redirect( add_query_arg( 'saved', '1', admin_url( 'admin.php?page=culture-redirects' ) ) );
        exit;
    }

    public static function handle_delete(): void {
        check_admin_referer( self::NONCE );
        if ( ! current_user_can( 'manage_options' ) ) wp_die( 'Forbidden' );

        $id        = sanitize_text_field( wp_unslash( $_POST['redirect_id'] ?? '' ) );
        $redirects = array_filter( self::get_all(), fn( $r ) => $r['id'] !== $id );

        self::save_all( array_values( $redirects ) );
        wp_redirect( add_query_arg( 'deleted', '1', admin_url( 'admin.php?page=culture-redirects' ) ) );
        exit;
    }

    // ── Admin page UI ─────────────────────────────────────────────────────────

    public static function add_menu(): void {
        add_submenu_page(
            'culture-community',
            'Redirect Manager',
            'Redirects',
            'manage_options',
            'culture-redirects',
            [ __CLASS__, 'render_page' ]
        );
    }

    public static function render_page(): void {
        $redirects = self::get_all();
        $edit      = null;

        if ( ! empty( $_GET['edit'] ) ) {
            $edit_id = sanitize_text_field( wp_unslash( $_GET['edit'] ) );
            foreach ( $redirects as $r ) {
                if ( $r['id'] === $edit_id ) { $edit = $r; break; }
            }
        }

        $saved   = isset( $_GET['saved'] );
        $deleted = isset( $_GET['deleted'] );
        $error   = sanitize_text_field( wp_unslash( $_GET['error'] ?? '' ) );
        ?>
        <div class="wrap">
            <h1>Redirect Manager</h1>
            <p style="color:#666;margin-bottom:20px;">
                Redirects are applied by the Next.js middleware in real-time — no redeploy needed.
                Changes take effect within ~2 minutes (edge cache TTL).
            </p>

            <?php if ( $saved )   : ?><div class="notice notice-success is-dismissible"><p>Redirect saved.</p></div><?php endif; ?>
            <?php if ( $deleted ) : ?><div class="notice notice-success is-dismissible"><p>Redirect deleted.</p></div><?php endif; ?>
            <?php if ( $error === 'duplicate' ) : ?><div class="notice notice-error is-dismissible"><p>A redirect with that source path already exists.</p></div><?php endif; ?>
            <?php if ( $error === 'missing' )   : ?><div class="notice notice-error is-dismissible"><p>From and To fields are required.</p></div><?php endif; ?>

            <!-- Add / Edit Form -->
            <div style="background:#fff;border:1px solid #ccd0d4;padding:24px 28px;max-width:700px;margin-bottom:30px;">
                <h2 style="margin-top:0;"><?php echo $edit ? 'Edit Redirect' : 'Add New Redirect'; ?></h2>
                <form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
                    <?php wp_nonce_field( self::NONCE ); ?>
                    <input type="hidden" name="action"  value="culture_redirect_save">
                    <input type="hidden" name="edit_id" value="<?php echo esc_attr( $edit['id'] ?? '' ); ?>">

                    <table class="form-table" style="margin:0;">
                        <tr>
                            <th style="width:120px;padding:8px 0;">From path</th>
                            <td>
                                <input type="text" name="from" value="<?php echo esc_attr( $edit['from'] ?? '' ); ?>"
                                       placeholder="/old-slug" class="regular-text" required>
                                <p class="description">Exact path on themoveee.com — must start with /</p>
                            </td>
                        </tr>
                        <tr>
                            <th style="padding:8px 0;">To path or URL</th>
                            <td>
                                <input type="text" name="to" value="<?php echo esc_attr( $edit['to'] ?? '' ); ?>"
                                       placeholder="/magazine/new-slug" class="regular-text" required>
                                <p class="description">Can be a relative path or a full URL (for external redirects)</p>
                            </td>
                        </tr>
                        <tr>
                            <th style="padding:8px 0;">Type</th>
                            <td>
                                <label>
                                    <input type="checkbox" name="permanent" value="1"
                                        <?php checked( ! empty( $edit['permanent'] ) ); ?>>
                                    Permanent (308) — use only when you're certain the destination won't change.
                                    Leave unchecked for temporary (307).
                                </label>
                            </td>
                        </tr>
                        <tr>
                            <th style="padding:8px 0;">Note</th>
                            <td>
                                <input type="text" name="note" value="<?php echo esc_attr( $edit['note'] ?? '' ); ?>"
                                       placeholder="e.g. Print campaign short URL" class="regular-text">
                            </td>
                        </tr>
                    </table>

                    <p style="margin-top:16px;">
                        <?php submit_button( $edit ? 'Update Redirect' : 'Add Redirect', 'primary', 'submit', false ); ?>
                        <?php if ( $edit ) : ?>
                            &nbsp;<a href="<?php echo esc_url( admin_url( 'admin.php?page=culture-redirects' ) ); ?>" class="button">Cancel</a>
                        <?php endif; ?>
                    </p>
                </form>
            </div>

            <!-- Redirect Table -->
            <?php if ( empty( $redirects ) ) : ?>
                <p style="color:#666;">No redirects yet. Add one above.</p>
            <?php else : ?>
            <table class="wp-list-table widefat fixed striped" style="max-width:1000px;">
                <thead>
                    <tr>
                        <th style="width:28%;">From</th>
                        <th style="width:28%;">To</th>
                        <th style="width:8%;text-align:center;">Type</th>
                        <th style="width:18%;">Note</th>
                        <th style="width:10%;text-align:center;">Created</th>
                        <th style="width:8%;text-align:center;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                <?php foreach ( $redirects as $r ) : ?>
                    <tr>
                        <td><code style="font-size:12px;"><?php echo esc_html( $r['from'] ); ?></code></td>
                        <td style="word-break:break-all;font-size:13px;"><?php echo esc_html( $r['to'] ); ?></td>
                        <td style="text-align:center;">
                            <?php if ( ! empty( $r['permanent'] ) ) : ?>
                                <span style="color:#0073aa;font-weight:600;">308</span>
                            <?php else : ?>
                                <span style="color:#666;">307</span>
                            <?php endif; ?>
                        </td>
                        <td style="color:#888;font-size:12px;"><?php echo esc_html( $r['note'] ?? '' ); ?></td>
                        <td style="text-align:center;font-size:11px;color:#888;">
                            <?php echo esc_html( substr( $r['created_at'] ?? '', 0, 10 ) ); ?>
                        </td>
                        <td style="text-align:center;">
                            <a href="<?php echo esc_url( add_query_arg( [ 'page' => 'culture-redirects', 'edit' => $r['id'] ], admin_url( 'admin.php' ) ) ); ?>"
                               class="button button-small">Edit</a>
                            &nbsp;
                            <form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>"
                                  style="display:inline;"
                                  onsubmit="return confirm('Delete this redirect?');">
                                <?php wp_nonce_field( self::NONCE ); ?>
                                <input type="hidden" name="action"      value="culture_redirect_delete">
                                <input type="hidden" name="redirect_id" value="<?php echo esc_attr( $r['id'] ); ?>">
                                <button type="submit" class="button button-small"
                                        style="color:#a00;">Delete</button>
                            </form>
                        </td>
                    </tr>
                <?php endforeach; ?>
                </tbody>
            </table>
            <p style="color:#666;font-size:12px;margin-top:8px;">
                REST endpoint: <code><?php echo esc_html( rest_url( 'culture/v1/redirects' ) ); ?></code>
            </p>
            <?php endif; ?>
        </div>
        <?php
    }
}
