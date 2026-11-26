'use strict';
const { logger } = require('../config/logger');

function errorHandler(err, req, res, next) {
  // Don't expose internals
  const status = err.status || err.statusCode || 500;
  const isOperational = !!err.isOperational;

  if (!isOperational) {
    logger.error({ err, reqId: req.id }, 'Unhandled error');
  }

  if (process.env.NODE_ENV === 'production') {
    if (!isOperational) {
      return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' } });
    }
  }

  res.status(status).json({
    error: {
      code: err.code || 'ERROR',
      message: err.message || 'An error occurred.',
      ...(err.details ? { details: err.details } : {}),
    },
  });
}

class AppError extends Error {
  constructor(message, status = 500, code = 'ERROR', details = null) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    this.isOperational = true;
  }
}

module.exports = { errorHandler, AppError };
