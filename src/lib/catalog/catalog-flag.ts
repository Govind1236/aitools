// ------------------------------------------------------------------
// CATALOG READ FEATURE FLAG
// ------------------------------------------------------------------
// Controls whether catalog READ traffic is served by Prisma (default)
// or Payload behind the FREEBUFF_CATALOG_READS environment variable.
//
// Supported values: "prisma" | "payload"
// Unknown values fail safely to "prisma".
// ------------------------------------------------------------------

export type CatalogSource = "prisma" | "payload";

/**
 * Read the catalog read source from the FREEBUFF_CATALOG_READS env var.
 * Falls back to "prisma" for missing or unknown values.
 */
export function resolveCatalogSource(): CatalogSource {
  const raw = (process.env.FREEBUFF_CATALOG_READS ?? "payload").trim().toLowerCase();
  if (raw === "payload") return "payload";
  return "prisma";
}
