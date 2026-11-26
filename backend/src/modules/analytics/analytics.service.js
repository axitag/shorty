'use strict';
const { prisma } = require('../../config/database');
const { AppError } = require('../../middleware/errorHandler');

function getDateRange(preset, startDate, endDate) {
  const now = new Date();
  let start, end;

  if (preset === 'custom' && startDate && endDate) {
    start = new Date(startDate);
    end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    if (start > end) throw new AppError('Start date must be before end date.', 400, 'INVALID_DATE_RANGE');
    // Cap at 365 days
    const diff = (end - start) / (1000 * 60 * 60 * 24);
    if (diff > 365) throw new AppError('Date range cannot exceed 365 days.', 400, 'DATE_RANGE_TOO_LARGE');
  } else {
    const days = preset === '90d' ? 90 : preset === '30d' ? 30 : preset === '1d' ? 1 : 7;
    end = new Date(now);
    end.setHours(23, 59, 59, 999);
    start = new Date(now);
    start.setDate(start.getDate() - days + 1);
    start.setHours(0, 0, 0, 0);
  }

  const durationMs = end - start;
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - durationMs);

  return { start, end, prevStart, prevEnd };
}

async function getAccountOverview(userId, { preset = '7d', startDate, endDate } = {}) {
  const { start, end, prevStart, prevEnd } = getDateRange(preset, startDate, endDate);

  const [
    activeLinks,
    totalLinks,
    currentClicks,
    prevClicks,
    currentBots,
    prevBots,
    currentTotal,
    prevTotal,
    topLinks,
  ] = await Promise.all([
    prisma.link.count({ where: { userId, status: 'ACTIVE', deletedAt: null } }),
    prisma.link.count({ where: { userId, deletedAt: null } }),
    prisma.clickEvent.count({
      where: {
        link: { userId },
        clickedAt: { gte: start, lte: end },
        isBot: false,
      },
    }),
    prisma.clickEvent.count({
      where: {
        link: { userId },
        clickedAt: { gte: prevStart, lte: prevEnd },
        isBot: false,
      },
    }),
    prisma.clickEvent.count({
      where: { link: { userId }, clickedAt: { gte: start, lte: end }, isBot: true },
    }),
    prisma.clickEvent.count({
      where: { link: { userId }, clickedAt: { gte: prevStart, lte: prevEnd }, isBot: true },
    }),
    prisma.clickEvent.count({
      where: { link: { userId }, clickedAt: { gte: start, lte: end } },
    }),
    prisma.clickEvent.count({
      where: { link: { userId }, clickedAt: { gte: prevStart, lte: prevEnd } },
    }),
    prisma.clickEvent.groupBy({
      by: ['linkId'],
      where: {
        link: { userId },
        clickedAt: { gte: start, lte: end },
        isBot: false,
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    }),
  ]);

  // Enrich top links with link metadata
  const topLinkIds = topLinks.map((t) => t.linkId);
  const topLinkMeta = await prisma.link.findMany({
    where: { id: { in: topLinkIds } },
    select: { id: true, shortCode: true, title: true, originalUrl: true },
  });
  const metaMap = Object.fromEntries(topLinkMeta.map((l) => [l.id, l]));

  const clickGrowth = prevClicks === 0  // kept for compat — overridden by pctChange below
    ? (currentClicks > 0 ? null : 0)
    : Math.round(((currentClicks - prevClicks) / prevClicks) * 10000) / 100;

  // Estimated unique visitors (count distinct visitorHash)
  const [uniqueResult, prevUniqueResult] = await Promise.all([
    prisma.clickEvent.findMany({
      where: {
        link: { userId },
        clickedAt: { gte: start, lte: end },
        isBot: false,
        visitorHash: { not: null },
      },
      select: { visitorHash: true },
      distinct: ['visitorHash'],
    }),
    prisma.clickEvent.findMany({
      where: {
        link: { userId },
        clickedAt: { gte: prevStart, lte: prevEnd },
        isBot: false,
        visitorHash: { not: null },
      },
      select: { visitorHash: true },
      distinct: ['visitorHash'],
    }),
  ]);

  function pctChange(curr, prev) {
    if (prev === 0) return curr > 0 ? null : 0;
    return Math.round(((curr - prev) / prev) * 10000) / 100;
  }

  return {
    period: { start, end, prevStart, prevEnd },
    activeLinks,
    totalLinks,
    totalClicks: currentClicks,
    prevClicks,
    clickGrowth: pctChange(currentClicks, prevClicks),
    estimatedUniqueVisitors: uniqueResult.length,
    uniqueVisitorGrowth: pctChange(uniqueResult.length, prevUniqueResult.length),
    bots: currentBots,
    prevBots,
    botGrowth: pctChange(currentBots, prevBots),
    totalRequests: currentTotal,
    prevTotalRequests: prevTotal,
    totalRequestsGrowth: pctChange(currentTotal, prevTotal),
    topLinks: topLinks.map((t) => ({
      ...metaMap[t.linkId],
      clicks: t._count.id,
    })),
  };
}

async function getLinkAnalyticsSummary(userId, linkId, { preset = '7d', startDate, endDate } = {}) {
  const link = await prisma.link.findFirst({
    where: { id: linkId, userId, deletedAt: null },
    select: { id: true, shortCode: true, originalUrl: true, title: true, status: true, createdAt: true },
  });
  if (!link) throw new AppError('Link not found.', 404, 'NOT_FOUND');

  const { start, end, prevStart, prevEnd } = getDateRange(preset, startDate, endDate);

  const [currentClicks, prevClicks, botClicks, totalRequests] = await Promise.all([
    prisma.clickEvent.count({ where: { linkId, clickedAt: { gte: start, lte: end }, isBot: false } }),
    prisma.clickEvent.count({ where: { linkId, clickedAt: { gte: prevStart, lte: prevEnd }, isBot: false } }),
    prisma.clickEvent.count({ where: { linkId, clickedAt: { gte: start, lte: end }, isBot: true } }),
    prisma.clickEvent.count({ where: { linkId, clickedAt: { gte: start, lte: end } } }),
  ]);

  const uniqueResult = await prisma.clickEvent.findMany({
    where: { linkId, clickedAt: { gte: start, lte: end }, isBot: false, visitorHash: { not: null } },
    select: { visitorHash: true },
    distinct: ['visitorHash'],
  });

  const clickGrowth = prevClicks === 0  // kept for compat — overridden by pctChange below
    ? (currentClicks > 0 ? null : 0)
    : Math.round(((currentClicks - prevClicks) / prevClicks) * 10000) / 100;

  return {
    link,
    period: { start, end, prevStart, prevEnd },
    totalClicks: currentClicks,
    prevClicks,
    clickGrowth,
    botClicks,
    totalRequests,
    estimatedUniqueVisitors: uniqueResult.length,
  };
}

async function getTimeSeries(userId, { linkId, preset = '7d', startDate, endDate } = {}) {
  const { start, end } = getDateRange(preset, startDate, endDate);

  if (linkId) {
    const link = await prisma.link.findFirst({ where: { id: linkId, userId, deletedAt: null } });
    if (!link) throw new AppError('Link not found.', 404, 'NOT_FOUND');
  }

  const days = Math.round((end - start) / (1000 * 60 * 60 * 24));
  const groupBy = days <= 2 ? 'hour' : 'day';
  // groupBy is only 'hour' or 'day' — safe to interpolate
  // linkId/userId use parameterized placeholders to prevent injection
  let result;
  if (linkId) {
    result = await prisma.$queryRawUnsafe(`
      SELECT
        date_trunc('${groupBy}', ce."clickedAt" AT TIME ZONE 'UTC') AS period,
        COUNT(*) FILTER (WHERE ce."isBot" = false) AS clicks,
        COUNT(*) AS total_requests
      FROM click_events ce
      JOIN links l ON l.id = ce."linkId"
      WHERE ce."linkId" = $1
        AND ce."clickedAt" >= $2
        AND ce."clickedAt" <= $3
        AND l."deletedAt" IS NULL
      GROUP BY period
      ORDER BY period ASC
    `, linkId, start, end);
  } else {
    result = await prisma.$queryRawUnsafe(`
      SELECT
        date_trunc('${groupBy}', ce."clickedAt" AT TIME ZONE 'UTC') AS period,
        COUNT(*) FILTER (WHERE ce."isBot" = false) AS clicks,
        COUNT(*) AS total_requests
      FROM click_events ce
      JOIN links l ON l.id = ce."linkId"
      WHERE l."userId" = $1
        AND ce."clickedAt" >= $2
        AND ce."clickedAt" <= $3
        AND l."deletedAt" IS NULL
      GROUP BY period
      ORDER BY period ASC
    `, userId, start, end);
  }

  return {
    groupBy,
    period: { start, end },
    data: result.map((r) => ({
      period: r.period,
      clicks: Number(r.clicks),
      totalRequests: Number(r.total_requests),
    })),
  };
}

async function getReferrers(userId, { linkId, preset = '7d', startDate, endDate } = {}) {
  const { start, end, prevStart, prevEnd } = getDateRange(preset, startDate, endDate);

  if (linkId) {
    const link = await prisma.link.findFirst({ where: { id: linkId, userId, deletedAt: null } });
    if (!link) throw new AppError('Link not found.', 404, 'NOT_FOUND');
  }

  const where = {
    ...(linkId ? { linkId } : { link: { userId } }),
    clickedAt: { gte: start, lte: end },
    isBot: false,
  };
  const prevWhere = {
    ...(linkId ? { linkId } : { link: { userId } }),
    clickedAt: { gte: prevStart, lte: prevEnd },
    isBot: false,
  };

  const [result, prevResult] = await Promise.all([
    prisma.clickEvent.groupBy({
      by: ['referrerDomain'],
      where,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 20,
    }),
    prisma.clickEvent.groupBy({
      by: ['referrerDomain'],
      where: prevWhere,
      _count: { id: true },
    }),
  ]);

  // Known social/platform domains to always show
  const KNOWN_DOMAINS = [
    { domain: 'Direct / Unknown', label: 'Direct / Unknown' },
    { domain: 'instagram.com', label: 'Instagram' },
    { domain: 'youtube.com', label: 'YouTube' },
    { domain: 'linkedin.com', label: 'LinkedIn' },
    { domain: 't.co', label: 'Twitter / X' },
    { domain: 'facebook.com', label: 'Facebook' },
    { domain: 'reddit.com', label: 'Reddit' },
    { domain: 'tiktok.com', label: 'TikTok' },
    { domain: 'whatsapp.com', label: 'WhatsApp' },
    { domain: 'telegram.org', label: 'Telegram' },
  ];

  const prevMap = Object.fromEntries(
    prevResult.map((r) => [r.referrerDomain || 'Direct / Unknown', r._count.id])
  );

  const dataMap = Object.fromEntries(
    result.map((r) => [r.referrerDomain || 'Direct / Unknown', r._count.id])
  );

  // Merge DB results with known domains (always show known ones even at 0)
  const knownKeys = new Set(KNOWN_DOMAINS.map((k) => k.domain));
  const extraFromDB = result
    .map((r) => r.referrerDomain || 'Direct / Unknown')
    .filter((d) => !knownKeys.has(d));

  const allDomains = [
    ...KNOWN_DOMAINS,
    ...extraFromDB.map((d) => ({ domain: d, label: d })),
  ];

  function pct(curr, prev) {
    if (prev === 0) return curr > 0 ? null : 0;
    return Math.round(((curr - prev) / prev) * 10000) / 100;
  }

  const data = allDomains.map(({ domain, label }) => {
    const clicks = dataMap[domain] || 0;
    const prevClicks = prevMap[domain] || 0;
    return { domain, label, clicks, prevClicks, change: pct(clicks, prevClicks) };
  });

  // Sort: DB results first (by clicks desc), then 0-click known domains
  data.sort((a, b) => b.clicks - a.clicks);

  return { period: { start, end }, data };
}

async function getDevices(userId, { linkId, preset = '7d', startDate, endDate } = {}) {
  const { start, end } = getDateRange(preset, startDate, endDate);

  if (linkId) {
    const link = await prisma.link.findFirst({ where: { id: linkId, userId, deletedAt: null } });
    if (!link) throw new AppError('Link not found.', 404, 'NOT_FOUND');
  }

  const where = {
    ...(linkId ? { linkId } : { link: { userId } }),
    clickedAt: { gte: start, lte: end },
    isBot: false,
  };

  const [devices, browsers, oses] = await Promise.all([
    prisma.clickEvent.groupBy({
      by: ['deviceType'],
      where,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    }),
    prisma.clickEvent.groupBy({
      by: ['browser'],
      where,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    }),
    prisma.clickEvent.groupBy({
      by: ['os'],
      where,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    }),
  ]);

  return {
    period: { start, end },
    devices: devices.map((d) => ({ type: d.deviceType || 'unknown', clicks: d._count.id })),
    browsers: browsers.map((b) => ({ name: b.browser || 'unknown', clicks: b._count.id })),
    os: oses.map((o) => ({ name: o.os || 'unknown', clicks: o._count.id })),
  };
}

async function getLocations(userId, { linkId, preset = '7d', startDate, endDate } = {}) {
  const { start, end } = getDateRange(preset, startDate, endDate);

  if (linkId) {
    const link = await prisma.link.findFirst({ where: { id: linkId, userId, deletedAt: null } });
    if (!link) throw new AppError('Link not found.', 404, 'NOT_FOUND');
  }

  const where = {
    ...(linkId ? { linkId } : { link: { userId } }),
    clickedAt: { gte: start, lte: end },
    isBot: false,
    countryCode: { not: null },
  };

  const [countries, cities] = await Promise.all([
    prisma.clickEvent.groupBy({
      by: ['countryCode'],
      where,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 20,
    }),
    prisma.clickEvent.groupBy({
      by: ['city'],
      where: { ...where, city: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 20,
    }),
  ]);

  return {
    period: { start, end },
    countries: countries.map((c) => ({ code: c.countryCode, clicks: c._count.id })),
    cities: cities.map((c) => ({ city: c.city, clicks: c._count.id })),
    note: 'Geolocation data requires optional local IP database configuration.',
  };
}

async function getCampaigns(userId, { linkId, preset = '7d', startDate, endDate } = {}) {
  const { start, end } = getDateRange(preset, startDate, endDate);

  if (linkId) {
    const link = await prisma.link.findFirst({ where: { id: linkId, userId, deletedAt: null } });
    if (!link) throw new AppError('Link not found.', 404, 'NOT_FOUND');
  }

  const where = {
    ...(linkId ? { linkId } : { link: { userId } }),
    clickedAt: { gte: start, lte: end },
    isBot: false,
  };

  const [sources, mediums, campaigns] = await Promise.all([
    prisma.clickEvent.groupBy({
      by: ['utmSource'],
      where: { ...where, utmSource: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    }),
    prisma.clickEvent.groupBy({
      by: ['utmMedium'],
      where: { ...where, utmMedium: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    }),
    prisma.clickEvent.groupBy({
      by: ['utmCampaign'],
      where: { ...where, utmCampaign: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    }),
  ]);

  return {
    period: { start, end },
    sources: sources.map((s) => ({ name: s.utmSource, clicks: s._count.id })),
    mediums: mediums.map((m) => ({ name: m.utmMedium, clicks: m._count.id })),
    campaigns: campaigns.map((c) => ({ name: c.utmCampaign, clicks: c._count.id })),
  };
}

async function exportCsv(userId, linkId, { preset = '7d', startDate, endDate } = {}) {
  const { start, end } = getDateRange(preset, startDate, endDate);

  const link = await prisma.link.findFirst({
    where: { id: linkId, userId, deletedAt: null },
    select: { id: true, shortCode: true },
  });
  if (!link) throw new AppError('Link not found.', 404, 'NOT_FOUND');

  const events = await prisma.clickEvent.findMany({
    where: { linkId, clickedAt: { gte: start, lte: end } },
    select: {
      clickedAt: true, referrerDomain: true, deviceType: true,
      browser: true, os: true, isBot: true, utmSource: true,
      utmMedium: true, utmCampaign: true,
    },
    orderBy: { clickedAt: 'desc' },
    take: 50000,
  });

  // Escape formula injection
  const escape = (v) => {
    if (v == null) return '';
    const s = String(v);
    if (/^[=+\-@\t\r]/.test(s)) return `'${s}`;
    return s;
  };

  const headers = ['clickedAt', 'referrerDomain', 'deviceType', 'browser', 'os', 'isBot', 'utmSource', 'utmMedium', 'utmCampaign'];
  const rows = events.map((e) => headers.map((h) => escape(e[h])).join(','));
  return [headers.join(','), ...rows].join('\n');
}

module.exports = {
  getAccountOverview, getLinkAnalyticsSummary, getTimeSeries,
  getReferrers, getDevices, getLocations, getCampaigns, exportCsv,
};
