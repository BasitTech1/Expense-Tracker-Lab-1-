// AdminFiles/script.js
import apiService from "../Services/api.js";

const API_BASE_URL = "http://localhost:5000/api";

// ============ COMMON FUNCTIONS ============

// Check if user is admin
function checkAdmin() {
  const token = localStorage.getItem("token");
  const userData = localStorage.getItem("user");

  if (!token) {
    window.location.href = "../LoginFiles/Login.html";
    return false;
  }

  if (userData) {
    try {
      const user = JSON.parse(userData);
      if (user.role !== "admin") {
        window.location.href = "../DashboardFiles/dashboard.html";
        return false;
      }
      const nameEl = document.getElementById("adminName");
      if (nameEl) {
        nameEl.textContent = user.fullName || "Admin";
      }
      return true;
    } catch (e) {
      window.location.href = "../LoginFiles/Login.html";
      return false;
    }
  }
  return false;
}

// ✅ Make logoutAdmin global for onclick
window.logoutAdmin = async function (event) {
  if (event) event.preventDefault();

  try {
    const token = localStorage.getItem("token");
    if (token) {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  } catch (error) {
    console.error("Logout error:", error);
  }

  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "../IndexFiles/Index.html";
};

// ✅ Make functions global for onclick
window.editUser = function (userId) {
  const user = allUsers.find((u) => u._id === userId);
  if (!user) {
    showNotification("User not found", "error");
    return;
  }

  document.getElementById("editUserId").value = user._id;
  document.getElementById("editFullName").value = user.fullName || "";
  document.getElementById("editRole").value = user.role || "user";
  document.getElementById("editStatus").value = user.isActive
    ? "true"
    : "false";

  document.getElementById("editModal").style.display = "block";
};

window.closeModal = function () {
  document.getElementById("editModal").style.display = "none";
};

window.deleteUser = async function (userId) {
  if (
    !confirm(
      "Are you sure you want to deactivate this user? All their transactions will be deleted.",
    )
  )
    return;

  try {
    const response = await apiService.deleteUser(userId);
    if (response.success) {
      showNotification("User deactivated successfully", "success");
      loadUsers();
    }
  } catch (error) {
    showNotification(error.message || "Failed to delete user", "error");
  }
};

window.deleteTransaction = async function (transactionId) {
  if (!confirm("Are you sure you want to delete this transaction?")) return;

  try {
    const response = await apiService.deleteAnyTransaction(transactionId);
    if (response.success) {
      showNotification("Transaction deleted successfully", "success");
      loadTransactions();
    }
  } catch (error) {
    showNotification(error.message || "Failed to delete transaction", "error");
  }
};

window.changePage = function (direction) {
  const path = window.location.pathname;

  if (path.includes("admin-users")) {
    if (direction === "prev" && currentPage > 1) {
      currentPage--;
    } else if (direction === "next" && currentPage < totalPages) {
      currentPage++;
    }
    loadUsers();
  } else if (path.includes("admin-transactions")) {
    if (direction === "prev" && transactionPage > 1) {
      transactionPage--;
    } else if (
      direction === "next" &&
      transactionPage < transactionTotalPages
    ) {
      transactionPage++;
    }
    loadTransactions();
  }
};

window.addCategory = function () {
  const input = document.getElementById("newCategory");
  const name = input.value.trim();

  if (!name) {
    showNotification("Please enter a category name", "error");
    return;
  }

  showNotification("Category management coming soon!", "info");
  input.value = "";
};

window.deleteCategory = function (category) {
  if (!confirm(`Delete category "${category}"?`)) return;
  showNotification("Category management coming soon!", "info");
};

window.generateReport = async function () {
  if (!checkAdmin()) return;

  try {
    const period = document.getElementById("reportPeriod")?.value || "monthly";
    const startDate = document.getElementById("reportStartDate")?.value || "";
    const endDate = document.getElementById("reportEndDate")?.value || "";

    showNotification("Generating report...", "info");

    console.log("📊 Generating report with:", { period, startDate, endDate });

    const response = await apiService.generateReport(
      period,
      startDate,
      endDate,
    );

    console.log("📊 Report response:", response);

    if (response.success) {
      const report = response.data;

      console.log("📊 Report data:", report);
      console.log("📊 Transactions count:", report.transactions?.length || 0);

      // Update summary
      document.getElementById("reportUsers").textContent =
        report.summary.totalUsers || 0;
      document.getElementById("reportTransactions").textContent =
        report.summary.totalTransactions || 0;
      document.getElementById("reportIncome").textContent =
        `$${(report.summary.totalIncome || 0).toFixed(2)}`;
      document.getElementById("reportExpense").textContent =
        `$${(report.summary.totalExpense || 0).toFixed(2)}`;
      document.getElementById("reportBalance").textContent =
        `$${(report.summary.balance || 0).toFixed(2)}`;

      // Update table
      const tbody = document.getElementById("reportTableBody");
      if (!tbody) {
        console.error("❌ reportTableBody not found");
        return;
      }

      const transactions = report.transactions || [];

      if (transactions.length === 0) {
        tbody.innerHTML =
          '<tr><td colspan="6" class="loading">No transactions for this period</td></tr>';
        return;
      }

      tbody.innerHTML = transactions
        .map(
          (transaction) => `
        <tr>
          <td>${transaction.userName || "Unknown"}</td>
          <td><span class="type-badge ${transaction.type?.toLowerCase() || ""}">${transaction.type || "N/A"}</span></td>
          <td class="${transaction.type?.toLowerCase() || ""}-amount">$${(transaction.amount || 0).toFixed(2)}</td>
          <td>${transaction.category || "Other"}</td>
          <td>${transaction.description || "No description"}</td>
          <td>${transaction.date ? new Date(transaction.date).toLocaleDateString() : "N/A"}</td>
        </tr>
      `,
        )
        .join("");

      showNotification(
        `Report generated! ${transactions.length} transactions found.`,
        "success",
      );
    } else {
      showNotification(
        response.message || "Failed to generate report",
        "error",
      );
    }
  } catch (error) {
    console.error("❌ Error generating report:", error);
    showNotification("Failed to generate report: " + error.message, "error");
  }
};

// Show notification
function showNotification(message, type = "info") {
  const notification = document.getElementById("notification");
  if (!notification) {
    const div = document.createElement("div");
    div.id = "notification";
    div.className = "admin-notification";
    document.body.appendChild(div);
  }

  const el = document.getElementById("notification");
  el.textContent = message;
  el.className = `admin-notification ${type}`;
  el.style.display = "block";

  setTimeout(() => {
    el.style.display = "none";
  }, 3000);
}

// ============ DASHBOARD FUNCTIONS ============

async function loadAdminDashboard() {
  if (!checkAdmin()) return;

  try {
    console.log("🔄 Loading admin dashboard...");
    const response = await apiService.getSystemStats();
    console.log("📊 Response:", response);

    if (response.success) {
      const stats = response.data;
      console.log("📈 Stats data:", stats);

      document.getElementById("totalUsers").textContent =
        stats.users?.total || 0;
      document.getElementById("activeUsers").textContent =
        stats.users?.active || 0;
      document.getElementById("totalIncome").textContent =
        `$${(stats.revenue?.totalIncome || 0).toFixed(2)}`;
      document.getElementById("totalExpenses").textContent =
        `$${(stats.revenue?.totalExpense || 0).toFixed(2)}`;
      document.getElementById("balance").textContent =
        `$${(stats.revenue?.balance || 0).toFixed(2)}`;
      document.getElementById("totalTransactions").textContent =
        stats.transactions?.total || 0;

      renderRecentUsers(stats.recentUsers || []);
      renderRecentTransactions(stats.recentTransactions || []);
    } else {
      console.error("❌ API returned error:", response.message);
      showNotification("Failed to load dashboard data", "error");
    }
  } catch (error) {
    console.error("❌ Error loading dashboard:", error);
    showNotification("Error loading dashboard: " + error.message, "error");

    document.getElementById("totalUsers").textContent = "Error";
    document.getElementById("activeUsers").textContent = "Error";
    document.getElementById("totalIncome").textContent = "$--";
    document.getElementById("totalExpenses").textContent = "$--";
    document.getElementById("balance").textContent = "$--";
    document.getElementById("totalTransactions").textContent = "Error";
  }
}

function renderRecentUsers(users) {
  const container = document.getElementById("recentUsers");
  if (!container) return;

  if (!users || users.length === 0) {
    container.innerHTML = '<p class="loading">No users found</p>';
    return;
  }

  container.innerHTML = users
    .map(
      (user) => `
        <div class="user-item">
            <div class="user-info">
                <div class="user-avatar-sm">${user.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}</div>
                <div class="user-details">
                    <h4>${user.fullName || "Unknown"}</h4>
                    <p>${user.email || ""}</p>
                </div>
            </div>
            <span class="user-status ${user.isActive ? "active" : "inactive"}">
                ${user.isActive ? "Active" : "Inactive"}
            </span>
        </div>
    `,
    )
    .join("");
}

function renderRecentTransactions(transactions) {
  const container = document.getElementById("recentTransactions");
  if (!container) return;

  if (!transactions || transactions.length === 0) {
    container.innerHTML = '<p class="loading">No transactions found</p>';
    return;
  }

  container.innerHTML = transactions
    .map(
      (transaction) => `
        <div class="transaction-item">
            <div class="transaction-info">
                <div class="transaction-icon ${transaction.type.toLowerCase()}">
                    <i class="fa-solid ${transaction.type === "Income" ? "fa-arrow-up" : "fa-arrow-down"}"></i>
                </div>
                <div class="transaction-details">
                    <h4>${transaction.description || "No description"}</h4>
                    <p>${transaction.userId ? transaction.userId.fullName || "Unknown" : "Unknown"} • ${new Date(transaction.date).toLocaleDateString()}</p>
                </div>
            </div>
            <div class="transaction-amount ${transaction.type.toLowerCase()}">
                ${transaction.type === "Income" ? "+" : "-"}$${transaction.amount.toFixed(2)}
            </div>
        </div>
    `,
    )
    .join("");
}

// ============ USERS MANAGEMENT ============

let currentPage = 1;
let totalPages = 1;
let allUsers = [];

async function loadUsers() {
  if (!checkAdmin()) return;

  try {
    const search = document.getElementById("searchInput")?.value || "";
    const role = document.getElementById("roleFilter")?.value || "";
    const status = document.getElementById("statusFilter")?.value || "";

    const response = await apiService.getAllUsers(
      currentPage,
      10,
      search,
      role,
      status,
    );

    if (response.success) {
      allUsers = response.data;
      totalPages = response.pagination.pages;

      const tbody = document.getElementById("usersTableBody");
      if (!tbody) return;

      if (allUsers.length === 0) {
        tbody.innerHTML =
          '<tr><td colspan="7" class="loading">No users found</td></tr>';
        return;
      }

      tbody.innerHTML = allUsers
        .map(
          (user) => `
                <tr>
                    <td>
                        <div class="user-info">
                            <div class="user-avatar-sm">${user.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}</div>
                            <div class="user-details">
                                <h4>${user.fullName || "Unknown"}</h4>
                            </div>
                        </div>
                    </td>
                    <td>${user.email || ""}</td>
                    <td><span class="role-badge ${user.role}">${user.role || "user"}</span></td>
                    <td><span class="user-status ${user.isActive ? "active" : "inactive"}">${user.isActive ? "Active" : "Inactive"}</span></td>
                    <td>${user.transactionCount || 0}</td>
                    <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                        <button onclick="editUser('${user._id}')" class="btn-edit">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button onclick="deleteUser('${user._id}')" class="btn-delete">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `,
        )
        .join("");

      updatePagination();
    }
  } catch (error) {
    console.error("Error loading users:", error);
    showNotification("Failed to load users", "error");
  }
}

// Edit user form submit
document.addEventListener("submit", async function (e) {
  if (e.target.id === "editUserForm") {
    e.preventDefault();

    const userId = document.getElementById("editUserId").value;
    const userData = {
      fullName: document.getElementById("editFullName").value,
      role: document.getElementById("editRole").value,
      isActive: document.getElementById("editStatus").value === "true",
    };

    try {
      const response = await apiService.updateUser(userId, userData);
      if (response.success) {
        showNotification("User updated successfully", "success");
        closeModal();
        loadUsers();
      }
    } catch (error) {
      showNotification(error.message || "Failed to update user", "error");
    }
  }
});

// Close modal on outside click
window.onclick = function (event) {
  const modal = document.getElementById("editModal");
  if (event.target === modal) {
    modal.style.display = "none";
  }
};

// ============ TRANSACTIONS MANAGEMENT ============

let transactionPage = 1;
let transactionTotalPages = 1;

async function loadTransactions() {
  if (!checkAdmin()) return;

  try {
    const search = document.getElementById("searchInput")?.value || "";
    const type = document.getElementById("typeFilter")?.value || "";
    const startDate = document.getElementById("startDate")?.value || "";
    const endDate = document.getElementById("endDate")?.value || "";

    const filters = { search, type, startDate, endDate };
    const response = await apiService.getAllTransactions(
      transactionPage,
      20,
      filters,
    );

    if (response.success) {
      const transactions = response.data;
      transactionTotalPages = response.pagination.pages;

      const tbody = document.getElementById("transactionsTableBody");
      if (!tbody) return;

      if (transactions.length === 0) {
        tbody.innerHTML =
          '<tr><td colspan="7" class="loading">No transactions found</td></tr>';
        return;
      }

      tbody.innerHTML = transactions
        .map(
          (transaction) => `
                <tr>
                    <td>${transaction.userId ? transaction.userId.fullName || "Unknown" : "Unknown"}</td>
                    <td><span class="type-badge ${transaction.type.toLowerCase()}">${transaction.type}</span></td>
                    <td class="${transaction.type.toLowerCase()}-amount">$${transaction.amount.toFixed(2)}</td>
                    <td>${transaction.category || "Other"}</td>
                    <td>${transaction.description || "No description"}</td>
                    <td>${new Date(transaction.date).toLocaleDateString()}</td>
                    <td>
                        <button onclick="deleteTransaction('${transaction._id}')" class="btn-delete">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `,
        )
        .join("");

      updateTransactionPagination();
    }
  } catch (error) {
    console.error("Error loading transactions:", error);
    showNotification("Failed to load transactions", "error");
  }
}

// ============ PAGINATION ============

function updatePagination() {
  const pageInfo = document.getElementById("pageInfo");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

  if (pageInfo) {
    pageInfo.textContent = `Page ${currentPage} of ${totalPages || 1}`;
  }
  if (prevBtn) {
    prevBtn.disabled = currentPage <= 1;
  }
  if (nextBtn) {
    nextBtn.disabled = currentPage >= totalPages;
  }
}

function updateTransactionPagination() {
  const pageInfo = document.getElementById("pageInfo");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");

  if (pageInfo) {
    pageInfo.textContent = `Page ${transactionPage} of ${transactionTotalPages || 1}`;
  }
  if (prevBtn) {
    prevBtn.disabled = transactionPage <= 1;
  }
  if (nextBtn) {
    nextBtn.disabled = transactionPage >= transactionTotalPages;
  }
}

// ============ CATEGORIES ============

async function loadCategories() {
  if (!checkAdmin()) return;

  try {
    const response = await apiService.getSystemStats();
    if (response.success) {
      const categories = response.data.categories || [];
      const tbody = document.getElementById("categoriesTableBody");
      if (!tbody) return;

      if (categories.length === 0) {
        tbody.innerHTML =
          '<tr><td colspan="4" class="loading">No categories found</td></tr>';
        return;
      }

      tbody.innerHTML = categories
        .map(
          (cat) => `
                <tr>
                    <td><strong>${cat._id || "Other"}</strong></td>
                    <td>${cat.count || 0}</td>
                    <td>$${(cat.total || 0).toFixed(2)}</td>
                    <td>
                        <button onclick="deleteCategory('${cat._id}')" class="btn-delete">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `,
        )
        .join("");
    }
  } catch (error) {
    console.error("Error loading categories:", error);
    showNotification("Failed to load categories", "error");
  }
}

// ============ PAGE LOADER ============

document.addEventListener("DOMContentLoaded", function () {
  const path = window.location.pathname;

  // Add notification styles if not present
  if (!document.getElementById("notification")) {
    const style = document.createElement("style");
    style.textContent = `
            .admin-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 25px;
                border-radius: 8px;
                color: white;
                font-weight: 500;
                z-index: 9999;
                display: none;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                animation: slideIn 0.3s ease;
                max-width: 400px;
            }
            .admin-notification.success { background: #4CAF50; }
            .admin-notification.error { background: #f44336; }
            .admin-notification.info { background: #2196F3; }
            @keyframes slideIn {
                from { transform: translateX(100px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
    document.head.appendChild(style);

    const div = document.createElement("div");
    div.id = "notification";
    div.className = "admin-notification";
    document.body.appendChild(div);
  }

  // Load appropriate page
  if (path.includes("admin-dashboard")) {
    loadAdminDashboard();
    setInterval(loadAdminDashboard, 30000);
  } else if (path.includes("admin-users")) {
    loadUsers();
  } else if (path.includes("admin-transactions")) {
    loadTransactions();
  } else if (path.includes("admin-categories")) {
    loadCategories();
  }
});
