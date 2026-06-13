require('dotenv').config();
require('express-async-errors');

// Prevent worker-thread errors (e.g. Tesseract network failures) from crashing the process.
process.on('unhandledRejection', (err) => {
  const logger = require('./utils/logger');
  logger.error('Unhandled promise rejection', { message: err?.message });
});
process.on('uncaughtException', (err) => {
  const logger = require('./utils/logger');
  logger.error('Uncaught exception', { message: err?.message, stack: err?.stack });
});

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const receiptsRouter = require('./routes/receipts');
const productsRouter = require('./routes/products');
const shopsRouter = require('./routes/shops');
const analyticsRouter = require('./routes/analytics');

const app = express();
const PORT = process.env.PORT || 3001;

// Ensure upload directory exists
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, 'uploads', 'receipts');
fs.mkdirSync(uploadDir, { recursive: true });

app.use(helmet());
// CORS allow-list, in order:
//  1. Any origins explicitly listed in FRONTEND_URL (comma-separated).
//  2. This project's own Vercel deployments — production (basket-bud-theta...)
//     and per-commit previews (basket-bud-*.vercel.app). Always allowed so the
//     hosted web app works with no extra Railway config.
//  3. Any *.vercel.app origin, if ALLOW_VERCEL_PREVIEWS=true (broader opt-in).
//  4. localhost, outside production, for local dev.
const allowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((s) => s.trim().replace(/\/$/, ''))
  .filter(Boolean);
const allowAllVercel = process.env.ALLOW_VERCEL_PREVIEWS === 'true';
const isProd = process.env.NODE_ENV === 'production';

function isAllowedOrigin(origin) {
  if (allowedOrigins.includes(origin)) return true;
  if (/^https:\/\/basket-bud[a-z0-9-]*\.vercel\.app$/.test(origin)) return true;
  if (allowAllVercel && /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin)) return true;
  if (!isProd && /^https?:\/\/localhost(:\d+)?$/.test(origin)) return true;
  return false;
}

app.use(cors({
  origin: (origin, callback) => {
    // No Origin header (curl, health checks, same-origin, native app) → allow.
    if (!origin) return callback(null, true);
    return callback(null, isAllowedOrigin(origin));
  },
}));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/receipts', receiptsRouter);
app.use('/api/products', productsRouter);
app.use('/api/shops', shopsRouter);
app.use('/api/analytics', analyticsRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// Centralised error handler
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Basket-Bud API running on port ${PORT}`);
});

module.exports = app;
