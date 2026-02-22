import api from './api';

export const getDashboardStats = async () => {
  try {
    const response = await api.get('/admin/dashboard/stats');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getRevenueAnalytics = async (params) => {
  try {
    const response = await api.get('/admin/dashboard/revenue', { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getBookingTrends = async (days = 30) => {
  try {
    const response = await api.get('/admin/dashboard/bookings/trends', { params: { days } });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getUserGrowthMetrics = async (days = 30) => {
  try {
    const response = await api.get('/admin/dashboard/users/growth', { params: { days } });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getPaymentAnalytics = async (days = 30) => {
  try {
    const response = await api.get('/admin/dashboard/payments/analytics', { params: { days } });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getPaymentOverview = async (startDate, endDate) => {
  try {
    const response = await api.get('/admin/payments/overview', { params: { startDate, endDate } });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getPaymentDetailedReport = async (endpoint, params) => {
  try {
    const response = await api.get(endpoint, { params });
    return response.data;
  } catch (error) {
    throw error;
  }
};
