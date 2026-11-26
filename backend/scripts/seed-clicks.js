'use strict';
/**
 * Seed script: inserts ~3000 realistic click events spread over the last 90 days.
 * Run from backend/: node scripts/seed-clicks.js
 */
require('dotenv').config();
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const REFERRERS = [
  'instagram.com', 'instagram.com', 'instagram.com',
  't.co', 't.co',
  'youtube.com',
  'linkedin.com',
  'facebook.com',
  'reddit.com',
  'tiktok.com',
  'whatsapp.com',
  null, null, null, null, // Direct
];
const DEVICES = ['mobile', 'mobile', 'mobile', 'desktop', 'desktop', 'tablet'];
const BROWSERS = ['Chrome', 'Chrome', 'Safari', 'Firefox', 'Edge', 'Samsung Browser'];
const OS_LIST = ['Android', 'iOS', 'Windows', 'macOS', 'Linux'];
const IS_BOT_WEIGHTS = [false, false, false, false, false, false, false, false, false, true]; // ~10% bots

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function randDate(daysAgo) {
  const now = Date.now();
  const msAgo = daysAgo * 24 * 60 * 60 * 1000;
  return new Date(now - Math.random() * msAgo);
}

function visitorHash() {
  return crypto.randomBytes(16).toString('hex');
}

async function main() {
  // Find the first active link
  const link = await p.link.findFirst({ where: { status: 'ACTIVE', deletedAt: null } });
  if (!link) { console.error('No active links found. Create a link first.'); process.exit(1); }
  console.log(`Seeding clicks for link: ${link.shortCode} (${link.id})`);

  const TOTAL = 3200;
  const BATCH = 200;
  let inserted = 0;

  // Build all records
  const records = Array.from({ length: TOTAL }, () => {
    const isBot = pick(IS_BOT_WEIGHTS);
    const daysAgo = randInt(0, 89);
    return {
      linkId: link.id,
      clickedAt: randDate(daysAgo),
      referrerDomain: isBot ? null : pick(REFERRERS),
      deviceType: isBot ? null : pick(DEVICES),
      browser: isBot ? 'bot' : pick(BROWSERS),
      os: isBot ? null : pick(OS_LIST),
      isBot,
      responseStatus: 302,
      visitorHash: isBot ? null : visitorHash(),
    };
  });

  // Insert in batches
  for (let i = 0; i < records.length; i += BATCH) {
    const batch = records.slice(i, i + BATCH);
    await p.clickEvent.createMany({ data: batch });
    inserted += batch.length;
    process.stdout.write(`\r  Inserted ${inserted}/${TOTAL}...`);
  }

  console.log(`\n✓ Done! Inserted ${inserted} click events.`);
  await p['$disconnect']();
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
