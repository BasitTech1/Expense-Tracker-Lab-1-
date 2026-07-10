// IndexFiles/script.js
import apiService from '../Services/api.js';

// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Check if user is authenticated
function isAuthenticated() {
    const token = localStorage.getItem('token');
    return !!token;
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

// Check if user is admin
function isAdmin() {
    const user = getCurrentUser();
    return user && user.role === 'admin';
}

// Update navigation based on authentication status
function updateNavigation() {
    const navBtn1 = document.querySelector('.nav-btn1');
    const navBtn2 = document.querySelector('.nav-btn2');

    // Check if user is authenticated
    if (isAuthenticated()) {
        const user = getCurrentUser();
        const isUserAdmin = isAdmin();

        // Build navigation links
        let navLinks = `
            <a href="../IndexFiles/Index.html">Home</a>
            <a href="../DashboardFiles/dashboard.html">Dashboard</a>
        `;

        // Add Admin link if user is admin
        if (isUserAdmin) {
            navLinks += `
                <a href="../AdminFiles/admin-dashboard.html" style="color: orange; font-weight: 600;">
                    <i class="fa-solid fa-shield-halved"></i> Admin Panel
                </a>
            `;
        }

        navBtn1.innerHTML = navLinks;

        // Replace SignUp button with Profile
        if (navBtn2) {
            const displayName = user?.fullName ? user.fullName.split(' ')[0] : 'User';
            const userInitial = user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U';

            navBtn2.innerHTML = `
                <div class="profile-dropdown">
                    <button class="profile-btn" onclick="window.toggleDropdown()">
                        <span class="user-avatar">${userInitial}</span>
                        <span class="user-name">${displayName}</span>
                        <i class="fa-solid fa-chevron-down"></i>
                    </button>
                    <div class="dropdown-menu" id="dropdownMenu">
                        <a href="../DashboardFiles/dashboard.html">
                            <i class="fa-solid fa-gauge-high"></i>
                            Dashboard
                        </a>
                        ${isUserAdmin ? `
                        <a href="../AdminFiles/admin-dashboard.html">
                            <i class="fa-solid fa-shield-halved"></i>
                            Admin Panel
                        </a>
                        ` : ''}
                        <a href="../ProfileFiles/profile.html">
                            <i class="fa-solid fa-user-gear"></i>
                            Profile Settings
                        </a>
                        <hr>
                        <a href="#" onclick="window.logout(event)">
                            <i class="fa-solid fa-right-from-bracket"></i>
                            Logout
                        </a>
                    </div>
                </div>
            `;
        }
    } else {
        // User is not logged in
        navBtn1.innerHTML = `
            <a href="../IndexFiles/Index.html">Home</a>
            <a href="#">Features</a>
        `;

        navBtn2.innerHTML = `
            <a class="btn1" href="../SignUpFiles/Signup.html">
                <span>Sign Up</span>
                <i class="fa-regular fa-user"></i>
            </a>
        `;
    }
}

// Toggle dropdown menu
window.toggleDropdown = function () {
    const dropdown = document.getElementById('dropdownMenu');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
};

// Logout user
window.logoutUser = async function (event) {
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
};

// Close dropdown when clicking outside
document.addEventListener('click', function (event) {
    const dropdown = document.getElementById('dropdownMenu');
    const profileBtn = document.querySelector('.profile-btn');

    if (dropdown && profileBtn) {
        if (!profileBtn.contains(event.target) && !dropdown.contains(event.target)) {
            dropdown.classList.remove('show');
        }
    }
});

// Initialize navigation when page loads
document.addEventListener('DOMContentLoaded', function () {
    updateNavigation();
});

// Check authentication status when page becomes visible
document.addEventListener('visibilitychange', function () {
    if (!document.hidden) {
        updateNavigation();
    }
});

window.addEventListener('focus', function () {
    updateNavigation();
});