import LiteraryLitCheckout from "@/components/LiteraryLitCheckout";

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
export default function LiteraryLitUpsellCard() {
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
      <LiteraryLitCheckout
        variant="dark"
        returnPath="/literary/lit-welcome"
        monthlyPrice="₦1,999"
        yearlyPrice="₦19,990"
        monthlyPriceUsd="$1"
        yearlyPriceUsd="$13"
      />
    </div>
  );
}
