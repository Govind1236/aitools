// ------------------------------------------------------------------
// SHARED LOGO RESOLUTION
// ------------------------------------------------------------------
// The database `Tool.logo` field is the single source of truth for a
// product's logo. There is deliberately NO slug -> logo map here.
//
// Resolution order:
//   Tool.logo (database) -> valid -> use it
//   Tool.logo missing/blank -> domain favicon -> use it
//   otherwise -> null (caller renders a generic first-letter fallback)
//
// All callers should use `getToolLogoSrc()` so a product's logo is
// resolved in exactly one place across the app.
// ------------------------------------------------------------------

export interface HasLogoSrc {
  logo?: string | null;
  websiteUrl?: string;
}

/**
 * Resolve the best logo source for a tool.
 * Returns a URL string when one can be derived, otherwise null so the
 * caller can render a generic fallback (e.g. the tool's initial).
 */
export function getToolLogoSrc(tool: HasLogoSrc): string | null {
  const dbLogo = (tool.logo || "").trim();
  if (dbLogo) {
    return dbLogo;
  }

  const domain = extractDomain(tool.websiteUrl);
  if (domain) {
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  }

  return null;
}

export function extractDomain(websiteUrl?: string): string {
  if (!websiteUrl) return "";
  try {
    return new URL(websiteUrl).hostname;
  } catch {
    return "";
  }
}
