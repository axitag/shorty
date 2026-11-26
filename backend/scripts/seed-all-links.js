'use strict';
/**
 * Seed script: inserts 2000-4000 realistic click events for EVERY link in the database.
 * Run from backend/: node scripts/seed-all-links.js
 */
require('dotenv').config();
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const REFERRERS = [
  'instagram.com', 'instagram.com', 'instagram.com',
  't.co', 't.co',
  'youtube.com', 'youtube.com',
  'linkedin.com',
  'facebook.com',
  'reddit.com',
  'tiktok.com',
  'whatsapp.com',
  null, null, null, null, // Direct / Unknown
];
const DEVICES = ['mobile', 'mobile', 'mobile', 'desktop', 'desktop', 'tablet'];
const BROWSERS = ['Chrome', 'Chrome', 'Safari', 'Firefox', 'Edge', 'Samsung Browser'];
const OS_LIST = ['Android', 'iOS', 'Windows', 'macOS', 'Linux'];
const CITIES = ['New York', 'London', 'San Francisco', 'Mumbai', 'Berlin', 'Tokyo', 'Toronto', 'Sydney', 'Paris', 'Bengaluru'];
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
  // Find all links (excluding soft-deleted ones or include them if active)
  const links = await p.link.findMany({ where: { deletedAt: null } });
  if (!links.length) {
    console.error('No links found.');
    process.exit(1);
  }
  console.log(`Found ${links.length} active links to seed clicks for:`);
  links.forEach(l => console.log(`  - ${l.shortCode} (${l.id})`));

  const BATCH = 300;

  for (const link of links) {
    const TOTAL_FOR_LINK = randInt(2200, 3800);
    console.log(`\nGenerating ${TOTAL_FOR_LINK} clicks for ${link.shortCode}...`);
    
    const records = Array.from({ length: TOTAL_FOR_LINK }, () => {
      const isBot = pick(IS_BOT_WEIGHTS);
      const daysAgo = randInt(0, 89);
      return {
        linkId: link.id,
        clickedAt: randDate(daysAgo),
        referrerDomain: isBot ? null : pick(REFERRERS),
        deviceType: isBot ? null : pick(DEVICES),
        browser: isBot ? 'bot' : pick(BROWSERS),
        os: isBot ? null : pick(OS_LIST),
        city: isBot ? null : pick(CITIES),
        isBot,
        responseStatus: 302,
        visitorHash: isBot ? null : visitorHash(),
      };
    });

    let inserted = 0;
    for (let i = 0; i < records.length; i += BATCH) {
      const batch = records.slice(i, i + BATCH);
      await p.clickEvent.createMany({ data: batch });
      inserted += batch.length;
      process.stdout.write(`\r  Inserted ${inserted}/${TOTAL_FOR_LINK}...`);
    }
    console.log(` Done for ${link.shortCode}!`);
  }

  console.log('\n✓ Successfully seeded dummy data for all links!');
  await p['$disconnect']();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
