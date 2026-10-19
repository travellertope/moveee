export const metadata = {
  title: { absolute: "About Us | The Moveee Literary" },
  description:
    "The Moveee Literary is an international independent literary and culture magazine devoted to publishing exceptional writing within Africa and beyond.",
};

// Reuses the .lit-submit-* classes (literary.css) — a plain long-form
// content layout, not literally scoped to the submissions page despite the
// name; the About page and the Submissions page share the same shape
// (eyebrow, h1, body copy with h2 section breaks).
export default function LiteraryAboutPage() {
  return (
    <div className="lit-submit-wrap">
      <h1>About Us</h1>
      <p className="lit-sub">Writing that shapes the world.</p>

      <div className="lit-submit-body">
        <p>
          The Moveee Literary is an international independent literary and culture magazine
          devoted to publishing exceptional writing within Africa and beyond.
        </p>
        <p>
          We publish fiction, poetry, essays, flash, interviews, and literary work in
          translation. We are rooted in Africa and its diasporas, but our horizon is global.
          Writers from anywhere may enter the conversation.
        </p>
        <p>
          We began with a simple conviction: exceptional writing deserves more than a place to
          sit on the internet. It deserves serious reading, rigorous editing, ambitious
          presentation, and an audience willing to follow it beyond publication.
        </p>
        <p>
          So we are building The Moveee Literary as a small, selective magazine. We would rather
          publish fewer exceptional pieces and stand behind them fiercely than publish everything
          that&rsquo;s good and promising. Our major publication is quarterly and each major issue
          is shaped around a provocative theme &mdash; as an invitation to go somewhere riskier,
          stranger, experimental.
        </p>

        <h2>What We Believe</h2>
        <p>
          Literature does not need permission to be useful. It can delight without explaining
          itself. It can make beauty out of contradiction. It can document, disturb, seduce,
          argue, remember, invent. It can return language to us altered.
        </p>
        <p>
          We are drawn to writing with authority and consequence: work that risks form, feeling,
          thought, language, voice; work that knows its own music. We want sentences that linger.
          We want surprise without gimmick, intellect without deadness, emotion without
          manipulation.
        </p>
        <p>
          Our ambition is to build a magazine whose reputation rests first on the quality of the
          work itself.
        </p>

        <h2>Rooted in Africa. Open to the World.</h2>
        <p>
          The Moveee Literary grows from an African literary ecosystem that has always exceeded
          borders: polyphonic, migratory, translated, diasporic, local and global at once. We
          want to publish African writers seriously. But we also welcome writers from elsewhere
          whose work belongs in the conversation we are building.
        </p>
        <p>
          Alongside our major issues, The Moveee Flash creates a free monthly doorway for African
          writers; The Moveee Writing Lives introduces readers to emerging voices within and
          beyond Africa; our masterclasses connect writers with accomplished practitioners to help
          them improve their craft; and our annual short story prize is being developed to
          discover and amplify exceptional African fiction. Together, they form the ecosystem we
          want The Moveee Literary to become: exceptional publication, discovery, craft,
          opportunity, support, and community.
        </p>

        <h2>What It Means to Publish With Us</h2>
        <p>
          When we accept a piece, we want the yes to matter. Contributors to our main issues
          receive editorial attention, payment, dedicated promotion, and consideration for
          eligible external literary prizes. We want each issue to feel worth returning to and
          each piece to feel worth championing after publication day has passed.
        </p>
        <p>
          We believe a literary magazine should do more than discover good writing. It should
          help create the conditions in which good writing can travel: from writer to editor,
          from page to reader, from one country to another, from a first publication to the next
          opportunity.
        </p>
        <p>That is why we are building slowly on purpose.</p>

        <h2>The Magazine We Want to Become</h2>
        <p>
          We want The Moveee Literary to become a home writers are proud to enter and readers
          trust enough to follow. A magazine that can publish a writer at the beginning of a
          career beside one who has been writing for decades, and make the only relevant question
          the same for both: is the work extraordinary?
        </p>
        <p>
          We want to make room for beauty, difficulty, pleasure, formal risk, memory, argument,
          strangeness, and the kinds of stories that do not yet know where else they belong.
        </p>
        <p>
          Above all, we want to publish work that moves &mdash; across borders, between people,
          through language.
        </p>
        <p>
          For writers. For readers. For anyone who still believes a piece of writing can change
          the world.
        </p>

        <h2>Welcome to The Moveee Literary</h2>
        <p>Read us. Send us your work. Stay for the conversation.</p>

        <div className="lit-submit-cards">
          <div className="lit-submit-card">
            <h3>Read the Archive</h3>
            <p>Get a feel for the work we publish, across every section.</p>
            <a href="/literary">Browse the archive &rarr;</a>
          </div>
          <div className="lit-submit-card">
            <h3>Send Us Your Work</h3>
            <p>Fiction, poetry, essays, conversations, and translation.</p>
            <a href="/literary/submit">Read the submission guidelines &rarr;</a>
          </div>
        </div>
      </div>
    </div>
  );
}
