# Data Consolidation Report

**Task:** Make the database the single source of truth for catalogue content (logos, pricing, popular searches, categories, attributes) — without installing a CMS, changing the DB engine, or redesigning the UI.

**Status:** COMPLETE. Build green, lint clean, all public surfaces verified in-browser.

---

## 1. What was NOT done (constraints respected)

- No CMS installed (no Payload/Directus).
- No Prisma/Next.js/database engine replaced.
- No SQLite → PostgreSQL migration.
- No `prisma migrate reset`; no DB wiped.
- No existing tools/categories deleted.
- No app redesign; visual design unchanged.

A pre-change DB backup was taken at `prisma/dev.db.backup-20260901-004938.bak`.

---

## 2. Files created (new shared single-source modules)

| File | Purpose |
|------|---------|
| `src/lib/pricing.ts` | `PRICING_TYPES`, `PRICING_CONFIG` (labels + badges), `getPricingConfig()`, `getPricingLabel()`, `getPricingFilterOptions()`. Single source for pricing UI. |
| `src/lib/logo.ts` | `getToolLogoSrc()` (DB `logo` → domain favicon → generic), `extractDomain()`. |
| `src/lib/attributes.ts` | `ATTRIBUTES` with both `matches` (for pre-computed tool metadata) and `toPrisma()`; `getAttribute()`; `buildAttributeWhere()`. Single filter source. |
| `src/lib/searches.ts` | `getPopularSearches(limit)` reading the `SearchQuery` table; `POPULAR_SEARCH_FALLBACK` + `INVALID_QUERY` blocklist used only when history is insufficient. |
| `src/lib/queries/tools.ts` | Reusable server queries: `getPublishedToolCount`, `getVerifiedToolCount`, `getFeaturedTools`, `getTrendingTools`, `getRecentTools`, `getFreeTools`, `getToolBySlug`, `getToolAlternatives`. |
| `src/lib/queries/categories.ts` | `getAllCategories()`, `getActiveCategories()` (filters to categories with ≥1 published tool). |

## 3. Files modified

- **`src/lib/constants.ts`** — attributes now re-exported from `./attributes`; added `VERIFICATION_LABELS` / `getVerificationLabel()`.
- **`src/lib/tool-query.ts`** — removed inline `buildAttributeRules`; uses shared `buildAttributeWhere`.
- **`src/lib/category-config.ts`** — added `FALLBACK_CATEGORY_META` so `getCategoryMeta()` never crashes on a DB-created category lacking a presentation entry; documented presentation/content separation. The `categoryConfig` slug→icon/color map remains the **single** presentation mapping for categories.
- **`src/components/tools/tool-card.tsx`** — removed `localLogos` and local pricing config; uses `getToolLogoSrc()` + `getPricingConfig()`.
- **`src/components/tools/search-bar.tsx`** — removed hardcoded `popularTerms` array; now accepts a `popularTerms: string[]` prop.
- **`src/app/page.tsx`** (homepage) — removed hardcoded `popularSearches` array and unused `db` import; drives hero stats, popular searches, trending, recently added, free tools, and category counts from DB queries. Search bar receives `popularTerms` from `getPopularSearches()`.
- **`src/app/tools/page.tsx`** — pricing filter options from `getPricingFilterOptions()`; `db.searchQuery` recording retained (single source for popular searches).
- **`src/app/tools/[slug]/page.tsx`** — removed `localLogos` + inconsistent local pricing labels (incl. the old "Enterprise" label for `contact`); uses shared logo/pricing/verification helpers; now centralised `contact` → "Contact".
- **`src/app/categories/page.tsx`** — replaced duplicated `db.category.findMany` + JS filter with `getActiveCategories()`.
- **`src/app/categories/[slug]/page.tsx`** — replaced inline attribute building + duplicate category query with `buildToolWhere()` + `getActiveCategories()`; `notFound()` for inactive categories.
- **`src/app/admin/tools/page.tsx`** — now maps `tags` into the admin client payload.
- **`src/app/admin/tools/admin-tools-client.tsx`** — added `tags` to the `Tool` interface and **fixed the bug where editing always saved `tags: ""`** (now preserves existing tags); entity-type dropdown now includes `INFRASTRUCTURE`; pricing / entity-type / verification dropdowns and table cells now use the shared `pricing.ts` / `constants.ts` sources instead of duplicated literals.
- **`src/components/ui/floating-ai-apps.tsx`**, **`src/components/ui/logo-marquee.tsx`** — decorative-only; added clear comments marking them as presentation UI, not a catalogue source.

## 4. Duplicate data removed / centralised

- Local logo maps (`localLogos`) removed from `tool-card.tsx` and `tools/[slug]/page.tsx`. These maps were effectively dead code (their keys matched zero DB slugs). All tool logos now route through `getToolLogoSrc()` → DB `logo` → domain favicon → generic fallback.
- Duplicated pricing label maps removed; all consumers use `pricing.ts`.
- Attribute condition logic was triplicated (`constants.ts`, `tool-query.ts`, `categories/[slug]/page.tsx`) — now consolidated into `attributes.ts` with `toPrisma()`.
- Duplicated category listing query + filter in `categories/page.tsx` replaced with shared helper.
- Verification-label mapping centralised in `constants.ts` (`getVerificationLabel`).

## 5. Database changes

- **Made:** none. No schema changes, no migration, no data writes by this task.
- **Not made (by design):** tool logos were **not** populated in the DB via guessed slug→logo mappings. Because `localLogos` keys did not match any DB slug, any guessed mapping would be unreliable; the correct path is for admin to set `Tool.logo` per product (the DB column already exists and the UI reads it first). Popular searches and category presentation are intentionally DB-/helper-driven without adding CMS columns.

## 6. Verified functionality (in-browser)

- Homepage: DB-derived popular searches (`midjourney`, `fast`, `video generators`, `claude 3.7`, `cursor`), trending/featured/recent/free sections, category counts, "Search 54+ AI tools", verified %.
- Tools directory (`/tools`): 54 tools; category, pricing (Free/Freemium/Paid/Contact), entity type (Tools/Models/Agents/APIs/Infrastructures/Resources), and attribute filters all render.
- Category pages: `/categories` shows only active categories ("8 categories / 54 tools"); `/categories/developer` shows 24 tools + filters.
- Tool detail: correct pricing badge, centralised verification label, "Visit …" → `/go/<slug>`.
- `/go/chatgpt-free` → 302 to `https://chat.openai.com/`.
- `/sitemap.xml`, `/robots.txt` render (tools/tools-Detail routes included; `/admin`+`/api`+`/go` disallowed).
- `npm run build` clean (all 27 routes); full `npx eslint` on `src/` has zero errors.

## 7. Remaining hardcoded content (accepted / intentional)

- **Category presentation** (icon, color, badge per slug) remains a code-level map in `category-config.ts`. Rationale: converting to CMS-driven icons is out of scope and would require a new editable field + UI. It is already the **single** mapping, and it is robust for new categories via `FALLBACK_CATEGORY_META`.
- **Decorative assets** in `floating-ai-apps.tsx` / `logo-marquee.tsx` (brand logos in the hero/marquee) are presentation-only and clearly marked; they are not a catalogue source.
- **`Tool.logo` is empty for all 54 tools.** Until admin uploads logos, the fallback (domain favicon) applies (occasional Google favicon 404s in dev are expected).

## 8. Pre-existing issue observed (not a regression)

- Hero stat counters (`AnimatedCounter`) display `0` in the headless browser because they animate via `requestAnimationFrame` which is throttled there. The underlying values passed are correct (`54` / `15` / `100%`). Component was not modified by this task.

## 9. Next architecture step (recommended)

Make `Category.logo`/`Category.bgGradient` (or reuse existing columns) API-editable and have a single presentation module serve it, so category presentation also becomes DB-driven without a CMS. Tracked in `docs/hardcoded-data-audit.md` §13 (no migration performed in this task).
