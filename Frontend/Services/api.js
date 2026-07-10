// Services/api.js
const API_BASE_URL = "http://localhost:5000/api";

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Helper method to get auth headers
  getAuthHeaders() {
    const token = localStorage.getItem("token");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }

  // Helper method to handle responses
  async handleResponse(response) {
    if (response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "../LoginFiles/Login.html";
      throw new Error("Session expired. Please login again.");
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.message || `HTTP error! status: ${response.status}`,
      );
    }
    return await response.json();
  }

  // ============ AUTHENTICATION ============

  // Login
  async login(email, password) {
    try {
      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  }

  // Register
  async register(userData) {
    try {
      const response = await fetch(`${this.baseURL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  }

  // Get current user
  async getCurrentUser() {
    try {
      const response = await fetch(`${this.baseURL}/auth/me`, {
        headers: this.getAuthHeaders(),
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error("Get user error:", error);
      throw error;
    }
  }

  // ============ TRANSACTIONS ============

  // GET - Fetch all transactions
  async getTransactions() {
    try {
      const response = await fetch(`${this.baseURL}/transactions`, {
        headers: this.getAuthHeaders(),
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      throw error;
    }
  }

  // GET - Fetch single transaction by ID
  async getTransactionById(id) {
    try {
      const response = await fetch(`${this.baseURL}/transactions/${id}`, {
        headers: this.getAuthHeaders(),
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error(`Error fetching transaction ${id}:`, error);
      throw error;
    }
  }

  // POST - Create new transaction
  async createTransaction(transactionData) {
    try {
      const response = await fetch(`${this.baseURL}/transactions`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(transactionData),
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error("Error creating transaction:", error);
      throw error;
    }
  }

  // PUT - Update transaction
  async updateTransaction(id, transactionData) {
    try {
      const response = await fetch(`${this.baseURL}/transactions/${id}`, {
        method: "PUT",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(transactionData),
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error(`Error updating transaction ${id}:`, error);
      throw error;
    }
  }

  // DELETE - Delete transaction
  async deleteTransaction(id) {
    try {
      const response = await fetch(`${this.baseURL}/transactions/${id}`, {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error(`Error deleting transaction ${id}:`, error);
      throw error;
    }
  }

  // GET - Get summary statistics
  async getSummary() {
    try {
      const response = await this.getTransactions();
      if (response.success && response.data) {
        const transactions = response.data;
        const totalIncome = transactions
          .filter((t) => t.type === "Income")
          .reduce((sum, t) => sum + t.amount, 0);
        const totalExpenses = transactions
          .filter((t) => t.type === "Expense")
          .reduce((sum, t) => sum + t.amount, 0);

        return {
          totalIncome,
          totalExpenses,
          balance: totalIncome - totalExpenses,
          count: transactions.length,
        };
      }
      return { totalIncome: 0, totalExpenses: 0, balance: 0, count: 0 };
    } catch (error) {
      console.error("Error getting summary:", error);
      throw error;
    }
  }

  // ============ ADMIN ENDPOINTS ============

  // Get all users (Admin only)
  async getAllUsers(page = 1, limit = 10, search = "", role = "", status = "") {
    try {
      const params = new URLSearchParams({ page, limit });
      if (search) params.append("search", search);
      if (role) params.append("role", role);
      if (status) params.append("status", status);

      const response = await fetch(`${this.baseURL}/admin/users?${params}`, {
        headers: this.getAuthHeaders(),
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  }

  // Get user by ID (Admin only)
  async getUserById(id) {
    try {
      const response = await fetch(`${this.baseURL}/admin/users/${id}`, {
        headers: this.getAuthHeaders(),
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error(`Error fetching user ${id}:`, error);
      throw error;
    }
  }

  // Update user (Admin only)
  async updateUser(id, userData) {
    try {
      const response = await fetch(`${this.baseURL}/admin/users/${id}`, {
        method: "PUT",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(userData),
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error(`Error updating user ${id}:`, error);
      throw error;
    }
  }

  // Delete user (Admin only)
  async deleteUser(id) {
    try {
      const response = await fetch(`${this.baseURL}/admin/users/${id}`, {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error(`Error deleting user ${id}:`, error);
      throw error;
    }
  }

  // Get all transactions (Admin only)
  async getAllTransactions(page = 1, limit = 20, filters = {}) {
    try {
      const params = new URLSearchParams({ page, limit });
      if (filters.type) params.append("type", filters.type);
      if (filters.userId) params.append("userId", filters.userId);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);
      if (filters.search) params.append("search", filters.search);

      const response = await fetch(
        `${this.baseURL}/admin/transactions?${params}`,
        {
          headers: this.getAuthHeaders(),
        },
      );
      return await this.handleResponse(response);
    } catch (error) {
      console.error("Error fetching all transactions:", error);
      throw error;
    }
  }

  // Delete any transaction (Admin only)
  async deleteAnyTransaction(id) {
    try {
      const response = await fetch(`${this.baseURL}/admin/transactions/${id}`, {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error(`Error deleting transaction ${id}:`, error);
      throw error;
    }
  }

  // Get system statistics (Admin only)
  async getSystemStats() {
    try {
      const response = await fetch(`${this.baseURL}/admin/stats`, {
        headers: this.getAuthHeaders(),
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error("Error fetching system stats:", error);
      throw error;
    }
  }

  // Generate report (Admin only)
  async generateReport(period = "monthly", startDate = "", endDate = "") {
    try {
      const params = new URLSearchParams({ period });
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      console.log("📊 Generating report with params:", params.toString());

      const response = await fetch(`${this.baseURL}/admin/reports?${params}`, {
        headers: this.getAuthHeaders(),
      });
      return await this.handleResponse(response);
    } catch (error) {
      console.error("Error generating report:", error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;
