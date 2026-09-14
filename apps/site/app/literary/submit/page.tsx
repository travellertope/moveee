import Link from "next/link";

export const metadata = {
  title: { absolute: "Submissions | The Moveee Literary" },
  description:
    "Submission guidelines for The Moveee Literary — fiction, flash fiction, essays, poetry, and translation. We want the work that lingers.",
};

// Uses the section's own .lit-submit-* classes (literary.css) rather than
// the sitewide .legal-wrap/.contact-* classes the rest of Site A's
// long-form pages share — this section deliberately reads as its own
// standalone literary magazine, not a themed sub-page of Moveee Magazine.
//
// Real, confirmed editorial policy (supplied directly by The Moveee's
// editors, September 2026) — supersedes the earlier placeholder copy that
// used to live here. Reading windows, response times, payment figures,
// submission fees, and rights language below are the actual policy, not
// starting-point defaults.
export default function LiterarySubmitPage() {
  return (
    <div className="lit-submit-wrap">
      <h1>Let&rsquo;s Talk About Submissions</h1>
      <p className="lit-sub">We want the work that lingers.</p>

      <div className="lit-submit-body">
        <h2>What We Are Looking For</h2>
        <p>
          We are interested in exceptional writing. Writing that takes a formal, emotional,
          intellectual, or linguistic risk &mdash; and earns it.
        </p>
        <p>
          We are not looking for work that simply sounds &ldquo;literary.&rdquo; We are looking
          for work that is alive.
        </p>
        <p>
          That may mean a story with a clean plot and devastating restraint. A strange story with
          its own internal logic. An essay that thinks on the page instead of merely reporting
          what its author already knows. A poem that leaves the language slightly altered behind
          it. A translation that carries not only meaning, but rhythm, pressure, humour, silence.
        </p>
        <p>
          We care less about where you have published, how many followers you have, whether you
          have an MFA, or how impressive your biography sounds. We care about what happens on the
          page: voice, precision, control, surprise, emotional or intellectual pressure, and the
          feeling that this work could have been written by no one else.
        </p>
        <p>If you have written something difficult to forget, send it.</p>

        <h2>A Note on Our Quarterly Themes</h2>
        <p>
          Our quarterly themes are doors. We do not want a piece that obediently illustrates a
          prompt. We want the theme to unlock something: a form you have not tried, a question
          you have avoided, an image that will not release you, a story that becomes stranger and
          more exact the closer you look at it.
        </p>
        <p>Take the theme seriously. Do not take it literally unless literal is where the best work leads you.</p>

        <h2>What You Can Send</h2>
        <ul>
          <li>
            <strong>Short Fiction</strong> (2,000&ndash;5,000 words) &mdash; Stories with
            authority, urgency, and formal nerve. We are open to realism, fabulism, speculative
            work, experimental, and everything that resists a useful label &mdash; as long as the
            story knows what it is doing.
          </li>
          <li>
            <strong>Flash Fiction</strong> (500&ndash;1,000 words) &mdash; Compression is not
            smallness. Give us a world in a few pages: a change, an image, a pressure point, a
            world at the edge of a match strike.
          </li>
          <li>
            <strong>Essays / Creative Nonfiction</strong> (2,000&ndash;5,000 words) &mdash;
            Personal, cultural, critical, reported, hybrid. We want essays that make the world
            rethink its systems and mechanics.
          </li>
          <li>
            <strong>Poetry</strong> (one suite of 3 poems) &mdash; Send three poems that can stand
            alone but deepen one another in company. We are drawn to precision, surprise, music,
            intelligence, and poems that know the difference between obscurity and mystery.
          </li>
          <li>
            <strong>Translations</strong> (2,000&ndash;5,000 words) &mdash; We welcome exceptional
            literary work translated into English. Send work with the appropriate permission of
            the original author or rightsholder. One outstanding translated work may be selected
            for each issue.
          </li>
        </ul>

        <h2>Why Send Your Work to The Moveee Literary?</h2>
        <p>
          We are building a small, selective magazine so that every piece we publish can receive
          real editorial attention. If we say yes, we want the work to leave our hands stronger
          than it entered them.
        </p>
        <ul>
          <li>
            <strong>Serious editing</strong> &mdash; Accepted work receives thoughtful editorial
            attention before publication.
          </li>
          <li>
            <strong>Payment</strong> &mdash; Accepted quarterly contributors are paid $15&ndash;$25
            per piece, depending on category and length. Exact terms are confirmed in the
            contributor agreement. For The Moveee Flash we pay a flat fee of $10 for every
            accepted piece.
          </li>
          <li>
            <strong>Promotion</strong> &mdash; Published writers receive dedicated promotion
            across The Moveee&rsquo;s channels, including contributor spotlights, pull-quotes,
            cross-promotion, and selected interviews.
          </li>
          <li>
            <strong>Prize consideration</strong> &mdash; Every published piece enters our internal
            prize consideration process. We will put our strongest eligible work forward for
            respected external awards and reconsider the year&rsquo;s best work for The Moveee
            Editor&rsquo;s Prize.
          </li>
          <li>
            <strong>Rights</strong> &mdash; You retain copyright. The Moveee Literary acquires
            only the agreed first-publication and archival rights set out in a formal contributor
            agreement; future commercial reuse requires a separate agreement.
          </li>
          <li>
            <strong>A real literary home</strong> &mdash; We want contributors to remain part of
            the magazine: in our archive, newsletter, conversations, events, and the wider
            community we are building around ambitious writing.
          </li>
        </ul>
        <p>
          We are deliberately small. The Moveee Literary is not trying to fill pages for the sake
          of having an issue. We would rather publish fewer exceptional pieces than meet a quota.
          Our long-term quarterly model is highly selective. That means we will say no often. It
          also means that when we say yes, we intend to make the yes matter.
        </p>

        <h2>The Moveee Flash</h2>
        <p className="lit-sub" style={{ marginTop: 0 }}>
          One African story. Every month. No submission fee.
        </p>
        <p>
          Between our major issues, The Moveee Literary publishes one exceptional flash fiction
          piece of 500&ndash;1,000 words each month through a free call created for African
          writers and African stories. There is no set quarterly theme: send the flash piece you
          are already obsessed with.
        </p>
        <p>
          The Moveee Flash is designed as a low-barrier doorway into the magazine and as a place
          for emerging writers to earn a serious literary byline. Selected work is published on
          our website and promoted across our channels. There is no submission fee, and we pay
          $10 for every accepted piece.
        </p>

        <h2>Before You Submit</h2>
        <p>
          <strong>Do I have to be an African writer to be published in The Moveee Literary?</strong>
          <br />
          For our quarterly issues, no. The Moveee Literary is rooted in Africa and the diaspora,
          but writers from anywhere in the world may submit. The monthly Moveee Flash call is
          reserved for African writers and African stories.
        </p>
        <p>
          <strong>Do you pay contributors?</strong>
          <br />
          Yes. For the quarterly magazine, the proposed contributor payment is $15&ndash;$25 per
          accepted piece, scaled by category and/or length. For The Moveee Flash, we pay a flat
          fee of $10 per accepted piece.
        </p>
        <p>
          <strong>Do you publish translations?</strong>
          <br />
          Yes. The Moveee Literary welcomes literary translation and plans to publish one
          exceptional translated work per issue. Appropriate permission from the original author
          or rightsholder is required.
        </p>
        <p>
          <strong>What happens to my copyright?</strong>
          <br />
          You keep it. Publication is governed by a contributor agreement covering
          first-publication and archival rights. Any later anthology, adaptation, translation, or
          commercial reuse beyond those rights requires a separate agreement.
        </p>
        <p>
          <strong>Will my work be considered for prizes?</strong>
          <br />
          Yes. Strong published work will be reviewed for eligible external prize nominations,
          including awards such as the Pushcart Prize, the Caine Prize for African Writing, Best
          Small Fictions, and the O. Henry Prize. The strongest work of the year will also be
          reconsidered for The Moveee Editor&rsquo;s Prize.
        </p>

        <h2>Submission Guidelines</h2>
        <p>
          <strong>Manuscript format</strong> &mdash; Submissions are made through our online
          submission form, where you paste your finished piece directly into the editor there.
          Please do not leave any identifying information in the piece itself &mdash; we read
          blindly, but if your work is accepted, we will reach out for your updated bio in
          preparation for amplification across our channels.
        </p>
        <p>
          <strong>Previously published work / reprints</strong> &mdash; We do not accept
          previously published work.
        </p>
        <p>
          <strong>Simultaneous submissions</strong> &mdash; We accept simultaneous submissions,
          but please let us know as soon as your work is accepted elsewhere.
        </p>
        <p>
          <strong>Response time</strong> &mdash; We will respond to every submission within
          8&ndash;12 weeks or earlier. Feel free to query your submission if we are yet to get
          back to you by the 12th week. For The Moveee Flash, we respond within 4 weeks or
          earlier.
        </p>
        <p>
          <strong>Translation payment</strong> &mdash; We pay a modest honorarium for every
          accepted translation.
        </p>
        <p>
          <strong>Submission fee</strong> &mdash; For our quarterly issues, we charge a submission
          fee of $3. Every quarter we have up to 100 free submission slots for writers who are
          unable to afford our submission fee &mdash; email us to request a waiver. We will
          publicly announce once we have reached our maximum quota for free submission slots. The
          Moveee Flash has no submission fee. The submission fee helps us run this magazine and
          pay our contributors &mdash; we do hope to stop charging it in the near future.
        </p>

        <h2>Send Us Your Work</h2>
        <p>
          Do not send us the version you think a literary magazine wants. Send us the version
          that only you could have written. The one with a pulse. The one that still surprises
          you when you return to it.
        </p>
        <p>
          Submissions go through our online form &mdash; you&rsquo;ll paste your piece straight
          into it, choose a section, and (for quarterly sections) pay the $3 submission fee right
          there. The Moveee Flash has no fee.
        </p>

        <div className="lit-submit-cards">
          <div className="lit-submit-card">
            <h3>Start Your Submission</h3>
            <p>Fiction, flash fiction, essays, poetry, conversations, and translation.</p>
            <Link href="/literary/submit/form">Submit your work &rarr;</Link>
          </div>
          <div className="lit-submit-card">
            <h3>Not sure where to start?</h3>
            <p>Get a feel for what we publish before you send us your work.</p>
            <Link href="/literary">Browse the archive &rarr;</Link>
          </div>
        </div>
        <p style={{ marginTop: 16 }}>
          Questions, or need a submission-fee waiver? Email{" "}
          <a href="mailto:literary@themoveee.com">literary@themoveee.com</a>.
        </p>
      </div>
    </div>
  );
}
