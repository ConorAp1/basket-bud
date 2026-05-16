# Basket-Bud – Claude Context File

This file gives Claude full context about the Basket-Bud project so it can assist effectively without repeated explanation.

---

## Project Overview

**Basket-Bud** is a self-hosted grocery receipt scanning and price comparison application. Users photograph grocery receipts, the app extracts product names and prices using OCR, normalises costs to a per-unit or per-weight basis, and then surfaces analytics dashboards that show which shop is genuinely cheaper for the specific products a user buys.

**Core problem:** Shoppers who use multiple stores have no easy way to know which shop is actually cheaper for their specific basket of goods.

**Target users:** Data-savvy general shoppers who enjoy analytics and want actionable, evidence-based insights into their grocery spending.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React Native (Expo) |
| Backend | Node.js with Express |
| Database | PostgreSQL |
| OCR | Tesseract.js (open-source, no paid API) |
| Data Visualisation | Recharts (within a React Native Web or dashboard view) |
| Hosting | Self-hosted on a home server |
| Package Manager | npm |
| Language | JavaScript (ES modules on backend, JSX on frontend) |

No paid APIs. Everything must run locally or be self-hostable.

---

## Repository Structure

```
basket-bud/
├── CLAUDE.md
├── AGENTS.md
├── README.md
├── .env.example
├── .gitignore
│
├── backend/
│   ├── package.json
│   ├── server.js                  # Express entry point
│   ├── config/
│   │   └── db.js                  # PostgreSQL connection pool (pg)
│   ├── routes/
│   │   ├── receipts.js            # POST /receipts, GET /receipts/:id
│   │   ├── products.js            # GET /products, PUT /products/:id
│   │   ├── shops.js               # GET /shops, POST /shops
│   │   └── analytics.js           # GET /analytics/summary, /by-shop, /by-category
│   ├── controllers/
│   │   ├── receiptController.js
│   │   ├── productController.js
│   │   ├── shopController.js
│   │   └── analyticsController.js
│   ├── services/
│   │   ├── ocrService.js          # Tesseract.js receipt parsing logic
│   │   ├── parserService.js       # Extract structured data from OCR text
│   │   ├── normalisationService.js # Price-per-unit / price-per-weight logic
│   │   └── analyticsService.js    # Aggregation queries
│   ├── models/
│   │   ├── Receipt.js
│   │   ├── Product.js
│   │   ├── Shop.js
│   │   └── PriceRecord.js
│   ├── middleware/
│   │   ├── errorHandler.js
│   │   └── upload.js              # Multer config for receipt image uploads
│   ├── migrations/
│   │   ├── 001_create_shops.sql
│   │   ├── 002_create_products.sql
│   │   ├── 003_create_receipts.sql
│   │   └── 004_create_price_records.sql
│   └── utils/
│       └── logger.js
│
├── frontend/
│   ├── package.json
│   ├── app.json                   # Expo config
│   ├── App.js                     # Root navigator
│   ├── assets/
│   ├── src/
│   │   ├── navigation/
│   │   │   └── AppNavigator.js
│   │   ├── screens/
│   │   │   ├── HomeScreen.js
│   │   │   ├── ScanReceiptScreen.js
│   │   │   ├── ReceiptReviewScreen.js  # Edit extracted data before saving
│   │   │   ├── ProductsScreen.js
│   │   │   ├── CompareScreen.js        # Multi-shop price comparison
│   │   │   └── DashboardScreen.js      # Analytics dashboard
│   │   ├── components/
│   │   │   ├── ReceiptCard.js
│   │   │   ├── ProductRow.js
│   │   │   ├── ShopBadge.js
│   │   │   ├── PriceComparisonTable.js
│   │   │   ├── SpendingChart.js        # Recharts wrapper
│   │   │   └── CategoryTag.js
│   │   ├── hooks/
│   │   │   ├── useReceipts.js
│   │   │   ├── useProducts.js
│   │   │   └── useAnalytics.js
│   │   ├── services/
│   │   │   └── api.js             # Axios instance pointing to backend
│   │   ├── store/
│   │   │   └── index.js           # Zustand store
│   │   └── utils/
│   │       ├── formatCurrency.js
│   │       └── unitHelpers.js
│   └── ...
```

---

## MVP Features

1. **Receipt photo scanning** – Camera capture in React Native, image sent to backend, processed with Tesseract.js to extract text.
2. **Data extraction & review** – Parsed product names, quantities, weights, and prices surfaced for user review/correction before saving.
3. **Product categorisation and tagging** – Products assigned categories (Dairy, Produce, Bakery, etc.) and free-form tags.
4. **Price-per-unit / price-per-weight normalisation** – All prices normalised to a comparable base unit (e.g. £/100g, £/litre, £/item) so comparisons are meaningful.
5. **Multi-shop price comparison** – Side-by-side view of the same product across different shops with normalised prices.
6. **Spending analytics dashboard** – Breakdown charts by category, by shop, and by product over time using Recharts.

---

## Database Schema (Key Tables)

```sql
-- shops: Stores like Aldi, Lidl, Tesco
shops (id, name, location, created_at)

-- products: Canonical product records
products (id, name, brand, category, tags[], canonical_unit, created_at)

-- receipts: A single scanned receipt
receipts (id, shop_id, scanned_at, image_path, raw_ocr_text, total_amount, created_at)

-- price_records: Each line item on a receipt, normalised
price_records (id, receipt_id, product_id, shop_id, raw_price, quantity, weight_grams,
               unit_type, normalised_price_per_unit, scanned_at, created_at)
```

---

## Common Commands

### Backend

```bash
# Install dependencies
cd backend && npm install

# Run development server (with nodemon)
npm run dev

# Run migrations manually
psql -U basketbud -d basketbud_db -f backend/migrations/001_create_shops.sql

# Run all migrations in order
for f in backend/migrations/*.sql; do psql -U basketbud -d basketbud_db -f "$f"; done

# Start production server
npm start
```

### Frontend

```bash
# Install dependencies
cd frontend && npm install

# Start Expo dev server
npx expo start

# Run on Android
npx expo run:android

# Run on iOS
npx expo run:ios

# Build for web (for dashboard access from browser)
npx expo export:web
```

### Database

```bash
# Create database
createdb -U postgres basketbud_db

# Create user
psql -U postgres -c "CREATE USER basketbud WITH PASSWORD 'yourpassword';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE basketbud_db TO basketbud;"

# Connect to DB
psql -U basketbud -d basketbud_db
```

---

## Coding Conventions

### General
- **JavaScript only** – no TypeScript in this project (solo developer, speed over strictness).
- Use `async/await` throughout; no raw Promise chains.
- Use named exports rather than default exports in services and utilities; default exports acceptable in React components.
- Error messages must be descriptive and include context (e.g. which product, which receipt ID).

### Backend (Node/Express)
- Route files only define routes and call controllers. No business logic in routes.
- Controllers handle HTTP request/response. No direct DB calls – delegate to services or models.
- Services contain all business logic (OCR processing, normalisation calculations, analytics queries).
- Use `pg` (node-postgres) directly – no ORM. Write raw SQL for clarity and control.
- All DB queries live in model files or service files, never inline in controllers.
- Use `express-async-errors` or wrap controllers in a `catchAsync` helper to avoid try/catch repetition.
- Uploaded receipt images stored in `backend/uploads/receipts/` and referenced by path in DB.
- Multer used for file uploads; validate that only image types (jpeg, png, webp) are accepted.

### Frontend (React Native / Expo)
- Use functional components and hooks only.
- State management: Zustand for global state (receipts list, selected shop filters, user prefs).
- API calls abstracted into `src/services/api.js` using an Axios instance with the backend base URL from env.
- Custom hooks (`useReceipts`, `useAnalytics`) handle data fetching and expose loading/error states.
- Recharts used in web/dashboard views; for native chart needs, use `react-native-chart-kit` as a fallback.
- Screen components should be thin – logic in hooks, presentation in components.
- Styles use React Native `StyleSheet.create()` – no inline style objects except for dynamic values.

### OCR & Parsing
- Tesseract.js runs on the **backend** (Node.js worker), not in the browser/app. This keeps the mobile app lightweight.
- `ocrService.js` is responsible only for running Tesseract and returning raw text.
- `parserService.js` is responsible for interpreting that text into structured `{ name, price, quantity, weight, unit }` objects. These are separate concerns.
- Parser should be resilient – partial/bad OCR output is expected. Always return best-effort results and flag uncertain items for user review.

### Normalisation
- `normalisationService.js` converts all prices to a `normalised_price_per_unit`.
- Standard units: `per_item`, `per_100g`, `per_litre`, `per_kg`.
- When unit type is ambiguous from OCR, flag it as `unit_type = 'unknown'` and let the user confirm.

---

## Environment Variables

See `.env.example` for all required variables. Key ones:

- `DATABASE_URL` – PostgreSQL connection string
- `PORT` – Backend Express port (default 3001)
- `UPLOAD_DIR` – Path for receipt image storage
- `FRONTEND_URL` – For CORS config on backend

---

## Self-Hosting Notes

- Backend runs as a Node.js process on the home server, managed by PM2.
- PostgreSQL runs as a system service on the same server.
- Expo web build served via a simple static file server (or nginx).
- React Native app on phone connects to home server via local network IP or a tailscale/VPN tunnel for remote access.
- No Docker initially – direct process management for simplicity.

---

## Key Design Decisions & Rationale

| Decision | Reason |
|---|---|
| Tesseract.js on backend (not device) | Keeps mobile app lightweight; OCR is CPU-intensive |
| Raw SQL over ORM | Full control, easier debugging for a solo dev, no abstraction overhead |
| PostgreSQL over SQLite | Better querying for analytics aggregations; handles growth |
| Zustand over Redux | Minimal boilerplate for a solo project |
| No paid APIs | Hard constraint – everything must be free and self-hosted |
| User review step after OCR | OCR on receipts is imperfect; human correction is essential for data quality |

---

## When Helping With This Project, Claude Should:

- Always write JavaScript (not TypeScript).
- Keep backend logic in the correct layer (routes → controllers → services → models).
- Write SQL queries compatible with PostgreSQL.
- Assume Tesseract.js is used server-side via the `tesseract.js` npm package.
- Remember that price normalisation is central – any feature touching prices must account for different unit types.
- Suggest user-review/correction flows wherever OCR output is used, as accuracy is not guaranteed.
- Keep the self-hosted, no-paid-API constraint in mind for all suggestions.