<?php
/**
 * One-time cleanup of duplicate terms in the `country` taxonomy (JetEngine-
 * registered, not by this plugin — see CLAUDE.md's "content geotagging"
 * entry for the full context). Editors have used this field loosely enough
 * that a few countries ended up with two separate terms instead of one:
 *
 *   uk              -> united-kingdom               (1 post  vs 8 posts)
 *   united-states    -> united-states-of-america      (1 post  vs 17 posts)
 *   cote-divoire     -> ivory-coast                   (1 post  vs 2 posts)
 *
 * Canonical picked as whichever term had more posts already tagged (Ivory
 * Coast additionally matches the site's own English editorial voice). This
 * reassigns every post on the duplicate term to the canonical term, then
 * deletes the now-empty duplicate — gated to run once, same shape as every
 * other one-time migration in this plugin (see maybe_backfill_* in
 * class-culture-hubs.php / class-culture-subscribers.php).
 *
 * Deliberately scoped to exact duplicates only — does NOT touch the
 * taxonomy's other data-quality issue (non-country terms like person names
 * or generic labels mixed in), which is a separate, not-yet-actioned
 * cleanup.
 */
class Culture_Country_Cleanup {

	const DUPLICATE_MAP = array(
		'uk'            => 'united-kingdom',
		'united-states' => 'united-states-of-america',
		'cote-divoire'  => 'ivory-coast',
	);

	public static function init() {
		// wp_loaded (not init) — JetEngine registers the `country` taxonomy
		// on its own init hook, and this plugin's init callback
		// (culture_community_init) runs at priority 5, so taxonomy_exists()
		// could see "not yet registered" if this ran on init too. wp_loaded
		// fires after every init-hooked callback (any priority) has run,
		// so the taxonomy is guaranteed to exist here if it exists at all.
		add_action( 'wp_loaded', array( __CLASS__, 'maybe_merge_duplicate_country_terms' ) );
	}

	public static function maybe_merge_duplicate_country_terms() {
		if ( '1' === get_option( 'culture_country_terms_deduped', '' ) ) {
			return;
		}
		if ( ! taxonomy_exists( 'country' ) ) {
			return; // JetEngine not active on this install/request.
		}

		foreach ( self::DUPLICATE_MAP as $dup_slug => $canonical_slug ) {
			$dup_term = get_term_by( 'slug', $dup_slug, 'country' );
			if ( ! $dup_term || is_wp_error( $dup_term ) ) {
				continue; // already merged (or never existed) on this install
			}
			$canonical_term = get_term_by( 'slug', $canonical_slug, 'country' );
			if ( ! $canonical_term || is_wp_error( $canonical_term ) ) {
				continue; // canonical term missing — don't delete the only copy
			}

			$post_ids = get_objects_in_term( $dup_term->term_id, 'country' );
			if ( ! is_wp_error( $post_ids ) ) {
				foreach ( $post_ids as $post_id ) {
					// $append = true — adds the canonical term alongside any
					// other countries already on the post, doesn't replace them.
					wp_set_object_terms( (int) $post_id, (int) $canonical_term->term_id, 'country', true );
				}
			}

			wp_delete_term( $dup_term->term_id, 'country' );
		}

		update_option( 'culture_country_terms_deduped', '1' );
	}
}
