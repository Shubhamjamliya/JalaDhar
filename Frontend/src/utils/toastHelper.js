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

  toast.dismiss();

  // Handle validation errors (array of errors)
  if (Array.isArray(errorMessage)) {
    return toast.error(errorMessage[0] || defaultMessage, { duration: 4000 });
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
export const handleApiSuccess = (messageOrResponse = 'Operation completed successfully!', fallbackMessageOrDuration = 3000) => {
  let messageText = 'Operation completed successfully!';
  let duration = 3000;

  if (typeof messageOrResponse === 'string') {
    messageText = messageOrResponse;
    if (typeof fallbackMessageOrDuration === 'number') {
      duration = fallbackMessageOrDuration;
    }
  } else if (typeof messageOrResponse === 'object' && messageOrResponse !== null) {
    if (typeof fallbackMessageOrDuration === 'string') {
      messageText = fallbackMessageOrDuration;
    } else {
      messageText = messageOrResponse.message || messageOrResponse.data?.message || 'Operation completed successfully!';
    }
  }

  toast.dismiss();
  return toast.success(messageText, {
    icon: '✓',
    duration,
  });
};

/**
 * Handle form validation errors
 * @param {Object|Array} errors - Validation errors object or array
 */
export const handleValidationErrors = (errors) => {
  if (!errors) return;

  toast.dismiss();

  if (typeof errors === 'string') {
    toast.error(errors);
    return;
  }

  if (Array.isArray(errors)) {
    if (errors[0]) toast.error(errors[0]);
    return;
  }

  if (typeof errors === 'object') {
    const firstError = Object.values(errors)[0];
    if (typeof firstError === 'string') {
      toast.error(firstError);
    } else if (Array.isArray(firstError) && firstError[0]) {
      toast.error(firstError[0]);
    }
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

