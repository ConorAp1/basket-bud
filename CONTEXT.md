# Basket-Bud – Current State

**Status: Deployed**

| Layer | URL |
|---|---|
| Frontend (Vercel) | https://frontend-web-nu-smoky.vercel.app |
| Backend (Railway) | set in Railway dashboard |
| Database | Railway PostgreSQL (internal) |

Last updated: 2026-05-22

---

## What Is Done

All MVP features from the PRD are implemented and verified:

1. **Receipt photo scanning** — Camera capture in React Native, image POST to backend, Claude Vision OCR, structured line item extraction.
2. **Data extraction & user review** — Parser returns items with name, price, weight/volume, unit type, and suggested category. User edits inline before saving.
3. **Category suggestion** — 9-category keyword dictionary in parserService assigns a category to each scanned item; user can override via tap-to-pick UI.
4. **Price normalisation** — All prices normalised to per_100g / per_100ml / per_item. Single source of truth in normalisationService.js.
5. **Multi-shop price comparison** — CompareScreen shows price history per shop. Merged products share a combined comparison view.
6. **Product merge** — Users can mark two products as the same; merged products' price records are combined in comparisons.
7. **Spending analytics dashboard** — Summary stats, Spend by Shop, Spend by Category (SVG bar charts), Top Products by Spend, Shop Comparison Score, Price Trend Alerts.
8. **Dynamic categories** — Category filter chips in ProductsScreen populated from DB, not hardcoded.
9. **Input validation** — Joi middleware on POST /receipts and PUT /products/:id.

---

## What Needs to Run Before First Use

```bash
# 1. Install backend dependencies
cd backend && npm install

# 2. Create DB, user, and run migrations
createdb -U postgres basketbud_db
psql -U postgres -c "CREATE USER basketbud WITH PASSWORD 'yourpassword';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE basketbud_db TO basketbud;"
node migrations/migrate.js

# 3. Create .env from template and fill in required values
cp .env.example .env
# Must set: DATABASE_URL, ANTHROPIC_API_KEY, PORT

# 4. Start backend
npm run dev

# 5. In a separate terminal, start frontend
cd ../frontend && npm install && npx expo start
```

> **Note:** `ANTHROPIC_API_KEY` is required for receipt scanning. Obtain a key at console.anthropic.com. Without it the `/api/receipts/scan` endpoint returns a 500.

---

## Architecture Decisions That Are Locked In

| Decision | Reason |
|---|---|
| Claude Vision on backend | Higher accuracy than Tesseract on real receipts; returns structured JSON directly — no regex parser needed |
| No ORM — raw SQL | Full control, easier debugging, no abstraction overhead |
| react-native-svg for charts | Recharts requires a browser DOM — unusable in React Native |
| Zustand for state | Minimal boilerplate for a solo project |
| Joi validation middleware | Centralised schema factory; not inline in controllers |
| product_merges table | Separate join table allows n:m merge relationships without touching products table |
| CATEGORY_KEYWORDS ordered | Drinks before Produce ("orange juice"), Household before Bakery ("toilet roll") |

---

## What Is NOT Done (Post-Ship Backlog)

- No automated test suite (unit or integration).
- Shop selector in ScanReceiptScreen is a free-text input — no dropdown yet.
- Product matching on confirm (linking price records to existing products by fuzzy name) uses a stub; full matching not wired to the confirm flow.
- `FRONTEND_URL` must be set manually in production `.env`.
- No authentication or multi-user support (single-user by design).
- No image compression on upload (Expo resizes to 0.85 quality before send).

---

## File Changes Since Repo Creation

See MEMORY.md for a complete log of every file built and every bug fixed.
