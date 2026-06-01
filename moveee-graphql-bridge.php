<?php
/**
 * Plugin Name: Moveee GraphQL Bridge
 * Description: Bridges JetEngine taxonomies, WCFM vendor profiles, and product
 *              editorial metadata to WPGraphQL for the Moveee headless frontend.
 * Version: 1.4.8
 * Author: Antigravity
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

// ─────────────────────────────────────────────────────────────────────────────
// 0. WooCommerce Store API — disable nonce check for headless proxy requests.
//    The Next.js frontend proxies all cart calls through /api/cart (same origin
//    as the frontend), so CSRF is handled at the proxy layer. Removing the
//    nonce requirement avoids the cross-domain session/cookie complexity that
//    prevents the Store API from working in a headless setup.
// ─────────────────────────────────────────────────────────────────────────────
add_filter( 'woocommerce_store_api_disable_nonce_check', '__return_true' );

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
            'slug'           => [ 'type' => 'String' ],
            'storeName'      => [ 'type' => 'String' ],
            'bio'            => [ 'type' => 'String' ],
            'city'           => [ 'type' => 'String' ],
            'country'        => [ 'type' => 'String' ],
            'avatarUrl'      => [ 'type' => 'String' ],
            'bannerUrl'      => [ 'type' => 'String' ],
            'yearsActive'    => [ 'type' => 'String' ],
            'rating'         => [ 'type' => 'String' ],
            'productCount'   => [ 'type' => 'Int'    ],
            'website'        => [ 'type' => 'String' ],
            'instagram'      => [ 'type' => 'String' ],
            'twitter'        => [ 'type' => 'String' ],
            'directorySlug'  => [ 'type' => 'String' ],
        ],
    ] );

    // ── Root queries: list all vendors, and single vendor by slug ────────────
    register_graphql_field( 'RootQuery', 'moveeeVendors', [
        'type'        => [ 'list_of' => 'MoveeeVendorProfile' ],
        'description' => 'All active WCFM vendor profiles',
        'args'        => [ 'first' => [ 'type' => 'Int' ] ],
        'resolve'     => function ( $root, $args ) {
            global $wpdb;
            $first = min( absint( $args['first'] ?? 50 ), 200 );

            // 1. By role — covers most WCFM configurations.
            $user_ids = get_users( [
                'role__in' => [ 'wcfm_vendor', 'seller', 'vendor', 'wcfm_affiliate' ],
                'fields'   => 'ID',
                'number'   => $first,
            ] );

            // 2. By WCFM user meta — covers setups where the vendor role
            //    has a non-standard slug or was assigned differently.
            if ( empty( $user_ids ) ) {
                $user_ids = $wpdb->get_col( $wpdb->prepare(
                    "SELECT DISTINCT user_id FROM {$wpdb->usermeta}
                      WHERE meta_key = '_wcfm_vendor_data'
                      LIMIT %d",
                    $first
                ) );
            }

            // 3. By product authorship — any user attributed as vendor on
            //    a published product, regardless of role or meta.
            if ( empty( $user_ids ) ) {
                $user_ids = $wpdb->get_col( $wpdb->prepare(
                    "SELECT DISTINCT pm.meta_value
                       FROM {$wpdb->postmeta} pm
                       JOIN {$wpdb->posts} p ON p.ID = pm.post_id
                      WHERE pm.meta_key   = '_wcfm_product_author'
                        AND p.post_type   = 'product'
                        AND p.post_status = 'publish'
                      LIMIT %d",
                    $first
                ) );
            }

            $vendors = [];
            $seen    = [];
            foreach ( $user_ids as $uid ) {
                $uid = (int) $uid;
                if ( $uid && ! isset( $seen[ $uid ] ) ) {
                    $seen[ $uid ] = true;
                    $profile = moveee_vendor_profile_by_id( $uid );
                    if ( $profile ) {
                        $vendors[] = $profile;
                    }
                }
            }
            return $vendors;
        },
    ] );

    register_graphql_field( 'RootQuery', 'moveeeVendorBySlug', [
        'type'        => 'MoveeeVendorProfile',
        'description' => 'Single WCFM vendor profile by WordPress user nicename (URL slug)',
        'args'        => [ 'slug' => [ 'type' => 'String!' ] ],
        'resolve'     => function ( $root, $args ) {
            $user = get_user_by( 'slug', sanitize_title( $args['slug'] ?? '' ) );
            if ( ! $user ) return null;
            return moveee_vendor_profile_by_id( $user->ID );
        },
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

// Core helper: builds the full profile array from a vendor user ID.
function moveee_vendor_profile_by_id( int $vendor_id ): ?array {
    $user = get_userdata( $vendor_id );
    if ( ! $user ) return null;

    $d = get_user_meta( $vendor_id, '_wcfm_vendor_data', true );
    if ( ! is_array( $d ) ) $d = [];

    // Store name: WCFM data array → standalone meta → WP display name as last resort.
    $store_name = $d['store_name'] ?? get_user_meta( $vendor_id, '_store_name', true ) ?: $user->display_name;
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

    // Maker since: year the vendor registered on WordPress.
    $years = $user->user_registered
        ? (string) date( 'Y', strtotime( $user->user_registered ) )
        : '';

    // Rating: average WooCommerce product rating across the vendor's products.
    global $wpdb;
    $avg = (float) $wpdb->get_var( $wpdb->prepare(
        "SELECT AVG( CAST( pm.meta_value AS DECIMAL(3,1) ) )
           FROM {$wpdb->postmeta} pm
           JOIN {$wpdb->posts} p ON p.ID = pm.post_id
          WHERE pm.meta_key   = '_wc_average_rating'
            AND p.post_type   = 'product'
            AND p.post_status = 'publish'
            AND (
                    p.post_author = %d
                 OR p.ID IN (
                        SELECT post_id FROM {$wpdb->postmeta}
                         WHERE meta_key = '_wcfm_product_author' AND meta_value = %d
                    )
            )",
        $vendor_id, $vendor_id
    ) );
    $rating = $avg > 0 ? number_format( $avg, 1 ) : '';
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

    // Banner image: WCFM stores an attachment ID under the banner key.
    $banner_url  = '';
    $banner_id = $d['banner'] ?? get_user_meta( $vendor_id, '_wcfmmp_profile_banner', true );
    if ( $banner_id ) {
        $banner_url = (string) wp_get_attachment_image_url( (int) $banner_id, 'full' );
    }

    // Social links from WCFM store settings.
    $website   = $d['store_url']  ?? get_user_meta( $vendor_id, '_store_url',       true ) ?: '';
    $instagram = $d['instagram']  ?? get_user_meta( $vendor_id, '_wcfm_instagram',  true ) ?: '';
    $twitter   = $d['twitter']    ?? get_user_meta( $vendor_id, '_wcfm_twitter',    true ) ?: '';

    // Linked culture_directory entry — stored on the vendor user or queried by vendor slug.
    $dir_slug = (string) get_user_meta( $vendor_id, '_moveee_directory_slug', true );
    if ( ! $dir_slug ) {
        $dir_post = get_page_by_path( $user->user_nicename, OBJECT, 'culture_directory' );
        if ( $dir_post ) $dir_slug = $dir_post->post_name;
    }

    return [
        'slug'          => $user->user_nicename,
        'storeName'     => $store_name,
        'bio'           => $bio,
        'city'          => $city,
        'country'       => $country,
        'avatarUrl'     => $avatar_url,
        'bannerUrl'     => $banner_url,
        'yearsActive'   => $years,
        'rating'        => $rating,
        'productCount'  => $count,
        'website'       => $website,
        'instagram'     => $instagram,
        'twitter'       => $twitter,
        'directorySlug' => $dir_slug,
    ];
}

// Product-scoped wrapper used by the per-product GraphQL field resolver.
function moveee_vendor_profile( int $product_id ): ?array {
    $vendor_id = (int) ( get_post_meta( $product_id, '_wcfm_product_author', true )
                      ?: get_post_field( 'post_author', $product_id ) );
    if ( ! $vendor_id ) return null;
    return moveee_vendor_profile_by_id( $vendor_id );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Product editorial meta — reads from WooCommerce product custom fields.
//    When ACF is active the Repeater field for process_steps is stored as an
//    ACF Repeater; otherwise falls back to the raw JSON string.
// ─────────────────────────────────────────────────────────────────────────────
function moveee_product_meta( int $product_id ): array {
    // process_steps: prefer ACF Repeater (array of rows) → JSON-encode for GraphQL
    $steps_raw = '';
    if ( function_exists( 'get_field' ) ) {
        $rows = get_field( 'process_steps', $product_id );
        if ( is_array( $rows ) && ! empty( $rows ) ) {
            $steps_raw = wp_json_encode( $rows ) ?: '';
        }
    }
    if ( ! $steps_raw ) {
        $steps_raw = (string) get_post_meta( $product_id, 'process_steps', true );
    }

    return [
        'makerStory'       => (string) get_post_meta( $product_id, 'maker_story',        true ),
        'careInstructions' => (string) get_post_meta( $product_id, 'care_instructions',  true ),
        'processSteps'     => $steps_raw,
        'asSeenInPostId'   => (string) get_post_meta( $product_id, 'as_seen_in_post_id', true ),
        'deliveryInfo'     => (string) get_post_meta( $product_id, 'delivery_info',      true ),
    ];
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. ACF field groups — only registered when ACF (free or Pro) is active.
//    Fields appear as a "Moveee" metabox on the product edit screen and as
//    a "Vendor Info" section on the vendor's WP user profile.
// ─────────────────────────────────────────────────────────────────────────────
add_action( 'acf/init', function () {

    if ( ! function_exists( 'acf_add_local_field_group' ) ) return;

    // ── Product editorial fields ──────────────────────────────────────────────
    acf_add_local_field_group( [
        'key'      => 'group_moveee_product_meta',
        'title'    => 'Moveee Product Details',
        'location' => [ [ [ 'param' => 'post_type', 'operator' => '==', 'value' => 'product' ] ] ],
        'menu_order'            => 10,
        'position'              => 'normal',
        'style'                 => 'default',
        'label_placement'       => 'top',
        'instruction_placement' => 'label',
        'fields' => [
            [
                'key'          => 'field_moveee_maker_story',
                'label'        => 'Maker Story',
                'name'         => 'maker_story',
                'type'         => 'wysiwyg',
                'instructions' => 'Long-form narrative about the maker. Shown in the "Maker behind it" section.',
                'required'     => 0,
                'toolbar'      => 'basic',
                'media_upload' => 0,
            ],
            [
                'key'          => 'field_moveee_care_instructions',
                'label'        => 'Materials & Care Instructions',
                'name'         => 'care_instructions',
                'type'         => 'textarea',
                'instructions' => 'E.g. "Made from 100% organic linen. Hand wash cold." Shown in the Materials & Care accordion tab.',
                'required'     => 0,
                'rows'         => 4,
            ],
            [
                'key'          => 'field_moveee_delivery_info',
                'label'        => 'Delivery & Returns Info',
                'name'         => 'delivery_info',
                'type'         => 'textarea',
                'instructions' => 'Custom delivery/returns text for this product. Replaces the default text in the Delivery & Returns tab.',
                'required'     => 0,
                'rows'         => 4,
            ],
            [
                'key'          => 'field_moveee_as_seen_in_post_id',
                'label'        => 'As Seen In — Magazine Post ID',
                'name'         => 'as_seen_in_post_id',
                'type'         => 'number',
                'instructions' => 'Enter the WordPress post ID of the magazine article that features this product.',
                'required'     => 0,
                'min'          => 1,
                'step'         => 1,
            ],
            [
                'key'          => 'field_moveee_process_steps',
                'label'        => 'How It\'s Made — Process Steps',
                'name'         => 'process_steps',
                'type'         => 'repeater',
                'instructions' => 'Add each stage of the making process. Shown in the "How It\'s Made" section.',
                'required'     => 0,
                'min'          => 0,
                'max'          => 10,
                'layout'       => 'block',
                'button_label' => 'Add Step',
                'sub_fields'   => [
                    [
                        'key'      => 'field_moveee_step_title',
                        'label'    => 'Step Title',
                        'name'     => 'title',
                        'type'     => 'text',
                        'required' => 1,
                    ],
                    [
                        'key'      => 'field_moveee_step_desc',
                        'label'    => 'Description',
                        'name'     => 'desc',
                        'type'     => 'textarea',
                        'rows'     => 3,
                        'required' => 1,
                    ],
                    [
                        'key'          => 'field_moveee_step_duration',
                        'label'        => 'Duration (optional)',
                        'name'         => 'duration',
                        'type'         => 'text',
                        'instructions' => 'E.g. "2–3 days" or "45 minutes".',
                        'required'     => 0,
                    ],
                ],
            ],
        ],
    ] );

    // ── Vendor profile fields (shown on vendor WP user edit screen) ───────────
    acf_add_local_field_group( [
        'key'      => 'group_moveee_vendor_meta',
        'title'    => 'Moveee Vendor Info',
        'location' => [ [ [ 'param' => 'user_role', 'operator' => '==', 'value' => 'wcfm_vendor' ] ] ],
        'menu_order'      => 10,
        'position'        => 'normal',
        'style'           => 'default',
        'label_placement' => 'top',
        'fields' => [
            [
                'key'          => 'field_moveee_vendor_years',
                'label'        => 'Years Making',
                'name'         => '_wcfm_vendor_years',
                'type'         => 'text',
                'instructions' => 'E.g. "12" or "12+" — displayed in the vendor stats block.',
                'required'     => 0,
            ],
            [
                'key'          => 'field_moveee_vendor_rating',
                'label'        => 'Moveee Rating',
                'name'         => '_wcfm_vendor_rating',
                'type'         => 'text',
                'instructions' => 'E.g. "4.9" — displayed as "★ 4.9" in vendor stats. Leave blank to show "★ Vetted".',
                'required'     => 0,
            ],
        ],
    ] );

} );

// ─────────────────────────────────────────────────────────────────────────────
// 6. REST API endpoint — /wp-json/moveee/v1/vendors
//    Public endpoint that returns all WCFM vendor profiles as JSON.
//    Used by the Next.js /makers page as a reliable fallback when the
//    WPGraphQL moveeeVendors query is unavailable or returning empty.
// ─────────────────────────────────────────────────────────────────────────────
add_action( 'rest_api_init', function () {
    register_rest_route( 'moveee/v1', '/vendors', [
        'methods'             => 'GET',
        'permission_callback' => '__return_true',
        'args'                => [
            'first' => [ 'default' => 50, 'sanitize_callback' => 'absint' ],
        ],
        'callback'            => function ( WP_REST_Request $req ) {
            global $wpdb;
            $first = min( $req->get_param( 'first' ), 200 );

            // 1. By role.
            $user_ids = get_users( [
                'role__in' => [ 'wcfm_vendor', 'seller', 'vendor', 'wcfm_affiliate' ],
                'fields'   => 'ID',
                'number'   => $first,
            ] );

            // 2. By WCFM vendor meta.
            if ( empty( $user_ids ) ) {
                $user_ids = $wpdb->get_col( $wpdb->prepare(
                    "SELECT DISTINCT user_id FROM {$wpdb->usermeta}
                      WHERE meta_key = '_wcfm_vendor_data' LIMIT %d",
                    $first
                ) );
            }

            // 3. By _wcfm_product_author on published products.
            if ( empty( $user_ids ) ) {
                $user_ids = $wpdb->get_col( $wpdb->prepare(
                    "SELECT DISTINCT pm.meta_value
                       FROM {$wpdb->postmeta} pm
                       JOIN {$wpdb->posts} p ON p.ID = pm.post_id
                      WHERE pm.meta_key   = '_wcfm_product_author'
                        AND p.post_type   = 'product'
                        AND p.post_status = 'publish'
                      LIMIT %d",
                    $first
                ) );
            }

            $vendors = [];
            $seen    = [];
            foreach ( $user_ids as $uid ) {
                $uid = (int) $uid;
                if ( $uid && ! isset( $seen[ $uid ] ) ) {
                    $seen[ $uid ] = true;
                    $profile = moveee_vendor_profile_by_id( $uid );
                    if ( $profile ) $vendors[] = $profile;
                }
            }
            return rest_ensure_response( $vendors );
        },
    ] );
} );

// ─────────────────────────────────────────────────────────────────────────────
// 6b. REST API — /wp-json/moveee/v1/vendors/{slug}
//     Single vendor profile by user_nicename (URL slug).
// ─────────────────────────────────────────────────────────────────────────────
add_action( 'rest_api_init', function () {
    register_rest_route( 'moveee/v1', '/vendors/(?P<slug>[a-z0-9\-_]+)', [
        [
            'methods'             => 'GET',
            'permission_callback' => '__return_true',
            'callback'            => function ( WP_REST_Request $req ) {
                $slug = sanitize_title( $req->get_param( 'slug' ) );
                $user = get_user_by( 'slug', $slug );
                if ( ! $user ) {
                    return new WP_Error( 'not_found', 'Vendor not found.', [ 'status' => 404 ] );
                }
                $profile = moveee_vendor_profile_by_id( (int) $user->ID );
                if ( ! $profile ) {
                    return new WP_Error( 'not_found', 'Vendor not found.', [ 'status' => 404 ] );
                }
                return rest_ensure_response( $profile );
            },
        ],
    ] );
} );

// ─────────────────────────────────────────────────────────────────────────────
// 6c. REST API — /wp-json/moveee/v1/vendors/{slug}/products
//     Published WooCommerce products belonging to a WCFM vendor.
// ─────────────────────────────────────────────────────────────────────────────
add_action( 'rest_api_init', function () {
    register_rest_route( 'moveee/v1', '/vendors/(?P<slug>[a-z0-9\-_]+)/products', [
        [
            'methods'             => 'GET',
            'permission_callback' => '__return_true',
            'args'                => [
                'first' => [ 'default' => 24, 'sanitize_callback' => 'absint' ],
            ],
            'callback'            => function ( WP_REST_Request $req ) {
                global $wpdb;
                $slug  = sanitize_title( $req->get_param( 'slug' ) );
                $first = min( $req->get_param( 'first' ), 100 );
                $user  = get_user_by( 'slug', $slug );
                if ( ! $user ) {
                    return new WP_Error( 'not_found', 'Vendor not found.', [ 'status' => 404 ] );
                }
                $uid = (int) $user->ID;

                // Products authored by this user OR assigned via _wcfm_product_author.
                $post_ids = $wpdb->get_col( $wpdb->prepare(
                    "SELECT DISTINCT p.ID
                       FROM {$wpdb->posts} p
                  LEFT JOIN {$wpdb->postmeta} pm ON pm.post_id = p.ID AND pm.meta_key = '_wcfm_product_author'
                      WHERE p.post_type   = 'product'
                        AND p.post_status = 'publish'
                        AND ( p.post_author = %d OR pm.meta_value = %d )
                      LIMIT %d",
                    $uid, $uid, $first
                ) );

                $products = [];
                foreach ( $post_ids as $pid ) {
                    $product = wc_get_product( (int) $pid );
                    if ( ! $product ) continue;

                    $img_id  = $product->get_image_id();
                    $img_url = $img_id ? wp_get_attachment_image_url( $img_id, 'woocommerce_single' ) : null;

                    $products[] = [
                        'id'        => $product->get_id(),
                        'slug'      => $product->get_slug(),
                        'name'      => $product->get_name(),
                        'price'     => wc_price( $product->get_price() ),
                        'imageUrl'  => $img_url ?: null,
                        'imageAlt'  => $img_id ? get_post_meta( $img_id, '_wp_attachment_image_alt', true ) : '',
                    ];
                }
                return rest_ensure_response( $products );
            },
        ],
    ] );
} );

// ─────────────────────────────────────────────────────────────────────────────
// 7. WCFM vendor store URLs → Next.js frontend
//    WCFM generates links like cms.themoveee.com/store/vendor-slug throughout
//    WooCommerce (checkout page, product pages, emails). These filters rewrite
//    the URL at the source so it already points to the Next.js shop.
//    The template_redirect hook handles direct browser visits to the WP store page.
// ─────────────────────────────────────────────────────────────────────────────
function moveee_vendor_store_url( $url, $vendor_id ) {
    $user = get_userdata( (int) $vendor_id );
    if ( ! $user ) return $url;
    return 'https://themoveee.com/makers/' . rawurlencode( $user->user_nicename );
}
add_filter( 'wcfm_store_url',   'moveee_vendor_store_url', 10, 2 );
add_filter( 'wcfmmp_store_url', 'moveee_vendor_store_url', 10, 2 );

add_action( 'template_redirect', function () {
    // WCFM registers the store endpoint under the 'wcfm-store' query var.
    // Catch both the hyphenated var and the plain 'store' fallback.
    $slug = get_query_var( 'wcfm-store' ) ?: get_query_var( 'store' );
    if ( empty( $slug ) ) return;
    wp_redirect( 'https://themoveee.com/makers/' . rawurlencode( $slug ), 301 );
    exit;
}, 1 );
