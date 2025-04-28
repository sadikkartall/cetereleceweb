import React, { createContext, useContext, useState, useEffect } from 'react';
import { createAppTheme } from '../theme';

// Tema bağlamını oluştur
const ThemeContext = createContext();

// Tema sağlayıcı bileşeni
export function ThemeProvider({ children }) {
  // Yerel depolamadan tema modunu al veya varsayılan olarak 'light' kullan
  const [mode, setMode] = useState(() => {
    const savedMode = localStorage.getItem('themeMode');
    return savedMode || 'light';
  });

  // Tema modu değiştiğinde yerel depolamayı güncelle
  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  // Tema modunu değiştir
  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  // Tema nesnesini oluştur
  const theme = createAppTheme(mode);

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Tema bağlamını kullanmak için özel kanca
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 