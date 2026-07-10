// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Check authentication status
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        // Redirect to login if not authenticated
        window.location.href = '../LoginFiles/Login.html';
        return false;
    }
    return true;
}

// Get auth headers
function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// Function to fetch and update dashboard summary
async function updateDashboardSummary() {
    // Check authentication first
    if (!checkAuth()) return;

    try {
        // Show loading state
        showLoadingState();

        // Fetch transactions from backend API with auth
        const response = await fetch(`${API_BASE_URL}/transactions`, {
            headers: getAuthHeaders()
        });

        if (response.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('refreshToken');
            window.location.href = '../LoginFiles/Login.html';
            return;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Failed to fetch transactions');
        }

        // Get transactions array
        const transactions = data.data || [];

        // Calculate totals
        let totalIncome = 0;
        let totalExpenses = 0;
        let transactionCount = transactions.length;

        // Loop through transactions
        for (let i = 0; i < transactions.length; i++) {
            const transaction = transactions[i];

            if (transaction.type === 'Income') {
                totalIncome += transaction.amount;
            } else if (transaction.type === 'Expense') {
                totalExpenses += transaction.amount;
            }
        }

        // Calculate remaining balance
        const remainingBalance = totalIncome - totalExpenses;

        // Update DOM with calculated values
        updateDOM(totalIncome, totalExpenses, remainingBalance, transactionCount);

        // Update user info
        updateUserInfo();

    } catch (error) {
        console.error('❌ Error updating dashboard:', error);
        showErrorState(error.message);
    }
}

// Function to update user info
function updateUserInfo() {
    const userData = localStorage.getItem('user');
    if (userData) {
        try {
            const user = JSON.parse(userData);
            const userNameElement = document.getElementById('userName');
            const userEmailElement = document.getElementById('userEmail');

            if (userNameElement) {
                userNameElement.textContent = user.fullName || user.name || 'User';
            }
            if (userEmailElement) {
                userEmailElement.textContent = user.email || '';
            }
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    }
}

// Function to update DOM elements
function updateDOM(totalIncome, totalExpenses, remainingBalance, transactionCount) {
    // Update income
    const incomeElement = document.getElementById('totalIncome');
    if (incomeElement) {
        incomeElement.textContent = `$${totalIncome.toFixed(2)}`;
    }

    // Update expenses
    const expensesElement = document.getElementById('totalExpenses');
    if (expensesElement) {
        expensesElement.textContent = `$${totalExpenses.toFixed(2)}`;
    }

    // Update balance with color coding
    const balanceElement = document.getElementById('remainingBalance');
    if (balanceElement) {
        balanceElement.textContent = `$${remainingBalance.toFixed(2)}`;

        // Color coding based on balance
        if (remainingBalance < 0) {
            balanceElement.style.color = '#dc3545';
        } else if (remainingBalance > 0) {
            balanceElement.style.color = '#28a745';
        } else {
            balanceElement.style.color = '#6c757d';
        }
    }

    // Update transaction count if element exists
    const countElement = document.getElementById('transactionCount');
    if (countElement) {
        countElement.textContent = transactionCount;
    }

    // Update recent transactions if element exists
    updateRecentTransactions();
}

// Function to show loading state
function showLoadingState() {
    const elements = ['totalIncome', 'totalExpenses', 'remainingBalance'];
    elements.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = 'Loading...';
        }
    });
}

// Function to show error state
function showErrorState(message) {
    const elements = ['totalIncome', 'totalExpenses', 'remainingBalance'];
    elements.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = 'Error!';
            el.style.color = '#dc3545';
        }
    });
}

// Function to display recent transactions
async function updateRecentTransactions() {
    const recentContainer = document.getElementById('recentTransactions');
    if (!recentContainer) return;

    try {
        const response = await fetch(`${API_BASE_URL}/transactions`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) return;

        const data = await response.json();

        if (data.success && data.data) {
            const transactions = data.data;

            // Sort by date (newest first) and get last 5
            const recentTransactions = transactions
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, 5);

            if (recentTransactions.length === 0) {
                recentContainer.innerHTML = `
                    <div class="no-transactions">
                        <p>No transactions yet</p>
                    </div>
                `;
                return;
            }

            recentContainer.innerHTML = recentTransactions.map(transaction => `
                <div class="recent-transaction ${transaction.type.toLowerCase()}">
                    <div class="recent-transaction-info">
                        <span class="recent-transaction-type">
                            ${transaction.type === 'Income' ? '💰' : '💸'} ${transaction.type}
                        </span>
                        <span class="recent-transaction-description">
                            ${transaction.description}
                        </span>
                        <span class="recent-transaction-date">
                            ${new Date(transaction.date).toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            })}
                        </span>
                    </div>
                    <div class="recent-transaction-amount ${transaction.type.toLowerCase()}">
                        ${transaction.type === 'Income' ? '+' : '-'}$${transaction.amount.toFixed(2)}
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading recent transactions:', error);
    }
}

// Logout function
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
    window.location.href = '../LoginFiles/Login.html';
}

// Function to refresh dashboard data
async function refreshDashboard() {
    await updateDashboardSummary();
    showNotification('Dashboard updated!', 'success');
}

// Function to show notification
function showNotification(message, type = 'info') {
    const existingNotification = document.querySelector('.dashboard-notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = `dashboard-notification ${type}`;
    notification.innerHTML = `
        <i class="fa-solid ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Load dashboard when page loads
document.addEventListener('DOMContentLoaded', function () {
    // Check authentication
    if (!checkAuth()) return;

    // Load dashboard data
    updateDashboardSummary();

    // Setup logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
});

// Refresh dashboard when page gets focus
let lastRefreshTime = 0;
window.addEventListener('focus', () => {
    const now = Date.now();
    if (now - lastRefreshTime > 5000) {
        updateDashboardSummary();
        lastRefreshTime = now;
    }
});

// Refresh dashboard when coming back to page
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        updateDashboardSummary();
    }
});

// Add refresh button functionality
const refreshBtn = document.getElementById('refreshBtn');
if (refreshBtn) {
    refreshBtn.addEventListener('click', refreshDashboard);
}