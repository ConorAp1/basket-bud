# Basket-Bud – AI Agent Context File

This file provides full project context for AI coding agents (Codex, Copilot Workspace, GPT-based agents, etc.) working on the Basket-Bud codebase. Read this before making any changes.

---

## What Is Basket-Bud?

**Basket-Bud** is a self-hosted grocery receipt scanning and price comparison app. Users photograph grocery store receipts. The app uses Tesseract.js (open-source OCR) to extract product names and prices, normalises them to a comparable per-unit or per-weight basis, and presents analytics dashboards showing which shops are genuinely cheaper for the specific products the user buys.

**Stack:** React Native (Expo) frontend · Node.js + Express backend · PostgreSQL database · Tesseract.js OCR · Recharts visualisation · Self-hosted on a home server.

**Constraint:** No paid APIs. All processing is local. Solo developer project.

---

## Repository Layout

```
basket-bud/
├── backend/
│   ├── server.js              # Express app entry point, port from env
│   ├── config/db.js           # pg Pool – all DB access goes through here
│   ├── routes/                # Express routers (thin – no logic)
│   │   ├── receipts.js
│   │   ├── products.js
│   │   ├── shops.js
│   │   └── analytics.js
│   ├── controllers/           # Handle req/res – call services only
│   │   ├── receiptController.js
│   │   ├── productController.js
│   │   ├── shopController.js
│   │   └── analyticsController.js
│   ├── services/              # All business logic lives here
│   │   ├── ocrService.js      # Tesseract.js integration
│   │   ├── parserService.js   # OCR text → structured line items
│   │   ├── normalisationService.js  # Price-per-unit / price-per-weight
│   │   └── analyticsService.js      # Aggregation and comparison queries
│   ├── models/                # SQL query functions (no ORM)
│   │   ├── Receipt.js
│   │   ├── Product.js
│   │   ├── Shop.js
│   │   └── PriceRecord.js
│   ├── middleware/
│   │   ├── upload.js          # Multer – images only (jpeg/png/webp)
│   │   └── errorHandler.js
│   ├── migrations/            # Raw SQL migration files, run in order
│   │   ├── 001_create_shops.sql
│   │   ├── 002_create_products.sql
│   │   ├── 003_create_receipts.sql
│   │   └── 004_create_price_records.sql
│   └── utils/logger.js
│
└── frontend/
    ├── App.js                 # Root component / navigation setup
    ├── src/
    │   ├── navigation/AppNavigator.js
    │   ├── screens/
    │   │   ├── HomeScreen.js
    │   │   ├── ScanReceiptScreen.js      # Camera → upload to backend
    │   │   ├── ReceiptReviewScreen.js    # Edit OCR results before saving
    │   │   ├── ProductsScreen.js
    │   │   ├── CompareScreen.js          # Multi-shop price comparison
    │   │   └── DashboardScreen.js        # Recharts analytics
    │   ├── components/
    │   │   ├── ReceiptCard.js
    │   │   ├── ProductRow.js
    │   │   ├── PriceComparisonTable.js
    │   │   ├── SpendingChart.js
    │   │   ├── ShopBadge.js
    │   │   └── CategoryTag.js
    │   ├── hooks/
    │   │   ├── useReceipts.js
    │   │   ├── useProducts.js
    │   │   └── useAnalytics.js
    │   ├── services/api.js    # Axios instance – base URL from env
    │   ├── store/index.js     # Zustand global store
    │   └── utils/
    │       ├── formatCurrency.js
    │       └── unitHelpers.js
```

---

## Architecture Rules for Agents

Agents MUST follow these structural rules. Do not deviate.

### Backend Layering

```
Route → Controller → Service → Model → Database
```

- **Routes** (`/routes/*.js`): Define HTTP endpoints only. No logic.
- **Controllers** (`/controllers/*.js`): Parse req, call one or more services, send res. No SQL.
- **Services** (`/services/*.js`): All business logic. Call models for data. May call other services.
- **Models** (`/models/*.js`): SQL query functions. Use the `pg` pool from `config/db.js`. Return plain JS objects.

**Violations to avoid:**
- ❌ SQL queries inside controllers
- ❌ `res.json()` inside services or models
- ❌ Business logic inside route files
- ❌ Importing `db.js` directly from controllers

### Frontend Layering

```
Screen → Custom Hook → API Service → Backend
         ↓
      Component
```

- **Screens**: Compose components, use hooks. Minimal logic.
- **Hooks** (`useReceipts`, `useAnalytics`, etc.): Data fetching, loading/error state. No JSX.
- **Components**: Pure presentation. Receive data as props.
- **api.js**: Single Axios instance. All backend calls go through here.

---

## Core Domain Concepts

Agents must understand these before modifying data-related code.

### Price Normalisation

Every price stored in `price_records` must have a `normalised_price_per_unit` and a `unit_type`. Valid unit types:

```javascript
const UNIT_TYPES = ['per_item', 'per_100g', 'per_kg', 'per_litre', 'per_100ml', 'unknown'];
```

Normalisation logic lives exclusively in `backend/services/normalisationService.js`. Do not perform unit conversions anywhere else.

Example: A 500ml bottle of milk priced at £0.89 → `normalised_price_per_unit = 1.78`, `unit_type = 'per_litre'`.

### OCR Pipeline

```
Receipt image (from mobile camera)
  → POST /receipts/upload (multipart/form-data)
  → Multer saves image to backend/uploads/receipts/
  → ocrService.js runs Tesseract.js on the image path
  → Returns raw OCR text string
  → parserService.js converts text → array of line item objects:
      { rawText, name, price, quantity, weightGrams, unit, confidence }
  → Response sent to frontend for user review (ReceiptReviewScreen)
  → User confirms/edits items
  → POST /receipts/confirm with corrected data
  → normalisationService.js calculates normalised prices
  → Data saved to receipts + price_records tables
```

The user review step is **mandatory** – OCR output is imperfect and must never be saved without human confirmation.

### Product Matching

When a receipt line item is saved:
1. Check `products` table for a matching product name (fuzzy match acceptable – use `ILIKE` or similarity).
2. If a match exists with confidence > threshold, link to that product.
3. If no match, create a new product record and prompt user to categorise it.

Product categories: `Dairy`, `Produce`, `Bakery`, `Meat & Fish`, `Frozen`, `Drinks`, `Snacks`, `Household`, `Personal Care`, `Other`.

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/receipts/upload` | Upload receipt image, run OCR, return parsed items |
| POST | `/api/receipts/confirm` | Save confirmed/corrected receipt data |
| GET | `/api/receipts` | List all receipts |
| GET | `/api/receipts/:id` | Get receipt with all line items |
| GET | `/api/products` | List products (supports `?category=`, `?search=`) |
| PUT | `/api/products/:id` | Update product name, category, tags |
| GET | `/api/shops` | List all shops |
| POST | `/api/shops` | Add a new shop |
| GET | `/api/analytics/summary` | Overall spending totals |
| GET | `/api/analytics/by-shop` | Spending and price comparison grouped by shop |
| GET | `/api/analytics/by-category` | Spending grouped by product category |
| GET | `/api/analytics/product/:id/compare` | Price history for one product across all shops |

All routes prefixed with `/api`. All responses use `{ data, error, meta }` envelope format.

---

## Database Schema

```sql
CREATE TABLE shops (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  location    VARCHAR(200),
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE products (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(200) NOT NULL,
  brand           VARCHAR(100),
  category        VARCHAR(50),
  tags            TEXT[],
  canonical_unit  VARCHAR(20) DEFAULT 'per_item',
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE receipts (
  id            SERIAL PRIMARY KEY,
  shop_id       INTEGER REFERENCES shops(id),
  scanned_at    TIMESTAMP,
  image_path    VARCHAR(500),
  raw_ocr_text  TEXT,
  total_amount  NUMERIC(10, 2),
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE price_records (
  id                        SERIAL PRIMARY KEY,
  receipt_id                INTEGER REFERENCES receipts(id) ON DELETE CASCADE,
  product_id                INTEGER REFERENCES products(id),
  shop_id                   INTEGER REFERENCES shops(id),
  raw_price                 NUMERIC(10, 2) NOT NULL,
  quantity                  NUMERIC(8, 3),
  weight_grams              NUMERIC(10, 3),
  unit_type                 VARCHAR(20) NOT NULL DEFAULT 'unknown',
  normalised_price_per_unit NUMERIC(10, 4),
  scanned_at                TIMESTAMP,
  created_at                TIMESTAMP DEFAULT NOW()
);
```

---

## Coding Standards Agents Must Follow

### JavaScript Style
- **JavaScript only** – no TypeScript.
- `async/await` everywhere. No `.then()` chains.
- Named exports for services, utils, models. Default exports for React components.
- `const` by default, `let` when reassignment is needed, never `var`.
- Descriptive variable names – avoid single letters except for loop indices.
- No inline SQL strings in controllers or routes – SQL belongs in model files.

### Error Handling (Backend)
```javascript
// Use a catchAsync wrapper in controllers:
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Central error handler in middleware/errorHandler.js catches all:
app.use(errorHandler);

// Always include context in errors:
throw new Error(`normalisationService: unknown unit type "${unitType}" for product "${productName}"`);
```

### Response Envelope (Backend)
```javascript
// Success:
res.json({ data: result, error: null, meta: { count: result.length } });

// Error (handled by errorHandler middleware):
res.status(400).json({ data: null, error: 'Receipt image is required', meta: {} });
```

### React Native Components
```javascript
// Always use StyleSheet.create() – not inline objects (except dynamic values):
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
});

// Functional components with hooks only – no class components:
const ProductRow = ({ product, normalised_price }) => { ... };

// Zustand store access in hooks or screens, not in leaf components:
const receipts = useReceiptStore((state) => state.receipts);
```

### OCR Service Pattern
```javascript
// ocrService.js – only responsible for running Tesseract, nothing else:
import Tesseract from 'tesseract.js';

export const runOCR = async (imagePath) => {
  const { data: { text } } = await Tesseract.recognize(imagePath, 'eng', {
    logger: (m) => logger.debug(m),
  });
  return text; // raw string only
};

// parserService.js – only responsible for interpreting OCR text:
export const parseReceiptText = (rawText) => {
  // Returns: Array<{ name, price, quantity, weightGrams, unit, confidence }>
};
```

---

## What Agents Should NOT Do

- ❌ Install or suggest any paid API integrations (no Google Vision, no AWS Textract, no OpenAI).
- ❌ Add TypeScript or convert files to `.ts`/`.tsx`.
- ❌ Add an ORM (no Sequelize, Prisma, TypeORM). Raw SQL with `pg` only.
- ❌ Add Redux. State management is Zustand.
- ❌ Skip the user review step for OCR output – data must never auto-save without review.
- ❌ Put SQL queries in controllers or route files.
- ❌ Put `res.json()` calls in services or models.
- ❌ Perform price normalisation outside of `normalisationService.js`.
- ❌ Add Docker configuration (home server runs processes directly via PM2).
- ❌ Use `require()` in frontend code – use ES module `import`.
- ❌ Create components that directly call `api.js` – that belongs in hooks.

---

## Running the Project

### Start Backend
```bash
cd backend
npm install
npm run dev        # nodemon server.js – watches for changes
```

### Start Frontend
```bash
cd frontend
npm install
npx expo start     # Opens Expo dev tools
```

### Database Setup
```bash
createdb -U postgres basketbud_db
psql -U postgres -c "CREATE USER basketbud WITH PASSWORD 'yourpassword';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE basketbud_db TO basketbud;"
for f in backend/migrations/*.sql; do
  psql -U basketbud -d basketbud_db -f "$f"
done
```

### Environment
Copy `.env.example` to `.env` in the `backend/` directory and fill in values before starting.

---

## Priorities for Any Agent Working on This Project

1. **Data quality first** – The OCR pipeline and user review flow are central. Never cut corners that would allow bad price data into the database.
2. **Normalisation accuracy** – Every price comparison depends on correct unit normalisation. If you're unsure about a unit type, flag it as `'unknown'` rather than guess.
3. **Keep it simple** – This is a solo developer project. Avoid over-engineering. Pragmatic solutions over architectural purity.
4. **No external dependencies that cost money** – Check before suggesting any library that has paid tiers or API limits.
5. **Respect the layer boundaries** – The route/controller/service/model separation exists to keep the codebase maintainable for one person over time.