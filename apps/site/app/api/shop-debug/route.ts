import { NextResponse } from "next/server";
import { GET_PRODUCTS, GET_PRODUCTS_UNORDERED } from "@/lib/wp";

/**
 * Temporary diagnostic for "the shop is empty".
 *
 * The shop fails silently by design: getWPData() returns null on a GraphQL
 * error, ShopArchiveWrapper turns that into `products = []`, and the page
 * renders an empty grid with nothing logged anywhere a non-developer can see.
 * This route runs the same queries the shop runs — bypassing the KV cache and
 * the circuit breaker so it always reflects live state — and reports what
 * WordPress actually says.
 *
 * Open https://themoveee.com/api/shop-debug in a browser.
 *
 * Safe to delete once the shop is fixed. It exposes no secrets: the GraphQL
 * endpoint it queries is already public, and only error messages and result
 * counts are returned.
 */

export const dynamic = "force-dynamic";

const WP_GRAPHQL_URL =
  process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://cms.themoveee.com/graphql";
const WP_BASE_URL = WP_GRAPHQL_URL.replace(/\/graphql\/?$/, "");

async function probe(label: string, query: string, variables: Record<string, any> = {}) {
  try {
    const res = await fetch(WP_GRAPHQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
    });
    const text = await res.text();
    let json: any;
    try {
      json = JSON.parse(text);
    } catch {
      return { label, httpStatus: res.status, parseError: true, bodyStart: text.slice(0, 300) };
    }
    const nodes = json?.data?.products?.nodes;
    return {
      label,
      httpStatus: res.status,
      graphqlErrors: (json.errors ?? []).map((e: any) => e?.message).slice(0, 5),
      dataIsNull: json.data === null || json.data === undefined,
      productCount: Array.isArray(nodes) ? nodes.length : null,
      firstTypename: Array.isArray(nodes) && nodes[0]?.__typename ? nodes[0].__typename : null,
      sample: Array.isArray(nodes)
        ? nodes.slice(0, 3).map((n: any) => n?.slug ?? n?.name ?? n?.databaseId ?? null)
        : null,
    };
  } catch (e: any) {
    return { label, networkError: e?.message ?? String(e) };
  }
}

export async function GET() {
  const [connectionExists, ordered, unordered, minimal, typeCheck] = await Promise.all([
    // 1. Does the products connection exist at all? (Is WooGraphQL active?)
    probe("1-products-connection-exists", `{ products(first: 1) { nodes { __typename } } }`),
    // 2. The exact query the shop runs today, with orderby.
    probe("2-shop-query-ordered", GET_PRODUCTS, { first: 3, category: null, tag: null }),
    // 3. Same query with the orderby removed (the fallback).
    probe("3-shop-query-unordered", GET_PRODUCTS_UNORDERED, { first: 3, category: null, tag: null }),
    // 4. Barest possible products query — isolates the field selection from the
    //    connection itself. If this returns products but 2 and 3 don't, the
    //    problem is a field in ProductFields, not the connection or the orderby.
    probe("4-minimal-fields", `{ products(first: 3) { nodes { __typename id } } }`),
    // 5. What type does the connection actually return? WooGraphQL changed this
    //    from Product to ProductUnion in newer versions, which would make the
    //    shop's `fragment ProductFields on Product` invalid.
    probe(
      "5-connection-type",
      `{ __type(name: "RootQueryToProductUnionConnection") { name } }`
    ),
  ]);

  // 6. Are products visible over WP's own REST API? Distinguishes "no published
  //    products / not publicly visible" from "GraphQL layer is broken".
  let rest: any;
  try {
    const res = await fetch(
      `${WP_BASE_URL}/wp-json/wp/v2/product?per_page=3&status=publish&_fields=id,slug,status`,
      { cache: "no-store" }
    );
    const body = await res.text();
    rest = {
      httpStatus: res.status,
      body: body.slice(0, 400),
    };
  } catch (e: any) {
    rest = { networkError: e?.message ?? String(e) };
  }

  return NextResponse.json(
    {
      note: "Diagnostic for the empty /shop grid. Paste this whole response back to Claude.",
      graphqlEndpoint: WP_GRAPHQL_URL,
      probes: [connectionExists, ordered, unordered, minimal, typeCheck],
      wpRestProducts: rest,
    },
    { headers: { "x-robots-tag": "noindex" } }
  );
}
