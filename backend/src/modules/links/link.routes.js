'use strict';
const express = require('express');
const { create, list, get, update, remove } = require('./link.controller');
const { requireAuth } = require('../../middleware/requireAuth');

const router = express.Router();

router.use(requireAuth);

router.post('/', create);
router.get('/', list);
router.get('/:id', get);
router.patch('/:id', update);
router.delete('/:id', remove);

module.exports = router;
