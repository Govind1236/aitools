import type { CatalogRepository } from "./catalog-repository";
import { resolveCatalogSource } from "./catalog-flag";
import { prismaCatalog } from "./prisma-catalog";
import { payloadCatalog } from "./payload-catalog";

// ------------------------------------------------------------------
// CATALOG REPOSITORY RESOLVER
// ------------------------------------------------------------------
// Returns the active CatalogRepository based on the FREEBUFF_CATALOG_READS
// feature flag. All catalog reads in the application should go through
// this resolver rather than importing a concrete implementation directly.
// ------------------------------------------------------------------

let _cache: CatalogRepository | null = null;

/**
 * Get the active CatalogRepository.
 * Cached per process so the flag is only read once.
 */
export function getCatalogRepository(): CatalogRepository {
  if (_cache) return _cache;
  const source = resolveCatalogSource();
  _cache = source === "payload" ? payloadCatalog : prismaCatalog;
  return _cache;
}
