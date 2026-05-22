# Basket-Bud – Current State

**Status: MVP Complete — Ship-Ready**

| Layer | URL |
|---|---|
| Frontend (Vercel) | https://basket-bud-theta.vercel.app |
| Backend (Railway) | https://basket-bud-production.up.railway.app |
| Database | Railway PostgreSQL (internal) |

Last updated: 2026-05-22

---

## What Is Done

All MVP features are implemented, deployed, and verified end-to-end:

1. **Receipt photo scanning** — Upload a receipt image, Claude Vision OCR extracts all line items with name, price, quantity, and unit.
2. **Shop detection** — Claude Vision reads the shop name from the receipt header and pre-selects it in the review UI.
3. **Data extraction & user review** — Items displayed in an editable table showing name, price, unit (400g/1L/each), category, and quantity. User can edit before saving.
4. **Receipt total** — Calculated automatically from item prices × quantities on save; displayed on home and detail pages.
5. **Category suggestion** — 9-category keyword dictionary assigns a category to each item; user can override.
6. **Price normalisation** — All prices normalised to per_100g / per_100ml / per_item.
7. **Multi-shop price comparison** — Side-by-side price history per shop with normalised prices.
8. **Product merge** — Link two products as the same item; price records are combined in comparisons.
9. **Spending analytics dashboard** — Summary stats, spend by shop, spend by category, top products, shop comparison score, price trend alerts.
10. **Web frontend** — Next.js 15 App Router frontend deployed on Vercel (receipts, scan, compare, dashboard pages).

---

## What Needs to Run Before First Use (Local Dev)

```bash
# 1. Install backend dependencies
cd backend && npm install

# 2. Run migrations against Railway DB
DATABASE_URL=<your-railway-url> node migrations/migrate.js

# 3. Create .env from template
cp .env.example .env
# Must set: DATABASE_URL, ANTHROPIC_API_KEY, PORT, FRONTEND_URL

# 4. Start backend
npm run dev

# 5. Start web frontend
cd ../frontend-web && npm install && npm run dev
```

> **Required env vars on Railway:** `DATABASE_URL` (auto-set by Railway PostgreSQL plugin), `ANTHROPIC_API_KEY`, `PORT`, `FRONTEND_URL`.

---

## Architecture Decisions That Are Locked In

| Decision | Reason |
|---|---|
| Claude Vision on backend | Higher accuracy than Tesseract; returns structured JSON directly |
| Next.js 15 App Router for web | Server components, fast cold start on Vercel, easy deployment |
| Railway + Vercel hosting | Free tier covers solo-dev usage; zero-config deploys from main |
| No ORM — raw SQL | Full control, easier debugging, no abstraction overhead |
| Zustand for state | Minimal boilerplate for a solo project |
| Joi validation middleware | Centralised schema factory; not inline in controllers |
| product_merges table | Separate join table allows n:m merge relationships |

---

## What Is NOT Done (Post-Ship Backlog)

- No automated test suite (unit or integration).
- Product matching on confirm (fuzzy name → existing product) is a stub; not wired to the save flow.
- No authentication or multi-user support (single-user by design).
- No image compression on upload.

---

## File Changes Since Repo Creation

See MEMORY.md for a complete log of every file built and every bug fixed.
