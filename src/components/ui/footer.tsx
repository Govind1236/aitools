"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-muted border-t border-border overflow-hidden">
      {/* Tech grid overlay */}
      <div className="absolute inset-0 tech-grid opacity-30 pointer-events-none" />
      {/* Animated glow orb */}
      <div
        className="absolute -bottom-20 left-1/3 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(0,113,227,0.05), transparent 70%)",
          animation: "orbFloat2 16s ease-in-out infinite",
        }}
      />
      <div className="relative max-w-[1200px] mx-auto px-5 md:px-6 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4 group w-max">
              <div className="w-8 h-8 bg-gradient-to-br from-[#0071e3] to-[#5856d6] rounded-[10px] flex items-center justify-center group-hover:from-[#0077ed] group-hover:to-[#5e5ce6] group-hover:rotate-6 transition-all duration-300 shadow-[0_0_12px_rgba(0,113,227,0.2)]">
                <Sparkles className="w-4 h-4 text-primary-foreground" strokeWidth={1.75} />
              </div>
              <span className="text-[15px] font-semibold text-foreground tracking-tight">
                AI Tools Directory
              </span>
            </Link>
            <p className="text-[14px] leading-relaxed text-muted-foreground max-w-xs">
              Discover the best AI tools for work, business, creativity and
              productivity. Curated and reviewed for professionals.
            </p>
          </div>

          {[
            {
              title: "Explore",
              links: [
                { href: "/tools", label: "All Tools" },
                { href: "/categories", label: "Categories" },
                { href: "/tools?featured=true", label: "Featured" },
              ],
            },
            {
              title: "Resources",
              links: [
                { href: "/contact", label: "Submit Tool" },
                { href: "/contact", label: "Contact" },
              ],
            },
            {
              title: "Legal",
              links: [
                { href: "/privacy", label: "Privacy" },
                { href: "/terms", label: "Terms" },
              ],
            },
          ].map((col) => (
            <div key={col.title}>
              <h3 className="text-[12px] font-semibold text-foreground uppercase tracking-wider mb-4">
                {col.title}
              </h3>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[14px] text-muted-foreground hover:text-foreground transition-colors duration-150"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-border mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 tech-divider">
          <p className="text-[13px] text-muted-foreground">
            &copy; {currentYear} AI Tools Directory. All rights reserved.
          </p>
          <p className="text-[13px] text-muted-foreground">
            Built with <span className="text-[#0071e3]">&#10084;</span> for the AI community.
          </p>
        </div>
      </div>
    </footer>
  );
}
