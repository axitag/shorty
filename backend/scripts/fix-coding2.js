'use strict';
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

// Fix coding2: set the correct YouTube destination
p.link.update({
  where: { shortCode: 'coding2' },
  data: { originalUrl: 'https://youtu.be/XLbvmMz8Fr8' },
})
  .then((l) => {
    console.log('Fixed! Updated link:');
    console.log(`  shortCode   : ${l.shortCode}`);
    console.log(`  originalUrl : ${l.originalUrl}`);
    console.log(`  status      : ${l.status}`);
    return p['$disconnect']();
  })
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1); });
