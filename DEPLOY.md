# Deployment Guide

## Run Locally

```bash
cd job-tracker

# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env.local
# DATABASE_URL is already set to SQLite — no changes needed for local dev

# 3. Create & seed database  (run once)
npx prisma db push
npx tsx prisma/seed.ts

# 4. Start dev server
npm run dev
# → open http://localhost:3000
```

---

## Deploy to Vercel (Free)

### Step 1 – Get a free PostgreSQL database (required for Vercel)
Vercel's filesystem is ephemeral — SQLite won't persist. Use a free cloud Postgres:

| Provider | Free tier | Link |
|---|---|---|
| **Neon** (recommended) | 500 MB, 1 branch | https://neon.tech |
| Supabase | 500 MB | https://supabase.com |
| Railway | 1 GB | https://railway.app |

After creating a database, copy the `DATABASE_URL` (e.g. `postgresql://user:pass@host/db`).

### Step 2 – Switch Prisma to PostgreSQL
Edit `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"   # ← change from "sqlite"
  url      = env("DATABASE_URL")
}
```

Then run locally to apply schema:
```bash
DATABASE_URL="postgresql://..." npx prisma db push
DATABASE_URL="postgresql://..." npx tsx prisma/seed.ts
```

### Step 3 – Deploy with Vercel CLI
```bash
# Login (one-time)
vercel login

# Deploy from project root
cd job-tracker
vercel

# Follow the prompts:
# - Link to existing project? No → create new
# - Framework: Next.js (auto-detected)
```

### Step 4 – Set environment variables in Vercel Dashboard
Go to **Project → Settings → Environment Variables** and add:
```
DATABASE_URL     =  postgresql://...   (your Neon/Supabase URL)
CRON_SECRET      =  any-random-string
RAPIDAPI_KEY     =  (optional, for live job data)
```

### Step 5 – Deploy production
```bash
vercel --prod
```

Your site is live at `https://your-project.vercel.app` 🎉

---

## Enable Live Job Data (Optional)

1. Sign up free at https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch
2. Copy your API key
3. Add `RAPIDAPI_KEY=your_key` to Vercel env vars
4. The daily cron at `vercel.json` will auto-fetch new jobs every day at 01:00

---

## Database Studio (local)

```bash
npx prisma studio
# → opens http://localhost:5555 — browse all jobs, applications, alerts
```
