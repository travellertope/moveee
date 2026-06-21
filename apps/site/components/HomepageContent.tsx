import MoveeeZone from "@/components/MoveeeZone";
import MagazineSpotlight from "@/components/MagazineSpotlight";
import type { EditionSlug } from "@/lib/editions";

interface Props {
  coverStory: any;
  stories: any[];
  products: any[];
  edition: EditionSlug;
  latestIssue?: any;
  latestIssueStories?: any[];
  interviewStories?: any[];
  seriesTheRadar?: any[];
  seriesPortraits?: any[];
  seriesTheLane?: any[];
  seriesThinkCreative?: any[];
}

export default function HomepageContent({ latestIssue }: Props) {
  return (
    <>
      {/* ===== MOVEEE ZONE: HERO + WHAT IS MOVEEE + FEATURE GRID + MEMBERSHIP + DOWNLOAD ===== */}
      <MoveeeZone />

      {/* ===== MOVEEE MAGAZINE SPOTLIGHT — last section on the page ===== */}
      <MagazineSpotlight latestIssue={latestIssue} />
    </>
  );
}
