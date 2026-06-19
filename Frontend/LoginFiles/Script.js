const loginForm = document.getElementById('loginForm');
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const errorMessage = document.getElementById('errorMessage');

loginForm.addEventListener('submit', function (event) {
    event.preventDefault();

    // Get stored user data from Local Storage
    const storedUserData = localStorage.getItem('userData');

    if (storedUserData) {
        // Parse the JSON string back to object
        const userData = JSON.parse(storedUserData);

        const enteredEmail = loginEmail.value.trim();
        const enteredPassword = loginPassword.value.trim();

        // Compare with stored data
        if (enteredEmail === userData.email && enteredPassword === userData.password) {
            errorMessage.style.display = 'none';
            alert(`Login successful! Welcome ${userData.name}`);
            // window.location.href = 'dashboard.html';
        } else {
            errorMessage.style.display = 'block';
            loginPassword.value = '';
        }
    } else {
        errorMessage.textContent = 'No registered user found. Please sign up first!';
        errorMessage.style.display = 'block';
    }
});

loginEmail.addEventListener('input', function () {
    errorMessage.style.display = 'none';
});

loginPassword.addEventListener('input', function () {
    errorMessage.style.display = 'none';
});