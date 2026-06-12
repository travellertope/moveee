"use client";

import { useState } from "react";

const BADGE_LABELS: Record<string, string> = {
  first_steps: "First Steps", regular: "Regular", culture_vulture: "Culture Vulture",
  explorer: "Explorer", globetrotter: "Globetrotter",
  commentator: "Commentator", century_club: "Century Club",
  wordsmith: "Wordsmith", librarian: "Librarian", philosopher: "Philosopher",
  influencer: "Influencer", thought_leader: "Thought Leader",
  culture_archivist: "Culture Archivist", knowledge_keeper: "Knowledge Keeper",
  cultural_encyclopaedist: "Cultural Encyclopaedist",
  cultural_specialist: "Cultural Specialist", deep_diver: "Deep Diver",
  culture_liaison: "Culture Liaison",
  first_post: "First Post", prolific_poster: "Prolific Poster", century_scribe: "Century Scribe",
  conversationalist: "Conversationalist",
  food_critic: "Food Critic", culture_guide: "Culture Guide",
  itinerary_master: "Itinerary Master", poll_champion: "Poll Champion", gem_hunter: "Gem Hunter",
  connector: "Connector", super_connector: "Super Connector",
  profile_complete: "Profile Complete", directory_member: "In the Directory",
  newsletter_subscriber: "Newsletter Subscriber",
  monthly_member: "Monthly Member", veteran: "Veteran", annual_advocate: "Annual Advocate",
  rising_star: "Rising Star", taste_maker_badge: "Taste Maker", culture_authority_badge: "Culture Authority",
};

const BADGE_EMOJI: Record<string, string> = {
  first_steps: "🚩", regular: "🎖️", culture_vulture: "🦅",
  explorer: "🌍", globetrotter: "✈️",
  commentator: "💬", century_club: "💯",
  wordsmith: "✍️", librarian: "📚", philosopher: "🧠",
  influencer: "👍", thought_leader: "📣",
  culture_archivist: "🗂️", knowledge_keeper: "📖", cultural_encyclopaedist: "🏛️",
  cultural_specialist: "💬", deep_diver: "🔍", culture_liaison: "🤝",
  first_post: "📝", prolific_poster: "✏️", century_scribe: "📜",
  conversationalist: "🗣️",
  food_critic: "🍽️", culture_guide: "💡", itinerary_master: "🗺️",
  poll_champion: "📊", gem_hunter: "💎",
  connector: "🔗", super_connector: "🌐",
  profile_complete: "🪪", directory_member: "📇", newsletter_subscriber: "📬",
  monthly_member: "📅", veteran: "🎖️", annual_advocate: "⭐",
  rising_star: "🌟", taste_maker_badge: "👑", culture_authority_badge: "🏆",
};

export default function BadgeShelf({ badges }: { badges: string[] }) {
  const [active, setActive] = useState<string | null>(null);

  if (badges.length === 0) return null;

  return (
    <div className="prf-badge-shelf">
      {badges.map(badge => {
        const label = BADGE_LABELS[badge] ?? badge.replace(/_/g, " ");
        const emoji = BADGE_EMOJI[badge] ?? "🏅";
        const isActive = active === badge;
        return (
          <button
            key={badge}
            type="button"
            className={`prf-badge-icon${isActive ? " prf-badge-icon--active" : ""}`}
            onClick={() => setActive(isActive ? null : badge)}
            aria-label={label}
          >
            <span className="prf-badge-emoji">{emoji}</span>
            {isActive && <span className="prf-badge-tooltip">{label}</span>}
          </button>
        );
      })}
    </div>
  );
}
