<?php
/**
 * Fired when the plugin is uninstalled.
 *
 * Cleans up all plugin data:
 * - Custom database tables
 * - User meta fields
 * - Post meta fields
 * - Options
 * - Custom roles and capabilities
 * - Scheduled cron events
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
    exit;
}

global $wpdb;

// ── Drop custom tables ──
$wpdb->query( "DROP TABLE IF EXISTS {$wpdb->prefix}culture_attendance" );

// ── Remove user meta fields ──
$user_meta_keys = array(
    '_culture_primary_chapter_id',
    '_culture_secondary_chapter_id',
    '_culture_membership_tier',
    '_culture_points',
    '_culture_badges',
    '_culture_referral_code',
    '_culture_referral_count',
    '_culture_referred_by',
    '_culture_paystack_customer_code',
    '_culture_paystack_reference',
    '_culture_subscription_code',
    '_culture_subscription_status',
    '_culture_grace_period_start',
    '_culture_phone',
    '_culture_whatsapp',
);

foreach ( $user_meta_keys as $key ) {
    $wpdb->query( $wpdb->prepare(
        "DELETE FROM {$wpdb->usermeta} WHERE meta_key = %s",
        $key
    ) );
}

// ── Remove post meta fields ──
$post_meta_keys = array(
    '_culture_location_lat',
    '_culture_location_lng',
    '_culture_chapter_leader_id',
    '_culture_event_date',
    '_culture_chapter_id',
    '_culture_is_physical',
    '_culture_capacity',
);

foreach ( $post_meta_keys as $key ) {
    $wpdb->query( $wpdb->prepare(
        "DELETE FROM {$wpdb->postmeta} WHERE meta_key = %s",
        $key
    ) );
}

// Remove reaction meta (pattern: _culture_reactions_%).
$wpdb->query(
    "DELETE FROM {$wpdb->postmeta} WHERE meta_key LIKE '_culture_reactions_%'"
);

// Remove paragraph index comment meta.
$wpdb->query( $wpdb->prepare(
    "DELETE FROM {$wpdb->commentmeta} WHERE meta_key = %s",
    '_culture_paragraph_idx'
) );

// ── Remove plugin options ──
$options = array(
    'culture_db_version',
    'culture_paystack_public_key',
    'culture_paystack_secret_key',
    'culture_paystack_plan_code',
);

foreach ( $options as $option ) {
    delete_option( $option );
}

// ── Remove custom role ──
remove_role( 'chapter_leader' );

// Remove culture capabilities from admin role.
$admin_role = get_role( 'administrator' );
if ( $admin_role ) {
    $admin_role->remove_cap( 'culture_manage_events' );
    $admin_role->remove_cap( 'culture_scan_qr' );
    $admin_role->remove_cap( 'culture_manage_chapter' );
    $admin_role->remove_cap( 'culture_view_attendance' );
}

// ── Clear scheduled cron events ──
$timestamp = wp_next_scheduled( 'culture_check_grace_periods' );
if ( $timestamp ) {
    wp_unschedule_event( $timestamp, 'culture_check_grace_periods' );
}
