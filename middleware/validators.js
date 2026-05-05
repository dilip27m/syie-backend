const { body, validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

/**
 * Middleware that checks express-validator results and throws
 * an AppError if validation failed. Use after validation chains.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }
  next();
};

// ─── Auth Validators ────────────────────────────────────────

const registerValidators = [
  body('rollNumber')
    .trim()
    .notEmpty().withMessage('Roll number is required')
    .customSanitizer((value) => value.toLowerCase()),
  body('fullName')
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/).withMessage('Name can only contain letters and spaces'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
];

const loginValidators = [
  body('rollNumber')
    .trim()
    .notEmpty().withMessage('Roll number is required')
    .customSanitizer((value) => value.toLowerCase()),
  body('password')
    .notEmpty().withMessage('Password is required'),
];

const placementStatusValidators = [
  body('isPlaced').isBoolean().withMessage('Placement status must be true or false'),
  body('placedCompany').optional().trim(),
  body('package').optional().trim(),
];

const socialLinksValidators = [
  body('github').trim().optional({ checkFalsy: true }).isURL().withMessage('Invalid GitHub URL'),
  body('linkedin').trim().optional({ checkFalsy: true }).isURL().withMessage('Invalid LinkedIn URL'),
  body('leetcode').trim().optional({ checkFalsy: true }).isURL().withMessage('Invalid LeetCode URL'),
  body('codeforces').trim().optional({ checkFalsy: true }).isURL().withMessage('Invalid Codeforces URL'),
  body('email').trim().optional({ checkFalsy: true }).isEmail().withMessage('Invalid email address'),
  body('portfolio').trim().optional({ checkFalsy: true }).isURL().withMessage('Invalid Portfolio URL'),
];

// ─── Post Validators ────────────────────────────────────────

const createPostValidators = [
  body('companyName')
    .trim()
    .notEmpty().withMessage('Company name is required')
    .isLength({ max: 100 }).withMessage('Company name too long'),
  body('experience')
    .trim()
    .notEmpty().withMessage('Experience is required')
    .isLength({ min: 10, max: 5000 }).withMessage('Experience must be between 10 and 5000 characters'),
  body('authorName')
    .trim()
    .notEmpty().withMessage('Author name is required'),
  body('postType')
    .optional()
    .isIn(['Interview', 'Discussion']).withMessage('Invalid post type'),
];

const updatePostValidators = [
  body('companyName')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Company name too long'),
  body('experience')
    .optional()
    .trim()
    .isLength({ min: 10, max: 5000 }).withMessage('Experience must be between 10 and 5000 characters'),
  body('postType')
    .optional()
    .isIn(['Interview', 'Discussion']).withMessage('Invalid post type'),
];

const QUICK_REACTION_EMOJIS = ['👍', '❤️', '😂', '🎉', '🔥'];

const commentValidators = [
  body('text')
    .trim()
    .notEmpty().withMessage('Comment text is required')
    .isLength({ min: 1, max: 500 }).withMessage('Comment must be between 1 and 500 characters'),
  body('authorName')
    .trim()
    .notEmpty().withMessage('Author name is required'),
];

const reactionValidators = [
  body('emoji')
    .trim()
    .isIn(QUICK_REACTION_EMOJIS).withMessage('Invalid reaction emoji'),
  body('authorName')
    .trim()
    .notEmpty().withMessage('Author name is required'),
];

module.exports = {
  validate,
  registerValidators,
  loginValidators,
  placementStatusValidators,
  socialLinksValidators,
  createPostValidators,
  updatePostValidators,
  commentValidators,
  reactionValidators,
};
