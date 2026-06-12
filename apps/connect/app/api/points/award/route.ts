import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const WP_API_URL = (process.env.NEXT_PUBLIC_WP_URL || "https://cms.themoveee.com") + "/wp-json/culture/v1";
const CULTURE_API_SECRET = process.env.CULTURE_API_SECRET;

// Server-side award table — amounts are never accepted from the client.
const AWARD_TABLE: Record<string, { credits: number; reputation: number }> = {
  community_post:       { credits: 5,  reputation: 10 },
  comment_posted:       { credits: 2,  reputation: 5  },
  post_liked:           { credits: 1,  reputation: 2  },
  profile_complete:     { credits: 10, reputation: 20 },
  event_rsvp:           { credits: 3,  reputation: 5  },
  directory_submission: { credits: 5,  reputation: 10 },
  poll_created:         { credits: 3,  reputation: 5  },
  quote_submitted:      { credits: 3,  reputation: 5  },
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { action?: string; post_id?: string | number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { action, post_id } = body;

  if (!action) {
    return NextResponse.json({ error: "Action is required." }, { status: 400 });
  }

  const amounts = AWARD_TABLE[action];
  if (!amounts) {
    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  }

  try {
    const user = session.user as any;
    const res = await fetch(`${WP_API_URL}/points/award`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${CULTURE_API_SECRET}`,
      },
      body: JSON.stringify({
        user_id: parseInt(user.id),
        action,
        post_id: post_id ? parseInt(String(post_id)) : undefined,
        credits: amounts.credits,
        reputation: amounts.reputation,
      }),
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Service temporarily unavailable." }, { status: 500 });
  }
}
