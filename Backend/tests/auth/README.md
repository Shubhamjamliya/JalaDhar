# Jaladhar Backend - Test Suite

This directory contains comprehensive test suites for all modules in the Jaladhar backend.

## 📁 Directory Structure

```
tests/
├── auth/              # Authentication module tests
│   └── auth.test.js   # User, Vendor, Admin authentication tests
├── vendor/            # Vendor module tests
│   └── vendor.test.js # Vendor profile, dashboard, services tests
├── README.md          # This file
├── IMPLEMENTATION_SUMMARY.md
└── TEST_RESULTS.md
```

## 🚀 Running Tests

### Prerequisites

1. **Start the server** in a separate terminal:
   ```bash
   npm run dev
   # or
   npm start
   ```

2. **Ensure environment variables** are set in `.env`:
   - Database connection
   - Cloudinary credentials (for file upload tests)
   - Email configuration (for OTP tests)
   - Admin registration code

### Run Individual Test Suites

```bash
# Run authentication tests
npm run test:auth

# Run vendor module tests
npm run test:vendor

# Run all tests
npm run test:all
```

### Using Test ID for Consistent Data

To avoid conflicts with existing test data, use a `TEST_ID` environment variable:

```bash
# Windows PowerShell
$env:TEST_ID="run1"; npm run test:vendor

# Windows CMD
set TEST_ID=run1 && npm run test:vendor

# Linux/Mac
TEST_ID=run1 npm run test:vendor
```

## 📋 Test Coverage

### Authentication Module (`tests/auth/`)

- ✅ User Registration & Login
- ✅ Vendor Registration & Login
- ✅ Admin Registration & Login
- ✅ Password Reset Flow
- ✅ Email Verification
- ✅ Logout Functionality
- ✅ Validation Tests

### Vendor Module (`tests/vendor/`)

#### Vendor Profile Tests
- ✅ Get Profile
- ✅ Update Profile
- ✅ Update Availability Settings
- ✅ Get Payment Status
- ⚠️ Upload Profile Picture (requires file)
- ⚠️ Upload Images (requires files)

#### Vendor Service Tests
- ✅ Add Service
- ✅ Get All Services
- ✅ Get Service Details
- ✅ Update Service
- ⚠️ Delete Service Image
- ⚠️ Toggle Service Status
- ⚠️ Delete Service

#### Vendor Dashboard Tests
- ✅ Get Dashboard Overview
- ✅ Get Booking Requests
- ⚠️ Accept/Reject Bookings (requires bookings)
- ⚠️ Schedule Visit (requires bookings)
- ⚠️ Mark as Visited/Completed (requires bookings)

#### Admin Vendor Management Tests
- ✅ Get All Vendors
- ✅ Get Pending Vendors Count
- ✅ Get Vendor Details
- ⚠️ Approve/Reject Vendor (requires pending vendors)
- ⚠️ Toggle Vendor Status

## ⚠️ Expected Test Failures

Some tests may fail due to business logic requirements:

1. **Vendor Login**: May fail if vendor is not approved by admin
2. **Service Operations**: Require vendor to be approved
3. **Booking Operations**: Require actual bookings to exist
4. **Admin Operations**: Require admin account to be registered

## 📝 Test Data

Tests use consistent test data based on `TEST_ID`:

- **User Email**: `testuser.{TEST_ID}@example.com`
- **Vendor Email**: `testvendor.{TEST_ID}@example.com`
- **Admin Email**: `testadmin.{TEST_ID}@jaladhar.com`
- **Password**: `password123` (for all test accounts)

## 🔧 Troubleshooting

### Server Not Running
```
Error: Make sure the server is running on http://localhost:5000
```
**Solution**: Start the server with `npm run dev` in a separate terminal.

### Login Failures
```
Error: Invalid email or password
```
**Solution**: 
- Ensure test accounts are registered
- Use consistent `TEST_ID` across test runs
- Clear test data from database if needed

### Vendor Not Approved
```
Error: Vendor account must be approved before adding services
```
**Solution**: 
- Register vendor via auth tests
- Approve vendor via admin panel or admin tests

### File Upload Tests Failing
```
Error: Only image files are allowed
```
**Solution**: These tests require actual image files. They are marked as optional in the test suite.

## 📊 Test Results

After running tests, you'll see:
- Total tests executed
- Passed/Failed counts
- Success rate percentage
- Detailed error messages for failures
- Helpful notes and suggestions

## 🎯 Best Practices

1. **Run tests in order**: Auth tests first, then vendor tests
2. **Use consistent TEST_ID**: Prevents data conflicts
3. **Check server logs**: For detailed error information
4. **Review failed tests**: Some failures are expected due to business logic
5. **Clean test data**: Periodically clear test users/vendors from database

## 📚 Additional Resources

- See `IMPLEMENTATION_SUMMARY.md` for implementation details
- See `TEST_RESULTS.md` for example test outputs
- Check individual test files for detailed test descriptions
