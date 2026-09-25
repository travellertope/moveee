import type { Metadata } from "next";
import LiterarySubscribeForm from "@/components/LiterarySubscribeForm";

export const metadata: Metadata = {
  title: "Subscribe | The Moveee Literary",
  description:
    "Get notified on new fiction, poetry, essays, and conversations from The Moveee Literary, plus GetMeLit — daily editor's recommendations of stories and poems.",
};

// The destination for /literary's "Get Updates" ribbon link and "Subscribe"
// masthead pill (see LiteraryMasthead.tsx). Subscribing here does two
// things at once: joins GetMeLit (see class-culture-magic-otp.php) and
// signs the visitor into Moveee, new account or existing one alike — no
// separate registration step.
export default function LiterarySubscribePage() {
  return (
    <div className="lit-submit-wrap">
      <h1>Stay with the work.</h1>
      <p className="lit-sub">
        Get notified on new fiction, poetry, essays, and conversations from The Moveee Literary,
        plus GetMeLit — daily editor&rsquo;s recommendations of stories and poems.
      </p>

      <div className="lit-submit-body">
        <p>Subscribing here puts you on GetMeLit. Here&rsquo;s exactly what that means:</p>
        <ul>
          <li>
            You&rsquo;ll get new fiction, poetry, essays, conversations, and translations from The
            Moveee Literary the moment they&rsquo;re published.
          </li>
          <li>
            Six days a week, GetMeLit lands in your inbox with stories Moveee&rsquo;s editors are
            reading and paying attention to that day.
          </li>
          <li>When a reading window or a call for submissions opens, you&rsquo;ll hear about it first.</li>
        </ul>
      </div>

      <LiterarySubscribeForm />
    </div>
  );
}
