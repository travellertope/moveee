import Link from "next/link";

export const metadata = {
  title: { absolute: "Submit | The Moveee Literary" },
  description:
    "Submission guidelines for The Moveee Literary — poetry, fiction, nonfiction, and translation.",
};

// Reuses legal.css's .legal-wrap/.legal-body/.contact-grid/.contact-card
// classes (already global via app/layout.tsx) rather than inventing a
// parallel set — this is a plain long-form guidelines page, the same shape
// as /contact and /ai-use.
//
// NOTE for whoever finalizes this page before launch: the reading windows,
// response time, and rights language below are reasonable starting-point
// defaults for a literary magazine, not confirmed editorial policy — check
// them against whatever The Moveee's editors actually decide before this
// goes live.
export default function LiterarySubmitPage() {
  return (
    <div className="legal-wrap">
      <div className="legal-eyebrow">The Moveee Literary</div>
      <h1>
        Submit Your <em>Work</em>
      </h1>
      <p className="legal-meta">Poetry · Fiction · Nonfiction · Translation</p>

      <div className="legal-body">
        <p>
          The Moveee Literary is a quarterly home for new poetry, fiction, nonfiction, and
          translation, published alongside every print edition. We&rsquo;re looking for work that
          takes real risks on the page — voice-driven, specific, and finished. We read every
          submission ourselves.
        </p>

        <h2>What We&rsquo;re Looking For</h2>
        <ul>
          <li>
            <strong>Poetry</strong> — up to 5 poems per submission. Any form, any length.
          </li>
          <li>
            <strong>Fiction</strong> — short stories or standalone excerpts, up to 4,000 words.
          </li>
          <li>
            <strong>Nonfiction</strong> — personal essays, reported essays, and true stories, up
            to 3,500 words.
          </li>
          <li>
            <strong>Translation</strong> — work translated into English, submitted alongside the
            original text where possible. Translators are credited by name, in full, wherever the
            piece appears.
          </li>
        </ul>

        <h2>Reading Periods</h2>
        <p>
          We read on a rolling quarterly basis, in step with each print edition. Open reading
          windows are announced on this page — if you don&rsquo;t see an open call below, we are
          currently closed to new submissions in that genre.
        </p>

        <h2>How to Submit</h2>
        <p>
          Email your submission as a single PDF or Word document to{" "}
          <a href="mailto:literary@themoveee.com">literary@themoveee.com</a>, with the genre and
          your name in the subject line — for example, &ldquo;Poetry Submission — Ada
          Nwosu.&rdquo; Include a short cover note and a one-line bio. Simultaneous submissions are
          welcome; just let us know right away if your work is accepted elsewhere.
        </p>

        <h2>Response Time & Rights</h2>
        <p>
          We aim to respond within 8–12 weeks. Accepted work is published under a first-publication
          agreement — rights revert to the author on publication. Compensation is confirmed
          directly with contributors at the time of acceptance.
        </p>

        <div className="contact-grid">
          <div className="contact-card">
            <div className="contact-card-label">Submissions</div>
            <h3>The Moveee Literary</h3>
            <p>Poetry, fiction, nonfiction, and translation for the quarterly literary supplement.</p>
            <a href="mailto:literary@themoveee.com">literary@themoveee.com</a>
          </div>
          <div className="contact-card">
            <div className="contact-card-label">Not Sure Where to Start?</div>
            <h3>Read The Moveee Literary</h3>
            <p>Get a feel for what we publish before you send us your work.</p>
            <Link href="/literary">Browse the archive →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
