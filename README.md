# JobTracker

A full-stack global job portal that aggregates real listings from 4 sources daily, lets you filter by experience, location, and job type, explore openings on a **3D interactive globe**, and set up email alerts — all in one place.

**Live:** https://job-tracker-ten-chi.vercel.app

---

## What it does

- **Browse & filter jobs** — search by role, company, or skill. Filter by experience level (0–10 yrs), city, job type (Remote/Hybrid/Full-time), company type (Startup/MNC/IndianIT), industry, salary range, and recency
- **3D interactive globe** — jobs pinned on a WebGL globe grouped by city. Company logo pill markers show company name + opening count. Hover for a tooltip of other companies in that city. Click to see a full job list popup with direct Apply links. Scroll-to-zoom aimed at cursor
- **Job alerts** — enter your email, pick a role and location, choose daily or weekly, get an email digest of matching new jobs
- **Save jobs** — bookmark jobs to a saved list (stored by email, persists in DB)
- **Auto-refresh** — cron job fetches fresh listings from all 4 sources every 2 days
- **Admin panel** — `/admin` page shows DB stats, source breakdown, and a manual refresh trigger

---

## Job sources (4 total)

| Source | Key required | Volume | Coverage |
|---|---|---|---|
| [JSearch](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch) | `RAPIDAPI_KEY` | ~60/refresh | LinkedIn, Indeed, Glassdoor aggregated |
| [Adzuna](https://developer.adzuna.com) | `ADZUNA_APP_ID` + `ADZUNA_APP_KEY` | ~120/refresh | India, UK, Singapore, UAE job boards |
| [Remotive](https://remotive.com) | None | ~95/refresh | Remote tech jobs worldwide |
| [Greenhouse](https://boards-api.greenhouse.io) | None | ~3,000/refresh | 20 top tech companies (Airbnb, Stripe, Figma, etc.) |

> Last refresh: **3,365 new jobs** added in a single run (Greenhouse is the largest source)

---

## Tech stack

| Layer | What I used |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL via [Neon](https://neon.tech) (serverless) |
| ORM | Prisma |
| Globe / Map | [globe.gl](https://globe.gl) (Three.js WebGL) |
| Job data | JSearch · Adzuna · Remotive · Greenhouse |
| Email | [Resend](https://resend.com) |
| Deployment | Vercel |
| UI icons | Lucide React |
| Toasts | react-hot-toast |

---

## Getting started locally

### 1. Clone and install

```bash
git clone https://github.com/VaibhavVatsa06/job-tracker.git
cd job-tracker
npm install
```

### 2. Set up environment variables

Create a `.env.local` file in the root:

```env
# PostgreSQL connection string (Neon or any Postgres)
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# RapidAPI key for JSearch
RAPIDAPI_KEY=your_rapidapi_key_here

# Adzuna API credentials
ADZUNA_APP_ID=your_adzuna_app_id
ADZUNA_APP_KEY=your_adzuna_app_key

# Resend API key (email alerts)
RESEND_API_KEY=your_resend_key_here

# Secret to protect cron endpoints
CRON_SECRET=any_random_string_here
```

Remotive and Greenhouse require no API keys — they're fetched automatically.

---

## API keys & services

### 1. Neon — Database (`DATABASE_URL`)

Neon is a serverless Postgres provider. The free tier gives 0.5 GB storage.

1. Go to [neon.tech](https://neon.tech) → create a free account
2. Create a new project (pick the region closest to you)
3. Go to **Dashboard** → **Connect** → copy the connection string:
   ```
   postgresql://username:password@ep-something.region.aws.neon.tech/neondb?sslmode=require
   ```
4. Paste as `DATABASE_URL` in `.env.local`

---

### 2. RapidAPI / JSearch (`RAPIDAPI_KEY`)

Pulls listings from LinkedIn, Indeed, Glassdoor. Free plan: **200 req/month** (plenty — app fetches every 2 days).

1. Sign up at [rapidapi.com](https://rapidapi.com)
2. Search **JSearch** → Subscribe → select **Basic (Free)**
3. Find your key under `X-RapidAPI-Key` on the Endpoints tab
4. Paste as `RAPIDAPI_KEY`

---

### 3. Adzuna (`ADZUNA_APP_ID` + `ADZUNA_APP_KEY`)

Covers India, UK, Singapore, UAE boards. Free tier: **250 req/day**.

1. Sign up at [developer.adzuna.com](https://developer.adzuna.com)
2. Create an app → copy the **App ID** and **App Key**
3. Paste as `ADZUNA_APP_ID` and `ADZUNA_APP_KEY`

---

### 4. Resend — Email alerts (`RESEND_API_KEY`)

Sends job alert digest emails. Free tier: **3,000 emails/month**.

1. Go to [resend.com](https://resend.com) → create a free account
2. **API Keys** → **Create API Key** → copy immediately (starts with `re_`)
3. Paste as `RESEND_API_KEY`

> Without a verified domain, Resend only sends to your own account email. To send to other users, verify a custom domain in Resend dashboard.

---

### 5. Cron secret (`CRON_SECRET`)

Not from any service — just make up a random string. Protects `/api/cron/refresh` and `/api/cron/alerts` from public access.

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### 3. Push the schema and seed

```bash
npm run db:push      # creates tables from schema.prisma
npm run db:seed      # seeds with some sample jobs
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project structure

```
src/
├── app/
│   ├── page.tsx              # homepage
│   ├── jobs/
│   │   ├── page.tsx          # job listings with filters
│   │   └── [id]/page.tsx     # individual job detail
│   ├── map/page.tsx          # 3D globe map view
│   ├── saved/page.tsx        # saved jobs
│   ├── admin/page.tsx        # admin panel (stats + manual refresh)
│   └── api/
│       ├── jobs/             # GET jobs with filters, GET job by id
│       ├── stats/            # GET counts for homepage stats
│       ├── alerts/           # POST create alert
│       ├── saved/            # GET/POST saved jobs
│       ├── apply/            # POST job application
│       ├── refresh/          # POST manual job refresh (all 4 sources)
│       └── cron/
│           ├── refresh/      # cron: fetch new jobs from all sources
│           └── alerts/       # cron: send email digests
├── components/
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── JobCard.tsx
│   ├── JobFilters.tsx
│   ├── MapView.tsx           # globe.gl WebGL globe
│   ├── StatsSection.tsx
│   ├── AlertModal.tsx
│   └── ApplicationModal.tsx
├── lib/
│   ├── prisma.ts             # prisma client singleton
│   ├── jobService.ts         # 4-source fetcher (parallel, batch inserts)
│   ├── email.ts              # resend email helper
│   └── utils.ts              # cn() utility
└── types/index.ts
```

---

## Database schema

Four models in Prisma:

- **Job** — listing (title, company, location, salary, skills, source, logoDomain, etc.)
- **Application** — stores who applied to what (name, email, resume URL)
- **SavedJob** — user's bookmarked jobs (keyed by email)
- **Alert** — email alert subscriptions (keywords + location + frequency)

---

## Globe map features

The map view uses [globe.gl](https://globe.gl) — a Three.js-based WebGL globe:

- **Earth texture** — Blue marble satellite imagery (`earth-blue-marble.jpg`)
- **Markers** — White pill cards per city: company logo + name + opening count badge
- **Hover** — Tooltip listing other companies hiring in that city
- **Click** — Popup with up to 8 job listings (company, title, Apply button) + side panel for full list
- **Scroll zoom** — Zooms toward the cursor position (not the globe center)
- **Ring animation** — Indigo pulse ring on the selected city
- **Atmosphere** — Soft blue glow around the globe

---

## Cron jobs (Vercel)

Configured in `vercel.json`:

```json
{
  "crons": [
    { "path": "/api/cron/refresh", "schedule": "0 1 */2 * *" },
    { "path": "/api/cron/alerts",  "schedule": "0 8 * * *"   }
  ]
}
```

- Job refresh runs every 2 days at 1 AM UTC — fetches from all 4 sources in parallel
- Alert digests go out daily at 8 AM UTC

Both endpoints check for a `CRON_SECRET` header to block public access.

---

## Performance notes

- All 4 job sources are fetched in **parallel** using `Promise.allSettled`
- Each source uses a single `prisma.job.createMany({ skipDuplicates: true })` — one DB round-trip instead of per-row upserts. Cuts Greenhouse insert time from ~40s to ~3s (critical for Vercel's 10s function limit on Hobby plan)

---

## Deploying to Vercel

1. Push the repo to GitHub
2. Import at [vercel.com](https://vercel.com)
3. Add all env vars from `.env.local` in project settings
4. Deploy — Vercel auto-detects Next.js

Build command is `prisma generate && next build` (set in `package.json`).

---

## Environment variables — quick reference

| Variable | Service | Free tier | Used for |
|---|---|---|---|
| `DATABASE_URL` | [Neon](https://neon.tech) | 0.5 GB | Storing all jobs, alerts, applications |
| `RAPIDAPI_KEY` | [RapidAPI / JSearch](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch) | 200 req/month | LinkedIn, Indeed, Glassdoor listings |
| `ADZUNA_APP_ID` + `ADZUNA_APP_KEY` | [Adzuna](https://developer.adzuna.com) | 250 req/day | India, UK, Singapore, UAE boards |
| `RESEND_API_KEY` | [Resend](https://resend.com) | 3,000 emails/month | Job alert digest emails |
| `CRON_SECRET` | — (make your own) | — | Protecting cron endpoints |

> Remotive and Greenhouse are fetched automatically with no API key needed.

---

## Running scripts

```bash
npm run dev          # start dev server
npm run build        # generate prisma client + build
npm run db:push      # sync schema to DB
npm run db:seed      # seed sample jobs
npm run db:studio    # open Prisma Studio (visual DB browser)
```

---

## License

MIT — use it however you want.
