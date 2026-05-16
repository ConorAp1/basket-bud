# Contributing to Basket-Bud

Thank you for your interest in contributing to Basket-Bud! This document outlines how to contribute effectively to this project — a grocery receipt scanner and multi-shop price comparison tool built with React Native, Node.js/Express, PostgreSQL, and Tesseract.js.

> **Note:** Basket-Bud is currently a solo personal project. Contributions are welcome but will be reviewed carefully to ensure alignment with the project's goals and architecture.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Coding Standards](#coding-standards)
- [Submitting Changes](#submitting-changes)
- [Feature Areas](#feature-areas)
- [Reporting Bugs](#reporting-bugs)
- [Requesting Features](#requesting-features)

---

## Project Overview

Basket-Bud helps data-savvy shoppers determine which grocery store is genuinely cheaper for the specific products they buy. Core features include:

- **Receipt OCR scanning** using Tesseract.js to extract product names, quantities, weights, and prices
- **Price normalisation** (price-per-unit and price-per-weight) for accurate cross-shop comparisons
- **Product categorisation and tagging** by type and category
- **Multi-shop price comparison** for identical or similar products across different stores
- **Spending analytics dashboards** built with Recharts, showing breakdowns by category, shop, and product

The app is self-hosted on a home server with no paid API dependencies — keeping it entirely budget-friendly.

---

## Getting Started

### Prerequisites

Make sure you have the following installed:

- **Node.js** v18 or higher
- **npm** v9 or higher
- **PostgreSQL** v14 or higher
- **React Native CLI** (not Expo) with appropriate Android/iOS toolchain
- **Git**

### Fork and Clone

```bash
# Fork the repository via GitHub, then:
git clone https://github.com/YOUR_USERNAME/basket-bud.git
cd basket-bud
```

### Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### Environment Configuration

Copy the example environment file and fill in your local values:

```bash
cd backend
cp .env.example .env
```

Refer to `.env.example` for all required variables including database connection strings, OCR configuration, and server ports.

### Database Setup

```bash
# Create the database
createdb basket_bud_dev

# Run migrations
cd backend
npm run migrate

# Seed with sample data (optional)
npm run seed
```

### Start the Development Servers

```bash
# Backend (from /backend)
npm run dev

# Frontend (from /frontend, in a separate terminal)
npx react-native start

# Run on Android
npx react-native run-android

# Run on iOS
npx react-native run-ios
```

---

## How to Contribute

### 1. Check Existing Issues

Before starting work, check the [Issues](https://github.com/YOUR_USERNAME/basket-bud/issues) tab to see if your idea or bug is already being tracked. Comment on an issue to indicate you're working on it.

### 2. Create a Branch

Use descriptive branch names following this convention:

```
feature/ocr-receipt-parsing-improvements
fix/price-normalisation-weight-edge-case
chore/update-tesseract-dependency
docs/add-api-endpoint-documentation
```

```bash
git checkout -b feature/your-descriptive-branch-name
```

### 3. Make Your Changes

Keep commits small, focused, and well-described. Follow the coding standards below.

### 4. Test Your Changes

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

Ensure all existing tests pass before submitting. Add new tests for any new functionality, especially:
- OCR parsing logic in Tesseract.js integration
- Price-per-unit and price-per-weight normalisation calculations
- Database query functions for product and price lookups
- Analytics aggregation logic used by the dashboard

### 5. Submit a Pull Request

Push your branch and open a Pull Request against `main`. Fill in the PR template with:
- What the change does
- Which feature area it affects (OCR, price comparison, analytics, etc.)
- Screenshots or test output where relevant

---

## Coding Standards

### General

- Write clear, self-documenting code with descriptive variable and function names
- Prefer explicit over clever — Basket-Bud is a personal analytics tool; readability matters more than brevity
- Comment non-obvious logic, especially in the OCR text parsing and price normalisation modules

### Backend (Node.js / Express)

- Use `async/await` throughout — no raw Promise chains or callbacks
- Structure routes in `/routes`, business logic in `/services`, database queries in `/repositories`
- All database interactions must go through the repository layer — no raw SQL in route handlers
- Use parameterised queries for all PostgreSQL interactions to prevent SQL injection
- Validate all incoming request data with a validation middleware (e.g., `express-validator`) before it reaches the service layer
- Return consistent JSON error responses: `{ error: true, message: "...", code: "..." }`
- Log meaningful messages using the project logger — avoid raw `console.log` in production paths

### Frontend (React Native)

- Functional components only — no class components
- Use React hooks for state and side effects
- Keep components small and single-purpose; complex screens should be composed from smaller components
- Dashboard charts use Recharts — keep chart components isolated in `/components/charts/`
- Receipt scanning screens should handle camera permission states explicitly with user-facing messaging
- Navigation uses React Navigation — follow the existing stack/tab structure

### Database (PostgreSQL)

- All schema changes must be written as numbered migration files in `/backend/migrations/`
- Never edit existing migration files — always create a new one
- Table and column names use `snake_case`
- Every table must have `created_at` and `updated_at` timestamps
- Use appropriate indexes for columns used in price comparison queries (e.g., `product_name`, `shop_id`, `scanned_at`)

### OCR and Data Parsing

- Tesseract.js processing must be handled asynchronously and never block the main thread
- Receipt parsing logic lives in `/backend/services/ocrService.js` — keep it modular and testable
- Parsed results should always be validated before insertion (prices must be positive numbers, weights/quantities must be sensible values)
- Handle OCR confidence scores — flag low-confidence extractions for manual review rather than silently inserting bad data

---

## Feature Areas

When contributing, consider which area your change affects:

| Area | Description | Key Files |
|---|---|---|
| **OCR / Receipt Scanning** | Tesseract.js integration, image preprocessing, text extraction | `backend/services/ocrService.js` |
| **Price Normalisation** | Per-unit and per-weight price calculations | `backend/services/priceNormalisationService.js` |
| **Product Categorisation** | Tagging products by type and category | `backend/services/productCategoryService.js` |
| **Shop Comparison** | Multi-shop product price comparison queries | `backend/repositories/priceComparisonRepository.js` |
| **Analytics Dashboard** | Recharts visualisations, spending breakdowns | `frontend/components/charts/`, `backend/routes/analytics.js` |
| **Data Storage** | PostgreSQL schema, migrations, queries | `backend/migrations/`, `backend/repositories/` |

---

## Reporting Bugs

Open an issue with the label `bug` and include:

- **Steps to reproduce** — be specific (e.g., "Scanned a Tesco receipt with a weighted deli item priced per 100g; the price-per-weight normalisation returned NaN")
- **Expected behaviour**
- **Actual behaviour**
- **Environment** — OS, Node.js version, React Native version, PostgreSQL version
- **Relevant logs** — backend error output, OCR raw text output if applicable
- **Screenshots** — especially for UI or chart rendering issues

---

## Requesting Features

Open an issue with the label `enhancement`. Describe:

- The problem you're trying to solve (e.g., "I can't tell which shop is cheapest for produce when items are sold per-kg at one shop and per-item at another")
- Your proposed solution
- How it fits within Basket-Bud's goal of helping shoppers compare grocery costs accurately

Feature requests that align with the core analytics and price comparison mission will be prioritised.

---

## Code of Conduct

Be respectful, constructive, and patient. This is a personal project maintained by a solo developer. Response times may vary.

---

## Questions?

Open a GitHub Discussion or file an issue tagged `question`. Thanks for helping make Basket-Bud more useful for grocery shoppers who want real data about where their money goes!