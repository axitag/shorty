'use strict';
const { z } = require('zod');
const { AppError } = require('./errorHandler');

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    if (!result.success) {
      const details = result.error.issues.map((i) => ({
        field: i.path.slice(1).join('.'),
        message: i.message,
      }));
      return next(new AppError('Validation failed.', 400, 'VALIDATION_ERROR', details));
    }
    req.validated = result.data;
    next();
  };
}

module.exports = { validate };
