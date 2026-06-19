function updateDashboardSummary() {
    // Step 1: Get transactions from Local Storage
    const storedTransactions = localStorage.getItem('transactions');
    let transactions = [];

    if (storedTransactions) {
        transactions = JSON.parse(storedTransactions);
    }

    // Step 2: Initialize variables for calculations
    let totalIncome = 0;
    let totalExpenses = 0;

    // Step 3: Loop through transactions using for loop
    for (let i = 0; i < transactions.length; i++) {
        const transaction = transactions[i];

        // Step 4: Use conditional statements to separate income and expenses
        if (transaction.type === 'Income') {
            totalIncome += transaction.amount;
        } else if (transaction.type === 'Expense') {
            totalExpenses += transaction.amount;
        }
    }

    // Step 5: Calculate remaining balance
    const remainingBalance = totalIncome - totalExpenses;

    // Step 6: Update DOM with calculated values
    document.getElementById('totalIncome').textContent = `$${totalIncome.toFixed(2)}`;
    document.getElementById('totalExpenses').textContent = `$${totalExpenses.toFixed(2)}`;
    document.getElementById('remainingBalance').textContent = `$${remainingBalance.toFixed(2)}`;

    // Optional: Change color based on balance
    const balanceElement = document.getElementById('remainingBalance');
    if (remainingBalance < 0) {
        balanceElement.style.color = 'red';
    } else if (remainingBalance > 0) {
        balanceElement.style.color = 'green';
    } else {
        balanceElement.style.color = 'black';
    }

    // Log calculations for verification
    console.log('Dashboard Summary Updated:');
    console.log(`Total Income: $${totalIncome.toFixed(2)}`);
    console.log(`Total Expenses: $${totalExpenses.toFixed(2)}`);
    console.log(`Remaining Balance: $${remainingBalance.toFixed(2)}`);
    console.log(`Total Transactions: ${transactions.length}`);
}

// Load and update dashboard when page loads
document.addEventListener('DOMContentLoaded', updateDashboardSummary);

// Update dashboard when user comes back to this page
window.addEventListener('focus', updateDashboardSummary);