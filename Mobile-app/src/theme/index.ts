import { colors, lightColors, darkColors } from './colors';
import { typography, textStyles } from './typography';
import { spacing, borderRadius, shadows } from './spacing';

type ThemeColors = typeof colors & Omit<typeof lightColors, 'statusBar'> & {
  statusBar: 'dark-content' | 'light-content';
};

export interface Theme {
  colors: ThemeColors;
  typography: typeof typography;
  textStyles: typeof textStyles;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  shadows: typeof shadows;
  isDark: boolean;
}

export const lightTheme: Theme = {
  colors: { ...colors, ...lightColors },
  typography,
  textStyles,
  spacing,
  borderRadius,
  shadows,
  isDark: false,
};

export const darkTheme: Theme = {
  colors: { ...colors, ...darkColors },
  typography,
  textStyles,
  spacing,
  borderRadius,
  shadows,
  isDark: true,
};

export { colors, lightColors, darkColors } from './colors';
export { typography, textStyles } from './typography';
export { spacing, borderRadius, shadows } from './spacing';
export { ThemeProvider, useTheme } from './ThemeContext';
