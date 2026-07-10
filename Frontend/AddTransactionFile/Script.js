// AddTransactionFile/Script.js

const API_BASE_URL = "http://localhost:5000/api";

// Get form and input elements
const transactionForm = document.getElementById("transactionForm");
const transactionType = document.getElementById("transactionType");
const amount = document.getElementById("amount");
const date = document.getElementById("date");
const description = document.getElementById("description");

// Set default date to today
date.value = new Date().toISOString().split("T")[0];

// Get current user ID from localStorage
function getUserId() {
  const userData = localStorage.getItem("user");
  if (userData) {
    try {
      const user = JSON.parse(userData);
      return user.id || user._id;
    } catch (e) {
      console.error("Error parsing user data:", e);
      return null;
    }
  }
  return null;
}

// Form submission handler
transactionForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  // ✅ Check if user is logged in
  const userId = getUserId();
  if (!userId) {
    showMessage("Please login first to add transactions", "error");
    setTimeout(() => {
      window.location.href = "../LoginFiles/Login.html";
    }, 1500);
    return;
  }

  // Validate amount
  if (!amount.value || parseFloat(amount.value) <= 0) {
    showMessage("Please enter a valid amount", "error");
    return;
  }

  // Validate description
  if (!description.value || description.value.trim() === "") {
    showMessage("Please enter a description", "error");
    return;
  }

  // Capture form values
  const type = transactionType.value;
  const amountValue = parseFloat(amount.value);
  const transactionDate = date.value;
  const descriptionValue = description.value.trim();

  // ✅ Create transaction object with userId
  const transactionData = {
    userId: userId, // ← ADD THIS
    type: type,
    amount: amountValue,
    category: type === "Income" ? "Salary" : "Food",
    date: transactionDate,
    description: descriptionValue,
  };

  console.log("📤 Sending transaction:", transactionData);

  // Show loading state
  const submitBtn = document.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = "Saving...";
  submitBtn.disabled = true;

  try {
    // ✅ Get auth token for the request
    const token = localStorage.getItem("token");

    const response = await fetch(`${API_BASE_URL}/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // ← ADD THIS
      },
      body: JSON.stringify(transactionData),
    });

    const data = await response.json();

    if (data.success) {
      // Show success message
      showMessage("Transaction added successfully! ✅", "success");

      // Reset form
      transactionForm.reset();
      date.value = new Date().toISOString().split("T")[0];

      // Redirect to transaction page after short delay
      setTimeout(() => {
        window.location.href = "../TransactionFile/transactions.html";
      }, 1500);
    } else {
      throw new Error(data.message || "Failed to add transaction");
    }
  } catch (error) {
    console.error("Error:", error);
    showMessage(
      error.message || "Failed to add transaction. Please try again.",
      "error",
    );
  } finally {
    // Reset button state
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  }
});

// Function to show messages
function showMessage(message, type = "info") {
  // Remove existing message
  const existingMessage = document.querySelector(".form-message");
  if (existingMessage) {
    existingMessage.remove();
  }

  // Create message element
  const messageDiv = document.createElement("div");
  messageDiv.className = `form-message ${type}`;
  messageDiv.innerHTML = `
        <i class="fa-solid ${type === "success" ? "fa-check-circle" : "fa-exclamation-circle"}"></i>
        <span>${message}</span>
    `;

  // Insert after form
  transactionForm.insertAdjacentElement("afterend", messageDiv);

  // Auto remove after 5 seconds for success, keep for errors
  if (type === "success") {
    setTimeout(() => {
      messageDiv.style.opacity = "0";
      setTimeout(() => messageDiv.remove(), 300);
    }, 5000);
  }
}

// Add input validation for amount
amount.addEventListener("input", function () {
  if (this.value < 0) {
    this.value = 0;
  }
});

// Prevent negative values
amount.addEventListener("keydown", function (e) {
  if (e.key === "-" || e.key === "e") {
    e.preventDefault();
  }
});
