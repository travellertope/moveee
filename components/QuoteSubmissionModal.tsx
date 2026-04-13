'use client';

import { useState } from 'react';
import { X, Send } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface ModalProps {
  onClose: () => void;
}

export default function QuoteSubmissionModal({ onClose }: ModalProps) {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    text: '',
    author: '',
    source: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!session) {
    return (
      <div className="fixed inset-0 bg-ink/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
        <div className="bg-paper p-8 max-w-md w-full relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-ink-soft"><X size={20}/></button>
          <h3 className="font-fraunces text-2xl mb-4">Members Only</h3>
          <p className="text-ink-soft mb-6">You need to be a part of the Moveee community to contribute to the quotes archive.</p>
          <button 
            onClick={() => router.push('/login')}
            className="btn-gold w-full"
          >
            Sign In to Contribute
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/quotes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await res.json();
      
      if (data.success) {
        alert('Quote shared! It is now live in the community archive.');
        onClose();
        window.location.reload();
      } else {
        setError(data.error || 'Something went wrong.');
      }
    } catch (err) {
      setError('Connection failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-ink/90 backdrop-blur-md z-[200] flex items-center justify-center p-4">
      <div className="bg-paper max-w-2xl w-full max-h-[90vh] overflow-y-auto relative p-8 md:p-12 shadow-2xl">
        <button onClick={onClose} className="absolute top-6 right-6 text-ink-soft hover:text-ink transition-colors">
          <X size={24}/>
        </button>

        <div className="num mb-4">CONTRIBUTE</div>
        <h2 className="font-fraunces text-3xl md:text-4xl mb-8">Move the <em>community</em>.</h2>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="form-group">
            <label className="block text-xs uppercase tracking-widest text-ink-soft mb-3">The Quote</label>
            <textarea
              required
              placeholder="“Until the lions have their own historians...”"
              rows={4}
              className="w-full bg-transparent border-b border-rule py-3 font-fraunces text-xl md:text-2xl focus:outline-none focus:border-gold transition-colors resize-none"
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="form-group">
              <label className="block text-xs uppercase tracking-widest text-ink-soft mb-3">Author</label>
              <input
                type="text"
                required
                placeholder="Chinua Achebe"
                className="w-full bg-transparent border-b border-rule py-3 focus:outline-none focus:border-gold transition-colors"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="block text-xs uppercase tracking-widest text-ink-soft mb-3">Source (Optional)</label>
              <input
                type="text"
                placeholder="Interview with The Paris Review"
                className="w-full bg-transparent border-b border-rule py-3 focus:outline-none focus:border-gold transition-colors"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              />
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="btn-primary w-full md:w-auto px-12 py-4 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? 'Spreading the word...' : (
                <>
                  Publish Quote <Send size={18} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
