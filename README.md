# AI Tools Directory

A production-ready MVP for an AI Tools Directory and Smart Redirect/Link Tracking platform. Built with Next.js, TypeScript, Tailwind CSS, Prisma, and SQLite (easily switchable to PostgreSQL).

## Features

- **AI Tools Directory** — Browse 20+ AI tools across 10 categories
- **Smart Redirect System** — Track outbound clicks with `/go/:slug` URLs
- **Analytics Dashboard** — Real-time charts for clicks, sources, countries, devices
- **UTM Tracking** — Capture UTM parameters for campaign analysis
- **Geo Routing** — Route users to different destinations by country
- **Admin Panel** — Full CRUD for tools and links with authentication
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
| Auth | JWT (jose) + bcryptjs |
| Charts | Recharts |
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
- `AUTH_SECRET` — Random secret for JWT signing
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
- **Admin:** http://localhost:3000/admin

## Admin Credentials

| Field | Value |
|-------|-------|
| Email | `admin@aitoolsdirectory.com` |
| Password | `admin123` |

> **⚠️ Change these credentials before deploying to production!**

## Database Schema

### Tables

| Table | Purpose |
|-------|---------|
| `User` | Admin users with hashed passwords |
| `Session` | JWT session management |
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

### Admin (requires authentication)

```
GET    /api/admin/tools              # List all tools
POST   /api/admin/tools              # Create tool
PUT    /api/admin/tools/:id          # Update tool
DELETE /api/admin/tools/:id          # Delete tool

GET    /api/admin/links              # List all links
POST   /api/admin/links              # Create link
PUT    /api/admin/links/:id          # Update link
DELETE /api/admin/links/:id          # Delete link

GET    /api/admin/analytics          # Analytics overview
GET    /api/admin/analytics?range=7d # Analytics for time range
```

### Auth

```
POST   /api/auth/login               # Login (email + password)
POST   /api/auth/logout              # Logout
```

## URL Structure

```
/                          # Homepage
/tools                     # All tools listing
/tools/chatgpt             # Individual tool page
/categories                # All categories
/categories/ai-video       # Category tools listing
/go/chatgpt                # Tracked redirect (302)
/admin                     # Admin dashboard
/admin/tools               # Tool management
/admin/links               # Link management
/admin/analytics           # Analytics dashboard
/admin/login               # Admin login
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

Configure country-specific destinations in the admin panel:

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
   - `AUTH_SECRET` — Generate with `openssl rand -base64 32`
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
│   │   ├── admin/            # Admin panel
│   │   ├── api/              # API routes
│   │   ├── privacy/          # Privacy policy
│   │   ├── terms/            # Terms of service
│   │   └── contact/          # Contact page
│   ├── components/
│   │   ├── ui/               # Shared UI components
│   │   ├── tools/            # Tool-related components
│   │   └── admin/            # Admin components
│   └── lib/
│       ├── db.ts             # Prisma client
│       ├── auth.ts           # Authentication
│       ├── analytics.ts      # Analytics utilities
│       └── validation.ts     # Input validation
├── public/                   # Static assets
└── .env.example              # Environment template
```

## License

MIT
