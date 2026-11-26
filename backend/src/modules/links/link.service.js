'use strict';
const crypto = require('crypto');
const { prisma } = require('../../config/database');
const { AppError } = require('../../middleware/errorHandler');
const { logger } = require('../../config/logger');

const SHORT_CODE_LENGTH = parseInt(process.env.SHORT_CODE_LENGTH || '7', 10);
const RESERVED_CODES = new Set(['api', 'admin', 'auth', 'login', 'register', 'dashboard', 'health', 'static', 'assets', 'favicon.ico']);

function generateShortCode(length = SHORT_CODE_LENGTH) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

function validateUrl(url) {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new AppError('Only http and https URLs are allowed.', 400, 'INVALID_URL');
    }
    return true;
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError('Invalid destination URL.', 400, 'INVALID_URL');
  }
}

async function createLink(userId, data) {
  validateUrl(data.originalUrl);

  if (data.originalUrl.length > 2048) {
    throw new AppError('URL is too long (max 2048 characters).', 400, 'URL_TOO_LONG');
  }

  let shortCode = data.customAlias;
  if (shortCode) {
    shortCode = shortCode.trim();
    if (!/^[a-zA-Z0-9_-]{3,50}$/.test(shortCode)) {
      throw new AppError('Custom alias must be 3–50 characters using letters, numbers, hyphens, underscores.', 400, 'INVALID_ALIAS');
    }
    if (RESERVED_CODES.has(shortCode.toLowerCase())) {
      throw new AppError('This alias is reserved and cannot be used.', 409, 'ALIAS_RESERVED');
    }
    // Check collision
    const existing = await prisma.link.findUnique({ where: { shortCode } });
    if (existing) {
      throw new AppError('This custom alias is already taken.', 409, 'ALIAS_CONFLICT');
    }
  } else {
    // Generate unique code with retry
    let attempts = 0;
    while (attempts < 10) {
      shortCode = generateShortCode();
      const existing = await prisma.link.findUnique({ where: { shortCode } });
      if (!existing) break;
      attempts++;
    }
    if (attempts >= 10) throw new AppError('Failed to generate unique short code, please retry.', 500, 'CODE_GENERATION_FAILED');
  }

  const link = await prisma.link.create({
    data: {
      userId,
      shortCode,
      originalUrl: data.originalUrl,
      title: data.title?.trim().slice(0, 255) || null,
      status: 'ACTIVE',
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      campaignId: data.campaignId || null,
    },
    select: {
      id: true, userId: true, shortCode: true, originalUrl: true,
      title: true, status: true, expiresAt: true, campaignId: true,
      createdAt: true, updatedAt: true,
    },
  });

  return link;
}

async function listLinks(userId, { page = 1, pageSize = 20, search = '', sortBy = 'createdAt', sortDir = 'desc' } = {}) {
  const allowedSorts = ['createdAt', 'title', 'shortCode'];
  const orderField = allowedSorts.includes(sortBy) ? sortBy : 'createdAt';
  const direction = sortDir === 'asc' ? 'asc' : 'desc';
  const skip = (Math.max(1, page) - 1) * Math.min(100, Math.max(1, pageSize));
  const take = Math.min(100, Math.max(1, pageSize));

  const where = {
    userId,
    deletedAt: null,
    ...(search ? {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { shortCode: { contains: search, mode: 'insensitive' } },
        { originalUrl: { contains: search, mode: 'insensitive' } },
      ],
    } : {}),
  };

  const [links, total] = await Promise.all([
    prisma.link.findMany({
      where,
      orderBy: { [orderField]: direction },
      skip,
      take,
      select: {
        id: true, shortCode: true, originalUrl: true, title: true,
        status: true, expiresAt: true, createdAt: true, updatedAt: true,
        _count: { select: { clicks: { where: { isBot: false } } } },
      },
    }),
    prisma.link.count({ where }),
  ]);

  return {
    data: links.map((l) => ({ ...l, clicks: l._count.clicks })),
    pagination: { page: Math.max(1, page), pageSize: take, total },
  };
}

async function getLink(userId, linkId) {
  const link = await prisma.link.findFirst({
    where: { id: linkId, userId, deletedAt: null },
    select: {
      id: true, shortCode: true, originalUrl: true, title: true,
      status: true, expiresAt: true, campaignId: true,
      createdAt: true, updatedAt: true,
      _count: { select: { clicks: { where: { isBot: false } } } },
    },
  });
  if (!link) throw new AppError('Link not found.', 404, 'NOT_FOUND');
  return { ...link, clicks: link._count.clicks };
}

async function updateLink(userId, linkId, data) {
  const link = await prisma.link.findFirst({ where: { id: linkId, userId, deletedAt: null } });
  if (!link) throw new AppError('Link not found.', 404, 'NOT_FOUND');

  if (data.originalUrl) validateUrl(data.originalUrl);

  const updated = await prisma.link.update({
    where: { id: linkId },
    data: {
      ...(data.originalUrl ? { originalUrl: data.originalUrl } : {}),
      ...(data.title !== undefined ? { title: data.title?.trim().slice(0, 255) || null } : {}),
      ...(data.status ? { status: data.status } : {}),
      ...(data.expiresAt !== undefined ? { expiresAt: data.expiresAt ? new Date(data.expiresAt) : null } : {}),
      ...(data.campaignId !== undefined ? { campaignId: data.campaignId || null } : {}),
    },
    select: {
      id: true, shortCode: true, originalUrl: true, title: true,
      status: true, expiresAt: true, campaignId: true,
      createdAt: true, updatedAt: true,
    },
  });
  return updated;
}

async function deleteLink(userId, linkId) {
  const link = await prisma.link.findFirst({ where: { id: linkId, userId, deletedAt: null } });
  if (!link) throw new AppError('Link not found.', 404, 'NOT_FOUND');

  // Soft delete - preserves analytics history
  await prisma.link.update({
    where: { id: linkId },
    data: { deletedAt: new Date(), status: 'INACTIVE' },
  });
}

module.exports = { createLink, listLinks, getLink, updateLink, deleteLink };
