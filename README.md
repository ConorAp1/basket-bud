# Basket-Bud 🛒

> Scan grocery receipts, track prices, and discover which shop is genuinely cheaper for the products you actually buy.

Basket-Bud is a personal grocery price intelligence app. Point your phone camera at any supermarket receipt, and Basket-Bud extracts every product with its price and quantity. Over time, it builds a detailed price history across all the shops you visit, normalises costs to a per-unit or per-weight basis, and surfaces clear analytics so you always know where to get the best deal.

---

## The Problem It Solves

Most shoppers visit several different supermarkets but have no reliable way to compare like-for-like prices across them. Special offers, different pack sizes, and price fluctuations make mental arithmetic almost impossible. Basket-Bud solves this by turning paper receipts into structured, comparable data — giving you a personal price database built entirely from your own shopping history.

---

## Live

| | |
|---|---|
| **Web app** | https://basket-bud-theta.vercel.app |
| **API** | https://basket-bud-production.up.railway.app |

---

## Features (MVP)

| Feature | Description |
|---|---|
| 📸 Receipt Scanning | Upload a receipt photo — Claude Vision extracts all products, prices, and the shop name automatically |
| 🏷️ Product Categorisation | Items are auto-categorised (dairy, produce, bakery, etc.) and editable before saving |
| ⚖️ Price Normalisation | Compare costs fairly using price-per-unit and price-per-100g/ml calculations |
| 🏪 Multi-Shop Comparison | Side-by-side price history for any product across every shop you've scanned |
| 📊 Analytics Dashboard | Visual breakdowns of spend by shop, category, and product over time |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Web Frontend | Next.js 15 (App Router), deployed on Vercel |
| Mobile Frontend | React Native (Expo) |
| Backend | Node.js + Express, deployed on Railway |
| Database | PostgreSQL (Railway managed) |
| OCR Engine | Claude Vision (Anthropic API) |
| Data Visualisation | Recharts (web) / react-native-svg (mobile) |

---

## Project Structure

```
basket-bud/
├── frontend/                   # React Native (Expo) app
│   ├── src/
│   │   ├── screens/            # HomeScreen, ScanReceiptScreen, CompareScreen, DashboardScreen
│   │   ├── components/         # ReceiptCard, ProductRow, ShopBadge, SpendingChart, ...
│   │   ├── navigation/         # AppNavigator (bottom tabs + stacks)
│   │   ├── services/api.js     # Axios API client
│   │   ├── hooks/              # useReceipts, useProducts, useAnalytics
│   │   ├── store/              # Zustand state stores
│   │   └── utils/              # formatCurrency, unitHelpers, normalise
│   ├── App.js
│   └── app.json                # Expo config
│
├── backend/                    # Node.js + Express API
│   ├── config/db.js            # PostgreSQL connection pool
│   ├── routes/                 # receipts, products, shops, analytics
│   ├── controllers/            # HTTP handlers (thin layer)
│   ├── services/               # ocrService, parserService, normalisationService, analyticsService
│   ├── models/                 # Receipt, Product, Shop, PriceRecord (raw SQL)
│   ├── middleware/             # upload (multer), errorHandler
│   ├── migrations/             # 001–004 SQL migrations + migrate.js runner
│   ├── uploads/receipts/       # Receipt image storage (gitignored)
│   └── server.js
│
├── docs/                       # Project documentation
├── docker-compose.yml          # PostgreSQL for development
├── .env.example
└── README.md
```

---

## Getting Started (Local Dev)

### Prerequisites

- Node.js 18+
- PostgreSQL 15+ (or use `docker compose up -d`)
- Anthropic API key (for receipt scanning)

### 1. Clone and configure

```bash
git clone https://github.com/ConorAp1/basket-bud.git
cd basket-bud
cp .env.example backend/.env
# Set: DATABASE_URL, ANTHROPIC_API_KEY, PORT=3001, FRONTEND_URL=http://localhost:3000
```

### 2. Database setup

```bash
docker compose up -d   # or use an existing PostgreSQL instance
cd backend && npm install
node migrations/migrate.js
```

### 3. Start backend

```bash
npm run dev   # http://localhost:3001
```

### 4. Start web frontend

```bash
cd ../frontend-web
npm install
# Create frontend-web/.env.local with: NEXT_PUBLIC_API_URL=http://localhost:3001/api
npm run dev   # http://localhost:3000
```

### 5. Mobile frontend (optional)

```bash
cd ../frontend && npm install && npx expo start
# Set EXPO_PUBLIC_API_BASE_URL to your backend address
```

---

## How It Works

1. **Scan** — Take a photo of any grocery receipt inside the app.
2. **Extract** — The image is sent to the backend where Tesseract.js parses the text and a service layer identifies product names, quantities, units, and prices.
3. **Normalise** — Prices are converted to a common unit (per item, per 100g, per litre) so different pack sizes can be compared directly.
4. **Store** — Extracted data is saved to PostgreSQL, linked to the shop and the date of the receipt.
5. **Compare** — Browse any product to see its price history across every shop you've scanned receipts from.
6. **Analyse** — The dashboard aggregates your data into charts: monthly spend per shop, category breakdowns, most price-volatile products, and your best/worst value stores.

---

## Roadmap

- [ ] Manual price entry (for shops where scanning is impractical)
- [ ] Barcode scanning to match products across shops reliably
- [ ] Price alert notifications when a tracked product drops below a threshold
- [ ] Export data to CSV for external analysis
- [ ] Shopping list builder that routes you to the cheapest shop per item

---

## Contributing

This project is currently built for personal use by a solo developer. Issues and suggestions are welcome via GitHub Issues.

---

## Licence

MIT