# Basket-Bud – Technical Design Document

## Overview

Basket-Bud is a self-hosted grocery receipt scanning and price comparison application. Users photograph receipts from multiple shops, extract product and pricing data via OCR, and then explore spending analytics through an interactive dashboard. The system normalises prices per unit and per weight to enable fair, apples-to-apples comparisons across stores.

This document describes the architecture, data models, API surface, and key technical decisions for the Basket-Bud MVP.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Native App                      │
│  (Camera / Receipt Scanner, Dashboard, Comparison View) │
└───────────────────────────┬─────────────────────────────┘
                            │ HTTP/REST (JSON)
                            ▼
┌─────────────────────────────────────────────────────────┐
│               Node.js + Express API Server               │
│  ┌──────────────┐  ┌────────────────┐  ┌─────────────┐ │
│  │ OCR Service  │  │ Price Normalise │  │  Analytics  │ │
│  │(Tesseract.js)│  │    Service     │  │   Service   │ │
│  └──────────────┘  └────────────────┘  └─────────────┘ │
└───────────────────────────┬─────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                    │
│         (Shops, Receipts, Products, Price Records)       │
└─────────────────────────────────────────────────────────┘

All components self-hosted on a home server (single machine or
small LAN setup). No external paid APIs.
```

### Deployment Topology

- **Home server** runs PostgreSQL, the Express API, and serves the React Native bundle (or acts as an API target for a locally run Expo dev build).
- No cloud dependencies; the app is accessible on the local network (and optionally via a Tailscale/WireGuard tunnel for mobile access away from home).

---

## Frontend – React Native

### Technology Choices

| Concern | Choice | Reason |
|---|---|---|
| Framework | React Native (Expo managed) | Cross-platform; Expo Camera API for receipt scanning |
| Navigation | React Navigation v6 | Industry standard, well-maintained |
| State management | Zustand | Lightweight; avoids Redux boilerplate for a solo project |
| Data fetching | TanStack Query (React Query) | Caching, background refresh, loading/error states |
| Charts | Recharts (via react-native-web wrapper or Victory Native) | Recharts is SVG-based; Victory Native is a safer choice for native targets |
| Styling | StyleSheet API + custom theme tokens | Keeps dependencies minimal |

> **Note on Recharts:** Recharts targets the web DOM. For the React Native screens, **Victory Native** is the practical equivalent (same declarative API style). Recharts can be used if a web dashboard view is added later via React Native Web.

### Screen Map

```
App
├── Onboarding / Home
├── Scanner
│   ├── CameraView          ← Expo Camera, triggers OCR
│   └── ReviewExtraction    ← Edit/confirm extracted line items
├── Library
│   ├── ProductList         ← All known products
│   └── ProductDetail       ← Price history across shops
├── Compare
│   └── ShopComparison      ← Side-by-side normalised prices
└── Analytics
    ├── SpendingDashboard   ← Category/shop/product breakdowns
    └── ShopSummary         ← Per-shop spend over time
```

### OCR Flow (Client Side)

1. User opens **CameraView** and photographs a receipt.
2. The image is captured as a base64 JPEG and sent to `POST /api/receipts/scan`.
3. The API processes the image with Tesseract.js and returns structured line items.
4. **ReviewExtraction** presents the parsed items; the user corrects errors before saving.
5. Confirmed data is posted to `POST /api/receipts`.

---

## Backend – Node.js + Express

### Project Structure

```
basket-bud-api/
├── src/
│   ├── app.js                  ← Express app setup, middleware
│   ├── server.js               ← Entry point, port binding
│   ├── config/
│   │   └── db.js               ← pg Pool configuration
│   ├── routes/
│   │   ├── receipts.js
│   │   ├── products.js
│   │   ├── shops.js
│   │   └── analytics.js
│   ├── controllers/
│   │   ├── receiptsController.js
│   │   ├── productsController.js
│   │   ├── shopsController.js
│   │   └── analyticsController.js
│   ├── services/
│   │   ├── ocrService.js       ← Tesseract.js worker management
│   │   ├── parserService.js    ← Raw OCR text → structured line items
│   │   ├── normalisationService.js ← Price-per-unit / price-per-weight
│   │   └── analyticsService.js ← Aggregation queries
│   ├── models/                 ← Query functions (no ORM)
│   │   ├── receipt.js
│   │   ├── product.js
│   │   ├── shop.js
│   │   └── priceRecord.js
│   └── middleware/
│       ├── errorHandler.js
│       └── upload.js           ← Multer config for image uploads
├── migrations/                 ← Raw SQL migration files
├── seeds/                      ← Dev seed data
├── .env
└── package.json
```

### OCR Service (Tesseract.js)

```js
// src/services/ocrService.js (outline)
import { createWorker } from 'tesseract.js';

let worker = null;

export async function getWorker() {
  if (!worker) {
    worker = await createWorker('eng');
  }
  return worker;
}

export async function extractTextFromImage(imageBuffer) {
  const w = await getWorker();
  const { data: { text } } = await w.recognize(imageBuffer);
  return text;
}
```

The worker is initialised once and reused across requests to avoid the expensive startup cost on every scan.

### Parser Service

Receipt OCR output is noisy. The parser applies a set of regex heuristics to identify:

- **Product name line** – alphabetic text, typically 10–60 characters
- **Price** – patterns like `£2.49`, `2.49`, `$3.00`
- **Quantity/weight qualifier** – patterns like `2x`, `500g`, `1.2kg`, `per kg`
- **Shop total / subtotal lines** – filtered out

The parser produces an array of `RawLineItem`:

```ts
interface RawLineItem {
  rawText: string;
  candidateName: string;
  candidatePrice: number | null;
  candidateQuantity: number | null;
  candidateUnit: 'item' | 'kg' | 'g' | 'l' | 'ml' | null;
  confidence: number; // 0–1, derived from Tesseract word confidence
}
```

These are returned to the client for human review before persistence.

### Normalisation Service

To compare prices fairly, every price record is normalised to a **base unit**:

| Unit type | Base unit | Example |
|---|---|---|
| Weight | price per 100g | 500g pack at £2.00 → £0.40/100g |
| Volume | price per 100ml | 1L bottle at £1.50 → £0.15/100ml |
| Count | price per single item | 6-pack at £3.00 → £0.50/item |

```js
// normalisationService.js
export function normalisePrice({ price, quantity, unit }) {
  switch (unit) {
    case 'kg':  return price / (quantity * 10);   // → per 100g
    case 'g':   return price / (quantity / 100);  // → per 100g
    case 'l':   return price / (quantity * 10);   // → per 100ml
    case 'ml':  return price / (quantity / 100);  // → per 100ml
    case 'item':
    default:    return price / quantity;           // → per single item
  }
}
```

Both the raw price and normalised price are stored so users can see either view.

---

## Database – PostgreSQL

### Schema

```sql
-- Shops known to the user
CREATE TABLE shops (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(100) NOT NULL UNIQUE,
  location     VARCHAR(200),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Individual receipt scan sessions
CREATE TABLE receipts (
  id           SERIAL PRIMARY KEY,
  shop_id      INTEGER REFERENCES shops(id) ON DELETE SET NULL,
  scanned_at   TIMESTAMPTZ DEFAULT NOW(),
  purchase_date DATE,
  raw_ocr_text TEXT,
  image_path   VARCHAR(500),
  total_amount NUMERIC(10,2)
);

-- Canonical product catalogue (deduplicated across shops)
CREATE TABLE products (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(300) NOT NULL,
  category     VARCHAR(100),           -- e.g. 'Dairy', 'Produce', 'Bakery'
  tags         TEXT[],                 -- e.g. ARRAY['organic','gluten-free']
  canonical_unit VARCHAR(20),          -- preferred comparison unit
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- One row per line item on a receipt
CREATE TABLE price_records (
  id                SERIAL PRIMARY KEY,
  receipt_id        INTEGER REFERENCES receipts(id) ON DELETE CASCADE,
  product_id        INTEGER REFERENCES products(id) ON DELETE SET NULL,
  shop_id           INTEGER REFERENCES shops(id) ON DELETE SET NULL,
  raw_name          VARCHAR(300) NOT NULL,   -- as it appeared on receipt
  price             NUMERIC(10,2) NOT NULL,
  quantity          NUMERIC(10,3),
  unit              VARCHAR(20),             -- 'g','kg','ml','l','item'
  normalised_price  NUMERIC(10,4),           -- price per base unit
  normalised_unit   VARCHAR(20),             -- '100g','100ml','item'
  purchase_date     DATE,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX idx_price_records_product_id  ON price_records(product_id);
CREATE INDEX idx_price_records_shop_id     ON price_records(shop_id);
CREATE INDEX idx_price_records_purchase_date ON price_records(purchase_date);
CREATE INDEX idx_receipts_shop_id          ON receipts(shop_id);
```

### Product Matching Strategy

Matching OCR-extracted names to canonical `products` rows is non-trivial. For MVP:

1. **Exact match** (case-insensitive) on `products.name`.
2. **Trigram similarity** using PostgreSQL `pg_trgm` extension (`similarity()` function) – threshold 0.4.
3. **No match** → create a new unmatched product candidate, presented to the user for manual linking or as a new product.

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_products_name_trgm ON products USING GIN (name gin_trgm_ops);
```

---

## API Endpoints

### Shops

| Method | Path | Description |
|---|---|---|
| GET | `/api/shops` | List all shops |
| POST | `/api/shops` | Create a shop |
| GET | `/api/shops/:id` | Get shop detail |
| PUT | `/api/shops/:id` | Update shop |

### Receipts

| Method | Path | Description |
|---|---|---|
| POST | `/api/receipts/scan` | Upload image, run OCR, return raw line items |
| POST | `/api/receipts` | Persist a confirmed receipt and its line items |
| GET | `/api/receipts` | List receipts (paginated, filterable by shop/date) |
| GET | `/api/receipts/:id` | Get receipt with all price records |
| DELETE | `/api/receipts/:id` | Delete receipt |

### Products

| Method | Path | Description |
|---|---|---|
| GET | `/api/products` | List products (search, filter by category/tag) |
| POST | `/api/products` | Create product |
| GET | `/api/products/:id` | Get product with price history |
| PUT | `/api/products/:id` | Update product (name, category, tags) |
| GET | `/api/products/:id/compare` | Price comparison across shops for this product |

### Analytics

| Method | Path | Description |
|---|---|---|
| GET | `/api/analytics/spend-by-category` | Total spend per category (date range filter) |
| GET | `/api/analytics/spend-by-shop` | Total spend per shop (date range filter) |
| GET | `/api/analytics/cheapest-shop` | Which shop wins on normalised price per product |
| GET | `/api/analytics/price-history/:productId` | Price over time per shop for a product |
| GET | `/api/analytics/savings-estimate` | Estimated savings if always buying from cheapest shop |

### Request / Response conventions

- All requests/responses use `application/json`.
- Image uploads to `/api/receipts/scan` use `multipart/form-data` (`image` field).
- Dates use ISO 8601 strings (`YYYY-MM-DD`).
- Errors return `{ error: string, detail?: string }` with appropriate HTTP status.
- Pagination via `?page=1&limit=20`.

---

## Analytics Dashboard Design

The analytics module answers the key question Basket-Bud was built to solve: *where is each product genuinely cheapest?*

### Queries powering dashboard widgets

**Spend by category (pie / bar chart)**
```sql
SELECT p.category, SUM(pr.price * COALESCE(pr.quantity, 1)) AS total_spend
FROM price_records pr
JOIN products p ON pr.product_id = p.id
WHERE pr.purchase_date BETWEEN $1 AND $2
GROUP BY p.category
ORDER BY total_spend DESC;
```

**Cheapest shop per product (normalised)**
```sql
SELECT
  p.id AS product_id,
  p.name AS product_name,
  s.name AS shop_name,
  MIN(pr.normalised_price) AS best_price,
  pr.normalised_unit
FROM price_records pr
JOIN products p ON pr.product_id = p.id
JOIN shops s ON pr.shop_id = s.id
WHERE pr.normalised_price IS NOT NULL
GROUP BY p.id, p.name, s.name, pr.normalised_unit
ORDER BY p.name, best_price;
```

**Savings estimate**
Compare what the user actually spent vs. what they would have spent buying every item from the cheapest available shop for that item over the same period.

---

## Security Considerations

Since Basket-Bud is self-hosted for personal use:

- The API does not implement multi-user auth in the MVP (single-user assumption).
- The server should be bound to `localhost` or the LAN interface, not exposed to the public internet.
- If remote access is needed, use a VPN (Tailscale recommended) rather than opening ports.
- Uploaded receipt images are stored in a local `uploads/` directory (not in the database) and should be excluded from public web serving.
- `.env` contains database credentials and must never be committed.

---

## Performance Notes

- Tesseract.js OCR takes 2–8 seconds per image on a home server CPU. This is acceptable for a personal-use app; the user sees a loading spinner during scan.
- PostgreSQL with indexes on `product_id`, `shop_id`, and `purchase_date` will handle the data volumes a single user generates (thousands of records) without issue.
- React Query caches dashboard responses on the client, avoiding redundant refetches while browsing.

---

## Future Considerations (Post-MVP)

- Barcode scanning to supplement/replace OCR for product identification.
- Product fuzzy matching improvements using a simple ML model or embedding similarity.
- Export to CSV/JSON for personal data portability.
- Web dashboard interface using Recharts (via React Native Web).
- Push notifications for price increases on tracked products.
- Shared household mode with basic auth.