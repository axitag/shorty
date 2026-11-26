require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.count()
  .then(n => { console.log('✅ DB connected. User count:', n); return p.$disconnect(); })
  .then(() => process.exit(0))
  .catch(e => { console.error('❌ DB ERROR:', e.message); return p.$disconnect().then(() => process.exit(1)); });
