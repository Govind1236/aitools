"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { getCategoryMeta } from "@/lib/category-config";

export interface CategoryNavItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  _count?: { tools: number };
}

interface CategoryMenuProps {
  categories: CategoryNavItem[];
}

export function CategoryMenu({ categories }: CategoryMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleMouseEnter = () => {
    clearTimeout(timeoutRef.current);
    setOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 150);
  };

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        onClick={() => setOpen(!open)}
        className="px-3.5 py-2 text-[14px] font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-full transition-all duration-150 flex items-center gap-1.5"
        aria-expanded={open}
        aria-haspopup="true"
      >
        Categories
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          strokeWidth={2}
        />
      </button>

      {open && (
        <div
          className="absolute top-full left-0 mt-1 w-[520px] bg-background border border-border rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.12)] p-4 z-50"
          role="menu"
        >
          <div className="grid grid-cols-2 gap-1">
            {categories.map((cat) => {
              const meta = getCategoryMeta(cat.slug);
              const Icon = meta.icon;
              return (
                <Link
                  key={cat.id}
                  href={`/categories/${cat.slug}`}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-accent transition-colors group"
                  role="menuitem"
                  onClick={() => setOpen(false)}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 ${meta.bg.replace(/\s*group-hover:\S+/g, "")} ${meta.color}`}
                  >
                    <Icon className="w-4 h-4" strokeWidth={1.5} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-foreground group-hover:text-[#0071e3] transition-colors truncate">
                      {cat.name}
                    </p>
                    {cat._count && (
                      <p className="text-[11px] text-muted-foreground">
                        {cat._count.tools} {cat._count.tools === 1 ? "tool" : "tools"}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="border-t border-border mt-3 pt-3">
            <Link
              href="/categories"
              className="flex items-center justify-center gap-1.5 text-[13px] font-semibold text-[#0071e3] hover:text-[#0077ed] transition-colors py-2 rounded-lg hover:bg-accent"
              onClick={() => setOpen(false)}
            >
              View All Categories
              <span className="text-[11px]">&rarr;</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
