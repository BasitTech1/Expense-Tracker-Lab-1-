const loginForm = document.getElementById('loginForm');
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const errorMessage = document.getElementById('errorMessage');

// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

loginForm.addEventListener('submit', async function (event) {
    event.preventDefault();

    const email = loginEmail.value.trim();
    const password = loginPassword.value.trim();

    if (!email || !password) {
        errorMessage.textContent = 'Please enter both email and password';
        errorMessage.style.display = 'block';
        return;
    }

    try {
        // Show loading state
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Logging in...';
        submitBtn.disabled = true;

        // Send login request to backend
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        // Reset button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;

        // ✅ FIX: Check if response is ok before parsing JSON
        if (!response.ok) {
            // Try to get error message from response
            let errorMsg = 'Invalid email or password';
            try {
                const errorData = await response.json();
                if (errorData.message) {
                    errorMsg = errorData.message;
                }
            } catch (e) {
                // If response is not JSON, use status text
                errorMsg = response.statusText || 'Login failed';
            }

            errorMessage.textContent = errorMsg;
            errorMessage.style.display = 'block';
            loginPassword.value = '';
            return;
        }

        // ✅ Now parse JSON only if response is ok
        const data = await response.json();

        if (data.success) {
            // Store token and user data
            localStorage.setItem('token', data.data.token);
            localStorage.setItem('user', JSON.stringify(data.data.user));

            if (data.data.refreshToken) {
                localStorage.setItem('refreshToken', data.data.refreshToken);
            }

            errorMessage.style.display = 'none';

            // ✅ Check user role and redirect accordingly
            const userRole = data.data.user.role || 'user';

            if (userRole === 'admin') {
                window.location.href = '../AdminFiles/admin-dashboard.html';
            } else {
                window.location.href = '../DashboardFiles/dashboard.html';
            }
        } else {
            errorMessage.textContent = data.message || 'Invalid email or password';
            errorMessage.style.display = 'block';
            loginPassword.value = '';
        }
    } catch (error) {
        console.error('Login Error:', error);
        errorMessage.textContent = 'Network error. Please check your connection.';
        errorMessage.style.display = 'block';
    }
});

loginEmail.addEventListener('input', function () {
    errorMessage.style.display = 'none';
});

loginPassword.addEventListener('input', function () {
    errorMessage.style.display = 'none';
});

// Check if user is already logged in
document.addEventListener('DOMContentLoaded', function () {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData) {
        try {
            const user = JSON.parse(userData);
            // Redirect based on role
            if (user.role === 'admin') {
                window.location.href = '../AdminFiles/admin-dashboard.html';
            } else {
                window.location.href = '../DashboardFiles/dashboard.html';
            }
        } catch (e) {
            // If user data is corrupt, clear and go to login
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('refreshToken');
        }
    }
});