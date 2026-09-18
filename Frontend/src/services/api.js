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
  if (config.skipCache || config.headers?.['x-skip-cache']) {
    return false;
  }

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
    let authRole = null;
    const url = config.url || '';

    // Public auth endpoints don't need tokens
    // Note: /admin/auth/register/send-otp and /admin/auth/register/verify-otp are protected internal admin endpoints
    const isPublicAuthEndpoint =
      (url.includes('/auth/register') && !url.includes('/admin/auth/register/')) ||
      url.includes('/auth/login') ||
      url.includes('/auth/forgot-password') ||
      url.includes('/auth/reset-password');

    if (!isPublicAuthEndpoint) {
      const currentPath = window.location.pathname;

      // 1. Explicit admin endpoint or active admin UI path -> use admin token
      if (url.startsWith('/admin/') || url === '/admin' || url.startsWith('/admin?') || currentPath.startsWith('/admin')) {
        token = localStorage.getItem('adminAccessToken') || localStorage.getItem('accessToken');
        authRole = 'admin';
      }
      // 2. Explicit vendor endpoint, vendor ratings, or active vendor UI path -> use vendor token
      else if (url.startsWith('/vendors/') || url.startsWith('/ratings/my-ratings') || currentPath.startsWith('/vendor')) {
        token = localStorage.getItem('vendorAccessToken') || localStorage.getItem('accessToken');
        authRole = 'vendor';
      }
      // 3. User endpoints or active user UI path -> use user token
      else if (url.startsWith('/users/') || url.startsWith('/user/') || url.startsWith('/bookings/') || url.startsWith('/ratings/')) {
        token = localStorage.getItem('accessToken');
        authRole = 'user';
      }
      // 4. Shared Notification / Dispute Endpoints -> resolve via path context
      else if (url.startsWith('/notifications') || url.includes('/notifications') || url.startsWith('/disputes')) {
        if (currentPath.startsWith('/admin')) {
          token = localStorage.getItem('adminAccessToken');
          authRole = 'admin';
        } else if (currentPath.startsWith('/vendor')) {
          token = localStorage.getItem('vendorAccessToken');
          authRole = 'vendor';
        } else if (currentPath.startsWith('/user')) {
          token = localStorage.getItem('accessToken');
          authRole = 'user';
        } else {
          if (localStorage.getItem('accessToken')) {
            token = localStorage.getItem('accessToken');
            authRole = 'user';
          } else if (localStorage.getItem('vendorAccessToken')) {
            token = localStorage.getItem('vendorAccessToken');
            authRole = 'vendor';
          } else if (localStorage.getItem('adminAccessToken')) {
            token = localStorage.getItem('adminAccessToken');
            authRole = 'admin';
          }
        }
      }
      // 5. General Fallback
      else {
        if (currentPath.startsWith('/admin')) {
          token = localStorage.getItem('adminAccessToken');
          authRole = 'admin';
        } else if (currentPath.startsWith('/vendor')) {
          token = localStorage.getItem('vendorAccessToken');
          authRole = 'vendor';
        } else if (currentPath.startsWith('/user') || currentPath.startsWith('/booking')) {
          token = localStorage.getItem('accessToken');
          authRole = 'user';
        } else {
          if (localStorage.getItem('accessToken')) {
            token = localStorage.getItem('accessToken');
            authRole = 'user';
          } else if (localStorage.getItem('vendorAccessToken')) {
            token = localStorage.getItem('vendorAccessToken');
            authRole = 'vendor';
          } else if (localStorage.getItem('adminAccessToken')) {
            token = localStorage.getItem('adminAccessToken');
            authRole = 'admin';
          }
        }
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      config.__authRole = authRole;
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
    // Clear cache on successful mutations to ensure fresh data
    const method = response.config?.method?.toUpperCase();
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const url = (response.config?.url || '').toLowerCase();
      if (url.includes('booking')) {
        clearCache('booking');
      }
      if (url.includes('vendor')) {
        clearCache('vendor');
      }
      if (url.includes('user')) {
        clearCache('user');
      }
      if (url.includes('payment') || url.includes('wallet')) {
        clearCache('payment');
        clearCache('wallet');
      }
    }

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
      const pathname = window.location.pathname;
      const failedAuthRole = error.config?.__authRole;

      if (failedAuthRole === 'admin') {
        localStorage.removeItem('adminAccessToken');
        localStorage.removeItem('adminRefreshToken');
        localStorage.removeItem('admin');

        if (pathname.startsWith('/admin') && pathname !== '/adminlogin') {
          window.location.href = '/adminlogin';
        }
      } else if (failedAuthRole === 'vendor') {
        localStorage.removeItem('vendorAccessToken');
        localStorage.removeItem('vendorRefreshToken');
        localStorage.removeItem('vendor');

        if (pathname.startsWith('/vendor') && pathname !== '/vendorlogin' && pathname !== '/vendorsignup') {
          window.location.href = '/vendorlogin';
        }
      } else if (failedAuthRole === 'user') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');

        if ((pathname.startsWith('/user') || pathname.startsWith('/booking')) &&
            pathname !== '/userlogin' && pathname !== '/usersignup') {
          window.location.href = '/userlogin';
        }
      }
      // Critical: If no token was sent, or on non-authenticated public calls, never wipe session or redirect!
    }

    return Promise.reject(error);
  }
);

export default api;

