import { createTheme } from '@mui/material/styles';

// Açık tema renk paleti
const lightPalette = {
  mode: 'light',
  primary: {
    main: '#5a01d5',
    light: '#8e59e2',
    dark: '#3700B3',
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#00bfad',
    light: '#4aecd8',
    dark: '#018f82',
    contrastText: '#000000',
  },
  error: {
    main: '#B00020',
    light: '#E57373',
    dark: '#8E0000',
  },
  background: {
    default: '#e8e8e8',
    paper: '#f8f8f8',
    card: '#f0f0f0',
    elevation1: '#e5e5e5',
    elevation2: '#dddddd',
  },
  text: {
    primary: '#121212',
    secondary: 'rgba(0, 0, 0, 0.7)',
    disabled: 'rgba(0, 0, 0, 0.5)',
    hint: 'rgba(0, 0, 0, 0.5)',
  },
  divider: 'rgba(0, 0, 0, 0.12)',
};

// Koyu tema renk paleti
const darkPalette = {
  mode: 'dark',
  primary: {
    main: '#BB86FC',
    light: '#E0B8FF',
    dark: '#8858C8',
    contrastText: '#000000',
  },
  secondary: {
    main: '#03DAC6',
    light: '#66FFF8',
    dark: '#00A896',
    contrastText: '#000000',
  },
  error: {
    main: '#CF6679',
    light: '#FF99A5',
    dark: '#9B3450',
  },
  background: {
    default: '#121212',
    paper: '#1E1E1E',
    card: '#252525',
    elevation1: '#2C2C2C',
    elevation2: '#333333',
  },
  text: {
    primary: '#FFFFFF',
    secondary: 'rgba(255, 255, 255, 0.7)',
    disabled: 'rgba(255, 255, 255, 0.5)',
    hint: 'rgba(255, 255, 255, 0.5)',
  },
  divider: 'rgba(255, 255, 255, 0.12)',
};

// Tema oluşturma fonksiyonu
export const createAppTheme = (mode = 'light') => {
  const palette = mode === 'light' ? lightPalette : darkPalette;
  
  return createTheme({
    palette,
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontSize: '2.5rem',
        fontWeight: 700,
        letterSpacing: '-0.02em',
        lineHeight: 1.2,
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 600,
        letterSpacing: '-0.01em',
        lineHeight: 1.3,
      },
      h3: {
        fontSize: '1.75rem',
        fontWeight: 600,
        letterSpacing: '-0.01em',
        lineHeight: 1.3,
      },
      h4: {
        fontSize: '1.5rem',
        fontWeight: 500,
        letterSpacing: '0',
        lineHeight: 1.4,
      },
      h5: {
        fontSize: '1.25rem',
        fontWeight: 500,
        letterSpacing: '0',
        lineHeight: 1.4,
      },
      h6: {
        fontSize: '1rem',
        fontWeight: 500,
        letterSpacing: '0.02em',
        lineHeight: 1.4,
      },
      body1: {
        fontSize: '1rem',
        letterSpacing: '0.01em',
        lineHeight: 1.5,
      },
      body2: {
        fontSize: '0.875rem',
        letterSpacing: '0.01em',
        lineHeight: 1.5,
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 8,
            padding: '10px 20px',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: mode === 'light' 
                ? '0 5px 15px rgba(0,0,0,0.15)' 
                : '0 5px 15px rgba(0,0,0,0.3)',
            },
          },
          contained: {
            background: mode === 'light' 
              ? 'linear-gradient(45deg, #5a01d5 30%, #00bfad 90%)' 
              : 'linear-gradient(45deg, #BB86FC 30%, #03DAC6 90%)',
            color: mode === 'light' ? '#FFFFFF' : '#000000',
            '&:hover': {
              background: mode === 'light' 
                ? 'linear-gradient(45deg, #6715e2 30%, #15d1c0 90%)' 
                : 'linear-gradient(45deg, #E0B8FF 30%, #66FFF8 90%)',
            },
          },
          outlined: {
            borderWidth: '2px',
            '&:hover': {
              borderWidth: '2px',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            background: palette.background.card,
            boxShadow: mode === 'light' 
              ? '0 4px 16px rgba(0, 0, 0, 0.08)' 
              : '0 8px 32px rgba(0, 0, 0, 0.3)',
            border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: mode === 'light' 
                ? '0 8px 24px rgba(0, 0, 0, 0.12)' 
                : '0 12px 40px rgba(0, 0, 0, 0.4)',
              transition: 'all 0.3s ease-in-out',
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 12,
              background: mode === 'light' 
                ? 'rgba(0, 0, 0, 0.04)' 
                : 'rgba(255, 255, 255, 0.05)',
              '&:hover': {
                background: mode === 'light' 
                  ? 'rgba(0, 0, 0, 0.06)' 
                  : 'rgba(255, 255, 255, 0.08)',
              },
              '&.Mui-focused': {
                background: mode === 'light' 
                  ? 'rgba(0, 0, 0, 0.08)' 
                  : 'rgba(255, 255, 255, 0.1)',
              },
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            background: mode === 'light' 
              ? 'rgba(90, 1, 213, 0.1)' 
              : 'rgba(187, 134, 252, 0.1)',
            border: mode === 'dark' ? '1px solid rgba(187, 134, 252, 0.3)' : 'none',
            '&:hover': {
              background: mode === 'light' 
                ? 'rgba(90, 1, 213, 0.15)' 
                : 'rgba(187, 134, 252, 0.15)',
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            background: mode === 'light' 
              ? 'rgba(240, 240, 240, 0.9)' 
              : 'rgba(30, 30, 30, 0.8)',
            backdropFilter: 'blur(10px)',
            boxShadow: 'none',
            borderBottom: mode === 'light' 
              ? '1px solid rgba(0, 0, 0, 0.1)' 
              : '1px solid rgba(255, 255, 255, 0.1)',
            color: palette.text.primary,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
    },
    shape: {
      borderRadius: 12,
    },
    spacing: 8,
  });
};

// Varsayılan tema
const theme = createAppTheme('light');

export default theme; 