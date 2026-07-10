// Get all form elements
const form = document.getElementById('signupForm');
const fullName = document.getElementById('fullName');
const email = document.getElementById('email');
const password = document.getElementById('password');
const confirmPassword = document.getElementById('confirmPassword');
const terms = document.getElementById('terms');

// Get error message elements
const nameError = document.getElementById('nameError');
const emailError = document.getElementById('emailError');
const passwordError = document.getElementById('passwordError');
const confirmError = document.getElementById('confirmError');
const termsError = document.getElementById('termsError');

// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Function to validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Function to show error message
function showError(errorElement, inputElement) {
    errorElement.classList.add('show');
    if (inputElement) {
        inputElement.parentElement.classList.add('error');
        inputElement.parentElement.classList.remove('success');
    }
}

// Function to hide error message
function hideError(errorElement, inputElement) {
    errorElement.classList.remove('show');
    if (inputElement) {
        inputElement.parentElement.classList.remove('error');
        inputElement.parentElement.classList.add('success');
    }
}

// Real-time validation for name
fullName.addEventListener('input', function () {
    if (this.value.trim() === '') {
        showError(nameError, this);
    } else {
        hideError(nameError, this);
    }
});

// Real-time validation for email
email.addEventListener('input', function () {
    if (!isValidEmail(this.value)) {
        showError(emailError, this);
    } else {
        hideError(emailError, this);
    }
});

// Real-time validation for password
password.addEventListener('input', function () {
    if (this.value.length < 6) {
        showError(passwordError, this);
    } else {
        hideError(passwordError, this);
    }
    if (confirmPassword.value.length > 0) {
        if (this.value !== confirmPassword.value) {
            showError(confirmError, confirmPassword);
        } else {
            hideError(confirmError, confirmPassword);
        }
    }
});

// Real-time validation for confirm password
confirmPassword.addEventListener('input', function () {
    if (this.value !== password.value) {
        showError(confirmError, this);
    } else if (this.value.length > 0 && this.value === password.value) {
        hideError(confirmError, this);
    }
});

// Real-time validation for terms checkbox
terms.addEventListener('change', function () {
    if (!this.checked) {
        showError(termsError);
    } else {
        hideError(termsError);
    }
});

// Form submission handler
form.addEventListener('submit', async function (event) {
    event.preventDefault();

    let hasError = false;

    // Validate Full Name
    if (fullName.value.trim() === '') {
        showError(nameError, fullName);
        hasError = true;
    } else {
        hideError(nameError, fullName);
    }

    // Validate Email
    if (!isValidEmail(email.value)) {
        showError(emailError, email);
        hasError = true;
    } else {
        hideError(emailError, email);
    }

    // Validate Password
    if (password.value.length < 6) {
        showError(passwordError, password);
        hasError = true;
    } else {
        hideError(passwordError, password);
    }

    // Validate Confirm Password
    if (password.value !== confirmPassword.value) {
        showError(confirmError, confirmPassword);
        hasError = true;
    } else {
        hideError(confirmError, confirmPassword);
    }

    // Validate Terms and Conditions
    if (!terms.checked) {
        showError(termsError);
        hasError = true;
    } else {
        hideError(termsError);
    }

    if (hasError) {
        alert('Please fix all errors before submitting the form.');
        return false;
    }

    // Prepare user data for API
    const userData = {
        fullName: fullName.value.trim(),
        email: email.value.trim(),
        password: password.value,
        confirmPassword: confirmPassword.value,
        gender: document.getElementById('gender').value,
        country: document.getElementById('country').value || 'Pakistan',  // Default if empty
        role: document.getElementById('role').value || 'user',
        termsAccepted: terms.checked
    };

    console.log('📤 Sending:', userData);  // Debug: See what's being sent

    try {
        // Show loading state
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Registering...';
        submitBtn.disabled = true;

        // Send registration request to backend
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        console.log('📥 Response Status:', response.status);  // Debug: See status code

        const data = await response.json();
        console.log('📥 Response Data:', data);  // Debug: See full response

        // Reset button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;

        if (data.success) {
            // Store token and user data in localStorage
            localStorage.setItem('token', data.data.token);
            localStorage.setItem('user', JSON.stringify(data.data.user));

            alert('Registration successful! Redirecting to dashboard...');
            window.location.href = '../DashboardFiles/dashboard.html';
        } else {
            // Show detailed error message
            let errorMsg = data.message || 'Registration failed. Please try again.';

            // If there are validation errors
            if (data.errors && data.errors.length > 0) {
                errorMsg = data.errors.map(e => `- ${e.message}`).join('\n');
            }

            alert(errorMsg);
        }
    } catch (error) {
        console.error('❌ Registration Error:', error);
        alert('Network error. Please check your connection and try again.');

        // Reset button
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.textContent = 'Sign Up';
            submitBtn.disabled = false;
        }
    }
});

// Input listeners to clear errors on focus
const allInputs = [fullName, email, password, confirmPassword];
allInputs.forEach(input => {
    input.addEventListener('focus', function () {
        this.parentElement.classList.remove('error');
    });
});

terms.addEventListener('click', function () {
    if (this.checked) {
        hideError(termsError);
    }
});