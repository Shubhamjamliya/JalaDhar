import api from './api';

/**
 * Get public settings (billing info, etc)
 * @param {string} category - Optional category to filter by
 */
export const getPublicSettings = async (category) => {
  try {
    const cat = (category && typeof category === 'object' && category.category) ? category.category : (typeof category === 'string' ? category : null);
    const url = cat ? `/settings?category=${cat}` : '/settings';
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Update a setting (Admin only)
 * @param {string} key - Setting key
 * @param {any} value - New value
 */
export const updateSetting = async (key, value) => {
  try {
    const response = await api.put('/settings', { key, value });
    return response.data;
  } catch (error) {
    throw error;
  }
};
