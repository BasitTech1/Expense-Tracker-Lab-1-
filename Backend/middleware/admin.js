// middleware/admin.js
import User from '../models/userModel.js';

// Check if user is admin
export const isAdmin = async (req, res, next) => {
    try {
        // User should already be authenticated by authenticate middleware
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Check if user role is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }

        next();
    } catch (error) {
        console.error('Admin Check Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error checking admin privileges',
            error: error.message
        });
    }
};

// Check if user is admin or super admin (for future use)
export const isSuperAdmin = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }

        next();
    } catch (error) {
        console.error('Super Admin Check Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error checking admin privileges',
            error: error.message
        });
    }
};

// Log admin actions (optional)
export const logAdminAction = (action) => {
    return async (req, res, next) => {
        const admin = req.user;
        console.log(`📝 Admin Action: ${action}`);
        console.log(`👤 Admin: ${admin.email} (${admin._id})`);
        console.log(`📋 Request: ${req.method} ${req.originalUrl}`);
        console.log(`📦 Body:`, req.body);
        next();
    };
};