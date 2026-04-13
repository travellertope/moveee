'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import SubscribeForm from './SubscribeForm';

interface Props {
  placeholder?: string;
  buttonLabel?: string;
  buttonClassName?: string;
  inputClassName?: string;
  successMessage?: string;
  /** 'dark' for ink/dark backgrounds, 'light' for paper backgrounds */
  variant?: 'dark' | 'light';
}

export default function NewsletterSubscribeWidget({
  variant = 'light',
  ...formProps
}: Props) {
  const { status } = useSession();

  if (status === 'authenticated') {
    return (
      <div className={`nl-manage${variant === 'dark' ? ' nl-manage--dark' : ''}`}>
        <p className="nl-manage-note">✓ Subscribed as a member</p>
        <Link href="/member/settings" className="nl-manage-btn">
          Manage Newsletter Preferences →
        </Link>
      </div>
    );
  }

  // 'loading' falls through to the form — avoids layout shift on hydration
  return <SubscribeForm {...formProps} />;
}
