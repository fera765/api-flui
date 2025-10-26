import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'light' | 'dark';

export type ThemeName = 'ocean' | 'forest' | 'sunset' | 'midnight';

export interface Theme {
  name: ThemeName;
  label: string;
  color: string;
  mode: ThemeMode;
}

interface ThemeContextType {
  theme: ThemeName;
  mode: ThemeMode;
  setTheme: (theme: ThemeName) => void;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const themes: Record<ThemeName, { label: string; color: string }> = {
  ocean: {
    label: 'Ocean',
    color: '#0EA5E9', // Sky blue
  },
  forest: {
    label: 'Forest',
    color: '#10B981', // Emerald green
  },
  sunset: {
    label: 'Sunset',
    color: '#F43F5E', // Rose pink
  },
  midnight: {
    label: 'Midnight',
    color: '#8B5CF6', // Violet purple
  },
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>('ocean');
  const [mode, setModeState] = useState<ThemeMode>('light');

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('flui-theme') as ThemeName;
    const savedMode = localStorage.getItem('flui-mode') as ThemeMode;
    
    if (savedTheme && themes[savedTheme]) {
      setThemeState(savedTheme);
    }
    
    if (savedMode) {
      setModeState(savedMode);
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove all theme classes
    Object.keys(themes).forEach((t) => {
      root.classList.remove(`theme-${t}`);
    });
    
    // Add current theme class
    root.classList.add(`theme-${theme}`);
    
    // Add dark class if mode is dark
    if (mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    // Save to localStorage
    localStorage.setItem('flui-theme', theme);
    localStorage.setItem('flui-mode', mode);
  }, [theme, mode]);

  const setTheme = (newTheme: ThemeName) => {
    setThemeState(newTheme);
  };

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
  };

  const toggleMode = () => {
    setModeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, mode, setTheme, setMode, toggleMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
