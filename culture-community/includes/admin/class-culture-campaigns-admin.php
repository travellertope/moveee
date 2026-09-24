<?php
/**
 * "One-Off Campaigns" admin page — compose and send an email that is not
 * tied to any culture_newsletter/getmelit/culture_drop post at all. See
 * class-culture-campaigns.php for the send/tracking mechanics this drives.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Culture_Campaigns_Admin {

    public static function init() {
        add_action( 'admin_menu', array( __CLASS__, 'register_menu' ) );
        add_action( 'admin_post_culture_campaign_create', array( __CLASS__, 'handle_create' ) );
        add_action( 'admin_post_culture_campaign_update', array( __CLASS__, 'handle_update' ) );
        add_action( 'admin_post_culture_campaign_delete', array( __CLASS__, 'handle_delete' ) );
        add_action( 'admin_post_culture_campaign_send',   array( __CLASS__, 'handle_send' ) );
        add_action( 'admin_post_culture_campaign_test',   array( __CLASS__, 'handle_send_test' ) );

        if ( function_exists( 'wp_enqueue_editor' ) ) {
            add_action( 'admin_enqueue_scripts', array( __CLASS__, 'maybe_enqueue_editor' ) );
        }
    }

    public static function maybe_enqueue_editor( $hook ) {
        // Hook suffix is derived from the parent menu slug — Campaigns is
        // parented under the "Moveee Newsletters" top-level menu (anchor
        // slug `culture-subscribers`, see class-culture-subscribers.php),
        // not `culture-community`, since the September 2026 menu split.
        if ( 'culture-subscribers_page_culture-campaigns' === $hook ) {
            wp_enqueue_editor();
        }
    }

    public static function register_menu() {
        add_submenu_page(
            'culture-subscribers',
            __( 'One-Off Campaigns', 'culture-community' ),
            __( 'Campaigns', 'culture-community' ),
            'manage_options',
            'culture-campaigns',
            array( __CLASS__, 'render_page' )
        );
    }

    public static function render_page() {
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( esc_html__( 'Permission denied.', 'culture-community' ) );
        }

        $notice = '';
        if ( isset( $_GET['created'] ) ) {
            $notice = __( 'Campaign saved as a draft.', 'culture-community' );
        } elseif ( isset( $_GET['updated'] ) ) {
            $notice = __( 'Campaign updated.', 'culture-community' );
        } elseif ( isset( $_GET['deleted'] ) ) {
            $notice = __( 'Campaign deleted.', 'culture-community' );
        } elseif ( isset( $_GET['sent'] ) ) {
            $notice = sprintf( __( 'Campaign is sending to %s recipients.', 'culture-community' ), number_format( absint( $_GET['sent'] ) ) );
        } elseif ( isset( $_GET['tested'] ) ) {
            $notice = __( 'Test email sent.', 'culture-community' );
        }
        $error = isset( $_GET['error'] ) ? sanitize_text_field( wp_unslash( $_GET['error'] ) ) : '';

        $editing_id = absint( $_GET['edit'] ?? 0 );
        $editing    = $editing_id ? Culture_Campaigns::get( $editing_id ) : null;

        $lists = Culture_Newsletter_Lists::get_all();
        ?>
        <div class="wrap">
            <h1 class="wp-heading-inline"><?php esc_html_e( 'One-Off Campaigns', 'culture-community' ); ?></h1>
            <a href="<?php echo esc_url( admin_url( 'admin.php?page=culture-subscribers' ) ); ?>" class="page-title-action">
                <?php esc_html_e( 'Subscribers', 'culture-community' ); ?>
            </a>
            <a href="<?php echo esc_url( admin_url( 'admin.php?page=culture-newsletter-lists' ) ); ?>" class="page-title-action">
                <?php esc_html_e( 'Lists & Segments', 'culture-community' ); ?>
            </a>
            <hr class="wp-header-end">

            <p style="max-width:640px;color:#646970;">
                <?php esc_html_e( 'A campaign is a single send to one or more lists — it has no frontend archive page and is not a GetMeLit or Culture Drop issue. Use this for announcements, promotions, or a one-time message to a Hub without publishing an issue.', 'culture-community' ); ?>
            </p>

            <?php if ( $notice ) : ?>
                <div class="notice notice-success is-dismissible"><p><?php echo esc_html( $notice ); ?></p></div>
            <?php endif; ?>
            <?php if ( $error ) : ?>
                <div class="notice notice-error is-dismissible"><p><?php echo esc_html( $error ); ?></p></div>
            <?php endif; ?>

            <div style="background:#fff;border:1px solid #c3c4c7;border-radius:4px;padding:20px 24px;max-width:760px;margin:20px 0 32px;">
                <h2 style="margin:0 0 14px;font-size:14px;font-weight:600;">
                    <?php echo $editing ? esc_html__( 'Edit Draft Campaign', 'culture-community' ) : esc_html__( 'New Campaign', 'culture-community' ); ?>
                </h2>

                <?php if ( $editing && Culture_Campaigns::STATUS_DRAFT !== $editing['status'] ) : ?>
                    <p style="color:#b32d2e;font-size:13px;">
                        <?php esc_html_e( 'This campaign has already been sent or is currently sending and can no longer be edited.', 'culture-community' ); ?>
                    </p>
                <?php else : ?>
                <form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
                    <input type="hidden" name="action" value="<?php echo $editing ? 'culture_campaign_update' : 'culture_campaign_create'; ?>">
                    <?php wp_nonce_field( $editing ? 'culture_campaign_update' : 'culture_campaign_create' ); ?>
                    <?php if ( $editing ) : ?>
                        <input type="hidden" name="id" value="<?php echo esc_attr( $editing['id'] ); ?>">
                    <?php endif; ?>

                    <p>
                        <label style="display:block;font-size:11px;font-weight:600;text-transform:uppercase;margin-bottom:4px;">
                            <?php esc_html_e( 'Subject', 'culture-community' ); ?>
                        </label>
                        <input type="text" name="subject" class="large-text" required value="<?php echo esc_attr( $editing['subject'] ?? '' ); ?>">
                    </p>

                    <p>
                        <label style="display:block;font-size:11px;font-weight:600;text-transform:uppercase;margin-bottom:4px;">
                            <?php esc_html_e( 'Send to', 'culture-community' ); ?>
                        </label>
                        <?php foreach ( $lists as $list ) : ?>
                            <label style="display:inline-flex;align-items:center;gap:6px;margin-right:16px;margin-bottom:6px;">
                                <input type="checkbox" name="list_ids[]" value="<?php echo esc_attr( $list['id'] ); ?>"
                                    <?php checked( $editing && in_array( $list['id'], $editing['listIds'], true ) ); ?>>
                                <?php echo esc_html( $list['name'] ); ?>
                                (<?php echo esc_html( number_format( Culture_Newsletter_Lists::subscriber_count( $list['id'] ) ) ); ?>)
                            </label>
                        <?php endforeach; ?>
                    </p>

                    <p>
                        <label style="display:block;font-size:11px;font-weight:600;text-transform:uppercase;margin-bottom:4px;">
                            <?php esc_html_e( 'Body', 'culture-community' ); ?>
                        </label>
                        <?php
                        wp_editor(
                            $editing['body'] ?? '',
                            'campaign_body',
                            array(
                                'textarea_name' => 'body',
                                'media_buttons' => true,
                                'textarea_rows' => 14,
                                'teeny'         => false,
                            )
                        );
                        ?>
                    </p>

                    <button type="submit" class="button button-primary">
                        <?php echo $editing ? esc_html__( 'Save Draft', 'culture-community' ) : esc_html__( 'Create Draft', 'culture-community' ); ?>
                    </button>
                </form>
                <?php endif; ?>
            </div>

            <table class="wp-list-table widefat fixed striped">
                <thead>
                    <tr>
                        <th scope="col"><?php esc_html_e( 'Subject', 'culture-community' ); ?></th>
                        <th scope="col" style="width:180px;"><?php esc_html_e( 'Lists', 'culture-community' ); ?></th>
                        <th scope="col" style="width:100px;"><?php esc_html_e( 'Status', 'culture-community' ); ?></th>
                        <th scope="col" style="width:110px;"><?php esc_html_e( 'Progress', 'culture-community' ); ?></th>
                        <th scope="col" style="width:260px;"><?php esc_html_e( 'Actions', 'culture-community' ); ?></th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ( Culture_Campaigns::all() as $c ) : ?>
                        <tr>
                            <td><strong><?php echo esc_html( $c['subject'] ); ?></strong></td>
                            <td>
                                <?php
                                $names = array();
                                foreach ( $c['listIds'] as $lid ) {
                                    $l = Culture_Newsletter_Lists::get( $lid );
                                    if ( $l ) {
                                        $names[] = $l['name'];
                                    }
                                }
                                echo esc_html( implode( ', ', $names ) );
                                ?>
                            </td>
                            <td><?php echo esc_html( ucfirst( $c['status'] ) ); ?></td>
                            <td>
                                <?php if ( Culture_Campaigns::STATUS_SENT === $c['status'] ) : ?>
                                    <?php echo esc_html( number_format( $c['sendTotal'] ) ); ?>
                                <?php elseif ( Culture_Campaigns::STATUS_SENDING === $c['status'] ) : ?>
                                    <?php echo esc_html( $c['sendOffset'] . ' / ' . $c['sendTotal'] . ' (' . $c['percent'] . '%)' ); ?>
                                <?php else : ?>
                                    —
                                <?php endif; ?>
                            </td>
                            <td>
                                <div style="display:flex;gap:6px;flex-wrap:wrap;">
                                    <?php if ( Culture_Campaigns::STATUS_DRAFT === $c['status'] ) : ?>
                                        <a href="<?php echo esc_url( add_query_arg( array( 'page' => 'culture-campaigns', 'edit' => $c['id'] ), admin_url( 'admin.php' ) ) ); ?>" class="button button-small">
                                            <?php esc_html_e( 'Edit', 'culture-community' ); ?>
                                        </a>
                                        <form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" style="display:inline-flex;gap:4px;align-items:center;">
                                            <input type="hidden" name="action" value="culture_campaign_test">
                                            <input type="hidden" name="id" value="<?php echo esc_attr( $c['id'] ); ?>">
                                            <?php wp_nonce_field( 'culture_campaign_test' ); ?>
                                            <input type="email" name="test_email" placeholder="<?php esc_attr_e( 'you@email.com', 'culture-community' ); ?>" required style="width:150px;font-size:12px;">
                                            <button type="submit" class="button button-small"><?php esc_html_e( 'Send Test', 'culture-community' ); ?></button>
                                        </form>
                                        <form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" onsubmit="return confirm('<?php echo esc_js( __( 'Send this campaign now? This cannot be undone.', 'culture-community' ) ); ?>')">
                                            <input type="hidden" name="action" value="culture_campaign_send">
                                            <input type="hidden" name="id" value="<?php echo esc_attr( $c['id'] ); ?>">
                                            <?php wp_nonce_field( 'culture_campaign_send' ); ?>
                                            <button type="submit" class="button button-small button-primary"><?php esc_html_e( 'Send Now', 'culture-community' ); ?></button>
                                        </form>
                                        <form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" onsubmit="return confirm('<?php echo esc_js( __( 'Delete this draft campaign?', 'culture-community' ) ); ?>')">
                                            <input type="hidden" name="action" value="culture_campaign_delete">
                                            <input type="hidden" name="id" value="<?php echo esc_attr( $c['id'] ); ?>">
                                            <?php wp_nonce_field( 'culture_campaign_delete' ); ?>
                                            <button type="submit" class="button button-small button-link-delete"><?php esc_html_e( 'Delete', 'culture-community' ); ?></button>
                                        </form>
                                    <?php endif; ?>
                                </div>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
        <?php
    }

    public static function handle_create() {
        check_admin_referer( 'culture_campaign_create' );
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( esc_html__( 'Permission denied.', 'culture-community' ) );
        }

        $result = Culture_Campaigns::create( array(
            'subject'  => wp_unslash( $_POST['subject'] ?? '' ),
            'body'     => wp_unslash( $_POST['body'] ?? '' ),
            'list_ids' => $_POST['list_ids'] ?? array(),
        ), get_current_user_id() );

        if ( is_wp_error( $result ) ) {
            wp_safe_redirect( add_query_arg( array( 'page' => 'culture-campaigns', 'error' => rawurlencode( $result->get_error_message() ) ), admin_url( 'admin.php' ) ) );
            exit;
        }

        wp_safe_redirect( add_query_arg( array( 'page' => 'culture-campaigns', 'created' => '1' ), admin_url( 'admin.php' ) ) );
        exit;
    }

    public static function handle_update() {
        check_admin_referer( 'culture_campaign_update' );
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( esc_html__( 'Permission denied.', 'culture-community' ) );
        }

        $id     = absint( $_POST['id'] ?? 0 );
        $result = Culture_Campaigns::update( $id, array(
            'subject'  => wp_unslash( $_POST['subject'] ?? '' ),
            'body'     => wp_unslash( $_POST['body'] ?? '' ),
            'list_ids' => $_POST['list_ids'] ?? array(),
        ) );

        if ( is_wp_error( $result ) ) {
            wp_safe_redirect( add_query_arg( array( 'page' => 'culture-campaigns', 'edit' => $id, 'error' => rawurlencode( $result->get_error_message() ) ), admin_url( 'admin.php' ) ) );
            exit;
        }

        wp_safe_redirect( add_query_arg( array( 'page' => 'culture-campaigns', 'updated' => '1' ), admin_url( 'admin.php' ) ) );
        exit;
    }

    public static function handle_delete() {
        check_admin_referer( 'culture_campaign_delete' );
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( esc_html__( 'Permission denied.', 'culture-community' ) );
        }

        $result = Culture_Campaigns::delete( absint( $_POST['id'] ?? 0 ) );
        if ( is_wp_error( $result ) ) {
            wp_safe_redirect( add_query_arg( array( 'page' => 'culture-campaigns', 'error' => rawurlencode( $result->get_error_message() ) ), admin_url( 'admin.php' ) ) );
            exit;
        }

        wp_safe_redirect( add_query_arg( array( 'page' => 'culture-campaigns', 'deleted' => '1' ), admin_url( 'admin.php' ) ) );
        exit;
    }

    public static function handle_send() {
        check_admin_referer( 'culture_campaign_send' );
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( esc_html__( 'Permission denied.', 'culture-community' ) );
        }

        $result = Culture_Campaigns::send( absint( $_POST['id'] ?? 0 ) );
        if ( is_wp_error( $result ) ) {
            wp_safe_redirect( add_query_arg( array( 'page' => 'culture-campaigns', 'error' => rawurlencode( $result->get_error_message() ) ), admin_url( 'admin.php' ) ) );
            exit;
        }

        wp_safe_redirect( add_query_arg( array( 'page' => 'culture-campaigns', 'sent' => $result ), admin_url( 'admin.php' ) ) );
        exit;
    }

    public static function handle_send_test() {
        check_admin_referer( 'culture_campaign_test' );
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( esc_html__( 'Permission denied.', 'culture-community' ) );
        }

        Culture_Campaigns::send_test( absint( $_POST['id'] ?? 0 ), sanitize_email( $_POST['test_email'] ?? '' ) );

        wp_safe_redirect( add_query_arg( array( 'page' => 'culture-campaigns', 'tested' => '1' ), admin_url( 'admin.php' ) ) );
        exit;
    }
}
