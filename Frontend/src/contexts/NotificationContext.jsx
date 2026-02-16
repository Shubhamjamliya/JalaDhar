import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead } from '../services/notificationApi';
import { useAuth } from './AuthContext';
import { useVendorAuth } from './VendorAuthContext';
import { useAdminAuth } from './AdminAuthContext';
import { setupForegroundHandler } from '../services/pushNotificationService';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const { user, isAuthenticated: isUserAuthenticated } = useAuth();
  const { vendor, isAuthenticated: isVendorAuthenticated } = useVendorAuth();
  const { admin, isAuthenticated: isAdminAuthenticated } = useAdminAuth();

  // Determine current user and role
  const currentUser = user || vendor || admin;
  const isAuthenticated = isUserAuthenticated || isVendorAuthenticated || isAdminAuthenticated;
  const userRole = user ? 'User' : vendor ? 'Vendor' : admin ? 'Admin' : null;

  // Use refs to store latest values for socket listener (avoid stale closure)
  const currentUserRef = useRef(currentUser);
  const userRoleRef = useRef(userRole);

  // Update refs when values change
  useEffect(() => {
    currentUserRef.current = currentUser;
    userRoleRef.current = userRole;
  }, [currentUser, userRole]);

  // Initialize Socket.io connection
  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      // Disconnect if not authenticated
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    // Get token from localStorage
    const tokenKey = userRole === 'Admin'
      ? 'adminAccessToken'
      : userRole === 'Vendor'
        ? 'vendorAccessToken'
        : 'accessToken';
    const token = localStorage.getItem(tokenKey);

    if (!token) {
      return;
    }

    // Connect to Socket.io server
    // Socket.io connects to the base server URL (not /api)
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
    // Remove /api if present since Socket.io connects to the root
    const socketUrl = API_BASE_URL.replace('/api', '');
    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      console.log('[Socket] Connected to notification server');
    });

    newSocket.on('disconnect', () => {
      console.log('[Socket] Disconnected from notification server');
    });

    newSocket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error);
    });

    // Listen for new notifications
    newSocket.on('new_notification', (notification) => {
      console.log('[Socket] New notification received:', notification);

      // Use refs to get latest values (not stale closure values)
      const currentUserId = currentUserRef.current?._id?.toString() || currentUserRef.current?.id?.toString();
      const notificationRecipientId = notification.recipient?.toString();
      const notificationRecipientModel = notification.recipientModel;
      const currentUserRole = userRoleRef.current;

      console.log('[Socket] Filtering check:', {
        notificationRecipientId,
        currentUserId,
        notificationRecipientModel,
        currentUserRole,
        match: notificationRecipientId === currentUserId && notificationRecipientModel === currentUserRole
      });

      // Only add if recipient and model match
      if (notificationRecipientId === currentUserId &&
        notificationRecipientModel === currentUserRole) {
        console.log('[Socket] ✅ Adding notification to state');
        setNotifications((prev) => {
          const newNotifications = [notification, ...prev];
          console.log('[Socket] Updated notifications count:', newNotifications.length);
          return newNotifications;
        });
        setUnreadCount((prev) => {
          const newCount = prev + 1;
          console.log('[Socket] Updated unread count:', newCount);
          return newCount;
        });
      } else {
        console.log('[Socket] ❌ Notification filtered - not for current user');
      }
    });

    setSocket(newSocket);

    // Cleanup on unmount or auth change
    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated, userRole]); // Re-run if auth state or role changes

  // Initialize FCM Foreground Handler
  /*
  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubscribe = setupForegroundHandler((payload) => {
      console.log('[FCM] Foreground message processed in context:', payload);

      // Since Socket.io is also likely to receive this same notification
      // (if the backend sends both), we should be careful about duplicates in the UI.
      // However, the backend notificationService sends to Socket.io AND FCM.
      // FCM foreground usually shows a native/toast notification.

      // If we want to force refresh notifications list when FCM arrives:
      refreshNotifications();
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isAuthenticated, refreshNotifications]);
  */


  // Load notifications on mount and when user changes
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      loadNotifications();
      loadUnreadCount();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, currentUser]);

  // Load notifications
  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getNotifications({ page: 1, limit: 50 });
      if (response.success) {
        setNotifications(response.data.notifications || []);
      }
    } catch (error) {
      console.error('Load notifications error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load unread count
  const loadUnreadCount = useCallback(async () => {
    try {
      const response = await getUnreadCount();
      if (response.success) {
        setUnreadCount(response.data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Load unread count error:', error);
    }
  }, []);

  // Mark notification as read
  const markNotificationAsRead = useCallback(async (notificationId) => {
    try {
      const response = await markAsRead(notificationId);
      if (response.success) {
        setNotifications((prev) =>
          prev.map((notif) =>
            notif.id === notificationId || notif._id === notificationId
              ? { ...notif, isRead: true }
              : notif
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  }, []);

  // Mark all as read
  const markAllNotificationsAsRead = useCallback(async () => {
    try {
      const response = await markAllAsRead();
      if (response.success) {
        setNotifications((prev) =>
          prev.map((notif) => ({ ...notif, isRead: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Mark all as read error:', error);
    }
  }, []);

  // Refresh notifications
  const refreshNotifications = useCallback(() => {
    loadNotifications();
    loadUnreadCount();
  }, [loadNotifications, loadUnreadCount]);

  const value = {
    notifications,
    unreadCount,
    loading,
    socket,
    markAsRead: markNotificationAsRead,
    markAllAsRead: markAllNotificationsAsRead,
    refreshNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

