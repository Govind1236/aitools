"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Beaker,
  Link2,
  BarChart3,
  ArrowLeft,
} from "lucide-react";

const navItems = [
  {
    label: "Overview",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Tools",
    href: "/admin/tools",
    icon: Beaker,
  },
  {
    label: "Redirect Links",
    href: "/admin/links",
    icon: Link2,
  },
  {
    label: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex w-[240px] bg-white border-r border-slate-200 flex-col shrink-0">
      <div className="p-5 border-b border-slate-100">
        <h2 className="text-[14px] font-semibold text-slate-900">Admin</h2>
        <p className="text-[12px] text-slate-400 mt-0.5">
          Manage your directory
        </p>
      </div>

      <nav className="flex-1 p-3 space-y-0.5" aria-label="Admin navigation">
        {navItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-colors duration-150 ${
                isActive
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              <item.icon className="w-4 h-4" strokeWidth={1.5} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-100">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 text-[13px] text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-md transition-colors duration-150"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
          <span>Back to site</span>
        </Link>
      </div>
    </aside>
  );
}
