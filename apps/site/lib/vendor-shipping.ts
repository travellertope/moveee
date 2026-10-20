const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const API_SECRET = process.env.CULTURE_API_SECRET ?? "";

/** Returns true if `vendorId` is the recorded owner of `zoneId`. */
export async function assertVendorOwnsZone(zoneId: string | number, vendorId: string | number): Promise<boolean> {
  try {
    const res = await fetch(
      `${WP_URL}/wp-json/culture/v1/vendor/shipping-zone-owner?zone_id=${encodeURIComponent(String(zoneId))}`,
      { headers: { Authorization: `Bearer ${API_SECRET}` }, cache: "no-store" }
    );
    if (!res.ok) return false;
    const data = await res.json();
    return Number(data.vendor_id) === Number(vendorId);
  } catch {
    return false;
  }
}

/** Returns the set of zone IDs owned by `vendorId`. */
export async function getOwnedZoneIds(vendorId: string | number): Promise<number[]> {
  try {
    const res = await fetch(
      `${WP_URL}/wp-json/culture/v1/vendor/shipping-zone-owner?vendor_id=${encodeURIComponent(String(vendorId))}`,
      { headers: { Authorization: `Bearer ${API_SECRET}` }, cache: "no-store" }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.zone_ids) ? data.zone_ids.map(Number) : [];
  } catch {
    return [];
  }
}

/** Records that `zoneId` belongs to `vendorId`. Safe to call once, right after zone creation. */
export async function recordZoneOwner(zoneId: string | number, vendorId: string | number): Promise<void> {
  try {
    await fetch(`${WP_URL}/wp-json/culture/v1/vendor/shipping-zone-owner`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_SECRET}` },
      body: JSON.stringify({ zone_id: Number(zoneId), vendor_id: Number(vendorId) }),
      cache: "no-store",
    });
  } catch {
    // Non-fatal — ownership recording failure shouldn't break zone creation;
    // the zone will simply be unowned until backfilled.
  }
}
