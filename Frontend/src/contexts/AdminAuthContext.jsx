import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { adminLogin, adminLogout, adminRegister } from '../services/adminApi';
import { registerFCMToken, unregisterFCMToken } from '../services/pushNotificationService';
import api from '../services/api';

const AdminAuthContext = createContext(null);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

export const AdminAuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('adminAccessToken') || null;
    } catch {
      return null;
    }
  });

  const [admin, setAdmin] = useState(() => {
    try {
      const storedAdmin = localStorage.getItem('admin');
      return storedAdmin && storedAdmin !== 'undefined' ? JSON.parse(storedAdmin) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  // Guard to run profile refresh only once on mount, not on every admin state change
  const hasSynced = useRef(false);

  const refreshProfile = useCallback(async () => {
    try {
      const response = await api.get('/admin/auth/profile');
      if (response.data?.success && response.data.data?.admin) {
        const latestAdmin = response.data.data.admin;
        setAdmin(latestAdmin);
        localStorage.setItem('admin', JSON.stringify(latestAdmin));
        return latestAdmin;
      }
    } catch (err) {
      console.error('Failed to sync admin profile:', err);
    }
    return null;
  }, []);

  // Background profile sync & FCM registration — only once on mount if authenticated
  useEffect(() => {
    if (token && !hasSynced.current) {
      hasSynced.current = true;
      try {
        registerFCMToken('admin');
      } catch (e) {
        console.warn('Admin FCM error:', e);
      }
      refreshProfile();
    }
    // Cross-tab and background token sync
    const handleStorageChange = (e) => {
      if (e.key === 'adminAccessToken' || e.key === 'admin') {
        const storedToken = localStorage.getItem('adminAccessToken');
        const storedAdmin = localStorage.getItem('admin');
        setToken(storedToken || null);
        try {
          setAdmin(storedAdmin && storedAdmin !== 'undefined' ? JSON.parse(storedAdmin) : null);
        } catch {
          setAdmin(null);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  // Only token and refreshProfile are needed — admin must NOT be a dep or it causes infinite loop
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, refreshProfile]);

  /**
   * Register new admin
   */
  const register = async (data) => {
    try {
      const response = await adminRegister(data);
      
      if (response.success) {
        return {
          success: true,
          message: response.message || 'Registration successful',
          data: response.data
        };
      } else {
        return {
          success: false,
          message: response.message || 'Registration failed',
          errors: response.errors
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Registration failed',
        errors: error.response?.data?.errors || []
      };
    }
  };

  /**
   * Login admin
   */
  const login = async (credentials) => {
    try {
      const response = await adminLogin(credentials);
      
      if (response.success && response.data?.tokens) {
        const { tokens, admin: adminData } = response.data;
        
        // Store tokens and admin data
        localStorage.setItem('adminAccessToken', tokens.accessToken);
        localStorage.setItem('adminRefreshToken', tokens.refreshToken);
        localStorage.setItem('admin', JSON.stringify(adminData));
        
        // Update state
        setToken(tokens.accessToken);
        setAdmin(adminData);
        
        // Register push token
        registerFCMToken('admin');

        return {
          success: true,
          message: response.message || 'Login successful',
          admin: adminData
        };
      } else {
        return {
          success: false,
          message: response.message || 'Login failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Login failed'
      };
    }
  };

  /**
   * Logout admin
   */
  const logout = async () => {
    try {
      // Call logout API
      await adminLogout();
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Unregister push token before clearing auth
      await unregisterFCMToken('admin');

      // Clear local storage
      localStorage.removeItem('adminAccessToken');
      localStorage.removeItem('adminRefreshToken');
      localStorage.removeItem('admin');
      localStorage.removeItem('lastActiveRoute');
      
      // Clear state
      setToken(null);
      setAdmin(null);
      
      // Redirect to login
      window.location.href = '/adminlogin';
    }
  };

  const value = {
    admin,
    token,
    loading,
    isAuthenticated: !!token && !!admin,
    login,
    register,
    logout,
    refreshProfile
  };

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
};

