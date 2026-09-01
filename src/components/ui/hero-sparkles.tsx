"use client";

import { SparklesCore } from "@/components/ui/sparkles";

/**
 * Hero section sparkles — subtle, light-themed ambient particles
 * that float behind the hero content. Uses slate-300 colored particles
 * on a transparent background for a refined, editorial feel.
 */
export function HeroSparkles() {
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none">
      <SparklesCore
        id="hero-sparkles"
        background="transparent"
        minSize={0.4}
        maxSize={1.4}
        particleDensity={80}
        className="w-full h-full"
        particleColor="#94a3b8"
        speed={0.8}
      />
      {/* Gradient mask — fades particles at edges for a clean blend */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 50%, transparent 50%, white 100%)",
        }}
      />
    </div>
  );
}

/**
 * CTA section sparkles — white particles on the dark slate-900
 * background, creating a starfield / cosmic feel that makes
 * the CTA section pop.
 */
export function CTASparkles() {
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none">
      <SparklesCore
        id="cta-sparkles"
        background="transparent"
        minSize={0.3}
        maxSize={1}
        particleDensity={100}
        className="w-full h-full"
        particleColor="#ffffff"
        speed={0.6}
      />
    </div>
  );
}
