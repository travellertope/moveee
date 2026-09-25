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

        add_action( 'admin_enqueue_scripts', array( __CLASS__, 'maybe_enqueue_editor' ) );
    }

    public static function maybe_enqueue_editor( $hook ) {
        // Hook suffix is derived from the parent menu slug — Campaigns is
        // parented under the "Moveee Newsletters" top-level menu (anchor
        // slug `culture-subscribers`, see class-culture-subscribers.php),
        // not `culture-community`, since the September 2026 menu split.
        if ( 'culture-subscribers_page_culture-campaigns' !== $hook ) {
            return;
        }
        if ( function_exists( 'wp_enqueue_editor' ) ) {
            wp_enqueue_editor();
        }
        wp_add_inline_style( 'wp-admin', self::multiselect_css() );
        // Attached to 'jquery-core' purely as a reliably-always-enqueued
        // handle to hang an inline <script> off — the multiselect JS itself
        // is plain vanilla JS with no jQuery dependency.
        wp_enqueue_script( 'jquery' );
        wp_add_inline_script( 'jquery-core', self::multiselect_js() );
    }

    /**
     * CSS for the searchable multi-select "Send to" control
     * (see render_list_multiselect()) — inlined via wp_add_inline_style
     * rather than a separate .css file, same convention as every other
     * hand-rolled admin page in this plugin (e.g. Culture_Directory_Tools).
     */
    private static function multiselect_css() {
        return '
            .culture-ms { position: relative; max-width: 520px; }
            .culture-ms-select { display: none; }
            .culture-ms-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 6px; }
            .culture-ms-tags:empty { display: none; }
            .culture-ms-tag {
                display: inline-flex; align-items: center; gap: 6px;
                background: #f0f0f1; border: 1px solid #c3c4c7; border-radius: 3px;
                padding: 3px 6px 3px 10px; font-size: 12px; line-height: 1.4;
            }
            .culture-ms-tag-remove {
                cursor: pointer; border: none; background: none; padding: 0 2px;
                font-size: 14px; line-height: 1; color: #646970;
            }
            .culture-ms-tag-remove:hover { color: #b32d2e; }
            .culture-ms-input {
                width: 100%; box-sizing: border-box; padding: 6px 8px;
                border: 1px solid #8c8f94; border-radius: 4px; font-size: 13px;
            }
            .culture-ms-dropdown {
                position: absolute; z-index: 10; top: 100%; left: 0; right: 0;
                max-height: 260px; overflow-y: auto; margin-top: 2px;
                background: #fff; border: 1px solid #c3c4c7; border-radius: 4px;
                box-shadow: 0 2px 6px rgba(0,0,0,.12);
            }
            .culture-ms-option {
                display: flex; align-items: center; justify-content: space-between;
                gap: 8px; padding: 7px 10px; font-size: 13px; cursor: pointer;
            }
            .culture-ms-option:hover, .culture-ms-option.is-active { background: #f0f6fc; }
            .culture-ms-option.is-selected { background: #f0f0f1; }
            .culture-ms-option-count { color: #646970; font-size: 11px; white-space: nowrap; }
            .culture-ms-empty { padding: 10px; font-size: 12px; color: #646970; }
        ';
    }

    /**
     * Vanilla JS (no jQuery UI / select2 dependency) turning the plain
     * <select multiple> from render_list_multiselect() into a type-to-filter
     * combobox with removable tag pills — chosen since the list registry can
     * grow into the hundreds and a checkbox-per-list layout stops scaling
     * long before that (September 2026). The underlying <select> stays the
     * real source of truth / form field, so nothing about how this page
     * submits list_ids[] changed.
     */
    private static function multiselect_js() {
        return '
        (function() {
            function init(root) {
                var select   = root.querySelector("[data-culture-ms-select]");
                var input    = root.querySelector("[data-culture-ms-input]");
                var dropdown = root.querySelector("[data-culture-ms-dropdown]");
                var tagsWrap = root.querySelector("[data-culture-ms-tags]");
                if (!select || !input || !dropdown || !tagsWrap) return;

                var options = Array.prototype.slice.call(select.options);
                var activeIndex = -1;

                function renderTags() {
                    tagsWrap.innerHTML = "";
                    options.forEach(function(opt) {
                        if (!opt.selected) return;
                        var tag = document.createElement("span");
                        tag.className = "culture-ms-tag";
                        var label = document.createElement("span");
                        label.textContent = opt.textContent;
                        var remove = document.createElement("button");
                        remove.type = "button";
                        remove.className = "culture-ms-tag-remove";
                        remove.setAttribute("aria-label", "Remove");
                        remove.textContent = "\\u00d7";
                        remove.addEventListener("click", function() {
                            opt.selected = false;
                            renderTags();
                            renderDropdown();
                        });
                        tag.appendChild(label);
                        tag.appendChild(remove);
                        tagsWrap.appendChild(tag);
                    });
                }

                function renderDropdown() {
                    var query = input.value.trim().toLowerCase();
                    var visible = options.filter(function(opt) {
                        return opt.textContent.toLowerCase().indexOf(query) !== -1;
                    });
                    dropdown.innerHTML = "";
                    if (visible.length === 0) {
                        var empty = document.createElement("div");
                        empty.className = "culture-ms-empty";
                        empty.textContent = "No matching lists.";
                        dropdown.appendChild(empty);
                        activeIndex = -1;
                        return;
                    }
                    visible.forEach(function(opt, i) {
                        var row = document.createElement("div");
                        row.className = "culture-ms-option" + (opt.selected ? " is-selected" : "") + (i === activeIndex ? " is-active" : "");
                        row.dataset.value = opt.value;
                        var label = document.createElement("span");
                        label.textContent = (opt.selected ? "\\u2713 " : "") + opt.textContent;
                        row.appendChild(label);
                        if (opt.dataset.count) {
                            var count = document.createElement("span");
                            count.className = "culture-ms-option-count";
                            count.textContent = "(" + opt.dataset.count + ")";
                            row.appendChild(count);
                        }
                        row.addEventListener("mousedown", function(e) {
                            // mousedown (not click) so this fires before the
                            // input\'s blur handler closes the dropdown.
                            e.preventDefault();
                            opt.selected = !opt.selected;
                            renderTags();
                            renderDropdown();
                        });
                        dropdown.appendChild(row);
                    });
                }

                function openDropdown() {
                    dropdown.hidden = false;
                    renderDropdown();
                }
                function closeDropdown() {
                    dropdown.hidden = true;
                    activeIndex = -1;
                }

                input.addEventListener("focus", openDropdown);
                input.addEventListener("input", openDropdown);
                input.addEventListener("blur", function() {
                    // Delay so a mousedown on a dropdown row (which is not a
                    // click yet) still registers before we hide it.
                    setTimeout(closeDropdown, 120);
                });
                input.addEventListener("keydown", function(e) {
                    var rows = dropdown.querySelectorAll(".culture-ms-option");
                    if (e.key === "ArrowDown") {
                        e.preventDefault();
                        if (dropdown.hidden) { openDropdown(); return; }
                        activeIndex = Math.min(activeIndex + 1, rows.length - 1);
                        renderDropdown();
                    } else if (e.key === "ArrowUp") {
                        e.preventDefault();
                        activeIndex = Math.max(activeIndex - 1, 0);
                        renderDropdown();
                    } else if (e.key === "Enter") {
                        if (!dropdown.hidden && activeIndex > -1) {
                            e.preventDefault();
                            var rows2 = dropdown.querySelectorAll(".culture-ms-option");
                            var row = rows2[activeIndex];
                            if (row) {
                                var opt = options.filter(function(o) { return o.value === row.dataset.value; })[0];
                                if (opt) {
                                    opt.selected = !opt.selected;
                                    renderTags();
                                    renderDropdown();
                                }
                            }
                        }
                    } else if (e.key === "Escape") {
                        closeDropdown();
                    }
                });

                renderTags();
            }

            function ready(fn) {
                if (document.readyState !== "loading") fn();
                else document.addEventListener("DOMContentLoaded", fn);
            }

            ready(function() {
                var roots = document.querySelectorAll("[data-culture-ms]");
                for (var i = 0; i < roots.length; i++) init(roots[i]);
            });
        })();
        ';
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
                        <?php
                        // Searchable multi-select — a checkbox row per list stopped
                        // scaling once the list registry grew past a couple dozen
                        // entries (September 2026). Real <select multiple> underneath
                        // (kept as the actual form field / source of truth, so this
                        // degrades to a native multi-select with JS disabled) is
                        // progressively enhanced by culture-ms.js below into a
                        // type-to-filter combobox with removable tag pills.
                        self::render_list_multiselect( $lists, $editing ? $editing['listIds'] : array() );
                        ?>
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

    /**
     * Renders a real <select multiple> (the actual form field WordPress
     * submits `list_ids[]` from) plus a wrapping search-and-tag UI that
     * `culture-ms.js` progressively enhances it into. No JS library — hand
     * rolled vanilla JS, consistent with every other admin page in this
     * plugin. Falls back to a plain native multi-select box if JS is
     * disabled, since the <select> itself is never hidden by PHP.
     *
     * @param array $lists         Full list registry (Culture_Newsletter_Lists::get_all()).
     * @param array $selected_ids  List IDs already selected (editing an existing campaign).
     */
    private static function render_list_multiselect( array $lists, array $selected_ids ) {
        ?>
        <div class="culture-ms" data-culture-ms>
            <div class="culture-ms-tags" data-culture-ms-tags></div>
            <input
                type="text"
                class="culture-ms-input"
                data-culture-ms-input
                autocomplete="off"
                placeholder="<?php esc_attr_e( 'Search lists by name…', 'culture-community' ); ?>"
            >
            <div class="culture-ms-dropdown" data-culture-ms-dropdown hidden></div>
        </div>
        <select class="culture-ms-select" name="list_ids[]" multiple data-culture-ms-select>
            <?php foreach ( $lists as $list ) : ?>
                <option
                    value="<?php echo esc_attr( $list['id'] ); ?>"
                    data-count="<?php echo esc_attr( number_format( Culture_Newsletter_Lists::subscriber_count( $list['id'] ) ) ); ?>"
                    <?php selected( in_array( $list['id'], $selected_ids, true ) ); ?>
                ><?php echo esc_html( $list['name'] ); ?></option>
            <?php endforeach; ?>
        </select>
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
