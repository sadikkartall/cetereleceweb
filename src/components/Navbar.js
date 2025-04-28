import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Box,
  useMediaQuery,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  Brightness4,
  Brightness7,
  Menu as MenuIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { getDocument } from '../firebase/firestore';

function Navbar() {
  const navigate = useNavigate();
  const { currentUser, logout, profileImage } = useAuth();
  const { mode, toggleTheme } = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const [localProfileImage, setLocalProfileImage] = useState('');
  const isMobile = useMediaQuery('(max-width:600px)');
  const isDark = mode === 'dark';

  // AuthContext'ten gelen profil fotoğrafını kullan
  useEffect(() => {
    if (profileImage) {
      setLocalProfileImage(profileImage);
    }
  }, [profileImage]);

  // Ayrıca Firestore'dan da kontrol et
  useEffect(() => {
    if (currentUser?.uid) {
      const fetchProfileImage = async () => {
        try {
          const userDoc = await getDocument('users', currentUser.uid);
          if (userDoc && userDoc.profileImage) {
            setLocalProfileImage(userDoc.profileImage);
          }
        } catch (error) {
          console.error('Profil fotoğrafı alınamadı:', error);
        }
      };
      
      fetchProfileImage();
    } else {
      setLocalProfileImage('');
    }
  }, [currentUser]);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Çıkış yapılırken hata oluştu:', error);
    }
  };

  return (
    <AppBar position="fixed" elevation={0}>
      <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 4 } }}>
        <Typography
          variant="h6"
          component="div"
          sx={{ 
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: "1.4rem",
            ml: 5,
            background: isDark 
              ? 'linear-gradient(45deg, #BB86FC 30%, #03DAC6 90%)'
              : 'linear-gradient(45deg, #5a01d5 30%, #00bfad 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
          onClick={() => navigate('/')}
        >
          CetereleceNet
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {/* Tema değiştirme düğmesi */}
          <Tooltip title={isDark ? "Aydınlık moda geç" : "Karanlık moda geç"}>
            <IconButton
              onClick={toggleTheme}
              sx={{ mr: 2 }}
              color="inherit"
            >
              {isDark ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
          </Tooltip>

          {currentUser ? (
            <>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/create-post')}
                sx={{ 
                  mr: 2,
                  borderRadius: '24px',
                  px: 2,
                }}
              >
                Gönderi Oluştur
              </Button>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                sx={{
                  p: 0.5,
                  backgroundColor: isDark 
                    ? 'rgba(187, 134, 252, 0.1)'
                    : 'rgba(90, 1, 213, 0.1)',
                  '&:hover': {
                    backgroundColor: isDark 
                      ? 'rgba(187, 134, 252, 0.15)'
                      : 'rgba(90, 1, 213, 0.15)',
                  }
                }}
              >
                <Avatar 
                  alt={currentUser.email} 
                  src={localProfileImage}
                  sx={{ width: 32, height: 32 }} 
                />
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                PaperProps={{
                  elevation: 3,
                  sx: {
                    borderRadius: 2,
                    minWidth: '200px',
                    mt: 1,
                  }
                }}
              >
                <MenuItem onClick={() => { navigate('/profile'); handleClose(); }}>
                  Profil
                </MenuItem>
                <MenuItem onClick={() => { navigate('/settings'); handleClose(); }}>
                  Ayarlar
                </MenuItem>
                <MenuItem onClick={handleLogout}>Çıkış Yap</MenuItem>
              </Menu>
            </>
          ) : (
            <Box sx={{ display: 'flex', gap: 1, mr: 5 }}>
              <Button 
                color="primary"
                variant="outlined"
                onClick={() => navigate('/login')}
                sx={{ borderRadius: '20px' }}
              >
                Giriş Yap
              </Button>
              <Button 
                color="primary"
                variant="contained"
                onClick={() => navigate('/register')}
                sx={{ borderRadius: '20px' }}
              >
                Kayıt Ol
              </Button>
            </Box>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar; 