import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: { absolute: "Unsubscribe | The Moveee" },
  robots: { index: false, follow: false },
};

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";

interface Props {
  searchParams: Promise<{ email?: string; token?: string; c?: string }>;
}

async function doUnsubscribe(
  email: string,
  token: string,
  campaignId?: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch(
      `${WP_URL}/wp-json/culture/v1/newsletter-unsubscribe`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          token,
          campaign_id: campaignId ? parseInt(campaignId, 10) : undefined,
        }),
        cache: "no-store",
      }
    );
    const data = await res.json();
    return { success: !!data.success, message: data.message };
  } catch {
    return { success: false };
  }
}

export default async function UnsubscribePage({ searchParams }: Props) {
  const params = await searchParams;
  const rawEmail = params.email ?? "";
  const token = params.token ?? "";
  const campaignId = params.c;

  let status: "success" | "error" | "invalid" = "invalid";
  let email = "";

  if (rawEmail && token) {
    email = decodeURIComponent(rawEmail);
    const result = await doUnsubscribe(email, token, campaignId);
    status = result.success ? "success" : "error";
  }

  return (
    <div
      style={{
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#ffffff",
        padding: "40px 24px",
      }}
    >
      <div
        style={{
          maxWidth: 480,
          width: "100%",
          textAlign: "center",
          color: "#14110d",
        }}
      >
        <p
          style={{
            fontSize: 11,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#7a6f5c",
            marginBottom: 16,
          }}
        >
          The Moveee &mdash; Newsletters
        </p>

        {status === "success" && (
          <>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 300,
                margin: "0 0 16px",
                fontFamily: "Georgia, serif",
              }}
            >
              You&apos;ve been unsubscribed.
            </h1>
            {email && (
              <p
                style={{
                  color: "#7a6f5c",
                  fontSize: 15,
                  lineHeight: 1.6,
                  marginBottom: 28,
                }}
              >
                <strong>{email}</strong> has been removed from The Cultural
                Digest. You won&apos;t receive any more emails from us.
              </p>
            )}
            <p style={{ color: "#7a6f5c", fontSize: 13, marginBottom: 32 }}>
              Changed your mind? You can re-subscribe from any issue page.
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 300,
                margin: "0 0 16px",
                fontFamily: "Georgia, serif",
              }}
            >
              Something went wrong.
            </h1>
            <p
              style={{
                color: "#7a6f5c",
                fontSize: 15,
                lineHeight: 1.6,
                marginBottom: 28,
              }}
            >
              We couldn&apos;t process your unsubscribe request. The link may
              have expired. Please try again from a recent email, or contact us
              directly.
            </p>
          </>
        )}

        {status === "invalid" && (
          <>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 300,
                margin: "0 0 16px",
                fontFamily: "Georgia, serif",
              }}
            >
              Invalid link.
            </h1>
            <p
              style={{
                color: "#7a6f5c",
                fontSize: 15,
                lineHeight: 1.6,
                marginBottom: 28,
              }}
            >
              This unsubscribe link is missing required information. Please use
              the link from your original email.
            </p>
          </>
        )}

        <Link
          href="/newsletter"
          style={{
            fontSize: 11,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "#14110d",
            textDecoration: "none",
            borderBottom: "1px solid currentColor",
            paddingBottom: 2,
          }}
        >
          Browse the archive
        </Link>
      </div>
    </div>
  );
}
