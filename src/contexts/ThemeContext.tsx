import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (isDark: boolean) => void;
  accent: 'violet' | 'teal' | 'indigo';
  setAccent: (accent: 'violet' | 'teal' | 'indigo') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [accent, setAccentState] = useState<'violet' | 'teal' | 'indigo'>('violet');

  // Load theme preference from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme !== null) {
      setIsDarkMode(JSON.parse(savedTheme));
    } else {
      // Check system preference
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(systemPrefersDark);
    }
    const savedAccent = localStorage.getItem('accentColor') as any;
    if (savedAccent === 'teal' || savedAccent === 'indigo' || savedAccent === 'violet') {
      setAccentState(savedAccent);
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  // Apply accent CSS variables when accent changes
  useEffect(() => {
    const root = document.documentElement;
    // Map simple presets to HSL values consistent with our palette
    const presets: Record<'violet' | 'teal' | 'indigo', { accent: string; accentLight: string; accentFg: string }> = {
      violet: { accent: '260 30% 80%', accentLight: '260 30% 90%', accentFg: '215 25% 27%' },
      teal: { accent: '160 70% 70%', accentLight: '160 70% 82%', accentFg: '215 25% 27%' },
      indigo: { accent: '231 50% 70%', accentLight: '231 50% 82%', accentFg: '215 25% 27%' },
    };
    const p = presets[accent];
    root.style.setProperty('--accent', p.accent);
    root.style.setProperty('--accent-light', p.accentLight);
    root.style.setProperty('--accent-foreground', p.accentFg);
    localStorage.setItem('accentColor', accent);
  }, [accent]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  const setDarkMode = (isDark: boolean) => {
    setIsDarkMode(isDark);
  };

  const setAccent = (a: 'violet' | 'teal' | 'indigo') => {
    setAccentState(a);
  };

  const value = {
    isDarkMode,
    toggleDarkMode,
    setDarkMode,
    accent,
    setAccent,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};










