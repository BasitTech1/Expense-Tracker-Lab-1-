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
form.addEventListener('submit', function (event) {
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

    // --- TASK 4: STORE USER DATA IN LOCAL STORAGE ---

    // Create user object with registration data
    const userData = {
        name: fullName.value.trim(),
        email: email.value.trim(),
        password: password.value,
        gender: document.getElementById('gender').value,
        country: document.getElementById('country').value,
        registeredAt: new Date().toISOString()
    };

    // Store user data in Local Storage using JSON.stringify()
    localStorage.setItem('userData', JSON.stringify(userData));

    // Also store individual items for login validation (optional)
    localStorage.setItem('userEmail', userData.email);
    localStorage.setItem('userPassword', userData.password);
    localStorage.setItem('userName', userData.name);

    // Show success message
    alert('Registration successful! User data saved in Local Storage.');

    // Optional: Redirect to login page
    // window.location.href = '../LoginFiles/Login.html';

    // Log the stored data to console for verification
    console.log('User data saved:', userData);
    console.log('Stored data in localStorage:', JSON.parse(localStorage.getItem('userData')));

    // Reset form after successful registration
    // this.reset();
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