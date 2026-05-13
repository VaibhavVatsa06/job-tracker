# JobTracker

A full-stack job portal built for the Indian tech market. Aggregates real job listings daily, lets you filter by experience and location, explore openings on a map, and set up email alerts — all in one place.

Built this because most job sites are either too cluttered or missing the filters I actually care about (experience range, company type, remote vs onsite). This tries to fix that.

---

## What it does

- **Browse & filter jobs** — search by role, company, or skill. Filter by experience level (0–10 yrs), city, job type (remote/hybrid/onsite), company type (Startup/MNC/IndianIT), industry, salary range, and how recently it was posted
- **Interactive job map** — jobs are pinned on a Leaflet map grouped by city. Click a cluster to see all openings in that city, then click a job to preview details in the right panel
- **Job alerts** — enter your email, pick a role and location, choose daily or weekly, and you'll get an email digest whenever matching jobs are posted
- **Save jobs** — bookmark jobs to a saved list (stored by email, persists in the DB)
- **Auto-refresh** — a cron job hits the JSearch API every 2 days and pulls fresh listings automatically
- **Admin panel** — `/admin` page shows DB stats and a button to manually trigger a job refresh

---

## Tech stack

| Layer | What I used |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL via Neon (serverless) |
| ORM | Prisma |
| Map | Leaflet.js (raw, no react-leaflet) |
| Job data | JSearch API on RapidAPI |
| Email | Resend |
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

# RapidAPI key for JSearch (job data)
RAPIDAPI_KEY=your_rapidapi_key_here

# Resend API key (email alerts)
RESEND_API_KEY=your_resend_key_here

# Secret to protect the cron endpoints
CRON_SECRET=any_random_string_here
```

> **Note:** For `DATABASE_URL`, I'm using [Neon](https://neon.tech) free tier (serverless Postgres). You can use any Postgres instance — just swap the connection string.
> For job data, sign up at [RapidAPI](https://rapidapi.com) and subscribe to the JSearch API (free tier gives 200 requests/month which is enough).

### 3. Push the schema and seed

```bash
npm run db:push      # creates tables from schema.prisma
npm run db:seed      # seeds with some sample jobs
```

Or run both at once:

```bash
npm run setup
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
│   ├── map/page.tsx          # interactive map view
│   ├── saved/page.tsx        # saved jobs
│   ├── admin/page.tsx        # admin panel
│   └── api/
│       ├── jobs/             # GET jobs with filters, GET job by id
│       ├── stats/            # GET counts for homepage stats
│       ├── alerts/           # POST create alert
│       ├── saved/            # GET/POST saved jobs
│       ├── apply/            # POST job application
│       ├── refresh/          # POST manual job refresh
│       └── cron/
│           ├── refresh/      # cron: fetch new jobs from API
│           └── alerts/       # cron: send email digests
├── components/
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── JobCard.tsx
│   ├── JobFilters.tsx
│   ├── MapView.tsx
│   ├── StatsSection.tsx
│   ├── AlertModal.tsx
│   └── ApplicationModal.tsx
├── lib/
│   ├── prisma.ts             # prisma client singleton
│   ├── email.ts              # resend email helper
│   └── utils.ts              # cn() utility
└── types/index.ts
```

---

## Database schema

Four models in Prisma:

- **Job** — core listing (title, company, location, salary, skills, etc.)
- **Application** — stores who applied to what (name, email, resume URL)
- **SavedJob** — user's bookmarked jobs (keyed by email)
- **Alert** — email alert subscriptions (keywords + location + frequency)

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

- Job refresh runs every 2 days at 1 AM UTC (keeps within RapidAPI's 200 req/month free limit)
- Alert digests go out daily at 8 AM UTC

Both endpoints check for a `CRON_SECRET` header so they can't be triggered by random people.

---

## Deploying to Vercel

1. Push the repo to GitHub
2. Import it in [Vercel](https://vercel.com)
3. Add all the env vars from `.env.local` in the Vercel project settings
4. Deploy — Vercel auto-detects Next.js and handles everything

The build command is `prisma generate && next build` (already set in `package.json`).

---

## Environment variables summary

| Variable | Where to get it |
|---|---|
| `DATABASE_URL` | Neon dashboard → Connection string |
| `RAPIDAPI_KEY` | RapidAPI → JSearch API → Subscribe → API Key |
| `RESEND_API_KEY` | resend.com → API Keys |
| `CRON_SECRET` | Make up any random string |

---

## Known limitations

- Email alerts currently use Resend's sandbox sender (`onboarding@resend.dev`), which only delivers to the account owner's email unless you verify a custom domain in Resend
- Job data is from JSearch API which pulls from LinkedIn, Indeed, etc. — coverage is good but not exhaustive
- Map coordinates fall back to a hardcoded city lookup (`CITY_COORDS`) for jobs that don't include lat/lng in the API response

---

## Running scripts

```bash
npm run dev          # start dev server
npm run build        # generate prisma client + build
npm run db:push      # sync schema to DB (no migrations)
npm run db:seed      # seed sample jobs
npm run db:studio    # open Prisma Studio (visual DB browser)
```

---

## License

MIT — use it however you want.
