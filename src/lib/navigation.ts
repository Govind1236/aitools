// ------------------------------------------------------------------
// SHARED NAVIGATION DEFINITION
// ------------------------------------------------------------------
// Single source of truth for public navigation links. Both desktop and
// mobile menus derive from this array, eliminating duplication.
//
// Admin navigation remains separate (admin-sidebar.tsx) because it
// is an application/admin concern, not public site navigation.
// ------------------------------------------------------------------

export interface NavLink {
  href: string;
  label: string;
  /** If set, only shown in the specified context(s). */
  mobileOnly?: boolean;
  adminOnly?: boolean;
}

/** Primary public navigation links (desktop + mobile). */
export const PUBLIC_NAV_LINKS: NavLink[] = [
  { href: "/tools", label: "Explore" },
  { href: "/categories/developer", label: "Developer" },
  { href: "/categories/agents", label: "Agents" },
  { href: "/categories/models", label: "Models" },
  { href: "/tools?pricing=free", label: "Free Tools" },
];

/** Additional links shown only in the mobile menu. */
export const MOBILE_EXTRA_LINKS: NavLink[] = [
  { href: "/tools?pricing=freemium", label: "Freemium", mobileOnly: true },
  { href: "/contact", label: "Contact", mobileOnly: true },
];
