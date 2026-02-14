const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const rateLimiter = require('./middleware/rateLimiter');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Initialize default settings after DB connection
setTimeout(async () => {
  try {
    const { initializeDefaultSettings } = require('./services/settingsService');
    await initializeDefaultSettings();
  } catch (err) {
    console.error('Error initializing default settings:', err);
  }
}, 2000); // Wait 2 seconds for DB to be ready

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: [
    "https://jaladhaaraapp.in",
    "https://www.jaladhaaraapp.in",
    process.env.FRONTEND_URL || 'https://jala-dhar.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser middleware
// Capture raw body for webhook signature verification
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting
app.use('/api', rateLimiter);

// Health check route
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Jaladhar API is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
// User routes
app.use('/api/users/auth', require('./routes/user-routes/auth.routes'));
app.use('/api/users', require('./routes/user-routes/profile.routes'));
app.use('/api/user/wallet', require('./routes/user-routes/userWallet.routes'));
app.use('/api/users/disputes', require('./routes/user-routes/dispute.routes'));

// Vendor routes
app.use('/api/vendors/auth', require('./routes/vendor-routes/auth.routes'));
app.use('/api/vendors', require('./routes/vendor-routes/profile.routes'));
app.use('/api/vendors', require('./routes/vendor-routes/dashboard.routes'));
app.use('/api/vendors', require('./routes/vendor-routes/service.routes'));
app.use('/api/vendor/wallet', require('./routes/vendor-routes/vendorWallet.routes'));
app.use('/api/vendors/disputes', require('./routes/vendor-routes/dispute.routes'));

// Admin routes
app.use('/api/admin/auth', require('./routes/admin-routes/adminAuth.routes'));
app.use('/api/admin', require('./routes/admin-routes/vendorApproval.routes'));
app.use('/api/admin', require('./routes/admin-routes/userManagement.routes'));
app.use('/api/admin', require('./routes/booking-routes/adminBooking.routes'));
app.use('/api/admin', require('./routes/payment-routes/adminPayment.routes'));
app.use('/api/admin/settings', require('./routes/admin-routes/settings.routes'));
app.use('/api/admin/withdrawals', require('./routes/admin-routes/withdrawal.routes'));
app.use('/api/admin/user-withdrawals', require('./routes/admin-routes/userWithdrawal.routes'));
app.use('/api/admin/ratings', require('./routes/admin-routes/rating.routes'));
app.use('/api/admin/disputes', require('./routes/admin-routes/dispute.routes'));

// Booking routes
app.use('/api/bookings', require('./routes/booking-routes/userBooking.routes'));
app.use('/api/vendors/bookings', require('./routes/booking-routes/vendorBooking.routes'));

// Payment routes
app.use('/api/payments', require('./routes/payment-routes/payment.routes'));

// Rating routes
app.use('/api/ratings', require('./routes/rating-routes/rating.routes'));

// Public settings route
app.use('/api/settings', require('./routes/settings.routes'));

// Notification routes
app.use('/api/notifications', require('./routes/notification.routes'));

// 404 handler
app.use((req, res) => {
  console.log(`[404 HANDLER] Route not found - Method: ${req.method}, Path: ${req.path}, OriginalUrl: ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'Route not found',
    method: req.method,
    path: req.path
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Initialize Socket.io
let server;
if (process.env.VERCEL !== '1' && !process.env.VERCEL_ENV) {
  const PORT = process.env.PORT || 5000;
  server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });

  // Initialize Socket.io
  const { initializeSocket } = require('./sockets');
  initializeSocket(server);

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error('Unhandled Promise Rejection:', err);
    server.close(() => {
      process.exit(1);
    });
  });
} else {
  // For Vercel, create HTTP server for Socket.io
  const http = require('http');
  server = http.createServer(app);
  const { initializeSocket } = require('./sockets');
  initializeSocket(server);
}

module.exports = app;

