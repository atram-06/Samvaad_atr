const { body, param, query, validationResult } = require('express-validator');

// Middleware to check validation results
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    next();
};

// Auth validation rules
const signupValidation = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be between 3 and 30 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),

    body('email')
        .trim()
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),

    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
        .matches(/\d/)
        .withMessage('Password must contain at least one number'),

    body('fullname')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Full name must not exceed 100 characters'),

    validate
];

const loginValidation = [
    body('username')
        .trim()
        .notEmpty()
        .withMessage('Username is required'),

    body('password')
        .notEmpty()
        .withMessage('Password is required'),

    validate
];

// Post validation rules
const createPostValidation = [
    body('caption')
        .optional()
        .trim()
        .isLength({ max: 2200 })
        .withMessage('Caption must not exceed 2200 characters'),

    validate
];

// Message validation rules
const sendMessageValidation = [
    body('text')
        .trim()
        .notEmpty()
        .withMessage('Message text is required')
        .isLength({ max: 5000 })
        .withMessage('Message must not exceed 5000 characters'),

    param('id')
        .isInt()
        .withMessage('Conversation ID must be a valid number'),

    validate
];

// Chatbot validation rules
const chatbotMessageValidation = [
    body('message')
        .trim()
        .notEmpty()
        .withMessage('Message is required')
        .isLength({ max: 1000 })
        .withMessage('Message must not exceed 1000 characters'),

    validate
];

// Comment validation rules
const createCommentValidation = [
    body('text')
        .trim()
        .notEmpty()
        .withMessage('Comment text is required')
        .isLength({ max: 500 })
        .withMessage('Comment must not exceed 500 characters'),

    param('postId')
        .isInt()
        .withMessage('Post ID must be a valid number'),

    validate
];

// User profile validation rules
const updateProfileValidation = [
    body('fullname')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Full name must not exceed 100 characters'),

    body('bio')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Bio must not exceed 500 characters'),

    validate
];

module.exports = {
    validate,
    signupValidation,
    loginValidation,
    createPostValidation,
    sendMessageValidation,
    chatbotMessageValidation,
    createCommentValidation,
    updateProfileValidation
};
