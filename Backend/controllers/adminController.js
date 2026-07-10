// controllers/adminController.js
import User from "../models/userModel.js";
import { Transaction } from "../models/transactionModel.js";
import mongoose from "mongoose";

// ================================
// USER MANAGEMENT
// ================================

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Admin
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role, status } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (role) {
      query.role = role;
    }

    if (status === "active") {
      query.isActive = true;
    } else if (status === "inactive") {
      query.isActive = false;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query),
    ]);

    const usersWithStats = users.map((user) => {
      const userObj = user.toObject();
      userObj.transactionCount = 0;
      return userObj;
    });

    res.status(200).json({
      success: true,
      data: usersWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get All Users Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};

// @desc    Get single user with their transactions
// @route   GET /api/admin/users/:id
// @access  Admin
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const transactions = await Transaction.find({ userId: id })
      .sort({ createdAt: -1 })
      .limit(20);

    const stats = await Transaction.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(id) } },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        user,
        transactions,
        stats: {
          income: stats.find((s) => s._id === "Income")?.total || 0,
          expense: stats.find((s) => s._id === "Expense")?.total || 0,
          totalTransactions: transactions.length,
        },
      },
    });
  } catch (error) {
    console.error("Get User By ID Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user",
      error: error.message,
    });
  }
};

// @desc    Update user (role, status)
// @route   PUT /api/admin/users/:id
// @access  Admin
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, isActive, fullName, gender, country } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    if (id === req.userId.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot modify your own admin account",
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    if (fullName) user.fullName = fullName;
    if (gender) user.gender = gender;
    if (country) user.country = country;

    await user.save();

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: user.toObject(),
    });
  } catch (error) {
    console.error("Update User Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user",
      error: error.message,
    });
  }
};

// @desc    Delete user (soft delete - deactivate)
// @route   DELETE /api/admin/users/:id
// @access  Admin
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format",
      });
    }

    if (id === req.userId.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own admin account",
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.isActive = false;
    await user.save();

    await Transaction.deleteMany({ userId: id });

    res.status(200).json({
      success: true,
      message: "User deactivated and transactions deleted successfully",
    });
  } catch (error) {
    console.error("Delete User Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
      error: error.message,
    });
  }
};

// ================================
// TRANSACTION MANAGEMENT
// ================================

// @desc    Get all transactions (with filters)
// @route   GET /api/admin/transactions
// @access  Admin
export const getAllTransactions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      startDate,
      endDate,
      search,
    } = req.query;

    const query = {};

    if (type) {
      query.type = type;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    if (search) {
      query.description = { $regex: search, $options: "i" };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Transaction.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Get All Transactions Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch transactions",
      error: error.message,
    });
  }
};

// ✅ ADD THIS - Delete any transaction (admin)
// @desc    Delete any transaction (admin)
// @route   DELETE /api/admin/transactions/:id
// @access  Admin
export const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction ID format",
      });
    }

    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    await transaction.deleteOne();

    res.status(200).json({
      success: true,
      message: "Transaction deleted successfully",
    });
  } catch (error) {
    console.error("Delete Transaction Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete transaction",
      error: error.message,
    });
  }
};

// ================================
// SYSTEM STATISTICS & REPORTS
// ================================

// @desc    Get system statistics
// @route   GET /api/admin/stats
// @access  Admin
export const getSystemStats = async (req, res) => {
  try {
    console.log("📊 Fetching system stats...");

    const [
      totalUsers,
      activeUsers,
      totalTransactions,
      incomeResult,
      expenseResult,
      recentUsers,
      recentTransactions,
      categoryStats,
    ] = await Promise.all([
      User.countDocuments().catch(() => 0),
      User.countDocuments({ isActive: true }).catch(() => 0),
      Transaction.countDocuments().catch(() => 0),
      Transaction.aggregate([
        { $match: { type: "Income" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]).catch(() => []),
      Transaction.aggregate([
        { $match: { type: "Expense" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]).catch(() => []),
      User.find()
        .select("-password")
        .sort({ createdAt: -1 })
        .limit(5)
        .catch(() => []),
      Transaction.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .catch(() => []),
      Transaction.aggregate([
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
            total: { $sum: "$amount" },
          },
        },
        { $sort: { total: -1 } },
      ]).catch(() => []),
    ]);

    const totalIncome = incomeResult.length > 0 ? incomeResult[0].total : 0;
    const totalExpense = expenseResult.length > 0 ? expenseResult[0].total : 0;
    const balance = totalIncome - totalExpense;

    const stats = {
      users: {
        total: totalUsers || 0,
        active: activeUsers || 0,
        inactive: (totalUsers || 0) - (activeUsers || 0),
      },
      transactions: {
        total: totalTransactions || 0,
      },
      revenue: {
        totalIncome: totalIncome || 0,
        totalExpense: totalExpense || 0,
        balance: balance || 0,
      },
      categories: categoryStats || [],
      recentUsers: recentUsers || [],
      recentTransactions: recentTransactions || [],
    };

    console.log("✅ Stats fetched successfully");
    console.log(
      `📊 Users: ${stats.users.total}, Income: $${stats.revenue.totalIncome}, Expenses: $${stats.revenue.totalExpense}`,
    );

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("❌ Get System Stats Error:", error);
    console.error("❌ Error details:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch system statistics",
      error: error.message,
    });
  }
};

// @desc    Generate financial report
// @route   GET /api/admin/reports
// @access  Admin
export const generateReport = async (req, res) => {
  try {
    const { period = "monthly", startDate, endDate } = req.query;

    console.log("📊 Generating report for period:", period);

    let dateFilter = {};
    const now = new Date();

    if (startDate && endDate) {
      dateFilter = {
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      };
    } else {
      switch (period) {
        case "daily":
          const today = new Date();
          dateFilter = {
            date: {
              $gte: new Date(today.setHours(0, 0, 0, 0)),
              $lte: new Date(today.setHours(23, 59, 59, 999)),
            },
          };
          break;
        case "weekly":
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay());
          dateFilter = {
            date: {
              $gte: new Date(weekStart.setHours(0, 0, 0, 0)),
              $lte: new Date(now.setHours(23, 59, 59, 999)),
            },
          };
          break;
        case "monthly":
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          dateFilter = {
            date: {
              $gte: new Date(monthStart.setHours(0, 0, 0, 0)),
              $lte: new Date(now.setHours(23, 59, 59, 999)),
            },
          };
          break;
        case "yearly":
          const yearStart = new Date(now.getFullYear(), 0, 1);
          dateFilter = {
            date: {
              $gte: new Date(yearStart.setHours(0, 0, 0, 0)),
              $lte: new Date(now.setHours(23, 59, 59, 999)),
            },
          };
          break;
        default:
          dateFilter = {};
      }
    }

    console.log("📅 Date filter:", dateFilter);

    // Get all transactions with date filter
    let transactions = [];
    try {
      transactions = await Transaction.find(dateFilter)
        .sort({ date: -1 })
        .lean();
      console.log(`📊 Found ${transactions.length} transactions`);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      transactions = [];
    }

    // Get user data for each transaction
    const transactionsWithUser = await Promise.all(
      transactions.map(async (transaction) => {
        let userName = "Unknown User";

        // Try to get user data if userId exists
        if (transaction.userId) {
          try {
            const user = await User.findById(transaction.userId).select(
              "fullName email",
            );
            if (user) {
              userName = user.fullName || "Unknown User";
            }
          } catch (error) {
            console.error("Error fetching user:", error);
          }
        }

        return {
          ...transaction,
          userName: userName,
        };
      }),
    );

    // Get summary stats
    const users = await User.countDocuments().catch(() => 0);

    const income = await Transaction.aggregate([
      { $match: { ...dateFilter, type: "Income" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]).catch(() => []);

    const expense = await Transaction.aggregate([
      { $match: { ...dateFilter, type: "Expense" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]).catch(() => []);

    const categoryData = await Transaction.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]).catch(() => []);

    const totalIncome = income.length > 0 ? income[0].total : 0;
    const totalExpense = expense.length > 0 ? expense[0].total : 0;

    const report = {
      period,
      dateRange: dateFilter.date || { start: "All time", end: "Present" },
      summary: {
        totalUsers: users || 0,
        totalTransactions: transactionsWithUser.length || 0,
        totalIncome: totalIncome,
        totalExpense: totalExpense,
        balance: totalIncome - totalExpense,
      },
      categories: categoryData || [],
      transactions: transactionsWithUser,
      generatedAt: new Date().toISOString(),
    };

    console.log(
      `✅ Report generated: ${transactionsWithUser.length} transactions`,
    );

    res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error("❌ Generate Report Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate report",
      error: error.message,
    });
  }
};
