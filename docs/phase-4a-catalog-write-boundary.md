# Phase 4A — Catalog Write Boundary

This document describes the catalog CONTENT write boundary introduced in
Phase 4A of the Freebuff Payload migration.

## Goal

Move catalog CONTENT writes through a single, explicit, feature-flagged
boundary while keeping Payload authoritative for catalog content in the
target state and preserving the Prisma operational compatibility layer
(`RedirectLink.toolId -> Prisma Tool.id`).

## Feature flag

`FREEBUFF_CATALOG_WRITE_MODE`

| Value     | Meaning                                                                 |
|-----------|-------------------------------------------------------------------------|
| `payload` | Payload CMS is authoritative for catalog content (Phase 4A target).     |
| `prisma`  | Default / rollback position.                                            |

- Missing or unknown values **safely fall back to `prisma`**.
- Resolver: `src/lib/catalog/write/catalog-write-flag.ts`.

**Rollback procedure**: set `FREEBUFF_CATALOG_WRITE_MODE=prisma`. No code
rollback required.

## Files

```
src/lib/catalog/write/
  catalog-write-flag.ts          # flag resolution (default prisma)
  catalog-write-types.ts         # domain DTOs
  catalog-write-repository.ts    # CatalogWriteRepository interface (explicit ops)
  prisma-compat-sync.ts          # ⚠️ transitional Prisma compatibility synchronizer
  payload-catalog-write.ts       # Payload-authoritative implementation
  prisma-catalog-write.ts        # rollback / legacy-authoritative implementation
  index.ts                       # getCatalogWriteRepository() resolver
```

## Domain operations (not generic CRUD)

- `createTool` / `updateTool`
- `publishTool` / `unpublishTool` (soft, preferred over hard delete)
- `deleteTool` (preserves existing admin hard-delete behaviour)
- `createCategory` / `updateCategory`
- `createProvider` / `updateProvider`
- `createTag` / `updateTag`

Each returns a `WriteResponse` so callers never silently report success on a
partial failure.

## Ownership

- **Payload** — authoritative catalog CONTENT (Tool/Category/Provider/Tag/
  relationships/descriptions/URLs/metadata/SEO/verification/featured/etc.).
- **Prisma** — operational systems (RedirectLink, ClickEvent, GeoRoute,
  Campaign, SearchQuery, User, Session).
- **RedirectLink** is **operational / Prisma-owned**. It is NOT written by the
  catalog write boundary as catalog content. The existing admin Tool page
  creates a redirect on tool creation (Payload redirect, read by `/go/[slug]`),
  and the Prisma compatibility synchronizer preserves the operational FK.

## ⚠️ Prisma compatibility synchronizer (transitional)

`src/lib/catalog/write/prisma-compat-sync.ts` runs in BOTH modes. It keeps a
**narrowly-scoped** Prisma `Tool` row, its `ToolTag` junction, and its
`RedirectLink` identity in step so the operational dependency
`RedirectLink.toolId -> Prisma Tool.id` is preserved for runtime-created
records. Only the minimum operational fields are synchronized — it is NOT a
second catalog authority.

Minimum synchronized Prisma Tool fields: `id`, `name`, `slug`, `websiteUrl`,
`isPublished`, `categoryId`, `providerId`, `pricingType`, `entityType`, plus
`ToolTag` rows (by Prisma tag id) and the `RedirectLink` row.

### ToolTag semantics (preserve vs clear)

`syncPrismaToolTags` treats the two "no tags" forms differently:

- `tagPrismaIds === undefined` → **PRESERVE existing ToolTag rows** (caller did
  not change the tag set — e.g. `publishTool`, `unpublishTool`, or an
  `updateTool` that left tags untouched).
- `tagPrismaIds === []` → **explicitly CLEAR** the set (caller removed all tags).

ToolTag is Prisma-owned compatibility data; the source of truth for the
relationship remains the Payload `structuredTags` relationship.

## Safe new-tool creation order

New tool creation establishes the cross-store identity bridge and therefore
uses a strict order so a partially-linked tool is never created:

1. Validate inputs and slug uniqueness (against Payload).
2. Resolve/find-or-create Payload tags.
3. Resolve Payload category/provider/tag ids → Prisma ids via `legacyPrismaId`.
4. **Create the Prisma compatibility identity row FIRST** and obtain the Prisma
   `Tool.id` (fails loudly if the category has no Prisma counterpart — no tool
   is created).
5. Create the Payload `Tool` **with `legacyPrismaId = Prisma Tool.id`**.
6. Create the Payload `redirect-links` row (existing application behaviour).
7. The Prisma `ToolTag` junction + Prisma `RedirectLink` (toolId) are
   established by the compatibility synchronizer in step 4.

**Failure handling**: if any step after the Prisma identity fails, the
`reconcileFailedToolCreate` cleanup removes the Payload redirect-link (if any),
the Payload tool (if any), and the Prisma compatibility rows. The operation
throws — never reports success on a partial creation.

## Failure behaviour

- Authoritative Payload write failure → `WriteResponse { ok: false }`; the
  route returns the existing error/status mapping. No silent success.
- Prisma compatibility sync failure → the operation rejects loudly (propagates
  as an error); no corrupted partial compatibility record is silently accepted.
  For a new-tool create, partial artifacts are reconciled/removed.
- Rollback through the env flag works because both modes keep Payload + Prisma
  compat consistent.
