import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/register",
        "/register/complete",
        "/forgot-password",
        "/reset-password",
        "/newsletter/unsubscribe",
        "/events/submit",
        "/events/admin",
        "/pulse/admin",
        "/directory/submit",
      ],
    },
    sitemap: "https://themoveee.com/sitemap.xml",
  };
}
