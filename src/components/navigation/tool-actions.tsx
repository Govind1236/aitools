import Link from "next/link";
import { ExternalLink, ArrowRight } from "lucide-react";

interface ToolActionsProps {
  slug: string;
  size?: "sm" | "md" | "lg";
  align?: "row" | "stack";
}

/**
 * Reusable tool actions (View Tool + Open App).
 * "Open App" always routes through the tracked redirect (/go/[slug])
 * so analytics and click events are preserved. Never bypass with raw
 * external URLs.
 */
export function ToolActions({ slug, size = "md", align = "row" }: ToolActionsProps) {
  const sizing =
    size === "lg"
      ? "px-8 py-3.5 text-[15px] rounded-xl"
      : size === "sm"
      ? "px-3 py-2 text-[12px] rounded-lg"
      : "px-4 py-2.5 text-[13.5px] rounded-lg";

  return (
    <div className={`flex ${align === "stack" ? "flex-col gap-2" : "items-center gap-2"}`}>
      <Link
        href={`/tools/${slug}`}
        className={`inline-flex items-center justify-center gap-1.5 font-medium text-foreground bg-accent hover:bg-accent-hover transition-all duration-150 ${sizing}`}
      >
        <span>View Tool</span>
        <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.75} />
      </Link>
      <Link
        href={`/go/${slug}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center justify-center gap-1.5 font-semibold text-white bg-[#0071e3] hover:bg-[#0077ed] transition-all duration-150 ${sizing}`}
      >
        <span>Open App</span>
        <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.75} />
      </Link>
    </div>
  );
}
