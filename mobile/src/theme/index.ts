// Theme system

import { useThemeStore } from '../store/themeStore';
import { lightColors, darkColors, type Colors } from './colors';
import { spacing, type Spacing } from './spacing';
import { typography, type Typography } from './typography';

export { lightColors, darkColors, spacing, typography };
export type { Colors, Spacing, Typography };

export const useTheme = () => {
  const theme = useThemeStore((state) => state.theme);
  const colors: Colors = theme === 'light' ? lightColors : darkColors;

  return {
    theme,
    colors,
    spacing,
    typography,
  };
};
