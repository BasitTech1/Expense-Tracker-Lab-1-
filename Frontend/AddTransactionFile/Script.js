// Get form and input elements
const transactionForm = document.getElementById('transactionForm');
const transactionType = document.getElementById('transactionType');
const amount = document.getElementById('amount');
const date = document.getElementById('date');
const description = document.getElementById('description');
const transactionsContainer = document.getElementById('transactionsContainer');

// Set default date to today
date.value = new Date().toISOString().split('T')[0];

// Function to display transactions
function displayTransactions() {
    // Get transactions from Local Storage
    const storedTransactions = localStorage.getItem('transactions');
    let transactions = [];

    if (storedTransactions) {
        transactions = JSON.parse(storedTransactions);
    }

    // Clear container
    transactionsContainer.innerHTML = '';

    if (transactions.length === 0) {
        transactionsContainer.innerHTML = '<div class="no-transactions">No transactions yet. Add your first transaction!</div>';
        return;
    }

    // Display last 10 transactions (newest first)
    const recentTransactions = transactions.slice(-10).reverse();

    recentTransactions.forEach(transaction => {
        const transactionDiv = document.createElement('div');
        transactionDiv.className = `transaction-item ${transaction.type.toLowerCase()}`;

        transactionDiv.innerHTML = `
                    <div class="transaction-details">
                        <span><strong>${transaction.type}</strong></span>
                        <span>${transaction.date}</span>
                        <span>${transaction.description}</span>
                    </div>
                    <div class="transaction-amount">
                        ${transaction.type === 'Income' ? '+' : '-'}$${transaction.amount.toFixed(2)}
                    </div>
                `;

        transactionsContainer.appendChild(transactionDiv);
    });
}

// Display transactions on page load
displayTransactions();

// Form submission handler
transactionForm.addEventListener('submit', function (event) {
    event.preventDefault();

    // Validate amount
    if (!amount.value || parseFloat(amount.value) <= 0) {
        alert('Please enter a valid amount');
        return;
    }

    // Capture form values
    const type = transactionType.value;
    const amountValue = parseFloat(amount.value);
    const transactionDate = date.value;
    const descriptionValue = description.value.trim() || 'No description';

    // Create transaction object
    const transaction = {
        id: Date.now(),
        type: type,
        amount: amountValue,
        category: type === 'Income' ? 'Salary' : 'Food',
        date: transactionDate,
        description: descriptionValue,
        createdAt: new Date().toISOString()
    };

    // Get existing transactions from Local Storage
    let transactions = [];
    const storedTransactions = localStorage.getItem('transactions');

    if (storedTransactions) {
        transactions = JSON.parse(storedTransactions);
    }

    // Add new transaction to array
    transactions.push(transaction);

    // Store updated transactions in Local Storage
    localStorage.setItem('transactions', JSON.stringify(transactions));

    // Show success message
    alert('Transaction added successfully!');

    // Reset form
    transactionForm.reset();
    date.value = new Date().toISOString().split('T')[0];

    // Refresh the transaction display
    displayTransactions();

    // Log to console for verification
    console.log('Transaction saved:', transaction);
});