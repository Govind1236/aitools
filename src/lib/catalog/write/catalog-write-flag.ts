// ------------------------------------------------------------------
// CATALOG WRITE FEATURE FLAG
// ------------------------------------------------------------------
// Controls whether AUTHORITATIVE catalog CONTENT writes are routed to
// Prisma or Payload, behind the FREEBUFF_CATALOG_WRITE_MODE environment
// variable.
//
// Supported values: "prisma" | "payload"
// Default:          "prisma"  (safest — preserves the legacy authority)
// Unknown values fail safely to "prisma". This gives an immediate
// rollback switch: set FREEBUFF_CATALOG_WRITE_MODE=prisma with no code
// rollback required.
//
// NOTE: A narrowly-scoped Prisma COMPATIBILITY synchronizer runs
// regardless of mode so that the operational dependency
// `RedirectLink.toolId -> Prisma Tool.id` is always preserved for
// runtime-created catalog records. See prisma-compat-sync.ts.
// ------------------------------------------------------------------

export type CatalogWriteMode = "prisma" | "payload";

/**
 * Read the catalog write mode from the FREEBUFF_CATALOG_WRITE_MODE env var.
 * Falls back to "prisma" for missing or unknown values.
 */
export function resolveCatalogWriteMode(): CatalogWriteMode {
  const raw = (process.env.FREEBUFF_CATALOG_WRITE_MODE ?? "prisma")
    .trim()
    .toLowerCase();
  if (raw === "payload") return "payload";
  return "prisma";
}
