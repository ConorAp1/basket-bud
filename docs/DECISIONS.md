# Basket-Bud – Architecture & Design Decisions

A log of significant decisions made during development, with rationale.

---

## OCR Engine: Claude Vision over Tesseract.js

**Decision:** Replace Tesseract.js with Anthropic Claude Vision (`claude-sonnet-4-5`) for receipt OCR.

**Rationale:**
- Tesseract.js produced unreliable results on real supermarket receipts (poor font rendering, compressed print, angled photos).
- Claude Vision returns structured JSON directly — no regex parser required.
- Eliminates the `tessdata` download step and local language model management.
- API cost is acceptable for a solo, low-volume app (a few scans per week).

**Trade-off:** Requires `ANTHROPIC_API_KEY`; not fully offline. Accepted — the self-hosted constraint applies to infrastructure (no SaaS subscriptions), not API calls for AI processing.

---

## Deployment: Railway (backend) + Vercel (frontend)

**Decision:** Deploy backend on Railway, web frontend on Vercel, database on Railway PostgreSQL.

**Rationale:**
- Railway auto-detects Node.js, provisions PostgreSQL, and injects `DATABASE_URL` — zero config.
- Vercel auto-detects Next.js and deploys from `main` on push — zero config.
- Both have generous free tiers covering solo-dev usage.
- Railway internal networking (`postgres.railway.internal`) avoids egress charges between backend and DB.

**Trade-off:** Moves away from the original self-hosted home server intent. Kept as the primary deployment path because it unblocks testing the full stack without physical server setup. Home server remains viable by running `npm start` directly.

---

## Web Frontend: Next.js 15 App Router

**Decision:** Add a `frontend-web/` Next.js 15 App Router app alongside the existing React Native frontend.

**Rationale:**
- React Native (Expo) cannot be opened in a browser without significant Expo Web configuration.
- A separate Next.js app allows the full scan → review → save → compare → dashboard flow to be tested and demonstrated in any browser.
- Next.js 15 App Router gives server components, fast Vercel deploys, and TypeScript out of the box.
- `NEXT_PUBLIC_API_URL` env var points it at any backend (local or Railway).

**Trade-off:** Two frontends to maintain. Accepted — the React Native app is the primary mobile client; the web app is the browser/demo interface.

---

## Receipt Total: Calculate on Confirm, Not on Scan

**Decision:** Calculate `total_amount` in `confirmReceipt` by summing `rawPrice × quantity` for all saved items, rather than relying on a total line from OCR or a value sent by the frontend.

**Rationale:**
- The user may edit item prices/quantities during review; the OCR total would then be wrong.
- Sending total from frontend is redundant and error-prone.
- Deriving it server-side from the saved items is always consistent.

---

## Shop Detection: Extracted by Claude Vision

**Decision:** Update the Claude Vision system prompt to return `{ "shop": "...", "items": [...] }` instead of a bare array.

**Rationale:**
- The shop name is visible on every receipt header; Claude Vision reads it reliably.
- Pre-selecting the correct shop in the review UI removes a manual step for the user.
- The backend handles both response shapes (object with `shop`/`items`, or legacy bare array) for resilience.

---

## Database Connection: DATABASE_URL Takes Priority

**Decision:** `config/db.js` uses `DATABASE_URL` as `connectionString` when set, falling back to individual `DB_HOST/PORT/NAME/USER/PASSWORD` vars for local dev. SSL (`rejectUnauthorized: false`) applied when URL contains `'railway'`.

**Rationale:**
- Railway injects `DATABASE_URL` automatically for linked PostgreSQL services.
- Individual vars are still useful for local Docker Compose setups.
- The `'railway'` substring check covers both public proxy (`rlwy.net`) and internal (`railway.internal`) URLs.
