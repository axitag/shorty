'use strict';
const { z } = require('zod');
const { createLink, listLinks, getLink, updateLink, deleteLink } = require('./link.service');
const { AppError } = require('../../middleware/errorHandler');

const createSchema = z.object({
  body: z.object({
    originalUrl: z.string().url('Must be a valid URL').max(2048),
    title: z.string().max(255).optional(),
    customAlias: z.string().optional(),
    expiresAt: z.string().datetime({ offset: true }).optional().nullable(),
    campaignId: z.string().optional().nullable(),
  }),
});

const updateSchema = z.object({
  body: z.object({
    originalUrl: z.string().url().max(2048).optional(),
    title: z.string().max(255).optional().nullable(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
    expiresAt: z.string().datetime({ offset: true }).optional().nullable(),
    campaignId: z.string().optional().nullable(),
  }),
  params: z.object({ id: z.string() }),
});

const listSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().max(100).optional().default(''),
    sortBy: z.enum(['createdAt', 'title', 'shortCode']).optional().default('createdAt'),
    sortDir: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
});

async function create(req, res, next) {
  try {
    const { body } = createSchema.parse({ body: req.body });
    const link = await createLink(req.session.userId, body);
    res.status(201).json({ data: link });
  } catch (err) {
    if (err instanceof z.ZodError) {
      const details = err.issues.map((i) => ({ field: i.path.slice(1).join('.'), message: i.message }));
      return next(new AppError('Validation failed.', 400, 'VALIDATION_ERROR', details));
    }
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const { query } = listSchema.parse({ query: req.query });
    const result = await listLinks(req.session.userId, query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function get(req, res, next) {
  try {
    const link = await getLink(req.session.userId, req.params.id);
    res.json({ data: link });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { body, params } = updateSchema.parse({ body: req.body, params: req.params });
    const link = await updateLink(req.session.userId, params.id, body);
    res.json({ data: link });
  } catch (err) {
    if (err instanceof z.ZodError) {
      const details = err.issues.map((i) => ({ field: i.path.slice(1).join('.'), message: i.message }));
      return next(new AppError('Validation failed.', 400, 'VALIDATION_ERROR', details));
    }
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await deleteLink(req.session.userId, req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list, get, update, remove };
