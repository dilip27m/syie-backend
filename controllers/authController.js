const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @route   GET /api/auth
 * @desc    Get currently authenticated user
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  if (!user) {
    throw new AppError('User not found', 404);
  }
  res.json(user);
});

/**
 * @route   GET /api/auth/user/:roll
 * @desc    Get user by roll number (for profile viewing)
 * @access  Public
 */
const getUserByRoll = asyncHandler(async (req, res) => {
  const user = await User.findOne({ rollNumber: req.params.roll }).select('-password');
  if (!user) {
    throw new AppError('User not found', 404);
  }
  res.json(user);
});

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { rollNumber, fullName, password } = req.body;

  const existingUser = await User.findOne({ rollNumber });
  if (existingUser) {
    throw new AppError('User already exists', 400);
  }

  const user = new User({ rollNumber, fullName, password });

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(password, salt);

  await user.save();

  const payload = {
    user: {
      rollNumber: user.rollNumber,
      id: user.id,
    },
  };

  jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: '5d' },
    (err, token) => {
      if (err) throw err;
      res.json({
        token,
        id: user.id,
        rollNumber: user.rollNumber,
        fullName: user.fullName,
      });
    }
  );
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and get token
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { rollNumber, password } = req.body;

  const user = await User.findOne({ rollNumber });
  if (!user) {
    throw new AppError('Invalid Credentials', 400);
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError('Invalid Credentials', 400);
  }

  const payload = {
    user: {
      rollNumber: user.rollNumber,
      id: user.id,
    },
  };

  jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: '5d' },
    (err, token) => {
      if (err) throw err;
      res.json({
        token,
        id: user.id,
        rollNumber: user.rollNumber,
        fullName: user.fullName,
      });
    }
  );
});

/**
 * @route   PUT /api/auth/placement-status
 * @desc    Update user's placement status
 * @access  Private
 */
const updatePlacementStatus = asyncHandler(async (req, res) => {
  const { isPlaced, placedCompany, package: pkg } = req.body;

  const user = await User.findById(req.user.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  user.isPlaced = isPlaced;
  if (isPlaced) {
    user.placedCompany = placedCompany || '';
    user.package = pkg || '';
    user.placedDate = new Date();
  } else {
    user.placedCompany = '';
    user.package = '';
    user.placedDate = null;
  }

  await user.save();

  res.json({
    isPlaced: user.isPlaced,
    placedCompany: user.placedCompany,
    package: user.package,
    placedDate: user.placedDate,
  });
});

/**
 * @route   PUT /api/auth/social-links
 * @desc    Update user's social links
 * @access  Private
 */
const updateSocialLinks = asyncHandler(async (req, res) => {
  const { github, linkedin, leetcode, codeforces, email, portfolio } = req.body;

  const user = await User.findById(req.user.id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Ensure socialLinks object exists
  if (!user.socialLinks) {
    user.socialLinks = {};
  }

  // Explicitly set fields to avoid issues with partial updates or undefined defaults
  if (github !== undefined) user.socialLinks.github = github;
  if (linkedin !== undefined) user.socialLinks.linkedin = linkedin;
  if (leetcode !== undefined) user.socialLinks.leetcode = leetcode;
  if (codeforces !== undefined) user.socialLinks.codeforces = codeforces;
  if (email !== undefined) user.socialLinks.email = email;
  if (portfolio !== undefined) user.socialLinks.portfolio = portfolio;

  await user.save();

  res.json({ socialLinks: user.socialLinks });
});

module.exports = {
  getMe,
  getUserByRoll,
  register,
  login,
  updatePlacementStatus,
  updateSocialLinks,
};
