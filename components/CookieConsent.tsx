'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Script from 'next/script';

const CONSENT_KEY = 'moveee_consent';
const GA_ID = 'G-DNRGCXBBF4';

type ConsentLevel = 'all' | 'essential';

export default function CookieConsent() {
  const [consent, setConsent] = useState<ConsentLevel | null | undefined>(undefined);
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY) as ConsentLevel | null;
    setConsent(stored);
    if (!stored) {
      const t = setTimeout(() => setVisible(true), 700);
      return () => clearTimeout(t);
    }
  }, []);

  const handleConsent = (level: ConsentLevel) => {
    localStorage.setItem(CONSENT_KEY, level);
    setConsent(level);
    setVisible(false);
    setShowDetails(false);
  };

  // Nothing to render until we know the stored preference
  if (consent === undefined) return null;

  return (
    <>
      {/* Conditionally load GA only after analytics consent */}
      {consent === 'all' && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="gtag-init" strategy="afterInteractive">{`
            window.dataLayer=window.dataLayer||[];
            function gtag(){dataLayer.push(arguments);}
            gtag('js',new Date());
            gtag('config','${GA_ID}');
          `}</Script>
        </>
      )}

      {/* Consent bar — only shown when no choice has been made */}
      {consent === null && (
        <div
          className={`cookie-bar${visible ? ' cookie-bar--in' : ''}`}
          role="dialog"
          aria-label="Cookie consent"
          aria-modal="false"
        >
          <div className="cookie-bar-inner">
            {showDetails ? (
              /* ── Expanded detail view ── */
              <div className="cookie-bar-details">
                <div className="cookie-bar-details-header">
                  <span className="cookie-bar-label">Manage cookies</span>
                  <button
                    className="cookie-bar-back"
                    onClick={() => setShowDetails(false)}
                    aria-label="Back"
                  >
                    ← Back
                  </button>
                </div>

                <div className="cookie-detail-grid">
                  <div className="cookie-detail-row">
                    <div className="cookie-detail-info">
                      <div className="cookie-detail-name">Essential cookies</div>
                      <div className="cookie-detail-desc">
                        Required for the site to function — session state, security tokens, cart persistence. Cannot be disabled.
                      </div>
                    </div>
                    <div className="cookie-toggle cookie-toggle--on" aria-label="Always active">
                      Always on
                    </div>
                  </div>

                  <div className="cookie-detail-row">
                    <div className="cookie-detail-info">
                      <div className="cookie-detail-name">Analytics cookies</div>
                      <div className="cookie-detail-desc">
                        Google Analytics — helps us understand which stories resonate with our community. All data is aggregated and anonymous.
                      </div>
                    </div>
                    <div className="cookie-detail-actions">
                      <button className="cookie-btn cookie-btn--ghost cookie-btn--sm" onClick={() => handleConsent('essential')}>
                        Decline
                      </button>
                      <button className="cookie-btn cookie-btn--accept cookie-btn--sm" onClick={() => handleConsent('all')}>
                        Allow
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* ── Default compact bar ── */
              <>
                <div className="cookie-bar-text">
                  <span className="cookie-bar-label">Cookies</span>
                  <p>
                    We use analytics to understand what content resonates with our community.
                    Essential cookies are always active.{' '}
                    <Link href="/cookie-policy">Cookie Policy →</Link>
                  </p>
                </div>

                <div className="cookie-bar-actions">
                  <button
                    className="cookie-bar-manage"
                    onClick={() => setShowDetails(true)}
                  >
                    Manage
                  </button>
                  <button
                    className="cookie-btn cookie-btn--ghost"
                    onClick={() => handleConsent('essential')}
                  >
                    Essential only
                  </button>
                  <button
                    className="cookie-btn cookie-btn--accept"
                    onClick={() => handleConsent('all')}
                  >
                    Accept all
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
