import React from "react";

export const DropCap = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="relative">
      {/* Target the first letter of the first paragraph child if possible, 
          but usually ACF gives us the letter or the text. */}
      <span className="float-left text-8xl font-serif font-black text-ochre mr-4 leading-[0.8] mt-2">
        {typeof children === 'string' ? children.charAt(0) : ''}
      </span>
      <p className="text-xl leading-relaxed text-ink-soft">
        {typeof children === 'string' ? children.slice(1) : children}
      </p>
    </div>
  );
};

export const PullQuote = ({ quote, author }: { quote: string; author?: string }) => {
  return (
    <figure className="my-16 px-12 border-l-4 border-ochre">
      <blockquote className="text-4xl md:text-5xl font-serif italic font-light text-ink leading-tight">
        "{quote}"
      </blockquote>
      {author && (
        <figcaption className="mt-6 text-[11px] uppercase tracking-[0.2em] font-bold text-mute">
          — {author}
        </figcaption>
      )}
    </figure>
  );
};

export const EditorialGallery = ({ images }: { images: { url: string; caption?: string }[] }) => {
  return (
    <div className="my-16 grid grid-cols-1 md:grid-cols-2 gap-8">
      {images.map((img, i) => (
        <div key={i} className="flex flex-col gap-3">
          <div className="aspect-[4/5] bg-paper-deep overflow-hidden relative">
            <img src={img.url} alt={img.caption || ""} className="object-cover w-full h-full" />
          </div>
          {img.caption && (
            <span className="text-[10px] uppercase tracking-widest text-mute font-mono">{img.caption}</span>
          )}
        </div>
      ))}
    </div>
  );
};
