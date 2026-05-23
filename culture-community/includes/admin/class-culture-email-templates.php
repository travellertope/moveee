<?php
/**
 * Admin page for editing email template content via WYSIWYG editors.
 *
 * Allows admins to customise the subject, heading, body and button text
 * for every automated email the plugin sends. Each template supports
 * merge tags that are replaced at send-time with dynamic data.
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Culture_Email_Templates {

    /** wp_options key prefix – each template stored as an array. */
    const OPT_PREFIX = 'culture_email_tpl_';

    /**
     * Template definitions keyed by slug.
     *
     * @return array
     */
    private static function templates() {
        return array(
            'welcome' => array(
                'label'           => __( 'Welcome Email', 'culture-community' ),
                'description'     => __( 'Sent to a new member immediately after registration.', 'culture-community' ),
                'tags'            => array(
                    '{display_name}' => __( 'Member\'s display name', 'culture-community' ),
                    '{tier}'         => __( 'Membership tier (e.g. Citizen, Patron)', 'culture-community' ),
                    '{chapter_name}' => __( 'Primary chapter name (may be empty)', 'culture-community' ),
                ),
                'default_subject' => 'Welcome to Culture Community, {display_name}!',
                'default_heading' => 'Welcome Aboard!',
                'default_button'  => 'Explore Now',
                'default_body'    => '<p>Hi {display_name},</p>
<p>Thank you for joining Culture Community! Your cultural passport has been created and you\'re ready to start exploring.</p>
<table style="width:100%;margin:20px 0;border-collapse:collapse;">
<tbody>
<tr><td style="padding:8px 12px;background:#f8f9fa;font-weight:600;width:140px;">Membership</td><td style="padding:8px 12px;background:#f8f9fa;">{tier}</td></tr>
<tr><td style="padding:8px 12px;font-weight:600;">Chapter</td><td style="padding:8px 12px;">{chapter_name}</td></tr>
</tbody>
</table>
<p>Here\'s what you can do next:</p>
<ul>
<li>Browse upcoming events in your chapter</li>
<li>Read the latest GetMeLit and Culture Drop newsletters</li>
<li>Share your referral link to earn Culture Points</li>
<li>Check your Cultural Passport to track badges and progress</li>
</ul>',
            ),

            'referral' => array(
                'label'           => __( 'Referral Confirmation', 'culture-community' ),
                'description'     => __( 'Sent to the referrer when someone joins via their link.', 'culture-community' ),
                'tags'            => array(
                    '{referrer_name}'   => __( 'Referrer\'s display name', 'culture-community' ),
                    '{new_member_name}' => __( 'New member\'s display name', 'culture-community' ),
                    '{referral_points}' => __( 'Points earned for this referral', 'culture-community' ),
                    '{referral_count}'  => __( 'Total number of referrals', 'culture-community' ),
                    '{total_points}'    => __( 'Referrer\'s total points', 'culture-community' ),
                ),
                'default_subject' => '{new_member_name} joined via your referral!',
                'default_heading' => 'Referral Success!',
                'default_button'  => 'View Your Passport',
                'default_body'    => '<p>Hi {referrer_name},</p>
<p>Great news! <strong>{new_member_name}</strong> just joined Culture Community using your referral link. You\'ve earned <strong>{referral_points}</strong> Culture Points!</p>
<table style="width:100%;margin:20px 0;border-collapse:collapse;">
<tbody>
<tr>
<td style="padding:12px;background:#f8f9fa;text-align:center;width:50%;"><span style="font-size:28px;font-weight:700;color:#e67e22;">{referral_count}</span><br /><span style="font-size:12px;color:#7f8c8d;">Total Referrals</span></td>
<td style="padding:12px;background:#f8f9fa;text-align:center;width:50%;"><span style="font-size:28px;font-weight:700;color:#e67e22;">{total_points}</span><br /><span style="font-size:12px;color:#7f8c8d;">Total Points</span></td>
</tr>
</tbody>
</table>
<p>Keep sharing your link to earn more points and unlock badges!</p>',
            ),

            'payment_receipt' => array(
                'label'           => __( 'Payment Receipt', 'culture-community' ),
                'description'     => __( 'Sent after a successful Paystack subscription payment.', 'culture-community' ),
                'tags'            => array(
                    '{display_name}' => __( 'Member\'s display name', 'culture-community' ),
                    '{plan_name}'    => __( 'Subscription plan name', 'culture-community' ),
                    '{amount}'       => __( 'Formatted payment amount', 'culture-community' ),
                    '{currency}'     => __( 'Currency code (e.g. NGN)', 'culture-community' ),
                    '{reference}'    => __( 'Transaction reference', 'culture-community' ),
                    '{date}'         => __( 'Payment date', 'culture-community' ),
                ),
                'default_subject' => 'Payment Confirmed - Culture Community Patron',
                'default_heading' => 'Payment Receipt',
                'default_button'  => 'Start Exploring',
                'default_body'    => '<p>Hi {display_name},</p>
<p>Your payment has been processed successfully. Welcome to the Patron tier!</p>
<table style="width:100%;margin:20px 0;border-collapse:collapse;border:1px solid #ddd;">
<tbody>
<tr><td style="padding:10px 12px;background:#f8f9fa;font-weight:600;border-bottom:1px solid #ddd;">Plan</td><td style="padding:10px 12px;border-bottom:1px solid #ddd;">{plan_name}</td></tr>
<tr><td style="padding:10px 12px;background:#f8f9fa;font-weight:600;border-bottom:1px solid #ddd;">Amount</td><td style="padding:10px 12px;border-bottom:1px solid #ddd;">{currency} {amount}</td></tr>
<tr><td style="padding:10px 12px;background:#f8f9fa;font-weight:600;border-bottom:1px solid #ddd;">Reference</td><td style="padding:10px 12px;border-bottom:1px solid #ddd;">{reference}</td></tr>
<tr><td style="padding:10px 12px;background:#f8f9fa;font-weight:600;">Date</td><td style="padding:10px 12px;">{date}</td></tr>
</tbody>
</table>
<p>As a Patron member, you now have access to:</p>
<ul>
<li>Physical (in-person) event attendance</li>
<li>Dual chapter membership</li>
<li>Priority RSVP for events</li>
</ul>',
            ),

            'grace_period' => array(
                'label'           => __( 'Grace Period Warning', 'culture-community' ),
                'description'     => __( 'Sent when a subscription payment fails and the grace period begins.', 'culture-community' ),
                'tags'            => array(
                    '{display_name}' => __( 'Member\'s display name', 'culture-community' ),
                    '{grace_days}'   => __( 'Number of grace period days remaining', 'culture-community' ),
                ),
                'default_subject' => 'Action Required: Payment Failed - Culture Community',
                'default_heading' => 'Payment Issue',
                'default_button'  => 'Update Payment',
                'default_body'    => '<p>Hi {display_name},</p>
<p>We were unable to process your latest subscription payment for Culture Community.</p>
<div style="background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:16px;margin:20px 0;">
<p style="margin:0;font-weight:600;color:#856404;">You have {grace_days} days to update your payment method before your account is downgraded to the Citizen tier.</p>
</div>
<p>If your account is downgraded, you will lose access to:</p>
<ul>
<li>Physical event attendance</li>
<li>Your secondary chapter membership</li>
<li>Priority RSVP</li>
</ul>
<p>Please update your payment details to continue enjoying Patron benefits.</p>',
            ),

            'downgrade' => array(
                'label'           => __( 'Downgrade Notice', 'culture-community' ),
                'description'     => __( 'Sent when the grace period expires and the account is downgraded.', 'culture-community' ),
                'tags'            => array(
                    '{display_name}' => __( 'Member\'s display name', 'culture-community' ),
                ),
                'default_subject' => 'Your account has been downgraded - Culture Community',
                'default_heading' => 'Account Update',
                'default_button'  => 'Re-subscribe',
                'default_body'    => '<p>Hi {display_name},</p>
<p>Your Culture Community account has been downgraded to the Citizen tier because your subscription payment could not be processed.</p>
<p>You can still:</p>
<ul>
<li>Attend virtual events</li>
<li>Read GetMeLit and Culture Drop newsletters</li>
<li>Earn points and badges</li>
<li>Refer friends</li>
</ul>
<p>To regain Connect Pro benefits, you can re-subscribe at any time.</p>',
            ),

            'event_rsvp_confirmation' => array(
                'label'           => __( 'Event RSVP Confirmation', 'culture-community' ),
                'description'     => __( 'Sent to an attendee immediately after they RSVP to an event.', 'culture-community' ),
                'tags'            => array(
                    '{first_name}'    => __( 'Attendee\'s first name', 'culture-community' ),
                    '{event_title}'   => __( 'Event name', 'culture-community' ),
                    '{ticket_label}'  => __( 'Ticket type label (e.g. General Admission, Private View)', 'culture-community' ),
                    '{event_date}'    => __( 'Event date (e.g. 12 June 2025)', 'culture-community' ),
                    '{event_venue}'   => __( 'Venue / location name', 'culture-community' ),
                    '{event_hours}'   => __( 'Opening / door hours (e.g. Doors open 19:30)', 'culture-community' ),
                    '{event_admission}' => __( 'Admission info (e.g. Free Admission, Paid Entry)', 'culture-community' ),
                    '{attendee_email}' => __( 'Attendee\'s email address', 'culture-community' ),
                ),
                'default_subject' => "You're on the list — {event_title} · The Moveee",
                'default_heading' => 'The Moveee · Events',
                'default_button'  => 'View Event →',
                'default_body'    => '<p>Hi {first_name},</p>
<p>You\'re confirmed for <strong>{event_title}</strong>. We look forward to seeing you.</p>
<table style="width:100%;margin:24px 0;border-collapse:collapse;">
<tbody>
<tr><td style="padding:10px 0;border-bottom:1px solid rgba(243,236,224,0.15);font-size:11px;text-transform:uppercase;letter-spacing:0.1em;opacity:0.5;">Your ticket</td><td style="padding:10px 0;border-bottom:1px solid rgba(243,236,224,0.15);text-align:right;">{ticket_label}</td></tr>
<tr><td style="padding:10px 0;border-bottom:1px solid rgba(243,236,224,0.15);font-size:11px;text-transform:uppercase;letter-spacing:0.1em;opacity:0.5;">Date</td><td style="padding:10px 0;border-bottom:1px solid rgba(243,236,224,0.15);text-align:right;">{event_date}</td></tr>
<tr><td style="padding:10px 0;border-bottom:1px solid rgba(243,236,224,0.15);font-size:11px;text-transform:uppercase;letter-spacing:0.1em;opacity:0.5;">Venue</td><td style="padding:10px 0;border-bottom:1px solid rgba(243,236,224,0.15);text-align:right;">{event_venue}</td></tr>
<tr><td style="padding:10px 0;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;opacity:0.5;">Entry</td><td style="padding:10px 0;text-align:right;">{event_hours} · {event_admission}</td></tr>
</tbody>
</table>
<p style="font-size:13px;opacity:0.6;">A confirmation has been sent to {attendee_email}. Please bring this email or tell us your name at the door on the night.</p>',
            ),
        );
    }

    /* ------------------------------------------------------------------ */
    /*  Public API – used by Culture_Emails                                */
    /* ------------------------------------------------------------------ */

    /**
     * Get a saved template or defaults.
     *
     * @param string $slug Template slug.
     * @return array {subject, heading, body, button}
     */
    public static function get_template( $slug ) {
        $templates = self::templates();
        if ( ! isset( $templates[ $slug ] ) ) {
            return array(
                'subject' => '',
                'heading' => '',
                'body'    => '',
                'button'  => '',
            );
        }

        $def  = $templates[ $slug ];
        $saved = get_option( self::OPT_PREFIX . $slug, array() );

        return array(
            'subject' => ! empty( $saved['subject'] ) ? $saved['subject'] : $def['default_subject'],
            'heading' => ! empty( $saved['heading'] ) ? $saved['heading'] : $def['default_heading'],
            'body'    => ! empty( $saved['body'] )    ? $saved['body']    : $def['default_body'],
            'button'  => ! empty( $saved['button'] )  ? $saved['button']  : $def['default_button'],
        );
    }

    /**
     * Replace merge tags in a string.
     *
     * @param string $content  Content with {tags}.
     * @param array  $data     Associative array of tag => value.
     * @return string
     */
    public static function merge( $content, $data ) {
        foreach ( $data as $tag => $value ) {
            $content = str_replace( $tag, $value, $content );
        }
        return $content;
    }

    /* ------------------------------------------------------------------ */
    /*  Admin hooks                                                        */
    /* ------------------------------------------------------------------ */

    public static function init() {
        add_action( 'admin_menu', array( __CLASS__, 'register_menu' ) );
        add_action( 'admin_init', array( __CLASS__, 'handle_save' ) );
    }

    /**
     * Register submenu page under Culture Community.
     */
    public static function register_menu() {
        add_submenu_page(
            'culture-community',
            __( 'Email Templates', 'culture-community' ),
            __( 'Email Templates', 'culture-community' ),
            'manage_options',
            'culture-email-templates',
            array( __CLASS__, 'render_page' )
        );
    }

    /**
     * Handle form submission – save or reset a template.
     */
    public static function handle_save() {
        // Save template.
        if (
            isset( $_POST['culture_email_tpl_save'] ) &&
            check_admin_referer( 'culture_email_tpl_save', 'culture_email_tpl_nonce' )
        ) {
            $slug = sanitize_key( $_POST['culture_email_tpl_slug'] ?? '' );
            $templates = self::templates();

            if ( isset( $templates[ $slug ] ) ) {
                $data = array(
                    'subject' => sanitize_text_field( $_POST['template_subject'] ?? '' ),
                    'heading' => sanitize_text_field( $_POST['template_heading'] ?? '' ),
                    'body'    => wp_kses_post( $_POST['template_body'] ?? '' ),
                    'button'  => sanitize_text_field( $_POST['template_button'] ?? '' ),
                );
                update_option( self::OPT_PREFIX . $slug, $data );
            }

            wp_safe_redirect( add_query_arg(
                array(
                    'page'     => 'culture-email-templates',
                    'template' => $slug,
                    'updated'  => '1',
                ),
                admin_url( 'admin.php' )
            ) );
            exit;
        }

        // Reset template.
        if (
            isset( $_POST['culture_email_tpl_reset'] ) &&
            check_admin_referer( 'culture_email_tpl_reset', 'culture_email_tpl_reset_nonce' )
        ) {
            $slug = sanitize_key( $_POST['culture_email_tpl_slug'] ?? '' );
            delete_option( self::OPT_PREFIX . $slug );

            wp_safe_redirect( add_query_arg(
                array(
                    'page'     => 'culture-email-templates',
                    'template' => $slug,
                    'reset'    => '1',
                ),
                admin_url( 'admin.php' )
            ) );
            exit;
        }
    }

    /**
     * Render the Email Templates admin page.
     */
    public static function render_page() {
        $templates   = self::templates();
        $slugs       = array_keys( $templates );
        $active_slug = isset( $_GET['template'] ) ? sanitize_key( $_GET['template'] ) : $slugs[0];

        if ( ! isset( $templates[ $active_slug ] ) ) {
            $active_slug = $slugs[0];
        }

        $tpl  = $templates[ $active_slug ];
        $saved = self::get_template( $active_slug );
        ?>
        <div class="wrap">
            <h1><?php esc_html_e( 'Email Templates', 'culture-community' ); ?></h1>

            <?php if ( ! empty( $_GET['updated'] ) ) : ?>
                <div class="notice notice-success is-dismissible"><p><?php esc_html_e( 'Template saved.', 'culture-community' ); ?></p></div>
            <?php endif; ?>
            <?php if ( ! empty( $_GET['reset'] ) ) : ?>
                <div class="notice notice-warning is-dismissible"><p><?php esc_html_e( 'Template reset to default.', 'culture-community' ); ?></p></div>
            <?php endif; ?>

            <p class="description"><?php esc_html_e( 'Customise the content of automated emails. Use the merge tags listed below each editor to insert dynamic data.', 'culture-community' ); ?></p>

            <!-- Template sub-tabs -->
            <nav class="nav-tab-wrapper" style="margin-bottom:20px;">
                <?php foreach ( $templates as $slug => $def ) : ?>
                    <a href="<?php echo esc_url( admin_url( 'admin.php?page=culture-email-templates&template=' . $slug ) ); ?>"
                       class="nav-tab <?php echo $active_slug === $slug ? 'nav-tab-active' : ''; ?>">
                        <?php echo esc_html( $def['label'] ); ?>
                    </a>
                <?php endforeach; ?>
            </nav>

            <!-- Template description -->
            <div style="background:#fff;border:1px solid #ccd0d4;border-radius:4px;padding:16px 20px;margin-bottom:20px;">
                <strong><?php echo esc_html( $tpl['label'] ); ?></strong>
                &mdash; <?php echo esc_html( $tpl['description'] ); ?>
            </div>

            <!-- Save form -->
            <form method="post" action="">
                <?php wp_nonce_field( 'culture_email_tpl_save', 'culture_email_tpl_nonce' ); ?>
                <input type="hidden" name="culture_email_tpl_slug" value="<?php echo esc_attr( $active_slug ); ?>" />
                <input type="hidden" name="culture_email_tpl_save" value="1" />

                <table class="form-table">
                    <tr>
                        <th scope="row"><label for="template_subject"><?php esc_html_e( 'Subject Line', 'culture-community' ); ?></label></th>
                        <td>
                            <input type="text" id="template_subject" name="template_subject"
                                   value="<?php echo esc_attr( $saved['subject'] ); ?>" class="large-text" />
                            <p class="description"><?php esc_html_e( 'The email subject. Merge tags are supported.', 'culture-community' ); ?></p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="template_heading"><?php esc_html_e( 'Header Heading', 'culture-community' ); ?></label></th>
                        <td>
                            <input type="text" id="template_heading" name="template_heading"
                                   value="<?php echo esc_attr( $saved['heading'] ); ?>" class="regular-text" />
                            <p class="description"><?php esc_html_e( 'Text displayed in the coloured header bar at the top of the email.', 'culture-community' ); ?></p>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label><?php esc_html_e( 'Email Body', 'culture-community' ); ?></label></th>
                        <td>
                            <?php
                            wp_editor( $saved['body'], 'culture_email_tpl_body', array(
                                'textarea_name' => 'template_body',
                                'textarea_rows' => 18,
                                'media_buttons' => true,
                                'teeny'         => false,
                                'quicktags'     => true,
                            ) );
                            ?>
                        </td>
                    </tr>
                    <tr>
                        <th scope="row"><label for="template_button"><?php esc_html_e( 'Button Text', 'culture-community' ); ?></label></th>
                        <td>
                            <input type="text" id="template_button" name="template_button"
                                   value="<?php echo esc_attr( $saved['button'] ); ?>" class="regular-text" />
                            <p class="description"><?php esc_html_e( 'Text for the call-to-action button at the bottom of the email.', 'culture-community' ); ?></p>
                        </td>
                    </tr>
                </table>

                <!-- Merge tags reference -->
                <div style="background:#f8f9fa;border:1px solid #ccd0d4;border-radius:4px;padding:16px 20px;margin:10px 0 20px;">
                    <h3 style="margin-top:0;"><?php esc_html_e( 'Available Merge Tags', 'culture-community' ); ?></h3>
                    <p class="description" style="margin-bottom:10px;"><?php esc_html_e( 'Click a tag to copy it, then paste into the subject or body.', 'culture-community' ); ?></p>
                    <table class="widefat fixed striped" style="max-width:600px;">
                        <thead>
                            <tr>
                                <th style="width:180px;"><?php esc_html_e( 'Tag', 'culture-community' ); ?></th>
                                <th><?php esc_html_e( 'Description', 'culture-community' ); ?></th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ( $tpl['tags'] as $tag => $desc ) : ?>
                                <tr>
                                    <td><code class="culture-merge-tag" style="cursor:pointer;" title="<?php esc_attr_e( 'Click to copy', 'culture-community' ); ?>"><?php echo esc_html( $tag ); ?></code></td>
                                    <td><?php echo esc_html( $desc ); ?></td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>

                <?php submit_button( __( 'Save Template', 'culture-community' ) ); ?>
            </form>

            <!-- Reset form (separate to avoid accidental resets) -->
            <hr />
            <form method="post" action="" style="margin-top:10px;">
                <?php wp_nonce_field( 'culture_email_tpl_reset', 'culture_email_tpl_reset_nonce' ); ?>
                <input type="hidden" name="culture_email_tpl_slug" value="<?php echo esc_attr( $active_slug ); ?>" />
                <input type="hidden" name="culture_email_tpl_reset" value="1" />
                <p class="description"><?php esc_html_e( 'Discard all customisations and restore the original template content.', 'culture-community' ); ?></p>
                <?php submit_button( __( 'Reset to Default', 'culture-community' ), 'delete', 'submit', false, array(
                    'onclick' => "return confirm('" . esc_js( __( 'Are you sure? This will discard your custom content for this template.', 'culture-community' ) ) . "');",
                ) ); ?>
            </form>
        </div>

        <script>
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('culture-merge-tag')) {
                var tag = e.target.textContent;
                if (navigator.clipboard) {
                    navigator.clipboard.writeText(tag);
                    e.target.style.background = '#d4edda';
                    setTimeout(function() { e.target.style.background = ''; }, 800);
                }
            }
        });
        </script>
        <?php
    }
}
