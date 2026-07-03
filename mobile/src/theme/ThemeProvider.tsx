import React, { createContext, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { themes, type Theme, type ThemeName } from './tokens';

interface ThemeContextValue {
  theme: Theme;
  name: ThemeName;
  setTheme: (n: ThemeName) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [override, setOverride] = useState<ThemeName | null>(null);
  const name: ThemeName = override ?? (system === 'dark' ? 'dark' : 'light');

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: themes[name],
      name,
      setTheme: setOverride,
      toggle: () => setOverride(name === 'dark' ? 'light' : 'dark'),
    }),
    [name]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
