'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import SubscribeForm from './SubscribeForm';
import { deriveSegment } from '../lib/segments';

interface Props {
  placeholder?: string;
  buttonLabel?: string;
  buttonClassName?: string;
  inputClassName?: string;
  successMessage?: string;
  /** 'dark' for ink/dark backgrounds, 'light' for paper backgrounds */
  variant?: 'dark' | 'light';
  list?: string;
  segment?: string;
}

export default function NewsletterSubscribeWidget({
  variant = 'light',
  list = 'culture-drop',
  segment,
  ...formProps
}: Props) {
  const { data: session, status } = useSession();
  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.email || subscribed || subscribing) return;
    setSubscribing(true);
    const resolvedSegment = segment ?? deriveSegment((session.user as any).countryOfResidence);
    fetch('/api/newsletter/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: session.user.email,
        name: session.user.name ?? '',
        list,
        segment: resolvedSegment,
        tier: (session.user as any).tier ?? '',
      }),
    })
      .then((res) => setSubscribed(res.ok))
      .catch(() => {})
      .finally(() => setSubscribing(false));
  }, [status, session, subscribed, subscribing, list, segment]);

  if (status === 'authenticated') {
    return (
      <div className={`nl-manage${variant === 'dark' ? ' nl-manage--dark' : ''}`}>
        <p className="nl-manage-note">
          {subscribed ? '✓ Subscribed as a member' : subscribing ? 'Subscribing…' : '✓ Subscribed as a member'}
        </p>
        <Link href="/member/settings" className="nl-manage-btn">
          Manage Preferences
        </Link>
      </div>
    );
  }

  // 'loading' falls through to the form — avoids layout shift on hydration
  return <SubscribeForm list={list} segment={segment} {...formProps} />;
}
