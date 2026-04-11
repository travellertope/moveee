<?php
/**
 * Email notification system.
 *
 * Sends branded HTML emails for key lifecycle events:
 * - Welcome (on registration)
 * - Referral confirmation (to referrer when someone joins via their link)
 * - Payment receipt (on successful Paystack payment)
 * - Grace period warning (when payment fails, before downgrade)
 * - Downgrade notice (when grace period expires)
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

class Culture_Emails {

    /** Default from name for all outgoing emails. */
    const FROM_NAME = 'Culture Community';

    /**
     * Get the configured from name.
     *
     * @return string
     */
    private static function get_from_name() {
        return class_exists( 'Culture_Settings' ) ? Culture_Settings::get( 'culture_email_from_name' ) : self::FROM_NAME;
    }

    /**
     * Get the configured header background color.
     *
     * @return string Hex color.
     */
    private static function get_header_color() {
        return class_exists( 'Culture_Settings' ) ? Culture_Settings::get( 'culture_email_header_color' ) : '#2c3e50';
    }

    /**
     * Get the configured button color.
     *
     * @return string Hex color.
     */
    private static function get_button_color() {
        return class_exists( 'Culture_Settings' ) ? Culture_Settings::get( 'culture_email_button_color' ) : '#e67e22';
    }

    public static function init() {
        // Welcome email after registration completes.
        add_action( 'user_register', array( __CLASS__, 'send_welcome_email' ), 30 );

        // Referral confirmation to the referrer.
        add_action( 'culture_referral_completed', array( __CLASS__, 'send_referral_confirmation' ), 10, 2 );

        // Payment receipt after Paystack subscription created.
        add_action( 'culture_payment_completed', array( __CLASS__, 'send_payment_receipt' ), 10, 2 );

        // Grace period warning when payment fails.
        add_action( 'culture_grace_period_started', array( __CLASS__, 'send_grace_period_warning' ), 10, 1 );

        // Downgrade notice when grace period expires.
        add_action( 'culture_grace_period_expired', array( __CLASS__, 'send_downgrade_notice' ), 10, 1 );

        // Set HTML content type for our emails.
        add_filter( 'wp_mail_content_type', array( __CLASS__, 'set_html_content_type' ) );

        // Set from name.
        add_filter( 'wp_mail_from_name', array( __CLASS__, 'set_from_name' ) );
    }

    /**
     * Send welcome email to a newly registered user.
     *
     * @param int $user_id
     */
    public static function send_welcome_email( $user_id ) {
        $user = get_userdata( $user_id );
        if ( ! $user ) {
            return;
        }

        $tier         = get_user_meta( $user_id, '_culture_membership_tier', true ) ?: 'citizen';
        $chapter      = get_user_meta( $user_id, '_culture_primary_chapter_id', true );
        $chapter_name = $chapter ? get_the_title( $chapter ) : '';

        $merge = array(
            '{display_name}' => esc_html( $user->display_name ),
            '{tier}'         => esc_html( ucfirst( $tier ) ),
            '{chapter_name}' => esc_html( $chapter_name ),
        );

        $tpl     = Culture_Email_Templates::get_template( 'welcome' );
        $subject = Culture_Email_Templates::merge( $tpl['subject'], $merge );

        $body  = self::get_header( Culture_Email_Templates::merge( $tpl['heading'], $merge ) );
        $body .= Culture_Email_Templates::merge( $tpl['body'], $merge );
        $body .= self::get_button( home_url( '/' ), Culture_Email_Templates::merge( $tpl['button'], $merge ) );
        $body .= self::get_footer();

        self::send( $user->user_email, $subject, $body );
    }

    /**
     * Send referral confirmation to the referrer.
     *
     * @param int $referrer_id
     * @param int $new_user_id
     */
    public static function send_referral_confirmation( $referrer_id, $new_user_id ) {
        $referrer = get_userdata( $referrer_id );
        $new_user = get_userdata( $new_user_id );
        if ( ! $referrer || ! $new_user ) {
            return;
        }

        $points         = Culture_Gamification::get_points( $referrer_id );
        $referral_count = Culture_Referrals::get_referral_count( $referrer_id );

        $merge = array(
            '{referrer_name}'   => esc_html( $referrer->display_name ),
            '{new_member_name}' => esc_html( $new_user->display_name ),
            '{referral_points}' => Culture_Gamification::get_point_value( 'referral' ),
            '{referral_count}'  => esc_html( $referral_count ),
            '{total_points}'    => esc_html( $points ),
        );

        $tpl     = Culture_Email_Templates::get_template( 'referral' );
        $subject = Culture_Email_Templates::merge( $tpl['subject'], $merge );

        $body  = self::get_header( Culture_Email_Templates::merge( $tpl['heading'], $merge ) );
        $body .= Culture_Email_Templates::merge( $tpl['body'], $merge );
        $body .= self::get_button( home_url( '/' ), Culture_Email_Templates::merge( $tpl['button'], $merge ) );
        $body .= self::get_footer();

        self::send( $referrer->user_email, $subject, $body );
    }

    /**
     * Send payment receipt after successful Paystack transaction.
     *
     * @param int   $user_id
     * @param array $transaction_data Paystack transaction data.
     */
    public static function send_payment_receipt( $user_id, $transaction_data = array() ) {
        $user = get_userdata( $user_id );
        if ( ! $user ) {
            return;
        }

        $amount    = isset( $transaction_data['amount'] ) ? $transaction_data['amount'] / 100 : 0;
        $currency  = $transaction_data['currency'] ?? 'NGN';
        $reference = $transaction_data['reference'] ?? '';
        $plan_name = $transaction_data['plan']['name'] ?? __( 'Patron Membership', 'culture-community' );

        $merge = array(
            '{display_name}' => esc_html( $user->display_name ),
            '{plan_name}'    => esc_html( $plan_name ),
            '{amount}'       => esc_html( number_format( $amount, 2 ) ),
            '{currency}'     => esc_html( $currency ),
            '{reference}'    => esc_html( $reference ),
            '{date}'         => esc_html( date_i18n( get_option( 'date_format' ) ) ),
        );

        $tpl     = Culture_Email_Templates::get_template( 'payment_receipt' );
        $subject = Culture_Email_Templates::merge( $tpl['subject'], $merge );

        $body  = self::get_header( Culture_Email_Templates::merge( $tpl['heading'], $merge ) );
        $body .= Culture_Email_Templates::merge( $tpl['body'], $merge );
        $body .= self::get_button( home_url( '/' ), Culture_Email_Templates::merge( $tpl['button'], $merge ) );
        $body .= self::get_footer();

        self::send( $user->user_email, $subject, $body );
    }

    /**
     * Send grace period warning when payment fails.
     *
     * @param int $user_id
     */
    public static function send_grace_period_warning( $user_id ) {
        $user = get_userdata( $user_id );
        if ( ! $user ) {
            return;
        }

        $grace_days = Culture_Cron::get_grace_period_days();

        $merge = array(
            '{display_name}' => esc_html( $user->display_name ),
            '{grace_days}'   => $grace_days,
        );

        $tpl     = Culture_Email_Templates::get_template( 'grace_period' );
        $subject = Culture_Email_Templates::merge( $tpl['subject'], $merge );

        $body  = self::get_header( Culture_Email_Templates::merge( $tpl['heading'], $merge ) );
        $body .= Culture_Email_Templates::merge( $tpl['body'], $merge );
        $body .= self::get_button( home_url( '/' ), Culture_Email_Templates::merge( $tpl['button'], $merge ) );
        $body .= self::get_footer();

        self::send( $user->user_email, $subject, $body );
    }

    /**
     * Send downgrade notice when grace period expires.
     *
     * @param int $user_id
     */
    public static function send_downgrade_notice( $user_id ) {
        $user = get_userdata( $user_id );
        if ( ! $user ) {
            return;
        }

        $merge = array(
            '{display_name}' => esc_html( $user->display_name ),
        );

        $tpl     = Culture_Email_Templates::get_template( 'downgrade' );
        $subject = Culture_Email_Templates::merge( $tpl['subject'], $merge );

        $body  = self::get_header( Culture_Email_Templates::merge( $tpl['heading'], $merge ) );
        $body .= Culture_Email_Templates::merge( $tpl['body'], $merge );
        $body .= self::get_button( home_url( '/' ), Culture_Email_Templates::merge( $tpl['button'], $merge ) );
        $body .= self::get_footer();

        self::send( $user->user_email, $subject, $body );
    }

    /**
     * Send an HTML email.
     *
     * @param string $to      Recipient email.
     * @param string $subject Email subject.
     * @param string $body    HTML body.
     * @return bool
     */
    private static function send( $to, $subject, $body ) {
        $headers = array(
            'Content-Type: text/html; charset=UTF-8',
        );

        return wp_mail( $to, $subject, $body, $headers );
    }

    /**
     * Get the branded email header.
     *
     * @param string $heading
     * @return string
     */
    private static function get_header( $heading ) {
        $html  = '<!DOCTYPE html><html><head><meta charset="UTF-8"></head>';
        $html .= '<body style="margin:0;padding:0;background:#f4f4f4;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">';
        $html .= '<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 20px;">';
        $html .= '<tr><td align="center">';
        $html .= '<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);">';

        // Header bar.
        $html .= '<tr><td style="background:' . esc_attr( self::get_header_color() ) . ';padding:30px 40px;text-align:center;">';
        $html .= '<h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">' . esc_html( $heading ) . '</h1>';
        $html .= '</td></tr>';

        // Body area starts.
        $html .= '<tr><td style="padding:30px 40px;color:#2c3e50;font-size:15px;line-height:1.6;">';

        return $html;
    }

    /**
     * Get a CTA button.
     *
     * @param string $url
     * @param string $text
     * @return string
     */
    private static function get_button( $url, $text ) {
        return '<p style="text-align:center;margin:30px 0 10px;">'
            . '<a href="' . esc_url( $url ) . '" style="display:inline-block;padding:14px 32px;background:' . esc_attr( self::get_button_color() ) . ';color:#fff;text-decoration:none;border-radius:6px;font-weight:600;font-size:15px;">'
            . esc_html( $text )
            . '</a></p>';
    }

    /**
     * Get the branded email footer.
     *
     * @return string
     */
    private static function get_footer() {
        $html  = '</td></tr>';

        // Footer.
        $html .= '<tr><td style="padding:20px 40px;background:#f8f9fa;text-align:center;font-size:12px;color:#7f8c8d;border-top:1px solid #eee;">';
        $html .= '<p style="margin:0 0 4px;">' . esc_html( get_bloginfo( 'name' ) ) . '</p>';
        $html .= '<p style="margin:0;">' . __( 'You are receiving this email because you are a member of Culture Community.', 'culture-community' ) . '</p>';
        $html .= '</td></tr>';

        $html .= '</table>';
        $html .= '</td></tr></table>';
        $html .= '</body></html>';

        return $html;
    }

    /**
     * Set HTML content type for wp_mail.
     *
     * @return string
     */
    public static function set_html_content_type() {
        return 'text/html';
    }

    /**
     * Set from name for wp_mail.
     *
     * @return string
     */
    public static function set_from_name() {
        return self::get_from_name();
    }
}
