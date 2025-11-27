# Toast Notification System

A comprehensive, modular toast notification system integrated into the Jaladhar application.

## 📦 What's Included

### 1. **ToastProvider Component** (`components/ToastProvider.jsx`)
   - Centralized toast configuration
   - Theme-aware styling
   - Mobile-first responsive design
   - Professional animations

### 2. **useToast Hook** (`hooks/useToast.js`)
   - Simple, consistent API for displaying toasts
   - Multiple toast types: success, error, info, warning, loading
   - Promise-based toast handling
   - Toast dismissal methods

### 3. **Toast Helper Utilities** (`utils/toastHelper.js`)
   - API error handling utilities
   - Validation error formatting
   - Loading toast creators
   - Custom toast configurations

## 🚀 Quick Start

### Basic Usage

```jsx
import { useToast } from '../../../hooks/useToast';

function MyComponent() {
  const toast = useToast();

  const handleAction = async () => {
    try {
      // Your API call
      await api.someAction();
      toast.showSuccess('Action completed!');
    } catch (error) {
      toast.showError('Action failed!');
    }
  };

  return <button onClick={handleAction}>Do Something</button>;
}
```

### With Loading State

```jsx
const handleWithLoading = async () => {
  const loadingToast = toast.showLoading('Processing...');
  
  try {
    await api.action();
    toast.dismissToast(loadingToast);
    toast.showSuccess('Success!');
  } catch (error) {
    toast.dismissToast(loadingToast);
    toast.showError('Failed!');
  }
};
```

### Promise-Based Toast

```jsx
toast.promise(
  api.updateProfile(data),
  {
    loading: 'Updating profile...',
    success: 'Profile updated successfully!',
    error: 'Failed to update profile'
  }
);
```

### Using Helper Utilities

```jsx
import { handleApiError, handleApiSuccess } from '../../../utils/toastHelper';

try {
  const response = await api.action();
  handleApiSuccess('Operation successful!');
} catch (error) {
  handleApiError(error, 'Default error message');
}
```

## 🎨 Toast Types

### Success Toast
```jsx
toast.showSuccess('Profile updated successfully!');
```

### Error Toast
```jsx
toast.showError('Failed to save changes');
```

### Info Toast
```jsx
toast.showInfo('New update available');
```

### Warning Toast
```jsx
toast.showWarning('Please review your input');
```

### Loading Toast
```jsx
const toastId = toast.showLoading('Loading data...');
// Later: toast.dismissToast(toastId);
```

## 📱 Mobile Optimization

The toast system is optimized for mobile-first design:
- Responsive sizing (max-width: 90vw on mobile)
- Touch-friendly spacing
- Professional animations
- Top-center positioning for better visibility

## 🎯 Features

✅ **Theme Integration** - Automatically adapts to your app's theme  
✅ **Mobile-First** - Designed for smartphone-first experience  
✅ **Type-Safe** - Consistent API across all components  
✅ **Modular** - Easy to customize and extend  
✅ **Performance** - Lightweight (~3KB) with smooth animations  
✅ **Accessible** - WCAG compliant with proper ARIA attributes  

## 🔧 Customization

### Change Toast Position

Edit `components/ToastProvider.jsx`:

```jsx
<Toaster
  position="top-right" // or "bottom-center", "top-left", etc.
  // ...
/>
```

### Customize Duration

```jsx
toast.showSuccess('Message', { duration: 5000 }); // 5 seconds
```

### Custom Styling

The toast styling is centralized in `ToastProvider.jsx`. Modify the `toastOptions` object to customize colors, sizes, borders, etc.

## 📝 Best Practices

1. **Use loading toasts for async operations** - Shows progress and prevents duplicate actions
2. **Provide meaningful messages** - Be specific about what happened
3. **Dismiss loading toasts** - Always dismiss loading toasts after completion
4. **Use helper utilities** - Leverage `handleApiError` for consistent error handling
5. **Keep messages concise** - Toast messages should be short and clear

## 🔄 Migration from Inline Messages

The toast system replaces inline error/success messages. To migrate:

**Before:**
```jsx
{error && <div className="error-message">{error}</div>}
```

**After:**
```jsx
toast.showError(error);
```

Benefits:
- No need to manage state for messages
- Consistent styling across the app
- Better mobile UX
- Less code in components

## 📚 Examples

See updated components:
- `modules/user/user-pages/UserLogin.jsx`
- `modules/user/user-pages/UserSignup.jsx`

These demonstrate best practices for using the toast system.

