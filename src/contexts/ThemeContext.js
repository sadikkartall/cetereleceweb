import React, { createContext, useContext, useMemo } from 'react';
import { createTheme } from '@mui/material/styles';

// Tema bağlamını oluştur
const ThemeContext = createContext();

// Tema sağlayıcı bileşeni
export function ThemeProvider({ children }) {
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: 'light',
          primary: {
            main: '#23272f',
          },
          secondary: {
            main: '#dc004e',
          },
          background: {
            default: '#f5f5f5',
            paper: '#fff',
          },
        },
        typography: {
          fontFamily: [
            '-apple-system',
            'BlinkMacSystemFont',
            '"Segoe UI"',
            'Roboto',
            '"Helvetica Neue"',
            'Arial',
            'sans-serif',
          ].join(','),
        },
      }),
    []
  );

  const value = {
    theme,
    mode: 'light',
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// Tema bağlamını kullanmak için özel kanca
export function useTheme() {
  return useContext(ThemeContext);
} 