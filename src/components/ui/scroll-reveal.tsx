"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  variant?: "up" | "left" | "right" | "scale";
  delay?: number;
  stagger?: boolean;
}

export function ScrollReveal({
  children,
  className = "",
  variant = "up",
  delay = 0,
  stagger = false,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -50px 0px" }
    );

    const el = ref.current;
    if (el) observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const variantClass =
    variant === "left"
      ? "reveal-left"
      : variant === "right"
      ? "reveal-right"
      : variant === "scale"
      ? "reveal-scale"
      : "reveal";

  const delayClass = stagger ? ` stagger-${Math.min(delay, 6)}` : "";

  return (
    <div
      ref={ref}
      className={`${revealed ? `${variantClass} revealed` : variantClass}${delayClass} ${className}`}
      style={stagger ? { animationDelay: `${Math.min(delay, 6) * 0.1}s` } : undefined}
    >
      {children}
    </div>
  );
}
