// Get the table body element
const transactionBody = document.getElementById('transactionBody');

// Function to load and display transactions
function loadTransactions() {
    // Step 1: Get transactions from Local Storage
    const storedTransactions = localStorage.getItem('transactions');
    let transactions = [];

    if (storedTransactions) {
        transactions = JSON.parse(storedTransactions);
    }

    // Step 2: Clear existing table rows
    transactionBody.innerHTML = '';

    // Step 3: Check if there are any transactions
    if (transactions.length === 0) {
        // Show message when no transactions exist
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
                    <td colspan="5" class="no-transactions">No transactions found. Add your first transaction!</td>
                `;
        transactionBody.appendChild(emptyRow);
        return;
    }

    // Step 4: Loop through transactions and create table rows
    // Display transactions in reverse order (newest first)
    const reversedTransactions = transactions.slice().reverse();

    // Using for loop to iterate through transactions
    for (let i = 0; i < reversedTransactions.length; i++) {
        const transaction = reversedTransactions[i];

        // Step 5: Create a new table row using createElement()
        const row = document.createElement('tr');
        row.className = `transaction-row ${transaction.type.toLowerCase()}`;

        // Step 6: Create table data cells using createElement()
        // Transaction ID cell
        const idCell = document.createElement('td');
        idCell.textContent = `#${transaction.id.toString().slice(-4)}`;

        // Date cell
        const dateCell = document.createElement('td');
        // Format date to be more readable
        const dateObj = new Date(transaction.date);
        dateCell.textContent = dateObj.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });

        // Type cell
        const typeCell = document.createElement('td');
        typeCell.textContent = transaction.type;

        // Amount cell
        const amountCell = document.createElement('td');
        amountCell.textContent = `$${transaction.amount.toFixed(2)}`;
        amountCell.className = transaction.type === 'Income' ? 'amount-income' : 'amount-expense';

        // Description cell
        const descCell = document.createElement('td');
        descCell.textContent = transaction.description;

        // Step 7: Append all cells to the row using appendChild()
        row.appendChild(idCell);
        row.appendChild(dateCell);
        row.appendChild(typeCell);
        row.appendChild(amountCell);
        row.appendChild(descCell);

        // Step 8: Append the row to the table body using appendChild()
        transactionBody.appendChild(row);
    }

    // Display total count of transactions
    console.log(`Total transactions loaded: ${transactions.length}`);
}

// Load transactions when page loads
document.addEventListener('DOMContentLoaded', loadTransactions);

// Optional: Reload transactions when coming back from Add Transaction page
window.addEventListener('focus', loadTransactions);