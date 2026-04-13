import Link from "next/link";

export const metadata = {
  title: "AI Use Policy · The Moveee",
  description: "How Moveee Media uses Generative AI tools in our journalism and editorial processes.",
};

export default function AIUsePage() {
  return (
    <div className="legal-wrap">
      <div className="legal-eyebrow">Company · Editorial Standards</div>
      <h1>How We Use <em>AI</em></h1>
      <p className="legal-meta">Moveee Media Ltd &nbsp;·&nbsp; Editorial AI Policy</p>

      <div className="legal-body">
        <p>
          At Moveee Media, we embrace innovation and experimentation to enhance our journalism,
          reporting, and audience experience. As part of this commitment, we are integrating
          Generative AI (such as ChatGPT and other AI-powered tools) into various aspects of our
          work. However, <strong>AI is not a journalist</strong> — it is a tool that supports and
          accelerates the work of journalism by assisting with information gathering, content
          production, and distribution.
        </p>
        <p>
          While AI plays a role in streamlining certain processes, all editorial decisions and final
          content approvals remain the responsibility of <strong>human editors and journalists</strong>.
          Our use of AI includes:
        </p>

        <hr className="legal-divider" />

        <h2>Content Assembly & SEO Optimisation</h2>
        <p>
          AI may assist in assembling content before publication, such as suggesting SEO-friendly
          keywords, structuring briefs, and improving discoverability. However, no AI-generated
          content will be published without an editor&apos;s review.
        </p>

        <h2>Editing & Style Assistance</h2>
        <p>
          AI may serve as an initial reviewer for grammar, style, and structural edits, ensuring
          clarity and consistency. A human editor will always conduct a final review before content
          goes live.
        </p>

        <h2>Content Adaptation for Different Platforms</h2>
        <p>
          AI may be used to generate summaries, alternate versions, or platform-specific adaptations
          of our content. Regardless of format, all versions will be reviewed by an editor before
          publication.
        </p>

        <h2>Research & Data Support</h2>
        <p>
          AI can assist in gathering background information, analysing data, and surfacing relevant
          sources. However, all content will undergo thorough fact-checking and verification by
          reporters and editors.
        </p>

        <h2>Archival Search & Content Filtering</h2>
        <p>
          AI may help us filter through our archives to surface relevant information, past reporting,
          and recommendations based on previously published content.
        </p>

        <h2>AI-Generated External Content</h2>
        <p>
          Occasionally, we may publish non-newsroom content that includes AI-generated elements,
          such as automated sports scores, shopping guides, or data-driven reports. In such cases, we
          will <strong>clearly mark AI-generated content on the page</strong>.
        </p>

        <h2>Moderation & User Engagement</h2>
        <p>
          AI is used to help moderate user-generated content, detect misinformation, and maintain a
          respectful discussion environment on our platforms.
        </p>

        <hr className="legal-divider" />

        <p>
          Moveee Media remains committed to <strong>journalistic integrity, transparency, and
          accuracy</strong>. AI is a tool to enhance our work, not replace human judgment.
        </p>
        <p>
          If you have any questions about our AI usage, please reach out via our{" "}
          <Link href="/contact">Contact Us</Link> page.
        </p>
      </div>
    </div>
  );
}
