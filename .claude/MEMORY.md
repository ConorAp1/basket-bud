# Basket-Bud — Claude Memory File

## Project Identity
- **Name:** Basket-Bud
- **Purpose:** Scan grocery receipts to extract and store product prices by quantity or weight, then compare costs across multiple shops with detailed analytics dashboards.
- **Developer:** Solo developer, personal use initially, with potential to share.
- **Hosting:** Self-hosted on a home server (no cloud costs, no paid APIs).

## Core Problem Being Solved
Shoppers who use multiple stores (e.g., Tesco, Aldi, Lidl, Sainsbury's) cannot easily determine which shop is genuinely cheaper for the *specific products they actually buy*. Basket-Bud solves this by extracting real receipt data and normalising prices for accurate like-for-like comparisons.

## Target Users
Data-savvy general shoppers who enjoy analytics and want actionable, data-driven insights into their grocery spending across multiple shops.

## MVP Feature Set (Do Not Scope-Creep Beyond These)
1. **Receipt OCR Scanning** — Photo upload → Tesseract.js extracts line items, prices, quantities, shop name, and date.
2. **Product Categorisation & Tagging** — Products tagged by type (e.g., dairy, produce, bakery) and category.
3. **Price Normalisation** — Price-per-unit and price-per-weight calculated for accurate cross-shop comparisons.
4. **Multi-Shop Price Comparison** — Side-by-side comparison of the same product across different stores.
5. **Spending Analytics Dashboard** — Recharts-powered breakdowns by category, shop, and product over time.

## Tech Stack (Locked In)
| Layer | Technology |
|---|---|
| Frontend | React Native |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| OCR | Tesseract.js (open-source, no API cost) |
| Data Viz | Recharts |
| Hosting | Self-hosted home server |

## Key Constraints to Always Respect
- **No paid APIs** — Tesseract.js only for OCR, no Google Vision, AWS Textract, etc.
- **Solo developer** — Keep complexity manageable; avoid over-engineering.
- **Self-hosted** — Solutions must work without cloud dependencies; Docker-friendly preferred.
- **Budget-friendly** — No subscriptions, no SaaS dependencies for core functionality.

## Architecture Decisions (Agreed)
- REST API between React Native frontend and Express backend.
- PostgreSQL accessed via `pg` (node-postgres) directly or with a lightweight query builder (e.g., `slonik` or raw SQL — no heavy ORMs like Sequelize unless needed).
- Tesseract.js runs on the backend (Node.js worker threads) to avoid bundling it into the mobile app.
- Receipt images stored locally on the home server filesystem (not in PostgreSQL as blobs).
- Recharts used inside a React Native Web-compatible wrapper or via a dedicated web dashboard view.

## Folder Structure
```
basket-bud/
├── .claude/
│   ├── MEMORY.md
│   └── CONTEXT.md
├── docs/
│   └── plan.md
├── client/                  # React Native app
│   ├── src/
│   │   ├── components/
│   │   ├── screens/
│   │   │   ├── Dashboard/
│   │   │   ├── Receipts/
│   │   │   ├── Compare/
│   │   │   └── Settings/
│   │   ├── hooks/
│   │   ├── services/        # API calls to backend
│   │   ├── store/           # State management (Zustand preferred)
│   │   ├── utils/
│   │   └── navigation/
│   ├── App.tsx
│   └── package.json
├── server/                  # Node.js + Express backend
│   ├── src/
│   │   ├── routes/
│   │   │   ├── receipts.js
│   │   │   ├── products.js
│   │   │   ├── shops.js
│   │   │   └── analytics.js
│   │   ├── controllers/
│   │   ├── services/
│   │   │   ├── ocr/         # Tesseract.js integration
│   │   │   ├── parser/      # Receipt text parsing logic
│   │   │   └── normaliser/  # Price-per-unit/weight logic
│   │   ├── db/
│   │   │   ├── migrations/
│   │   │   └── queries/
│   │   ├── middleware/
│   │   └── utils/
│   ├── uploads/             # Receipt images stored here
│   ├── app.js
│   └── package.json
├── database/
│   ├── schema.sql
│   └── seed.sql
├── docker-compose.yml
└── README.md
```

## Database Schema (Core Tables)
- `shops` — id, name, location, created_at
- `receipts` — id, shop_id, scanned_at, image_path, raw_ocr_text, total_amount
- `products` — id, name, canonical_name, category, unit_type (weight/quantity/volume)
- `receipt_items` — id, receipt_id, product_id, raw_name, quantity, unit, total_price, price_per_unit
- `price_history` — id, product_id, shop_id, price_per_unit, recorded_at

## Naming Conventions
- **Files:** camelCase for JS/TS files, kebab-case for directories.
- **Database:** snake_case for all table and column names.
- **API routes:** RESTful, kebab-case paths (e.g., `/api/receipt-items`).
- **React components:** PascalCase.
- **Variables/functions:** camelCase.

## What Claude Should Remember
- Always suggest Tesseract.js solutions — never recommend paid OCR alternatives.
- Price normalisation logic is a core differentiator — treat it carefully.
- The receipt parser will be imperfect; build with manual correction in mind from the start.
- Recharts is for the analytics dashboard — always suggest Recharts for new chart components.
- The app is React Native — be careful recommending web-only libraries.
- Keep backend logic modular so the parser and normaliser can be improved iteratively.