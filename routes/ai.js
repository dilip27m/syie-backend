const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const aiController = require('../controllers/aiController');

// @route   POST /api/ai/rephrase
// @desc    Rephrase text using Gemini AI
// @access  Private
router.post('/rephrase', auth, aiController.rephrase);

module.exports = router;
