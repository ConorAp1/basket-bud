# Basket-Bud — Research & Discovery Document

## 1. Problem Statement

Shoppers who regularly use multiple supermarkets and grocery stores have no reliable, personalised way to determine which shop is genuinely cheaper **for the specific products they actually buy**. General price comparison websites exist but they:

- Compare prices in the abstract, not based on the user's real purchase history
- Do not account for quantity or weight differences (a 400g tin vs a 500g tin)
- Are typically sponsored or commercially biased
- Don't track prices over time from real receipts

**Basket-Bud** solves this by letting users scan their own receipts, extract real prices they actually paid, normalise them by unit or weight for fair comparison, and visualise spending patterns across shops with full transparency.

---

## 2. Target Users

### Primary User: Data-Savvy General Shoppers

These are everyday shoppers who:
- Regularly shop at 2–4 different supermarkets (e.g., a large Tesco for staples, Aldi for value items, a local Co-op for top-ups)
- Are interested in understanding and optimising their grocery spending
- Are comfortable with technology and appreciate data-driven insights
- Feel frustrated by the inability to answer the question: "Am I actually saving money by going to Aldi?"

### User Goals
1. Know, with confidence, which shop offers the best value for each product they buy
2. Understand where their grocery money goes (by shop, category, time period)
3. Identify products where switching shop would save meaningful money
4. Track price changes over time for staple products

### User Pain Points
- Mentally comparing prices across shops is cognitively exhausting and error-prone
- Packaging sizes differ, making unit price comparisons non-trivial
- Generic "cheapest supermarket" rankings online don't reflect personal shopping baskets
- Receipts are paper-based and discarded, losing valuable price history

---

## 3. Existing Solutions & Competitive Landscape

### 3.1 Online Price Comparison Tools

| Tool | Strengths | Weaknesses Relevant to Basket-Bud |
|---|---|---|
| mysupermarket.co.uk (defunct) | Cross-shop basket comparison | Required manual product entry; no receipt scanning |
| Which? Cheapest Supermarket | Research-backed analysis | Basket is fixed/generic, not personalised |
| Trolley.co.uk | Real-time price lookup | No receipt scanning, no history, no analytics |
| Google Shopping | Product price comparison | Not grocery-focused; no receipt scanning |

**Gap identified**: None of these tools use the user's own purchase history from scanned receipts to generate personalised insights.

### 3.2 Expense Tracking Apps

| App | Strengths | Weaknesses |
|---|---|---|
| Emma / Monzo | Automatic transaction categorisation | Sees totals only, not individual product prices |
| Splitwise | Good for shared bills | Not grocery/product focused |
| Grocery (iOS app) | Shopping list management | No price history or comparison |

**Gap identified**: Expense trackers work at the transaction level (total spend per shop visit), not the product-price level.

### 3.3 Receipt Scanning Apps

| App | Strengths | Weaknesses |
|---|---|---|
| Fetch Rewards | Receipt scanning for points | US-focused; rewards model, not analytics |
| Receiptify / Expensify | Receipt capture and storage | Business expense focus; no grocery price comparison |
| Huji / Shoeboxed | Digital receipt filing | Filing only; no price extraction or comparison |

**Gap identified**: No receipt scanning app is focused on extracting grocery product prices specifically for cross-shop price comparison.

### 3.4 Conclusion
There is a clear gap in the market for a **personal, receipt-based grocery price comparison tool with analytics**. Basket-Bud fills this gap by combining receipt OCR, price normalisation, and a comparison/analytics dashboard tailored to the real shopping habits of the user.

---

## 4. OCR Technology Research

### 4.1 Why OCR for Receipts?

Grocery receipts are printed documents with consistent structure (product name, quantity, price). OCR (Optical Character Recognition) can extract this text from a photo, eliminating the need for manual data entry — the biggest friction point for any personal finance tracking tool.

### 4.2 OCR Options Evaluated

#### Tesseract.js (Selected)
- **Type**: Open-source, runs entirely in JavaScript (Node.js or browser)
- **Cost**: Free
- **Privacy**: All processing is local — receipt images never leave the home server
- **Accuracy**: Good for printed text on clean backgrounds; acceptable for most supermarket receipts
- **Self-hosting**: Fully compatible with a Node.js backend on a home server
- **Limitations**: Accuracy degrades with crumpled, low-light, or skewed receipts; requires image preprocessing

#### Google Cloud Vision API
- **Type**: Cloud-based, paid
- **Cost**: $1.50 per 1,000 images after free tier
- **Accuracy**: Excellent for receipts — handles rotation, poor lighting, noise
- **Verdict**: Ruled out — paid API, violates budget constraint; also sends private receipt data to Google

#### AWS Textract
- **Type**: Cloud-based, paid
- **Cost**: $1.50 per 1,000 pages for basic detection
- **Accuracy**: Very high; purpose-built for structured document extraction
- **Verdict**: Ruled out — same reasons as Cloud Vision

#### Azure Cognitive Services (Read API)
- **Type**: Cloud-based, paid
- **Verdict**: Ruled out — paid; no self-hosting option

#### EasyOCR (Python-based)
- **Type**: Open-source Python library
- **Accuracy**: Generally better than Tesseract for complex layouts
- **Verdict**: Incompatible with the Node.js tech stack without a microservice wrapper; adds complexity for a solo developer

### 4.3 Tesseract.js Implementation Strategy

To maximise OCR accuracy with Tesseract.js:

1. **Image Preprocessing with Sharp**
   - Convert to greyscale
   - Increase contrast (sharpen edges between text and background)
   - Deskew/rotate to correct for camera angle
   - Resize to optimal resolution (ideally 300 DPI equivalent)

2. **Receipt Parsing Strategy**
   - Receipts follow a predictable line-by-line structure
   - Use regex patterns to identify product lines: `PRODUCT NAME ... £X.XX`
   - Common patterns to detect:
     - Weight-priced items: `0.456 kg @ £X.XX/kg`
     - Multi-buy offers: `2 for £X.XX`
     - Reduced items: `WAS £X.XX NOW £X.XX`
   - Build a parser with configurable patterns per known supermarket format

3. **Fallback / Manual Correction**
   - Provide a confirmation screen after OCR where users can correct misread items
   - This also doubles as a training data source for improving parser logic over time

4. **Known Supermarket Receipt Formats to Support (MVP)**
   - Tesco
   - Sainsbury's
   - Aldi
   - Lidl
   - Asda

---

## 5. Price Normalisation Research

### 5.1 The Problem with Raw Prices

Comparing raw prices is misleading:
- Tesco sells baked beans in a 400g tin for £0.55
- Heinz sells baked beans in a 415g tin for £0.90
- Without normalisation, Tesco looks cheaper — but per-100g, Tesco is £0.138 and Heinz is £0.217, so Tesco is still cheaper but for the right reason

Basket-Bud must normalise prices before comparison.

### 5.2 Normalisation Approaches

#### Price Per Unit
- For items sold by count (e.g., eggs, tins, bottles, packets)
- Formula: `total_price / quantity`
- Example: 12 eggs for £1.89 → £0.158 per egg

#### Price Per Weight (per 100g)
- For items sold by weight (loose or packaged)
- Formula: `(total_price / weight_in_grams) * 100`
- Example: 500g pasta for £0.89 → £0.178 per 100g
- All weight-based items normalised to per-100g for consistency

#### Price Per Volume (per 100ml)
- For liquids (milk, juice, oil, cleaning products)
- Formula: `(total_price / volume_in_ml) * 100`
- Example: 2-litre milk for £1.25 → £0.0625 per 100ml

### 5.3 Data Storage Strategy
Store the following for each receipt line item in PostgreSQL:
- `raw_price_pence` (INTEGER) — actual price paid
- `quantity` (DECIMAL) — number of units, grams, or ml
- `unit_type` (ENUM: 'unit', 'gram', 'ml')
- `normalised_price_pence` (INTEGER) — price per unit / per 100g / per 100ml
- `normalised_unit` (VARCHAR) — 'per_unit', 'per_100g', 'per_100ml'

Storing prices in **pence as integers** avoids floating-point arithmetic errors entirely.

---

## 6. Data Visualisation Research

### 6.1 Recharts Compatibility with React Native

Recharts is a React-based charting library built for the web (React DOM). It is **not natively compatible with React Native**. Options evaluated:

#### Option A: React Native WebView with Recharts (Selected for MVP)
- Render Recharts charts inside a WebView in the React Native app
- Pros: Use Recharts as intended; rich chart options; minimal extra learning
- Cons: Slight performance overhead; less native feel

#### Option B: Victory Native
- A React Native-compatible charting library from Formidable
- Pros: Native rendering; good performance
- Cons: Not Recharts — different API; extra library to learn

#### Option C: react-native-chart-kit
- Lightweight charting for React Native
- Pros: Simple; lightweight
- Cons: Limited chart types; less suitable for detailed analytics

**Decision**: Use Recharts inside a WebView for MVP to keep the tech stack consistent and leverage Recharts' rich feature set. Can migrate to a native solution post-MVP if performance is a concern.

### 6.2 Analytics Dashboard — Planned Chart Types

| View | Chart Type | Data Shown |
|---|---|---|
| Spending by Shop | Bar chart | Total spend per shop over selected period |
| Spending by Category | Pie / Donut chart | % breakdown by category (Dairy, Produce, etc.) |
| Price History for Product | Line chart | Price trend for a specific product across time |
| Shop Comparison for Product | Grouped bar chart | Price per 100g/unit for same product across shops |
| Weekly Spend Trend | Area chart | Total weekly grocery spend over time |
| Best Value Shop by Category | Horizontal bar chart | Cheapest shop per category based on user's purchases |

---

## 7. Technical Infrastructure Research

### 7.1 Self-Hosting on Home Server

Basket-Bud is designed to run entirely on a home server, with no cloud dependencies.

**Recommended Setup:**
- **Hardware**: Raspberry Pi 4 (4GB RAM) or repurposed PC/NUC
- **OS**: Ubuntu Server 22.04 LTS
- **Containerisation**: Docker + Docker Compose for service isolation
- **Reverse Proxy**: Nginx to route traffic to backend API and serve any web assets
- **Database**: PostgreSQL running in a Docker container with a persistent volume
- **Process Manager**: Docker Compose (for home server); PM2 as alternative if running without Docker
- **Local Network Access**: Access via local IP (e.g., `192.168.1.100:3000`) from devices on the same Wi-Fi

**Security Considerations:**
- Do NOT expose the home server to the public internet without proper security (VPN, firewall)
- Use environment variables for all secrets — never hardcode
- Receipt images are temporary — delete after OCR processing to conserve storage
- Implement basic request rate limiting on the Express API

### 7.2 Mobile App Connectivity

The React Native app communicates with the home server backend over the local network:
- Development: Use the dev machine's local IP address in API config
- Production: Use the home server's static local IP
- Consider a simple `.env` config in the mobile app to switch between dev and production API base URLs

### 7.3 Database — PostgreSQL Schema (Initial Design)

**Key Tables:**

```sql
-- Shops (e.g., "Tesco Kirkstall", "Aldi City Centre")
CREATE TABLE shops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    chain VARCHAR(100),         -- e.g., "Tesco", "Aldi"
    location VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product catalogue (canonical product definitions)
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,   -- e.g., "Dairy", "Produce"
    tags TEXT[],                       -- e.g., ["organic", "own-brand"]
    default_unit_type VARCHAR(20),     -- 'unit', 'gram', 'ml'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scanned receipts
CREATE TABLE receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_id UUID REFERENCES shops(id),
    scanned_at TIMESTAMPTZ DEFAULT NOW(),
    purchase_date DATE NOT NULL,
    raw_ocr_text TEXT,                -- stored for debugging, cleared later
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual line items extracted from receipts
CREATE TABLE receipt_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_id UUID REFERENCES receipts(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    raw_name VARCHAR(255),             -- as read by OCR, before matching
    raw_price_pence INTEGER NOT NULL,  -- actual price paid, in pence
    quantity DECIMAL(10, 3),           -- number of units, grams, or ml
    unit_type VARCHAR(20),             -- 'unit', 'gram', 'ml'
    normalised_price_pence INTEGER,    -- price per unit / per 100g / per 100ml
    normalised_unit VARCHAR(20),       -- 'per_unit', 'per_100g', 'per_100ml'
    is_manually_corrected BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 8. OCR Parser Research — Supermarket Receipt Formats

### 8.1 Common Receipt Structures

Research into UK supermarket receipt formats reveals consistent patterns:

**Tesco:**
```
BAKED BEANS 4PK           1.00
SEMI SKIM MILK 2L         1.15
CHEDDAR 400G              2.50
  0.400 kg @ £6.25/kg     2.50
```

**Aldi:**
```
BAKED BEANS               0.29
MILK 2LT                  0.89
MATURE CHEDDAR            1.99
```

**Lidl:**
```
Baked Beans 4x400g        0.79
Semi Skimmed Milk 2l      0.95
```

**Sainsbury's:**
```
Heinz Baked Beans 4x415g 1.75
Sainsbury's Semi Skim 2L  1.15
SO Org Cheddar 300g       2.75
```

### 8.2 Parsing Challenges & Mitigations

| Challenge | Mitigation |
|---|---|
| OCR misreads `0` as `O` or `l` as `1` | Post-processing regex to fix common substitutions in price fields |
| Product name truncation on receipt | Accept partial names; use fuzzy matching to existing product catalogue |
| Multi-buy deals (3 for £2) | Detect pattern; store per-unit calculated price |
| Weight-priced items (kg @ price/kg) | Detect `@` pattern; extract weight and per-kg price; calculate total and normalise |
| Discount lines appearing between items | Filter lines that start with `-` or contain `DISCOUNT`, `SAVE`, `OFFER` |
| VAT / loyalty lines at bottom | Stop parsing at `TOTAL` or `SUBTOTAL` line |
| Different encoding of £ symbol | Normalise currency symbol detection; handle `GBP`, `£`, and misread variants |

### 8.3 Confidence Scoring

Each extracted receipt item should carry an OCR confidence score. Items below a threshold (e.g., 70% confidence) should be flagged for manual review in the confirmation screen, rather than silently accepted.

---

## 9. Product Categorisation Research

### 9.1 Category Taxonomy

For MVP, the following top-level categories are sufficient:

| Category | Examples |
|---|---|
| Dairy & Eggs | Milk, cheese, yoghurt, butter, eggs |
| Bakery | Bread, rolls, pastries, crumpets |
| Meat & Fish | Chicken, beef, salmon, sausages |
| Fruit & Vegetables | All fresh produce |
| Frozen | Frozen veg, ice cream, ready meals |
| Tins & Jars | Baked beans, tinned tomatoes, pasta sauce |
| Dry & Pasta | Pasta, rice, cereals, flour |
| Drinks | Juice, squash, fizzy drinks, water |
| Household | Cleaning products, kitchen roll, bin bags |
| Health & Beauty | Toiletries, medicine |
| Snacks & Confectionery | Crisps, biscuits, chocolate |
| Ready Meals | Chilled prepared meals |

### 9.2 Automatic Categorisation Strategy

For MVP, implement keyword-based categorisation:
- Maintain a dictionary mapping keywords found in product names to categories
- Example: if product name contains `milk`, `cheese`, `yoghurt` → `Dairy & Eggs`
- Fallback: `Uncategorised` — user can manually assign category
- Future: train a simple classification model on accumulated data

---

## 10. Key Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Tesseract.js OCR accuracy too low for useful parsing | Medium | High | Image preprocessing with Sharp; manual correction UI; store raw OCR for debugging |
| Receipt formats too varied to parse reliably | Medium | High | Build per-chain parsers; start with 3 chains for MVP; user correction loop |
| Product matching (same item, different name per shop) | High | Medium | Fuzzy string matching; user confirmation; build canonical product catalogue over time |
| Home server downtime breaks app | Low | Medium | Offline-capable local storage in React Native; sync when server available |
| Performance issues running OCR on Raspberry Pi | Medium | Medium | Benchmark early; queue OCR jobs; consider async processing |
| Solo developer scope creep | High | Medium | Strict MVP scope; phased feature roadmap; keep initial use case personal |

---

## 11. References & Resources

- [Tesseract.js Documentation](https://tesseract.projectnaptha.com/)
- [Sharp (image preprocessing)](https://sharp.pixelplumbing.com/)
- [Recharts Documentation](https://recharts.org/en-US/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [React Navigation](https://reactnavigation.org/)
- [UK Supermarket Receipt Format Analysis — community OCR projects on GitHub]
- [Which? Supermarket Price Comparison Research](https://www.which.co.uk/reviews/supermarkets)
- [Zod Schema Validation](https://zod.dev/)
- [Winston Logger for Node.js](https://github.com/winstonjs/winston)
- [Docker Compose for self-hosting](https://docs.docker.com/compose/)