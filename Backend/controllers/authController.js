import User from '../models/userModel.js';
import TokenManager, { createTokenResponse, getTokenCookieOptions } from '../utils/token.js';
import crypto from 'crypto';

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
    try {
        const { fullName, email, password, gender, country, role } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

        // Create user
        const user = await User.create({
            fullName,
            email: email.toLowerCase(),
            password,
            gender: gender || 'Male',
            country: country || 'Pakistan',
            role: role || 'user'
        });

        // Generate tokens
        const tokenResponse = createTokenResponse(user);

        // Set cookie
        res.cookie('token', tokenResponse.token, getTokenCookieOptions(process.env.NODE_ENV === 'production'));

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: tokenResponse
        });
    } catch (error) {
        console.error('Registration Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to register user',
            error: error.message
        });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user with password field
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if account is active
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Account is deactivated. Please contact support.'
            });
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate tokens
        const tokenResponse = createTokenResponse(user);

        // Set cookie
        res.cookie('token', tokenResponse.token, getTokenCookieOptions(process.env.NODE_ENV === 'production'));

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: tokenResponse
        });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to login',
            error: error.message
        });
    }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res) => {
    try {
        res.clearCookie('token');
        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to logout',
            error: error.message
        });
    }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to get user data',
            error: error.message
        });
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/update-profile
// @access  Private
export const updateProfile = async (req, res) => {
    try {
        const { fullName, gender, country } = req.body;

        const updateData = {};
        if (fullName) updateData.fullName = fullName;
        if (gender) updateData.gender = gender;
        if (country) updateData.country = country;

        const user = await User.findByIdAndUpdate(
            req.userId,
            updateData,
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to update profile',
            error: error.message
        });
    }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.userId).select('+password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const isPasswordValid = await user.comparePassword(currentPassword);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        user.password = newPassword;
        await user.save();

        const tokenResponse = createTokenResponse(user);
        res.cookie('token', tokenResponse.token, getTokenCookieOptions(process.env.NODE_ENV === 'production'));

        res.status(200).json({
            success: true,
            message: 'Password changed successfully',
            data: tokenResponse
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to change password',
            error: error.message
        });
    }
};

// @desc    Refresh token
// @route   POST /api/auth/refresh-token
// @access  Public
export const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token is required'
            });
        }

        const decoded = TokenManager.verifyToken(refreshToken, 'refresh');
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const tokenResponse = createTokenResponse(user);

        res.status(200).json({
            success: true,
            message: 'Token refreshed successfully',
            data: tokenResponse
        });
    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid refresh token',
            error: error.message
        });
    }
};


// Add this to authController.js

// @desc    Create admin user (Only accessible via script or initial setup)
// @route   POST /api/auth/create-admin
// @access  Private (Only if no admin exists)
export const createFirstAdmin = async (req, res) => {
    try {
        // Check if any admin already exists
        const adminExists = await User.findOne({ role: 'admin' });
        if (adminExists) {
            return res.status(403).json({
                success: false,
                message: 'Admin already exists. This endpoint is disabled.'
            });
        }

        const { fullName, email, password, gender, country } = req.body;

        // Validate input
        if (!fullName || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Full name, email and password are required'
            });
        }

        // Create admin
        const admin = await User.create({
            fullName,
            email: email.toLowerCase(),
            password,
            gender: gender || 'Male',
            country: country || 'Pakistan',
            role: 'admin',
            isActive: true
        });

        res.status(201).json({
            success: true,
            message: 'Admin user created successfully',
            data: {
                email: admin.email,
                fullName: admin.fullName,
                role: admin.role
            }
        });
    } catch (error) {
        console.error('Create Admin Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create admin',
            error: error.message
        });
    }
};