'use strict';
const express = require('express');
const { prisma } = require('../../config/database');
const { recordClick } = require('./click.service');
const { logger } = require('../../config/logger');

const router = express.Router();

// Public short-link redirect
router.get('/:shortCode', async (req, res, next) => {
  const { shortCode } = req.params;

  // Skip API routes and common static paths
  const skip = ['api', 'favicon.ico', 'robots.txt', 'static', 'assets'];
  if (skip.includes(shortCode)) return next();

  try {
    const link = await prisma.link.findFirst({
      where: { shortCode, deletedAt: null },
    });

    if (!link) {
      return res.redirect(302, '/link-unavailable?reason=not_found');
    }

    if (link.status !== 'ACTIVE') {
      return res.redirect(302, '/link-unavailable?reason=inactive');
    }

    if (link.expiresAt && new Date() > link.expiresAt) {
      return res.redirect(302, '/link-unavailable?reason=expired');
    }

    // Extract the query string from the original request for UTM tracking
    const queryString = req.url.includes('?') ? req.url.split('?')[1] : '';

    // Record click asynchronously - do not await to keep redirect fast
    setImmediate(() => recordClick(link, req, queryString));

    // 302 redirect
    res.redirect(302, link.originalUrl);
  } catch (err) {
    logger.error({ err, shortCode }, 'Redirect error');
    next(err);
  }
});

module.exports = router;
