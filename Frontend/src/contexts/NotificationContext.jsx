import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { getNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification as deleteNotifApi, clearAllNotifications as clearAllNotifsApi } from '../services/notificationApi';
import { useAuth } from './AuthContext';
import { useVendorAuth } from './VendorAuthContext';
import { useAdminAuth } from './AdminAuthContext';
import { setupForegroundHandler } from '../services/pushNotificationService';
import { getNotificationUrl } from '../utils/notificationUtils';

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

  // Determine current user and role dynamically based on route context and auth state
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  let userRole = null;
  let currentUser = null;

  if (pathname.startsWith('/admin') && isAdminAuthenticated) {
    userRole = 'Admin';
    currentUser = admin;
  } else if (pathname.startsWith('/vendor') && isVendorAuthenticated) {
    userRole = 'Expert';
    currentUser = vendor;
  } else if (pathname.startsWith('/user') && isUserAuthenticated) {
    userRole = 'User';
    currentUser = user;
  } else {
    // Neutral path (e.g. /notifications, /notification): check active tokens and authenticated users safely
    const hasUserToken = !!localStorage.getItem('accessToken');
    const hasVendorToken = !!localStorage.getItem('vendorAccessToken');
    const hasAdminToken = !!localStorage.getItem('adminAccessToken');

    if (isUserAuthenticated && hasUserToken && (!hasVendorToken && !hasAdminToken)) {
      userRole = 'User';
      currentUser = user;
    } else if (isVendorAuthenticated && hasVendorToken) {
      userRole = 'Expert';
      currentUser = vendor;
    } else if (isAdminAuthenticated && hasAdminToken) {
      userRole = 'Admin';
      currentUser = admin;
    } else if (isUserAuthenticated && hasUserToken) {
      userRole = 'User';
      currentUser = user;
    }
  }

  const isAuthenticated = !!currentUser;

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
    const isPublicAuthRoute = pathname.includes('login') || pathname.includes('signup') || pathname.includes('verify') || pathname.includes('forgot');

    if (!isAuthenticated || !currentUser || isPublicAuthRoute) {
      // Disconnect if not authenticated or on public auth routes
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    // Get token from localStorage
    const tokenKey = userRole === 'Admin'
      ? 'adminAccessToken'
      : userRole === 'Expert'
        ? 'vendorAccessToken'
        : 'accessToken';
    const token = localStorage.getItem(tokenKey);

    if (!token) {
      return;
    }

    // Connect to Socket.io server using root origin to avoid invalid namespace errors
    let socketOrigin = 'http://localhost:5000';
    try {
      const rawUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      const parsed = new URL(rawUrl);
      socketOrigin = parsed.origin;
    } catch (e) {
      socketOrigin = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/api\/?$/, '');
    }

    const newSocket = io(socketOrigin, {
      path: '/socket.io',
      auth: { token },
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      timeout: 15000
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

    // Listen for live language configuration updates (Admin added/deleted language)
    newSocket.on('LANGUAGE_CONFIG_UPDATED', (payload) => {
      window.dispatchEvent(new CustomEvent('jaladhaara_language_config_updated', { detail: payload }));
    });
    newSocket.on('language_config_updated', (payload) => {
      window.dispatchEvent(new CustomEvent('jaladhaara_language_config_updated', { detail: payload }));
    });

    // Listen for new notifications
    newSocket.on('new_notification', (notification) => {
      console.log('[Socket] New notification received:', notification);

      // Use refs to get latest values (not stale closure values)
      const currentUserId = currentUserRef.current?._id?.toString() || currentUserRef.current?.id?.toString();
      const notificationRecipientId = typeof notification.recipient === 'object'
        ? (notification.recipient?._id?.toString() || notification.recipient?.id?.toString())
        : notification.recipient?.toString();
      const notificationRecipientModel = notification.recipientModel;
      const currentUserRole = userRoleRef.current;

      console.log('[Socket] Filtering check:', {
        notificationRecipientId,
        currentUserId,
        notificationRecipientModel,
        currentUserRole
      });

      // Match if recipient ID matches current user (and model matches if present, normalizing Vendor/Expert)
      const roleMatches = !notificationRecipientModel ||
        notificationRecipientModel.toLowerCase() === currentUserRole?.toLowerCase() ||
        (notificationRecipientModel.toLowerCase() === 'vendor' && (currentUserRole?.toLowerCase() === 'expert' || currentUserRole?.toLowerCase() === 'vendor')) ||
        (notificationRecipientModel.toLowerCase() === 'expert' && (currentUserRole?.toLowerCase() === 'expert' || currentUserRole?.toLowerCase() === 'vendor')) ||
        (notificationRecipientModel.toLowerCase() === 'user' && currentUserRole?.toLowerCase() === 'user') ||
        (notificationRecipientModel.toLowerCase() === 'admin' && currentUserRole?.toLowerCase() === 'admin');

      const isRecipientMatch = notificationRecipientId === currentUserId && roleMatches;

      if (isRecipientMatch) {
        console.log('[Socket] ✅ Adding notification to state & showing popup');
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);

        // 1. Show interactive real-time Popup Toast
        const notifUrl = getNotificationUrl(notification, currentUserRole);
        const notifId = notification.id || notification._id;

        toast.custom((t) => (
          <div
            onClick={() => {
              toast.dismiss(t.id);
              if (notifId) markAsRead(notifId).catch(console.error);
              if (notifUrl) window.location.href = notifUrl;
            }}
            className={`${
              t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-sm w-full bg-white shadow-2xl rounded-2xl border-2 border-[#0A84FF]/20 p-4 cursor-pointer hover:border-[#0A84FF] transition-all flex items-start gap-3.5 z-[99999] pointer-events-auto group`}
          >
            <div className="w-10 h-10 rounded-xl bg-[#0A84FF] text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-md shadow-blue-200">
              🔔
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <p className="text-xs font-black text-[#0A84FF] uppercase tracking-wider line-clamp-1">
                  {notification.title || "New Notification"}
                </p>
                <span className="text-[10px] text-gray-400 font-bold shrink-0">Just now</span>
              </div>
              <p className="text-xs font-semibold text-gray-800 mt-0.5 line-clamp-2 leading-relaxed">
                {notification.message}
              </p>
              <p className="text-[10px] text-[#0A84FF] font-bold mt-1.5 group-hover:underline flex items-center gap-1">
                Tap to view details →
              </p>
            </div>
          </div>
        ), { duration: 6000 });

        // 2. Also trigger Native Desktop Notification if permitted
        if ("Notification" in window && Notification.permission === "granted") {
          try {
            new Notification(notification.title || "Jaladhaara Alert", {
              body: notification.message,
              icon: "/favicon.png"
            });
          } catch (e) {
            console.error("Native notification error:", e);
          }
        }
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
    const isPublicAuthRoute = pathname.includes('login') || pathname.includes('signup') || pathname.includes('verify') || pathname.includes('forgot');

    if (isAuthenticated && currentUser && !isPublicAuthRoute) {
      loadNotifications();
      loadUnreadCount();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, currentUser, pathname]);

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

  // Delete single notification
  const removeNotification = useCallback(async (notificationId) => {
    try {
      const response = await deleteNotifApi(notificationId);
      if (response.success) {
        setNotifications((prev) => {
          const target = prev.find(n => n.id === notificationId || n._id === notificationId);
          if (target && !target.isRead) {
            setUnreadCount((count) => Math.max(0, count - 1));
          }
          return prev.filter((notif) => notif.id !== notificationId && notif._id !== notificationId);
        });
      }
    } catch (error) {
      console.error('Delete notification error:', error);
    }
  }, []);

  // Clear all notifications
  const clearAllUserNotifications = useCallback(async () => {
    try {
      const response = await clearAllNotifsApi();
      if (response.success) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Clear all notifications error:', error);
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
    userRole,
    currentUser,
    markAsRead: markNotificationAsRead,
    markAllAsRead: markAllNotificationsAsRead,
    deleteNotification: removeNotification,
    clearAllNotifications: clearAllUserNotifications,
    refreshNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

