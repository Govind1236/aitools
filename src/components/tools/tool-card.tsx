"use client";

import { useState } from "react";
import Link from "next/link";
import { Star, ArrowUpRight, Sparkles, ArrowRight } from "lucide-react";
import { Tool, Category } from "@prisma/client";
import { getToolLogoSrc } from "@/lib/logo";
import { getPricingConfig } from "@/lib/pricing";

type ToolWithCategory = Tool & { category: Category };

interface ToolCardProps {
  tool: ToolWithCategory;
  variant?: "default" | "compact";
}

export function ToolCard({ tool, variant = "default" }: ToolCardProps) {
  const pricing = getPricingConfig(tool.pricingType);
  const [imgError, setImgError] = useState(false);

  const handleSpotlight = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
  };

  const logoSrc = getToolLogoSrc(tool);

  if (variant === "compact") {
    return (
      <Link
        href={`/tools/${tool.slug}`}
        className="group flex items-center justify-between gap-3 p-3.5 rounded-[14px] border border-border bg-background hover:border-[#0071e3]/40 hover:shadow-[0_12px_28px_rgba(0,0,0,0.06),0_0_12px_rgba(0,113,227,0.08)] hover:-translate-y-0.5 transition-all duration-300 shimmer"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 group-hover:rotate-3 transition-all duration-200">
            {logoSrc && !imgError ? (
              <img
                src={logoSrc}
                alt={tool.name}
                className="w-6 h-6 object-contain"
                onError={() => setImgError(true)}
              />
            ) : (
              <span className="font-bold text-sm text-muted-foreground">
                {tool.name.charAt(0)}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-semibold text-foreground leading-snug group-hover:text-blue-600 transition-colors duration-150">
              {tool.name}
            </p>
            <p className="text-[12px] text-muted-foreground leading-snug font-medium">
              {tool.category.name}
            </p>
          </div>
        </div>
        <ArrowUpRight
          className="w-4 h-4 text-muted-foreground group-hover:text-blue-600 shrink-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          strokeWidth={1.5}
        />
      </Link>
    );
  }

  return (
    <div
      onMouseMove={handleSpotlight}
      className="group relative h-full bg-background rounded-[18px] border border-border hover:border-[#0071e3]/40 hover:shadow-[0_16px_40px_rgba(0,0,0,0.1),0_0_20px_rgba(0,113,227,0.08)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between shimmer spotlight-card"
    >
      <div className="p-5 flex-1 flex flex-col">
        {/* Header - Links to internal details page */}
        <div className="flex items-start justify-between gap-3 mb-3.5">
          <Link href={`/tools/${tool.slug}`} className="flex items-center gap-3.5 min-w-0 group/title">
            <div className="w-12 h-12 rounded-xl bg-muted border border-border flex items-center justify-center p-2 shrink-0 group-hover/title:scale-105 group-hover/title:rotate-3 transition-all duration-200">
              {logoSrc && !imgError ? (
                <img
                  src={logoSrc}
                  alt={tool.name}
                  className="w-7 h-7 object-contain"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="w-full h-full rounded-lg bg-accent text-foreground flex items-center justify-center font-bold text-sm">
                  {tool.name.charAt(0)}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-[14px] font-semibold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug gradient-text-subtle">
                {tool.name}
              </h3>
              <p className="text-[12px] text-muted-foreground mt-0.5 flex items-center gap-1.5 font-medium">
                <span>{tool.category.name}</span>
                {tool.rating > 0 && (
                  <>
                    <span className="w-1 h-1 bg-border rounded-full" />
                    <span className="flex items-center gap-0.5 text-foreground font-semibold">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400 stroke-amber-400" strokeWidth={0} />
                      {tool.rating.toFixed(1)}
                    </span>
                  </>
                )}
              </p>
            </div>
          </Link>

          {tool.isFeatured && (
            <span className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-amber-700 bg-amber-50 border border-amber-200/70 px-2 py-0.5 rounded-md shrink-0 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20 badge-shine">
              <Sparkles className="w-2.5 h-2.5" />
              Featured
            </span>
          )}
        </div>

        {/* Description linking to internal details */}
        <Link href={`/tools/${tool.slug}`} className="flex-1 block mb-4">
          <p className="text-[12.5px] text-muted-foreground line-clamp-2 leading-relaxed">
            {tool.description}
          </p>
        </Link>

        {/* Tags */}
        {tool.tags && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {tool.tags
              .split(",")
              .slice(0, 3)
              .map((tag) => (
                <Link
                  key={tag.trim()}
                  href={`/tools?q=${encodeURIComponent(tag.trim())}`}
                  className="text-[10.5px] font-medium text-muted-foreground bg-muted hover:bg-slate-100 hover:text-foreground hover:border-[#0071e3]/40 border border-border px-2 py-0.5 rounded-md transition-all duration-150 dark:hover:bg-slate-800"
                >
                  #{tag.trim()}
                </Link>
              ))}
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-4 mt-auto border-t border-border flex items-center justify-between">
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border badge-shine ${pricing.className}`}>
            {pricing.label}
          </span>

          <div className="flex items-center gap-2">

            <Link
              href={`/tools/${tool.slug}`}
              className="inline-flex items-center gap-1 text-[12px] font-medium text-foreground bg-accent hover:bg-[#0071e3] hover:shadow-[0_0_12px_rgba(0,113,227,0.3)] hover:text-white px-3 py-1 rounded-lg transition-all duration-150 group/btn"
            >
              View Details
              <ArrowRight className="w-3.5 h-3.5 stroke-[1.5] group-hover/btn:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
      {/* Bottom gradient accent line shown on hover */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#0071e3] via-[#5856d6] to-[#af52de] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  );
}
