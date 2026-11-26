'use strict';
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const { rateLimit } = require('express-rate-limit');
const { pinoHttp } = require('pino-http');
const { logger } = require('./config/logger');
const { pool } = require('./config/database');
const { errorHandler } = require('./middleware/errorHandler');
const { notFound } = require('./middleware/notFound');

const authRoutes = require('./modules/auth/auth.routes');
const linkRoutes = require('./modules/links/link.routes');
const analyticsRoutes = require('./modules/analytics/analytics.routes');
const redirectRoutes = require('./modules/redirect/redirect.routes');

const app = express();

// Trust proxy for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Frontend handles its own CSP
  crossOriginEmbedderPolicy: false,
}));

// CORS
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(cors({
  origin: corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-CSRF-Token'],
}));

// Body parsing
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));

// HTTP logging
app.use(pinoHttp({ logger, autoLogging: { ignore: (req) => req.url === '/api/health' } }));

// Session
const sessionStore = new PgSession({
  pool,
  tableName: 'session',
  createTableIfMissing: false,
});

app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || 'changeme-secret-32chars-minimum!',
  resave: false,
  saveUninitialized: false,
  name: 'shorty.sid',
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: parseInt(process.env.SESSION_MAX_AGE_MS || '86400000', 10),
  },
}));

// Global rate limit
const globalLimit = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later.' } },
  skip: (req) => req.path === '/api/health',
});
app.use(globalLimit);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/links', linkRoutes);
app.use('/api/analytics', analyticsRoutes);

// Public redirect (must come after API routes)
app.use('/', redirectRoutes);

// Error handlers
app.use(notFound);
app.use(errorHandler);

module.exports = app;
