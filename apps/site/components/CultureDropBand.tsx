import SubscribeForm from "./SubscribeForm";

export default function CultureDropBand() {
  return (
    <section className="cd-band">
      <div className="cd-band-inner">
        <div className="cd-band-left">
          <div className="cd-band-eyebrow">The Moveee Newsletter</div>
          <h2 className="cd-band-title">Culture Drop</h2>
          <p className="cd-band-desc">
            The best of culture — curated weekly. Music, film, art, food, and ideas
            from across the world, delivered every Tuesday.
          </p>
          <div className="cd-band-meta">
            <span className="cd-band-pill">Weekly</span>
            <span className="cd-band-pill">Free</span>
            <span className="cd-band-pill">Every Tuesday</span>
          </div>
        </div>
        <div className="cd-band-right">
          <div className="cd-band-form-wrap">
            <p className="cd-band-form-label">Join the list</p>
            <div className="cd-band-form">
              <SubscribeForm
                list="culture-drop"
                placeholder="your@email.com"
                buttonLabel="Subscribe →"
                buttonClassName="cd-band-btn"
                inputClassName="cd-band-input"
                successMessage="You're on the list — Culture Drop arrives Tuesday."
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
