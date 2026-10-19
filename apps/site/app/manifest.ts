import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Moveee",
    short_name: "Moveee",
    description: "Best in Culture — Moveee Magazine",
    // Smart launch: /pwa-launch redirects logged-in members to the community
    // feed at web.themoveee.com/feed, and guests to the magazine homepage.
    start_url: "/pwa-launch",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#14110d",
    theme_color: "#7a241c",
    categories: ["news", "entertainment", "lifestyle"],
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
        name: "Magazine",
        short_name: "Magazine",
        url: "/magazine",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Community Feed",
        short_name: "Feed",
        url: "/pwa-launch",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }],
      },
    ],
    screenshots: [
      {
        src: "/og-fallback.png",
        sizes: "1200x630",
        type: "image/png",
        form_factor: "wide",
        label: "Moveee Magazine — Best in Culture",
      },
    ],
  };
}
