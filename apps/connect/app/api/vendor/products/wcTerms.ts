// Shared by route.ts (create) and [id]/route.ts (update) — the vendor product
// form collects categories/tags as free-text comma-separated names (no picker
// UI), but WooCommerce's REST API wants numeric term IDs. This resolves each
// name to an existing term, creating one if none matches, so the form's
// existing "Comma-separated, e.g. Bags, Accessories" UX actually persists.

const CMS       = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const WC_KEY    = process.env.WC_CONSUMER_KEY    ?? "";
const WC_SECRET = process.env.WC_CONSUMER_SECRET ?? "";

function wcAuth() {
  return `consumer_key=${encodeURIComponent(WC_KEY)}&consumer_secret=${encodeURIComponent(WC_SECRET)}`;
}

export async function resolveTermIds(
  kind: "categories" | "tags",
  namesCsv: string
): Promise<number[]> {
  const names = namesCsv
    .split(",")
    .map((n) => n.trim())
    .filter(Boolean);
  if (!names.length) return [];

  const ids: number[] = [];
  for (const name of names) {
    try {
      const searchRes = await fetch(
        `${CMS}/wp-json/wc/v3/products/${kind}?search=${encodeURIComponent(name)}&${wcAuth()}`,
        { cache: "no-store" }
      );
      const existing = searchRes.ok ? await searchRes.json() : [];
      const match = existing.find((t: any) => t.name.toLowerCase() === name.toLowerCase());
      if (match) {
        ids.push(match.id);
        continue;
      }

      const createRes = await fetch(`${CMS}/wp-json/wc/v3/products/${kind}?${wcAuth()}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (createRes.ok) {
        const created = await createRes.json();
        ids.push(created.id);
      }
      // If creation failed (e.g. race with another request creating the same
      // term), just skip this one rather than failing the whole product save.
    } catch {
      // Network hiccup on one term shouldn't block saving the rest.
    }
  }
  return ids;
}
