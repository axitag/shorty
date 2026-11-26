'use strict';
const { AppError } = require('./errorHandler');

function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return next(new AppError('Authentication required.', 401, 'UNAUTHENTICATED'));
  }
  next();
}

module.exports = { requireAuth };
