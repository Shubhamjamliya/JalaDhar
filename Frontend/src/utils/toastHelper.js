import toast from 'react-hot-toast';

/**
 * Toast Helper Utilities
 * 
 * Utility functions for handling common toast scenarios,
 * especially API error handling and form validation messages
 */

/**
 * Handle API errors and display appropriate toast messages
 * @param {Error} error - Error object from API call
 * @param {string} defaultMessage - Default error message if no specific message found
 * @returns {string} The toast ID
 * 
 * @example
 * try {
 *   await api.someAction();
 * } catch (error) {
 *   handleApiError(error, 'Failed to perform action');
 * }
 */
export const handleApiError = (error, defaultMessage = 'Something went wrong. Please try again.') => {
  // Extract error message from various error formats
  const errorMessage = 
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    defaultMessage;

  // Handle validation errors (array of errors)
  if (Array.isArray(errorMessage)) {
    errorMessage.forEach((msg) => {
      toast.error(msg);
    });
    return;
  }

  // Handle single error message
  return toast.error(errorMessage, {
    duration: 4000,
  });
};

/**
 * Handle API success and display success toast
 * @param {string} message - Success message
 * @param {number} duration - Toast duration in milliseconds
 * @returns {string} The toast ID
 */
export const handleApiSuccess = (message = 'Operation completed successfully!', duration = 3000) => {
  return toast.success(message, {
    icon: '✓',
    duration,
  });
};

/**
 * Handle form validation errors
 * @param {Object|Array} errors - Validation errors object or array
 * 
 * @example
 * // Single error message
 * handleValidationErrors('Email is required');
 * 
 * // Object with field errors
 * handleValidationErrors({ email: 'Email is invalid', password: 'Password too short' });
 * 
 * // Array of errors
 * handleValidationErrors(['Error 1', 'Error 2']);
 */
export const handleValidationErrors = (errors) => {
  if (!errors) return;

  if (typeof errors === 'string') {
    // Single error message
    toast.error(errors);
    return;
  }

  if (Array.isArray(errors)) {
    // Array of error messages
    errors.forEach((error) => {
      toast.error(error);
    });
    return;
  }

  if (typeof errors === 'object') {
    // Object with field errors
    Object.values(errors).forEach((error) => {
      if (typeof error === 'string') {
        toast.error(error);
      } else if (Array.isArray(error)) {
        error.forEach((err) => toast.error(err));
      }
    });
    return;
  }
};

/**
 * Create a loading toast that can be updated to success/error
 * @param {string} loadingMessage - Initial loading message
 * @returns {Object} Object with update and dismiss methods
 * 
 * @example
 * const loadingToast = createLoadingToast('Processing...');
 * try {
 *   await api.action();
 *   loadingToast.updateSuccess('Success!');
 * } catch (error) {
 *   loadingToast.updateError('Failed!');
 * }
 */
export const createLoadingToast = (loadingMessage = 'Loading...') => {
  const toastId = toast.loading(loadingMessage);

  return {
    toastId,
    updateSuccess: (message) => {
      toast.success(message, { id: toastId });
    },
    updateError: (message) => {
      toast.error(message, { id: toastId });
    },
    updateLoading: (message) => {
      toast.loading(message, { id: toastId });
    },
    dismiss: () => {
      toast.dismiss(toastId);
    },
  };
};

/**
 * Show a toast with custom configuration
 * @param {string} message - Message to display
 * @param {Object} config - Custom toast configuration
 * @returns {string} The toast ID
 */
export const showCustomToast = (message, config = {}) => {
  return toast(message, config);
};

