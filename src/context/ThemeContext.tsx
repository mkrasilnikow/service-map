import { createContext, useContext } from 'react';

interface ThemeContextValue {
  isDark: boolean;
}

export const ThemeContext = createContext<ThemeContextValue>({ isDark: true });

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
