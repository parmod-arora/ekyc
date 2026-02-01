// Theme Provider wrapper

import React, { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { useThemeStore } from '../store/themeStore';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const setTheme = useThemeStore((state) => state.setTheme);

  // Initialize theme on first load if not set
  useEffect(() => {
    const initTheme = async () => {
      const currentTheme = useThemeStore.getState().theme;
      if (!currentTheme && systemColorScheme) {
        setTheme(systemColorScheme === 'dark' ? 'dark' : 'light');
      }
    };
    initTheme();
  }, []);

  return <>{children}</>;
};
