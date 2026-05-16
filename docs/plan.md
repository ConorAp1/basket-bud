# Basket-Bud — Development Plan

## Project Overview
Basket-Bud is a self-hosted grocery receipt scanning and price comparison app. Users photograph supermarket receipts, the app extracts product data using Tesseract.js OCR, normalises prices to a comparable unit (per kg, per unit, per litre), and presents an analytics dashboard showing which shops offer the best value for the specific products the user buys.

**Developer:** Solo
**Hosting:** Home server (self-hosted)
**Budget:** Zero — no paid APIs or cloud services

---

## MVP Scope (All Sprints)
1. Receipt photo scanning + OCR data extraction (Tesseract.js)
2. Product categorisation and tagging
3. Price-per-unit and price-per-weight normalisation
4. Multi-shop price comparison for the same products
5. Spending analytics dashboard (Recharts) with breakdowns by shop, category, and product

---

## Sprint Overview

| Sprint | Focus | Duration |
|---|---|---|
| Sprint 1 | Project scaffold, database, OCR pipeline | 1–2 weeks |
| Sprint 2 | Receipt parsing, product matching, review UI | 1–2 weeks |
| Sprint 3 | Price comparison screens | 1 week |
| Sprint 4 | Analytics dashboard | 1–2 weeks |
| Sprint 5 | Polish, manual corrections, self-hosting setup | 1 week |

---

## Sprint 1 — Foundation & OCR Pipeline

**Goal:** Get the project scaffolded end-to-end. A receipt image can be uploaded from the app, processed by Tesseract.js on the backend, and raw OCR text returned to the screen. PostgreSQL is connected and the core schema is in place.

**Duration:** 1–2 weeks

---

### Task 1.1 — Project Scaffold & Monorepo Setup
**Description:** Initialise the project structure as a monorepo with `client/` (React Native) and `server/` (Node.js/Express) directories.

**Acceptance Criteria:**
- [ ] Root `package.json` with workspaces or simple script runner
- [ ] `client/` initialised with `npx react-native init BasketBud --template react-native-template-typescript`
- [ ] `server/` initialised with `npm init`, Express installed, basic `app.js` returning `{ status: 'ok' }` on `GET /health`
- [ ] `.gitignore` covering `node_modules`, `uploads/`, `.env`, `*.jpg`, `*.png` in test dirs
- [ ] `README.md` with basic setup instructions

**Files to create:**
```
basket-bud/
├── client/
├── server/
│   ├── app.js
│   └── package.json
├── .gitignore
└── README.md
```

---

### Task 1.2 — PostgreSQL Setup with Docker Compose
**Description:** Create a `docker-compose.yml` to run PostgreSQL locally for development. Write the initial database schema migration.

**Acceptance Criteria:**
- [ ] `docker-compose.yml` spins up PostgreSQL on port 5432 with credentials from `.env`
- [ ] `docker compose up -d` successfully starts the database
- [ ] `database/schema.sql` contains all core tables: `shops`, `receipts`, `products`, `receipt_items`, `price_history`
- [ ] Migration script (`server/src/db/migrate.js`) runs schema against the database successfully
- [ ] `server/src/db/connection.js` exports a connected `pg` Pool instance

**Schema (minimum for Sprint 1):**
```sql
CREATE TABLE shops (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  location VARCHAR(200),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE receipts (
  id SERIAL PRIMARY KEY,
  shop_id INTEGER REFERENCES shops(id),
  scanned_at TIMESTAMPTZ NOT NULL,
  image_path TEXT NOT NULL,
  raw_ocr_text TEXT,
  total_amount NUMERIC(10, 2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  canonical_name VARCHAR(200),
  category VARCHAR(100),
  unit_type VARCHAR(20) CHECK (unit_type IN ('weight', 'volume', 'quantity')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE receipt_items (
  id SERIAL PRIMARY KEY,
  receipt_id INTEGER REFERENCES receipts(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  raw_name VARCHAR(200) NOT NULL,
  quantity NUMERIC(10, 3),
  unit VARCHAR(20),
  total_price NUMERIC(10, 2),
  price_per_unit NUMERIC(10, 4),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE price_history (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id),
  shop_id INTEGER REFERENCES shops(id),
  price_per_unit NUMERIC(10, 4) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Files to create:**
```
database/
├── schema.sql
└── seed.sql          # A few test shops (Tesco, Aldi, Lidl, Sainsbury's)
server/src/db/
├── connection.js
└── migrate.js
docker-compose.yml
.env.example
```

---

### Task 1.3 — Express Server Foundation
**Description:** Build out the Express server with proper middleware, error handling, and route structure.

**Acceptance Criteria:**
- [ ] Express app configured with `cors`, `helmet`, `morgan` (logging), `express.json()`
- [ ] `multer` configured for image uploads, saving to `server/uploads/`, max 10MB
- [ ] Centralised error handler middleware in `server/src/middleware/errorHandler.js`
- [ ] Route files created (empty routers for now): `receipts.js`, `products.js`, `shops.js`, `analytics.js`
- [ ] All routes mounted under `/api/` prefix
- [ ] `GET /health` returns `{ status: 'ok', timestamp: new Date() }`
- [ ] Environment config loaded from `.env` via `dotenv`

**Install packages:**
```bash
cd server
npm install express cors helmet morgan multer dotenv pg
npm install --save-dev nodemon
```

**Files to create:**
```
server/src/
├── routes/
│   ├── receipts.js
│   ├── products.js
│   ├── shops.js
│   └── analytics.js
├── middleware/
│   ├── errorHandler.js
│   └── upload.js        # multer config
└── app.js               # updated with all middleware
```

---

### Task 1.4 — Tesseract.js OCR Service
**Description:** Build the OCR service that takes an image file path and returns raw extracted text using Tesseract.js running in a Node.js worker.

**Acceptance Criteria:**
- [ ] `tesseract.js` installed on backend (`npm install tesseract.js`)
- [ ] `server/src/services/ocr/ocrService.js` exports an async `extractText(imagePath)` function
- [ ] Function runs Tesseract.js with language `eng`, OEM 1 (LSTM), PSM 6 (assume single uniform block)
- [ ] Returns `{ text: string, confidence: number, words: array }` object
- [ ] Errors are caught and thrown with meaningful messages
- [ ] Basic test: running `node server/src/services/ocr/testOcr.js` on a sample receipt image logs extracted text to console

**Install packages:**
```bash
cd server
npm install tesseract.js
```

**Files to create:**
```
server/src/services/
└── ocr/
    ├── ocrService.js
    └── testOcr.js       # Manual test script (gitignored input images)
server/test-receipts/    # gitignored folder for test receipt images
```

**Key implementation note:**
```javascript
// ocrService.js
const Tesseract = require('tesseract.js');

async function extractText(imagePath) {
  const { data } = await Tesseract.recognize(imagePath, 'eng', {
    logger: m => process.env.NODE_ENV === 'development' && console.log(m),
    tessedit_ocr_engine_mode: 1,   // LSTM only
    tessedit_pageseg_mode: 6,      // Single uniform block
  });
  return {
    text: data.text,
    confidence: data.confidence,
    words: data.words,
  };
}

module.exports = { extractText };
```

---

### Task 1.5 — Receipt Scan API Endpoint
**Description:** Wire together the upload middleware and OCR service into the `POST /api/receipts/scan` endpoint. Returns raw OCR text and a structured preview to the client.

**Acceptance Criteria:**
- [ ] `POST /api/receipts/scan` accepts a `multipart/form-data` request with field name `receipt`
- [ ] Image is saved to `server/uploads/` with a unique filename (timestamp + UUID)
- [ ] OCR is run on the saved image
- [ ] Endpoint returns JSON: `{ receiptId: null, imagePath, rawText, confidence }`
- [ ] Proper HTTP error responses: 400 if no file, 415 if wrong file type, 500 on OCR failure
- [ ] File type validation: only JPEG and PNG accepted

**Route handler:**
```javascript
// POST /api/receipts/scan
router.post('/scan', upload.single('receipt'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No receipt image provided' });
    const { text, confidence } = await extractText(req.file.path);
    res.json({
      receiptId: null,
      imagePath: req.file.path,
      rawText: text,
      confidence: Math.round(confidence),
    });
  } catch (err) {
    next(err);
  }
});
```

---

### Task 1.6 — React Native App Foundation
**Description:** Set up the React Native client with navigation, a basic screen structure, and the receipt scanning screen capable of picking an image and sending it to the backend.

**Acceptance Criteria:**
- [ ] React Navigation installed and configured with bottom tab navigator
- [ ] 4 tabs: **Receipts**, **Compare**, **Dashboard**, **Settings**
- [ ] `ReceiptsScreen` has an "Add Receipt" button that opens the image picker
- [ ] `react-native-image-picker` integrated — user can select from camera roll or take photo
- [ ] On image selection, image is uploaded to `POST /api/receipts/scan` using `fetch` with `FormData`
- [ ] Raw OCR text displayed on screen after successful upload (temporary — will become review UI in Sprint 2)
- [ ] Loading spinner shown during upload/OCR processing
- [ ] Error toast shown on failure
- [ ] `client/src/services/api.js` contains `API_BASE_URL` from config and the `scanReceipt(imageUri)` function

**Install packages:**
```bash
cd client
npm install @react-navigation/native @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context
npm install react-native-image-picker
npm install zustand   # state management
```

**Files to create:**
```
client/src/
├── navigation/
│   └── AppNavigator.tsx
├── screens/
│   ├── Receipts/
│   │   └── ReceiptsScreen.tsx
│   ├── Compare/
│   │   └── CompareScreen.tsx
│   ├── Dashboard/
│   │   └── DashboardScreen.tsx
│   └── Settings/
│       └── SettingsScreen.tsx
├── services/
│   └── api.js
└── components/
    └── LoadingOverlay.tsx
```

---

### Task 1.7 — Environment Configuration & .env.example
**Description:** Create `.env.example` with all required environment variables documented, and ensure `.env` is gitignored.

**File: `.env.example`**
```env
# Server
PORT=3001
NODE_ENV=development

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=basket_bud
DB_USER=basket_bud_user
DB_PASSWORD=change_me_in_production

# File Uploads
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=10

# Tesseract OCR
TESSERACT_LANG=eng
TESSERACT_OEM=1
TESSERACT_PSM=6

# Client (React Native)
# Set this to your home server's local IP address
API_BASE_URL=http://192.168.1.x:3001/api
```

---

## Sprint 1 — Definition of Done

The sprint is complete when:
- [ ] `docker compose up -d` starts PostgreSQL with no errors
- [ ] `cd server && node src/db/migrate.js` creates all 5 core tables successfully
- [ ] `cd server && npm run dev` starts the Express server on port 3001
- [ ] `GET http://localhost:3001/health` returns `{ "status": "ok" }`
- [ ] Running `node server/src/services/ocr/testOcr.js` against a test receipt image returns readable text output
- [ ] `POST http://localhost:3001/api/receipts/scan` with a JPEG receipt image returns raw OCR text and confidence score
- [ ] The React Native app runs on a device/simulator, opens image picker, uploads image to backend, and displays the returned OCR text
- [ ] All code committed to git with no secrets in the repository

---

## Sprint 2 Preview — Receipt Parsing & Product Matching

**Goal:** Turn raw OCR text into structured receipt items. Build a review/correction UI.

Key tasks:
- Build `server/src/services/parser/receiptParser.js` — regex-based line item extraction
- Handle common receipt formats (Tesco, Aldi, Lidl, Sainsbury's patterns)
- Match parsed product names to `products` table using fuzzy string matching
- Build price normalisation service (`server/src/services/normaliser/priceNormaliser.js`)
- Handle weight patterns: `"Chicken Breast 0.456kg @ £5.49/kg"`
- Handle multibuy patterns: `"Yoghurt 3 for £2.00"`
- Build Receipt Review screen in React Native — user sees parsed items, can edit names, prices, quantities before confirming
- `POST /api/receipts/confirm` endpoint saves confirmed data to database

---

## Sprint 3 Preview — Price Comparison

**Goal:** Users can select a product and see its price history across all shops they've scanned.

Key tasks:
- `GET /api/compare?product_id=` endpoint with price-per-unit data per shop
- Product search with fuzzy matching (`GET /api/products/search?q=`)
- Compare screen in React Native — product selector + side-by-side shop price cards
- Highlight cheapest shop in green
- Allow filtering by date range (last 30 days, 3 months, all time)

---

## Sprint 4 Preview — Analytics Dashboard

**Goal:** Recharts-powered dashboard showing spending breakdowns.

Key tasks:
- Decide on Recharts rendering strategy in React Native (WebView vs Victory Native)
- `GET /api/analytics/spend-by-shop` endpoint
- `GET /api/analytics/spend-by-category` endpoint
- `GET /api/analytics/price-trends/:product_id` endpoint
- Dashboard screen: total spend card, spend-by-shop bar chart, spend-by-category pie/donut chart, biggest savings opportunities table

---

## Sprint 5 Preview — Polish & Self-Hosting

**Goal:** App is stable, self-hosted, and usable day-to-day.

Key tasks:
- `docker-compose.yml` updated with server container (not just DB)
- `Dockerfile` for Express server
- Nginx reverse proxy config for home server
- Manual correction flows for misread products
- Product category management screen (Settings tab)
- Data export to CSV
- Basic app icon and splash screen for Basket-Bud

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Tesseract.js accuracy poor on receipts | High | High | Always show review UI before saving; store raw OCR text for re-parsing |
| Receipt formats vary wildly between shops | High | Medium | Build shop-specific parser modules; iteratively improve per shop |
| Recharts incompatible with React Native | Medium | High | Evaluate early in Sprint 4; have Victory Native as fallback |
| Price normalisation edge cases | Medium | Medium | Flag unusual patterns for manual review; don't silently store wrong data |
| Home server downtime | Low | Low | It's a personal app — acceptable; add health check endpoint |

---

## Commands Reference

```bash
# Start database
docker compose up -d

# Run migrations
cd server && node src/db/migrate.js

# Start backend (development)
cd server && npm run dev

# Start React Native (iOS)
cd client && npx react-native run-ios

# Start React Native (Android)
cd client && npx react-native run-android

# Test OCR service manually
cd server && node src/services/ocr/testOcr.js path/to/receipt.jpg

# Check PostgreSQL
docker exec -it basket-bud-db psql -U basket_bud_user -d basket_bud
```