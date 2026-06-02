import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const WP_URL = process.env.NEXT_PUBLIC_WP_URL ?? "https://cms.themoveee.com";

export interface CultureUser {
  id: string;
  username: string;
  email: string;
  displayName: string;
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
  primaryChapter: { id: number; name: string };
  secondaryChapter: { id: number; name: string };
  // Gamification
  points: number;
  badges: string[];
  referralCode: string;
  referralCount: number;
  visual_downloads_today: number;
  // Vendor
  isVendor: boolean;
  vendorSlug: string;
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
            phone: data.phone ?? "",
            whatsapp: data.whatsapp ?? "",
            gender: data.gender ?? "",
            dateOfBirth: data.date_of_birth ?? "",
            nationality: data.nationality ?? "",
            countryOfResidence: data.country_of_residence ?? "",
            city: data.city ?? "",
            occupation: data.occupation ?? "",
            tier: data.tier,
            primaryChapter: data.primary_chapter,
            secondaryChapter: data.secondary_chapter,
            points: data.points,
            badges: data.badges ?? [],
            referralCode: data.referral_code ?? "",
            referralCount: data.referral_count ?? 0,
            visual_downloads_today: data.visual_downloads_today ?? 0,
            isVendor: data.is_vendor ?? false,
            vendorSlug: data.vendor_slug ?? "",
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
        const u = user as any;
        token.id = u.id;
        token.username = u.username;
        token.phone = u.phone;
        token.whatsapp = u.whatsapp;
        token.gender = u.gender;
        token.dateOfBirth = u.dateOfBirth;
        token.nationality = u.nationality;
        token.countryOfResidence = u.countryOfResidence;
        token.city = u.city;
        token.occupation = u.occupation;
        token.tier = u.tier;
        token.primaryChapter = u.primaryChapter;
        token.secondaryChapter = u.secondaryChapter;
        token.points = u.points;
        token.badges = u.badges;
        token.referralCode = u.referralCode;
        token.referralCount = u.referralCount;
        token.visualDownloadsToday = u.visual_downloads_today;
        token.isVendor = u.isVendor ?? false;
        token.vendorSlug = u.vendorSlug ?? "";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const s = session.user as any;
        s.id = token.id;
        s.username = token.username;
        s.phone = token.phone;
        s.whatsapp = token.whatsapp;
        s.gender = token.gender;
        s.dateOfBirth = token.dateOfBirth;
        s.nationality = token.nationality;
        s.countryOfResidence = token.countryOfResidence;
        s.city = token.city;
        s.occupation = token.occupation;
        s.tier = token.tier;
        s.primaryChapter = token.primaryChapter;
        s.secondaryChapter = token.secondaryChapter;
        s.points = token.points;
        s.badges = token.badges;
        s.referralCode = token.referralCode;
        s.referralCount = token.referralCount;
        s.visual_downloads_today = token.visualDownloadsToday;
        s.isVendor = token.isVendor ?? false;
        s.vendorSlug = token.vendorSlug ?? "";
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
