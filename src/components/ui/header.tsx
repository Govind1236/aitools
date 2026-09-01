"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Search, Menu, X, Sparkles, LayoutDashboard } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { PUBLIC_NAV_LINKS, SEARCH_HREF } from "@/lib/navigation";
import { CategoryMenu, type CategoryNavItem } from "@/components/navigation/category-menu";
import { MobileNavigation } from "@/components/navigation/mobile-navigation";

interface HeaderProps {
  categories: CategoryNavItem[];
}

export function Header({ categories }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [headerQuery, setHeaderQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const onToolsPage =
    pathname === "/tools" || pathname.startsWith("/tools/");
  const showSearchTrigger = !onToolsPage;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = headerQuery.trim();
    if (q) {
      router.push(`/tools?q=${encodeURIComponent(q)}`);
    } else {
      router.push(SEARCH_HREF);
    }
  };

  useEffect(() => {
    const handleShortcut = (e: KeyboardEvent) => {
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const target = e.target as HTMLElement;
        const tag = target?.tagName;
        const isTyping =
          tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable;
        if (!isTyping) {
          e.preventDefault();
          if (!onToolsPage && searchInputRef.current) {
            searchInputRef.current.focus();
          } else {
            const pageSearch = document.querySelector(
              'input[name="q"]'
            ) as HTMLInputElement | null;
            if (pageSearch) pageSearch.focus();
            else router.push(SEARCH_HREF);
          }
        }
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [router, onToolsPage]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 header-glass ${
        scrolled
          ? "border-b border-border shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
          : "border-b border-transparent"
      }`}
    >
      <div className="max-w-[1200px] mx-auto px-5 md:px-6">
        <div className="flex items-center justify-between h-[56px] md:h-[60px]">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 shrink-0 group"
            aria-label="Freebuff — Home"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-[#0071e3] to-[#5856d6] rounded-[10px] flex items-center justify-center group-hover:from-[#0077ed] group-hover:to-[#5e5ce6] transition-all duration-300 group-hover:rotate-6 group-hover:scale-105 shadow-[0_0_12px_rgba(0,113,227,0.25)] pulse-glow">
              <Sparkles className="w-4 h-4 text-primary-foreground" strokeWidth={1.75} />
            </div>
            <span className="text-[17px] font-semibold text-foreground tracking-tight hidden sm:block">
              Freebuff
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 ml-8" aria-label="Main navigation">
            {PUBLIC_NAV_LINKS.map((link) => {
              if (link.href === "/categories") {
                return (
                  <CategoryMenu
                    key={link.href}
                    categories={categories}
                  />
                );
              }
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3.5 py-2 text-[14px] font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-full transition-all duration-150"
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Search trigger */}
            {showSearchTrigger && (
              <form
                onSubmit={handleSearch}
                className="hidden md:flex items-center w-[220px] h-[36px] px-3.5 bg-accent/70 border border-border rounded-full text-muted-foreground focus-within:bg-accent focus-within:border-border-hover transition-all duration-150 group"
              >
                <Search className="w-3.5 h-3.5 mr-2 shrink-0 text-muted-foreground" strokeWidth={1.5} />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={headerQuery}
                  onChange={(e) => setHeaderQuery(e.target.value)}
                  placeholder="Search tools..."
                  aria-label="Search tools"
                  className="w-full bg-transparent text-[13.5px] text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                <kbd className="text-[11px] text-muted-foreground bg-background border border-border rounded-md px-1.5 py-0.5 font-mono shrink-0 ml-2">
                  /
                </kbd>
              </form>
            )}

            <ThemeToggle />

            {/* Admin button */}
            <Link
              href="/admin"
              className="hidden md:inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#0071e3] to-[#5856d6] text-primary-foreground text-[13.5px] font-semibold rounded-full hover:from-[#0077ed] hover:to-[#5e5ce6] active:scale-[0.98] transition-all duration-150 shadow-sm hover:shadow-[0_0_16px_rgba(0,113,227,0.35)]"
              title="Admin Dashboard"
            >
              <LayoutDashboard className="w-3.5 h-3.5" strokeWidth={2} />
              Admin
            </Link>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-1.5 -mr-1.5 text-foreground hover:bg-accent rounded-md transition-all duration-150"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? (
                <X className="w-5 h-5" strokeWidth={1.5} />
              ) : (
                <Menu className="w-5 h-5" strokeWidth={1.5} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <MobileNavigation
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          categories={categories}
        />
      </div>
    </header>
  );
}
