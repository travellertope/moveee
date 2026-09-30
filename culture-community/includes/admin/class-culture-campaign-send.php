<?php
/**
 * "Send Campaign" meta box on the culture_campaign post edit screen — the
 * Gutenberg-editor counterpart to Culture_Newsletter_Send's "Send Newsletter"
 * meta box. Lets a draft campaign pick which lists (from the
 * Culture_Newsletter_Lists registry) it targets, then Send Test / Send
 * Campaign, all without leaving the native post editor. See
 * class-culture-campaigns.php for the actual send/tracking mechanics this
 * drives, and class-culture-campaigns-admin.php for the list page that links
 * into this editor.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Culture_Campaign_Send {

    public static function init() {
        add_action( 'add_meta_boxes',                      array( __CLASS__, 'register_meta_box' ) );
        add_action( 'admin_enqueue_scripts',                array( __CLASS__, 'enqueue_assets' ) );
        add_action( 'save_post_culture_campaign',           array( __CLASS__, 'save_list_meta' ), 10, 2 );
        add_action( 'admin_post_culture_campaign_send',     array( __CLASS__, 'handle_send' ) );
        add_action( 'admin_post_culture_campaign_test',     array( __CLASS__, 'handle_send_test' ) );
        add_action( 'admin_notices',                        array( __CLASS__, 'maybe_show_send_notice' ) );
    }

    /**
     * Surfaces the result of the Send Test / Send Campaign admin-post
     * handlers below (both redirect back to this same post.php?action=edit
     * screen with a query arg) as a normal WP admin notice — the native
     * "Post updated" notice only ever covers the editor's own Save/Update
     * action, not these.
     */
    public static function maybe_show_send_notice() {
        $screen = get_current_screen();
        if ( ! $screen || 'post' !== $screen->base || Culture_Campaigns::POST_TYPE !== $screen->post_type ) {
            return;
        }
        if ( isset( $_GET['campaign_sent'] ) ) {
            printf(
                '<div class="notice notice-success is-dismissible"><p>%s</p></div>',
                esc_html( sprintf( __( 'Campaign is sending to %s recipients.', 'culture-community' ), number_format( absint( $_GET['campaign_sent'] ) ) ) )
            );
        } elseif ( isset( $_GET['campaign_tested'] ) ) {
            echo '<div class="notice notice-success is-dismissible"><p>' . esc_html__( 'Test email sent.', 'culture-community' ) . '</p></div>';
        } elseif ( isset( $_GET['campaign_error'] ) ) {
            printf(
                '<div class="notice notice-error is-dismissible"><p>%s</p></div>',
                esc_html( sanitize_text_field( wp_unslash( $_GET['campaign_error'] ) ) )
            );
        }
    }

    public static function register_meta_box() {
        add_meta_box(
            'culture_campaign_send',
            __( 'Send Campaign', 'culture-community' ),
            array( __CLASS__, 'render_meta_box' ),
            Culture_Campaigns::POST_TYPE,
            'side',
            'high'
        );
    }

    /**
     * Enqueue the searchable-list-multiselect CSS/JS — same widget the old
     * inline campaigns-admin.php form used, moved here since this meta box
     * is now the only place it's needed. Only on the culture_campaign edit
     * screen.
     */
    public static function enqueue_assets( $hook ) {
        if ( ! in_array( $hook, array( 'post.php', 'post-new.php' ), true ) ) {
            return;
        }
        $screen = get_current_screen();
        if ( ! $screen || Culture_Campaigns::POST_TYPE !== $screen->post_type ) {
            return;
        }

        wp_add_inline_style( 'wp-admin', self::multiselect_css() );
        // Attached to 'jquery-core' purely as a reliably-always-enqueued
        // handle to hang an inline <script> off — the multiselect JS itself
        // is plain vanilla JS with no jQuery dependency.
        wp_enqueue_script( 'jquery' );
        wp_add_inline_script( 'jquery-core', self::multiselect_js() );
    }

    /**
     * @param string $css
     */
    private static function multiselect_css() {
        return '
            .culture-ms { position: relative; max-width: 100%; }
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
                max-height: 220px; overflow-y: auto; margin-top: 2px;
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
     * Byte-for-byte the same vanilla-JS combobox class-culture-campaigns-admin.php
     * used to inline for its own now-removed "Send to" field.
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

    /**
     * @param WP_Post $post
     */
    public static function render_meta_box( $post ) {
        $campaign = Culture_Campaigns::get( $post->ID );
        // A brand-new, unsaved post ("Add New" before the first autosave)
        // has no meta yet — fall back to the same shape Culture_Campaigns::get()
        // would return for a fresh draft, so the rest of this method doesn't
        // need two branches.
        if ( ! $campaign ) {
            $campaign = array(
                'listIds' => array(), 'status' => Culture_Campaigns::STATUS_DRAFT,
                'sendTotal' => 0, 'sendOffset' => 0, 'percent' => 0, 'sentAt' => null,
            );
        }

        wp_nonce_field( 'culture_campaign_list_' . $post->ID, 'culture_campaign_list_nonce' );

        echo '<p style="margin-top:0;"><strong>' . esc_html__( 'Status:', 'culture-community' ) . '</strong> '
            . esc_html( ucfirst( $campaign['status'] ) );
        if ( Culture_Campaigns::STATUS_SENDING === $campaign['status'] ) {
            echo ' — ' . esc_html( $campaign['sendOffset'] . ' / ' . $campaign['sendTotal'] . ' (' . $campaign['percent'] . '%)' );
        } elseif ( Culture_Campaigns::STATUS_SENT === $campaign['status'] ) {
            echo ' — ' . esc_html( sprintf( __( 'sent to %s recipients', 'culture-community' ), number_format( $campaign['sendTotal'] ) ) );
        }
        echo '</p>';

        if ( Culture_Campaigns::STATUS_DRAFT !== $campaign['status'] ) {
            echo '<p style="color:#646970;font-size:12px;">' . esc_html__( 'This campaign has already been sent or is currently sending and can no longer be edited.', 'culture-community' ) . '</p>';
            return;
        }

        echo '<p><label style="display:block;font-size:11px;font-weight:600;text-transform:uppercase;margin-bottom:4px;">'
            . esc_html__( 'Send to', 'culture-community' ) . '</label>';
        self::render_list_multiselect( Culture_Newsletter_Lists::get_all(), $campaign['listIds'] );
        echo '</p>';
        echo '<p style="color:#646970;font-size:12px;">' . esc_html__( 'Update/Publish this post to save your list selection before sending.', 'culture-community' ) . '</p>';

        echo '<hr>';

        // Send Test.
        echo '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '" style="margin-bottom:10px;">';
        echo '<input type="hidden" name="action" value="culture_campaign_test">';
        echo '<input type="hidden" name="id" value="' . esc_attr( $post->ID ) . '">';
        wp_nonce_field( 'culture_campaign_test' );
        echo '<label style="display:block;font-size:11px;font-weight:600;text-transform:uppercase;margin-bottom:4px;">'
            . esc_html__( 'Send Test', 'culture-community' ) . '</label>';
        echo '<input type="email" name="test_email" placeholder="' . esc_attr__( 'you@email.com', 'culture-community' ) . '" required style="width:100%;margin-bottom:6px;">';
        echo '<button type="submit" class="button">' . esc_html__( 'Send Test', 'culture-community' ) . '</button>';
        echo '</form>';

        // Send Campaign.
        echo '<form method="post" action="' . esc_url( admin_url( 'admin-post.php' ) ) . '" onsubmit="return confirm(\'' . esc_js( __( 'Send this campaign now? This cannot be undone.', 'culture-community' ) ) . '\')">';
        echo '<input type="hidden" name="action" value="culture_campaign_send">';
        echo '<input type="hidden" name="id" value="' . esc_attr( $post->ID ) . '">';
        wp_nonce_field( 'culture_campaign_send' );
        echo '<button type="submit" class="button button-primary" style="width:100%;">' . esc_html__( 'Send Campaign', 'culture-community' ) . '</button>';
        echo '</form>';
    }

    /**
     * @param array $lists         Full list registry (Culture_Newsletter_Lists::get_all()).
     * @param array $selected_ids  List IDs already selected.
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
        <select class="culture-ms-select" name="campaign_list_ids[]" multiple data-culture-ms-select>
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

    /**
     * Save _campaign_list_ids when the campaign post is saved — only while
     * still a draft (mirrors Culture_Campaigns::update()'s own guard, so a
     * stray save on a sending/sent campaign can't silently change its
     * target list after the fact).
     */
    public static function save_list_meta( $post_id, $post ) {
        if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) return;
        if ( ! current_user_can( 'edit_post', $post_id ) ) return;
        if ( ! isset( $_POST['culture_campaign_list_nonce'] ) ) return;
        if ( ! wp_verify_nonce( $_POST['culture_campaign_list_nonce'], 'culture_campaign_list_' . $post_id ) ) return;
        if ( ! isset( $_POST['campaign_list_ids'] ) ) return;

        $status = get_post_meta( $post_id, '_campaign_status', true ) ?: Culture_Campaigns::STATUS_DRAFT;
        if ( Culture_Campaigns::STATUS_DRAFT !== $status ) return;

        $list_ids = array_values( array_filter( array_map( 'intval', (array) $_POST['campaign_list_ids'] ) ) );
        update_post_meta( $post_id, '_campaign_list_ids', wp_json_encode( $list_ids ) );

        // A campaign that's never been through Culture_Campaigns::create()
        // (e.g. one started via "Add New" directly in wp-admin rather than
        // the Campaigns list page) has no _campaign_status yet — seed it on
        // first save, same fallback create() itself would have set.
        if ( '' === get_post_meta( $post_id, '_campaign_status', true ) ) {
            update_post_meta( $post_id, '_campaign_status', Culture_Campaigns::STATUS_DRAFT );
            update_post_meta( $post_id, '_campaign_send_total', 0 );
            update_post_meta( $post_id, '_campaign_send_offset', 0 );
        }
    }

    public static function handle_send() {
        check_admin_referer( 'culture_campaign_send' );
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( esc_html__( 'Permission denied.', 'culture-community' ) );
        }

        $id     = absint( $_POST['id'] ?? 0 );
        $result = Culture_Campaigns::send( $id );

        if ( is_wp_error( $result ) ) {
            wp_safe_redirect( add_query_arg( array( 'post' => $id, 'action' => 'edit', 'campaign_error' => rawurlencode( $result->get_error_message() ) ), admin_url( 'post.php' ) ) );
            exit;
        }

        wp_safe_redirect( add_query_arg( array( 'post' => $id, 'action' => 'edit', 'campaign_sent' => $result ), admin_url( 'post.php' ) ) );
        exit;
    }

    public static function handle_send_test() {
        check_admin_referer( 'culture_campaign_test' );
        if ( ! current_user_can( 'manage_options' ) ) {
            wp_die( esc_html__( 'Permission denied.', 'culture-community' ) );
        }

        $id = absint( $_POST['id'] ?? 0 );
        Culture_Campaigns::send_test( $id, sanitize_email( $_POST['test_email'] ?? '' ) );

        wp_safe_redirect( add_query_arg( array( 'post' => $id, 'action' => 'edit', 'campaign_tested' => '1' ), admin_url( 'post.php' ) ) );
        exit;
    }
}
