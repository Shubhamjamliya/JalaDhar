import { createContext, useContext, useState, useEffect } from 'react';
import { adminLogin, adminLogout, adminRegister } from '../services/adminApi';

const AdminAuthContext = createContext(null);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing auth on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('adminAccessToken');
    const storedAdmin = localStorage.getItem('admin');

    if (storedToken && storedAdmin) {
      try {
        setToken(storedToken);
        setAdmin(JSON.parse(storedAdmin));
      } catch (error) {
        console.error('Error parsing stored admin:', error);
        localStorage.removeItem('adminAccessToken');
        localStorage.removeItem('adminRefreshToken');
        localStorage.removeItem('admin');
      }
    }
    setLoading(false);
  }, []);

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
      // Clear local storage
      localStorage.removeItem('adminAccessToken');
      localStorage.removeItem('adminRefreshToken');
      localStorage.removeItem('admin');
      
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
    logout
  };

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
};

