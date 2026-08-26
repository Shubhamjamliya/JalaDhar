import { createContext, useContext, useState, useEffect } from 'react';
import { vendorLogin, vendorLogout, vendorRegister } from '../services/vendorAuthApi';
import { toggleVendorOnlineStatus } from '../services/vendorApi';
import { registerFCMToken, unregisterFCMToken } from '../services/pushNotificationService';

const VendorAuthContext = createContext(null);

export const useVendorAuth = () => {
  const context = useContext(VendorAuthContext);
  if (!context) {
    throw new Error('useVendorAuth must be used within a VendorAuthProvider');
  }
  return context;
};

export const VendorAuthProvider = ({ children }) => {
  const [vendor, setVendor] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing auth on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('vendorAccessToken');
    const storedVendor = localStorage.getItem('vendor');

    if (storedToken && storedVendor) {
      try {
        setToken(storedToken);
        setVendor(JSON.parse(storedVendor));
        // Register push token if authenticated
        registerFCMToken('vendor');
      } catch (error) {
        console.error('Error parsing stored vendor:', error);
        localStorage.removeItem('vendorAccessToken');
        localStorage.removeItem('vendorRefreshToken');
        localStorage.removeItem('vendor');
      }
    }
    setLoading(false);
  }, []);

  /**
   * Register new vendor
   */
  const register = async (formData) => {
    try {
      const response = await vendorRegister(formData);

      if (response.success) {
        // Registration successful - vendor needs admin approval
        return {
          success: true,
          message: response.message || 'Registration successful. Your account is pending admin approval.',
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
   * Login vendor
   */
  const login = async (credentials) => {
    try {
      const response = await vendorLogin(credentials);

      if (response.success && response.data?.tokens) {
        const { tokens, vendor: vendorData } = response.data;

        // Store tokens and vendor data
        localStorage.setItem('vendorAccessToken', tokens.accessToken);
        localStorage.setItem('vendorRefreshToken', tokens.refreshToken);
        localStorage.setItem('vendor', JSON.stringify(vendorData));

        // Update state
        setToken(tokens.accessToken);
        setVendor(vendorData);

        // Register for push notifications
        registerFCMToken('vendor');

        return {
          success: true,
          message: response.message || 'Login successful',
          vendor: vendorData
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
   * Toggle vendor online availability status / smart pause
   */
  const updateOnlineStatus = async ({ isOnline, pauseDuration, pauseReason } = {}) => {
    if (!vendor) return { success: false, message: 'Vendor not authenticated' };
    
    // Save previous state for optimistic rollback
    const previousVendor = { ...vendor };
    
    // Optimistically update vendor
    const nextOnline = typeof isOnline === 'boolean' ? isOnline : !vendor.isOnline;
    const optimisticVendor = {
      ...vendor,
      isOnline: nextOnline,
      pauseReason: nextOnline ? null : (pauseReason || (pauseDuration === '2_HOURS' ? 'QUICK_BREAK' : pauseDuration === 'REST_OF_TODAY' ? 'BUSY_TODAY' : 'MANUAL')),
      pausedUntil: nextOnline ? null : (pauseDuration === '2_HOURS' ? new Date(Date.now() + 2 * 3600 * 1000).toISOString() : (pauseDuration === 'REST_OF_TODAY' ? new Date(new Date().setHours(24 + 8, 0, 0, 0)).toISOString() : null))
    };

    setVendor(optimisticVendor);
    localStorage.setItem('vendor', JSON.stringify(optimisticVendor));

    try {
      const response = await toggleVendorOnlineStatus({ isOnline: nextOnline, pauseDuration, pauseReason });
      if (response.success && response.data?.vendor) {
        const updated = {
          ...vendor,
          ...response.data.vendor
        };
        setVendor(updated);
        localStorage.setItem('vendor', JSON.stringify(updated));
        return { success: true, vendor: updated };
      }
      return { success: true, vendor: optimisticVendor };
    } catch (error) {
      console.error('Error toggling vendor online status:', error);
      // Rollback
      setVendor(previousVendor);
      localStorage.setItem('vendor', JSON.stringify(previousVendor));
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to update online status'
      };
    }
  };

  /**
   * Logout vendor
   */
  const logout = async () => {
    try {
      // Call logout API
      await vendorLogout();
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Unregister push token before clearing auth
      await unregisterFCMToken('vendor');

      // Clear local storage
      localStorage.removeItem('vendorAccessToken');
      localStorage.removeItem('vendorRefreshToken');
      localStorage.removeItem('vendor');

      // Clear state
      setToken(null);
      setVendor(null);

      // Redirect to login
      window.location.href = '/vendorlogin';
    }
  };

  const value = {
    vendor,
    setVendor,
    token,
    loading,
    isAuthenticated: !!token && !!vendor,
    login,
    register,
    logout,
    updateOnlineStatus
  };

  return <VendorAuthContext.Provider value={value}>{children}</VendorAuthContext.Provider>;
};


