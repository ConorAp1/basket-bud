# Basket-Bud – Current State

**Status: Ship-ready (pending PostgreSQL + tessdata setup on target host)**

Last updated: 2026-05-21

---

## What Is Done

All MVP features from the PRD are implemented and verified:

1. **Receipt photo scanning** — Camera capture in React Native, image POST to backend, Tesseract.js OCR, structured line item extraction.
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

# 2. Download OCR language data (one-time)
npm run setup:tessdata

# 3. Create DB, user, and run migrations
createdb -U postgres basketbud_db
psql -U postgres -c "CREATE USER basketbud WITH PASSWORD 'yourpassword';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE basketbud_db TO basketbud;"
node migrations/migrate.js

# 4. Create .env from template
cp .env.example .env   # Fill in DATABASE_URL, PORT, etc.

# 5. Start backend
npm run dev

# 6. In a separate terminal, start frontend
cd ../frontend && npm install && npx expo start
```

---

## Architecture Decisions That Are Locked In

| Decision | Reason |
|---|---|
| Tesseract.js on backend | Keeps mobile app lightweight; OCR is CPU-intensive |
| No ORM — raw SQL | Full control, easier debugging, no abstraction overhead |
| react-native-svg for charts | Recharts requires a browser DOM — unusable in React Native |
| Zustand for state | Minimal boilerplate for a solo project |
| Joi validation middleware | Centralised schema factory; not inline in controllers |
| product_merges table | Separate join table allows n:m merge relationships without touching products table |
| CATEGORY_KEYWORDS ordered | Drinks before Produce prevents "orange juice" → Produce |

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
