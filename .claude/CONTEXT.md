# Basket-Bud — Claude Context File

## What This Project Is
Basket-Bud is a personal grocery intelligence app. The user photographs supermarket receipts, the app extracts the data using Tesseract.js OCR, normalises prices (price-per-unit, price-per-kg, etc.), and then presents an analytics dashboard showing which shops are cheapest for the products the user actually buys.

This is a solo-developer project, self-hosted on a home server, with zero budget for paid APIs or cloud services.

---

## Current Development Phase
**Phase:** Pre-development / Sprint 1 Planning
**Status:** Project is being set up. No production code exists yet.
**Next immediate step:** Scaffold the monorepo, set up the Express server, connect to PostgreSQL, and get Tesseract.js running a basic OCR test on a sample receipt image.

---

## How the App Works (End-to-End Flow)

### 1. Receipt Scanning
- User opens Basket-Bud on their phone (React Native app).
- User takes a photo of a grocery receipt or uploads one from their camera roll.
- The image is sent to the Express backend via a multipart/form-data POST request to `/api/receipts/scan`.
- The backend saves the image to `server/uploads/` and passes it to the Tesseract.js service.
- Tesseract.js runs in a Node.js worker thread and returns raw OCR text.

### 2. Receipt Parsing
- The raw OCR text goes through the receipt parser (`server/src/services/parser/`).
- The parser attempts to identify:
  - Shop name (matched against known shop names in the `shops` table)
  - Line items: product name, quantity, unit (g, kg, ml, l, each), and price
  - Receipt total and date
- Parsing uses regex patterns and heuristics — it will be imperfect and needs a manual review/correction UI.

### 3. Price Normalisation
- The normaliser service (`server/src/services/normaliser/`) converts all prices to a common unit:
  - Weight items → price per 100g or price per kg
  - Volume items → price per 100ml or price per litre
  - Quantity items → price per unit
- Normalised prices are stored in `receipt_items` and `price_history`.

### 4. Product Matching & Categorisation
- Products are matched to canonical product names in the `products` table.
- Fuzzy matching (e.g., `fuse-sort` or Levenshtein distance) handles OCR spelling variations.
- Products are tagged with a category (dairy, produce, bakery, meat, frozen, drinks, household, etc.).
- Users can manually correct product names and categories via the app.

### 5. Price Comparison
- The Compare screen fetches price history for a selected product across all shops.
- Displays price-per-unit over time per shop, highlighting the cheapest option.
- Allows filtering by date range, category, or specific products.

### 6. Analytics Dashboard
- Recharts-powered dashboard showing:
  - Total spend by shop (bar chart)
  - Spend by category over time (line or area chart)
  - Most purchased products (ranked list)
  - Biggest price differences across shops (table)
  - Monthly spend trend (line chart)

---

## API Endpoints (Planned)

### Receipts
- `POST /api/receipts/scan` — Upload image, trigger OCR, return parsed data for review
- `POST /api/receipts/confirm` — Save confirmed receipt data to database
- `GET /api/receipts` — List all receipts (paginated)
- `GET /api/receipts/:id` — Get receipt detail with all line items
- `DELETE /api/receipts/:id` — Remove a receipt and its items

### Products
- `GET /api/products` — List all canonical products
- `GET /api/products/:id` — Product detail with price history
- `PATCH /api/products/:id` — Update product name, category, unit type
- `GET /api/products/search?q=` — Fuzzy search products

### Shops
- `GET /api/shops` — List all shops
- `POST /api/shops` — Add a new shop
- `PATCH /api/shops/:id` — Update shop details

### Price Comparison
- `GET /api/compare?product_id=&shop_ids=` — Compare product price across shops
- `GET /api/compare/basket?product_ids=` — Compare a full basket across shops

### Analytics
- `GET /api/analytics/spend-by-shop?from=&to=` — Total spend per shop in date range
- `GET /api/analytics/spend-by-category?from=&to=` — Spend breakdown by category
- `GET /api/analytics/price-trends/:product_id` — Price trend for a product over time
- `GET /api/analytics/summary` — High-level stats for dashboard header

---

## Known Challenges & How to Handle Them

### OCR Accuracy
- Tesseract.js accuracy on receipts varies significantly by receipt quality and font.
- **Strategy:** Always show parsed results to the user before saving. Build a clean review/edit UI in Sprint 2. Store the raw OCR text alongside parsed data so it can be re-parsed if the parser improves.

### Product Name Variations
- "Semi Skimmed Milk 2L" (Tesco) vs "Semi-Skimmed Milk 2ltr" (Aldi) are the same product.
- **Strategy:** Build a canonical product matching system. Allow users to merge products. Use a `canonical_name` field in `products` table.

### Price Normalisation Edge Cases
- Multibuys: "3 for £5" — needs to extract per-item price.
- Weight-variable items: "Chicken Breast 0.456kg @ £5.49/kg" — parse the per-kg rate.
- **Strategy:** Handle common patterns first, flag unusual patterns for manual review.

### Recharts in React Native
- Recharts is a web library (SVG-based) and doesn't work natively in React Native.
- **Strategy:** Use `react-native-svg` + `victory-native` OR embed the dashboard in a `WebView` using React Native Web. Decide before Sprint 3. Document the decision.

---

## Environment Variables Needed
```
# Server
PORT=3001
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=basket_bud
DB_USER=basket_bud_user
DB_PASSWORD=your_secure_password_here

# File Storage
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=10

# OCR
TESSERACT_LANG=eng
TESSERACT_OEM=1
TESSERACT_PSM=6

# App
API_BASE_URL=http://192.168.1.x:3001/api
```

---

## Development Workflow
- Solo developer — no PRs or code review process needed.
- Commit frequently with descriptive messages.
- Use `docker-compose` to run PostgreSQL locally during development.
- Test OCR parsing with real receipt images saved in `server/test-receipts/` (gitignored).
- Migrations live in `server/src/db/migrations/` and are run manually with `node migrate.js`.

---

## Decisions Log
| Decision | Rationale |
|---|---|
| Tesseract.js over cloud OCR | Zero cost, self-hosted, no data privacy concerns with receipt data |
| PostgreSQL over SQLite | Better for relational queries needed by analytics; future-proof |
| Express over Fastify/Hono | Familiarity, large ecosystem, sufficient for solo personal project |
| Raw SQL over ORM | More control over analytics queries; avoids ORM overhead complexity |
| React Native over web-only | Enables camera access for receipt scanning on mobile |
| Self-hosted over cloud | Eliminates ongoing costs; receipt data stays private on home server |

---

## Things to Avoid
- Do NOT suggest paid OCR APIs (Google Vision, AWS Textract, Azure Form Recognizer).
- Do NOT introduce heavy ORMs like Sequelize or TypeORM without strong justification.
- Do NOT suggest cloud hosting solutions (Vercel, Railway, Heroku) — the app is self-hosted.
- Do NOT add features beyond the MVP list without explicitly being asked.
- Do NOT use web-only chart libraries directly in React Native components without a compatibility plan.