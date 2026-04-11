import React from "react";
import Link from "next/link";
import { Instagram, Twitter, Mail } from "lucide-react";

interface FooterProps {
  variant?: "light" | "dark";
}

const Footer = ({ variant = "light" }: FooterProps) => {
  const isDark = variant === "dark";
  const bgClass = isDark ? "bg-night text-paper" : "bg-paper text-ink";
  const ruleClass = isDark ? "border-ink-soft/30" : "border-rule";
  const muteClass = isDark ? "text-paper/40" : "text-mute";
  const softClass = isDark ? "text-paper/70" : "text-ink-soft";

  return (
    <footer className={`${bgClass} border-t ${ruleClass} pt-24 pb-12 overflow-hidden transition-colors duration-500`}>
      <div className="max-w-[1440px] mx-auto px-6">
        
        {/* Giant Brand Footer Logo */}
        <div className="mb-24 flex justify-center">
          <h2 className="text-[12vw] font-serif font-black tracking-[-0.05em] text-ink/10 select-none leading-none">
            THE MOVEEE
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-24">
          
          {/* Column 1: Mission */}
          <div className="flex flex-col gap-6">
            <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold text-ink">About The Platform</h3>
            <p className="text-sm text-ink-soft leading-relaxed max-w-xs">
              Navigating the intersection of culture, lifestyle, and African heritage through curated visual stories and vetted commerce.
            </p>
            <div className="flex gap-4">
              <Link href="#" className="p-2 border border-rule rounded-full hover:bg-ink hover:text-paper transition-all">
                <Instagram size={16} />
              </Link>
              <Link href="#" className="p-2 border border-rule rounded-full hover:bg-ink hover:text-paper transition-all">
                <Twitter size={16} />
              </Link>
              <Link href="#" className="p-2 border border-rule rounded-full hover:bg-ink hover:text-paper transition-all">
                <Mail size={16} />
              </Link>
            </div>
          </div>

          {/* Column 2: Magazine */}
          <div className="flex flex-col gap-6">
            <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold text-ink">Magazine</h3>
            <ul className="flex flex-col gap-3 text-[13px] text-ink-soft font-medium">
              <li><Link href="/magazine/culture" className="hover:text-ochre">Culture</Link></li>
              <li><Link href="/magazine/interviews" className="hover:text-ochre">Portraits</Link></li>
              <li><Link href="/magazine/dispatches" className="hover:text-ochre">Dispatches</Link></li>
              <li><Link href="/magazine/archive" className="hover:text-ochre">The Issue Archive</Link></li>
            </ul>
          </div>

          {/* Column 3: Lifestyle */}
          <div className="flex flex-col gap-6">
            <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold text-ink">Lifestyle & Shop</h3>
            <ul className="flex flex-col gap-3 text-[13px] text-ink-soft font-medium">
              <li><Link href="/shop" className="hover:text-ochre">Vetted Makers</Link></li>
              <li><Link href="/shop/new" className="hover:text-ochre">New Arrivals</Link></li>
              <li><Link href="/membership" className="hover:text-ochre">Become a Member</Link></li>
              <li><Link href="/shop/shipping" className="hover:text-ochre">Shipping & Returns</Link></li>
            </ul>
          </div>

          {/* Column 4: Newsletter */}
          <div className="flex flex-col gap-6">
            <h3 className="text-[11px] uppercase tracking-[0.2em] font-bold text-ink">Weekly Digest</h3>
            <p className="text-sm text-ink-soft">The best of culture, delivered every Friday.</p>
            <form className="flex gap-2">
              <input 
                type="email" 
                placeholder="EMAIL ADDRESS" 
                className="bg-transparent border-b border-rule pb-2 text-[10px] tracking-widest uppercase flex-1 focus:outline-none focus:border-ochre transition-colors"
              />
              <button type="submit" className="text-[10px] font-bold tracking-widest uppercase hover:text-ochre transition-colors underline decoration-rule decoration-2 underline-offset-8">
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-rule pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-[10px] uppercase font-bold tracking-[0.3em] text-mute">
            © 2026 THE MOVEEE — DESIGNED FOR THE DIASPORA
          </div>
          <div className="flex gap-8 text-[10px] uppercase font-bold tracking-[0.3em] text-mute">
            <Link href="/privacy" className="hover:text-ink">Privacy</Link>
            <Link href="/terms" className="hover:text-ink">Terms</Link>
            <Link href="/contact" className="hover:text-ink">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
