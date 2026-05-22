const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  logger.error(err.message, { stack: err.stack, path: req.path, method: req.method });

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large. Maximum size is 10MB.' });
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ error: 'Unexpected file field.' });
  }

  const status = err.status || err.statusCode || 500;
  const message = status < 500 ? err.message : 'Internal server error';

  res.status(status).json({ error: message });
}

module.exports = errorHandler;
