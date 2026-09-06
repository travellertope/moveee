import Link from "next/link";

export const metadata = {
  title: { absolute: "Submit | The Moveee Literary" },
  description:
    "Submission guidelines for The Moveee Literary — fiction, poetry, essays, conversations, and translation.",
};

// Uses the section's own .lit-submit-* classes (literary.css) rather than
// the sitewide .legal-wrap/.contact-* classes the rest of Site A's
// long-form pages share — this section deliberately reads as its own
// standalone literary magazine, not a themed sub-page of Moveee Magazine.
//
// NOTE for whoever finalizes this page before launch: the reading windows,
// response time, and rights language below are reasonable starting-point
// defaults for a literary magazine, not confirmed editorial policy — check
// them against whatever The Moveee's editors actually decide before this
// goes live.
export default function LiterarySubmitPage() {
  return (
    <div className="lit-submit-wrap">
      <h1>Submit Your Work</h1>
      <p className="lit-sub">Fiction · Poetry · Essays · Conversations · In Translation</p>

      <div className="lit-submit-body">
        <p>
          The Moveee Literary is a quarterly home for new fiction, poetry, essays, conversations,
          and translation, published alongside every print edition. We&rsquo;re looking for work
          that takes real risks on the page — voice-driven, specific, and finished. We read every
          submission ourselves.
        </p>

        <h2>What We&rsquo;re Looking For</h2>
        <ul>
          <li>
            <strong>Fiction</strong> — short stories or standalone excerpts, up to 4,000 words.
          </li>
          <li>
            <strong>Poetry</strong> — up to 5 poems per submission. Any form, any length.
          </li>
          <li>
            <strong>Essays</strong> — literary, cultural, and personal essays, up to 3,500 words.
          </li>
          <li>
            <strong>Conversations</strong> — proposals for interviews with writers, artists, and
            thinkers. Pitch us the conversation, not just the subject.
          </li>
          <li>
            <strong>In Translation</strong> — work translated into English, submitted alongside
            the original text where possible. Translators are credited by name, in full, wherever
            the piece appears.
          </li>
        </ul>

        <h2>Reading Periods</h2>
        <p>
          We read on a rolling quarterly basis, in step with each print edition. Open reading
          windows are announced on this page — if you don&rsquo;t see an open call below, we are
          currently closed to new submissions in that section.
        </p>

        <h2>How to Submit</h2>
        <p>
          Email your submission as a single PDF or Word document to{" "}
          <a href="mailto:literary@themoveee.com">literary@themoveee.com</a>, with the section and
          your name in the subject line — for example, &ldquo;Poetry Submission — Ada
          Nwosu.&rdquo; Include a short cover note and a one-line bio. Simultaneous submissions are
          welcome; just let us know right away if your work is accepted elsewhere.
        </p>

        <h2>Response Time &amp; Rights</h2>
        <p>
          We aim to respond within 8–12 weeks. Accepted work is published under a
          first-publication agreement — rights revert to the author on publication. Compensation
          is confirmed directly with contributors at the time of acceptance.
        </p>

        <div className="lit-submit-cards">
          <div className="lit-submit-card">
            <h3>Submissions</h3>
            <p>Fiction, poetry, essays, conversations, and translation for the quarterly literary supplement.</p>
            <a href="mailto:literary@themoveee.com">literary@themoveee.com</a>
          </div>
          <div className="lit-submit-card">
            <h3>Not sure where to start?</h3>
            <p>Get a feel for what we publish before you send us your work.</p>
            <Link href="/literary">Browse the archive →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
