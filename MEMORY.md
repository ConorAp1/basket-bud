# Basket-Bud – Development Memory Log

This file tracks what has been built, fixed, and the current state of the application. Updated whenever significant work is completed.

---

## Session: 2026-05-22 (Deployment Fixes + MVP Completion)

### Deployment Target

| Layer | Service | URL |
|---|---|---|
| Backend | Railway | https://basket-bud-production.up.railway.app |
| Database | Railway PostgreSQL (internal) | postgres.railway.internal:5432 |
| Web Frontend | Vercel | https://basket-bud-theta.vercel.app |

### What Was Built

| File | Change |
|---|---|
| `frontend-web/` | Next.js 15 App Router web frontend (4 pages: receipts, scan, compare, dashboard) |
| `frontend-web/lib/api.ts` | Typed API client for all backend endpoints |
| `frontend-web/app/scan/page.tsx` | Full scan + review + save flow with editable items table |
| `frontend-web/app/compare/page.tsx` | Product search + price comparison table |
| `frontend-web/app/dashboard/page.tsx` | Analytics charts using Recharts |
| `frontend-web/app/receipts/[id]/page.tsx` | Receipt detail page with line items |

### Bugs Fixed (Deployment Session)

| Bug | Root Cause | Fix |
|---|---|---|
| Backend connecting to localhost despite DATABASE_URL set | `config/db.js` used `DB_HOST/PORT/NAME` vars, never read `DATABASE_URL` | Rewrote pool config to use `connectionString` when `DATABASE_URL` present |
| SSL error on Railway PostgreSQL | SSL check only matched `rlwy.net`/`railway.app`, missed `postgres.railway.internal` | Changed check to `dbUrl.includes('railway')` |
| Migration failing silently | Same localhost fallback bug in `migrations/migrate.js` + no per-file error reporting | Same fix + per-file try/catch with error output |
| Scan page showing "Product name" / £0 | Frontend mapped `item.name`/`item.price`; backend returns `rawName`/`rawPrice` | Added camelCase fallbacks to mapping: `rawName ?? name ?? raw_name` |
| POST /api/receipts/confirm → 404 | Backend route is `POST /api/receipts` (not `/confirm`) | Fixed `confirmReceipt` URL in `api.ts` |
| Quantity showing 380/125 (weight in grams) | Claude Vision put weight amount in `quantity` field | Clamped frontend quantity to integers 1–99, defaulting to 1 |
| Receipt total shows £0.00 | Frontend never sent `totalAmount`; backend saved null | Backend now calculates total from `sum(rawPrice × quantity)` on confirm |
| Claude response wrapped in markdown fences | Anchored regex `^```$` only stripped fences at exact start/end | Global `/g` replace strips fences wherever they appear |
| Scan items blank despite correct backend data | Claude sometimes returns `description`/`unit_price` etc. | `mapClaudeItem` now falls back through 5+ common field name variants |
| Shop name not pre-selected after scan | Backend never extracted shop; frontend never received it | Updated Claude prompt to return `{ shop, items }` object; backend parses and returns `detectedShop`; frontend pre-selects it |

### Features Added (Deployment Session)

| Feature | Details |
|---|---|
| Shop detection from receipt | Claude Vision system prompt updated to extract shop name alongside items |
| Unit column in scan review | `formatUnit()` helper displays `400g`, `1L`, `each` etc. from `weightGrams`/`volumeMl`/`unitType` |
| Receipt total auto-calculation | `confirmReceipt` sums `rawPrice × quantity` for all items |
| DATABASE_URL startup diagnostics | `config/db.js` logs connection target at boot for Railway debugging |

---

## Session: 2026-05-17 → 2026-05-21 (Initial Build + Hardening)

### What Was Built (Sprint 1–4 complete)

The entire application was built from scratch — the repo contained only documentation when this session started.

#### Backend (Node.js / Express / PostgreSQL)

| File | Description |
|---|---|
| `server.js` | Express entry point, morgan logging, helmet, CORS, error handler, unhandledRejection guard |
| `config/db.js` | pg Pool, DATABASE_URL from env |
| `routes/receipts.js` | POST /scan, POST /, GET /, GET /:id |
| `routes/products.js` | CRUD + /search, /categories, /compare, /merges, /merge/:id |
| `routes/shops.js` | GET /, POST / |
| `routes/analytics.js` | /summary, /by-shop, /by-category, /top-products, /shop-comparison, /price-alerts |
| `controllers/receiptController.js` | OCR scan → parse → normalise → confirm flow |
| `controllers/productController.js` | Products CRUD + fuzzy search + compare with merge aggregation |
| `controllers/mergeController.js` | GET/POST/DELETE merge relationships |
| `controllers/shopController.js` | Shop listing and creation |
| `controllers/analyticsController.js` | All 8 analytics handlers |
| `services/ocrService.js` | Tesseract.js v5 with createWorker/terminate lifecycle, local langPath |
| `services/parserService.js` | Line-by-line OCR text parser with 9-category keyword suggestion |
| `services/normalisationService.js` | per_100g / per_100ml / per_item / per_kg / per_litre normalisation |
| `services/analyticsService.js` | 8 SQL aggregation functions including CTE-based trend detection |
| `models/Receipt.js` | Receipt CRUD |
| `models/Product.js` | Product CRUD, fuzzy search (pg_trgm), getCategories |
| `models/Shop.js` | Shop findOrCreate |
| `models/PriceRecord.js` | createMany, findByReceiptId, findByProduct, findByProducts |
| `models/ProductMerge.js` | create, findByProduct, getRelatedProductIds, remove |
| `middleware/upload.js` | Multer — JPEG/PNG/WebP, 10MB limit, UUID filenames |
| `middleware/validate.js` | Joi middleware factory (confirmReceipt + updateProduct schemas) |
| `middleware/errorHandler.js` | Central Express error handler |
| `migrations/000_extensions.sql` | pg_trgm extension |
| `migrations/001–004_*.sql` | shops, products, receipts, price_records tables |
| `migrations/005_seed_shops.sql` | Seed data for common UK supermarkets |
| `migrations/006_create_product_merges.sql` | product_merges table with FK, self-merge CHECK, unique pair |
| `scripts/download-tessdata.js` | Downloads eng.traineddata.gz from GitHub naptha/tessdata |
| `utils/logger.js` | Timestamp-prefixed console logger |

#### Frontend (React Native / Expo)

| File | Description |
|---|---|
| `App.js` | Root component |
| `navigation/AppNavigator.js` | Bottom tab (Receipts / Compare / Dashboard) + native stacks |
| `screens/HomeScreen.js` | Receipt list with ReceiptCard components |
| `screens/ScanReceiptScreen.js` | Camera/library picker → scan → inline review with category picker per item |
| `screens/ReceiptReviewScreen.js` | Detail view for a saved receipt |
| `screens/ProductsScreen.js` | Product list with search, dynamic category filter chips |
| `screens/CompareScreen.js` | Per-product price comparison with merge UI |
| `screens/DashboardScreen.js` | Analytics: summary stats, spend charts, top products, shop comparison, price alerts |
| `components/SpendingChart.js` | SVG bar chart (react-native-svg) — shop or category spend |
| `components/TopProductsChart.js` | SVG bar chart — top 10 products by spend |
| `components/ShopComparisonTable.js` | Ranked shop score table with trophy for #1 |
| `components/PriceTrendAlerts.js` | Price increase alerts with low/medium/high severity badges |
| `components/PriceComparisonTable.js` | Per-product shop price table |
| `components/ReceiptCard.js` | Receipt list item |
| `components/ProductRow.js` | Product list item with normalised price |
| `components/CategoryTag.js` | Coloured category pill |
| `components/ShopBadge.js` | Shop name badge |
| `hooks/useReceipts.js` | Receipt fetching and state |
| `hooks/useProducts.js` | Products fetching + compare hook |
| `hooks/useAnalytics.js` | Parallel fetch of all 6 analytics datasets |
| `services/api.js` | Axios instance, all backend calls |
| `store/index.js` | Zustand store (receipts, products, analytics) |
| `utils/formatCurrency.js` | £X.XX formatter |
| `utils/unitHelpers.js` | formatNormalisedPrice for display |

---

## Critical Bugs Fixed

| Bug | Fix |
|---|---|
| Tesseract worker thread crash killed Express process | Added unhandledRejection/uncaughtException handlers; switched to createWorker + terminate lifecycle |
| Tesseract CDN 403 (jsdelivr blocked) | Local eng.traineddata.gz via download-tessdata.js script; langPath points to backend/tessdata/ |
| CORS wildcard `*` in production | Replaced with `FRONTEND_URL` env var; blocks all in production if unset |
| pg_trgm missing | Added migration 000_extensions.sql run before schema migrations |
| Dashboard missing 3 analytics panels | Built Top Products, Shop Comparison Score, Price Trend Alerts end-to-end |
| Category suggestion missing on scan | Added CATEGORY_KEYWORDS + suggestCategory() to parserService; added inline category picker to ScanReceiptScreen |
| Recharts not usable in React Native | Replaced with react-native-svg SVG rendering |
| Duplicate normalisation logic | Deleted frontend/src/utils/normalise.js; backend normalises during scan response |
| Hardcoded category list in ProductsScreen | Replaced with GET /api/products/categories dynamic fetch |
| parseInt NaN for quantity | Added `|| 1` guard in parserService line 91 |

---

## Features Added (Beyond Initial MVP)

| Feature | Location |
|---|---|
| Product merge (PRD §4.4) | migration 006, ProductMerge model, mergeController, routes, CompareScreen UI |
| Joi input validation | middleware/validate.js wired to POST /receipts and PUT /products/:id |
| Dynamic category API | GET /api/products/categories |
| NaN-safe qty parsing | parserService.js |
| Claude Vision OCR | Replaced Tesseract.js with Anthropic SDK claude-sonnet-4-5 vision |

---

## Claude Vision OCR — Architecture (2026-05-22)

Tesseract.js was replaced with Claude Vision. The new pipeline:

```
image upload → ocrService.extractText()
             → Anthropic SDK (claude-sonnet-4-5, vision, base64)
             → JSON array: [{ name, price, quantity, unit }, ...]
             → mapClaudeItem() in receiptController.js
             → { rawName, rawPrice, quantity, weightGrams, volumeMl, unitType }
             → normaliseItems() → { normalisedPrice, unitType }
             → POST /api/receipts/scan response
```

### mapClaudeItem — unit format expectations

Claude returns `unit` as a string. mapClaudeItem handles these forms:

| Claude unit value | weightGrams | volumeMl | unitType |
|---|---|---|---|
| `"500g"` | 500 | — | per_100g |
| `"1.5kg"` | 1500 | — | per_100g |
| `"g"` (bare) | null | — | per_100g |
| `"kg"` (bare) | null | — | per_kg (rawPrice treated as £/kg) |
| `"750ml"` | — | 750 | per_100ml |
| `"2l"` / `"2L"` | — | 2000 | per_100ml |
| `"l"` / `"litre"` | — | null | per_litre (rawPrice treated as £/L) |
| `"ml"` (bare) | — | null | per_100ml |
| `"each"` or other | null | null | per_item |

When `unit` is quantified (e.g. `"400g"`), the quantity is parsed out and used as the
reference weight/volume so normaliseItems can compute the correct per-100g/per-100ml price.

### Pipeline Verified (fixture test, 2026-05-22)

10-item Tesco receipt fixture processed through the full pipeline:

| Item | unitType | normalisedPrice |
|---|---|---|
| Whole Milk 2L | per_100ml | £0.0825/100ml |
| Mature Cheddar 400g | per_100g | £0.8750/100g |
| Sourdough Bread 800g | per_100g | £0.2625/100g |
| Free Range Eggs (x6) | per_item | £0.3750/item |
| Chicken Breast 500g | per_100g | £0.9980/100g |
| Greek Yoghurt 500g | per_100g | £0.3500/100g |
| Sparkling Water 1L | per_100ml | £0.0650/100ml |

All unit conversions and normalised prices verified correct.

### Known limitation: Toilet Rolls category bug (pre-existing)

`suggestCategory("Toilet Rolls x9")` returns **Bakery** because "roll" appears in
CATEGORY_KEYWORDS.Bakery before "toilet paper" is checked in Household. Fix: add
"toilet roll" to Household keywords and/or check longer phrases before shorter substrings.

---

## Known Limitations (Not Blockers)

- No automated test suite. Logic has been verified by direct node invocation.
- PostgreSQL must be running and migrated before any DB-dependent endpoints work.
- `ANTHROPIC_API_KEY` must be set in `.env` — the scan endpoint fails with auth error if missing.
- React Native camera/OCR flow can only be fully tested on a physical device or simulator.
- Recharts (browser-only) is NOT used; SVG charts use react-native-svg instead.
