const { Server } = require('socket.io');
const { verifyAccessToken } = require('../utils/tokenService');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Admin = require('../models/Admin');
const Booking = require('../models/Booking');
const { getRoomName } = require('../services/notificationService');

let io = null;

/**
 * Initialize Socket.io server
 */
const initializeSocket = (server) => {
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    process.env.SOCKET_CORS_ORIGIN,
    'http://localhost:3000',
    'http://localhost:5000',
    'http://localhost:5050',
    'http://localhost:5173',
    'https://jala-dhar.vercel.app'
  ].filter(Boolean);

  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
          return callback(null, true);
        }
        return callback(null, true);
      },
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
      const roleUpper = (decoded.role || '').toUpperCase();

      if (roleUpper === 'USER' || roleUpper === 'CUSTOMER') {
        user = await User.findById(decoded.userId).select('-password');
      } else if (roleUpper === 'VENDOR' || roleUpper === 'EXPERT') {
        user = await Vendor.findById(decoded.userId).select('-password');
      } else if (roleUpper === 'ADMIN' || roleUpper.endsWith('_ADMIN') || roleUpper.includes('ADMIN')) {
        user = await Admin.findById(decoded.userId).select('-password');
      } else {
        return next(new Error('Authentication error: Invalid role'));
      }

      if (!user || !user.isActive) {
        return next(new Error('Authentication error: User not found or inactive'));
      }

      // Attach user info to socket
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      socket.userModel = (roleUpper === 'USER' || roleUpper === 'CUSTOMER')
        ? 'User'
        : (roleUpper === 'VENDOR' || roleUpper === 'EXPERT')
          ? 'Vendor'
          : 'Admin';

      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error'));
    }
  });

  // Handle connections
  io.on('connection', (socket) => {
    console.log(`[Socket] User connected: ${socket.userId} (${socket.userRole})`);

    // Join user-specific room for notifications & updates (with all aliases)
    const room = getRoomName(socket.userModel, socket.userId);
    socket.join(room);
    socket.join(socket.userId.toString());
    socket.join(`${socket.userModel}_${socket.userId}`);
    socket.join(`${socket.userModel.toLowerCase()}_${socket.userId}`);
    console.log(`[Socket] User ${socket.userId} joined rooms: ${room}, ${socket.userId}, ${socket.userModel}_${socket.userId}`);

    // Handle joining booking tracking room
    socket.on('join_booking_tracking', (bookingId) => {
      socket.join(`booking_${bookingId}`);
      console.log(`[Socket] Socket ${socket.id} joined tracking room: booking_${bookingId}`);
    });

    // Handle live vendor/expert GPS location updates
    socket.on('vendor_location_update', (data) => {
      if (!data?.bookingId || !data?.lat || !data?.lng) return;
      const lat = Number(data.lat);
      const lng = Number(data.lng);
      const speed = Number(data.speed) || 0;
      const heading = Number(data.heading) || 0;
      const now = new Date();

      console.log(`[Socket] 📍 Live location for booking ${data.bookingId}: ${lat}, ${lng} (speed: ${speed}km/h)`);

      const payload = {
        bookingId: data.bookingId,
        lat,
        lng,
        speed,
        heading,
        updatedAt: now,
      };

      // 1. Broadcast to the booking tracking room
      socket.to(`booking_${data.bookingId}`).emit('expert_location_updated', payload);

      // 2. Also notify the specific user if userId provided
      if (data.userId) {
        socket.to(`User_${data.userId}`).to(`user:${data.userId}`).emit('expert_location_updated', payload);
      }

      // 3. Persist to Booking in MongoDB (Enterprise State Hydration)
      try {
        Booking.findByIdAndUpdate(data.bookingId, {
          $set: {
            vendorLocation: {
              lat,
              lng,
              speed,
              heading,
              updatedAt: now,
            },
          },
        }).exec().catch((dbErr) => console.error('[Socket] Failed to persist vendorLocation to Booking:', dbErr.message));

        if (socket.userId && (socket.userModel === 'Vendor' || socket.userRole === 'VENDOR' || socket.userRole === 'EXPERT')) {
          Vendor.findByIdAndUpdate(socket.userId, {
            $set: {
              lastKnownLocation: {
                lat,
                lng,
                updatedAt: now,
              },
            },
          }).exec().catch((vErr) => console.error('[Socket] Failed to update Vendor lastKnownLocation:', vErr.message));
        }
      } catch (persistErr) {
        console.error('[Socket] Error in location persistence:', persistErr.message);
      }
    });

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

