'use strict';
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

p.link.findMany({
  select: {
    id: true,
    shortCode: true,
    originalUrl: true,
    title: true,
    status: true,
    deletedAt: true,
    createdAt: true,
    _count: { select: { clicks: true } },
  },
})
  .then((links) => {
    console.log('\n=== Links in DB ===\n');
    if (!links.length) {
      console.log('(no links found)');
    } else {
      links.forEach((l) => {
        console.log(`shortCode : ${l.shortCode}`);
        console.log(`title     : ${l.title}`);
        console.log(`url       : ${l.originalUrl}`);
        console.log(`status    : ${l.status}`);
        console.log(`clicks    : ${l._count.clicks}`);
        console.log(`deleted   : ${l.deletedAt}`);
        console.log('---');
      });
    }
    return p['$disconnect']();
  })
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1); });
