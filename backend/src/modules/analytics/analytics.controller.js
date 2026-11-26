'use strict';
const { z } = require('zod');
const {
  getAccountOverview, getLinkAnalyticsSummary, getTimeSeries,
  getReferrers, getDevices, getLocations, getCampaigns, exportCsv,
} = require('./analytics.service');
const { AppError } = require('../../middleware/errorHandler');

const dateSchema = z.object({
  query: z.object({
    preset: z.enum(['1d', '7d', '30d', '90d', 'custom']).optional().default('7d'),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    linkId: z.string().optional(),
  }),
});

async function overview(req, res, next) {
  try {
    const { query } = dateSchema.parse({ query: req.query });
    const data = await getAccountOverview(req.session.userId, query);
    res.json({ data });
  } catch (err) { next(err); }
}

async function linkSummary(req, res, next) {
  try {
    const { query } = dateSchema.parse({ query: req.query });
    const data = await getLinkAnalyticsSummary(req.session.userId, req.params.id, query);
    res.json({ data });
  } catch (err) { next(err); }
}

async function timeseries(req, res, next) {
  try {
    const { query } = dateSchema.parse({ query: req.query });
    const data = await getTimeSeries(req.session.userId, query);
    res.json({ data });
  } catch (err) { next(err); }
}

async function referrers(req, res, next) {
  try {
    const { query } = dateSchema.parse({ query: req.query });
    const data = await getReferrers(req.session.userId, query);
    res.json({ data });
  } catch (err) { next(err); }
}

async function devices(req, res, next) {
  try {
    const { query } = dateSchema.parse({ query: req.query });
    const data = await getDevices(req.session.userId, query);
    res.json({ data });
  } catch (err) { next(err); }
}

async function locations(req, res, next) {
  try {
    const { query } = dateSchema.parse({ query: req.query });
    const data = await getLocations(req.session.userId, query);
    res.json({ data });
  } catch (err) { next(err); }
}

async function campaigns(req, res, next) {
  try {
    const { query } = dateSchema.parse({ query: req.query });
    const data = await getCampaigns(req.session.userId, query);
    res.json({ data });
  } catch (err) { next(err); }
}

async function csvExport(req, res, next) {
  try {
    const { query } = dateSchema.parse({ query: req.query });
    if (!query.linkId) throw new AppError('linkId is required for CSV export.', 400, 'MISSING_PARAM');
    const csv = await exportCsv(req.session.userId, query.linkId, query);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="clicks-${query.linkId}.csv"`);
    res.send(csv);
  } catch (err) { next(err); }
}

module.exports = { overview, linkSummary, timeseries, referrers, devices, locations, campaigns, csvExport };
