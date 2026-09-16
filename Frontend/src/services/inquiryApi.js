import axios from 'axios';
import api from './api';

const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Public: Submit a contact inquiry from the landing page
 */
export const submitContactInquiry = async (data) => {
  const response = await publicApi.post('/contact', data);
  return response.data;
};

/**
 * Admin: Get all inquiries with optional status, search, and pagination
 */
export const getAdminInquiries = async (params = {}) => {
  const response = await api.get('/admin/inquiries', { params });
  return response.data;
};

/**
 * Admin: Get summary statistics for inquiries
 */
export const getAdminInquiryStats = async () => {
  const response = await api.get('/admin/inquiries/stats');
  return response.data;
};

/**
 * Admin: Update inquiry status and notes
 */
export const updateAdminInquiry = async (id, data) => {
  const response = await api.patch(`/admin/inquiries/${id}`, data);
  return response.data;
};

/**
 * Admin: Delete an inquiry
 */
export const deleteAdminInquiry = async (id) => {
  const response = await api.delete(`/admin/inquiries/${id}`);
  return response.data;
};
