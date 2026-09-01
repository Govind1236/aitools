# AI Tools Directory — Project Overview

## What is this app?

**AI Tools Directory** is a production-ready MVP that combines two products in one:

1. **A public AI tools directory** — a browsable, searchable catalog of AI tools (20+ tools across 10 categories), similar to There's An AI For That or Futurepedia.
2. **A Smart Redirect / Link-Tracking platform** — every tool link is a tracked shortlink (`/go/:slug`) that records click analytics, UTM campaign data, device/browser/OS info, and supports country-based geo routing.

The primary audience model: the site is a marketing/affiliate destination. Visitors discover AI tools, and when they click a tool's "Visit" button they are routed through a tracked redirect so the operator can measure clicks, traffic sources, and campaign effectiveness before sending them onward (optionally to an affiliate URL).

## Key features

| Feature | Description |
|---------|-------------|
| **Public directory** | Browse, search, and filter AI tools by keyword, category, and pricing model (free / freemium / paid) |
| **Tool detail pages** | Individual pages per tool with description, category, pricing, and a tracked "Visit" CTA |
| **Smart redirect system** | `/go/:slug` issues a 302 to the destination while recording the click non-blocking |
| **Click analytics** | Every redirect records referrer, UTM params, country, device type, browser, and OS |
| **UTM tracking** | Captures `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term` for campaign attribution |
| **Geo routing** | Route visitors to country-specific destinations based on a country code header (`cf-ipcountry` / `x-country-code`) |
| **Traffic classification** | Flags traffic as `human`, `suspicious`, or `bot` via user-agent pattern matching; bots/suspicious clicks are separated from legitimate metrics |
| **Admin dashboard** | Full CRUD for tools and redirect links, plus a chart-based analytics dashboard |
| **Analytics views** | Total vs. human clicks, top links, top UTM sources, top countries, device breakdown, clicks-over-time chart |
| **JWT authentication** | Admin login via email + password (bcrypt-hashed), session stored server-side and in an httpOnly cookie |
| **SEO** | Dynamic sitemap, `robots.txt`, per-page Open Graph metadata, structured content |
| **Legal pages** | Privacy policy, terms of service, and contact pages |
| **Security** | Security headers, input validation (slug/email/URL/password), open-redirect protection on the redirect handler, XSS sanitization |

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 |
| Backend | Next.js API Routes (Route Handlers) |
| Database | SQLite (dev) via Prisma 5; schema is ready to switch to PostgreSQL |
| ORM | Prisma 5 |
| Auth | JWT (`jose`) + `bcryptjs`, server-side session rows |
| Charts | Recharts |
| Utilities | `ua-parser-js` (device/browser/OS parsing), `date-fns` (date ranges), `lucide-react` (icons), `slugify` |

## Project structure

```
/
├── prisma/
│   ├── schema.prisma        # Database schema (8 models)
│   ├── seed.ts              # Seeds categories, tools, admin user
│   └── migrations/          # Initial migration
├── src/
│   ├── app/
│   │   ├── page.tsx         # Homepage (hero, categories, featured, recent, collections, guides)
│   │   ├── tools/           # Tool listing + detail pages (/tools, /tools/:slug)
│   │   ├── categories/      # Category listing + filtered pages (/categories, /categories/:slug)
│   │   ├── go/[slug]/       # Tracked redirect handler (302)
│   │   ├── admin/           # Admin panel (dashboard, tools, links, analytics, login)
│   │   ├── api/             # Route handlers (public tools, admin CRUD, analytics, auth)
│   │   ├── privacy/         # Privacy policy
│   │   ├── terms/           # Terms of service
│   │   ├── contact/         # Contact page
│   │   ├── sitemap.ts       # Dynamic sitemap
│   │   └── robots.ts        # robots.txt
│   ├── components/
│   │   ├── ui/              # Header, footer, floating AI apps illustration
│   │   ├── tools/           # Tool card, category card, search bar
│   │   └── admin/           # Admin sidebar
│   ├── lib/
│   │   ├── db.ts            # Prisma client singleton
│   │   ├── auth.ts          # Password hashing, JWT, cookie/session management
│   │   ├── analytics.ts     # UA parsing, bot detection, click recording, analytics queries
│   │   └── validation.ts    # Slug/email/URL/password validators + slug creation
│   └── tests/               # (empty placeholder — no test suite set up yet)
├── design-system/           # Design tokens / style references
└── public/                  # Static assets
```

## Data model

| Model | Purpose |
|-------|---------|
| `User` | Admin/editor/viewer accounts with bcrypt password hash |
| `Session` | Server-side JWT sessions (token + expiry), cascade-deleted with user |
| `Category` | Tool categories (unique name + slug, sort order) |
| `Tool` | AI tool entries: name, slug, description, logo, website URL, affiliate URL, pricing type, category, rating, featured/published/sponsored flags, comma-separated tags |
| `Campaign` | Marketing campaign grouping for redirect links |
| `RedirectLink` | Link entries: unique slug, destination, optional tool/campaign association, click counter, active flag |
| `ClickEvent` | One row per click: timestamp, referrer, UTM params, country, device type, browser, OS, traffic type (`human`/`suspicious`/`bot`), IP (retained only for rate-limiting purposes) |
| `GeoRoute` | Country → destination routing rules, unique per `(linkId, country)` |

Key relationships and indexes:
- `Tool.categoryId` → `Category` (indexed)
- `RedirectLink ↔ Tool` — one-to-one optional (`toolId` unique), `onDelete: SetNull`
- `RedirectLink → Campaign` — optional many-to-one
- `ClickEvent → RedirectLink` — many-to-one, `onDelete: Cascade`; indexed on `linkId`, `timestamp`, `country`, `utmSource`
- `GeoRoute → RedirectLink` — many-to-one, `onDelete: Cascade`; unique on `(linkId, country)`

## How the redirect flow works

`GET /go/:slug` (`src/app/go/[slug]/route.ts`):

1. Look up the `RedirectLink` by slug (including active geo routes).
2. If missing or inactive → 302 to `/tools`.
3. Extract UTM parameters from the query string.
4. Read `user-agent`, `referer`, and client IP from headers.
5. **Geo routing:** if the request carries a country code (`cf-ipcountry` from Cloudflare, or `x-country-code`) and a matching active `GeoRoute` exists, override the destination.
6. Record the click (non-blocking, errors don't break the redirect) — this parses the UA, classifies traffic type, and increments the link's `clickCount`.
7. Validate the destination is an `http:`/`https:` URL (open-redirect protection), otherwise bounce to `/tools`.
8. Issue a `302` to the final destination.

## Analytics

Source: `src/lib/analytics.ts`

- **Time ranges:** `today`, `yesterday`, `7d`, `30d`, and `custom` (with start/end dates).
- **Traffic classification** (`detectTrafficType`): known bot patterns (bot, crawler, spider, scraper, curl, wget, python-requests, headless, selenium, puppeteer, etc.) or a missing user-agent → `bot`; otherwise `human`. Non-human clicks are flagged with `isSuspicious` and separated from "human clicks" in reports.
- **Overview metrics:** total clicks, human clicks, top 10 links, top 10 UTM sources, top 10 countries, device breakdown.
- **Clicks over time:** daily counts bucketed by date for the chart.

The admin analytics route (`GET /api/admin/analytics?range=7d`) requires a valid session and returns both the overview and the time series.

## Admin API

All admin routes require a logged-in session (JWT cookie verified against the DB).

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/tools` | GET / POST | List all tools / create a tool (also auto-creates its redirect link) |
| `/api/admin/tools/:id` | PUT / DELETE | Update / delete a tool |
| `/api/admin/links` | GET / POST | List / create redirect links |
| `/api/admin/links/:id` | PUT / DELETE | Update / delete a link |
| `/api/admin/analytics` | GET | Analytics overview + clicks over time, with `range`/`start`/`end` query params |
| `/api/auth/login` | POST | Email + password login (sets session cookie) |
| `/api/auth/logout` | POST | Invalidates the session and clears the cookie |

## Public API

| Endpoint | Purpose |
|----------|---------|
| `GET /api/tools?q=&category=&pricing=&page=&limit=` | Search, filter, and paginate published tools |
| `GET /api/tools/:slug` | Fetch a single tool with its category |

## Authentication & security

- Passwords hashed with bcrypt (12 rounds); admin credentials seeded as `admin@aitoolsdirectory.com` / `admin123` — **must be changed for production**.
- JWT (HS256 via `jose`) signed with `AUTH_SECRET`, 7-day expiry, stored in an httpOnly, SameSite=Lax cookie; each token also backed by a `Session` row so it can expire server-side / be revoked on logout.
- Security headers applied globally in `next.config.ts`: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `X-XSS-Protection`, `Permissions-Policy`.
- Input validation in `src/lib/validation.ts`: slug format, email format, http/https URL checks, minimum password length, and basic `<>` stripping for XSS.
- Open-redirect protection: the redirect handler validates destination schemes.
- IP addresses are captured only for rate-limiting purposes (as declared in the privacy policy), not stored permanently.

> **Note:** Client-side rate limiting and CSRF tokens are described/mentioned in the README and legal pages as design goals, but a concrete rate-limiting/CSRF middleware is not yet implemented in the codebase. Bot detection and traffic classification are implemented (user-agent based).

## How to run locally

```bash
npm install        # installs deps + runs prisma generate (postinstall)
cp .env.example .env
npx prisma migrate dev --name init   # create DB schema
npm run db:seed    # seed categories, tools, and admin user
npm run dev        # http://localhost:3000
```

Environment variables (`.env.example`):

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | SQLite path (`file:./dev.db`) or Postgres connection string |
| `AUTH_SECRET` | Secret used to sign JWT tokens |
| `NEXT_PUBLIC_APP_URL` | Public base URL of the app |

Key scripts: `dev`, `build`, `start`, `lint`, `db:push`, `db:migrate`, `db:seed`, `db:reset`, `db:studio`.

## Deployment notes

- Designed for Vercel; for production, switch the Prisma datasource to PostgreSQL (Neon/Supabase/Railway), set the env vars, and re-run migrations + seed.
- For production-quality geo routing, hook up a geo-IP service (e.g., MaxMind or Cloudflare's `cf-ipcountry` header) — the code already reads those headers.

## Current status / gaps

- No automated test suite yet (`src/tests/` is empty; no test framework configured in `package.json`).
- Rate limiting and CSRF protection are claimed features but not implemented as middleware.
- Geo detection relies on a proxy/edge-provided country header; no bundled IP-to-country lookup.
- "Suspicious" classification currently classifies as `bot` wherever the UA matches, and "suspicious" is reserved for future heuristics.