<?php
/**
 * Vendor shipping-zone ownership — WooCommerce shipping zones are a
 * global, store-wide construct with no native per-vendor scoping. This
 * class maps a zone to the vendor who created it so the Next.js vendor
 * dashboard APIs can enforce that a vendor only manages their own zones.
 */
class Culture_Vendor_Shipping_Zones {

    private static function table() : string {
        global $wpdb;
        return $wpdb->prefix . 'culture_vendor_shipping_zones';
    }

    /**
     * Record that a zone belongs to a vendor. Called right after the
     * zone is created via the WooCommerce REST API.
     */
    public static function assign_owner( int $zone_id, int $vendor_id ) : bool {
        if ( $zone_id <= 0 || $vendor_id <= 0 ) {
            return false;
        }
        global $wpdb;

        if ( self::get_owner( $zone_id ) !== 0 ) {
            // Already owned — do not overwrite (e.g. a backfilled zone).
            return false;
        }

        $inserted = $wpdb->insert(
            self::table(),
            array(
                'zone_id'    => $zone_id,
                'vendor_id'  => $vendor_id,
                'created_at' => current_time( 'mysql' ),
            ),
            array( '%d', '%d', '%s' )
        );

        return (bool) $inserted;
    }

    /** Returns the owning vendor's user ID, or 0 if unowned. */
    public static function get_owner( int $zone_id ) : int {
        global $wpdb;
        $vendor_id = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT vendor_id FROM " . self::table() . " WHERE zone_id = %d",
                $zone_id
            )
        );
        return $vendor_id ? (int) $vendor_id : 0;
    }

    public static function is_owner( int $zone_id, int $vendor_id ) : bool {
        if ( $zone_id <= 0 || $vendor_id <= 0 ) {
            return false;
        }
        return self::get_owner( $zone_id ) === $vendor_id;
    }

    /** All zone IDs owned by a given vendor. */
    public static function get_owned_zone_ids( int $vendor_id ) : array {
        if ( $vendor_id <= 0 ) {
            return array();
        }
        global $wpdb;
        $rows = $wpdb->get_col(
            $wpdb->prepare(
                "SELECT zone_id FROM " . self::table() . " WHERE vendor_id = %d",
                $vendor_id
            )
        );
        return array_map( 'intval', $rows );
    }
}
