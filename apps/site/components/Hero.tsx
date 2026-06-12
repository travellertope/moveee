import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative px-6 py-24 md:py-32 border-b border-rule overflow-hidden">
      {/* Background Subtle Gradients */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-ochre/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[0%] right-[-5%] w-[35%] h-[35%] bg-moss/10 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-end relative z-10">
        <div className="flex flex-col gap-8">
          <div className="flex items-center gap-4 text-[10px] uppercase tracking-[0.3em] font-bold text-ink">
            <span className="w-10 h-px bg-ink" />
            Issue N°14 — The Mother Tongue
          </div>
          
          <h2 className="text-6xl md:text-8xl lg:text-[110px] leading-[0.9] font-serif font-medium tracking-tight text-ink">
            Culture, <span className="italic font-light text-mute">Curated.</span> <br />
            Diaspora, <span className="underline decoration-ochre decoration-2 underline-offset-[16px]">Defined.</span>
          </h2>

          <p className="text-lg md:text-xl text-ink-soft leading-relaxed max-w-lg mt-4">
            Navigating the intersection of heritage and high-fidelity living. A space for the modern moveee to discover vetted makers, visual dispatches, and global expeditions.
          </p>

          <div className="flex flex-wrap gap-6 mt-8">
            <Link href="/magazine" className="bg-ochre text-paper px-8 py-4 text-[11px] uppercase font-bold tracking-[0.15em] hover:bg-ochre-deep transition-all flex items-center gap-3">
              Read the Magazine <ArrowRight size={16} />
            </Link>
            <Link href="/shop" className="border-b border-ink py-4 text-[11px] uppercase font-bold tracking-[0.15em] hover:text-ochre hover:border-ochre transition-all">
              Shop Vetted Makers
            </Link>
          </div>
        </div>

        <div className="relative group">
          <div className="aspect-[4/5] bg-ink-soft overflow-hidden relative">
            {/* Placeholder for Hero Image */}
            <div className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent z-10" />
            <div className="absolute inset-0 flex items-center justify-center text-paper/20 font-serif italic text-4xl">
              PORTRAIT N°14
            </div>
          </div>
          
          <div className="absolute -bottom-8 left-0 right-0 flex justify-between items-start text-[9px] uppercase tracking-[0.15em] font-mono text-mute py-4 group-hover:text-ochre transition-colors">
            <span>Featuring: Ifeoma Okoli</span>
            <span className="text-right">Shot in Lagos, 2026</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
