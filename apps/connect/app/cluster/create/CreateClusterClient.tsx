"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Country = "United Kingdom" | "Nigeria" | "Other";
type VenueType = "home" | "cafe" | "coworking" | "other";
type AddressVisible = "members_only" | "on_request" | "area_only";

const TOTAL_STEPS = 6;

const MEETING_DAYS = [
  { value: "monday",    label: "Monday" },
  { value: "tuesday",   label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday",  label: "Thursday" },
  { value: "friday",    label: "Friday" },
  { value: "saturday",  label: "Saturday" },
  { value: "sunday",    label: "Sunday" },
];

const VENUE_TYPES: { value: VenueType; label: string; icon: string }[] = [
  { value: "home",      label: "Home",            icon: "🏠" },
  { value: "cafe",      label: "Café",            icon: "☕" },
  { value: "coworking", label: "Coworking space",  icon: "💻" },
  { value: "other",     label: "Other",           icon: "📍" },
];

const ADDRESS_OPTIONS: { value: AddressVisible; label: string; desc: string }[] = [
  {
    value: "members_only",
    label: "Members only",
    desc: "Confirmed members see your full address. Everyone else sees your street name only.",
  },
  {
    value: "on_request",
    label: "On request",
    desc: "Your full address is shared only after someone joins and you approve them.",
  },
  {
    value: "area_only",
    label: "Area only",
    desc: "Only your street name is ever shared — best if you prefer more privacy.",
  },
];

interface Props {
  viewerCountry?: string;
}

export default function CreateClusterClient({ viewerCountry = "" }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Step 1 — country
  const [country, setCountry] = useState<Country | "">(
    viewerCountry === "United Kingdom" || viewerCountry === "Nigeria"
      ? (viewerCountry as Country)
      : ""
  );
  // Step 2 — venue
  const [venueType, setVenueType] = useState<VenueType | "">("");
  const [hostNote, setHostNote] = useState("");
  // Step 3 — capacity
  const [capacity, setCapacity] = useState(8);
  const [accessible, setAccessible] = useState(false);
  // Step 4 — locality
  const [localityConfirmed, setLocalityConfirmed] = useState(false);
  // Step 5 — address visibility
  const [addressVisible, setAddressVisible] = useState<AddressVisible>("members_only");
  // Step 6 — creation form
  const [name, setName] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [formCountry, setFormCountry] = useState(viewerCountry);
  const [meetingDay, setMeetingDay] = useState("sunday");
  const [meetingTime, setMeetingTime] = useState("");
  const [locationNote, setLocationNote] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [createdId, setCreatedId] = useState<number | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const isUK = country === "United Kingdom";
  const isNG = country === "Nigeria";
  const progress = Math.round((step / TOTAL_STEPS) * 100);

  const canAdvance =
    (step === 1 && country !== "") ||
    (step === 2 && venueType !== "") ||
    (step === 3) ||
    (step === 4 && localityConfirmed) ||
    (step === 5) ||
    (step === 6 && name.trim() && street.trim() && city.trim() && formCountry.trim() && meetingTime.trim());

  const handleNext = () => {
    if (step < TOTAL_STEPS) {
      if (step === 1) setFormCountry(country as string);
      setStep((s) => s + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/cluster/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          city: city.trim(),
          street: street.trim(),
          country: formCountry.trim(),
          meeting_day: meetingDay,
          meeting_time: meetingTime.trim(),
          location_note: locationNote.trim(),
          venue_type: venueType,
          host_note: hostNote.trim(),
          realistic_capacity: capacity,
          accessible: accessible ? 1 : 0,
          address_visible: addressVisible,
          locality_confirmed: localityConfirmed ? 1 : 0,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || "Could not start a Stoop right now.");
        setSubmitting(false);
        return;
      }
      setCreatedId(data.id);
    } catch {
      setError("Could not start a Stoop right now.");
      setSubmitting(false);
    }
  };

  const venueLabel = VENUE_TYPES.find((v) => v.value === venueType)?.label ?? "";
  const addrLabel = ADDRESS_OPTIONS.find((a) => a.value === addressVisible)?.label ?? "";

  if (createdId !== null) {
    const inviteUrl = `https://web.themoveee.com/cluster/${createdId}/invite`;
    const handleCopyLink = async () => {
      try {
        if (navigator.share) {
          await navigator.share({
            title: `Join ${name.trim()}`,
            text: `Join my Stoop "${name.trim()}" on Moveee!`,
            url: inviteUrl,
          });
        } else {
          await navigator.clipboard.writeText(inviteUrl);
          setLinkCopied(true);
          setTimeout(() => setLinkCopied(false), 2500);
        }
      } catch {
        window.prompt("Copy this invite link:", inviteUrl);
      }
    };

    return (
      <div className="hfc-page">
        <div className="hfc-body">
          <div className="hfc-step" style={{ textAlign: "center", paddingTop: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏡</div>
            <h1 className="hfc-heading" style={{ marginBottom: 12 }}>Stoop created!</h1>
            <p className="hfc-sub">
              Now share the invite link with neighbours and friends.<br />
              You need at least <strong>4 members</strong> to activate your Stoop.
            </p>
            <div className="clu-share-banner" style={{ marginTop: 28, textAlign: "left" }}>
              <div className="clu-share-banner-body">
                <p className="clu-share-banner-title">{name.trim()}</p>
                <div className="clu-share-url-row">
                  <span className="clu-share-url-text">{inviteUrl}</span>
                </div>
              </div>
              <button type="button" className="clu-share-btn" onClick={handleCopyLink}>
                {linkCopied ? "Link copied ✓" : "Share invite link →"}
              </button>
            </div>
            <button
              type="button"
              className="hfc-nav-back"
              style={{ marginTop: 20, width: "100%", textAlign: "center" }}
              onClick={() => router.push(`/cluster/${createdId}`)}
            >
              Go to my Stoop →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hfc-page">
      {/* Sticky header */}
      <div className="hfc-header">
        <div className="hfc-header-inner">
          <Link href="/connect/people" className="hfc-back">← Back</Link>
          <span className="hfc-step-label">Step {step} of {TOTAL_STEPS}</span>
        </div>
        <div className="hfc-progress-bar">
          <div className="hfc-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="hfc-body">

        {/* ── Step 1: Country ── */}
        {step === 1 && (
          <div className="hfc-step">
            <h1 className="hfc-heading">Culture, close to home.</h1>
            <p className="hfc-sub">
              A Stoop is a small, weekly gathering of Moveee members in your
              area — watching films together, listening to music, reading
              aloud, cooking, and engaging with culture in the company of your neighbours.
            </p>
            <p className="hfc-sub">Where are you hosting from?</p>

            <div className="hfc-country-list">
              {(["United Kingdom", "Nigeria", "Other"] as Country[]).map((c_) => (
                <button
                  key={c_}
                  type="button"
                  className={`hfc-country-chip${country === c_ ? " hfc-country-chip--active" : ""}`}
                  onClick={() => setCountry(c_)}
                >
                  <span className="hfc-country-flag">
                    {c_ === "United Kingdom" ? "🇬🇧" : c_ === "Nigeria" ? "🇳🇬" : "🌍"}
                  </span>
                  <span className="hfc-country-label">{c_}</span>
                  {country === c_ && <span className="hfc-check">✓</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 2: Venue ── */}
        {step === 2 && (
          <div className="hfc-step">
            <h1 className="hfc-heading">Your hosting space.</h1>
            <p className="hfc-sub">
              Stoops happen in real spaces — a living room, a café
              back room, a coworking lounge. What kind of space are you hosting in?
            </p>

            <div className="hfc-venue-grid">
              {VENUE_TYPES.map((vt) => (
                <button
                  key={vt.value}
                  type="button"
                  className={`hfc-venue-chip${venueType === vt.value ? " hfc-venue-chip--active" : ""}`}
                  onClick={() => setVenueType(vt.value)}
                >
                  <span className="hfc-venue-icon">{vt.icon}</span>
                  <span className="hfc-venue-label">{vt.label}</span>
                </button>
              ))}
            </div>

            {isUK && (
              <div className="hfc-context-note">
                🏘️ If you're renting, quickly check your tenancy agreement for hosting
                small gatherings. Background music is generally fine; for live sessions,
                a quick word with neighbours goes a long way.
              </div>
            )}
            {isNG && (
              <div className="hfc-context-note">
                🔌 If you're in a gated estate, let security know you're hosting. It's
                worth having a backup plan if NEPA strikes — an outdoor area or a
                neighbour's generator can save the evening.
              </div>
            )}

            <label className="hfc-label" htmlFor="hfc-hostnote">Host note (optional)</label>
            <textarea
              id="hfc-hostnote"
              className="hfc-textarea"
              rows={4}
              placeholder="Share anything members should know about your space: what you've got set up, the vibe to expect, what to bring…"
              value={hostNote}
              onChange={(e) => setHostNote(e.target.value)}
            />
          </div>
        )}

        {/* ── Step 3: Capacity ── */}
        {step === 3 && (
          <div className="hfc-step">
            <h1 className="hfc-heading">How many can you fit?</h1>
            <p className="hfc-sub">
              Set a realistic gathering size for your space. This helps members know
              what to expect and gives everyone a fair shot at joining.
            </p>

            <p className="hfc-label">Gathering size</p>
            <div className="hfc-capacity-row">
              <button
                type="button"
                className="hfc-capacity-btn"
                onClick={() => setCapacity((n) => Math.max(2, n - 1))}
                aria-label="Decrease"
              >−</button>
              <span className="hfc-capacity-value">{capacity}</span>
              <button
                type="button"
                className="hfc-capacity-btn"
                onClick={() => setCapacity((n) => Math.min(20, n + 1))}
                aria-label="Increase"
              >+</button>
            </div>
            <p className="hfc-capacity-hint">
              Cooking sessions work best at 6–8. Film screenings and music listening
              sessions can comfortably go to 10–12.
              {isNG ? " For an open compound or outdoor setup, 12–16 is fine." : ""}
            </p>

            <label className="hfc-accessible-row">
              <input
                type="checkbox"
                checked={accessible}
                onChange={(e) => setAccessible(e.target.checked)}
                className="hfc-accessible-check"
              />
              <div>
                <span className="hfc-accessible-label">Step-free access</span>
                <span className="hfc-accessible-desc">Your venue is accessible to people with limited mobility.</span>
              </div>
            </label>
          </div>
        )}

        {/* ── Step 4: Locality ── */}
        {step === 4 && (
          <div className="hfc-step">
            <h1 className="hfc-heading">Staying close.</h1>
            <p className="hfc-sub">
              Stoop is rooted in proximity — the whole point is meeting the
              people in your area, regularly, not pulling together a guest
              list from across the city.
            </p>

            {isUK && (
              <div className="hfc-context-note">
                🚶 This works best when you can walk to the gathering, or it's a short bus
                or tube ride. If your Stoop starts drawing people from two
                neighbourhoods away, it's drifted from what it's meant to be.
              </div>
            )}
            {isNG && (
              <div className="hfc-context-note">
                🏘️ Even within a neighbourhood, a 10-minute drive or okada ride is fine.
                This isn't a city-wide event — it should feel like your own corner of
                Lagos, Abuja, or wherever you call home.
              </div>
            )}
            {!isUK && !isNG && (
              <div className="hfc-context-note">
                🗺️ Keep it walkable or a short ride. A Stoop that stays
                genuinely local — the same small area — tends to build something real.
              </div>
            )}

            <button
              type="button"
              className={`hfc-commitment${localityConfirmed ? " hfc-commitment--active" : ""}`}
              onClick={() => setLocalityConfirmed((v) => !v)}
            >
              <span className={`hfc-commitment-check${localityConfirmed ? " hfc-commitment-check--active" : ""}`}>
                {localityConfirmed ? "✓" : ""}
              </span>
              <span className="hfc-commitment-text">
                I'm committed to hosting within my local area and to attending most
                sessions myself — not just running a group from a distance.
              </span>
            </button>
          </div>
        )}

        {/* ── Step 5: Address visibility ── */}
        {step === 5 && (
          <div className="hfc-step">
            <h1 className="hfc-heading">Who sees your address?</h1>
            <p className="hfc-sub">
              Choose how much location detail is shared with people browsing or
              joining your Stoop.
            </p>

            <div className="hfc-addr-options">
              {ADDRESS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`hfc-addr-option${addressVisible === opt.value ? " hfc-addr-option--active" : ""}`}
                  onClick={() => setAddressVisible(opt.value)}
                >
                  <div className="hfc-addr-header">
                    <span className={`hfc-addr-radio${addressVisible === opt.value ? " hfc-addr-radio--active" : ""}`}>
                      {addressVisible === opt.value && <span className="hfc-addr-radio-inner" />}
                    </span>
                    <span className="hfc-addr-label">{opt.label}</span>
                  </div>
                  <p className="hfc-addr-desc">{opt.desc}</p>
                </button>
              ))}
            </div>

            {/* Summary */}
            <div className="hfc-summary">
              <p className="hfc-summary-title">Your Stoop setup</p>
              <ul className="hfc-summary-list">
                <li>Hosting from: {country}</li>
                <li>Venue: {venueLabel}{accessible ? " · step-free access" : ""}</li>
                <li>Space for {capacity} people</li>
                <li>Address visibility: {addrLabel}</li>
                <li>Local commitment confirmed ✓</li>
              </ul>
            </div>
          </div>
        )}

        {/* ── Step 6: Creation form ── */}
        {step === 6 && (
          <div className="hfc-step">
            <h1 className="hfc-heading">Name your Stoop.</h1>
            <p className="hfc-sub">
              Almost there — give it a name, set your street and schedule. Members
              near you will find it and be able to join.
            </p>

            {/* Compact onboarding summary */}
            <div className="hfc-recap">
              <span className="hfc-recap-item">{venueLabel}</span>
              <span className="hfc-recap-dot" />
              <span className="hfc-recap-item">{capacity} people</span>
              {accessible && <><span className="hfc-recap-dot" /><span className="hfc-recap-item">Step-free</span></>}
              <span className="hfc-recap-dot" />
              <span className="hfc-recap-item">{addrLabel}</span>
              <button type="button" className="hfc-recap-edit" onClick={() => setStep(2)}>Edit</button>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <label className="hfc-label" htmlFor="hfc-name">Stoop name</label>
              <input
                id="hfc-name"
                type="text"
                className="hfc-input"
                required
                placeholder="e.g. Allen Avenue Stoop"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={submitting}
              />

              <label className="hfc-label" htmlFor="hfc-street">Street</label>
              <input
                id="hfc-street"
                type="text"
                className="hfc-input"
                required
                placeholder="e.g. Allen Avenue"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                disabled={submitting}
              />

              <div className="hfc-row">
                <div className="hfc-row-field">
                  <label className="hfc-label" htmlFor="hfc-city">City</label>
                  <input
                    id="hfc-city"
                    type="text"
                    className="hfc-input"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    disabled={submitting}
                  />
                </div>
                <div className="hfc-row-field">
                  <label className="hfc-label" htmlFor="hfc-country">Country</label>
                  <input
                    id="hfc-country"
                    type="text"
                    className="hfc-input"
                    required
                    value={formCountry}
                    onChange={(e) => setFormCountry(e.target.value)}
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="hfc-row">
                <div className="hfc-row-field">
                  <label className="hfc-label" htmlFor="hfc-day">Meeting day</label>
                  <select
                    id="hfc-day"
                    className="hfc-input hfc-select"
                    value={meetingDay}
                    onChange={(e) => setMeetingDay(e.target.value)}
                    disabled={submitting}
                  >
                    {MEETING_DAYS.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </div>
                <div className="hfc-row-field">
                  <label className="hfc-label" htmlFor="hfc-time">Meeting time</label>
                  <input
                    id="hfc-time"
                    type="text"
                    className="hfc-input"
                    required
                    placeholder="e.g. 6:30pm"
                    value={meetingTime}
                    onChange={(e) => setMeetingTime(e.target.value)}
                    disabled={submitting}
                  />
                </div>
              </div>

              <label className="hfc-label" htmlFor="hfc-locnote">Arrival note (optional)</label>
              <input
                id="hfc-locnote"
                type="text"
                className="hfc-input"
                placeholder="e.g. Meet at the blue gate, 3rd house"
                value={locationNote}
                onChange={(e) => setLocationNote(e.target.value)}
                disabled={submitting}
              />

              {error && <p className="hfc-error">{error}</p>}

              <button
                type="submit"
                className="hfc-submit-btn"
                disabled={submitting || !name.trim() || !street.trim() || !city.trim() || !formCountry.trim() || !meetingTime.trim()}
              >
                {submitting ? "Starting…" : "Start Stoop →"}
              </button>
            </form>
          </div>
        )}

        {/* Navigation — steps 1–5 only (step 6 uses form submit) */}
        {step < TOTAL_STEPS && (
          <div className="hfc-nav">
            {step > 1 && (
              <button type="button" className="hfc-nav-back" onClick={handleBack}>
                ← Back
              </button>
            )}
            <button
              type="button"
              className="hfc-nav-next"
              onClick={handleNext}
              disabled={!canAdvance}
            >
              {step === TOTAL_STEPS - 1 ? "Set up my Stoop →" : "Next"}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
