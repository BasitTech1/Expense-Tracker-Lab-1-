// ProfileFiles/script.js

// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Check if user is authenticated
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
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

// Get current user data
function getCurrentUser() {
    const userData = localStorage.getItem('user');
    if (userData) {
        try {
            return JSON.parse(userData);
        } catch (e) {
            return null;
        }
    }
    return null;
}

// Load user profile data
async function loadProfile() {
    if (!checkAuth()) return;

    try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: getAuthHeaders()
        });

        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '../LoginFiles/Login.html';
            return;
        }

        if (!response.ok) {
            throw new Error('Failed to load profile');
        }

        const data = await response.json();

        if (data.success) {
            const user = data.data;
            // Update form fields
            document.getElementById('fullName').value = user.fullName || '';
            document.getElementById('email').value = user.email || '';
            document.getElementById('gender').value = user.gender || 'Male';
            document.getElementById('country').value = user.country || 'Pakistan';
            document.getElementById('role').value = user.role || 'user';

            // Format member since date
            if (user.createdAt) {
                const date = new Date(user.createdAt);
                document.getElementById('memberSince').value = date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            }

            // Update stored user data
            localStorage.setItem('user', JSON.stringify(user));
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        showNotification('Failed to load profile data', 'error');
    }
}

// Toggle edit mode
function toggleEdit() {
    const editActions = document.getElementById('editActions');
    const editBtn = document.querySelector('.edit-toggle');

    // Enable only editable fields (NOT email, role, memberSince)
    document.getElementById('fullName').disabled = false;
    document.getElementById('gender').disabled = false;
    document.getElementById('country').disabled = false;

    // Add editable class for styling
    document.getElementById('fullName').classList.add('editable');
    document.getElementById('gender').classList.add('editable');
    document.getElementById('country').classList.add('editable');

    editActions.style.display = 'flex';
    editBtn.style.display = 'none';

    // Focus on first input
    document.getElementById('fullName').focus();
}

// Cancel edit mode
function cancelEdit() {
    const editActions = document.getElementById('editActions');
    const editBtn = document.querySelector('.edit-toggle');

    // Disable editable fields
    document.getElementById('fullName').disabled = true;
    document.getElementById('gender').disabled = true;
    document.getElementById('country').disabled = true;

    document.getElementById('fullName').classList.remove('editable');
    document.getElementById('gender').classList.remove('editable');
    document.getElementById('country').classList.remove('editable');

    editActions.style.display = 'none';
    editBtn.style.display = 'flex';

    // Clear error states
    document.querySelectorAll('#profileForm .form-group').forEach(group => {
        group.classList.remove('error', 'success');
    });
    document.querySelectorAll('#profileForm .error-message').forEach(msg => {
        msg.classList.remove('show');
    });

    // Reload original data
    loadProfile();
}

// Update profile
document.getElementById('profileForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    let hasError = false;

    // Validate full name
    const fullName = document.getElementById('fullName');
    if (fullName.value.trim() === '') {
        showError('nameError', fullName);
        hasError = true;
    } else {
        hideError('nameError', fullName);
    }

    if (hasError) {
        showNotification('Please fix all errors before saving', 'error');
        return;
    }

    const userData = {
        fullName: fullName.value.trim(),
        gender: document.getElementById('gender').value,
        country: document.getElementById('country').value
    };

    try {
        const submitBtn = this.querySelector('.btn-save');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

        const response = await fetch(`${API_BASE_URL}/auth/update-profile`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Save Changes';

        if (data.success) {
            // Update stored user data
            const currentUser = getCurrentUser();
            if (currentUser) {
                currentUser.fullName = userData.fullName;
                currentUser.gender = userData.gender;
                currentUser.country = userData.country;
                localStorage.setItem('user', JSON.stringify(currentUser));
            }

            showNotification('Profile updated successfully!', 'success');
            cancelEdit();
        } else {
            showNotification(data.message || 'Failed to update profile', 'error');
        }
    } catch (error) {
        console.error('Update error:', error);
        showNotification('Network error. Please try again.', 'error');
        const submitBtn = this.querySelector('.btn-save');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-check"></i> Save Changes';
    }
});

// Change password
document.getElementById('passwordForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    let hasError = false;

    // Validate current password
    const currentPassword = document.getElementById('currentPassword');
    if (currentPassword.value.trim() === '') {
        showError('currentPasswordError', currentPassword);
        hasError = true;
    } else {
        hideError('currentPasswordError', currentPassword);
    }

    // Validate new password
    const newPassword = document.getElementById('newPassword');
    if (newPassword.value.length < 6) {
        showError('newPasswordError', newPassword);
        hasError = true;
    } else {
        hideError('newPasswordError', newPassword);
    }

    // Validate confirm password
    const confirmPassword = document.getElementById('confirmNewPassword');
    if (confirmPassword.value !== newPassword.value) {
        showError('confirmNewPasswordError', confirmPassword);
        hasError = true;
    } else {
        hideError('confirmNewPasswordError', confirmPassword);
    }

    if (hasError) {
        showNotification('Please fix all errors before changing password', 'error');
        return;
    }

    const passwordData = {
        currentPassword: currentPassword.value,
        newPassword: newPassword.value
    };

    try {
        const submitBtn = this.querySelector('.btn-save');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Changing...';

        const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(passwordData)
        });

        const data = await response.json();

        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-key"></i> Change Password';

        if (data.success) {
            showNotification('Password changed successfully!', 'success');
            this.reset();
            // Clear error states
            document.querySelectorAll('#passwordForm .form-group').forEach(group => {
                group.classList.remove('error', 'success');
            });
            document.querySelectorAll('#passwordForm .error-message').forEach(msg => {
                msg.classList.remove('show');
            });
            // Clear password strength
            document.getElementById('passwordStrength').textContent = '';
            document.getElementById('passwordStrength').className = 'password-strength';
        } else {
            showNotification(data.message || 'Failed to change password', 'error');
        }
    } catch (error) {
        console.error('Password change error:', error);
        showNotification('Network error. Please try again.', 'error');
        const submitBtn = this.querySelector('.btn-save');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-key"></i> Change Password';
    }
});

// Toggle password visibility
function togglePassword(fieldId) {
    const input = document.getElementById(fieldId);
    const icon = input.parentElement.querySelector('.toggle-password i');

    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fa-solid fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fa-solid fa-eye';
    }
}

// Password strength indicator
document.getElementById('newPassword').addEventListener('input', function () {
    const strengthEl = document.getElementById('passwordStrength');
    const password = this.value;

    if (password.length === 0) {
        strengthEl.textContent = '';
        strengthEl.className = 'password-strength';
        return;
    }

    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 2) {
        strengthEl.textContent = 'Weak';
        strengthEl.className = 'password-strength weak';
    } else if (strength <= 4) {
        strengthEl.textContent = 'Medium';
        strengthEl.className = 'password-strength medium';
    } else {
        strengthEl.textContent = 'Strong';
        strengthEl.className = 'password-strength strong';
    }
});

// Show error function
function showError(errorId, inputElement) {
    const errorEl = document.getElementById(errorId);
    if (errorEl) {
        errorEl.classList.add('show');
    }
    if (inputElement) {
        const formGroup = inputElement.closest('.form-group');
        if (formGroup) {
            formGroup.classList.add('error');
            formGroup.classList.remove('success');
        }
    }
}

// Hide error function
function hideError(errorId, inputElement) {
    const errorEl = document.getElementById(errorId);
    if (errorEl) {
        errorEl.classList.remove('show');
    }
    if (inputElement) {
        const formGroup = inputElement.closest('.form-group');
        if (formGroup) {
            formGroup.classList.remove('error');
            formGroup.classList.add('success');
        }
    }
}

// Show notification
function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    if (!notification) return;

    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'flex';

    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            notification.style.display = 'none';
            notification.classList.remove('fade-out');
        }, 300);
    }, 3000);
}

// Logout function
async function logoutUser(event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    try {
        const token = localStorage.getItem('token');
        if (token) {
            await fetch(`${API_BASE_URL}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        }
    } catch (error) {
        console.error('Logout error:', error);
    }

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
    window.location.href = '../IndexFiles/Index.html';
}

// Load profile when page loads
document.addEventListener('DOMContentLoaded', function () {
    if (checkAuth()) {
        loadProfile();
    }
});

// Real-time validation for profile form
document.getElementById('fullName').addEventListener('input', function () {
    if (this.value.trim() === '') {
        showError('nameError', this);
    } else {
        hideError('nameError', this);
    }
});

// Real-time validation for password form
document.getElementById('currentPassword').addEventListener('input', function () {
    if (this.value.trim() === '') {
        showError('currentPasswordError', this);
    } else {
        hideError('currentPasswordError', this);
    }
});

document.getElementById('newPassword').addEventListener('input', function () {
    if (this.value.length < 6) {
        showError('newPasswordError', this);
    } else {
        hideError('newPasswordError', this);
    }

    // Check confirm password
    const confirm = document.getElementById('confirmNewPassword');
    if (confirm.value.length > 0) {
        if (confirm.value !== this.value) {
            showError('confirmNewPasswordError', confirm);
        } else {
            hideError('confirmNewPasswordError', confirm);
        }
    }
});

document.getElementById('confirmNewPassword').addEventListener('input', function () {
    const newPassword = document.getElementById('newPassword');
    if (this.value !== newPassword.value) {
        showError('confirmNewPasswordError', this);
    } else {
        hideError('confirmNewPasswordError', this);
    }
});