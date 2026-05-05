const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');

// @route   GET /api/stats
// @desc    Get platform statistics
router.get('/', statsController.getStats);

module.exports = router;
