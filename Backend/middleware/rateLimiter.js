const rateLimit = require('express-rate-limit');

/**
 * Check if rate limiting should be skipped (e.g., in test environments or if explicitly disabled)
 */
const shouldSkip = (req) => {
  if (process.env.ENABLE_RATE_LIMIT === 'false' || process.env.RATE_LIMIT_ENABLED === 'false') {
    return true;
  }
  if (process.env.NODE_ENV === 'test') {
    return true;
  }
  return false;
};

/**
 * Standard JSON response handler for rate limiting
 */
const createRateLimitHandler = (defaultMessage) => {
  return (req, res, next, options) => {
    const retryAfter = Math.ceil(options.windowMs / 1000);
    return res.status(options.statusCode || 429).json({
      success: false,
      message: options.message || defaultMessage || 'Too many requests from this IP, please try again later.',
      retryAfter
    });
  };
};

/**
 * General API rate limiter (applied to /api routes)
 * Configurable via RATE_LIMIT_WINDOW_MS and RATE_LIMIT_MAX
 */
const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60 * 1000, // Default: 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 300, // Default: 300 requests per window
  skip: shouldSkip,
  message: 'Too many requests from this IP, please try again later.',
  handler: createRateLimitHandler('Too many requests from this IP, please try again later.'),
  standardHeaders: true, // Return standard RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  validate: { xForwardedForHeader: false }
});

/**
 * Strict rate limiter for Authentication endpoints (login, password reset, register)
 * Configurable via AUTH_RATE_LIMIT_WINDOW_MS and AUTH_RATE_LIMIT_MAX
 */
const authRateLimiter = rateLimit({
  windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // Default: 15 minutes
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 20, // Default: 20 attempts per 15 minutes
  skip: shouldSkip,
  message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
  handler: createRateLimitHandler('Too many authentication attempts from this IP. Please try again after 15 minutes.'),
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false }
});

/**
 * Strict rate limiter for OTP generation & SMS/Email delivery
 * Protects SMS credits & prevents OTP flooding
 * Configurable via OTP_RATE_LIMIT_WINDOW_MS and OTP_RATE_LIMIT_MAX
 */
const otpRateLimiter = rateLimit({
  windowMs: parseInt(process.env.OTP_RATE_LIMIT_WINDOW_MS, 10) || 10 * 60 * 1000, // Default: 10 minutes
  max: parseInt(process.env.OTP_RATE_LIMIT_MAX, 10) || 5, // Default: 5 requests per 10 minutes
  skip: shouldSkip,
  message: 'Too many OTP requests from this IP. Please wait a few minutes before requesting another OTP.',
  handler: createRateLimitHandler('Too many OTP requests from this IP. Please wait a few minutes before requesting another OTP.'),
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false }
});

/**
 * Helper to generate custom rate limiters on demand
 */
const createCustomRateLimiter = ({
  windowMs = 60 * 1000,
  max = 100,
  message = 'Too many requests, please try again later.'
} = {}) => {
  return rateLimit({
    windowMs,
    max,
    skip: shouldSkip,
    message,
    handler: createRateLimitHandler(message),
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false }
  });
};

module.exports = rateLimiter;
module.exports.rateLimiter = rateLimiter;
module.exports.authRateLimiter = authRateLimiter;
module.exports.otpRateLimiter = otpRateLimiter;
module.exports.createCustomRateLimiter = createCustomRateLimiter;
