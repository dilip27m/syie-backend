const User = require('../models/User');
const Post = require('../models/Post');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @route   GET /api/stats
 * @desc    Get platform statistics
 * @access  Public
 */
const getStats = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const totalPosts = await Post.countDocuments();

  // Count unique companies from interview posts
  const companies = await Post.distinct('companyName', {
    postType: 'Interview',
    companyName: { $ne: 'General Discussion' },
  });
  const totalCompanies = companies.length;

  // Count placed students (users who have at least one interview post)
  const placedStudents = await Post.distinct('authorRoll', { postType: 'Interview' });
  const totalPlaced = placedStudents.length;

  res.json({
    totalUsers,
    totalPosts,
    totalCompanies,
    totalPlaced,
  });
});

module.exports = { getStats };
