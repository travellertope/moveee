import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Member Dashboard · The Moveee",
};

export default async function MemberPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login?callbackUrl=/member");
  }

  const user = session.user as any;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f0e8",
        padding: "60px 24px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div style={{ maxWidth: 680, margin: "0 auto" }}>
        <p
          style={{
            fontSize: 11,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#7a6f5c",
            margin: "0 0 16px",
          }}
        >
          The Moveee &mdash; Culture Community
        </p>

        <h1
          style={{
            fontSize: 32,
            fontWeight: 300,
            fontFamily: "Georgia, serif",
            margin: "0 0 6px",
            color: "#14110d",
          }}
        >
          Welcome back, {user.displayName || user.name || user.username}.
        </h1>

        <p style={{ fontSize: 15, color: "#7a6f5c", margin: "0 0 40px" }}>
          {user.tier === "patron" ? "Patron Member" : "Citizen Member"} &mdash;{" "}
          {user.primaryChapter?.name || "No chapter set"}
        </p>

        {/* Stats row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 16,
            marginBottom: 40,
          }}
        >
          {[
            { label: "Points", value: user.points ?? 0 },
            { label: "Tier", value: user.tier === "patron" ? "Patron" : "Citizen" },
            { label: "Primary Chapter", value: user.primaryChapter?.name || "—" },
            ...(user.secondaryChapter?.name
              ? [{ label: "Secondary Chapter", value: user.secondaryChapter.name }]
              : []),
          ].map(({ label, value }) => (
            <div
              key={label}
              style={{
                background: "#fffdf8",
                border: "1px solid #e8e0d4",
                borderRadius: 4,
                padding: "20px 20px 16px",
                textAlign: "center",
              }}
            >
              <span
                style={{
                  display: "block",
                  fontSize: 22,
                  fontWeight: 600,
                  color: "#14110d",
                  lineHeight: 1.2,
                  marginBottom: 6,
                }}
              >
                {value}
              </span>
              <span
                style={{
                  fontSize: 11,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#7a6f5c",
                }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* Referral block */}
        {user.referralCode && (
          <div
            style={{
              background: "#fffdf8",
              border: "1px solid #e8e0d4",
              borderRadius: 4,
              padding: "24px 28px",
              marginBottom: 28,
            }}
          >
            <h2
              style={{
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#14110d",
                margin: "0 0 10px",
              }}
            >
              Invite a Friend
            </h2>
            <p style={{ fontSize: 14, color: "#7a6f5c", margin: "0 0 12px" }}>
              Share your referral link and earn points when they join.
            </p>
            <code
              style={{
                display: "block",
                background: "#f5f0e8",
                padding: "10px 14px",
                borderRadius: 3,
                fontSize: 13,
                color: "#14110d",
                letterSpacing: "0.05em",
                wordBreak: "break-all",
              }}
            >
              {`https://themoveee.com/register?ref=${user.referralCode}`}
            </code>
          </div>
        )}

        {/* Quick links */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
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
            The Cultural Digest
          </Link>
          <Link
            href="/api/auth/signout"
            style={{
              fontSize: 11,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "#7a6f5c",
              textDecoration: "none",
              borderBottom: "1px solid currentColor",
              paddingBottom: 2,
            }}
          >
            Sign out
          </Link>
        </div>
      </div>
    </div>
  );
}
