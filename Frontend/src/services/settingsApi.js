import api from './api';

/**
 * Get public settings (billing info, etc)
 * @param {string} category - Optional category to filter by
 */
export const getPublicSettings = async (category) => {
  try {
    const url = category ? `/settings?category=${category}` : '/settings';
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    throw error;
  }
};
