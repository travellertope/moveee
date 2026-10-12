"use client";

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

const BADGE_DESCRIPTIONS: Record<string, string> = {
  first_steps: "Completed your first actions in the community",
  regular: "A regular, trusted community member",
  culture_vulture: "Deeply engaged with all things culture",
  explorer: "Explored a wide range of content and communities",
  globetrotter: "Connected with members across the globe",
  commentator: "Contributed hundreds of quality comments",
  century_club: "Reached 100 reputation points",
  wordsmith: "Known for articulate and compelling writing",
  librarian: "Curated and shared an impressive reading list",
  philosopher: "Shared profound takes and cultural insights",
  influencer: "Your posts inspire others to engage",
  thought_leader: "Recognised as a leading voice in discussions",
  culture_archivist: "Documented and preserved cultural moments",
  knowledge_keeper: "A keeper of cultural knowledge and history",
  cultural_encyclopaedist: "Encyclopaedic knowledge of culture",
  cultural_specialist: "Deep expertise in a cultural field",
  deep_diver: "Digs deep into topics with thorough research",
  culture_liaison: "Bridging communities through culture",
  first_post: "Published your very first community post",
  prolific_poster: "Consistently creating quality content",
  century_scribe: "Written over 100 community posts",
  conversationalist: "Sparks and sustains great conversations",
  food_critic: "Trusted voice on food and dining",
  culture_guide: "A go-to guide for cultural recommendations",
  itinerary_master: "Expert at crafting cultural itineraries",
  poll_champion: "Engages the community through great polls",
  gem_hunter: "Discovers hidden cultural gems",
  connector: "Brings people together in the community",
  super_connector: "A hub of connections across the platform",
  profile_complete: "Completed your full member profile",
  directory_member: "Listed in the Moveee directory",
  newsletter_subscriber: "A loyal Moveee newsletter reader",
  monthly_member: "A proud monthly Moveee member",
  veteran: "A long-standing member of the community",
  annual_advocate: "Supporting Moveee year after year",
  rising_star: "Rapidly growing influence and reputation",
  taste_maker_badge: "A taste maker whose opinion sets trends",
  culture_authority_badge: "The highest authority on culture",
};

type BadgeColor = "amber" | "blue" | "purple" | "emerald" | "rose" | "orange" | "indigo";

const BADGE_COLORS: Record<string, BadgeColor> = {
  first_steps: "amber", culture_vulture: "amber", globetrotter: "amber",
  gem_hunter: "amber", taste_maker_badge: "amber", culture_authority_badge: "amber",
  commentator: "blue", century_club: "blue", connector: "blue", super_connector: "blue",
  wordsmith: "purple", philosopher: "purple", culture_archivist: "purple",
  knowledge_keeper: "purple", cultural_encyclopaedist: "purple", deep_diver: "purple",
  regular: "emerald", explorer: "emerald", first_post: "emerald", prolific_poster: "emerald",
  century_scribe: "emerald", profile_complete: "emerald", monthly_member: "emerald",
  veteran: "emerald", annual_advocate: "emerald",
  food_critic: "rose", culture_guide: "rose", itinerary_master: "rose",
  poll_champion: "rose", cultural_specialist: "rose", culture_liaison: "rose",
  influencer: "orange", thought_leader: "orange", rising_star: "orange",
  newsletter_subscriber: "indigo", directory_member: "indigo",
  librarian: "indigo", conversationalist: "indigo",
};

export default function BadgeShelf({ badges }: { badges: string[] }) {
  if (badges.length === 0) return null;

  return (
    <div className="prf-badge-shelf">
      {badges.map(badge => {
        const label = BADGE_LABELS[badge] ?? badge.replace(/_/g, " ");
        const emoji = BADGE_EMOJI[badge] ?? "🏅";
        const description = BADGE_DESCRIPTIONS[badge] ?? label;
        const color: BadgeColor = BADGE_COLORS[badge] ?? "blue";
        return (
          <div key={badge} className={`prf-badge-pill prf-badge-pill--${color}`}>
            <span className="prf-badge-pill-emoji">{emoji}</span>
            <span className="prf-badge-pill-label">{label}</span>
            <div className="prf-badge-pill-tooltip">{description}</div>
          </div>
        );
      })}
    </div>
  );
}
