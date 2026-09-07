// ------------------------------------------------------------------
// CATALOG WRITE REPOSITORY — RESOLVER
// ------------------------------------------------------------------
// Returns the active CatalogWriteRepository based on the
// FREEBUFF_CATALOG_WRITE_MODE feature flag. All catalog CONTENT writes in
// the application should go through this resolver rather than importing a
// concrete implementation directly.
//
//   FREEBUFF_CATALOG_WRITE_MODE=payload -> Payload authoritative (Phase 4A)
//   FREEBUFF_CATALOG_WRITE_MODE=prisma  -> Default / rollback position
//   missing / unknown                   -> prisma (safe default)
//
// Rollback: set FREEBUFF_CATALOG_WRITE_MODE=prisma. No code rollback
// required. See catalog-write-flag.ts.
// ------------------------------------------------------------------

import type { CatalogWriteRepository } from "./catalog-write-repository";
import { resolveCatalogWriteMode } from "./catalog-write-flag";
import { payloadCatalogWrite } from "./payload-catalog-write";
import { prismaCatalogWrite } from "./prisma-catalog-write";

let _cache: CatalogWriteRepository | null = null;

/**
 * Get the active CatalogWriteRepository. Cached per process so the flag is
 * only read once. In the current cutover both modes preserve Payload
 * content consistency + Prisma operational compatibility; see
 * prisma-catalog-write.ts for the documented scope decision.
 */
export function getCatalogWriteRepository(): CatalogWriteRepository {
  if (_cache) return _cache;
  const mode = resolveCatalogWriteMode();
  _cache = mode === "payload" ? payloadCatalogWrite : prismaCatalogWrite;
  return _cache;
}

/** Re-expose the resolver for logging/tests. */
export { resolveCatalogWriteMode } from "./catalog-write-flag";
export type { CatalogWriteMode } from "./catalog-write-flag";
