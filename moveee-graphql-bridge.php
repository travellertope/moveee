<?php
/**
 * Plugin Name: Moveee GraphQL Bridge
 * Description: Bridges JetEngine taxonomies, WCFM vendor profiles, and product
 *              editorial metadata to WPGraphQL for the Moveee headless frontend.
 * Version: 1.2.0
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
        'industry' => [ 'single' => 'industry',    'plural' => 'industries' ],
        'country'  => [ 'single' => 'country',     'plural' => 'countries'  ],
        'series'   => [ 'single' => 'seriesItem',  'plural' => 'series'     ],
    ];
    if ( isset( $map[ $taxonomy ] ) ) {
        $args['show_in_graphql']     = true;
        $args['graphql_single_name'] = $map[ $taxonomy ]['single'];
        $args['graphql_plural_name'] = $map[ $taxonomy ]['plural'];
    }
    return $args;
}, 10, 2 );

// ─────────────────────────────────────────────────────────────────────────────
// 2. Register custom GraphQL types and fields (runs after WPGraphQL is ready)
// ─────────────────────────────────────────────────────────────────────────────
add_action( 'graphql_register_types', function () {

    // ── MoveeeVendorProfile type ──────────────────────────────────────────────
    register_graphql_object_type( 'MoveeeVendorProfile', [
        'description' => 'WCFM vendor / maker profile data',
        'fields'      => [
            'storeName'    => [ 'type' => 'String', 'description' => 'Store display name'           ],
            'bio'          => [ 'type' => 'String', 'description' => 'Store biography / about text' ],
            'city'         => [ 'type' => 'String', 'description' => 'City the vendor is based in'  ],
            'country'      => [ 'type' => 'String', 'description' => 'Country'                      ],
            'avatarUrl'    => [ 'type' => 'String', 'description' => 'Store avatar image URL'       ],
            'yearsActive'  => [ 'type' => 'String', 'description' => 'Years the maker has been active (set via WP user meta _wcfm_vendor_years)' ],
            'rating'       => [ 'type' => 'String', 'description' => 'Moveee vetting rating (set via WP user meta _wcfm_vendor_rating)'          ],
            'productCount' => [ 'type' => 'Int',    'description' => 'Published products in shop'   ],
        ],
    ] );

    // ── MoveeeProductMeta type ────────────────────────────────────────────────
    register_graphql_object_type( 'MoveeeProductMeta', [
        'description' => 'Moveee editorial / craft metadata for a product',
        'fields'      => [
            'makerStory'       => [ 'type' => 'String', 'description' => 'Maker story narrative — set as product custom field maker_story'             ],
            'careInstructions' => [ 'type' => 'String', 'description' => 'Materials & care text — set as product custom field care_instructions'       ],
            'processSteps'     => [ 'type' => 'String', 'description' => 'JSON array of {title,desc,duration} steps — product custom field process_steps' ],
            'asSeenInPostId'   => [ 'type' => 'String', 'description' => 'WP post ID for the "As Seen In" magazine feature — product custom field as_seen_in_post_id' ],
            'deliveryInfo'     => [ 'type' => 'String', 'description' => 'Delivery & returns text — product custom field delivery_info (falls back to global default if empty)' ],
        ],
    ] );

    // ── Attach both fields to every WooCommerce product type ─────────────────
    $product_types = [ 'SimpleProduct', 'VariableProduct', 'ExternalProduct', 'GroupProduct' ];

    foreach ( $product_types as $type ) {
        register_graphql_field( $type, 'vendorProfile', [
            'type'        => 'MoveeeVendorProfile',
            'description' => 'WCFM store / maker profile for this product',
            'resolve'     => 'moveee_resolve_vendor_profile',
        ] );

        register_graphql_field( $type, 'moveeeMeta', [
            'type'        => 'MoveeeProductMeta',
            'description' => 'Moveee editorial metadata for this product',
            'resolve'     => 'moveee_resolve_product_meta',
        ] );
    }
} );

// ─────────────────────────────────────────────────────────────────────────────
// 3. Resolver: WCFM vendor profile
// ─────────────────────────────────────────────────────────────────────────────
function moveee_resolve_vendor_profile( $product ) {
    $product_id = $product->ID ?? null;
    if ( ! $product_id ) {
        return null;
    }

    // WCFM stores the vendor user ID in product meta; fall back to post author.
    $vendor_id = get_post_meta( $product_id, '_wcfm_product_author', true )
              ?: get_post_field( 'post_author', $product_id );

    if ( ! $vendor_id ) {
        return null;
    }

    // Main WCFM vendor data (serialised array stored in user meta).
    $d = get_user_meta( $vendor_id, '_wcfm_vendor_data', true );
    if ( ! is_array( $d ) ) {
        $d = [];
    }

    // Store name
    $store_name = ! empty( $d['store_name'] )
        ? $d['store_name']
        : ( get_user_meta( $vendor_id, '_store_name', true ) ?: '' );

    // Bio / description
    $bio = ! empty( $d['shop_description'] )
        ? $d['shop_description']
        : ( get_user_meta( $vendor_id, '_wcfmmp_profile_bio', true ) ?: '' );

    // City
    $city = ! empty( $d['store_city'] )
        ? $d['store_city']
        : ( get_user_meta( $vendor_id, '_store_city', true ) ?: '' );

    // Country
    $country = ! empty( $d['store_country'] )
        ? $d['store_country']
        : ( get_user_meta( $vendor_id, '_store_country', true ) ?: '' );

    // Avatar URL — WCFM stores an attachment ID in gravatar key
    $avatar_url   = '';
    $gravatar_id  = $d['gravatar'] ?? get_user_meta( $vendor_id, '_wcfmmp_profile_gravatar', true );
    if ( $gravatar_id ) {
        $avatar_url = wp_get_attachment_image_url( $gravatar_id, 'medium' ) ?: '';
    }
    if ( ! $avatar_url ) {
        $avatar_url = get_avatar_url( $vendor_id, [ 'size' => 300 ] ) ?: '';
    }

    // Years active + rating — set by the Moveee admin on the vendor's WP
    // user profile (WP Admin → Users → [vendor] → custom fields section)
    // or via WP CLI: wp user meta update <ID> _wcfm_vendor_years "12"
    $years  = get_user_meta( $vendor_id, '_wcfm_vendor_years',  true ) ?: '';
    $rating = get_user_meta( $vendor_id, '_wcfm_vendor_rating', true ) ?: '';

    // Product count — published products attributed to this vendor
    $product_count = (int) ( new WP_Query( [
        'post_type'      => 'product',
        'post_status'    => 'publish',
        'posts_per_page' => -1,
        'fields'         => 'ids',
        'meta_query'     => [ [
            'key'   => '_wcfm_product_author',
            'value' => $vendor_id,
        ] ],
    ] ) )->found_posts;

    // Fall back to authored posts if WCFM meta isn't populated
    if ( $product_count === 0 ) {
        $product_count = (int) count_user_posts( $vendor_id, 'product' );
    }

    return [
        'storeName'    => $store_name,
        'bio'          => $bio,
        'city'         => $city,
        'country'      => $country,
        'avatarUrl'    => $avatar_url,
        'yearsActive'  => $years,
        'rating'       => $rating,
        'productCount' => $product_count,
    ];
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Resolver: Moveee product editorial metadata
//    All fields are set as standard WooCommerce product custom fields
//    (WP Admin → Products → [product] → Custom Fields panel, or via
//     WCFM product editor if custom fields are added there).
// ─────────────────────────────────────────────────────────────────────────────
function moveee_resolve_product_meta( $product ) {
    $product_id = $product->ID ?? null;
    if ( ! $product_id ) {
        return null;
    }

    return [
        'makerStory'       => get_post_meta( $product_id, 'maker_story',        true ) ?: '',
        'careInstructions' => get_post_meta( $product_id, 'care_instructions',  true ) ?: '',
        'processSteps'     => get_post_meta( $product_id, 'process_steps',      true ) ?: '',
        'asSeenInPostId'   => get_post_meta( $product_id, 'as_seen_in_post_id', true ) ?: '',
        'deliveryInfo'     => get_post_meta( $product_id, 'delivery_info',      true ) ?: '',
    ];
}
