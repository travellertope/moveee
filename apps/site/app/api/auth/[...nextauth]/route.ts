import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// apps/site had no NextAuth route of its own before this — getServerSession()
// already worked here (it just decodes the shared .themoveee.com session
// cookie, no API route required), but next-auth/react's signIn() posts to
// this app's own origin, so it needs a real handler to land on. Added for
// the Literary magic-OTP sign-in (see components/LiterarySubscribeForm.tsx)
// so a visitor can sign in without leaving themoveee.com — same shared
// authOptions as apps/connect, so the resulting session works on both.
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
