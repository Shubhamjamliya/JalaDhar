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

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://jala-dhar.vercel.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser middleware
app.use(express.json());
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

// Vendor routes
app.use('/api/vendors/auth', require('./routes/vendor-routes/auth.routes'));
app.use('/api/vendors', require('./routes/vendor-routes/profile.routes'));
app.use('/api/vendors', require('./routes/vendor-routes/dashboard.routes'));
app.use('/api/vendors', require('./routes/vendor-routes/service.routes'));

// Admin routes
app.use('/api/admin/auth', require('./routes/admin-routes/adminAuth.routes'));
app.use('/api/admin', require('./routes/admin-routes/vendorApproval.routes'));
app.use('/api/admin', require('./routes/admin-routes/userManagement.routes'));
app.use('/api/admin', require('./routes/booking-routes/adminBooking.routes'));
app.use('/api/admin', require('./routes/payment-routes/adminPayment.routes'));

// Booking routes
app.use('/api/bookings', require('./routes/booking-routes/userBooking.routes'));
app.use('/api/vendors/bookings', require('./routes/booking-routes/vendorBooking.routes'));

// Payment routes
app.use('/api/payments', require('./routes/payment-routes/payment.routes'));

// Rating routes
app.use('/api/ratings', require('./routes/rating-routes/rating.routes'));

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

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  server.close(() => {
    process.exit(1);
  });
});

module.exports = app;

