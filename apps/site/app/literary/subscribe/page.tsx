import type { Metadata } from "next";
import LiterarySubscribeForm from "@/components/LiterarySubscribeForm";
import LiteraryLitCheckout from "@/components/LiteraryLitCheckout";
import { LITERARY_FREE_READ_LIMIT } from "@/lib/literary-access";
import { getLitCurrency } from "@/lib/lit-currency";

export const metadata: Metadata = {
  title: "Subscribe | The Moveee Literary",
  description:
    "Get notified on new fiction, poetry, essays, and conversations from The Moveee Literary, plus GetMeLit — daily editor's recommendations of stories and poems. Or go Moveee Lit for unmetered, full access.",
};

// The destination for /literary's "Get Updates" ribbon link and "Subscribe"
// masthead pill (see LiteraryMasthead.tsx). Subscribing here does two
// things at once: joins GetMeLit (see class-culture-magic-otp.php) and
// signs the visitor into Moveee, new account or existing one alike — no
// separate registration step.
export default async function LiterarySubscribePage() {
  const currency = await getLitCurrency();
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

      <div className="lit-pricing-intro">
        <h2>Choose Your Membership.</h2>
      </div>

      <div className="lit-pricing-grid">
        <div className="lit-pricing-card">
          <h3 className="lit-pricing-card-name">Moveee Citizen</h3>
          <div className="lit-pricing-card-price">Free</div>
          <ul className="lit-pricing-card-perks">
            <li>Forever — no card required</li>
            <li>{LITERARY_FREE_READ_LIMIT} free reads every 30 days across Fiction, Poetry, Essays, Conversations, In Translation, and Notes</li>
            <li>GetMeLit &amp; Culture Drop newsletters</li>
            <li>The rest of Moveee — Pulse Feed, Discover, Games, Stoop, and more</li>
          </ul>
          <LiterarySubscribeForm />
        </div>
        <div className="lit-pricing-card lit-pricing-card--lit">
          <h3 className="lit-pricing-card-name">Moveee Lit</h3>
          <ul className="lit-pricing-card-perks">
            <li>Everything in Citizen</li>
            <li>Unmetered, full access to every piece in The Moveee Literary — public and exclusive alike</li>
            <li>Comment on stories</li>
            <li>Early news, previews, and event invites — especially to Literati Connect</li>
            <li>
              Complimentary TML Originals × The Moveee Literary merch
              <em>Annual subscribers only</em>
            </li>
          </ul>
          <LiteraryLitCheckout
            variant="light"
            returnPath="/literary/lit-welcome"
            currency={currency}
            monthlyPrice="₦1,999"
            yearlyPrice="₦19,990"
            monthlyPriceUsd="$1"
            yearlyPriceUsd="$13"
          />
        </div>
      </div>
    </div>
  );
}
