'use strict';
const express = require('express');
const { overview, linkSummary, timeseries, referrers, devices, locations, campaigns, csvExport } = require('./analytics.controller');
const { requireAuth } = require('../../middleware/requireAuth');

const router = express.Router();

router.use(requireAuth);

router.get('/overview', overview);
router.get('/links/:id', linkSummary);
router.get('/timeseries', timeseries);
router.get('/referrers', referrers);
router.get('/devices', devices);
router.get('/locations', locations);
router.get('/campaigns', campaigns);
router.get('/export.csv', csvExport);

module.exports = router;
