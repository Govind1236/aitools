"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight } from "lucide-react";

interface SearchBarProps {
  totalTools?: number;
  /** "Trending" search terms, provided from the database by the server. */
  popularTerms?: string[];
}

export function SearchBar({ totalTools, popularTerms = [] }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/tools?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative max-w-xl mx-auto">
      <div
        className={`relative rounded-full bg-background transition-all duration-300 border search-border ${
          focused
            ? "shadow-[0_16px_40px_rgba(0,0,0,0.12)]"
            : "shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
        }`}
      >
        <Search
          className={`absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground transition-all duration-300 ${focused ? "scale-110" : ""}`}
          strokeWidth={1.75}
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={totalTools ? `Search ${totalTools}+ AI tools, models, categories, tags...` : "Search AI tools, models, categories, tags..."}
          className="w-full h-[58px] pl-12 pr-16 bg-transparent text-[16px] text-foreground placeholder:text-muted-foreground focus:outline-none transition-all duration-150 rounded-full"
          aria-label="Search AI tools"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-gradient-to-r from-[#0071e3] to-[#5856d6] text-primary-foreground rounded-full hover:from-[#0077ed] hover:to-[#5e5ce6] active:scale-95 hover:shadow-[0_0_16px_rgba(0,113,227,0.4)] transition-all duration-150"
          aria-label="Search"
        >
          <ArrowRight className="w-4 h-4" strokeWidth={1.75} />
        </button>
      </div>

      {/* Suggested searches */}
      <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
        <span className="text-[13px] text-muted-foreground font-medium mr-1">Trending:</span>
        {popularTerms.map((term) => (
          <button
            key={term}
            type="button"
            onClick={() => {
              setQuery(term);
              router.push(`/tools?q=${encodeURIComponent(term)}`);
            }}
            className="text-[13px] font-medium text-foreground/70 bg-background border border-border px-4 py-1.5 rounded-full hover:bg-accent hover:text-foreground hover:border-[#0071e3]/40 hover:shadow-[0_0_10px_rgba(0,113,227,0.1)] hover:-translate-y-0.5 transition-all duration-200 tag-glow"
          >
            {term}
          </button>
        ))}
      </div>
    </form>
  );
}
