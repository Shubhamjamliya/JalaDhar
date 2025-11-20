import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Get theme from localStorage or default to 'default'
    const savedTheme = localStorage.getItem('adminTheme');
    return savedTheme || 'default';
  });

  useEffect(() => {
    // Save theme to localStorage whenever it changes
    localStorage.setItem('adminTheme', theme);
    // Apply theme class to document root
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
  };

  const value = {
    theme,
    changeTheme,
    // Theme color mappings
    themeColors: {
      default: {
        primary: '#0A84FF',
        primaryDark: '#005BBB',
        gradient: 'from-[#0A84FF] to-[#005BBB]',
      },
      dark: {
        primary: '#6366F1',
        primaryDark: '#4F46E5',
        gradient: 'from-gray-800 to-gray-900',
      },
      green: {
        primary: '#10B981',
        primaryDark: '#059669',
        gradient: 'from-green-500 to-green-600',
      },
    },
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

