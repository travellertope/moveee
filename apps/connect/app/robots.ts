import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/member/",
        "/login",
        "/register",
        "/forgot-password",
        "/reset-password",
        "/vendor/",
        "/connect/perks",
      ],
    },
    sitemap: "https://connect.themoveee.com/sitemap.xml",
  };
}
