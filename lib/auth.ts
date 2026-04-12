import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";

export interface CultureUser {
  id: string;
  username: string;
  email: string;
  displayName: string;
  tier: "citizen" | "patron";
  points: number;
  primaryChapter: { id: number; name: string };
  secondaryChapter: { id: number; name: string };
  referralCode: string;
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
            tier: data.tier,
            points: data.points,
            primaryChapter: data.primary_chapter,
            secondaryChapter: data.secondary_chapter,
            referralCode: data.referral_code,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = (user as any).username;
        token.tier = (user as any).tier;
        token.points = (user as any).points;
        token.primaryChapter = (user as any).primaryChapter;
        token.secondaryChapter = (user as any).secondaryChapter;
        token.referralCode = (user as any).referralCode;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).username = token.username;
        (session.user as any).tier = token.tier;
        (session.user as any).points = token.points;
        (session.user as any).primaryChapter = token.primaryChapter;
        (session.user as any).secondaryChapter = token.secondaryChapter;
        (session.user as any).referralCode = token.referralCode;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
