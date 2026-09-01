"use client";

import createGlobe from "cobe";
import { useEffect, useRef, useState } from "react";

export function Globe({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<number | null>(null);
  const pointerInteractionMovement = useRef(0);
  const [{ r }, setR] = useState({ r: 0 });

  useEffect(() => {
    let phi = 0;
    let width = 0;
    
    // Setup resize observer for responsive canvas sizing
    const onResize = () => {
      if (canvasRef.current) {
        width = canvasRef.current.offsetWidth;
      }
    };
    window.addEventListener("resize", onResize);
    onResize();

    if (!canvasRef.current) return;

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: width * 2,
      height: width * 2,
      phi: 0,
      theta: 0.3,
      dark: 0, // 0 is light theme, 1 is dark
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [1, 1, 1], // white globe
      markerColor: [251 / 255, 146 / 255, 60 / 255], // amber/orange markers
      glowColor: [1.1, 1.1, 1.1], // strong white glow
      markers: [
        { location: [37.7595, -122.4367], size: 0.05 },
        { location: [40.7128, -74.006], size: 0.07 },
        { location: [51.5072, -0.1276], size: 0.06 },
        { location: [48.8566, 2.3522], size: 0.05 },
        { location: [35.6762, 139.6503], size: 0.08 },
        { location: [-33.8688, 151.2093], size: 0.05 },
        { location: [1.3521, 103.8198], size: 0.06 },
      ],
      // @ts-ignore - cobe types are missing onRender
      onRender: (state: Record<string, any>) => {
        // This prevents SSR warnings
        if (!pointerInteracting.current) {
          phi += 0.005;
        }
        state.phi = phi + r;
        state.width = width * 2;
        state.height = width * 2;
      },
    });

    // Fade in effect
    setTimeout(() => {
      if (canvasRef.current) {
        canvasRef.current.style.opacity = "1";
      }
    });

    return () => {
      globe.destroy();
      window.removeEventListener("resize", onResize);
    };
  }, [r]);

  return (
    <div
      className={`inset-0 mx-auto aspect-[1/1] w-full max-w-[600px] ${className || ""}`}
    >
      <canvas
        className="h-full w-full opacity-0 transition-opacity duration-500 ease-in-out cursor-grab active:cursor-grabbing"
        ref={canvasRef}
        onPointerDown={(e) => {
          pointerInteracting.current =
            e.clientX - pointerInteractionMovement.current;
          if (canvasRef.current) {
             canvasRef.current.style.cursor = 'grabbing';
          }
        }}
        onPointerUp={() => {
          pointerInteracting.current = null;
          if (canvasRef.current) {
             canvasRef.current.style.cursor = 'grab';
          }
        }}
        onPointerOut={() => {
          pointerInteracting.current = null;
          if (canvasRef.current) {
             canvasRef.current.style.cursor = 'grab';
          }
        }}
        onMouseMove={(e) => {
          if (pointerInteracting.current !== null) {
            const delta = e.clientX - pointerInteracting.current;
            pointerInteractionMovement.current = delta;
            setR({ r: delta / 200 });
          }
        }}
        onTouchMove={(e) => {
          if (pointerInteracting.current !== null && e.touches[0]) {
            const delta = e.touches[0].clientX - pointerInteracting.current;
            pointerInteractionMovement.current = delta;
            setR({ r: delta / 100 });
          }
        }}
      />
    </div>
  );
}
