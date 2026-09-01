"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Search, Menu, X, Sparkles, LayoutDashboard } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
            aria-label="AI Tools Directory — Home"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-[#0071e3] to-[#5856d6] rounded-[10px] flex items-center justify-center group-hover:from-[#0077ed] group-hover:to-[#5e5ce6] transition-all duration-300 group-hover:rotate-6 group-hover:scale-105 shadow-[0_0_12px_rgba(0,113,227,0.25)] pulse-glow">
              <Sparkles className="w-4 h-4 text-primary-foreground" strokeWidth={1.75} />
            </div>
            <span className="text-[17px] font-semibold text-foreground tracking-tight hidden sm:block">
              AI Tools
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 ml-8" aria-label="Main navigation">
            {[
              { href: "/tools", label: "Explore" },
              { href: "/categories/developer", label: "Developer" },
              { href: "/categories/agents", label: "Agents" },
              { href: "/categories/models", label: "Models" },
              { href: "/tools?pricing=free", label: "Free Tools" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3.5 py-2 text-[14px] font-medium text-foreground/80 hover:text-foreground hover:bg-accent rounded-full transition-all duration-150"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Search trigger */}
            <Link
              href="/search"
              className="hidden md:flex items-center justify-between w-[210px] h-[36px] px-3.5 bg-accent/70 border border-border rounded-full text-muted-foreground hover:bg-accent hover:border-border-hover transition-all duration-150 group"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span className="text-[13.5px]">Search...</span>
              </div>
              <kbd className="text-[11px] text-muted-foreground bg-background border border-border rounded-md px-1.5 py-0.5 font-mono">
                /
              </kbd>
            </Link>

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
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-out ${
            mobileOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="pb-3 border-t border-border pt-2">
            <nav className="flex flex-col gap-0.5" aria-label="Mobile navigation">
              <Link
                href="/tools"
                className="px-3 py-2.5 text-[15px] font-medium text-foreground hover:bg-accent rounded-lg transition-all duration-150"
                onClick={() => setMobileOpen(false)}
              >
                Explore Tools
              </Link>
              <Link
                href="/categories/developer"
                className="px-3 py-2.5 text-[15px] font-medium text-foreground hover:bg-accent rounded-lg transition-all duration-150"
                onClick={() => setMobileOpen(false)}
              >
                Developer
              </Link>
              <Link
                href="/categories/agents"
                className="px-3 py-2.5 text-[15px] font-medium text-foreground hover:bg-accent rounded-lg transition-all duration-150"
                onClick={() => setMobileOpen(false)}
              >
                Agents
              </Link>
              <Link
                href="/categories/models"
                className="px-3 py-2.5 text-[15px] font-medium text-foreground hover:bg-accent rounded-lg transition-all duration-150"
                onClick={() => setMobileOpen(false)}
              >
                Models
              </Link>
              <Link
                href="/tools?pricing=free"
                className="px-3 py-2.5 text-[15px] font-medium text-foreground hover:bg-accent rounded-lg transition-all duration-150"
                onClick={() => setMobileOpen(false)}
              >
                Free Tools
              </Link>
              <Link
                href="/tools?pricing=freemium"
                className="px-3 py-2.5 text-[15px] font-medium text-foreground hover:bg-accent rounded-lg transition-all duration-150"
                onClick={() => setMobileOpen(false)}
              >
                Freemium
              </Link>
              <Link
                href="/contact"
                className="px-3 py-2.5 text-[15px] font-medium text-foreground hover:bg-accent rounded-lg transition-all duration-150"
                onClick={() => setMobileOpen(false)}
              >
                Contact
              </Link>
              <Link
                href="/admin"
                className="px-3 py-2.5 text-[15px] font-medium text-foreground hover:bg-accent rounded-lg transition-all duration-150 flex items-center gap-2"
                onClick={() => setMobileOpen(false)}
              >
                <LayoutDashboard className="w-4 h-4" />
                Admin Dashboard
              </Link>
              <div className="border-t border-border my-1.5" />
              <Link
                href="/admin"
                className="px-3 py-2.5 text-[15px] font-semibold text-primary-foreground bg-primary rounded-lg hover:bg-primary-hover hover:shadow-md transition-all duration-150 flex items-center justify-center gap-2 mt-2"
                onClick={() => setMobileOpen(false)}
              >
                <LayoutDashboard className="w-4 h-4" strokeWidth={2} />
                Admin Dashboard
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
