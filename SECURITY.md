# Security Policy — Basket-Bud

## Overview

Basket-Bud is a self-hosted grocery receipt scanning and price comparison application. It processes personal shopping data including receipt images, product prices, and spending patterns. While it is currently a personal-use project hosted on a home server, security is taken seriously — particularly around the handling of receipt data and database contents.

This document describes supported versions, how to report vulnerabilities, and the security practices in place within the application.

---

## Supported Versions

Basket-Bud follows a rolling release model as a solo personal project. Security fixes are applied to the latest version on the `main` branch only.

| Version | Supported |
|---|---|
| Latest (`main` branch) | ✅ Yes |
| Older tagged releases | ❌ No — please update to latest |

---

## Reporting a Vulnerability

If you discover a security vulnerability in Basket-Bud, please **do not open a public GitHub issue**. Instead:

1. **Email the maintainer directly** at the address listed in the repository's GitHub profile, with the subject line: `[SECURITY] Basket-Bud Vulnerability Report`
2. Include as much detail as possible (see below)
3. Allow up to **14 days** for an initial response and assessment
4. Please do not publicly disclose the vulnerability until a fix has been released or the maintainer has acknowledged the report and communicated a timeline

### What to Include in Your Report

- A clear description of the vulnerability
- The component affected (e.g., OCR image upload endpoint, price comparison API, PostgreSQL queries, authentication layer)
- Steps to reproduce the issue
- Potential impact (e.g., data exposure, SQL injection, unauthorised access to receipt data)
- Any suggested mitigations if you have them

---

## Security Architecture and Threat Model

Basket-Bud is self-hosted on a private home server and is **not intended to be exposed directly to the public internet without additional network-level protections** (e.g., a VPN or reverse proxy with authentication). The following describes the current security design:

### Data Handled

- **Receipt images** — photos of grocery receipts, uploaded from the React Native app to the backend
- **Extracted product data** — names, prices, quantities, weights, shop names, and scan timestamps
- **Spending analytics** — aggregated purchase history by category, shop, and product

All data is stored in a local PostgreSQL database on the home server. No data is sent to external services or third-party APIs.

### Authentication

- The backend API should be protected by token-based authentication before being accessed over any network
- The `.env` file must contain a strong, randomly generated `JWT_SECRET` — never use the placeholder value from `.env.example`
- Do not expose the backend port directly to the internet without authentication in place

### OCR Processing (Tesseract.js)

- Receipt images are processed locally using Tesseract.js — no image data is sent to external OCR services
- Uploaded images should be validated for file type and size before processing to prevent abuse of the OCR pipeline
- Processed images should be deleted from the server after extraction is complete unless explicitly retained

### Database Security

- All database queries use **parameterised statements** — raw string interpolation into SQL is not permitted anywhere in the codebase
- The PostgreSQL user configured in `.env` should have only the permissions required (SELECT, INSERT, UPDATE, DELETE on application tables) — do not use the PostgreSQL superuser account for the application
- Database should not be exposed outside localhost unless explicitly required, and then only over an encrypted connection

### Input Validation

- All API endpoints validate incoming data before processing
- Receipt parsing output from Tesseract.js is validated (price values, weight/quantity values) before database insertion — malformed or implausible values are flagged rather than silently stored
- Product names and categories are sanitised before storage

### Dependency Security

- Dependencies are managed via npm. Run `npm audit` regularly against both `/backend` and `/frontend` to identify known vulnerabilities
- Tesseract.js and other open-source dependencies should be kept up to date
- No paid or external API dependencies are used — the attack surface from third-party services is zero

---

## Self-Hosting Security Recommendations

If you are self-hosting Basket-Bud on a home server, follow these practices:

### Network

- **Do not expose the backend API port directly to the internet.** Use a VPN (e.g., WireGuard or Tailscale) to access the app remotely
- If you use a reverse proxy (e.g., Nginx), ensure it enforces HTTPS with a valid certificate (e.g., via Let's Encrypt with local DNS challenge)
- Restrict firewall rules to allow only necessary inbound connections

### Environment Variables

- Never commit your `.env` file to version control — it is listed in `.gitignore`
- Use a strong, unique `JWT_SECRET` (at least 64 random characters)
- Use a dedicated PostgreSQL user with minimal permissions for `DB_USER`
- Rotate secrets if you believe they have been exposed

### File System

- Ensure the directory used for temporary receipt image uploads (`UPLOAD_DIR`) is not web-accessible
- Set appropriate file system permissions on the server so the application process runs with least privilege

### Updates

- Keep the host OS, Node.js, PostgreSQL, and npm dependencies updated to receive security patches
- Monitor the GitHub repository for any security-related commits or advisories

---

## Known Limitations

- Basket-Bud does not currently implement rate limiting on the OCR upload endpoint — if you expose the API beyond your personal network, add rate limiting middleware (e.g., `express-rate-limit`)
- Multi-user support is not an MVP feature; the current auth model assumes a single trusted user. Do not share access credentials
- Receipt images may contain sensitive financial information — ensure your home server storage is encrypted at rest if possible

---

## Acknowledgements

Responsible disclosure is appreciated. If you report a valid security issue, you will be credited in the fix commit and changelog (unless you prefer to remain anonymous).

---

*Last updated: 2025*
*Maintainer: Basket-Bud solo developer*