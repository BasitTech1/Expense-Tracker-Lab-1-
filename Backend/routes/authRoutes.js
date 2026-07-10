import express from 'express';
import {
    register,
    login,
    logout,
    getMe,
    updateProfile,
    changePassword,
    refreshToken,
    createFirstAdmin
} from '../controllers/authController.js';
import {
    validateUserRegistration,
    validateUserLogin,
    checkValidation,
    sanitizeInput
} from '../middleware/validation.js';
import { authenticate, rateLimiter } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post(
    '/register',
    rateLimiter(5, 60000), // 5 requests per minute
    sanitizeInput,
    validateUserRegistration,
    checkValidation,
    register
);

router.post(
    '/login',
    rateLimiter(10, 60000), // 10 requests per minute
    sanitizeInput,
    validateUserLogin,
    checkValidation,
    login
);

router.post('/refresh-token', refreshToken);

// Private routes
router.use(authenticate); // All routes below this require authentication

router.get('/me', getMe);
router.post('/logout', logout);
router.post('/setup-admin', createFirstAdmin);
router.put('/update-profile', sanitizeInput, updateProfile);
router.put('/change-password', sanitizeInput, changePassword);

export default router;