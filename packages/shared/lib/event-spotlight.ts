import type { FeedItem } from "./unified-feed";

function isEventItem(item: FeedItem): boolean {
  if (item.type === "happening") return true;
  if (item.type === "community" && item.templateType === "event") return true;
  return false;
}

/** Hide events missing 2+ of {image, venue/location, price/admission}. */
function isQualifying(item: FeedItem): boolean {
  const hasImage = Boolean(item.image);
  const hasVenue = Boolean(item.venueAddress || item.location);
  const hasPrice = Boolean(item.admission);
  const present = [hasImage, hasVenue, hasPrice].filter(Boolean).length;
  return present >= 2;
}

function completenessScore(item: FeedItem): number {
  const fields = [Boolean(item.image), Boolean(item.venueAddress || item.location), Boolean(item.admission)];
  const present = fields.filter(Boolean).length;
  return (present / fields.length) * 30;
}

function rsvpScore(rsvpCount: number): number {
  if (rsvpCount <= 0) return 0;
  return Math.min(20, Math.log2(rsvpCount + 1) * 5);
}

function scoreEvent(item: FeedItem): number {
  const featuredScore = item.isFeatured ? 40 : 0;
  const organiserScore = item.organiserDirectoryId ? 10 : 0;
  return featuredScore + completenessScore(item) + rsvpScore(Number(item.rsvpCount) || 0) + organiserScore;
}

function eventDateOf(item: FeedItem): string {
  return item.eventDate || item.date;
}

/**
 * Merges editorial happening items + community events (templateType === "event")
 * from the unified feed into a ranked Spotlight list. Returns [] (hide the module)
 * when fewer than 2 qualifying events exist. Falls back to soonest-upcoming-first
 * sort when none of the scoring inputs (isFeatured/rsvpCount/organiserDirectoryId)
 * are present on any candidate.
 */
export function getSpotlightEvents(items: FeedItem[], limit = 10): FeedItem[] {
  const candidates = items.filter(isEventItem).filter(isQualifying);

  if (candidates.length < 2) return [];

  const hasScoringInputs = candidates.some(
    (e) => e.isFeatured || (Number(e.rsvpCount) || 0) > 0 || e.organiserDirectoryId
  );

  const sorted = hasScoringInputs
    ? [...candidates].sort((a, b) => scoreEvent(b) - scoreEvent(a))
    : [...candidates].sort(
        (a, b) => new Date(eventDateOf(a)).getTime() - new Date(eventDateOf(b)).getTime()
      );

  return sorted.slice(0, limit);
}
