"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ChevronDown,
} from "lucide-react";
import { PUBLIC_NAV_LINKS, SEARCH_HREF } from "@/lib/navigation";
import { getCategoryMeta } from "@/lib/category-config";
import type { CategoryNavItem } from "./category-menu";

interface MobileNavigationProps {
  open: boolean;
  onClose: () => void;
  categories: CategoryNavItem[];
}

export function MobileNavigation({
  open,
  onClose,
  categories,
}: MobileNavigationProps) {
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    onClose();
    if (q) {
      router.push(`/tools?q=${encodeURIComponent(q)}`);
    } else {
      router.push(SEARCH_HREF);
    }
  };

  return (
    <div
      className={`md:hidden overflow-hidden transition-all duration-300 ease-out ${
        open ? "max-h-[560px] opacity-100" : "max-h-0 opacity-0"
      }`}
    >
      <div className="pb-4 border-t border-border pt-3">
        <form onSubmit={handleSearch} className="relative mb-3">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tools..."
            aria-label="Search tools"
            className="w-full h-10 pl-10 pr-4 bg-background border border-border rounded-xl text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-border-hover transition-all"
          />
        </form>
        <nav className="flex flex-col gap-0.5" aria-label="Mobile navigation">
          {PUBLIC_NAV_LINKS.map((link) => {
            if (link.href === "/categories") {
              return (
                <div key={link.href}>
                  <button
                    onClick={() => setCategoriesExpanded(!categoriesExpanded)}
                    className="w-full px-3 py-2.5 text-[15px] font-medium text-foreground hover:bg-accent rounded-lg transition-all duration-150 flex items-center justify-between"
                    aria-expanded={categoriesExpanded}
                  >
                    <span>Categories</span>
                    <ChevronDown
                      className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                        categoriesExpanded ? "rotate-180" : ""
                      }`}
                      strokeWidth={1.5}
                    />
                  </button>
                  {categoriesExpanded && (
                    <div className="pl-4 pb-1">
                      <Link
                        href="/categories"
                        className="block px-3 py-2 text-[14px] font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                        onClick={onClose}
                      >
                        All Categories
                      </Link>
                      <div className="grid grid-cols-2 gap-0.5 mt-1">
                        {categories.map((cat) => {
                          const meta = getCategoryMeta(cat.slug);
                          const Icon = meta.icon;
                          return (
                            <Link
                              key={cat.id}
                              href={`/categories/${cat.slug}`}
                              className="flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                              onClick={onClose}
                            >
                              <Icon className={`w-3.5 h-3.5 ${meta.color}`} strokeWidth={1.5} />
                              {cat.name}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            }
            return (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2.5 text-[15px] font-medium text-foreground hover:bg-accent rounded-lg transition-all duration-150"
                onClick={onClose}
              >
                {link.label}
              </Link>
            );
          })}

          <div className="border-t border-border my-1.5" />

          <Link
            href="/contact"
            className="px-3 py-2.5 text-[15px] font-medium text-foreground hover:bg-accent rounded-lg transition-all duration-150"
            onClick={onClose}
          >
            Submit Tool
          </Link>
        </nav>
      </div>
    </div>
  );
}
