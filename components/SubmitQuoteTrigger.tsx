'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import QuoteSubmissionModal from './QuoteSubmissionModal';

export default function SubmitQuoteTrigger() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        className="submit-trigger" 
        onClick={() => setIsOpen(true)}
        title="Share a quote"
      >
        <Plus size={32} />
      </button>

      {isOpen && (
        <QuoteSubmissionModal onClose={() => setIsOpen(false)} />
      )}
    </>
  );
}
