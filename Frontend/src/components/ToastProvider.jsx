import { Toaster } from 'react-hot-toast';
import { useTheme } from '../contexts/ThemeContext';

/**
 * ToastProvider Component
 * 
 * Centralized toast notification provider with theme integration
 * Provides consistent toast styling across the entire application
 * 
 * Features:
 * - Mobile-first responsive design
 * - Theme-aware styling
 * - Customizable positions and durations
 * - Professional animations
 */
export default function ToastProvider() {
  const { themeColors, theme } = useTheme();
  const colors = themeColors[theme] || themeColors.default;

  return (
    <Toaster
      position="top-center"
      reverseOrder={false}
      gutter={8}
      containerClassName="toast-container"
      containerStyle={{
        top: 16,
        zIndex: 9999,
      }}
      toastOptions={{
        // Default options for all toasts
        className: '',
        duration: 3000,
        style: {
          background: '#ffffff',
          color: '#3A3A3A',
          borderRadius: '12px',
          padding: '12px 16px',
          fontSize: '14px',
          fontWeight: '500',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          maxWidth: '90vw',
          width: 'auto',
          minWidth: '280px',
          border: '1px solid #E5E7EB',
        },
        
        // Success toast styling
        success: {
          duration: 3000,
          iconTheme: {
            primary: '#10B981',
            secondary: '#ffffff',
          },
          style: {
            border: '1px solid #10B981',
            background: '#ffffff',
            color: '#3A3A3A',
          },
        },
        
        // Error toast styling
        error: {
          duration: 4000,
          iconTheme: {
            primary: '#EF4444',
            secondary: '#ffffff',
          },
          style: {
            border: '1px solid #EF4444',
            background: '#ffffff',
            color: '#3A3A3A',
          },
        },
        
        // Loading toast styling
        loading: {
          duration: Infinity, // Loading toasts don't auto-dismiss
          iconTheme: {
            primary: colors.primary,
            secondary: '#ffffff',
          },
          style: {
            border: `1px solid ${colors.primary}`,
            background: '#ffffff',
          },
        },
        
        // Custom blank toast (for info/warning)
        blank: {
          duration: 3000,
          style: {
            background: '#ffffff',
            border: '1px solid #E5E7EB',
          },
        },
      }}
    />
  );
}

