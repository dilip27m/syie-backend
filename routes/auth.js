const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const authController = require('../controllers/authController');
const {
  validate,
  registerValidators,
  loginValidators,
  placementStatusValidators,
  socialLinksValidators,
} = require('../middleware/validators');

// @route   GET /api/auth
// @desc    Get authenticated user
router.get('/', auth, authController.getMe);

// @route   GET /api/auth/user/:roll
// @desc    Get user by roll number (profile viewing)
router.get('/user/:roll', authController.getUserByRoll);

// @route   POST /api/auth/register
router.post('/register', registerValidators, validate, authController.register);

// @route   POST /api/auth/login
router.post('/login', loginValidators, validate, authController.login);

// @route   PUT /api/auth/placement-status
router.put('/placement-status', auth, placementStatusValidators, validate, authController.updatePlacementStatus);

// @route   PUT /api/auth/social-links
router.put('/social-links', auth, socialLinksValidators, validate, authController.updateSocialLinks);

module.exports = router;