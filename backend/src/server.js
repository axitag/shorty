'use strict';
require('dotenv').config();
const http = require('http');
const app = require('./app');
const { logger } = require('./config/logger');
const { prisma } = require('./config/database');

const PORT = process.env.PORT || 3001;

const server = http.createServer(app);

async function start() {
  try {
    await prisma.$connect();
    logger.info('Database connected');
    server.listen(PORT, () => {
      logger.info({ port: PORT }, `Server listening`);
    });
  } catch (err) {
    logger.error(err, 'Failed to start server');
    process.exit(1);
  }
}

function shutdown(signal) {
  logger.info({ signal }, 'Graceful shutdown');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

start();
