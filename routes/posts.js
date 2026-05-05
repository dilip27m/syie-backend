const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const postController = require('../controllers/postController');
const {
  validate,
  createPostValidators,
  updatePostValidators,
  commentValidators,
  reactionValidators,
} = require('../middleware/validators');

// ─── Post CRUD ──────────────────────────────────────────────

// @route   POST /api/posts
router.post('/', auth, createPostValidators, validate, postController.createPost);

// @route   GET /api/posts
router.get('/', postController.getPosts);

// @route   GET /api/posts/student/:roll
router.get('/student/:roll', postController.getStudentPosts);

// @route   PUT /api/posts/:id
router.put('/:id', auth, updatePostValidators, validate, postController.updatePost);

// @route   DELETE /api/posts/:id
router.delete('/:id', auth, postController.deletePost);

// ─── Comments ───────────────────────────────────────────────

// @route   POST /api/posts/:id/comment
router.post('/:id/comment', auth, commentValidators, validate, postController.addComment);

// @route   DELETE /api/posts/:id/comment/:commentId
router.delete('/:id/comment/:commentId', auth, postController.deleteComment);

// ─── Replies ────────────────────────────────────────────────

// @route   POST /api/posts/:id/comment/:commentId/reply
router.post('/:id/comment/:commentId/reply', auth, commentValidators, validate, postController.addReply);

// @route   DELETE /api/posts/:id/comment/:commentId/reply/:replyId
router.delete('/:id/comment/:commentId/reply/:replyId', auth, postController.deleteReply);

// ─── Reactions ──────────────────────────────────────────────

// @route   POST /api/posts/:id/reaction
router.post('/:id/reaction', auth, reactionValidators, validate, postController.togglePostReaction);

// @route   POST /api/posts/:id/comment/:commentId/reaction
router.post('/:id/comment/:commentId/reaction', auth, reactionValidators, validate, postController.toggleCommentReaction);

// @route   POST /api/posts/:id/comment/:commentId/reply/:replyId/reaction
router.post('/:id/comment/:commentId/reply/:replyId/reaction', auth, reactionValidators, validate, postController.toggleReplyReaction);

module.exports = router;
