'use strict';
const express = require('express');
const { register, login, logout, me, authRateLimit } = require('./auth.controller');
const { requireAuth } = require('../../middleware/requireAuth');

const router = express.Router();

router.post('/register', authRateLimit, register);
router.post('/login', authRateLimit, login);
router.post('/logout', requireAuth, logout);
router.get('/me', requireAuth, me);

module.exports = router;
