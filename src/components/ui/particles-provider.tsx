"use client";

import { ParticlesProvider } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { Engine } from "@tsparticles/engine";

async function initParticles(engine: Engine) {
  await loadSlim(engine);
}

export function ParticlesInit({ children }: { children: React.ReactNode }) {
  return (
    <ParticlesProvider init={initParticles}>
      {children}
    </ParticlesProvider>
  );
}
