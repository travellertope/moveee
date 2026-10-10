import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Moveee",
    short_name: "Moveee",
    description: "Connect to Culture",
    start_url: "/feed",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#14110d",
    theme_color: "#7a241c",
    categories: ["social", "entertainment", "lifestyle"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcuts: [
      {
        name: "Home Feed",
        short_name: "Feed",
        url: "/feed",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Explore Topics",
        short_name: "Explore",
        url: "/discover",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Notifications",
        short_name: "Alerts",
        url: "/member/notifications",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
    screenshots: [
      {
        src: "/og-fallback.png",
        sizes: "1200x630",
        type: "image/png",
        // @ts-expect-error - form_factor is valid but not yet in Next.js types
        form_factor: "wide",
        label: "Moveee — Connect to Culture",
      },
    ],
  };
}
