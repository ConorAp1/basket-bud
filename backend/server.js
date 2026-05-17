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
const corsOrigin = process.env.FRONTEND_URL
  || (process.env.NODE_ENV === 'production' ? false : true);
if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL) {
  logger.warn('FRONTEND_URL is not set — all cross-origin requests will be blocked in production');
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
