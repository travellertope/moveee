<?php
/**
 * Member geolocation — a single, privacy-fuzzed lat/lng snapshot per user,
 * captured once from the device's own GPS (never continuous/background
 * tracking, never re-fetched automatically) and used only to power
 * proximity features — first consumer is the Stoop proximity banner on a
 * Place directory entry ("N people within N miles want to go too", see
 * Culture_Reading_Tracker::get_place_proximity()).
 *
 * Storage: usermeta only (_culture_geo_lat/_culture_geo_lng/
 * _culture_geo_updated_at) — no new table, this is a single value per user,
 * same shape as _culture_avatar_url etc.
 *
 * Privacy: coordinates are rounded to 2 decimal places (~1.1km at the
 * equator) before being stored, so no one's exact home/work address is ever
 * persisted — set_location() is the only write path and always rounds
 * first. No endpoint anywhere returns another user's coordinates, only
 * aggregate counts/distance-derived facts.
 */
class Culture_Geolocation {

	const META_LAT       = '_culture_geo_lat';
	const META_LNG        = '_culture_geo_lng';
	const META_UPDATED_AT = '_culture_geo_updated_at';

	/**
	 * @return array|WP_Error
	 */
	public static function set_location( int $user_id, float $lat, float $lng ) {
		if ( $lat < -90 || $lat > 90 || $lng < -180 || $lng > 180 ) {
			return new WP_Error( 'invalid_coordinates', 'Invalid coordinates.', array( 'status' => 400 ) );
		}

		// Fuzz to ~1km before storing — see class docblock.
		$lat = round( $lat, 2 );
		$lng = round( $lng, 2 );
		$now = current_time( 'mysql' );

		update_user_meta( $user_id, self::META_LAT, $lat );
		update_user_meta( $user_id, self::META_LNG, $lng );
		update_user_meta( $user_id, self::META_UPDATED_AT, $now );

		return array( 'hasLocation' => true, 'updatedAt' => $now );
	}

	public static function get_location( int $user_id ) : array {
		$lat = get_user_meta( $user_id, self::META_LAT, true );
		$lng = get_user_meta( $user_id, self::META_LNG, true );
		return array(
			'lat'       => ( '' !== $lat && null !== $lat ) ? (float) $lat : null,
			'lng'       => ( '' !== $lng && null !== $lng ) ? (float) $lng : null,
			'updatedAt' => get_user_meta( $user_id, self::META_UPDATED_AT, true ) ?: null,
		);
	}

	public static function has_location( int $user_id ) : bool {
		$loc = self::get_location( $user_id );
		return null !== $loc['lat'] && null !== $loc['lng'];
	}

	public static function clear_location( int $user_id ) {
		delete_user_meta( $user_id, self::META_LAT );
		delete_user_meta( $user_id, self::META_LNG );
		delete_user_meta( $user_id, self::META_UPDATED_AT );
	}

	/**
	 * Great-circle distance in miles (haversine formula).
	 */
	public static function distance_miles( float $lat1, float $lng1, float $lat2, float $lng2 ) : float {
		$earth_radius_miles = 3958.8;
		$lat1_rad           = deg2rad( $lat1 );
		$lat2_rad           = deg2rad( $lat2 );
		$delta_lat          = deg2rad( $lat2 - $lat1 );
		$delta_lng          = deg2rad( $lng2 - $lng1 );

		$a = sin( $delta_lat / 2 ) ** 2
			+ cos( $lat1_rad ) * cos( $lat2_rad ) * sin( $delta_lng / 2 ) ** 2;
		$c = 2 * atan2( sqrt( $a ), sqrt( 1 - $a ) );

		return $earth_radius_miles * $c;
	}
}
