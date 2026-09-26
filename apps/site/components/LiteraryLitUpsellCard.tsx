interface Props {
  slug: string;
}

const PERKS = [
  "Unmetered access to every piece, both free and exclusive",
  "Ability to comment on stories and join the conversations on The Moveee Literary",
  "Early news, previews & event invites — especially Literati Connect",
];

/**
 * The fancy, dark "sell Moveee Lit" companion to LiteraryPieceGate's
 * non-blocking free box — the two sit side by side inline at ~30% into a
 * piece for anonymous readers who still have free reads left. Design
 * mocked up first, then built to match (Artifact SRHfajeMCc8RB12HqDhm3J).
 */
export default function LiteraryLitUpsellCard({ slug }: Props) {
  return (
    <div className="lit-upsell-card">
      <div className="lit-upsell-glow" aria-hidden="true" />
      <h3>Read without limits.</h3>
      <p>Get full access to every piece in The Moveee Literary.</p>
      <div className="lit-upsell-rule" aria-hidden="true" />
      <ul className="lit-upsell-perks">
        {PERKS.map((perk) => (
          <li key={perk}>
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
              <path
                d="M2 7.5L5.5 11L12 3"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>{perk}</span>
          </li>
        ))}
        <li>
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
            <path
              d="M2 7.5L5.5 11L12 3"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>
            Complimentary TML Originals × The Moveee Literary merch
            <em>— annual only</em>
          </span>
        </li>
      </ul>
      <div className="lit-upsell-price">
        <span className="lit-upsell-price-amount">₦1,500</span>
        <span className="lit-upsell-price-cycle">/ mo</span>
      </div>
      <div className="lit-upsell-cadence">or ₦15,000 / $13 billed annually · 2 months free</div>
      <a className="lit-upsell-cta" href={`/register?tier=lit&next=/literary/${slug}`}>
        Upgrade to Moveee Lit <span aria-hidden="true">→</span>
      </a>
      <div className="lit-upsell-footnote">Cancel anytime · instant access</div>
    </div>
  );
}
