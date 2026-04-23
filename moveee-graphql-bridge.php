<?php
/**
 * Plugin Name: Moveee GraphQL Bridge
 * Description: Bridges JetEngine taxonomies, WCFM vendor profiles, and product
 *              editorial metadata to WPGraphQL for the Moveee headless frontend.
 * Version: 1.3.0
 * Author: Antigravity
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Bridge JetEngine taxonomies to WPGraphQL
// ─────────────────────────────────────────────────────────────────────────────
add_filter( 'register_taxonomy_args', function ( $args, $taxonomy ) {
    $map = [
        'industry' => [ 'single' => 'industry',   'plural' => 'industries' ],
        'country'  => [ 'single' => 'country',    'plural' => 'countries'  ],
        'series'   => [ 'single' => 'seriesItem', 'plural' => 'series'     ],
    ];
    if ( isset( $map[ $taxonomy ] ) ) {
        $args['show_in_graphql']     = true;
        $args['graphql_single_name'] = $map[ $taxonomy ]['single'];
        $args['graphql_plural_name'] = $map[ $taxonomy ]['plural'];
    }
    return $args;
}, 10, 2 );

// ─────────────────────────────────────────────────────────────────────────────
// 2. Register custom GraphQL types + fields
//    Priority 99 — runs after WPGraphQL WooCommerce has registered its types.
// ─────────────────────────────────────────────────────────────────────────────
add_action( 'graphql_register_types', function () {

    // ── MoveeeVendorProfile ───────────────────────────────────────────────────
    register_graphql_object_type( 'MoveeeVendorProfile', [
        'description' => 'WCFM vendor / maker profile data',
        'fields'      => [
            'storeName'    => [ 'type' => 'String' ],
            'bio'          => [ 'type' => 'String' ],
            'city'         => [ 'type' => 'String' ],
            'country'      => [ 'type' => 'String' ],
            'avatarUrl'    => [ 'type' => 'String' ],
            'yearsActive'  => [ 'type' => 'String' ],
            'rating'       => [ 'type' => 'String' ],
            'productCount' => [ 'type' => 'Int'    ],
        ],
    ] );

    // ── MoveeeProductMeta ─────────────────────────────────────────────────────
    register_graphql_object_type( 'MoveeeProductMeta', [
        'description' => 'Moveee editorial / craft metadata for a product',
        'fields'      => [
            'makerStory'       => [ 'type' => 'String' ],
            'careInstructions' => [ 'type' => 'String' ],
            'processSteps'     => [ 'type' => 'String' ],
            'asSeenInPostId'   => [ 'type' => 'String' ],
            'deliveryInfo'     => [ 'type' => 'String' ],
        ],
    ] );

    // ── Attach to every concrete WooCommerce product type ────────────────────
    $product_types = [ 'SimpleProduct', 'VariableProduct', 'ExternalProduct', 'GroupProduct' ];

    foreach ( $product_types as $type ) {

        register_graphql_field( $type, 'vendorProfile', [
            'type'        => 'MoveeeVendorProfile',
            'description' => 'WCFM store / maker profile',
            'resolve'     => function ( $product ) {
                $pid = absint( $product->databaseId ?? 0 );
                if ( ! $pid ) return null;
                return moveee_vendor_profile( $pid );
            },
        ] );

        register_graphql_field( $type, 'moveeeMeta', [
            'type'        => 'MoveeeProductMeta',
            'description' => 'Moveee editorial product metadata',
            'resolve'     => function ( $product ) {
                $pid = absint( $product->databaseId ?? 0 );
                if ( ! $pid ) return null;
                return moveee_product_meta( $pid );
            },
        ] );
    }

}, 99 ); // ← after WPGraphQL WooCommerce (which runs at default priority 10)

// ─────────────────────────────────────────────────────────────────────────────
// 3. Vendor profile — reads from WCFM user meta
// ─────────────────────────────────────────────────────────────────────────────
function moveee_vendor_profile( int $product_id ): ?array {

    // WCFM stores vendor user ID in product meta; fall back to post author.
    $vendor_id = (int) ( get_post_meta( $product_id, '_wcfm_product_author', true )
                      ?: get_post_field( 'post_author', $product_id ) );

    if ( ! $vendor_id ) return null;

    // Main WCFM data array (serialised in user meta).
    $d = get_user_meta( $vendor_id, '_wcfm_vendor_data', true );
    if ( ! is_array( $d ) ) $d = [];

    $store_name = $d['store_name']       ?? get_user_meta( $vendor_id, '_store_name',         true ) ?: '';
    $bio        = $d['shop_description'] ?? get_user_meta( $vendor_id, '_wcfmmp_profile_bio', true ) ?: '';
    $city       = $d['store_city']       ?? get_user_meta( $vendor_id, '_store_city',         true ) ?: '';
    $country    = $d['store_country']    ?? get_user_meta( $vendor_id, '_store_country',      true ) ?: '';

    // Avatar: WCFM stores an attachment ID under the gravatar key.
    $avatar_url  = '';
    $gravatar_id = $d['gravatar'] ?? get_user_meta( $vendor_id, '_wcfmmp_profile_gravatar', true );
    if ( $gravatar_id ) {
        $avatar_url = (string) wp_get_attachment_image_url( (int) $gravatar_id, 'medium' );
    }
    if ( ! $avatar_url ) {
        $avatar_url = (string) get_avatar_url( $vendor_id, [ 'size' => 300 ] );
    }

    // yearsActive / rating — set by admin on the vendor's WP user profile
    // (WP Admin → Users → [vendor] → user meta _wcfm_vendor_years / _wcfm_vendor_rating).
    $years  = (string) get_user_meta( $vendor_id, '_wcfm_vendor_years',  true );
    $rating = (string) get_user_meta( $vendor_id, '_wcfm_vendor_rating', true );

    // Product count — published products with this vendor's ID in meta.
    // Falls back to authored posts if WCFM meta isn't populated.
    global $wpdb;
    $count = (int) $wpdb->get_var( $wpdb->prepare(
        "SELECT COUNT(DISTINCT p.ID)
           FROM {$wpdb->posts} p
           JOIN {$wpdb->postmeta} pm ON pm.post_id = p.ID
          WHERE p.post_type   = 'product'
            AND p.post_status = 'publish'
            AND pm.meta_key   = '_wcfm_product_author'
            AND pm.meta_value = %d",
        $vendor_id
    ) );
    if ( $count === 0 ) {
        $count = (int) count_user_posts( $vendor_id, 'product' );
    }

    return [
        'storeName'    => $store_name,
        'bio'          => $bio,
        'city'         => $city,
        'country'      => $country,
        'avatarUrl'    => $avatar_url,
        'yearsActive'  => $years,
        'rating'       => $rating,
        'productCount' => $count,
    ];
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Product editorial meta — reads from WooCommerce product custom fields
//    Set these in WP Admin → Products → [product] → Custom Fields panel,
//    or via the WCFM product editor if custom fields are added there.
// ─────────────────────────────────────────────────────────────────────────────
function moveee_product_meta( int $product_id ): array {
    return [
        'makerStory'       => (string) get_post_meta( $product_id, 'maker_story',        true ),
        'careInstructions' => (string) get_post_meta( $product_id, 'care_instructions',  true ),
        'processSteps'     => (string) get_post_meta( $product_id, 'process_steps',      true ),
        'asSeenInPostId'   => (string) get_post_meta( $product_id, 'as_seen_in_post_id', true ),
        'deliveryInfo'     => (string) get_post_meta( $product_id, 'delivery_info',      true ),
    ];
}
