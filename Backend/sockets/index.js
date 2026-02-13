const { Server } = require('socket.io');
const { verifyAccessToken } = require('../utils/tokenService');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Admin = require('../models/Admin');
const { getRoomName } = require('../services/notificationService');

let io = null;

/**
 * Initialize Socket.io server
 */
const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'https://jala-dhar.vercel.app',
      credentials: true,
      methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling']
  });

  // Authentication middleware for Socket.io
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      // Verify token
      let decoded;
      try {
        decoded = verifyAccessToken(token);
      } catch (error) {
        return next(new Error('Authentication error: Invalid token'));
      }

      // Get user based on role
      let user;
      switch (decoded.role) {
        case 'USER':
          user = await User.findById(decoded.userId).select('-password');
          break;
        case 'VENDOR':
          user = await Vendor.findById(decoded.userId).select('-password');
          break;
        case 'ADMIN':
        case 'SUPER_ADMIN':
        case 'FINANCE_ADMIN':
        case 'OPERATIONS_ADMIN':
        case 'VERIFIER_ADMIN':
        case 'SUPPORT_ADMIN':
          user = await Admin.findById(decoded.userId).select('-password');
          break;
        default:
          return next(new Error('Authentication error: Invalid role'));
      }

      if (!user || !user.isActive) {
        return next(new Error('Authentication error: User not found or inactive'));
      }

      // Attach user info to socket
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      socket.userModel = decoded.role === 'USER' ? 'User' : decoded.role === 'VENDOR' ? 'Vendor' : 'Admin';

      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error'));
    }
  });

  // Handle connections
  io.on('connection', (socket) => {
    console.log(`[Socket] User connected: ${socket.userId} (${socket.userRole})`);

    // Join user-specific room for notifications
    const room = getRoomName(socket.userModel, socket.userId);
    socket.join(room);
    console.log(`[Socket] User ${socket.userId} joined room: ${room}`);

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`[Socket] User disconnected: ${socket.userId}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`[Socket] Error for user ${socket.userId}:`, error);
    });
  });

  return io;
};

/**
 * Get Socket.io instance
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initializeSocket first.');
  }
  return io;
};

module.exports = {
  initializeSocket,
  getIO
};

