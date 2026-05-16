# Basket-Bud — Product Requirements Document

**Version:** 1.0  
**Status:** MVP Definition  
**Author:** Solo Developer  
**Last Updated:** 2025

---

## 1. Overview

### 1.1 Product Summary

Basket-Bud is a personal grocery price tracking and comparison application. It allows a user to photograph supermarket receipts, automatically extract product and pricing data using OCR, and then compare the cost of specific products across multiple shops over time. The app presents this data through an analytics dashboard that gives clear, actionable insights into where money is best spent.

### 1.2 Problem Statement

Shoppers who regularly visit more than one supermarket have no practical tool to determine which store is genuinely cheaper for the specific products they buy. Promotional pricing, varying pack sizes, and price fluctuations across time make mental comparisons unreliable and exhausting. Existing budgeting apps track total spend but do not offer product-level, cross-shop price comparison grounded in a user's own shopping history. Basket-Bud fills this gap by turning receipts into a personal price intelligence database.

### 1.3 Solution

Basket-Bud combines receipt OCR, structured data storage, price normalisation logic, and visual analytics into a single self-hosted mobile application. The user photographs a receipt after every shop. Basket-Bud does the rest: parsing, categorising, normalising, and surfacing comparisons and trends without requiring any manual data entry or paid third-party services.

---

## 2. Goals and Success Metrics

### 2.1 Goals

- Enable the user to determine, for any product they regularly buy, which shop offers the best per-unit or per-weight price.
- Eliminate manual price tracking effort — a receipt scan should be the only required user action.
- Provide analytics that reveal spending patterns by shop, category, and product without needing external tools.
- Run entirely on a self-hosted home server with no recurring costs.

### 2.2 Success Metrics (MVP)

| Metric | Target |
|---|---|
| Receipt scan-to-data time | < 30 seconds from photo to stored records |
| OCR extraction accuracy | > 80% of line items correctly parsed without manual correction |
| Price comparison availability | Any product scanned from 2+ shops shows a comparison view |
| Dashboard load time | Analytics screen renders in < 2 seconds on local network |
| Setup complexity | Full stack running from clone in under 30 minutes |

---

## 3. Target Users

### Primary User

**Data-savvy general shopper** — an individual who:

- Shops at two or more supermarkets regularly (e.g., a budget store for staples, a higher-end store for fresh produce)
- Is comfortable with mobile apps and light technical setup
- Wants more than a budgeting app — they want product-level price intelligence
- Values understanding their own data and making decisions backed by evidence rather than gut feel
- Is building or using this for personal use; social or multi-user features are out of scope for the MVP

### User Needs

- A fast, low-friction way to log prices (photographing a receipt rather than typing)
- Confidence that price comparisons are fair (normalised to the same unit/weight)
- A dashboard that surfaces insights proactively rather than requiring manual data exploration
- Full data ownership — no cloud service holding their shopping history

---

## 4. MVP Feature Specifications

### 4.1 Receipt Photo Scanning and Data Extraction

**Description:** The user photographs a grocery receipt within the app. The image is uploaded to the Basket-Bud backend where Tesseract.js performs OCR. A parsing service then processes the raw text output to identify and extract individual line items including product name, quantity, unit type, and price paid.

**Functional Requirements:**

- The mobile app must provide an in-app camera interface for capturing receipt photos.
- The app must allow the user to select the shop name (from a stored list or by adding a new one) before or after scanning.
- The image must be uploaded to the Express backend via a multipart form POST request.
- The backend must process the image with Tesseract.js and return structured JSON containing extracted line items.
- The parsing layer must attempt to identify: product description, quantity purchased, unit (each/kg/g/l/ml), price per unit on receipt, and total line price.
- The user must be presented with the extracted results for review before saving, with the ability to edit or delete individual line items.
- On confirmation, all line items must be saved to PostgreSQL linked to the shop, date, and receipt record.

**Acceptance Criteria:**

- Photographing a standard UK supermarket receipt (Tesco, Sainsbury's, Lidl, Aldi) produces parseable output.
- At least 80% of line items are extracted without requiring manual correction in standard lighting conditions.
- The upload and OCR pipeline completes in under 30 seconds on a local network connection.

**Out of Scope (MVP):** Automatic shop detection from receipt header, cloud OCR fallback, PDF receipt support.

---

### 4.2 Product Categorisation and Tagging

**Description:** Each extracted product is assigned a category (e.g., Dairy, Bakery, Produce, Meat, Frozen, Household, Drinks) and optional free-form tags. This enables category-level analytics and filtered comparisons.

**Functional Requirements:**

- The system must maintain a predefined list of product categories.
- During the review step post-scan, each line item must display a suggested category (derived from keyword matching on the product name).
- The user must be able to override the suggested category from a dropdown.
- Products with the same name across different receipts must share a category once assigned (the category is stored on the product record, not the individual price record).
- Users must be able to edit product categories from a product management screen.
- Tags are free-form text fields that can be added to any product for personal organisation (e.g., "weekly staple", "brand preference").

**Acceptance Criteria:**

- At least 60% of common grocery items receive a correct auto-suggested category based on name keyword matching.
- Category assignment is persistable and immediately reflected in the dashboard.

---

### 4.3 Price-Per-Unit and Price-Per-Weight Normalisation

**Description:** To enable fair comparisons between different pack sizes and formats, Basket-Bud normalises all prices to a standard unit before comparison. This is the core logic that makes cross-shop price comparisons meaningful.

**Functional Requirements:**

- For weighted items (sold by kg or loose by weight), the system must calculate and store price per 100g.
- For liquid items (sold by litre or ml), the system must calculate and store price per 100ml.
- For countable items sold in multipacks, the system must calculate and store price per individual unit.
- The normalisation unit must be stored alongside the raw receipt price in the database.
- The normalised price must be the primary value used in all comparison views and analytics.
- Where the unit type cannot be determined from OCR output, the user must be prompted to specify it during the review step.

**Acceptance Criteria:**

- A 500g block of butter and a 250g block of butter from different shops are displayed with a per-100g price, making them directly comparable.
- A 6-pack of yoghurt and a single yoghurt are both displayed with a per-unit price.
- No comparison is shown without a confirmed unit type.

---

### 4.4 Multi-Shop Price Comparison

**Description:** For any product stored in Basket-Bud, the user can view a comparison of the normalised price for that product across all shops where it has been scanned, including price history over time.

**Functional Requirements:**

- A product detail screen must display the most recent normalised price for that product at each shop where it has been recorded.
- The screen must show a price history chart (line chart via Recharts rendered in a WebView or equivalent) for each shop over time.
- The cheapest current source must be highlighted visually.
- Product matching across shops must be based on product name string similarity (fuzzy match) with manual merge capability — the user can mark two differently-named products as the same item.
- The comparison view must display the date of the most recent price observation per shop, so the user knows if a price is stale.
- A "price difference" indicator must show the absolute and percentage cost difference between the cheapest and most expensive current source.

**Acceptance Criteria:**

- Scanning the same branded product from two different shops results in a populated comparison view.
- The cheapest shop is correctly identified based on normalised price.
- Price history displays correctly for products scanned on at least 3 separate occasions.

---

### 4.5 Spending Analytics Dashboard

**Description:** The dashboard provides an at-a-glance view of the user's grocery spending patterns, using all data stored in Basket-Bud. Charts and summaries break down spending by shop, category, and product, and surface trends over time.

**Functional Requirements:**

The dashboard must include the following panels:

1. **Monthly Spend by Shop** — a bar or line chart showing total spend per shop per calendar month over the past 12 months.
2. **Category Breakdown** — a pie or donut chart showing the proportion of total spend by product category for a selectable time period (last 30 days / 3 months / 6 months / all time).
3. **Top Products by Spend** — a ranked list of the top 10 products by total spend in the selected period, with the shop where each was most recently purchased.
4. **Shop Comparison Score** — a summary table showing, for products purchased from multiple shops, how often each shop was the cheapest option.
5. **Price Trend Alerts** — a list of products where the most recently scanned price is higher than the 3-scan rolling average, flagging potential price increases.

- All charts must be rendered using Recharts.
- The dashboard must be the default landing screen of the app.
- Date range filters must apply globally to all dashboard panels simultaneously.

**Acceptance Criteria:**

- Dashboard renders within 2 seconds on a local network with up to 500 stored receipt line items.
- All five panels are populated once at least 3 receipts from 2 different shops have been scanned.
- Changing the date range filter updates all charts without requiring a full page reload.

---

## 5. Technical Architecture

### 5.1 System Components

```
[React Native Mobile App]
        |
        | HTTP (local network)
        v
[Node.js / Express API Server]
        |              |
        v              v
[PostgreSQL DB]   [Tesseract.js OCR]
                       |
                  [Uploads folder]
                  (temp image store)
```

All components run on the user's home server. The mobile app communicates with the backend over the local Wi-Fi network.

### 5.2 Frontend — React Native

- **Language:** TypeScript
- **Navigation:** React Navigation (stack + bottom tab navigator)
- **State Management:** React Context + useReducer for global state; React Query for server state and caching
- **Charts:** Recharts rendered inside a React Native WebView component
- **Camera:** React Native Camera or Expo Camera for receipt capture
- **HTTP Client:** Axios

**Key Screens:**

| Screen | Purpose |
|---|---|
| Dashboard | Analytics overview — default home screen |
| Scan Receipt | Camera capture + shop selection |
| Review Extraction | Edit/confirm OCR output before saving |
| Products | Browse all tracked products, search, edit categories |
| Product Detail | Price comparison across shops + history chart |
| Shops | Manage shop list |

### 5.3 Backend — Node.js / Express

- **Language:** JavaScript (Node.js 18+)
- **Framework:** Express 4
- **OCR:** Tesseract.js (runs in Node.js worker thread to avoid blocking the event loop)
- **File Upload:** Multer (stores receipt images temporarily in `/uploads`)
- **Database Client:** node-postgres (`pg`)
- **Validation:** Joi or express-validator

**Key API Routes:**

| Method | Route | Description |
|---|---|---|
| POST | `/api/receipts/scan` | Upload receipt image, run OCR, return extracted line items |
| POST | `/api/receipts` | Save confirmed receipt and line items to database |
| GET | `/api/products` | List all products with latest prices |
| GET | `/api/products/:id/compare` | Price comparison data for a single product |
| GET | `/api/analytics/dashboard` | Aggregated analytics data for dashboard |
| GET | `/api/shops` | List all shops |
| POST | `/api/shops` | Add a new shop |

### 5.4 Database — PostgreSQL

**Core Tables:**

```sql
shops
  id, name, created_at

receipts
  id, shop_id, scanned_at, image_path, created_at

products
  id, name, category, tags, canonical_name, created_at

receipt_items
  id, receipt_id, product_id, raw_name, quantity, unit_type,
  raw_price, normalised_price, normalised_unit, created_at

product_merges
  id, primary_product_id, merged_product_id, created_at
```

### 5.5 Self-Hosting

- The backend and PostgreSQL are containerised with Docker Compose for easy deployment on a home server.
- The React Native app points to the home server's local IP address via an environment variable.
- No inbound internet exposure is required — the app is used only on the local network.
- Receipt images are stored in a local volume mounted into the Docker container; no cloud storage is used.

---

## 6. Non-Functional Requirements

| Requirement | Target |
|---|---|
| **Performance** | API responses under 500ms for all non-OCR endpoints on local network |
| **OCR Throughput** | Single receipt processed in under 30 seconds |
| **Data Ownership** | All data stored locally; no external API calls for core functionality |
| **Reliability** | App should function fully offline for browsing stored data; scanning requires server connection |
| **Maintainability** | Codebase structured to allow a single developer to add features without architectural changes |
| **Cost** | Zero ongoing running cost beyond home server electricity and hardware |

---

## 7. Constraints and Assumptions

### Constraints

- **No paid APIs:** Tesseract.js is used for all OCR. No Google Vision, AWS Textract, or similar services.
- **Solo developer:** Architecture and scope must be manageable by one person. Complexity is kept proportional to the value delivered.
- **Self-hosted only:** No cloud deployment, no managed database services, no CDN.
- **React Native without Expo managed workflow:** Full control over native modules is preferred for camera and file system access.

### Assumptions

- Receipts are printed (not handwritten) from standard UK supermarkets.
- The user has a home server capable of running Docker with at least 2GB RAM available for the stack.
- The mobile device and home server are on the same local Wi-Fi network during use.
- OCR output quality will vary; the review-before-save step is essential for data integrity.
- Product matching across shops is imperfect at MVP stage; manual merge is an acceptable workaround.

---

## 8. Out of Scope for MVP

The following are explicitly excluded from the initial MVP to keep scope manageable:

- Multi-user support / user authentication
- Cloud hosting or remote access outside the local network
- Barcode / QR code scanning for product identification
- Integration with any retailer's online pricing APIs
- Automated shopping list generation
- Push notifications or price alerts
- iOS support (Android first; iOS can follow once the core is stable)
- PDF or email receipt parsing
- Data export (CSV, PDF reports)
- Loyalty card or cashback tracking

---

## 9. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| OCR accuracy too low for practical use | Medium | High | Implement a robust review/edit UI so users can fix extraction errors before saving; improve parsing heuristics iteratively |
| Product name variations across shops make matching unreliable | High | Medium | Build manual product merge feature into MVP; apply fuzzy matching as a helper, not a guarantee |
| Tesseract.js performance causes poor UX | Medium | Medium | Run OCR in a worker thread; set user expectations with a progress indicator; consider image pre-processing (contrast boost, grayscale) |
| Scope creep on the analytics dashboard | Medium | Medium | Strictly limit MVP to the five defined panels; additional charts go on the roadmap |
| Home server downtime causes data loss | Low | High | Document regular PostgreSQL backup procedure; use Docker volumes for data persistence |

---

## 10. Revision History

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2025 | Initial MVP PRD created |