/**
 * Jaladhar Auth Module - Comprehensive Test Script
 * Tests all authentication endpoints for User, Vendor, and Admin
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000';
const API_BASE = `${BASE_URL}/api`;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Test results storage
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  errors: []
};

// Helper functions
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName, status, message = '') {
  testResults.total++;
  if (status === 'PASS') {
    testResults.passed++;
    log(`✅ [PASS] ${testName}`, 'green');
  } else {
    testResults.failed++;
    testResults.errors.push({ test: testName, error: message });
    log(`❌ [FAIL] ${testName}`, 'red');
    if (message) log(`   Error: ${message}`, 'red');
  }
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  log('='.repeat(60), 'cyan');
}

// Generate unique test data with consistent base
// Use fixed test emails to avoid mismatches - can be overridden with TEST_ID env var
const testId = process.env.TEST_ID || 'test';
const testData = {
  user: {
    name: 'Test User',
    email: `testuser.${testId}@example.com`,
    phone: `1234567890`,
    password: 'password123'
  },
  vendor: {
    name: 'Test Vendor',
    email: `testvendor.${testId}@example.com`,
    phone: `9876543210`,
    password: 'password123',
    experience: 5,
    bankDetails: {
      accountHolderName: 'Test Vendor',
      accountNumber: '1234567890',
      ifscCode: 'ABCD0123456',
      bankName: 'Test Bank',
      branchName: 'Test Branch'
    },
    educationalQualifications: [
      {
        degree: 'B.Tech',
        institution: 'Test University',
        year: 2020,
        percentage: 85
      }
    ],
    address: {
      street: '123 Test Street',
      city: 'Test City',
      state: 'Test State',
      pincode: '123456'
    }
  },
  admin: {
    email: 'admin@jaladhar.com',
    password: 'admin123'
  }
};

// Store tokens and IDs for subsequent tests
let userToken = null;
let vendorToken = null;
let adminToken = null;
let userId = null;
let vendorId = null;
let userEmail = null;
let vendorEmail = null;
let adminEmail = null; // Store registered admin email
let emailOTP = null;

// ==================== HEALTH CHECK ====================
async function testHealthCheck() {
  logSection('1. HEALTH CHECK');
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    if (response.data.success) {
      logTest('Health Check', 'PASS');
      log(`   Server: ${response.data.message}`, 'blue');
      log(`   Timestamp: ${response.data.timestamp}`, 'blue');
    } else {
      logTest('Health Check', 'FAIL', 'Unexpected response format');
    }
  } catch (error) {
    logTest('Health Check', 'FAIL', error.message);
    log('   ⚠️  Make sure the server is running on ' + BASE_URL, 'yellow');
    throw error; // Stop tests if server is not running
  }
}

// ==================== USER AUTH TESTS ====================
async function testUserRegistration() {
  logSection('2. USER REGISTRATION');
  try {
    const response = await axios.post(`${API_BASE}/users/auth/register`, testData.user);
    if (response.data.success && response.data.data.user) {
      userId = response.data.data.user.id;
      userEmail = response.data.data.user.email;
      logTest('User Registration', 'PASS');
      log(`   User ID: ${userId}`, 'blue');
      log(`   Email: ${userEmail}`, 'blue');
      log(`   ⚠️  Note: Check email for verification OTP`, 'yellow');
    } else {
      logTest('User Registration', 'FAIL', 'Unexpected response format');
    }
  } catch (error) {
    const message = error.response?.data?.message || error.message;
    if (message.includes('already registered')) {
      // User already exists - try to find the actual email by attempting login
      // If login works, we'll get the email from the response
      userEmail = testData.user.email;
      logTest('User Registration', 'PASS', 'User already exists (expected in re-runs)');
      log(`   ⚠️  Using email: ${userEmail} for login attempt`, 'yellow');
    } else {
      logTest('User Registration', 'FAIL', message);
    }
  }
}

async function testUserLogin() {
  logSection('3. USER LOGIN');
  try {
    // Use the registered user email, or fallback to test data
    const loginEmail = userEmail || testData.user.email;

    // If userEmail is not set (registration failed silently), try test email
    if (!userEmail) {
      log(`   ⚠️  No registered email found, trying: ${loginEmail}`, 'yellow');
    }

    const response = await axios.post(`${API_BASE}/users/auth/login`, {
      email: loginEmail,
      password: testData.user.password
    });
    if (response.data.success && response.data.data.tokens) {
      userToken = response.data.data.tokens.accessToken;
      // Update userEmail from successful login response
      if (response.data.data.user) {
        userEmail = response.data.data.user.email;
      }
      logTest('User Login', 'PASS');
      log(`   Access Token: ${userToken.substring(0, 20)}...`, 'blue');
    } else {
      logTest('User Login', 'FAIL', 'No token received');
    }
  } catch (error) {
    const message = error.response?.data?.message || error.message;
    if (message.includes('verify your email')) {
      logTest('User Login', 'FAIL', 'Email not verified (expected)');
    } else if (message.includes('Invalid email or password')) {
      // Try alternative: maybe the email in DB is different
      // This can happen if user was created in previous test run
      logTest('User Login', 'FAIL', `Invalid credentials for ${userEmail || testData.user.email}`);
      log(`   ⚠️  Note: User may exist with different email from previous test run`, 'yellow');
      log(`   💡 Solution: Clear test users from database or use TEST_ID env variable`, 'yellow');
    } else {
      logTest('User Login', 'FAIL', message);
    }
  }
}

async function testUserForgotPassword() {
  logSection('4. USER FORGOT PASSWORD');
  try {
    // Use the registered user email, or fallback to test data
    const forgotEmail = userEmail || testData.user.email;
    const response = await axios.post(`${API_BASE}/users/auth/forgot-password`, {
      email: forgotEmail
    });
    if (response.data.success) {
      logTest('User Forgot Password', 'PASS');
      log(`   ⚠️  Note: Check email for OTP`, 'yellow');
    } else {
      logTest('User Forgot Password', 'FAIL', 'Unexpected response');
    }
  } catch (error) {
    logTest('User Forgot Password', 'FAIL', error.response?.data?.message || error.message);
  }
}

async function testUserLogout() {
  logSection('5. USER LOGOUT');
  if (!userToken) {
    logTest('User Logout', 'FAIL', 'No token available (login may have failed)');
    return;
  }
  try {
    const response = await axios.post(
      `${API_BASE}/users/auth/logout`,
      {},
      {
        headers: {
          Authorization: `Bearer ${userToken}`
        }
      }
    );
    if (response.data.success) {
      logTest('User Logout', 'PASS');
      userToken = null; // Clear token after logout
    } else {
      logTest('User Logout', 'FAIL', 'Unexpected response');
    }
  } catch (error) {
    logTest('User Logout', 'FAIL', error.response?.data?.message || error.message);
  }
}

// ==================== VENDOR AUTH TESTS ====================
async function testVendorRegistration() {
  logSection('6. VENDOR REGISTRATION');
  try {
    const form = new FormData();
    form.append('name', testData.vendor.name);
    form.append('email', testData.vendor.email);
    form.append('phone', testData.vendor.phone);
    form.append('password', testData.vendor.password);
    form.append('experience', testData.vendor.experience.toString());
    // Send bank details as individual fields for validation
    form.append('bankDetails[accountHolderName]', testData.vendor.bankDetails.accountHolderName);
    form.append('bankDetails[accountNumber]', testData.vendor.bankDetails.accountNumber);
    form.append('bankDetails[ifscCode]', testData.vendor.bankDetails.ifscCode);
    form.append('bankDetails[bankName]', testData.vendor.bankDetails.bankName);
    form.append('bankDetails[branchName]', testData.vendor.bankDetails.branchName || '');
    form.append('educationalQualifications', JSON.stringify(testData.vendor.educationalQualifications));
    form.append('address', JSON.stringify(testData.vendor.address));

    // Note: File uploads are optional for testing
    // In real scenario, you would add files here:
    // form.append('aadharCard', fs.createReadStream('path/to/file.jpg'));

    const response = await axios.post(`${API_BASE}/vendors/auth/register`, form, {
      headers: form.getHeaders()
    });

    if (response.data.success && response.data.data.vendor) {
      vendorId = response.data.data.vendor.id;
      vendorEmail = response.data.data.vendor.email;
      logTest('Vendor Registration', 'PASS');
      log(`   Vendor ID: ${vendorId}`, 'blue');
      log(`   Email: ${vendorEmail}`, 'blue');
      log(`   Experience: ${response.data.data.vendor.experience} years`, 'blue');
      log(`   ⚠️  Note: Check email for verification OTP`, 'yellow');
    } else {
      logTest('Vendor Registration', 'FAIL', 'Unexpected response format');
    }
  } catch (error) {
    const message = error.response?.data?.message || error.message;
    const errors = error.response?.data?.errors || [];
    if (message.includes('already registered')) {
      // Vendor already exists - use test email for login attempt
      vendorEmail = testData.vendor.email;
      logTest('Vendor Registration', 'PASS', 'Vendor already exists (expected in re-runs)');
      log(`   ⚠️  Using email: ${vendorEmail} for login attempt`, 'yellow');
    } else {
      const errorDetails = errors.length > 0 ? errors.map(e => e.msg || e).join(', ') : message;
      logTest('Vendor Registration', 'FAIL', errorDetails);
    }
  }
}

async function testVendorLogin() {
  logSection('7. VENDOR LOGIN');
  try {
    // Use the registered vendor email, or fallback to test data
    const loginEmail = vendorEmail || testData.vendor.email;

    // If vendorEmail is not set (registration failed silently), try test email
    if (!vendorEmail) {
      log(`   ⚠️  No registered email found, trying: ${loginEmail}`, 'yellow');
    }

    const response = await axios.post(`${API_BASE}/vendors/auth/login`, {
      email: loginEmail,
      password: testData.vendor.password
    });
    if (response.data.success && response.data.data.tokens) {
      vendorToken = response.data.data.tokens.accessToken;
      // Update vendorEmail from successful login response
      if (response.data.data.vendor) {
        vendorEmail = response.data.data.vendor.email;
      }
      logTest('Vendor Login', 'PASS');
      log(`   Access Token: ${vendorToken.substring(0, 20)}...`, 'blue');
    } else {
      logTest('Vendor Login', 'FAIL', 'No token received');
    }
  } catch (error) {
    const message = error.response?.data?.message || error.message;
    if (message.includes('pending admin approval')) {
      logTest('Vendor Login', 'FAIL', 'Vendor pending approval (expected)');
    } else if (message.includes('verify your email')) {
      logTest('Vendor Login', 'FAIL', 'Email not verified (expected)');
    } else if (message.includes('Invalid email or password')) {
      // Try alternative: maybe the email in DB is different
      logTest('Vendor Login', 'FAIL', `Invalid credentials for ${vendorEmail || testData.vendor.email}`);
      log(`   ⚠️  Note: Vendor may exist with different email from previous test run`, 'yellow');
      log(`   💡 Solution: Clear test vendors from database or use TEST_ID env variable`, 'yellow');
    } else {
      logTest('Vendor Login', 'FAIL', message);
    }
  }
}

async function testVendorForgotPassword() {
  logSection('8. VENDOR FORGOT PASSWORD');
  try {
    // Use the registered vendor email, or fallback to test data
    const forgotEmail = vendorEmail || testData.vendor.email;
    const response = await axios.post(`${API_BASE}/vendors/auth/forgot-password`, {
      email: forgotEmail
    });
    if (response.data.success) {
      logTest('Vendor Forgot Password', 'PASS');
      log(`   ⚠️  Note: Check email for OTP`, 'yellow');
    } else {
      logTest('Vendor Forgot Password', 'FAIL', 'Unexpected response');
    }
  } catch (error) {
    logTest('Vendor Forgot Password', 'FAIL', error.response?.data?.message || error.message);
  }
}

async function testVendorLogout() {
  logSection('9. VENDOR LOGOUT');
  if (!vendorToken) {
    logTest('Vendor Logout', 'FAIL', 'No token available (login may have failed)');
    return;
  }
  try {
    const response = await axios.post(
      `${API_BASE}/vendors/auth/logout`,
      {},
      {
        headers: {
          Authorization: `Bearer ${vendorToken}`
        }
      }
    );
    if (response.data.success) {
      logTest('Vendor Logout', 'PASS');
      vendorToken = null;
    } else {
      logTest('Vendor Logout', 'FAIL', 'Unexpected response');
    }
  } catch (error) {
    logTest('Vendor Logout', 'FAIL', error.response?.data?.message || error.message);
  }
}

// ==================== ADMIN AUTH TESTS ====================
async function testAdminRegistration() {
  logSection('10. ADMIN REGISTRATION');
  try {
    const adminCode = process.env.ADMIN_REGISTRATION_CODE || 'secure-code-to-create-admins';
    const response = await axios.post(`${API_BASE}/admin/auth/register`, {
      name: 'Test Admin',
      email: `testadmin${Date.now()}@jaladhar.com`,
      password: 'admin123',
      adminCode: adminCode
    });
    if (response.data.success && response.data.data.admin) {
      adminEmail = response.data.data.admin.email; // Store for login test
      logTest('Admin Registration', 'PASS');
      log(`   Admin ID: ${response.data.data.admin.id}`, 'blue');
      log(`   Email: ${adminEmail}`, 'blue');
      log(`   ⚠️  Note: Using ADMIN_REGISTRATION_CODE from .env`, 'yellow');
    } else {
      logTest('Admin Registration', 'FAIL', 'Unexpected response format');
    }
  } catch (error) {
    const message = error.response?.data?.message || error.message;
    if (message.includes('already exists')) {
      logTest('Admin Registration', 'PASS', 'Admin already exists (expected in re-runs)');
    } else if (message.includes('Invalid admin registration code')) {
      logTest('Admin Registration', 'FAIL', 'Invalid admin code - check ADMIN_REGISTRATION_CODE in .env');
    } else {
      logTest('Admin Registration', 'FAIL', message);
    }
  }
}

async function testAdminLogin() {
  logSection('11. ADMIN LOGIN');
  try {
    // Use the newly registered admin email, or fallback to test data
    const loginEmail = adminEmail || testData.admin.email;
    const response = await axios.post(`${API_BASE}/admin/auth/login`, {
      email: loginEmail,
      password: 'admin123' // Use the password from registration test
    });
    if (response.data.success && response.data.data.tokens) {
      adminToken = response.data.data.tokens.accessToken;
      logTest('Admin Login', 'PASS');
      log(`   Access Token: ${adminToken.substring(0, 20)}...`, 'blue');
    } else {
      logTest('Admin Login', 'FAIL', 'No token received');
    }
  } catch (error) {
    const message = error.response?.data?.message || error.message;
    logTest('Admin Login', 'FAIL', message);
  }
}

async function testAdminProfile() {
  logSection('12. ADMIN PROFILE');
  if (!adminToken) {
    logTest('Admin Profile', 'FAIL', 'No token available (login may have failed)');
    return;
  }
  try {
    const response = await axios.get(`${API_BASE}/admin/auth/profile`, {
      headers: {
        Authorization: `Bearer ${adminToken}`
      }
    });
    if (response.data.success && response.data.data.admin) {
      logTest('Admin Profile', 'PASS');
      log(`   Admin Name: ${response.data.data.admin.name}`, 'blue');
      log(`   Admin Email: ${response.data.data.admin.email}`, 'blue');
    } else {
      logTest('Admin Profile', 'FAIL', 'Unexpected response');
    }
  } catch (error) {
    logTest('Admin Profile', 'FAIL', error.response?.data?.message || error.message);
  }
}

async function testAdminLogout() {
  logSection('13. ADMIN LOGOUT');
  if (!adminToken) {
    logTest('Admin Logout', 'FAIL', 'No token available (login may have failed)');
    return;
  }
  try {
    const response = await axios.post(
      `${API_BASE}/admin/auth/logout`,
      {},
      {
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      }
    );
    if (response.data.success) {
      logTest('Admin Logout', 'PASS');
      adminToken = null;
    } else {
      logTest('Admin Logout', 'FAIL', 'Unexpected response');
    }
  } catch (error) {
    logTest('Admin Logout', 'FAIL', error.response?.data?.message || error.message);
  }
}

// ==================== VALIDATION TESTS ====================
async function testValidationErrors() {
  logSection('14. VALIDATION TESTS');

  // Test invalid email
  try {
    await axios.post(`${API_BASE}/users/auth/register`, {
      name: 'Test',
      email: 'invalid-email',
      phone: '123',
      password: '123'
    });
    logTest('Invalid Email Validation', 'FAIL', 'Should have rejected invalid email');
  } catch (error) {
    if (error.response?.status === 400) {
      logTest('Invalid Email Validation', 'PASS');
    } else {
      logTest('Invalid Email Validation', 'FAIL', 'Unexpected error');
    }
  }

  // Test short password
  try {
    await axios.post(`${API_BASE}/users/auth/register`, {
      name: 'Test',
      email: 'test@example.com',
      phone: '1234567890',
      password: '123'
    });
    logTest('Short Password Validation', 'FAIL', 'Should have rejected short password');
  } catch (error) {
    if (error.response?.status === 400) {
      logTest('Short Password Validation', 'PASS');
    } else {
      logTest('Short Password Validation', 'FAIL', 'Unexpected error');
    }
  }
}

// ==================== MAIN TEST RUNNER ====================
async function runAllTests() {
  console.clear();
  log('\n' + '='.repeat(60), 'bright');
  log('🚀 JALADHAR AUTH MODULE - COMPREHENSIVE TEST SUITE', 'bright');
  log('='.repeat(60) + '\n', 'bright');

  const startTime = Date.now();

  try {
    // Health Check
    await testHealthCheck();

    // User Tests
    await testUserRegistration();
    await testUserLogin();
    await testUserForgotPassword();
    await testUserLogout();

    // Vendor Tests
    await testVendorRegistration();
    await testVendorLogin();
    await testVendorForgotPassword();
    await testVendorLogout();

    // Admin Tests
    await testAdminRegistration();
    await testAdminLogin();
    await testAdminProfile();
    await testAdminLogout();

    // Validation Tests
    await testValidationErrors();

  } catch (error) {
    log('\n⚠️  Tests stopped due to critical error', 'yellow');
  }

  // Print Summary
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  logSection('TEST SUMMARY');
  log(`Total Tests: ${testResults.total}`, 'blue');
  log(`Passed: ${testResults.passed}`, 'green');
  log(`Failed: ${testResults.failed}`, 'red');
  log(`Duration: ${duration}s`, 'blue');
  log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`,
    testResults.failed === 0 ? 'green' : 'yellow');

  if (testResults.errors.length > 0) {
    log('\n❌ Failed Tests:', 'red');
    testResults.errors.forEach((err, index) => {
      log(`   ${index + 1}. ${err.test}`, 'red');
      log(`      ${err.error}`, 'red');
    });
  }

  // Add helpful notes if tests failed
  if (testResults.failed > 0) {
    log('\n📝 Notes:', 'yellow');
    log('   • Login failures are expected if users/vendors exist from previous test runs', 'yellow');
    log('   • To fix: Clear test users from database or use TEST_ID env variable', 'yellow');
    log('   • Example: TEST_ID=run2 npm run test:auth', 'yellow');
    log('   • Or manually delete test users: testuser.*@example.com and testvendor.*@example.com', 'yellow');
  }

  log('\n' + '='.repeat(60), 'bright');
  if (testResults.failed === 0) {
    log('✅ ALL TESTS PASSED!', 'green');
  } else {
    log('⚠️  SOME TESTS FAILED - Review errors above', 'yellow');
  }
  log('='.repeat(60) + '\n', 'bright');

  // Exit with appropriate code
  process.exit(testResults.failed === 0 ? 0 : 1);
}

// Run tests
if (require.main === module) {
  runAllTests().catch(error => {
    log(`\n❌ Fatal Error: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { runAllTests };

