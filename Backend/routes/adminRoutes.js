// routes/adminRoutes.js
import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { isAdmin, logAdminAction } from '../middleware/admin.js';
import {
    // User Management
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    // Transaction Management
    getAllTransactions,
    deleteTransaction,
    // System Statistics
    getSystemStats,
    generateReport
} from '../controllers/adminController.js';

const router = express.Router();

// All admin routes require authentication AND admin role
router.use(authenticate);
router.use(isAdmin);

// ================================
// USER MANAGEMENT ROUTES
// ================================
router.get('/users', logAdminAction('View All Users'), getAllUsers);
router.get('/users/:id', logAdminAction('View User Details'), getUserById);
router.put('/users/:id', logAdminAction('Update User'), updateUser);
router.delete('/users/:id', logAdminAction('Delete User'), deleteUser);

// ================================
// TRANSACTION MANAGEMENT ROUTES
// ================================
router.get('/transactions', logAdminAction('View All Transactions'), getAllTransactions);
router.delete('/transactions/:id', logAdminAction('Delete Transaction'), deleteTransaction);

// ================================
// SYSTEM STATISTICS & REPORTS
// ================================
router.get('/stats', logAdminAction('View System Stats'), getSystemStats);
router.get('/reports', logAdminAction('Generate Report'), generateReport);

export default router;