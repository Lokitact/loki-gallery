import React, { useState, useEffect } from 'react';
import { LoginPage } from './components/LoginPage';
import { GalleryPage } from './components/GalleryPage';
import type { User, TextAlign } from './types/index';

type Theme = 'dark' | 'light' | 'twilight' | 'midnight' | 'ocean' | 'system';

const accentColors: Record<string, { accent: string; hover: string; glow: string; }> = {
    emerald: { accent: '#10B981', hover: '#059669', glow: 'rgba(16, 185, 129, 0.3)' },
    cyan: { accent: '#06B6D4', hover: '#0891B2', glow: 'rgba(6, 182, 212, 0.4)' },
    pink: { accent: '#EC4899', hover: '#DB2777', glow: 'rgba(236, 72, 153, 0.3)' },
    violet: { accent: '#8B5CF6', hover: '#7C3AED', glow: 'rgba(139, 92, 246, 0.3)' },
    orange: { accent: '#F97316', hover: '#EA580C', glow: 'rgba(249, 115, 22, 0.3)' },
};

const getColumnConfig = (width: number) => {
    if (width < 768) return { min: 1, max: 3 }; // Mobile
    if (width < 1280) return { min: 2, max: 6 }; // Tablet/Small Desktop
    if (width < 1536) return { min: 2, max: 8 }; // Desktop
    return { min: 2, max: 10 }; // Large Desktop
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));


function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('galleryTheme') as Theme) || 'system');
  const [accent, setAccent] = useState<string>(() => localStorage.getItem('galleryAccent') || 'emerald');
  const [textAlign, setTextAlign] = useState<TextAlign>(() => (localStorage.getItem('galleryTextAlign') as TextAlign) || 'left');
  
  const [columnConfig, setColumnConfig] = useState(() => getColumnConfig(window.innerWidth));

  const [gridColumns, setGridColumns] = useState<number>(() => {
    const config = getColumnConfig(window.innerWidth);
    const savedColumnsRaw = localStorage.getItem('galleryGridColumns');

    if (savedColumnsRaw) {
      const savedColumns = parseInt(savedColumnsRaw, 10);
      return clamp(savedColumns, config.min, config.max);
    }
    // If no value is saved, default to the center of the available range.
    return Math.round((config.min + config.max) / 2);
  });
  
  useEffect(() => {
    const handleResize = () => {
        const newConfig = getColumnConfig(window.innerWidth);
        setColumnConfig(newConfig);
        setGridColumns(currentColumns => clamp(currentColumns, newConfig.min, newConfig.max));
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    localStorage.setItem('galleryAccent', accent);
    const root = document.documentElement;
    const colors = accentColors[accent];
    if (colors) {
      root.style.setProperty('--color-accent', colors.accent);
      root.style.setProperty('--color-accent-hover', colors.hover);
      root.style.setProperty('--color-accent-glow', `0 0 15px ${colors.glow}`);
    }
  }, [accent]);

  useEffect(() => {
    localStorage.setItem('galleryTheme', theme);
    if (theme === 'system') {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleSystemThemeChange = (e: MediaQueryListEvent) => {
            document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        };
        document.documentElement.setAttribute('data-theme', mediaQuery.matches ? 'dark' : 'light');
        mediaQuery.addEventListener('change', handleSystemThemeChange);
        return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
    } else {
        document.documentElement.setAttribute('data-theme', theme);
        return () => {};
    }
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('galleryGridColumns', String(gridColumns));
  }, [gridColumns]);

  useEffect(() => {
    localStorage.setItem('galleryTextAlign', textAlign);
  }, [textAlign]);


  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };
  
  const handleUpdateUser = (updatedUser: User) => {
    setCurrentUser(updatedUser);
  };

  return (
    <div>
      {currentUser ? (
        <GalleryPage
            user={currentUser}
            onLogout={handleLogout}
            onUpdateUser={handleUpdateUser}
            theme={theme}
            setTheme={setTheme}
            accent={accent}
            setAccent={setAccent}
            gridColumns={gridColumns}
            setGridColumns={setGridColumns}
            columnConfig={columnConfig}
            textAlign={textAlign}
            setTextAlign={setTextAlign}
        />
      ) : (
        <LoginPage onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}

export default App;