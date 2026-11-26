'use strict';
const argon2 = require('argon2');
const { rateLimit } = require('express-rate-limit');
const { z } = require('zod');
const { prisma } = require('../../config/database');
const { AppError } = require('../../middleware/errorHandler');
const { logger } = require('../../config/logger');

const authRateLimit = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '10', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many attempts, please try again later.' } },
});

const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format').max(255).transform((v) => v.trim().toLowerCase()),
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password too long')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email().transform((v) => v.trim().toLowerCase()),
    password: z.string().min(1),
  }),
});

async function register(req, res, next) {
  try {
    const { body } = registerSchema.parse({ body: req.body });
    const { email, password } = body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError('An account with this email already exists.', 409, 'EMAIL_CONFLICT');
    }

    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    const user = await prisma.user.create({
      data: { email, passwordHash },
      select: { id: true, email: true, createdAt: true },
    });

    req.session.userId = user.id;
    await new Promise((resolve, reject) =>
      req.session.save((err) => (err ? reject(err) : resolve()))
    );

    logger.info({ userId: user.id }, 'User registered');
    res.status(201).json({ data: { id: user.id, email: user.email, createdAt: user.createdAt } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      const details = err.issues.map((i) => ({ field: i.path.slice(1).join('.'), message: i.message }));
      return next(new AppError('Validation failed.', 400, 'VALIDATION_ERROR', details));
    }
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { body } = loginSchema.parse({ body: req.body });
    const { email, password } = body;

    const user = await prisma.user.findUnique({ where: { email } });
    // Always run hash comparison to prevent timing attacks
    const dummyHash = '$argon2id$v=19$m=65536,t=3,p=4$dummysalt1234567$dummyhash1234567890123456789012';
    const valid = user
      ? await argon2.verify(user.passwordHash, password)
      : await argon2.verify(dummyHash, password).catch(() => false);

    if (!user || !valid) {
      throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
    }

    req.session.userId = user.id;
    await new Promise((resolve, reject) =>
      req.session.save((err) => (err ? reject(err) : resolve()))
    );

    logger.info({ userId: user.id }, 'User logged in');
    res.json({ data: { id: user.id, email: user.email, createdAt: user.createdAt } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return next(new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS'));
    }
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const userId = req.session?.userId;
    await new Promise((resolve, reject) =>
      req.session.destroy((err) => (err ? reject(err) : resolve()))
    );
    res.clearCookie('shorty.sid');
    logger.info({ userId }, 'User logged out');
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
      select: { id: true, email: true, createdAt: true, updatedAt: true },
    });
    if (!user) throw new AppError('User not found.', 404, 'NOT_FOUND');
    res.json({ data: user });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, logout, me, authRateLimit };
