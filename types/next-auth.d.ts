
import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      tier: "citizen" | "patron";
      points: number;
      badges: string[];
      visual_downloads_today: number;
    } & DefaultSession["user"]
  }

  interface User {
    id: string;
    username: string;
    tier: "citizen" | "patron";
    points: number;
    badges: string[];
    visual_downloads_today: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    tier: "citizen" | "patron";
    points: number;
    badges: string[];
    visualDownloadsToday: number;
  }
}
