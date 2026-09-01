"use client";

/* ── DECORATIVE "TRUSTED BY" BRAND MARQUEE (presentation only) ──
 * A purely decorative UI element. It is NOT a catalogue source and must
 * NOT be treated as product data. Catalogue product logos are resolved
 * from the database via `Tool.logo` (see src/lib/logo.ts).
 */
const LOGOS = [
  { name: "ChatGPT", src: "/logos/chatgpt.webp" },
  { name: "Claude", src: "/logos/claude.png" },
  { name: "Gemini", src: "/logos/gemini.png" },
  { name: "Midjourney", src: "/logos/midjourney.png" },
  { name: "Copilot", src: "/logos/copilot.png" },
  { name: "Stable Diffusion", src: "/logos/stable-diffusion.webp" },
  { name: "Runway", src: "/logos/runway.png" },
  { name: "Perplexity", src: "/logos/perplexity.png" },
  { name: "Suno", src: "/logos/suno.png" },
  { name: "Notion AI", src: "/logos/notion.png" },
  { name: "Jasper", src: "/logos/jasper.png" },
];

/* Render one full row of the marquee */
function Row({ ariaHidden }: { ariaHidden?: boolean }) {
  return (
    <div
      className="marquee-track flex items-center gap-4 pr-4 shrink-0"
      aria-hidden={ariaHidden || undefined}
    >
      {LOGOS.map((logo) => (
        <div
          key={logo.name}
          className="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-background border border-border hover:border-[#0071e3]/30 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-300"
          title={logo.name}
        >
          <img
            src={logo.src}
            alt={logo.name}
            className="w-6 h-6 object-contain opacity-80 hover:opacity-100 transition-opacity duration-200"
            loading="lazy"
          />
          <span className="text-[13.5px] font-medium text-foreground/60 whitespace-nowrap">
            {logo.name}
          </span>
        </div>
      ))}
    </div>
  );
}

export function LogoMarquee() {
  return (
    <section className="relative max-w-[1200px] mx-auto px-5 md:px-6 pt-16 md:pt-20 pb-2 overflow-hidden">
      <div className="flex flex-col items-center gap-6 mb-8">
        <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Trusted by teams using the world&apos;s leading AI
        </p>
        <div
          className="relative w-full overflow-hidden mask-edges py-2"
          style={{
            maskImage:
              "linear-gradient(90deg, transparent, black 12%, black 88%, transparent)",
            WebkitMaskImage:
              "linear-gradient(90deg, transparent, black 12%, black 88%, transparent)",
          }}
        >
          <div className="flex w-max marquee-anim items-center">
            <Row />
            <Row ariaHidden />
          </div>
        </div>
      </div>
    </section>
  );
}
