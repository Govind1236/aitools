// ------------------------------------------------------------------
// PRISMA CATALOG WRITE REPOSITORY (rollback / legacy-authoritative mode)
// ------------------------------------------------------------------
// This is the rollback position for FREEBUFF_CATALOG_WRITE_MODE=prisma.
//
// Phase 4A makes Payload the authoritative catalog CONTENT store, and the
// Prisma catalog rows are maintained as a narrowly-scoped COMPATIBILITY
// layer keeping the operational dependency `RedirectLink.toolId ->
// Prisma Tool.id` intact (see prisma-compat-sync.ts).
//
// Because the runtime catalog READS (FREEBUFF_CATALOG_READS, default
// "payload") and the /go/[slug] redirect both read from Payload, the
// write pipeline must keep Payload consistent in BOTH modes for the
// application to remain operational and to make the env-flag rollback a
// no-op (no code rollback required).
//
// Consequently, this repository intentionally routes through the same
// consistency-maintaining implementation as the payload repository. Both
// modes keep Payload (content + redirect the app reads) and Prisma
// (operational compatibility) in step. The mode flag designates the
// documented authority and preserves the ability to later diverge without
// a schema or API change.
//
// ⚠️ Documented scope decision (see final Phase 4A report): for
// production-safety we do NOT introduce a brand-new, unproven
// double-database Prisma-authoritative CRUD in this phase. The Prisma
// compatibility synchronizer already keeps Prisma Tool/ToolTag/RedirectLink
// current with the minimum operational fields, which is what rollback
// requires.
// ------------------------------------------------------------------

import { payloadCatalogWrite } from "./payload-catalog-write";
import type { CatalogWriteRepository } from "./catalog-write-repository";

export const prismaCatalogWrite: CatalogWriteRepository = payloadCatalogWrite;
