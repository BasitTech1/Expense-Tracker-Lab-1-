// TransactionFile/script.js

// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Get the table body element
const transactionBody = document.getElementById('transactionBody');

// Store all transactions for filtering
let allTransactions = [];
let filteredTransactions = [];

// ✅ Check authentication
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '../LoginFiles/Login.html';
        return false;
    }
    return true;
}

// ✅ Get auth headers
function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// Function to fetch transactions from API
async function loadTransactions() {
    // ✅ Check authentication first
    if (!checkAuth()) return;

    try {
        // Show loading state
        if (transactionBody) {
            transactionBody.innerHTML = `
                <tr>
                    <td colspan="5" class="loading-text">Loading transactions...</td>
                </tr>
            `;
        }

        // ✅ Add authentication headers
        const response = await fetch(`${API_BASE_URL}/transactions`, {
            headers: getAuthHeaders()
        });

        // ✅ Handle 401 Unauthorized
        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '../LoginFiles/Login.html';
            return;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Check if data is successful
        if (!data.success) {
            throw new Error(data.message || 'Failed to fetch transactions');
        }

        // Get transactions array from response
        allTransactions = data.data || [];

        // Clear existing table rows
        if (transactionBody) {
            transactionBody.innerHTML = '';
        }

        // Check if there are any transactions
        if (allTransactions.length === 0) {
            showEmptyState();
            return;
        }

        // Display transactions (newest first)
        const sortedTransactions = allTransactions.sort((a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt)
        );

        allTransactions = sortedTransactions;
        filteredTransactions = [...allTransactions];

        // Render transactions
        renderTransactions(filteredTransactions);

        console.log(`✅ Loaded ${allTransactions.length} transactions`);

    } catch (error) {
        console.error('❌ Error loading transactions:', error);
        showErrorState(error.message);
    }
}

// Function to render transactions
function renderTransactions(transactions) {
    if (!transactionBody) return;

    // Clear existing table rows
    transactionBody.innerHTML = '';

    // Check if there are any transactions to display
    if (transactions.length === 0) {
        showEmptyState();
        return;
    }

    // Loop through transactions and create table rows
    transactions.forEach((transaction, index) => {
        const row = createTransactionRow(transaction, index);
        transactionBody.appendChild(row);
    });
}

// Function to create a transaction row
function createTransactionRow(transaction, index) {
    const row = document.createElement('tr');
    row.className = `transaction-row ${transaction.type.toLowerCase()}`;

    // Transaction ID (using index or _id)
    const idCell = document.createElement('td');
    const shortId = transaction._id ? transaction._id.slice(-4) : `T${index + 1}`;
    idCell.textContent = `#${shortId}`;
    idCell.className = 'transaction-id';

    // Date cell
    const dateCell = document.createElement('td');
    const dateObj = new Date(transaction.date);
    dateCell.textContent = dateObj.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });

    // Type cell
    const typeCell = document.createElement('td');
    typeCell.textContent = transaction.type;
    typeCell.className = `type-${transaction.type.toLowerCase()}`;

    // Amount cell
    const amountCell = document.createElement('td');
    amountCell.textContent = `$${transaction.amount.toFixed(2)}`;
    amountCell.className = transaction.type === 'Income' ? 'amount-income' : 'amount-expense';

    // Description cell
    const descCell = document.createElement('td');
    descCell.textContent = transaction.description || 'No description';

    // Append all cells
    row.appendChild(idCell);
    row.appendChild(dateCell);
    row.appendChild(typeCell);
    row.appendChild(amountCell);
    row.appendChild(descCell);

    return row;
}

// SEARCH FUNCTIONALITY
function setupSearch() {
    // Create search container
    const searchContainer = document.createElement('div');
    searchContainer.className = 'search-container';

    // Create search input
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.id = 'searchInput';
    searchInput.placeholder = 'Search transactions by ID, type, amount, or description...';

    // Create clear button
    const clearBtn = document.createElement('button');
    clearBtn.className = 'clear-search';
    clearBtn.id = 'clearSearch';
    clearBtn.innerHTML = '✕';
    clearBtn.style.display = 'none';

    // Add elements to container
    searchContainer.appendChild(searchInput);
    searchContainer.appendChild(clearBtn);

    // Insert search container before the table
    const table = document.getElementById('transactionTable');
    if (table && table.parentNode) {
        table.parentNode.insertBefore(searchContainer, table);
    }

    // Search event listener
    searchInput.addEventListener('input', function (e) {
        const searchTerm = this.value.toLowerCase().trim();

        // Show/hide clear button
        if (searchTerm.length > 0) {
            clearBtn.style.display = 'block';
            clearBtn.classList.add('visible');
        } else {
            clearBtn.style.display = 'none';
            clearBtn.classList.remove('visible');
        }

        // Filter transactions
        if (searchTerm === '') {
            filteredTransactions = [...allTransactions];
        } else {
            filteredTransactions = allTransactions.filter(transaction => {
                // Search in all fields
                const id = transaction._id ? transaction._id.toLowerCase() : '';
                const type = transaction.type.toLowerCase();
                const amount = transaction.amount.toString();
                const description = transaction.description ? transaction.description.toLowerCase() : '';
                const date = new Date(transaction.date).toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                });

                return id.includes(searchTerm) ||
                    type.includes(searchTerm) ||
                    amount.includes(searchTerm) ||
                    description.includes(searchTerm) ||
                    date.includes(searchTerm);
            });
        }

        // Render filtered transactions
        renderTransactions(filteredTransactions);

        // Show search results count
        showSearchResultsCount(filteredTransactions.length);
    });

    // Clear button event listener
    clearBtn.addEventListener('click', function () {
        searchInput.value = '';
        searchInput.dispatchEvent(new Event('input'));
        searchInput.focus();
    });

    // Keyboard shortcut: Ctrl+F or Cmd+F to focus search
    document.addEventListener('keydown', function (e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            searchInput.focus();
            searchInput.select();
        }
    });
}

// Function to show search results count
function showSearchResultsCount(count) {
    // Remove existing count
    const existingCount = document.querySelector('.search-count');
    if (existingCount) {
        existingCount.remove();
    }

    // Only show if there's a search term
    const searchInput = document.getElementById('searchInput');
    if (searchInput && searchInput.value.trim() !== '') {
        const countDiv = document.createElement('div');
        countDiv.className = 'search-count';
        countDiv.style.cssText = `
            margin-top: -10px;
            margin-bottom: 15px;
            font-size: 14px;
            color: #666;
        `;
        countDiv.textContent = `Showing ${count} result${count !== 1 ? 's' : ''}`;

        const table = document.getElementById('transactionTable');
        if (table && table.parentNode) {
            table.parentNode.insertBefore(countDiv, table);
        }
    }
}

// Function to show empty state
function showEmptyState() {
    if (transactionBody) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td colspan="5" class="no-transactions">
                <div class="empty-state">
                    <i class="fa-solid fa-inbox"></i>
                    <p>No transactions found</p>
                    <span>Add your first transaction by clicking the "Add Transaction" button</span>
                </div>
            </td>
        `;
        transactionBody.appendChild(emptyRow);
    }
}

// Function to show error state
function showErrorState(message) {
    if (transactionBody) {
        transactionBody.innerHTML = `
            <tr>
                <td colspan="5" class="error-state">
                    <div class="error-message">
                        <i class="fa-solid fa-circle-exclamation"></i>
                        <p>Failed to load transactions</p>
                        <span>${message}</span>
                    </div>
                </td>
            </tr>
        `;
    }
}

// Function to refresh transactions (for real-time updates)
async function refreshTransactions() {
    await loadTransactions();
    showNotification('Transactions updated!', 'success');
}

// Function to show notification
function showNotification(message, type = 'info') {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fa-solid ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(notification);

    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ✅ Logout function (if needed)
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
    window.location.href = '../LoginFiles/Login.html';
}

// Export functions for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        loadTransactions,
        refreshTransactions,
        setupSearch
    };
}

// Load transactions and setup search when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadTransactions();
    setupSearch();
});

// Optional: Reload transactions when page gets focus (tab switch)
let lastLoadTime = 0;
window.addEventListener('focus', () => {
    const now = Date.now();
    if (now - lastLoadTime > 5000) { // Only reload if 5 seconds have passed
        loadTransactions();
        lastLoadTime = now;
    }
});

// Handle page visibility change for real-time updates
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        loadTransactions();
    }
});