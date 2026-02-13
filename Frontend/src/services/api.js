import axios from 'axios';
import { getCachedResponse, setCachedResponse, clearCache } from '../utils/apiCache';

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

// Cacheable GET requests (read-only endpoints)
const CACHEABLE_METHODS = ['GET'];
const CACHEABLE_ENDPOINTS = [
  '/vendors/dashboard',
  '/bookings/dashboard/stats',
  '/admin/vendors',
  '/admin/users',
  '/admin/payments/statistics',
  '/bookings/vendors/nearby',
  '/bookings/my-bookings',
  '/vendors/bookings/my-bookings',
];

// Check if request should be cached
const shouldCache = (config) => {
  if (!CACHEABLE_METHODS.includes(config.method?.toUpperCase())) {
    return false;
  }

  const url = config.url || '';
  return CACHEABLE_ENDPOINTS.some(endpoint => url.includes(endpoint));
};

// Request interceptor - Add token to headers and check cache
api.interceptors.request.use(
  (config) => {
    // Check cache for GET requests
    if (shouldCache(config)) {
      const cachedData = getCachedResponse(config);
      if (cachedData) {
        // Return cached data as a resolved promise
        return Promise.reject({
          __cached: true,
          data: cachedData
        });
      }
    }

    // Determine which token to use based on the API endpoint
    let token = null;
    const url = config.url || '';

    // Public auth endpoints don't need tokens
    const isPublicAuthEndpoint =
      url.includes('/auth/register') ||
      url.includes('/auth/login') ||
      url.includes('/auth/forgot-password') ||
      url.includes('/auth/reset-password');

    if (!isPublicAuthEndpoint) {
      // Admin routes - use admin token
      if (url.startsWith('/admin/') || url === '/admin' || url.startsWith('/admin?')) {
        token = localStorage.getItem('adminAccessToken');
      }
      // Vendor routes - use vendor token
      else if (url.startsWith('/vendors/')) {
        token = localStorage.getItem('vendorAccessToken');
      }
      // Vendor-specific rating route - use vendor token
      else if (url === '/ratings/my-ratings' || url.startsWith('/ratings/my-ratings')) {
        token = localStorage.getItem('vendorAccessToken');
      }
      // User routes, booking routes, and other rating routes - use user token
      else if (url.startsWith('/users/') || url.startsWith('/bookings/') || url.startsWith('/ratings/')) {
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

// Response interceptor - Handle errors globally and cache responses
api.interceptors.response.use(
  (response) => {
    // Cache successful GET responses
    if (shouldCache(response.config)) {
      setCachedResponse(response.config, response.data);
    }
    return response;
  },
  (error) => {
    // Handle cached responses
    if (error.__cached) {
      return Promise.resolve({
        data: error.data,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {}
      });
    }

    // Clear cache on mutations to ensure fresh data
    if (error.config && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(error.config.method?.toUpperCase())) {
      const url = error.config.url || '';
      // Clear related cache entries
      if (url.includes('/bookings')) {
        clearCache('/bookings');
      } else if (url.includes('/vendors')) {
        clearCache('/vendors');
      } else if (url.includes('/users')) {
        clearCache('/users');
      }
    }

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

