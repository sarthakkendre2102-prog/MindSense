/**
 * ==========================================================================
 * MINDSENSE — AUTHENTICATION LOGIC (auth.js)
 * Handles client-side validation, localStorage user registration & login
 * ==========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  initRegistrationForm();
  initLoginForm();
});

/* --- Registration Form Handler --- */
function initRegistrationForm() {
  const regForm = document.getElementById('register-form');
  if (!regForm) return;

  const nameInput = document.getElementById('reg-name');
  const emailInput = document.getElementById('reg-email');
  const passInput = document.getElementById('reg-password');
  const confirmPassInput = document.getElementById('reg-confirm-password');
  const termsCheckbox = document.getElementById('reg-terms');
  const fillDemoBtn = document.getElementById('fill-demo-btn');

  // Demo auto-filler for presentation convenience
  if (fillDemoBtn) {
    fillDemoBtn.addEventListener('click', () => {
      nameInput.value = 'Sarthak Kendre';
      emailInput.value = 'sarthak@mindsense.ai';
      passInput.value = 'mindsense2026';
      confirmPassInput.value = 'mindsense2026';
      termsCheckbox.checked = true;
      clearErrors();
      MindSenseToast.show('Demo credentials loaded!', 'info');
    });
  }

  regForm.addEventListener('submit', (e) => {
    e.preventDefault();
    clearErrors();

    let isValid = true;
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passInput.value;
    const confirmPass = confirmPassInput.value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Validate Name
    if (!name) {
      showError(nameInput, 'Full name is required');
      isValid = false;
    }

    // Validate Email
    if (!email) {
      showError(emailInput, 'Email address is required');
      isValid = false;
    } else if (!emailRegex.test(email)) {
      showError(emailInput, 'Please enter a valid email address');
      isValid = false;
    }

    // Validate Password
    if (!password) {
      showError(passInput, 'Password is required');
      isValid = false;
    } else if (password.length < 6) {
      showError(passInput, 'Password must be at least 6 characters');
      isValid = false;
    }

    // Validate Confirm Password
    if (!confirmPass) {
      showError(confirmPassInput, 'Please confirm your password');
      isValid = false;
    } else if (password !== confirmPass) {
      showError(confirmPassInput, 'Passwords do not match');
      isValid = false;
    }

    // Validate Terms
    if (!termsCheckbox.checked) {
      const termsError = document.getElementById('terms-error');
      if (termsError) termsError.classList.add('visible');
      isValid = false;
    }

    if (!isValid) return;

    // Save registered user state
    const newUser = {
      fullName: name,
      email: email,
      password: password, // Note: In production Python backend, password will be hashed via bcrypt
      createdAt: new Date().toISOString()
    };

    MindSenseState.set(STORAGE_KEYS.USER, newUser);

    // Also prime profile state
    MindSenseState.set(STORAGE_KEYS.PROFILE, {
      displayName: name,
      age: 23,
      gender: 'Not specified',
      dailyReminder: '20:00',
      iotConnected: false
    });

    MindSenseToast.show('Account created successfully! Redirecting to login...', 'success');

    const submitBtn = regForm.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerText = 'Creating account...';
    }

    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1200);
  });
}

/* --- Login Form Handler --- */
function initLoginForm() {
  const loginForm = document.getElementById('login-form');
  if (!loginForm) return;

  const emailInput = document.getElementById('login-email');
  const passInput = document.getElementById('login-password');
  const fillDemoBtn = document.getElementById('fill-login-demo-btn');
  const forgotPassBtn = document.getElementById('forgot-password-link');

  // Pre-fill demo credentials
  if (fillDemoBtn) {
    fillDemoBtn.addEventListener('click', () => {
      const existingUser = MindSenseState.get(STORAGE_KEYS.USER);
      emailInput.value = existingUser ? existingUser.email : 'sarthak@mindsense.ai';
      passInput.value = existingUser ? (existingUser.password || 'mindsense2026') : 'mindsense2026';
      clearErrors();
      MindSenseToast.show('Demo credentials pre-filled!', 'info');
    });
  }

  // Forgot password simulation
  if (forgotPassBtn) {
    forgotPassBtn.addEventListener('click', (e) => {
      e.preventDefault();
      MindSenseToast.show('Password reset link sent to registered email (Simulated)', 'info');
    });
  }

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    clearErrors();

    const email = emailInput.value.trim();
    const password = passInput.value;
    let isValid = true;

    if (!email) {
      showError(emailInput, 'Email is required');
      isValid = false;
    }

    if (!password) {
      showError(passInput, 'Password is required');
      isValid = false;
    }

    if (!isValid) return;

    // Check stored user or accept demo credentials
    const storedUser = MindSenseState.get(STORAGE_KEYS.USER);
    const validEmail = storedUser ? storedUser.email.toLowerCase() : 'sarthak@mindsense.ai';

    if (storedUser && storedUser.email.toLowerCase() === email.toLowerCase()) {
      // User matched
      proceedToProfile(storedUser.fullName);
    } else if (email.toLowerCase() === 'sarthak@mindsense.ai' || email.includes('@')) {
      // Accept demo user
      const demoUser = {
        fullName: storedUser ? storedUser.fullName : 'Sarthak Kendre',
        email: email,
        createdAt: new Date().toISOString()
      };
      MindSenseState.set(STORAGE_KEYS.USER, demoUser);
      proceedToProfile(demoUser.fullName);
    } else {
      showError(emailInput, 'Invalid credentials. Please verify or use demo prefill.');
    }
  });

  function proceedToProfile(name) {
    MindSenseToast.show(`Welcome back, ${name}!`, 'success');
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerText = 'Authenticating...';
    }
    setTimeout(() => {
      window.location.href = 'profile.html';
    }, 1000);
  }
}

/* --- Validation Display Helpers --- */
function showError(inputElement, message) {
  inputElement.classList.add('is-invalid');
  const parent = inputElement.closest('.form-group');
  if (parent) {
    const errorEl = parent.querySelector('.form-error');
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.add('visible');
    }
  }
}

function clearErrors() {
  document.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
  document.querySelectorAll('.form-error').forEach(el => el.classList.remove('visible'));
}
