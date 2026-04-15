'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Props {
  entry: any;
  user: any;
}

export default function VisualsSingleClient({ entry, user }: Props) {
  const [downloadCount, setDownloadCount] = useState(user?.visual_downloads_today ?? 0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPatron = user?.tier === 'patron' || user?.tier === 'leader';
  const limitReached = !isPatron && downloadCount >= 5;

  const handleDownload = async () => {
    if (!user) {
      window.location.href = `/login?callbackUrl=/visuals/${entry.slug}`;
      return;
    }

    if (limitReached) {
      setIsModalOpen(true);
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const res = await fetch('/api/visuals/track', { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403 || data.limit_reached) {
          setDownloadCount(data.count ?? 5);
          setIsModalOpen(true);
          throw new Error('Limit reached');
        }
        throw new Error(data.error || 'Tracking failed');
      }

      if (data.success || isPatron) {
        setDownloadCount(data.count ?? (downloadCount + 1));

        const imageRes = await fetch(img);
        const blob = await imageRes.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `${entry.slug}.jpg`;
        document.body.appendChild(link);
        link.click();
        
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      }
    } catch (err: any) {
      console.error('Download process failed:', err);
      if (err.message !== 'Limit reached') {
        setError('Download failed. Please try again or check your account status.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const copyCredit = () => {
    setIsCopying(true);
    const credit = `Illustration via The Moveee (${window.location.origin}/visuals/${entry.slug})`;
    navigator.clipboard.writeText(credit);
    setTimeout(() => setIsCopying(false), 2000);
  };

  const img = entry.featuredImage?.node?.sourceUrl;

  return (
    <>
      <div className="visual-single">
        <div className="max-w-[1200px] mx-auto px-6 mb-12">
          <Link href="/visuals" className="visual-single-back">
            ← Back to Visuals
          </Link>
        </div>
        
        <div className="visual-single-container">
          <div className="visual-single-preview">
            {img && (
              <Image 
                src={img} 
                alt={entry.title} 
                width={entry.featuredImage?.node?.mediaDetails?.width || 1200} 
                height={entry.featuredImage?.node?.mediaDetails?.height || 1500} 
                className="w-full h-auto"
                priority
              />
            )}
          </div>

          <div className="visual-single-info">
            <h1 className="visual-single-title" dangerouslySetInnerHTML={{ __html: entry.title }} />
            
            <div className="visual-single-desc">
              {entry.excerpt ? (
                <div dangerouslySetInnerHTML={{ __html: entry.excerpt }} />
              ) : (
                <p>A curated AI-generated illustration representing African culture. This artwork is part of the Moveee Visuals archive.</p>
              )}
            </div>

            <div className="visual-single-actions">
              <button 
                onClick={handleDownload}
                disabled={isProcessing}
                className={`visual-btn visual-btn-primary ${isProcessing ? 'opacity-70 cursor-wait' : ''}`}
              >
                <span>{isProcessing ? 'Processing...' : (limitReached ? 'Limit Reached' : 'Download High-Res')}</span>
              </button>
              
              <button 
                onClick={copyCredit}
                className="visual-btn visual-btn-secondary"
              >
                {isCopying ? 'Link Copied!' : 'Copy Attribution Link'}
              </button>

              {error && (
                <p className="text-red-400 text-xs mt-2 italic">{error}</p>
              )}
            </div>

            <div className="visual-meta-grid">
              <div className="visual-meta-item">
                <span className="label">Artist</span>
                <span className="value">The Moveee AI</span>
              </div>
              <div className="visual-meta-item">
                <span className="label">Category</span>
                <span className="value">{entry.cultureDirectoryTypes?.nodes?.[0]?.name || 'Illustration'}</span>
              </div>
              <div className="visual-meta-item">
                <span className="label">Usage</span>
                <span className="value">Moveee Open License</span>
              </div>
              <div className="visual-meta-item">
                <span className="label">Context</span>
                <Link href={`/directory/${entry.slug}`} className="value underline underline-offset-4">
                  View Directory Entry
                </Link>
              </div>
            </div>

            {!isPatron && user && (
              <p className="mt-8 text-xs text-zinc-500 text-center italic">
                Daily download limit: {downloadCount} / 5
              </p>
            )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="visual-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="visual-modal" onClick={e => e.stopPropagation()}>
            <button className="visual-modal-close" onClick={() => setIsModalOpen(false)}>×</button>
            <div className="visual-modal-icon">★</div>
            <h3>Daily Limit Reached</h3>
            <p>
              You've hit your daily limit of 5 downloads. To enjoy unlimited downloads and support independent culture, upgrade to a Patron membership.
            </p>
            <div className="flex flex-col gap-4">
              <Link href="/connect" className="visual-btn visual-btn-primary">
                Upgrade to Patron
              </Link>
              <button onClick={() => setIsModalOpen(false)} className="text-sm text-zinc-500 hover:text-white transition-colors">
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
