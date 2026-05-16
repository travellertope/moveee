/**
 * POST /api/community/react
 *
 * Toggles an emoji reaction on a community post or Pulse story.
 * Session required; per-user deduplication is handled client-side via
 * localStorage — the server trusts the action field ('add' | 'remove').
 *
 * Body: { itemId: string, itemType: 'community' | 'pulse', emoji: 'love' | 'fire' | 'clap', action: 'add' | 'remove' }
 * Response: { love: number, fire: number, clap: number }
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";
const BASE   = `${WP_URL}/wp-json/wp/v2`;
const AUTH   = Buffer.from(
  `${process.env.WP_USERNAME ?? ""}:${process.env.WP_APP_PASSWORD ?? ""}`
).toString("base64");

const VALID_EMOJIS  = ["love", "fire", "clap"] as const;
const VALID_ACTIONS = ["add", "remove"] as const;
type Emoji  = (typeof VALID_EMOJIS)[number];
type Action = (typeof VALID_ACTIONS)[number];

function restBase(itemType: string): string {
  return itemType === "pulse" ? "pulse-stories" : "posts";
}

async function fetchCurrentCounts(
  base: string,
  itemId: string
): Promise<{ love: number; fire: number; clap: number }> {
  const res = await fetch(`${BASE}/${base}/${itemId}?_fields=meta`, {
    headers: { Authorization: `Basic ${AUTH}` },
    cache: "no-store",
  });
  if (!res.ok) return { love: 0, fire: 0, clap: 0 };
  const body = await res.json().catch(() => ({}));
  const meta = body?.meta ?? {};
  return {
    love: Number(meta.reaction_love ?? 0),
    fire: Number(meta.reaction_fire ?? 0),
    clap: Number(meta.reaction_clap ?? 0),
  };
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in to react." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { itemId, itemType, emoji, action } = body as {
    itemId?:   string;
    itemType?: string;
    emoji?:    string;
    action?:   string;
  };

  if (
    !itemId ||
    !["community", "pulse"].includes(itemType ?? "") ||
    !(VALID_EMOJIS as readonly string[]).includes(emoji ?? "") ||
    !(VALID_ACTIONS as readonly string[]).includes(action ?? "")
  ) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const wpBase = restBase(itemType!);
  const current = await fetchCurrentCounts(wpBase, itemId);

  const metaKey = `reaction_${emoji}` as `reaction_${Emoji}`;
  const delta    = (action as Action) === "add" ? 1 : -1;
  const newCount = Math.max(0, current[emoji as Emoji] + delta);

  const updated = { ...current, [emoji as Emoji]: newCount };

  const patchRes = await fetch(`${BASE}/${wpBase}/${itemId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Basic ${AUTH}` },
    body: JSON.stringify({ meta: { [metaKey]: newCount } }),
    cache: "no-store",
  });

  if (!patchRes.ok) {
    return NextResponse.json({ error: "Failed to update reaction." }, { status: 500 });
  }

  return NextResponse.json(updated);
}
