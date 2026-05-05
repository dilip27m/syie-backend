const Post = require('../models/Post');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// ─── Private Helpers ────────────────────────────────────────

const getCommentById = (post, commentId) => post.comments.id(commentId);

const getReplyById = (comment, replyId) => comment.replies.id(replyId);

const toggleReaction = (reactions, { emoji, authorRoll, authorName }) => {
  const existingReactionIndex = reactions.findIndex(
    (reaction) => reaction.authorRoll === authorRoll && reaction.emoji === emoji
  );

  if (existingReactionIndex >= 0) {
    reactions.splice(existingReactionIndex, 1);
    return;
  }

  reactions.push({ emoji, authorRoll, authorName });
};

// ─── Post CRUD ──────────────────────────────────────────────

/**
 * @route   POST /api/posts
 * @desc    Create a new post
 * @access  Private
 */
const createPost = asyncHandler(async (req, res) => {
  const { companyName, experience, date, postType } = req.body;

  const newPost = new Post({
    authorRoll: req.user.rollNumber,
    authorName: req.body.authorName,
    companyName,
    experience,
    postType: postType || 'Interview',
    interviewDate: date || Date.now(),
  });

  const post = await newPost.save();
  res.json(post);
});

/**
 * @route   GET /api/posts
 * @desc    Get all posts with optional filters and pagination
 * @access  Public
 */
const getPosts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  let query = {};
  if (req.query.company) {
    query.companyName = { $regex: req.query.company, $options: 'i' };
  }
  if (req.query.postType && req.query.postType !== 'All') {
    query.postType = req.query.postType;
  }

  const posts = await Post.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  // Fetch user data for each post to include placement status
  const postsWithPlacement = await Promise.all(
    posts.map(async (post) => {
      const user = await User.findOne({ rollNumber: post.authorRoll }).select(
        'isPlaced placedCompany'
      );
      return {
        ...post.toObject(),
        authorPlacement: user
          ? { isPlaced: user.isPlaced, placedCompany: user.placedCompany }
          : null,
      };
    })
  );

  res.json(postsWithPlacement);
});

/**
 * @route   GET /api/posts/student/:roll
 * @desc    Get posts by a specific student with pagination
 * @access  Public
 */
const getStudentPosts = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const posts = await Post.find({ authorRoll: req.params.roll })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalPosts = await Post.countDocuments({ authorRoll: req.params.roll });

  res.json({
    posts,
    currentPage: page,
    totalPages: Math.ceil(totalPosts / limit),
    totalPosts,
  });
});

/**
 * @route   PUT /api/posts/:id
 * @desc    Update a post (owner only)
 * @access  Private
 */
const updatePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    throw new AppError('Post not found', 404);
  }

  if (post.authorRoll !== req.user.rollNumber) {
    throw new AppError('Not authorized to edit this post', 401);
  }

  // Update only provided fields
  if (req.body.companyName) post.companyName = req.body.companyName;
  if (req.body.experience) post.experience = req.body.experience;
  if (req.body.postType) post.postType = req.body.postType;
  if (req.body.interviewDate) post.interviewDate = req.body.interviewDate;

  await post.save();
  res.json(post);
});

/**
 * @route   DELETE /api/posts/:id
 * @desc    Delete a post (owner only)
 * @access  Private
 */
const deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    throw new AppError('Post not found', 404);
  }

  if (post.authorRoll !== req.user.rollNumber) {
    throw new AppError('Not authorized to delete this post', 401);
  }

  await Post.findByIdAndDelete(req.params.id);
  res.json({ msg: 'Post deleted successfully' });
});

// ─── Comments ───────────────────────────────────────────────

/**
 * @route   POST /api/posts/:id/comment
 * @desc    Add a comment to a post
 * @access  Private
 */
const addComment = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    throw new AppError('Post not found', 404);
  }

  const newComment = {
    authorRoll: req.user.rollNumber,
    authorName: req.body.authorName,
    text: req.body.text,
    replies: [],
    reactions: [],
  };

  post.comments.unshift(newComment);
  await post.save();
  res.json(post.comments);
});

/**
 * @route   DELETE /api/posts/:id/comment/:commentId
 * @desc    Delete a comment (comment author or post author)
 * @access  Private
 */
const deleteComment = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    throw new AppError('Post not found', 404);
  }

  const comment = getCommentById(post, req.params.commentId);

  if (!comment) {
    throw new AppError('Comment not found', 404);
  }

  if (comment.authorRoll !== req.user.rollNumber && post.authorRoll !== req.user.rollNumber) {
    throw new AppError('Not authorized to delete this comment', 401);
  }

  comment.deleteOne();
  await post.save();
  res.json(post.comments);
});

// ─── Replies ────────────────────────────────────────────────

/**
 * @route   POST /api/posts/:id/comment/:commentId/reply
 * @desc    Add a reply to a comment
 * @access  Private
 */
const addReply = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    throw new AppError('Post not found', 404);
  }

  const comment = getCommentById(post, req.params.commentId);

  if (!comment) {
    throw new AppError('Comment not found', 404);
  }

  comment.replies.push({
    authorRoll: req.user.rollNumber,
    authorName: req.body.authorName,
    text: req.body.text,
    reactions: [],
  });

  await post.save();
  res.json(post.comments);
});

/**
 * @route   DELETE /api/posts/:id/comment/:commentId/reply/:replyId
 * @desc    Delete a reply (reply author or post author)
 * @access  Private
 */
const deleteReply = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    throw new AppError('Post not found', 404);
  }

  const comment = getCommentById(post, req.params.commentId);

  if (!comment) {
    throw new AppError('Comment not found', 404);
  }

  const reply = getReplyById(comment, req.params.replyId);

  if (!reply) {
    throw new AppError('Reply not found', 404);
  }

  if (reply.authorRoll !== req.user.rollNumber && post.authorRoll !== req.user.rollNumber) {
    throw new AppError('Not authorized to delete this reply', 401);
  }

  reply.deleteOne();
  await post.save();
  res.json(post.comments);
});

// ─── Reactions ──────────────────────────────────────────────

/**
 * @route   POST /api/posts/:id/reaction
 * @desc    Toggle a reaction on a post
 * @access  Private
 */
const togglePostReaction = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    throw new AppError('Post not found', 404);
  }

  toggleReaction(post.reactions, {
    emoji: req.body.emoji,
    authorRoll: req.user.rollNumber,
    authorName: req.body.authorName,
  });

  await post.save();
  res.json(post);
});

/**
 * @route   POST /api/posts/:id/comment/:commentId/reaction
 * @desc    Toggle a reaction on a comment
 * @access  Private
 */
const toggleCommentReaction = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    throw new AppError('Post not found', 404);
  }

  const comment = getCommentById(post, req.params.commentId);

  if (!comment) {
    throw new AppError('Comment not found', 404);
  }

  toggleReaction(comment.reactions, {
    emoji: req.body.emoji,
    authorRoll: req.user.rollNumber,
    authorName: req.body.authorName,
  });

  await post.save();
  res.json(post.comments);
});

/**
 * @route   POST /api/posts/:id/comment/:commentId/reply/:replyId/reaction
 * @desc    Toggle a reaction on a reply
 * @access  Private
 */
const toggleReplyReaction = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    throw new AppError('Post not found', 404);
  }

  const comment = getCommentById(post, req.params.commentId);

  if (!comment) {
    throw new AppError('Comment not found', 404);
  }

  const reply = getReplyById(comment, req.params.replyId);

  if (!reply) {
    throw new AppError('Reply not found', 404);
  }

  toggleReaction(reply.reactions, {
    emoji: req.body.emoji,
    authorRoll: req.user.rollNumber,
    authorName: req.body.authorName,
  });

  await post.save();
  res.json(post.comments);
});

module.exports = {
  createPost,
  getPosts,
  getStudentPosts,
  updatePost,
  deletePost,
  addComment,
  deleteComment,
  addReply,
  deleteReply,
  togglePostReaction,
  toggleCommentReaction,
  toggleReplyReaction,
};
