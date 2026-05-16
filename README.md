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
├── mobile/                     # React Native app
│   ├── src/
│   │   ├── screens/            # App screens (Home, Scan, Compare, Dashboard)
│   │   ├── components/         # Reusable UI components
│   │   ├── navigation/         # React Navigation setup
│   │   ├── api/                # API client functions
│   │   ├── hooks/              # Custom React hooks
│   │   └── utils/              # Helpers (formatting, normalisation)
│   ├── assets/                 # Images, fonts, icons
│   └── App.tsx
│
├── server/                     # Node.js + Express backend
│   ├── src/
│   │   ├── routes/             # Express route handlers
│   │   ├── controllers/        # Business logic
│   │   ├── services/           # OCR processing, price normalisation
│   │   ├── models/             # Database query functions
│   │   ├── middleware/         # Auth, error handling, validation
│   │   └── db/                 # PostgreSQL connection + migrations
│   ├── uploads/                # Temporary receipt image storage
│   └── index.js
│
├── docs/                       # Project documentation
│   └── PRD.md
│
├── docker-compose.yml          # Self-hosting configuration
├── .env.example
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- React Native development environment ([see RN docs](https://reactnative.dev/docs/environment-setup))
- Android emulator / physical device for testing

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/basket-bud.git
cd basket-bud
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
# Edit .env with your database credentials and server IP
```

### 3. Set Up the Database

```bash
cd server
npm install
npm run db:migrate
npm run db:seed      # optional: loads sample data
```

### 4. Start the Backend

```bash
cd server
npm run dev
# Server runs on http://localhost:3001
```

### 5. Start the Mobile App

```bash
cd mobile
npm install
npx react-native start
# In a separate terminal:
npx react-native run-android
```

### Self-Hosting on a Home Server

A `docker-compose.yml` is provided to run the backend and PostgreSQL together:

```bash
docker-compose up -d
```

Ensure your home server's local IP is set in the mobile app's `.env` so the React Native client can reach the API.

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