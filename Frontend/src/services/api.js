import axios from 'axios';

// Base URL from environment variable or default
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important: Send cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add token to headers
api.interceptors.request.use(
  (config) => {
    // Determine which token to use based on the API endpoint
    let token = null;
    const url = config.url || '';
    
    // Admin routes - use admin token
    if (url.startsWith('/admin/')) {
      token = localStorage.getItem('adminAccessToken');
    }
    // Vendor routes - use vendor token
    else if (url.startsWith('/vendors/')) {
      token = localStorage.getItem('vendorAccessToken');
    }
    // User routes - use user token
    else if (url.startsWith('/users/')) {
      token = localStorage.getItem('accessToken');
    }
    // Fallback: try to determine from current route
    else {
      const currentPath = window.location.pathname;
      if (currentPath.startsWith('/admin')) {
        token = localStorage.getItem('adminAccessToken');
      } else if (currentPath.startsWith('/vendor')) {
        token = localStorage.getItem('vendorAccessToken');
      } else {
        token = localStorage.getItem('accessToken');
      }
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized - Token expired or invalid
    if (error.response?.status === 401) {
      const isVendorRoute = window.location.pathname.startsWith('/vendor');
      const isAdminRoute = window.location.pathname.startsWith('/admin');
      
      if (isAdminRoute) {
        // Clear admin tokens
        localStorage.removeItem('adminAccessToken');
        localStorage.removeItem('adminRefreshToken');
        localStorage.removeItem('admin');
        
        // Redirect to admin login if not already there
        if (window.location.pathname !== '/adminlogin') {
          window.location.href = '/adminlogin';
        }
      } else if (isVendorRoute) {
        // Clear vendor tokens
        localStorage.removeItem('vendorAccessToken');
        localStorage.removeItem('vendorRefreshToken');
        localStorage.removeItem('vendor');
        
        // Redirect to vendor login if not already there
        if (window.location.pathname !== '/vendorlogin' && window.location.pathname !== '/vendorsignup') {
          window.location.href = '/vendorlogin';
        }
      } else {
        // Clear user tokens
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        // Redirect to user login if not already there
        if (window.location.pathname !== '/userlogin' && window.location.pathname !== '/usersignup') {
          window.location.href = '/userlogin';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;

