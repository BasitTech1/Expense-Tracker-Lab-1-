// middleware/validation.js
import { body, validationResult } from 'express-validator';

export const validateUserRegistration = [
    body('fullName')
        .trim()
        .notEmpty().withMessage('Full name is required')
        .isLength({ min: 3, max: 50 }).withMessage('Full name must be between 3 and 50 characters'),

    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email address')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),

    body('confirmPassword')
        .notEmpty().withMessage('Please confirm your password')
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Passwords do not match');
            }
            return true;
        }),

    body('gender')
        .optional()
        .isIn(['Male', 'Female', 'Other']).withMessage('Invalid gender selection'),

    body('country')
        .optional()
        .trim()
        .notEmpty().withMessage('Country is required'),

    body('role')
        .optional()
        .isIn(['user', 'admin']).withMessage('Invalid role selection'),

    body('termsAccepted')
        .notEmpty().withMessage('Please accept terms and conditions')
        .isBoolean().withMessage('Invalid terms acceptance')
        .custom(value => value === true).withMessage('You must accept the terms and conditions')
];

export const validateUserLogin = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Please provide a valid email')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password is required')
];

// FIX THIS: Make sure sanitizeInput calls next()
export const sanitizeInput = (req, res, next) => {
    if (req.body) {
        Object.keys(req.body).forEach(key => {
            if (typeof req.body[key] === 'string') {
                req.body[key] = req.body[key].trim();
            }
        });
    }
    next(); 
};

export const checkValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array().map(err => ({
                field: err.param,
                message: err.msg
            }))
        });
    }
    next();  
};