"use client";

import { useEffect, useRef, useCallback, useState } from "react";

/* ── DECORATIVE BRAND ICONS (presentation only) ─────────────────
 * These floating brand icons are a purely decorative UI element for
 * the hero section. They are NOT a catalogue source and must NOT be
 * treated as product data. Catalogue product logos are resolved from
 * the database via `Tool.logo` (see src/lib/logo.ts).
 *
 * If a product needs its logo on a catalogue page, set it in the Admin
 * (Tool.logo) — do not add it here.
 */
const AI_APP_ICONS = [
  {
    name: "ChatGPT",
    color: "#10a37f",
    src: "/logos/chatgpt.webp",
    fallback: (
      <svg viewBox="0 0 24 24" fill="white">
        <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.872zm16.597 3.855-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365 2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
      </svg>
    ),
  },
  {
    name: "Claude",
    color: "#d97757",
    src: "/logos/claude.png",
    fallback: (
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill="#d97757" />
        <text x="12" y="17" textAnchor="middle" fontSize="14" fontWeight="bold" fill="white">C</text>
      </svg>
    ),
  },
  {
    name: "Midjourney",
    color: "#000",
    src: "/logos/midjourney.png",
    fallback: (
      <svg viewBox="0 0 24 24" fill="#000">
        <path d="M3.75 18.5c2.5-3 5.5-4.5 8.25-4.5 3 0 5.5 1.5 7 4M1.5 13c3-3.5 6.5-5 10.5-5 4.5 0 7.5 2 9.5 5M3 8c3-3 7-4.5 10.5-4.5S21 5 23.5 8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    name: "DALL·E",
    color: "#10a37f",
    src: "/logos/dalle.svg",
    fallback: (
      <svg viewBox="0 0 24 24" fill="white">
        <circle cx="12" cy="12" r="10" />
        <text x="12" y="17" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#10a37f">D</text>
      </svg>
    ),
  },
  {
    name: "Gemini",
    color: "#4285f4",
    src: "/logos/gemini.png",
    fallback: (
      <svg viewBox="0 0 24 24">
        <defs>
          <linearGradient id="gemini-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4285f4" />
            <stop offset="50%" stopColor="#9b72cb" />
            <stop offset="100%" stopColor="#d96570" />
          </linearGradient>
        </defs>
        <circle cx="12" cy="12" r="10" fill="url(#gemini-grad)" />
      </svg>
    ),
  },
  {
    name: "Copilot",
    color: "#7c3aed",
    src: "/logos/copilot.png",
    fallback: (
      <svg viewBox="0 0 24 24" fill="white">
        <circle cx="12" cy="12" r="10" />
        <text x="12" y="17" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#7c3aed">C</text>
      </svg>
    ),
  },
  {
    name: "Stable Diffusion",
    color: "#a855f7",
    src: "/logos/stable-diffusion.webp",
    fallback: (
      <svg viewBox="0 0 24 24" fill="white">
        <circle cx="12" cy="12" r="10" fill="#a855f7" />
        <text x="12" y="17" textAnchor="middle" fontSize="14" fontWeight="bold" fill="white">S</text>
      </svg>
    ),
  },
  {
    name: "Runway",
    color: "#ff4d6a",
    src: "/logos/runway.png",
    fallback: (
      <svg viewBox="0 0 24 24" fill="white">
        <circle cx="12" cy="12" r="10" fill="#ff4d6a" />
        <text x="12" y="17" textAnchor="middle" fontSize="14" fontWeight="bold" fill="white">R</text>
      </svg>
    ),
  },
  {
    name: "Jasper",
    color: "#f59e0b",
    src: "/logos/jasper.png",
    fallback: (
      <svg viewBox="0 0 24 24" fill="white">
        <circle cx="12" cy="12" r="10" fill="#f59e0b" />
        <text x="12" y="17" textAnchor="middle" fontSize="14" fontWeight="bold" fill="white">J</text>
      </svg>
    ),
  },
  {
    name: "Notion AI",
    color: "#000",
    src: "/logos/notion.png",
    fallback: (
      <svg viewBox="0 0 24 24">
        <rect x="4" y="4" width="16" height="16" rx="2" fill="#000" />
        <text x="12" y="17" textAnchor="middle" fontSize="14" fontWeight="bold" fill="white">N</text>
      </svg>
    ),
  },
  {
    name: "Perplexity",
    color: "#20b2aa",
    src: "/logos/perplexity.png",
    fallback: (
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" fill="#20b2aa" />
        <text x="12" y="17" textAnchor="middle" fontSize="14" fontWeight="bold" fill="white">P</text>
      </svg>
    ),
  },
  {
    name: "Suno",
    color: "#8b5cf6",
    src: "/logos/suno.png",
    fallback: (
      <svg viewBox="0 0 24 24" fill="white">
        <circle cx="12" cy="12" r="10" fill="#8b5cf6" />
        <text x="12" y="17" textAnchor="middle" fontSize="14" fontWeight="bold" fill="white">S</text>
      </svg>
    ),
  },
];

/* ── Floating icon positions & animation configs ──
 * speed: parallax multiplier (negative = moves up on scroll, positive = moves down)
 * The magnitude controls depth — higher values feel closer/slower.
 */
const FLOATING_ITEMS = [
  // Left side
  { top: "10%", left: "8%", size: 44, duration: 18, delay: 0, icon: 0, speed: -0.15 },
  { top: "40%", left: "12%", size: 38, duration: 20, delay: 4, icon: 2, speed: -0.08 },
  { top: "75%", left: "7%", size: 40, duration: 19, delay: 5, icon: 5, speed: 0.06 },
  { top: "25%", left: "4%", size: 34, duration: 25, delay: 4.5, icon: 10, speed: -0.10 },
  { top: "85%", left: "12%", size: 36, duration: 23, delay: 1.5, icon: 8, speed: -0.05 },
  { top: "55%", left: "5%", size: 40, duration: 20, delay: 3.5, icon: 9, speed: 0.14 },

  // Right side
  { top: "15%", left: "85%", size: 40, duration: 22, delay: 2, icon: 1, speed: 0.10 },
  { top: "50%", left: "88%", size: 38, duration: 17, delay: 2.5, icon: 7, speed: 0.18 },
  { top: "70%", left: "82%", size: 42, duration: 16, delay: 1, icon: 3, speed: 0.12 },
  { top: "30%", left: "90%", size: 36, duration: 24, delay: 3, icon: 4, speed: -0.20 },
  { top: "5%", left: "82%", size: 34, duration: 21, delay: 6, icon: 6, speed: -0.12 },
  { top: "88%", left: "86%", size: 40, duration: 18, delay: 0.5, icon: 11, speed: 0.08 },
];

export function FloatingAIApps() {
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  /* ── Parallax scroll handler (RAF-throttled, passive) ── */
  const updateParallax = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const scrollY = window.scrollY;
    // Cap to hero section height so icons don't fly off-screen
    const heroHeight = container.parentElement?.offsetHeight ?? 800;
    const clampedScroll = Math.min(scrollY, heroHeight);
    container.style.setProperty("--scroll", String(clampedScroll));
  }, []);

  useEffect(() => {
    setMounted(true);

    const onScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(updateParallax);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    updateParallax(); // initial position

    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, [updateParallax]);

  if (!mounted) return null;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none hidden md:block"
      style={{ "--scroll": 0 } as React.CSSProperties}
      aria-hidden="true"
    >
      {FLOATING_ITEMS.map((item, i) => {
        const icon = AI_APP_ICONS[item.icon];
        // Parallax: outer wrapper applies scroll-based translateY
        // Inner wrapper applies the float-drift CSS animation
        // This avoids transform conflicts between the two systems
        return (
          <div
            key={i}
            className="floating-ai-parallax group"
            style={{
              position: "absolute",
              top: item.top,
              left: item.left,
              width: item.size,
              height: item.size,
              transform: `translateY(calc(var(--scroll) * ${item.speed}px))`,
              willChange: "transform",
              pointerEvents: "auto",
              cursor: "default",
            }}
          >
            {/* Brand-colored glow behind the icon — reduced opacity */}
            <div
              className="absolute inset-[-8px] rounded-3xl transition-all duration-500 ease-out opacity-20 group-hover:opacity-50 group-hover:inset-[-12px]"
              style={{
                background: `radial-gradient(circle, ${icon.color}40 0%, transparent 70%)`,
                filter: "blur(6px)",
              }}
            />
            {/* Inner wrapper: float-drift animation (CSS keyframes) */}
            <div
              className="floating-ai-icon relative z-10"
              style={{
                opacity: 0,
                animation: `floatIn 1s ease-out ${item.delay * 0.15}s forwards, floatDrift${i % 3} ${item.duration}s ease-in-out ${item.delay}s infinite`,
              }}
            >
              <div
                className="w-full h-full rounded-xl flex items-center justify-center overflow-hidden transition-shadow duration-300 ease-out floating-icon-card"
                style={{
                  border: "1px solid rgba(0,0,0,0.05)",
                  backdropFilter: "blur(6px)",
                }}
              >
                <img
                  src={icon.src}
                  alt={icon.name}
                  className="w-[55%] h-[55%] object-contain"
                  style={{ opacity: 0.75 }}
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = "none";
                    const fallback = target.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = "block";
                  }}
                />
                <div className="hidden w-[50%] h-[50%]">
                  {icon.fallback}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Decorative gradient orbs for depth — reduced opacity */}
      <div
        className="absolute w-[300px] h-[300px] rounded-full blur-[100px] opacity-[0.02]"
        style={{
          background: "radial-gradient(circle, #3b82f6, transparent)",
          top: "10%",
          left: "10%",
          animation: "floatOrb1 15s ease-in-out infinite",
        }}
      />
      <div
        className="absolute w-[250px] h-[250px] rounded-full blur-[80px] opacity-[0.015]"
        style={{
          background: "radial-gradient(circle, #8b5cf6, transparent)",
          bottom: "10%",
          right: "10%",
          animation: "floatOrb2 18s ease-in-out infinite",
        }}
      />
    </div>
  );
}
