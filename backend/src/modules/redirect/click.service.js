'use strict';
const crypto = require('crypto');
const UAParser = require('ua-parser-js');
const { prisma } = require('../../config/database');
const { logger } = require('../../config/logger');

// Known bot UA patterns
const BOT_PATTERNS = [
  /bot/i, /crawler/i, /spider/i, /slurp/i, /googlebot/i, /bingbot/i,
  /yandex/i, /baidu/i, /duckduck/i, /facebookexternalhit/i, /twitterbot/i,
  /linkedinbot/i, /slackbot/i, /whatsapp/i, /telegram/i, /prerender/i,
  /headless/i, /phantom/i, /puppeteer/i, /playwright/i, /selenium/i,
  /python-requests/i, /curl\//i, /wget\//i, /go-http/i, /java\//i,
];

function isBot(ua) {
  if (!ua) return false;
  return BOT_PATTERNS.some((p) => p.test(ua));
}

function parseUserAgent(ua) {
  if (!ua) return { deviceType: 'unknown', browser: 'unknown', os: 'unknown' };
  try {
    const parsed = new UAParser(ua);
    const device = parsed.getDevice();
    const browser = parsed.getBrowser();
    const os = parsed.getOS();

    let deviceType = 'desktop';
    if (device.type === 'mobile') deviceType = 'mobile';
    else if (device.type === 'tablet') deviceType = 'tablet';
    else if (!device.type && os.name === 'Android') deviceType = 'mobile';
    else if (!device.type) deviceType = 'desktop';

    return {
      deviceType,
      browser: browser.name || 'unknown',
      os: os.name || 'unknown',
    };
  } catch {
    return { deviceType: 'unknown', browser: 'unknown', os: 'unknown' };
  }
}

function extractReferrer(referer) {
  if (!referer) return { domain: null, url: null };
  try {
    const url = new URL(referer);
    return { domain: url.hostname.replace(/^www\./, ''), url: null };
  } catch {
    return { domain: null, url: null };
  }
}

function extractUtm(queryString) {
  const params = new URLSearchParams(queryString || '');
  const truncate = (s, max = 200) => (s ? s.slice(0, max) : null);
  return {
    utmSource: truncate(params.get('utm_source')),
    utmMedium: truncate(params.get('utm_medium')),
    utmCampaign: truncate(params.get('utm_campaign')),
    utmTerm: truncate(params.get('utm_term')),
    utmContent: truncate(params.get('utm_content')),
  };
}

function computeVisitorHash(ip, ua) {
  if (!ip && !ua) return null;
  const secret = process.env.VISITOR_HASH_SECRET || 'default-secret';
  // Rotate daily to limit tracking window
  const day = new Date().toISOString().slice(0, 10);
  const data = `${ip || ''}|${ua || ''}|${day}`;
  return crypto.createHmac('sha256', secret).update(data).digest('hex').slice(0, 32);
}

async function recordClick(link, req, queryString) {
  try {
    const ua = req.headers['user-agent'] || '';
    const referer = req.headers['referer'] || req.headers['referrer'] || '';
    const ip = req.ip || req.socket?.remoteAddress || '';

    const bot = isBot(ua);
    const { deviceType, browser, os } = parseUserAgent(ua);
    const { domain: referrerDomain } = extractReferrer(referer);
    const utmData = extractUtm(queryString);
    const visitorHash = computeVisitorHash(ip, ua);

    await prisma.clickEvent.create({
      data: {
        linkId: link.id,
        clickedAt: new Date(),
        referrerDomain,
        deviceType,
        browser,
        os,
        isBot: bot,
        responseStatus: 302,
        visitorHash,
        ...utmData,
      },
    });
  } catch (err) {
    // Tracking failure must NOT break redirect
    logger.error({ err, linkId: link?.id }, 'Click tracking failed');
  }
}

module.exports = { recordClick };
