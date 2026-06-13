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
// In production, FRONTEND_URL must be set; in development allow all origins.
// FRONTEND_URL accepts a comma-separated list of allowed origins. Vercel
// preview deployments get a unique origin per commit so they can't be listed —
// set ALLOW_VERCEL_PREVIEWS=true to also accept any https://*.vercel.app origin.
const allowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((s) => s.trim().replace(/\/$/, ''))
  .filter(Boolean);
const allowVercelPreviews = process.env.ALLOW_VERCEL_PREVIEWS === 'true';

let corsOrigin;
if (allowedOrigins.length > 0 || allowVercelPreviews) {
  corsOrigin = (origin, callback) => {
    if (!origin) return callback(null, true); // curl, health checks, same-origin
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (allowVercelPreviews && /^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  };
} else {
  corsOrigin = process.env.NODE_ENV === 'production' ? false : true;
  if (process.env.NODE_ENV === 'production') {
    logger.warn('FRONTEND_URL is not set — all cross-origin requests will be blocked in production');
  }
}
app.use(cors({ origin: corsOrigin }));
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
