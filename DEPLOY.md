# Basket-Bud — Deployment Guide

Deploy the **backend to Railway** (with PostgreSQL) and the **frontend to Vercel**.
Run all commands from your local machine after cloning the repo.

---

## Prerequisites

```bash
npm install -g @railway/cli
npm install -g vercel
```

---

## Step 1 — Railway login

```bash
railway login
# Browser window opens — authenticate with your Railway account
```

---

## Step 2 — Create Railway project and add Postgres

```bash
cd basket-bud/backend
railway init            # Creates a new project; give it any name (e.g. "basket-bud")
railway add --database postgres
# Wait ~60s for the database to provision
railway variables       # Copy the DATABASE_URL value — you'll need it later
```

---

## Step 3 — Deploy the backend

```bash
# Still inside basket-bud/backend
railway up
# Railway builds and deploys. When complete it prints your public URL:
# e.g. https://basket-bud-production.up.railway.app
```

---

## Step 4 — Set backend environment variables

```bash
railway variables set NODE_ENV=production
railway variables set FRONTEND_URL=https://<your-vercel-url>.vercel.app
# Add ANTHROPIC_API_KEY manually in the Railway dashboard → Variables tab
# (Dashboard → your project → backend service → Variables)
```

---

## Step 5 — Run database migrations

```bash
# Still inside basket-bud/backend
railway run node migrations/migrate.js
# Expected output:
#   Running 7 migration(s)...
#     → 000_extensions.sql
#     → 001_create_shops.sql
#     → 002_create_products.sql
#     → 003_create_receipts.sql
#     → 004_create_price_records.sql
#     → 005_seed_shops.sql
#     → 006_create_product_merges.sql
#   Migrations complete.
```

---

## Step 6 — Verify backend is live

```bash
curl https://<your-railway-url>.up.railway.app/health
# Expected: {"status":"ok","timestamp":"..."}
```

---

## Step 7 — Deploy the frontend to Vercel

```bash
cd ../frontend-web
vercel --yes
# Browser window opens — authenticate with your Vercel account
# Vercel detects Next.js automatically. Accept all defaults.
# Note the preview URL printed at the end.
```

---

## Step 8 — Set the backend URL on Vercel

```bash
vercel env add NEXT_PUBLIC_API_URL production
# When prompted, enter your Railway backend URL:
# https://<your-railway-url>.up.railway.app/api

# Redeploy to pick up the env var:
vercel --prod
# Note the production URL: https://basket-bud.vercel.app (or similar)
```

---

## Step 9 — Update FRONTEND_URL on Railway

```bash
cd ../backend
railway variables set FRONTEND_URL=https://<your-vercel-production-url>.vercel.app
```

---

## Step 10 — Final check

| What | Command |
|---|---|
| Backend health | `curl https://<railway-url>/health` |
| Frontend | Open `https://<vercel-url>` in browser |
| Scan a receipt | Upload an image on `/scan` (requires ANTHROPIC_API_KEY to be set in Railway) |

---

## Environment variables reference

### Railway (backend)

| Variable | Value |
|---|---|
| `DATABASE_URL` | Auto-set by Railway when Postgres is added |
| `NODE_ENV` | `production` |
| `PORT` | Leave unset — Railway injects this automatically |
| `FRONTEND_URL` | Your Vercel production URL (for CORS) |
| `ANTHROPIC_API_KEY` | Set manually in Railway dashboard |

### Vercel (frontend)

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://<railway-url>.up.railway.app/api` |
