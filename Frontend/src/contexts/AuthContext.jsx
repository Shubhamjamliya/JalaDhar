import { createContext, useContext, useState, useEffect } from 'react';
import { userLogin, userLogout, userRegister, verifyUserLoginOTP } from '../services/authApi';
import { registerFCMToken, unregisterFCMToken } from '../services/pushNotificationService';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem('accessToken') || null;
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem('user');
      return storedUser && storedUser !== 'undefined' ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  // Background registration on mount if authenticated
  useEffect(() => {
    if (token && user) {
      try {
        registerFCMToken('user');
      } catch (e) {
        console.warn('FCM registration error:', e);
      }
    }
  }, [token, user]);

  /**
   * Register new user
   */
  const register = async (userData) => {
    try {
      const response = await userRegister(userData);

      if (response.success) {
        if (response.data?.tokens) {
          const { tokens, user: userData } = response.data;
          localStorage.setItem('accessToken', tokens.accessToken);
          localStorage.setItem('refreshToken', tokens.refreshToken);
          localStorage.setItem('user', JSON.stringify(userData));

          setToken(tokens.accessToken);
          setUser(userData);
          registerFCMToken('user');
        }

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
   * Login user
   */
  const login = async (credentials) => {
    try {
      const response = await userLogin(credentials);

      if (response.success && response.data?.tokens) {
        const { tokens, user: userData } = response.data;

        // Store tokens and user data
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        localStorage.setItem('user', JSON.stringify(userData));

        // Update state
        setToken(tokens.accessToken);
        setUser(userData);

        // Register for push notifications
        registerFCMToken('user');

        return {
          success: true,
          message: response.message || 'Login successful',
          user: userData
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

  const verifyLoginOTP = async ({ token: verificationToken, otp }) => {
    try {
      const response = await verifyUserLoginOTP({ token: verificationToken, otp });

      if (response.success && response.data?.tokens) {
        const { tokens, user: userData } = response.data;

        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
        localStorage.setItem('user', JSON.stringify(userData));

        setToken(tokens.accessToken);
        setUser(userData);
        registerFCMToken('user');

        return {
          success: true,
          message: response.message || 'Login successful',
          user: userData
        };
      } else {
        return {
          success: false,
          message: response.message || 'Login verification failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Login verification failed'
      };
    }
  };

  /**
   * Logout user
   */
  const logout = async () => {
    try {
      // Call logout API
      await userLogout();
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Unregister push token before clearing auth
      await unregisterFCMToken('user');

      // Clear local storage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');

      // Clear state
      setToken(null);
      setUser(null);

      // Redirect to login
      window.location.href = '/userlogin';
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    login,
    register,
    verifyLoginOTP,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

