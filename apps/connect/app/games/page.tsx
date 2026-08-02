import type { Metadata } from "next";
import GamesHubClient from "./GamesHubClient";
import "@/app/games.css";

export const metadata: Metadata = {
  title: { absolute: "Culture Games — The Moveee" },
  description:
    "Test your knowledge of culture through trivia, quotes, and daily challenges.",
};

export default function GamesHub() {
  return <GamesHubClient />;
}
