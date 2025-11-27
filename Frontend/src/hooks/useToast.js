import toast from 'react-hot-toast';

/**
 * Custom Toast Hook
 * 
 * Provides a consistent and easy-to-use API for displaying toast notifications
 * throughout the application.
 * 
 * @returns {Object} Toast methods
 * 
 * @example
 * const toast = useToast();
 * toast.showSuccess('Profile updated successfully!');
 * toast.showError('Failed to update profile');
 */
export const useToast = () => {
  /**
   * Display a success toast notification
   * @param {string} message - Success message to display
   * @param {Object} options - Additional toast options
   */
  const showSuccess = (message, options = {}) => {
    return toast.success(message, {
      icon: '✓',
      duration: options.duration || 3000,
      ...options,
    });
  };

  /**
   * Display an error toast notification
   * @param {string} message - Error message to display
   * @param {Object} options - Additional toast options
   */
  const showError = (message, options = {}) => {
    return toast.error(message, {
      duration: options.duration || 4000,
      ...options,
    });
  };

  /**
   * Display an info toast notification
   * @param {string} message - Info message to display
   * @param {Object} options - Additional toast options
   */
  const showInfo = (message, options = {}) => {
    return toast(message, {
      icon: 'ℹ️',
      duration: options.duration || 3000,
      ...options,
    });
  };

  /**
   * Display a warning toast notification
   * @param {string} message - Warning message to display
   * @param {Object} options - Additional toast options
   */
  const showWarning = (message, options = {}) => {
    return toast(message, {
      icon: '⚠️',
      duration: options.duration || 3500,
      style: {
        border: '1px solid #F59E0B',
        background: '#ffffff',
        color: '#3A3A3A',
      },
      iconTheme: {
        primary: '#F59E0B',
        secondary: '#ffffff',
      },
      ...options,
    });
  };

  /**
   * Display a loading toast notification
   * Returns toast ID for later dismissal
   * @param {string} message - Loading message to display
   * @param {Object} options - Additional toast options
   * @returns {string} Toast ID
   */
  const showLoading = (message = 'Loading...', options = {}) => {
    return toast.loading(message, {
      duration: Infinity, // Loading toasts don't auto-dismiss
      ...options,
    });
  };

  /**
   * Dismiss a specific toast by ID
   * @param {string} toastId - Toast ID to dismiss
   */
  const dismissToast = (toastId) => {
    toast.dismiss(toastId);
  };

  /**
   * Dismiss all toasts
   */
  const dismissAll = () => {
    toast.dismiss();
  };

  /**
   * Promise toast - automatically handles loading, success, and error states
   * @param {Promise} promise - Promise to track
   * @param {Object} messages - Messages object with loading, success, error keys
   * @returns {Promise} The original promise
   * 
   * @example
   * toast.promise(
   *   api.updateProfile(data),
   *   {
   *     loading: 'Updating profile...',
   *     success: 'Profile updated successfully!',
   *     error: 'Failed to update profile'
   *   }
   * );
   */
  const promise = (promise, messages) => {
    return toast.promise(promise, messages);
  };

  return {
    showSuccess,
    showError,
    showInfo,
    showWarning,
    showLoading,
    dismissToast,
    dismissAll,
    promise,
  };
};

export default useToast;

