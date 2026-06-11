/**
 * POST /api/community/report
 *
 * Records a spam/abuse report against a community post.
 * Each user can report a post once. After REPORT_THRESHOLD unique reports
 * the post is automatically moved to pending for admin review.
 *
 * Body: { postId: string, reason?: string }
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

const REPORT_THRESHOLD = 3;

const ALLOWED_REASONS = ["spam", "harassment", "misinformation", "inappropriate", "other"] as const;
type ReportReason = (typeof ALLOWED_REASONS)[number];

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in to report a post." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { postId, reason } = body as { postId?: string; reason?: string };

  if (!postId) {
    return NextResponse.json({ error: "postId is required." }, { status: 400 });
  }

  const user = session.user as any;
  const reporterId = String(user?.id ?? "");
  const safeReason: ReportReason = (ALLOWED_REASONS as readonly string[]).includes(reason ?? "")
    ? (reason as ReportReason)
    : "other";

  // Fetch current post meta.
  const getRes = await fetch(`${BASE}/community-posts/${postId}?_fields=meta,status`, {
    headers: { Authorization: `Basic ${AUTH}` },
    cache: "no-store",
  });

  if (!getRes.ok) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }

  const postData = await getRes.json().catch(() => ({}));

  // Already removed from public view — silently acknowledge.
  if (postData.status === "pending" || postData.status === "trash") {
    return NextResponse.json({ success: true, alreadyFlagged: true });
  }

  const meta = postData.meta ?? {};
  const reporterIds: string[] = JSON.parse(meta.community_reporter_ids || "[]");

  // Prevent duplicate reports from the same user.
  if (reporterIds.includes(reporterId)) {
    return NextResponse.json({ success: true, alreadyReported: true });
  }

  reporterIds.push(reporterId);
  const reportCount = reporterIds.length;

  const patch: Record<string, unknown> = {
    meta: {
      community_reporter_ids: JSON.stringify(reporterIds),
      community_report_count: reportCount,
      community_report_reason: safeReason,
    },
  };

  // Auto-flag to pending once the threshold is reached.
  if (reportCount >= REPORT_THRESHOLD) {
    patch.status = "pending";
  }

  const patchRes = await fetch(`${BASE}/community-posts/${postId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Basic ${AUTH}` },
    body: JSON.stringify(patch),
    cache: "no-store",
  });

  if (!patchRes.ok) {
    return NextResponse.json({ error: "Failed to record report." }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    flagged: reportCount >= REPORT_THRESHOLD,
  });
}
