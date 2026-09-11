<?php
/**
 * Front-end (Next.js) draft preview.
 *
 * WordPress's own native preview (`?preview=true&p=ID&_ppp=nonce`) requires a
 * logged-in WP auth cookie set on the WordPress origin — that cookie never
 * reaches the separate Next.js frontend origin, so clicking "Preview" on a
 * draft `post` or `product` just renders the WP *theme's* markup, not the
 * real Moveee Magazine / Lifestyle page. This class overrides that button's
 * link for both post types so it opens the real Next.js page instead, in
 * "preview" state.
 *
 * Trust model: a short-lived, HMAC-signed token (id + type + expiry, signed
 * with the same `culture_api_secret` used everywhere else in this plugin as
 * a Bearer-token secret — see Culture_REST_API::verify_bearer_token()) is the
 * credential. It's verified entirely on this server; the Next.js side never
 * needs the secret itself, only the token, which it hands back to
 * GET /culture/v1/preview/resolve to fetch the actual draft content. No new
 * secret to keep in sync across WP option + Vercel env vars.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class Culture_Preview {

	/** How long a generated preview link stays valid, in seconds. */
	const TOKEN_TTL = 3600;

	/** Post types this covers — magazine articles and shop products. */
	const SUPPORTED_TYPES = array( 'post', 'product' );

	public static function init() {
		add_filter( 'preview_post_link', array( __CLASS__, 'filter_preview_link' ), 10, 2 );
	}

	/**
	 * Redirect WP Admin's native "Preview" / "Preview Changes" button to the
	 * Next.js preview entry point instead of the WP theme's own preview URL.
	 *
	 * @param string  $link
	 * @param WP_Post $post
	 * @return string
	 */
	public static function filter_preview_link( $link, $post ) {
		if ( ! $post instanceof WP_Post || ! in_array( $post->post_type, self::SUPPORTED_TYPES, true ) ) {
			return $link;
		}

		$secret = get_option( 'culture_api_secret', '' );
		if ( empty( $secret ) ) {
			// No secret configured — fall back to WP's own preview rather than
			// generating a token nothing can ever verify.
			return $link;
		}

		$token = self::make_token( $post->ID, $post->post_type, $secret );
		if ( ! $token ) {
			return $link;
		}

		$frontend_base = untrailingslashit(
			get_option( 'culture_preview_frontend_url', 'https://themoveee.com' )
		);

		return add_query_arg(
			array(
				'token' => $token,
				'type'  => $post->post_type,
				// Slug may still be empty on a brand-new, never-saved draft —
				// the resolve endpoint falls back to the post ID either way,
				// so an empty slug here is harmless, not a broken link.
				'slug'  => $post->post_name,
			),
			$frontend_base . '/api/preview'
		);
	}

	/**
	 * Build a signed, expiring preview token: base64url(id|type|expiry).signature
	 *
	 * @return string|false
	 */
	public static function make_token( $post_id, $post_type, $secret = null ) {
		if ( null === $secret ) {
			$secret = get_option( 'culture_api_secret', '' );
		}
		if ( empty( $secret ) || empty( $post_id ) || ! in_array( $post_type, self::SUPPORTED_TYPES, true ) ) {
			return false;
		}

		$expires = time() + self::TOKEN_TTL;
		$payload = $post_id . '|' . $post_type . '|' . $expires;
		$encoded = self::base64url_encode( $payload );
		$sig     = hash_hmac( 'sha256', $encoded, $secret );

		return $encoded . '.' . $sig;
	}

	/**
	 * Verify a token produced by make_token(). Returns the decoded
	 * { id, type, expires } on success, or a WP_Error on failure — never
	 * trust the caller-supplied id/type without going through this first.
	 *
	 * @return array|WP_Error
	 */
	public static function verify_token( $token ) {
		$secret = get_option( 'culture_api_secret', '' );
		if ( empty( $secret ) ) {
			return new WP_Error( 'preview_disabled', 'Preview is not configured.', array( 'status' => 503 ) );
		}
		if ( empty( $token ) || false === strpos( (string) $token, '.' ) ) {
			return new WP_Error( 'invalid_token', 'Malformed preview token.', array( 'status' => 400 ) );
		}

		list( $encoded, $sig ) = array_pad( explode( '.', (string) $token, 2 ), 2, '' );
		$expected_sig = hash_hmac( 'sha256', $encoded, $secret );
		if ( ! hash_equals( $expected_sig, $sig ) ) {
			return new WP_Error( 'invalid_token', 'Preview token signature mismatch.', array( 'status' => 403 ) );
		}

		$payload = self::base64url_decode( $encoded );
		$parts   = explode( '|', (string) $payload );
		if ( count( $parts ) !== 3 ) {
			return new WP_Error( 'invalid_token', 'Malformed preview token payload.', array( 'status' => 400 ) );
		}

		list( $post_id, $post_type, $expires ) = $parts;
		$post_id = absint( $post_id );
		$expires = absint( $expires );

		if ( ! $post_id || ! in_array( $post_type, self::SUPPORTED_TYPES, true ) ) {
			return new WP_Error( 'invalid_token', 'Malformed preview token payload.', array( 'status' => 400 ) );
		}
		if ( time() > $expires ) {
			return new WP_Error( 'token_expired', 'This preview link has expired — reopen it from WP Admin.', array( 'status' => 403 ) );
		}

		return array(
			'id'   => $post_id,
			'type' => $post_type,
		);
	}

	/**
	 * Resolve a verified token into the actual post/product payload the
	 * Next.js preview route needs — shaped as closely as practical to match
	 * what the equivalent GraphQL query (STORY_FIELDS_FRAGMENT / ProductFields
	 * in packages/shared/lib/wp.ts) already returns for published content, so
	 * the existing page components need minimal branching to render it.
	 *
	 * Deliberately best-effort on secondary fields (SEO title/description,
	 * series/industry taxonomies) — a draft is rarely fully filled in yet,
	 * and the frontend already degrades gracefully when those are absent.
	 *
	 * @return array|WP_Error
	 */
	public static function resolve( $post_id, $post_type ) {
		if ( 'product' === $post_type ) {
			return self::resolve_product( $post_id );
		}
		return self::resolve_post( $post_id );
	}

	private static function resolve_post( $post_id ) {
		$post = get_post( $post_id );
		if ( ! $post || 'post' !== $post->post_type ) {
			return new WP_Error( 'not_found', 'Post not found.', array( 'status' => 404 ) );
		}

		$thumb_id  = get_post_thumbnail_id( $post_id );
		$image_url = $thumb_id ? wp_get_attachment_image_url( $thumb_id, 'full' ) : null;

		return array(
			'id'            => (string) $post->ID,
			'databaseId'    => $post->ID,
			'title'         => get_the_title( $post ),
			'slug'          => $post->post_name,
			'date'          => get_post_time( 'c', true, $post ),
			'status'        => $post->post_status,
			'excerpt'       => self::apply_excerpt_filters( $post ),
			'content'       => apply_filters( 'the_content', $post->post_content ),
			'featuredImage' => $image_url ? array( 'node' => array( 'sourceUrl' => $image_url, 'altText' => get_post_meta( $thumb_id, '_wp_attachment_image_alt', true ) ) ) : null,
			'author'        => array(
				'node' => array(
					'name'       => get_the_author_meta( 'display_name', $post->post_author ),
					'slug'       => get_the_author_meta( 'user_nicename', $post->post_author ),
					'databaseId' => (int) $post->post_author,
					'description'=> get_the_author_meta( 'description', $post->post_author ),
					'avatar'     => array( 'url' => get_avatar_url( $post->post_author ) ),
				),
			),
			'categories'    => array( 'nodes' => self::terms_as_nodes( $post_id, 'category' ) ),
			'tags'          => array( 'nodes' => self::terms_as_nodes( $post_id, 'post_tag' ) ),
			'industries'    => array( 'nodes' => self::terms_as_nodes( $post_id, 'industry' ) ),
			'series'        => array( 'nodes' => self::terms_as_nodes( $post_id, 'series', true ) ),
			'countries'     => array( 'nodes' => self::terms_as_nodes( $post_id, 'country' ) ),
			// A draft rarely has SEO fields filled in yet, and generateMetadata()
			// already falls back to "{title} | Moveee Magazine" when these are
			// null — leaving them unset here is a safe default, not a gap.
			'seoTitle'      => null,
			'seoDescription'=> null,
			'asToldTo'      => get_post_meta( $post_id, '_culture_as_told_to', true ) ?: null,
			'featuredProducts' => array(),
		);
	}

	private static function resolve_product( $product_id ) {
		if ( ! function_exists( 'wc_get_product' ) ) {
			return new WP_Error( 'woocommerce_inactive', 'WooCommerce is not active.', array( 'status' => 503 ) );
		}
		$product = wc_get_product( $product_id );
		if ( ! $product ) {
			return new WP_Error( 'not_found', 'Product not found.', array( 'status' => 404 ) );
		}

		$image_id     = $product->get_image_id();
		$gallery_ids  = $product->get_gallery_image_ids();
		$is_variable  = $product->is_type( 'variable' );

		$attributes = array();
		foreach ( $product->get_attributes() as $attribute ) {
			$attributes[] = array(
				'name'      => $attribute->get_name(),
				'label'     => wc_attribute_label( $attribute->get_name() ),
				'options'   => $attribute->get_options(),
				'variation' => $attribute->get_variation(),
			);
		}

		$payload = array(
			'id'               => (string) $product->get_id(),
			'databaseId'       => $product->get_id(),
			'name'             => $product->get_name(),
			'slug'             => $product->get_slug(),
			'status'           => $product->get_status(),
			'description'      => apply_filters( 'the_content', $product->get_description() ),
			'shortDescription' => apply_filters( 'woocommerce_short_description', $product->get_short_description() ),
			'image'            => $image_id ? array( 'sourceUrl' => wp_get_attachment_image_url( $image_id, 'full' ), 'altText' => get_post_meta( $image_id, '_wp_attachment_image_alt', true ) ) : null,
			'galleryImages'    => array(
				'nodes' => array_values( array_filter( array_map( function ( $id ) {
					$url = wp_get_attachment_image_url( $id, 'full' );
					return $url ? array( 'sourceUrl' => $url, 'altText' => get_post_meta( $id, '_wp_attachment_image_alt', true ) ) : null;
				}, $gallery_ids ) ) ),
			),
			'productCategories'=> array( 'nodes' => self::terms_as_nodes( $product->get_id(), 'product_cat' ) ),
			'productTags'      => array( 'nodes' => self::terms_as_nodes( $product->get_id(), 'product_tag' ) ),
			'price'            => $product->get_price_html() ? wc_price( $product->get_price() ) : null,
			'regularPrice'     => $product->get_regular_price() !== '' ? wc_price( $product->get_regular_price() ) : null,
			'salePrice'        => $product->get_sale_price() !== '' ? wc_price( $product->get_sale_price() ) : null,
			'stockStatus'      => strtoupper( $product->get_stock_status() ),
			'stockQuantity'    => $product->get_stock_quantity(),
			'onSale'           => $product->is_on_sale(),
			'attributes'       => array( 'nodes' => $attributes ),
			'variations'       => array( 'nodes' => array() ),
		);

		if ( $is_variable ) {
			$variations = array();
			foreach ( $product->get_available_variations() as $v ) {
				$variations[] = array(
					'price'       => isset( $v['display_price'] ) ? wc_price( $v['display_price'] ) : null,
					'stockStatus' => isset( $v['is_in_stock'] ) && $v['is_in_stock'] ? 'IN_STOCK' : 'OUT_OF_STOCK',
					'attributes'  => array(
						'nodes' => array_map( function ( $name, $value ) {
							return array( 'name' => $name, 'value' => $value );
						}, array_keys( $v['attributes'] ?? array() ), array_values( $v['attributes'] ?? array() ) ),
					),
				);
			}
			$payload['variations'] = array( 'nodes' => $variations );
		}

		return $payload;
	}

	/**
	 * Excerpt via WP's own filtered `get_the_excerpt()` needs global $post
	 * set up correctly for some themes/plugins that hook it — safer to build
	 * a plain trimmed excerpt directly from post_excerpt/post_content instead
	 * of relying on global state this REST context doesn't have.
	 */
	private static function apply_excerpt_filters( $post ) {
		if ( ! empty( $post->post_excerpt ) ) {
			return apply_filters( 'the_excerpt', $post->post_excerpt );
		}
		return wp_trim_words( wp_strip_all_tags( $post->post_content ), 55 );
	}

	/**
	 * @param bool $graceful When true (used for taxonomies that may not exist
	 *   on every install, e.g. `series`), returns [] instead of throwing when
	 *   the taxonomy isn't registered.
	 */
	private static function terms_as_nodes( $object_id, $taxonomy, $graceful = false ) {
		if ( $graceful && ! taxonomy_exists( $taxonomy ) ) {
			return array();
		}
		if ( ! taxonomy_exists( $taxonomy ) ) {
			return array();
		}
		$terms = wp_get_object_terms( $object_id, $taxonomy );
		if ( is_wp_error( $terms ) || empty( $terms ) ) {
			return array();
		}
		return array_map( function ( $term ) {
			return array( 'name' => $term->name, 'slug' => $term->slug );
		}, $terms );
	}

	private static function base64url_encode( $data ) {
		return rtrim( strtr( base64_encode( $data ), '+/', '-_' ), '=' );
	}

	private static function base64url_decode( $data ) {
		$padded = str_pad( $data, strlen( $data ) % 4 === 0 ? strlen( $data ) : strlen( $data ) + 4 - ( strlen( $data ) % 4 ), '=' );
		return base64_decode( strtr( $padded, '-_', '+/' ) );
	}
}
