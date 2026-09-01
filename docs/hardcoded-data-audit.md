# Freebuff — Hardcoded Data Audit

> **Date:** 2026-08-31
> **Status:** Audit only — no files modified, no packages installed, no database changes.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Hardcoded Data Files](#2-hardcoded-data-files)
3. [Hardcoded Arrays and Objects](#3-hardcoded-arrays-and-objects)
4. [Duplicate Data Sources](#4-duplicate-data-sources)
5. [Current Data Flow](#5-current-data-flow)
6. [Recommended Entities](#6-recommended-entities)
7. [Recommended Relationships](#7-recommended-relationships)
8. [Data That Should Move to CMS](#8-data-that-should-move-to-cms)
9. [Data That Should Remain in Code](#9-data-that-should-remain-in-code)
10. [Homepage Query Requirements](#10-homepage-query-requirements)
11. [Admin Requirements](#11-admin-requirements)
12. [Future CMS Content Architecture](#12-future-cms-content-architecture)
13. [Migration Risks](#13-migration-risks)

---

## 1. Executive Summary

The Freebuff Next.js application is an AI tools directory with a smart redirect/link-tracking system. Tool and category content is stored in a SQLite database via Prisma and seeded through `prisma/seed.ts`. However, **significant amounts of hardcoded content exist throughout the source code**, including AI tool logos, search terms, navigation links, pricing configurations, and category display metadata.

### Key Findings

- **45+ AI tools** are hardcoded in `prisma/seed.ts` — the largest single data source
- **`localLogos` is duplicated** in `tool-card.tsx` and `tools/[slug]/page.tsx` (identical 12-entry maps)
- **Pricing config is triplicated** across three files with inconsistent labeling ("Contact" vs "Enterprise")
- **Popular search terms are hardcoded** in two files with different data
- **Category display config** (icon, color, badge) is separate from category data in the database
- **Navigation is hardcoded** in header, footer, and admin sidebar
- **No Provider entity** exists — tools reference categories but not the companies that make them
- **`Tool.tags` is a comma-separated string** — should be a proper many-to-many relationship

---

## 2. Hardcoded Data Files

### Files Containing Hardcoded Data

| File | Hardcoded Data | Lines |
|------|---------------|-------|
| `src/components/ui/floating-ai-apps.tsx` | 12 AI tool names, colors, logos, SVGs, float positions | 6-165 |
| `src/components/ui/logo-marquee.tsx` | 11 AI tool names, logo paths | 7-19 |
| `src/components/tools/search-bar.tsx` | 9 "Trending" search terms | 7-17 |
| `src/components/tools/tool-card.tsx` | Pricing config (4 options), localLogos map (12 entries) | 15-48 |
| `src/app/tools/[slug]/page.tsx` | Duplicate localLogos map (12 entries), pricing labels (4 options) | 28-41, 92-97 |
| `src/app/page.tsx` | 5 popular searches, "100%" verified stat | 42-44, 143 |
| `src/components/ui/header.tsx` | Desktop nav (5 items), mobile nav (8 items) | 46-51, 114-181 |
| `src/components/ui/footer.tsx` | Footer link columns (3 columns, 6 links) | 39-62 |
| `src/components/admin/admin-sidebar.tsx` | Admin nav items (4 items) | 13-34 |
| `src/lib/category-config.ts` | 15 category configs (icon, color, bg, badge) | 29-138 |
| `src/lib/constants.ts` | EntityType enum (6), VerificationStatus enum (4), ATTRIBUTES (6) | 1-92 |
| `src/app/layout.tsx` | SEO metadata (title, description, keywords, OG, Twitter) | 16-51 |
| `src/app/sitemap.ts` | Static pages array (6 entries) with priorities | 8-45 |
| `src/app/admin/analytics/page.tsx` | Chart colors (5), time range options (4) | 40, 91-95 |
| `src/app/admin/tools/admin-tools-client.tsx` | Empty form defaults, entity type options (5), verification options (4), pricing options (4) | 33-49, 320-355, 365-368 |
| `src/components/ui/globe.tsx` | 7 hardcoded city coordinates | 40-48 |
| `src/app/admin/page.tsx` | Time range options | 73-77 |
| `src/lib/auth.ts` | Fallback JWT secret, session duration | 7, 10 |
| `src/lib/tool-query.ts` | Attribute-to-Prisma filter mapping (6 attributes) | 69-105 |
| `prisma/seed.ts` | All tool data (45+ tools), 15 categories, admin credentials, campaigns, sample analytics | 7-921 |
| `prisma/schema.prisma` | PricingType default ("freemium") | 59 |

---

## 3. Hardcoded Arrays and Objects

### A. AI Tool Logo Lists

| Location | Variable | Content | Count |
|----------|----------|---------|-------|
| `floating-ai-apps.tsx:6-143` | `AI_APP_ICONS` | name, color, src, SVG fallback | 12 |
| `logo-marquee.tsx:7-19` | `LOGOS` | name, src | 11 |
| `tool-card.tsx:35-48` | `localLogos` | slug -> logo URL | 12 |
| `tools/[slug]/page.tsx:28-41` | `localLogos` | slug -> logo URL (DUPLICATE) | 12 |

### B. Search/Discovery Terms

| Location | Variable | Content | Count |
|----------|----------|---------|-------|
| `search-bar.tsx:7-17` | `popularTerms` | DeepSeek, Claude 3.7, ChatGPT, Cursor, Midjourney, FLUX, v0, Suno, ElevenLabs | 9 |
| `page.tsx:42-44` | `popularSearches` | DeepSeek R1, Video Generators, Coding Assistants, Image Upscalers, Cursor | 5 |

### C. Pricing Configurations

| Location | Variable | Content | Count |
|----------|----------|---------|-------|
| `tool-card.tsx:15-32` | `pricingConfig` | free, freemium, paid, contact | 4 |
| `tools/[slug]/page.tsx:92-97` | `pricingLabels` | free, freemium, paid, contact (DUPLICATE) | 4 |
| `tools/page.tsx:213-218` | Pricing filter array | Any, Free, Freemium, Paid | 4 |
| `admin-tools-client.tsx:320-324` | Pricing select options | Free, Freemium, Paid, Contact | 4 |

### D. Navigation Data

| Location | Content | Count |
|----------|---------|-------|
| `header.tsx:46-51` | Desktop nav | 5 items |
| `header.tsx:114-181` | Mobile nav | 8 items |
| `footer.tsx:39-62` | Footer columns | 3 columns / 6 links |
| `admin-sidebar.tsx:13-34` | Admin nav | 4 items |
| `sitemap.ts:8-45` | Static pages | 6 entries |

### E. Category Configuration

| Location | Variable | Content | Count |
|----------|----------|---------|-------|
| `category-config.ts:29-45` | `CATEGORY_ORDER` | Category slugs in display order | 15 |
| `category-config.ts:47-138` | `categoryConfig` | icon, color, bg, badge per category | 15 entries |

### F. Constants/Enums

| Location | Variable | Content | Count |
|----------|----------|---------|-------|
| `constants.ts:1-8` | `EntityType` | TOOL, MODEL, AGENT, API, INFRASTRUCTURE, RESOURCE | 6 |
| `constants.ts:12-17` | `VerificationStatus` | VERIFIED, NEEDS_REVIEW, UNVERIFIED, INACTIVE | 4 |
| `constants.ts:47-88` | `ATTRIBUTES` | Free, Free Tier, Open Source, Local, API Available, No Signup | 6 |
| `analytics/page.tsx:40` | `CHART_COLORS` | 5 hex color values | 5 |

### G. Seed Data (Largest Hardcoded Dataset)

| Location | Content | Count |
|----------|---------|-------|
| `seed.ts:7-32` | Entity type slug mappings (MODEL_SLUGS, AGENT_SLUGS, API_SLUGS, INFRA_SLUGS) | 4 arrays |
| `seed.ts:72-118` | Category definitions | 15 |
| `seed.ts:126-834` | Complete tool records (name, slug, description, URL, pricing, category, rating, tags, hostingGuide) | **45+ tools** |
| `seed.ts:851-855` | Campaign definitions | 3 |
| `seed.ts:877-905` | Sample analytics data (sources, devices, countries, browsers, OS) | 300 events |

---

## 4. Duplicate Data Sources

### Critical: `localLogos` (2 locations)

The `localLogos` mapping (slug -> logo URL) exists in **two separate files** with **identical content**:

1. **`src/components/tools/tool-card.tsx:35-48`** -- Used by `ToolCard` component
2. **`src/app/tools/[slug]/page.tsx:28-41`** -- Used by individual tool page

**Impact:** Any new tool logo requires updating both files. This is a maintenance hazard.

### Critical: Pricing Configuration (3 locations)

Pricing labels/styles are defined in **three places**:

1. **`tool-card.tsx:15-32`** -- `pricingConfig` (card display, labels "contact" as "Contact")
2. **`tools/[slug]/page.tsx:92-97`** -- `pricingLabels` (detail page, labels "contact" as "Enterprise")
3. **`tools/page.tsx:213-218`** -- Filter option labels

**Inconsistency:** The detail page labels "contact" as "Enterprise" while the card labels it as "Contact".

### Moderate: Popular Search Terms (2 locations)

Search terms appear in **two places** with **different data**:

1. **`search-bar.tsx:7-17`** -- `popularTerms`: DeepSeek, Claude 3.7, ChatGPT, Cursor, Midjourney, FLUX, v0, Suno, ElevenLabs (9 items)
2. **`page.tsx:42-44`** -- `popularSearches`: DeepSeek R1, Video Generators, Coding Assistants, Image Upscalers, Cursor (5 items)

These overlap partially (DeepSeek/DeepSeek R1, Cursor) but differ significantly.

### Moderate: Attribute Filtering Logic (3 locations)

Attribute-to-Prisma-filter mapping is duplicated in three places:

1. **`src/lib/constants.ts:47-88`** -- `ATTRIBUTES` array with `matches()` functions
2. **`src/lib/tool-query.ts:69-105`** -- `buildAttributeRules()` function
3. **`src/app/categories/[slug]/page.tsx:74-89`** -- Inline attribute condition building

Three separate implementations of the same filter logic.

---

## 5. Current Data Flow

### Architecture

```
prisma/seed.ts ──> prisma/dev.db ──> Prisma Client ──> API Routes / Server Components
                                        │
                                        ├── src/lib/db.ts (singleton)
                                        ├── src/lib/tool-query.ts (query builder)
                                        └── src/lib/analytics.ts (analytics queries)
```

### Data Sources by Layer

| Layer | Source | Type |
|-------|--------|------|
| **Database** | Tool records, Categories, Campaigns, ClickEvents, SearchQueries, Users, Sessions | Prisma/SQLite |
| **Hardcoded Config** | EntityType, VerificationStatus, ATTRIBUTES, categoryConfig, pricingConfig, localLogos | TypeScript constants |
| **Hardcoded Content** | AI_APP_ICONS, LOGOS, popularTerms, popularSearches, navigation links, SEO metadata | Inline in components/pages |
| **Seed Data** | All 45+ tool records, 15 categories, sample analytics | `prisma/seed.ts` |

### Key Observations

1. **Tool/category content is already in the database** -- the seed script populates it, and all page components query Prisma
2. **UI presentation data is hardcoded** -- logos, colors, icons, labels, positions are all in TypeScript files
3. **No intermediate data layer** -- components query Prisma directly (server components) or fetch from API routes (client components)
4. **No caching layer** -- every page load hits the database
5. **No content management** -- adding a tool requires either running the seed script or using the admin panel

---

## 6. Recommended Entities

### Current Database Models (Prisma Schema)

| Model | Purpose | Key Fields |
|-------|---------|------------|
| **User** | Admin authentication | email, passwordHash, role |
| **Session** | JWT sessions | token, expiresAt |
| **Category** | Tool categories | name, slug, description, sortOrder |
| **Tool** | AI products | name, slug, description, websiteUrl, pricingType, categoryId, entityType, tags, metadata |
| **Campaign** | Marketing campaigns | name, description, isActive |
| **RedirectLink** | Tracked shortlinks | slug, destination, toolId, clickCount |
| **ClickEvent** | Analytics events | referrer, UTM params, country, device, browser |
| **GeoRoute** | Country-specific routing | country, destination |
| **SearchQuery** | Search analytics | query, resultCount |

### New Entities Needed

| Entity | Purpose | Fields |
|--------|---------|--------|
| **Provider** | AI companies/providers (OpenAI, Anthropic, Google, etc.) | name, slug, logo, website, description |
| **Tag** | Structured tags (currently comma-separated in `Tool.tags`) | name, slug |
| **ProductTag** | Many-to-many junction | productId, tagId |
| **ProductRelation** | Related/alternative products | productId, relatedProductId, relationType |
| **Page** | CMS pages (privacy, terms, about, etc.) | title, slug, content, metaDescription |
| **NavigationItem** | Managed navigation | label, href, sortOrder, parentId, isVisible |
| **SiteSettings** | Global site config | key, value, type |

---

## 7. Recommended Relationships

```
AI Product (Tool)
 ├── Category (many-to-one)
 ├── Provider (many-to-one) [NEW]
 ├── Tags (many-to-many) [NEW -- currently comma-separated string]
 ├── RedirectLink (one-to-one)
 ├── ClickEvent (one-to-many, via RedirectLink)
 └── RelatedProducts (many-to-many) [NEW]

Category
 ├── AI Products (one-to-many)
 ├── Icon/Color config (currently in category-config.ts) [MOVE TO DB]
 └── ParentCategory (self-referential) [NEW -- for subcategories]

Provider [NEW]
 ├── Name, slug, logo, website
 └── AI Products (one-to-many)

Tag [NEW]
 ├── Name, slug
 └── AI Products (many-to-many)
```

---

## 8. Data That Should Move to CMS

| Data | Current Location | Priority | Reason |
|------|-----------------|----------|--------|
| **AI Tool records** | `prisma/seed.ts` -> database | **HIGH** | Core content, needs CMS management |
| **Categories** | `prisma/seed.ts` -> database | **HIGH** | Core taxonomy, needs CMS management |
| **Category display config** | `category-config.ts` | **HIGH** | Tightly coupled to categories, should live with them |
| **Tool logos** | `localLogos` in 2 files + `AI_APP_ICONS` + `LOGOS` | **HIGH** | Duplicate, should come from tool records |
| **Popular search terms** | `search-bar.tsx` + `page.tsx` | **MEDIUM** | Should be configurable/admin-managed |
| **Navigation links** | `header.tsx` + `footer.tsx` | **MEDIUM** | Should be CMS-managed for flexibility |
| **SEO metadata** | `layout.tsx` + page files | **MEDIUM** | Global SEO should be configurable |
| **Homepage sections** | `page.tsx` (hardcoded layout) | **MEDIUM** | Section order/content should be CMS-controlled |
| **Footer content** | `footer.tsx` | **LOW** | Static but should be editable |
| **Static pages** | privacy, terms, contact | **LOW** | Could be CMS-managed rich text |

---

## 9. Data That Should Remain in Code

| Data | Location | Reason |
|------|----------|--------|
| **EntityType enum** | `constants.ts` | Application-level enum, not content |
| **VerificationStatus enum** | `constants.ts` | Application-level enum, not content |
| **ATTRIBUTES filter config** | `constants.ts` | Application logic, derives from other fields |
| **Pricing display config** | `tool-card.tsx`, `tools/[slug]/page.tsx` | UI presentation logic |
| **Chart colors** | `analytics/page.tsx` | UI design constant |
| **Bot detection patterns** | `analytics.ts` | Application logic |
| **JWT config** | `auth.ts` | Security configuration |
| **Session duration** | `auth.ts` | Application config |
| **API User-Agent string** | `scrape/route.ts` | Application identity |
| **Globe markers** | `globe.tsx` | Decorative UI element |
| **Floating icon positions** | `floating-ai-apps.tsx` | UI animation config |

---

## 10. Homepage Query Requirements

| Query | Current Implementation | Notes |
|-------|----------------------|-------|
| `getFeaturedProducts()` | `db.tool.findMany({ where: { isFeatured: true }, take: 4 })` | Already in `page.tsx:19-24` |
| `getTrendingProducts()` | Same as featured (using `isFeatured` flag) | Should use a `trendingScore` or analytics-based ranking |
| `getRecentlyAddedProducts()` | `db.tool.findMany({ orderBy: { createdAt: "desc" }, take: 3 })` | Already in `page.tsx:26-31` |
| `getFreeProducts()` | `db.tool.findMany({ where: { pricingType: "free" }, take: 3 })` | Already in `page.tsx:33-38` |
| `getPopularCategories()` | `db.category.findMany({ include: { _count: true } })` | Already in `page.tsx:14-17` |
| `getTotalToolCount()` | `db.tool.count({ where: { isPublished: true } })` | Already in `page.tsx:39` |
| `getPopularSearches()` | **HARDCODED** in `page.tsx:42-44` | Should come from `SearchQuery` table aggregation |
| `getTrendingSearches()` | **HARDCODED** in `search-bar.tsx:7-17` | Should come from `SearchQuery` table |

---

## 11. Admin Requirements

### AI Product Management Fields

| Field | Current | In DB | Notes |
|-------|---------|-------|-------|
| Name | Yes | Yes | |
| Slug | Yes | Yes | Auto-generated |
| Description | Yes | Yes | |
| Logo | Partial | Partial | DB has `logo` field but `localLogos` overrides it |
| Official URL | Yes | Yes (`websiteUrl`) | |
| Type | Yes | Yes (`entityType`) | TOOL, MODEL, AGENT, API, INFRASTRUCTURE, RESOURCE |
| Provider | No | No | **NOT IN SCHEMA** -- needs new entity |
| Categories | Yes | Yes (`categoryId`) | Single category only (should be many-to-many?) |
| Tags | Partial | Partial | Comma-separated string, should be structured |
| Pricing | Yes | Yes (`pricingType`) | free, freemium, paid, contact |
| Free Tier | Partial | Partial | Derived from pricingType, not explicit |
| Features | No | No | Not captured (should be structured list) |
| Use Cases | No | No | Not captured |
| Verification Status | Yes | Yes | |
| Last Verified | Yes | Yes (`lastVerifiedAt`) | |
| Source URL | Yes | Yes (`sourceUrl`) | |
| Documentation URL | No | No | Not in schema |
| Pricing URL | No | No | Not in schema |
| Published Status | Yes | Yes (`isPublished`) | |
| Featured Status | Yes | Yes (`isFeatured`) | |
| Rating | Yes | Yes | |
| Metadata (JSON) | Yes | Yes (`metadata`) | Flexible JSON field |
| Hosting Guide | Yes | Yes (`hostingGuide`) | Markdown content |

### Admin Panel Current Capabilities

The admin panel (`admin-tools-client.tsx`) supports:
- Create/Edit/Delete tools
- Quick import via URL scraping
- Set pricing, entity type, verification status
- Toggle published/featured status
- View click counts

### Missing Admin Features

- Bulk import/export
- Category management (currently only via seed)
- Tag management
- Provider management
- Content scheduling
- Version history/audit log
- Image upload (currently URL-only)

---

## 12. Future CMS Content Architecture

### Education Module (Future)

```
Course
 ├── Lessons (one-to-many)
 ├── Categories (many-to-many)
 └── Author (User relation)

Lesson
 ├── Course (many-to-one)
 ├── Content (rich text/video embed)
 └── Order (sort order)

LearningPath
 ├── Courses (ordered many-to-many)
 └── Description

Resource
 ├── Type (tutorial, guide, template, etc.)
 ├── Content (rich text)
 └── Tags (many-to-many)
```

### Community Module (Future)

```
Profile
 ├── User (one-to-one)
 ├── Bio, avatar, social links
 └── Reputation score

Post
 ├── Author (Profile)
 ├── Content (rich text)
 ├── Tags (many-to-many)
 └── Comments (one-to-many)

Comment
 ├── Post (many-to-one)
 ├── Author (Profile)
 └── ParentComment (self-referential for threads)

Community
 ├── Members (many-to-many)
 ├── Posts (one-to-many)
 └── Description
```

### Architecture Considerations

The current Prisma schema can be extended to support these, but Payload CMS would provide:
- Built-in admin panel for all content types
- Rich text editor
- Version control
- Access control
- Localization
- Workflow/approval flows

---

## 13. Migration Risks

### High Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Data loss during Payload migration** | Tool/category data could be lost | Full backup before migration; verify seed data matches |
| **URL structure changes** | SEO juice lost if slugs change | Maintain exact same URL patterns |
| **Broken admin workflow** | Admins can't manage content | Keep admin panel functional during transition |
| **Search reindexing** | Search stops working | Implement search migration alongside data |

### Medium Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| **localLogos removal** | Broken images if tool.logo isn't populated | Ensure all tools have logo field set before removing hardcoded map |
| **Category config migration** | Visual regression if icon/color config lost | Migrate categoryConfig.ts data to Payload fields |
| **Popular searches change** | Discovery experience degrades | Seed SearchQuery table with historical data |
| **Navigation changes** | Users can't find features | Keep nav structure identical during migration |

### Low Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Performance regression** | Slower page loads | Benchmark before/after; implement caching |
| **Payload learning curve** | Developer productivity dip | Document all content types thoroughly |
| **SQLite -> PostgreSQL** | Data type differences | Test migration with full dataset |

---

## Appendix: Seed Data Summary

### Tools by Category (from `prisma/seed.ts`)

| Category | Tool Count | Examples |
|----------|-----------|----------|
| Developer | 14 | Groq API, Gemini API, GitHub Models, Ollama, Vercel, Supabase |
| Models | 5 | DeepSeek R1, Llama 3.1, Qwen 2.5, Mistral NeMo, Phi-3 |
| Agents | 4 | OpenDevin, Browser Use, AutoGPT, Devin |
| Productivity | 5 | DeepSeek Chat, ChatGPT (Free), Claude (Free), HuggingChat, DuckDuckGo AI Chat |
| Coding | 4 | Codeium, Cursor (Free), Continue.dev, Aider |
| Image | 5 | FLUX.1, Civitai, Stable Diffusion WebUI, ComfyUI, Bing Image Creator |
| Audio | 4 | ElevenLabs (Free), Suno AI (Free), Bark, Whisper |
| Research | 3 | Perplexity AI (Free), Google NotebookLM, Phind |

### Entity Type Distribution (from seed slug mappings)

| Entity Type | Slugs |
|-------------|-------|
| MODEL | deepseek-r1, llama-3-1, qwen, mistral, phi-3 |
| AGENT | opendevin, browser-use, autogpt, devin |
| API | groq-api, gemini-api, github-models, hf-inference, cohere-api, together-ai, vercel-sdk, chatbot-arena, google-ai-studio, v0, bolt-new, lovable |
| INFRASTRUCTURE | pinecone, supabase-vector, qdrant, vercel, render, cloudflare-pages, supabase, neon |
| TOOL | (all remaining) |
