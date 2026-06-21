import Link from "next/link";

export default function NotFound() {
  return (
    <section className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden px-6 py-20 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center select-none"
        style={{
          fontFamily: "var(--font-fraunces, serif)",
          fontSize: "clamp(180px, 35vw, 500px)",
          fontWeight: 300,
          fontStyle: "italic",
          color: "var(--color-ochre, #b38238)",
          opacity: 0.05,
        }}
      >
        404
      </div>
      <div className="relative z-10 max-w-xl">
        <p className="mb-6 font-mono text-xs uppercase tracking-widest text-[--color-ochre]">
          Lost in Culture
        </p>
        <h1
          className="mb-6 text-5xl font-light leading-none md:text-7xl"
          style={{ fontFamily: "var(--font-fraunces, serif)" }}
        >
          Page{" "}
          <em className="italic text-[--color-ochre]">Not Found</em>
        </h1>
        <p
          className="mb-12 text-lg font-light italic leading-relaxed text-[--color-mute]"
          style={{ fontFamily: "var(--font-fraunces, serif)" }}
        >
          Whatever you were looking for seems to have drifted beyond our current
          borders. The page might have moved, or perhaps it hasn&apos;t been
          written yet.
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-6">
          <Link
            href="/feed"
            className="w-full bg-[--color-ochre] px-8 py-4 font-mono text-[10px] uppercase tracking-[0.15em] text-white transition hover:opacity-90 sm:w-auto"
          >
            Go to Connect
          </Link>
          <Link
            href="/events"
            className="w-full border border-[--color-rule] px-8 py-4 font-mono text-[10px] uppercase tracking-[0.15em] text-[--color-ink] transition hover:bg-[--color-ink] hover:text-[--color-paper] sm:w-auto"
          >
            Browse Events
          </Link>
        </div>
      </div>
    </section>
  );
}
