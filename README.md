# AI Tools Directory

A production-ready MVP for an AI Tools Directory and Smart Redirect/Link Tracking platform. Built with Next.js, TypeScript, Tailwind CSS, Prisma, and SQLite (easily switchable to PostgreSQL).

## Features

- **AI Tools Directory** — Browse 20+ AI tools across 10 categories
- **Smart Redirect System** — Track outbound clicks with `/go/:slug` URLs
- **UTM Tracking** — Capture UTM parameters for campaign analysis
- **Geo Routing** — Route users to different destinations by country
- **SEO Optimized** — Sitemap, robots.txt, Open Graph, structured data
- **Security** — Input validation, rate limiting, CSRF protection, secure headers
- **Anti-Abuse** — Bot detection, suspicious traffic classification

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| Backend | Next.js API Routes |
| Database | SQLite (dev) / PostgreSQL (prod) |
| ORM | Prisma 5 |
| Deployment | Vercel |

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment

```bash
cp .env.example .env
```

Edit `.env` with your values:
- `DATABASE_URL` — Database connection string
- `NEXT_PUBLIC_APP_URL` — Your app URL

### 3. Initialize database

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Seed database

```bash
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
```

### 5. Start development server

```bash
npm run dev
```

Visit:
- **Homepage:** http://localhost:3000
- **Tools:** http://localhost:3000/tools

## Database Schema

### Tables

| Table | Purpose |
|-------|---------|
| `User` | User accounts with hashed passwords (legacy — unused since the admin panel was removed) |
| `Session` | Server-side sessions (legacy — unused since the admin panel was removed) |
| `Category` | Tool categories (AI Writing, AI Image, etc.) |
| `Tool` | AI tool entries with metadata |
| `Campaign` | Marketing campaigns |
| `RedirectLink` | Tracked outbound URLs |
| `ClickEvent` | Individual click records with analytics |
| `GeoRoute` | Country-specific routing rules |

### Key Indexes

- `RedirectLink.slug` — Fast slug lookups for redirects
- `ClickEvent.timestamp` — Time-range analytics queries
- `ClickEvent.linkId` — Per-link analytics
- `ClickEvent.country` — Geographic analytics
- `Tool.categoryId` — Category filtering
- `Tool.isPublished` + `Tool.isFeatured` — Public listing queries

## API Endpoints

### Public

```
GET    /api/tools                    # List tools (search, filter, paginate)
GET    /api/tools/:slug              # Get single tool
```

### Redirect

```
GET    /go/:slug                     # 302 redirect with click tracking
GET    /go/:slug?utm_source=...      # Redirect with UTM tracking
```

## URL Structure

```
/                          # Homepage
/tools                     # All tools listing
/tools/chatgpt             # Individual tool page
/categories                # All categories
/categories/ai-video       # Category tools listing
/go/chatgpt                # Tracked redirect (302)
/privacy                   # Privacy policy
/terms                     # Terms of service
/contact                   # Contact page
```

## Analytics Features

### Time Ranges

- Today
- Yesterday
- Last 7 days
- Last 30 days

### Metrics

- Total clicks vs human clicks
- Click-through rate
- Top links by clicks
- Traffic sources (UTM sources)
- Top countries
- Device breakdown (desktop, mobile, tablet)
- Clicks over time chart

### Traffic Classification

- **Human** — Normal user traffic
- **Suspicious** — Potentially automated traffic
- **Bot** — Known bot user agents

> Suspicious and bot traffic is flagged and separated from legitimate metrics.

## UTM Parameters

When a user visits `/go/tool?utm_source=tiktok&utm_medium=social&utm_campaign=launch`, the system captures:

| Parameter | Purpose |
|-----------|---------|
| `utm_source` | Traffic source (google, tiktok, etc.) |
| `utm_medium` | Marketing medium (social, referral, etc.) |
| `utm_campaign` | Campaign name |
| `utm_content` | Content variation |
| `utm_term` | Search term |

## Geo Routing

Country-specific destinations are stored as `GeoRoute` records (manageable via the built-in CMS):

```
/go/tool → Default destination
/go/tool → Nepal → Nepal-specific destination
/go/tool → India → India-specific destination
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard:
   - `DATABASE_URL` — Use Neon, Supabase, or Vercel Postgres
   - `NEXT_PUBLIC_APP_URL` — Your production URL
4. Deploy

### Database (PostgreSQL)

For production, switch from SQLite to PostgreSQL:

1. Create a PostgreSQL database (Neon, Supabase, Railway)
2. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Run migrations:
   ```bash
   npx prisma migrate dev --name init
   ```
4. Generate client:
   ```bash
   npx prisma generate
   ```
5. Seed:
   ```bash
   npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
   ```

## Project Structure

```
/
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.ts              # Seed data
├── src/
│   ├── app/
│   │   ├── page.tsx          # Homepage
│   │   ├── layout.tsx        # Root layout
│   │   ├── globals.css       # Global styles
│   │   ├── sitemap.ts        # Dynamic sitemap
│   │   ├── robots.ts         # Robots.txt
│   │   ├── not-found.tsx     # 404 page
│   │   ├── tools/            # Tool pages
│   │   ├── categories/       # Category pages
│   │   ├── go/               # Redirect handler
│   │   ├── api/              # API routes
│   │   ├── privacy/          # Privacy policy
│   │   ├── terms/            # Terms of service
│   │   └── contact/          # Contact page
│   ├── components/
│   │   ├── ui/               # Shared UI components
│   │   └── tools/            # Tool-related components
│   └── lib/
│       ├── db.ts             # Prisma client
│       ├── analytics.ts      # Analytics utilities
│       └── validation.ts     # Input validation
├── public/                   # Static assets
└── .env.example              # Environment template
```

## License

MIT
