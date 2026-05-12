const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @route   GET /api/users/search/:id
 * @desc    Search user by ID (strict format: am.sc.u4csexxxxx)
 * @access  Public
 */
const searchUser = asyncHandler(async (req, res) => {
  const userId = req.params.id;

  // Strict validation: am.sc.u4cse followed by 5 alphanumeric characters
  const idRegex = /^am\.sc\.u4cse[a-zA-Z0-9]{5}$/i;

  if (!idRegex.test(userId)) {
    throw new AppError('Please enter a valid user ID', 400);
  }

  // Find user by rollNumber (case-insensitive search)
  const user = await User.findOne({
    rollNumber: { $regex: new RegExp(`^${userId}$`, 'i') },
  }).select('-password');

  if (!user) {
    throw new AppError('No user found', 404);
  }

  res.json(user);
});

/**
 * @route   GET /api/users/suggest?q=...
 * @desc    Live autocomplete: search users by name or roll number prefix
 * @access  Public
 */
const suggestUsers = asyncHandler(async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q || q.length < 2) return res.json([]);

  const regex = new RegExp(q, 'i');
  const users = await User.find({
    $or: [{ fullName: regex }, { rollNumber: regex }],
  })
    .select('fullName rollNumber isPlaced placedCompany')
    .limit(8);

  res.json(users);
});

module.exports = { searchUser, suggestUsers };
