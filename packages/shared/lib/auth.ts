import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";

/** Maps a WP user-profile REST response (login / login-google / passkey exchange) onto the JWT. */
function applyCultureProfile(token: any, data: any) {
  token.id = String(data.id);
  token.username = data.username;
  token.registeredAt = data.registered_at ?? 0;
  // KYC/contact PII intentionally omitted from JWT — fetched on-demand
  // from the profile API on settings pages only.
  token.city = data.city ?? "";
  token.occupation = data.occupation ?? "";
  token.tier = data.tier;
  token.interests = data.interests ?? [];
  token.credits = data.credits ?? 0;
  token.reputation = data.reputation ?? data.points ?? 0;
  token.reputationTier = data.reputation_tier ?? "member";
  token.dailyCreditsRemaining = data.daily_credits_remaining ?? 50;
  token.points = data.points ?? 0;
  token.badges = data.badges ?? [];
  token.referralCode = data.referral_code ?? "";
  token.referralCount = data.referral_count ?? 0;
  token.visualDownloadsToday = data.visual_downloads_today ?? 0;
  token.isVendor = data.is_vendor ?? false;
  token.vendorSlug = data.vendor_slug ?? "";
  token.avatarUrl = data.avatar_url ?? "";
  token.hasPasskey = data.has_passkey ?? false;
  token.passkeyCount = data.passkey_count ?? 0;
  token.creditsEscrowed = data.credits_escrowed ?? 0;
  token.name = data.display_name ?? token.name;
  token.email = data.email ?? token.email;
}

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error("NEXTAUTH_SECRET environment variable is not set. Authentication cannot start.");
}

export interface CultureUser {
  id: string;
  username: string;
  email: string;
  displayName: string;
  registeredAt: number;
  // Contact
  phone: string;
  whatsapp: string;
  // KYC
  gender: string;
  dateOfBirth: string;
  nationality: string;
  countryOfResidence: string;
  city: string;
  occupation: string;
  // Membership
  tier: "citizen" | "patron";
  // Interests (Phase 1)
  interests: string[];
  // Gamification — Phase 2
  credits: number;
  reputation: number;
  reputationTier: string;
  dailyCreditsRemaining: number;
  // Legacy (mirrors reputation for backwards compat)
  points: number;
  badges: string[];
  referralCode: string;
  referralCount: number;
  visual_downloads_today: number;
  // Vendor
  isVendor: boolean;
  vendorSlug: string;
  // Profile photo
  avatarUrl: string;
  // Passkeys (Phase 7)
  hasPasskey: boolean;
  passkeyCount: number;
  creditsEscrowed: number;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Culture Community",
      credentials: {
        username: { label: "Username or Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Passkey login: exchange short-lived token issued after WebAuthn verification.
        if ((credentials as any)?.passkeyToken) {
          try {
            const API_SECRET = process.env.CULTURE_API_SECRET ?? "";
            const res = await fetch(`${WP_URL}/wp-json/culture/v1/passkey/exchange-token`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${API_SECRET}` },
              body: JSON.stringify({ passkey_token: (credentials as any).passkeyToken }),
              cache: "no-store",
            });
            if (!res.ok) return null;
            const data = await res.json();
            return {
              id: String(data.id),
              name: data.display_name,
              email: data.email,
              username: data.username,
              phone: data.phone ?? "",
              whatsapp: data.whatsapp ?? "",
              gender: data.gender ?? "",
              dateOfBirth: data.date_of_birth ?? "",
              nationality: data.nationality ?? "",
              countryOfResidence: data.country_of_residence ?? "",
              city: data.city ?? "",
              occupation: data.occupation ?? "",
              registeredAt: data.registered_at ?? 0,
              tier: data.tier,
              interests: data.interests ?? [],
              credits: data.credits ?? 0,
              reputation: data.reputation ?? data.points ?? 0,
              reputationTier: data.reputation_tier ?? "member",
              dailyCreditsRemaining: data.daily_credits_remaining ?? 50,
              points: data.points ?? 0,
              badges: data.badges ?? [],
              referralCode: data.referral_code ?? "",
              referralCount: data.referral_count ?? 0,
              visual_downloads_today: data.visual_downloads_today ?? 0,
              isVendor: data.is_vendor ?? false,
              vendorSlug: data.vendor_slug ?? "",
              avatarUrl: data.avatar_url ?? "",
              hasPasskey: data.has_passkey ?? true,
              passkeyCount: data.passkey_count ?? 1,
              creditsEscrowed: data.credits_escrowed ?? 0,
            };
          } catch {
            return null;
          }
        }

        if (!credentials?.username || !credentials?.password) return null;

        try {
          const res = await fetch(`${WP_URL}/wp-json/culture/v1/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: credentials.username,
              password: credentials.password,
            }),
            cache: "no-store",
          });

          if (!res.ok) return null;

          const data = await res.json();

          return {
            id: String(data.id),
            name: data.display_name,
            email: data.email,
            username: data.username,
            phone: data.phone ?? "",
            whatsapp: data.whatsapp ?? "",
            gender: data.gender ?? "",
            dateOfBirth: data.date_of_birth ?? "",
            nationality: data.nationality ?? "",
            countryOfResidence: data.country_of_residence ?? "",
            city: data.city ?? "",
            occupation: data.occupation ?? "",
            registeredAt: data.registered_at ?? 0,
            tier: data.tier,
            interests: data.interests ?? [],
            credits: data.credits ?? 0,
            reputation: data.reputation ?? data.points ?? 0,
            reputationTier: data.reputation_tier ?? "member",
            dailyCreditsRemaining: data.daily_credits_remaining ?? 50,
            points: data.points ?? 0,
            badges: data.badges ?? [],
            referralCode: data.referral_code ?? "",
            referralCount: data.referral_count ?? 0,
            visual_downloads_today: data.visual_downloads_today ?? 0,
            isVendor: data.is_vendor ?? false,
            vendorSlug: data.vendor_slug ?? "",
            avatarUrl: data.avatar_url ?? "",
            hasPasskey: data.has_passkey ?? false,
            passkeyCount: data.passkey_count ?? 0,
            creditsEscrowed: data.credits_escrowed ?? 0,
          };
        } catch {
          return null;
        }
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user, account, trigger, session: updatePayload }) {
      // Google Sign-In — exchange the Google ID token for a WP profile on first sign-in.
      if (account?.provider === "google" && account.id_token) {
        try {
          const res = await fetch(`${WP_URL}/wp-json/culture/v1/login-google`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_token: account.id_token }),
            cache: "no-store",
          });
          if (res.ok) {
            applyCultureProfile(token, await res.json());
          }
        } catch {
          // Leave token as-is — session() will still see a token.id-less user, which
          // downstream code treats as unauthenticated.
        }
        return token;
      }

      // On initial sign-in — populate everything from the authorize response.
      if (user) {
        const u = user as any;
        token.id = u.id;
        token.username = u.username;
        token.registeredAt = u.registeredAt ?? 0;
        // KYC/contact PII intentionally omitted from JWT — fetched on-demand
        // from the profile API on settings pages only.
        token.city = u.city;
        token.occupation = u.occupation;
        token.tier = u.tier;
        token.interests = u.interests ?? [];
        token.credits = u.credits ?? 0;
        token.reputation = u.reputation ?? u.points ?? 0;
        token.reputationTier = u.reputationTier ?? "member";
        token.dailyCreditsRemaining = u.dailyCreditsRemaining ?? 50;
        token.points = u.points ?? 0;
        token.badges = u.badges;
        token.referralCode = u.referralCode;
        token.referralCount = u.referralCount;
        token.visualDownloadsToday = u.visual_downloads_today;
        token.isVendor = u.isVendor ?? false;
        token.vendorSlug = u.vendorSlug ?? "";
        token.avatarUrl = u.avatarUrl ?? "";
        token.hasPasskey = u.hasPasskey ?? false;
        token.passkeyCount = u.passkeyCount ?? 0;
        token.creditsEscrowed = u.creditsEscrowed ?? 0;
      }

      if (trigger === "update" && updatePayload) {
        if (updatePayload.isVendor             !== undefined) token.isVendor             = updatePayload.isVendor;
        if (updatePayload.vendorSlug           !== undefined) token.vendorSlug           = updatePayload.vendorSlug;
        if (updatePayload.avatarUrl            !== undefined) token.avatarUrl            = updatePayload.avatarUrl;
        if (updatePayload.interests            !== undefined) token.interests            = updatePayload.interests;
        if (updatePayload.credits              !== undefined) token.credits              = updatePayload.credits;
        if (updatePayload.reputation           !== undefined) token.reputation           = updatePayload.reputation;
        if (updatePayload.reputationTier       !== undefined) token.reputationTier       = updatePayload.reputationTier;
        if (updatePayload.dailyCreditsRemaining !== undefined) token.dailyCreditsRemaining = updatePayload.dailyCreditsRemaining;
        if (updatePayload.hasPasskey           !== undefined) token.hasPasskey           = updatePayload.hasPasskey;
        if (updatePayload.passkeyCount         !== undefined) token.passkeyCount         = updatePayload.passkeyCount;
        if (updatePayload.creditsEscrowed      !== undefined) token.creditsEscrowed      = updatePayload.creditsEscrowed;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const s = session.user as any;
        s.id = token.id;
        s.username = token.username;
        s.registeredAt = token.registeredAt ?? 0;
        // KYC/contact PII not stored in JWT — see profile settings pages.
        s.city = token.city;
        s.occupation = token.occupation;
        s.tier = token.tier;
        s.interests = token.interests ?? [];
        s.credits = token.credits ?? 0;
        s.reputation = token.reputation ?? 0;
        s.reputationTier = token.reputationTier ?? "member";
        s.dailyCreditsRemaining = token.dailyCreditsRemaining ?? 50;
        s.points = token.points ?? 0;
        s.badges = token.badges;
        s.referralCode = token.referralCode;
        s.referralCount = token.referralCount;
        s.visual_downloads_today = token.visualDownloadsToday;
        s.isVendor = token.isVendor ?? false;
        s.vendorSlug = token.vendorSlug ?? "";
        s.avatarUrl = token.avatarUrl ?? "";
        s.hasPasskey = token.hasPasskey ?? false;
        s.passkeyCount = token.passkeyCount ?? 0;
        s.creditsEscrowed = token.creditsEscrowed ?? 0;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production"
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: process.env.NODE_ENV === "production",
        domain: process.env.NODE_ENV === "production" ? ".themoveee.com" : undefined,
      },
    },
  },
};
