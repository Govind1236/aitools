// ------------------------------------------------------------------
// SHARED NAVIGATION DEFINITION
// ------------------------------------------------------------------
// Single source of truth for public navigation links. Both desktop and
// mobile menus derive from this array, eliminating duplication.
//
// Categories are NOT hardcoded here — they are loaded from Prisma at
// render time and displayed via the CategoryMenu component.
//
// Admin navigation remains separate (admin-sidebar.tsx).
// ------------------------------------------------------------------

export interface NavLink {
  href: string;
  label: string;
}

/** Primary navigation — only routes that actually exist. */
export const PUBLIC_NAV_LINKS: NavLink[] = [
  { href: "/tools", label: "Tools" },
  { href: "/categories", label: "Categories" },
];

/** Search route — the tools directory doubles as the search experience. */
export const SEARCH_HREF = "/tools";

/** Submit Tool — the contact page handles submissions. */
export const SUBMIT_TOOL_HREF = "/contact";

/** Footer navigation groups. */
export const FOOTER_NAV = {
  explore: [
    { href: "/tools", label: "All Tools" },
    { href: "/categories", label: "Categories" },
  ],
  resources: [
    { href: "/contact", label: "Submit Tool" },
    { href: "/contact", label: "Contact" },
  ],
  legal: [
    { href: "/privacy", label: "Privacy" },
    { href: "/terms", label: "Terms" },
  ],
} as const;
