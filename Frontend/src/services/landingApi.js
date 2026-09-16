import axios from 'axios';
import api from './api';

// Plain axios instance for public routes — no auth token, no 401 redirect interceptor
const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

/**
 * Get the full landing page content (public, no auth required)
 */
export const getLandingContent = async () => {
  const response = await publicApi.get(`/landing?_t=${Date.now()}`);
  return response.data;
};

/**
 * Update a specific landing page section (admin only)
 * @param {string} section - Section name (hero, services, faqs, etc.)
 * @param {Object} data - Section data object
 */
export const updateLandingSection = async (section, data) => {
  const response = await api.patch(`/admin/landing/${section}`, data);
  return response.data;
};

/**
 * Upload an image for a landing page section (admin only)
 * @param {File} file - Image file
 * @param {string} section - Section identifier for Cloudinary folder
 * @param {string} [oldPublicId] - Previous Cloudinary public ID to delete
 */
export const uploadLandingImage = async (file, section = 'general', oldPublicId = null) => {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('section', section);
  if (oldPublicId) formData.append('oldPublicId', oldPublicId);
  const response = await api.post('/admin/landing/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

/**
 * Upload a video for a landing page section (admin only)
 * @param {File} file - Video file (MP4, WebM, etc.)
 * @param {string} section - Section identifier for Cloudinary folder
 * @param {string} [oldPublicId] - Previous Cloudinary public ID to delete
 */
export const uploadLandingVideo = async (file, section = 'app-videos', oldPublicId = null) => {
  const formData = new FormData();
  formData.append('video', file);
  formData.append('section', section);
  if (oldPublicId) formData.append('oldPublicId', oldPublicId);
  const response = await api.post('/admin/landing/upload-video', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};
