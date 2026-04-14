'use client';

import React, { useState } from 'react';

interface RSVPFormProps {
  eventSlug: string;
  eventTitle: string;
}

const RSVPForm: React.FC<RSVPFormProps> = ({ eventSlug, eventTitle }) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    tickets: '1'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const response = await fetch('/api/events/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...formData, 
          eventSlug,
          eventTitle 
        }),
      });

      if (response.ok) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error('RSVP Error:', error);
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="bg-moss/20 p-6 border border-moss/30 text-center">
        <h4 className="font-serif italic text-paper text-lg mb-2">You&rsquo;re on the list!</h4>
        <p className="text-paper/70 text-sm font-mono uppercase tracking-wider">
          Check your email for confirmation.
        </p>
      </div>
    );
  }

  return (
    <form className="rsvp-form" onSubmit={handleSubmit}>
      <input 
        type="text" 
        placeholder="Full Name" 
        required 
        value={formData.name}
        onChange={(e) => setFormData({...formData, name: e.target.value})}
        disabled={status === 'loading'}
      />
      <input 
        type="email" 
        placeholder="Email Address" 
        required 
        value={formData.email}
        onChange={(e) => setFormData({...formData, email: e.target.value})}
        disabled={status === 'loading'}
      />
      
      <div className="members-note">
        Connect members get priority entry.
      </div>

      <button 
        type="submit" 
        className="rsvp-submit"
        disabled={status === 'loading'}
      >
        {status === 'loading' ? 'Processing...' : 'RSVP Now →'}
      </button>

      {status === 'error' && (
        <p className="text-ochre text-[10px] font-mono mt-2 text-center uppercase">
          Something went wrong. Please try again.
        </p>
      )}

      <p className="rsvp-small">
        By clicking RSVP, you agree to our Terms of Culture.
      </p>
    </form>
  );
};

export default RSVPForm;
