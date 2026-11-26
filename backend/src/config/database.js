'use strict';
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { logger } = require('./logger');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? [{ emit: 'event', level: 'query' }, { emit: 'event', level: 'error' }]
    : [{ emit: 'event', level: 'error' }],
});

if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e) => {
    logger.debug({ query: e.query, duration: e.duration }, 'DB query');
  });
}

prisma.$on('error', (e) => {
  logger.error(e, 'Prisma error');
});

// Raw pg pool for session store
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

module.exports = { prisma, pool };
