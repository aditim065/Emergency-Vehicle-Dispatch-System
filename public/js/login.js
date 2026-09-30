// ✅ Login & Signup combined (dynamic user, driver, admin)
document.getElementById("signupForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = e.target.name.value.trim();
  const password = e.target.password.value.trim();
  const msg = document.getElementById("msg");

  msg.textContent = "";
  msg.className = "";

  // Username validation
  const usernameRegex = /^[a-zA-Z0-9@_]{1,12}$/;
  if (!usernameRegex.test(name)) {
    msg.textContent = "Username must be 1-12 characters long and can only contain letters, numbers, @, and _";
    msg.className = "error";
    return;
  }

  const regex =
    /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9])(?!.*[^A-Za-z0-9].*[^A-Za-z0-9]).{8}$/;

  if (!regex.test(password)) {
    msg.textContent =
      "Password must be exactly 8 characters long with 1 uppercase, 1 lowercase, 1 number, and exactly 1 special character.";
    msg.className = "error";
    return;
  }

  try {
    const backendURL = "http://localhost:3000/authenticate";
    const response = await fetch(
      `${backendURL}?username=${encodeURIComponent(name)}&password=${encodeURIComponent(password)}`
    );

    const data = await response.json();
    console.log("🔹 Server response:", data);

    if (response.ok && data.result === "success") {
      msg.textContent = "Login successful! Redirecting...";
      msg.className = "success";

      try {
        if (data.token) localStorage.setItem("token", data.token);
        if (data.role) localStorage.setItem("role", data.role);
        if (data.id) localStorage.setItem("id", data.id);
        if (name) localStorage.setItem("username", name);
      } catch {}

      // ✅ Redirect user based on their role
      setTimeout(() => {
        if (data.role === "admin") {
          window.location.href = "admin.html";
        } else if (data.role === "driver") {
          window.location.href = "driver.html";
        } else if (data.role === "user") {
          window.location.href = "user.html";
        } else {
          msg.textContent = "Unknown role, cannot redirect.";
          msg.className = "error";
        }
      }, 1500);
    } else {
      msg.textContent = data.error || "Invalid credentials.";
      msg.className = "error";
    }
  } catch (err) {
    console.error("Error connecting to backend:", err);
    msg.textContent = "Server not reachable on port 3000.";
    msg.className = "error";
  }
});

// Add input event listener for username validation
const usernameInput = document.querySelector('input[name="name"]');
usernameInput.addEventListener('input', (e) => {
  const value = e.target.value;
  const msg = document.getElementById("msg");
  
  if (value.length > 12) {
    e.target.value = value.slice(0, 12); // Limit to 12 characters
    msg.textContent = "Username cannot exceed 12 characters";
    msg.className = "error";
  } else {
    const invalidChars = value.match(/[^a-zA-Z0-9@_]/g);
    if (invalidChars) {
      msg.textContent = "Username can only contain letters, numbers, @, and _";
      msg.className = "error";
    } else {
      msg.textContent = "";
      msg.className = "";
    }
  }
});

// ✅ Live password hint
const passInput = document.querySelector('input[name="password"]');
const hint = document.getElementById("passwordHint");

passInput.addEventListener("input", () => {
  const value = passInput.value;
  const hasUpper = /[A-Z]/.test(value);
  const hasLower = /[a-z]/.test(value);
  const hasDigit = /\d/.test(value);
  const specials = (value.match(/[^A-Za-z0-9]/g) || []).length;

  if (value.length === 0) hint.textContent = "";
  else if (value.length < 8) hint.textContent = "Password must be exactly 8 characters long.";
  else if (value.length > 8) hint.textContent = "Password should not exceed 8 characters.";
  else if (!hasUpper) hint.textContent = "Add at least one uppercase letter.";
  else if (!hasLower) hint.textContent = "Add at least one lowercase letter.";
  else if (!hasDigit) hint.textContent = "Add at least one number.";
  else if (specials === 0) hint.textContent = "Add one special character.";
  else if (specials > 1) hint.textContent = "Only one special character is allowed.";
  else hint.textContent = "Strong password created!";
});

// ✅ Toggle show/hide password
const togglePassword = document.getElementById("togglePassword");
const passwordField = document.getElementById("password");

// Add the eye icon (it's already in the HTML, but we'll handle the classes here)
togglePassword.innerHTML = '<i class="fas fa-eye-slash"></i><i class="fas fa-eye"></i>';

// Initial state
let isPasswordVisible = false;

// Toggle password visibility
function togglePasswordVisibility() {
  isPasswordVisible = !isPasswordVisible;
  passwordField.type = isPasswordVisible ? "text" : "password";
  
  // Toggle the show-password class
  if (isPasswordVisible) {
    togglePassword.classList.add('show-password');
    togglePassword.setAttribute('aria-pressed', 'true');
  } else {
    togglePassword.classList.remove('show-password');
    togglePassword.setAttribute('aria-pressed', 'false');
  }
  
  // Add a subtle animation
  const icon = togglePassword.querySelector('i');
  icon.style.transform = 'scale(1.2)';
  setTimeout(() => {
    icon.style.transform = 'scale(1)';
  }, 150);
}

// Add click event
togglePassword.addEventListener('click', togglePasswordVisibility);

// Handle keyboard events for accessibility
togglePassword.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    togglePasswordVisibility();
  }
});

// Make sure the button is accessible
togglePassword.setAttribute('role', 'button');
togglePassword.setAttribute('tabindex', '0');