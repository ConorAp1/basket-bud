# Basket-Bud 🛒

> Scan grocery receipts, track prices, and discover which shop is genuinely cheaper for the products you actually buy.

Basket-Bud is a personal grocery price intelligence app. Point your phone camera at any supermarket receipt, and Basket-Bud extracts every product with its price and quantity. Over time, it builds a detailed price history across all the shops you visit, normalises costs to a per-unit or per-weight basis, and surfaces clear analytics so you always know where to get the best deal.

---

## The Problem It Solves

Most shoppers visit several different supermarkets but have no reliable way to compare like-for-like prices across them. Special offers, different pack sizes, and price fluctuations make mental arithmetic almost impossible. Basket-Bud solves this by turning paper receipts into structured, comparable data — giving you a personal price database built entirely from your own shopping history.

---

## Features (MVP)

| Feature | Description |
|---|---|
| 📸 Receipt Scanning | Photograph a receipt and extract all products, quantities, and prices automatically using Tesseract.js OCR |
| 🏷️ Product Categorisation | Tag products by type (dairy, produce, bakery, etc.) for grouped analysis |
| ⚖️ Price Normalisation | Compare costs fairly using price-per-unit and price-per-100g/ml calculations |
| 🏪 Multi-Shop Comparison | See side-by-side price histories for the same product across different stores |
| 📊 Analytics Dashboard | Visual breakdowns of spend by shop, category, and product over time |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React Native |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| OCR Engine | Tesseract.js |
| Data Visualisation | Recharts |
| Hosting | Self-hosted on home server |

No paid APIs. No subscriptions. Everything runs on your own hardware.

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

## Getting Started

### Prerequisites

- Node.js 18+
- Docker (for PostgreSQL) or a local PostgreSQL 15+ installation
- Expo Go app on your phone, or an Android/iOS emulator

### 1. Clone the Repository

```bash
git clone https://github.com/ConorAp1/basket-bud.git
cd basket-bud
```

### 2. Configure Environment Variables

```bash
# Copy the example and fill in your values
cp .env.example backend/.env
# Key values to set: DB_HOST, DB_NAME, DB_USER, DB_PASSWORD
```

### 3. Start the Database

```bash
docker compose up -d
```

### 4. Install Dependencies and Download OCR Data

```bash
cd backend
npm install
npm run setup:tessdata   # downloads eng.traineddata (~5MB) for offline OCR
node migrations/migrate.js
```

This creates the `shops`, `products`, `receipts`, and `price_records` tables and seeds common UK supermarkets.

### 5. Start the Backend

```bash
cd backend
npm run dev
# API available at http://localhost:3001
# Health check: GET http://localhost:3001/health
```

### 6. Start the Frontend

```bash
cd frontend
npm install
npx expo start
# Scan the QR code with Expo Go, or press 'a' for Android emulator
```

Set `EXPO_PUBLIC_API_BASE_URL` in your environment (or `frontend/.env`) to your backend address — use your machine's local network IP (e.g. `http://192.168.1.x:3001/api`) when running on a real phone.

### Self-Hosting on a Home Server

A `docker-compose.yml` is provided to run PostgreSQL. The backend runs as a Node.js process managed by PM2:

```bash
npm install -g pm2
cd backend && pm2 start server.js --name basket-bud-api
```

Ensure your home server's local IP is set as `EXPO_PUBLIC_API_BASE_URL` in the frontend config.

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