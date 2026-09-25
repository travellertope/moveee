<?php
/**
 * "Newsletter Lists & Segments" admin page — the create/edit/delete UI for
 * Culture_Newsletter_Lists' registry. This is what makes segments a
 * first-class, admin-manageable thing rather than a hardcoded PHP constant:
 * an admin can create a new content list, a new region, or delete/rename an
 * existing one here, and every place in the plugin that used to read
 * LIST_OPTIONS/SEGMENT_OPTIONS (the subscriber page, the Send Newsletter
 * meta box, the subscribe REST endpoint, Campaigns) picks it up immediately.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Culture_Newsletter_Lists_Admin {

    public static function init() {
        add_action( 'admin_menu', array( __CLASS__, 'register_menu' ) );
        add_action( 'admin_post_culture_nl_list_create', array( __CLASS__, 'handle_create' ) );
        add_action( 'admin_post_culture_nl_list_update', array( __CLASS__, 'handle_update' ) );
        add_action( 'admin_post_culture_nl_list_delete', array( __CLASS__, 'handle_delete' ) );
    }

    public static function register_menu() {
        add_submenu_page(
            'culture-subscribers',
            __( 'Newsletter Lists & Segments', 'culture-community' ),
            __( 'Lists & Segments', 'culture-community' ),
            'manage_options',
            'culture-newsletter-lists',
            array( __CLASS__, 'render_page' )
        );
    }

    public static function render_page() {
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( esc_html__( 'Permission denied.', 'culture-community' ) );
        }

        $notice = '';
        if ( isset( $_GET['created'] ) ) {
            $notice = __( 'List created.', 'culture-community' );
        } elseif ( isset( $_GET['updated'] ) ) {
            $notice = __( 'List updated.', 'culture-community' );
        } elseif ( isset( $_GET['deleted'] ) ) {
            $notice = __( 'List deleted.', 'culture-community' );
        }
        $error = isset( $_GET['error'] ) ? sanitize_text_field( wp_unslash( $_GET['error'] ) ) : '';

        $editing_id = absint( $_GET['edit'] ?? 0 );
        $editing    = $editing_id ? Culture_Newsletter_Lists::get( $editing_id ) : null;

        $lists = Culture_Newsletter_Lists::get_all();
        ?>
        <div class="wrap">
            <h1 class="wp-heading-inline"><?php esc_html_e( 'Newsletter Lists & Segments', 'culture-community' ); ?></h1>
            <a href="<?php echo esc_url( admin_url( 'admin.php?page=culture-subscribers' ) ); ?>" class="page-title-action">
                <?php esc_html_e( 'Subscribers', 'culture-community' ); ?>
            </a>
            <a href="<?php echo esc_url( admin_url( 'admin.php?page=culture-campaigns' ) ); ?>" class="page-title-action">
                <?php esc_html_e( 'One-Off Campaigns', 'culture-community' ); ?>
            </a>
            <hr class="wp-header-end">

            <p style="max-width:640px;color:#646970;">
                <?php esc_html_e( 'A "content" list is a real newsletter subscribers opt into (GetMeLit, Culture Drop, a Hub, a custom list). A "region" segment narrows a send by geography and is applied alongside a content list, not instead of it. A "system" list is hidden from the public archive and preferences UI (e.g. Announcements).', 'culture-community' ); ?>
            </p>

            <?php if ( $notice ) : ?>
                <div class="notice notice-success is-dismissible"><p><?php echo esc_html( $notice ); ?></p></div>
            <?php endif; ?>
            <?php if ( $error ) : ?>
                <div class="notice notice-error is-dismissible"><p><?php echo esc_html( $error ); ?></p></div>
            <?php endif; ?>

            <div style="background:#fff;border:1px solid #c3c4c7;border-radius:4px;padding:20px 24px;max-width:600px;margin:20px 0 32px;">
                <h2 style="margin:0 0 14px;font-size:14px;font-weight:600;">
                    <?php echo $editing ? esc_html__( 'Edit List', 'culture-community' ) : esc_html__( 'Create a New List / Segment', 'culture-community' ); ?>
                </h2>
                <form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>">
                    <input type="hidden" name="action" value="<?php echo $editing ? 'culture_nl_list_update' : 'culture_nl_list_create'; ?>">
                    <?php wp_nonce_field( $editing ? 'culture_nl_list_update' : 'culture_nl_list_create' ); ?>
                    <?php if ( $editing ) : ?>
                        <input type="hidden" name="id" value="<?php echo esc_attr( $editing['id'] ); ?>">
                    <?php endif; ?>

                    <table class="form-table" style="margin:0;">
                        <tr>
                            <th style="padding:8px 16px 8px 0;font-size:13px;width:120px;"><?php esc_html_e( 'Name', 'culture-community' ); ?></th>
                            <td><input type="text" name="name" class="regular-text" required value="<?php echo esc_attr( $editing['name'] ?? '' ); ?>"></td>
                        </tr>
                        <tr>
                            <th style="padding:8px 16px 8px 0;font-size:13px;"><?php esc_html_e( 'Slug', 'culture-community' ); ?></th>
                            <td>
                                <input type="text" name="slug" class="regular-text" placeholder="<?php esc_attr_e( 'auto-generated from name if left blank', 'culture-community' ); ?>" value="<?php echo esc_attr( $editing['slug'] ?? '' ); ?>">
                                <?php if ( $editing && $editing['sourceType'] ) : ?>
                                    <p style="font-size:11px;color:#b32d2e;margin:4px 0 0;">
                                        <?php esc_html_e( 'Auto-linked to a Hub — renaming the slug will not relink it.', 'culture-community' ); ?>
                                    </p>
                                <?php endif; ?>
                            </td>
                        </tr>
                        <tr>
                            <th style="padding:8px 16px 8px 0;font-size:13px;"><?php esc_html_e( 'Description', 'culture-community' ); ?></th>
                            <td><textarea name="description" class="large-text" rows="2"><?php echo esc_textarea( $editing['description'] ?? '' ); ?></textarea></td>
                        </tr>
                        <?php if ( ! $editing ) : ?>
                        <tr>
                            <th style="padding:8px 16px 8px 0;font-size:13px;"><?php esc_html_e( 'Type', 'culture-community' ); ?></th>
                            <td>
                                <select name="type">
                                    <option value="content"><?php esc_html_e( 'Content — a real newsletter/list', 'culture-community' ); ?></option>
                                    <option value="region"><?php esc_html_e( 'Region — a geographic segment', 'culture-community' ); ?></option>
                                    <option value="system"><?php esc_html_e( 'System — hidden, opt-out', 'culture-community' ); ?></option>
                                </select>
                            </td>
                        </tr>
                        <?php else : ?>
                            <input type="hidden" name="type" value="<?php echo esc_attr( $editing['type'] ); ?>">
                        <?php endif; ?>
                        <tr>
                            <th style="padding:8px 16px 8px 0;font-size:13px;"><?php esc_html_e( 'Visibility', 'culture-community' ); ?></th>
                            <td>
                                <select name="visibility">
                                    <option value="public" <?php selected( ( $editing['visibility'] ?? 'public' ), 'public' ); ?>><?php esc_html_e( 'Public — shown on /newsletter and preferences', 'culture-community' ); ?></option>
                                    <option value="hidden" <?php selected( ( $editing['visibility'] ?? '' ), 'hidden' ); ?>><?php esc_html_e( 'Hidden', 'culture-community' ); ?></option>
                                </select>
                            </td>
                        </tr>
                        <tr>
                            <th style="padding:8px 16px 8px 0;font-size:13px;"><?php esc_html_e( 'Default subscribed', 'culture-community' ); ?></th>
                            <td>
                                <label>
                                    <input type="checkbox" name="default_subscribed" value="1" <?php checked( ! empty( $editing['defaultSubscribed'] ) ); ?>>
                                    <?php esc_html_e( 'Every new subscriber joins this list automatically (opt-out model, like Announcements).', 'culture-community' ); ?>
                                </label>
                            </td>
                        </tr>
                    </table>

                    <div style="margin-top:16px;display:flex;gap:10px;">
                        <button type="submit" class="button button-primary">
                            <?php echo $editing ? esc_html__( 'Save Changes', 'culture-community' ) : esc_html__( 'Create List', 'culture-community' ); ?>
                        </button>
                        <?php if ( $editing ) : ?>
                            <a href="<?php echo esc_url( admin_url( 'admin.php?page=culture-newsletter-lists' ) ); ?>" class="button button-secondary">
                                <?php esc_html_e( 'Cancel', 'culture-community' ); ?>
                            </a>
                        <?php endif; ?>
                    </div>
                </form>
            </div>

            <table class="wp-list-table widefat fixed striped">
                <thead>
                    <tr>
                        <th scope="col"><?php esc_html_e( 'Name', 'culture-community' ); ?></th>
                        <th scope="col" style="width:140px;"><?php esc_html_e( 'Slug', 'culture-community' ); ?></th>
                        <th scope="col" style="width:90px;"><?php esc_html_e( 'Type', 'culture-community' ); ?></th>
                        <th scope="col" style="width:90px;"><?php esc_html_e( 'Visibility', 'culture-community' ); ?></th>
                        <th scope="col" style="width:110px;"><?php esc_html_e( 'Subscribers', 'culture-community' ); ?></th>
                        <th scope="col" style="width:150px;"><?php esc_html_e( 'Actions', 'culture-community' ); ?></th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ( $lists as $list ) : ?>
                        <tr>
                            <td>
                                <strong><?php echo esc_html( $list['name'] ); ?></strong>
                                <?php if ( 'hub' === $list['sourceType'] ) : ?>
                                    <span style="font-size:10px;color:#7a6f5c;display:block;">
                                        <?php esc_html_e( 'Auto-linked to a Hub', 'culture-community' ); ?>
                                    </span>
                                <?php endif; ?>
                            </td>
                            <td><code><?php echo esc_html( $list['slug'] ); ?></code></td>
                            <td><?php echo esc_html( ucfirst( $list['type'] ) ); ?></td>
                            <td><?php echo esc_html( ucfirst( $list['visibility'] ) ); ?></td>
                            <td><?php echo esc_html( number_format( Culture_Newsletter_Lists::subscriber_count( $list['id'] ) ) ); ?></td>
                            <td>
                                <div style="display:flex;gap:6px;">
                                    <a href="<?php echo esc_url( add_query_arg( array( 'page' => 'culture-newsletter-lists', 'edit' => $list['id'] ), admin_url( 'admin.php' ) ) ); ?>" class="button button-small">
                                        <?php esc_html_e( 'Edit', 'culture-community' ); ?>
                                    </a>
                                    <form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" onsubmit="return confirm('<?php echo esc_js( __( 'Delete this list? Subscriber memberships in it will be removed; subscriber records themselves are kept.', 'culture-community' ) ); ?>')">
                                        <input type="hidden" name="action" value="culture_nl_list_delete">
                                        <input type="hidden" name="id" value="<?php echo esc_attr( $list['id'] ); ?>">
                                        <?php wp_nonce_field( 'culture_nl_list_delete' ); ?>
                                        <button type="submit" class="button button-small button-link-delete">
                                            <?php esc_html_e( 'Delete', 'culture-community' ); ?>
                                        </button>
                                    </form>
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
        check_admin_referer( 'culture_nl_list_create' );
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( esc_html__( 'Permission denied.', 'culture-community' ) );
        }

        $result = Culture_Newsletter_Lists::create( array(
            'name'               => $_POST['name'] ?? '',
            'slug'               => $_POST['slug'] ?? '',
            'description'        => $_POST['description'] ?? '',
            'type'               => $_POST['type'] ?? 'content',
            'visibility'         => $_POST['visibility'] ?? 'public',
            'default_subscribed' => ! empty( $_POST['default_subscribed'] ),
        ) );

        if ( is_wp_error( $result ) ) {
            wp_safe_redirect( add_query_arg( array( 'page' => 'culture-newsletter-lists', 'error' => rawurlencode( $result->get_error_message() ) ), admin_url( 'admin.php' ) ) );
            exit;
        }

        wp_safe_redirect( add_query_arg( array( 'page' => 'culture-newsletter-lists', 'created' => '1' ), admin_url( 'admin.php' ) ) );
        exit;
    }

    public static function handle_update() {
        check_admin_referer( 'culture_nl_list_update' );
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( esc_html__( 'Permission denied.', 'culture-community' ) );
        }

        $id     = absint( $_POST['id'] ?? 0 );
        $result = Culture_Newsletter_Lists::update( $id, array(
            'name'               => $_POST['name'] ?? '',
            'slug'               => $_POST['slug'] ?? '',
            'description'        => $_POST['description'] ?? '',
            'visibility'         => $_POST['visibility'] ?? 'public',
            'default_subscribed' => ! empty( $_POST['default_subscribed'] ),
        ) );

        if ( is_wp_error( $result ) ) {
            wp_safe_redirect( add_query_arg( array( 'page' => 'culture-newsletter-lists', 'edit' => $id, 'error' => rawurlencode( $result->get_error_message() ) ), admin_url( 'admin.php' ) ) );
            exit;
        }

        wp_safe_redirect( add_query_arg( array( 'page' => 'culture-newsletter-lists', 'updated' => '1' ), admin_url( 'admin.php' ) ) );
        exit;
    }

    public static function handle_delete() {
        check_admin_referer( 'culture_nl_list_delete' );
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( esc_html__( 'Permission denied.', 'culture-community' ) );
        }

        Culture_Newsletter_Lists::delete( absint( $_POST['id'] ?? 0 ) );

        wp_safe_redirect( add_query_arg( array( 'page' => 'culture-newsletter-lists', 'deleted' => '1' ), admin_url( 'admin.php' ) ) );
        exit;
    }
}
