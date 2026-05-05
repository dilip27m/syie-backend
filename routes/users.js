const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// @route   GET /api/users/search/:id
// @desc    Search user by ID (strict format: am.sc.u4csexxxxx)
router.get('/search/:id', userController.searchUser);

module.exports = router;
