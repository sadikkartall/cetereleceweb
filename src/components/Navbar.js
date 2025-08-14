import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Box,
  Avatar,
} from '@mui/material';
import {
  Add as AddIcon,
} from '@mui/icons-material';

function Navbar() {
  const navigate = useNavigate();
  const { currentUser, logout, userData, profileImage } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const defaultAvatar = "https://ui-avatars.com/api/?name=Anonim";

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      handleClose();
      navigate('/login');
    } catch (error) {
      console.error('Çıkış yapılırken hata oluştu:', error);
    }
  };

  return (
    <AppBar position="fixed" elevation={0} sx={{ background: '#23272f', color: '#ffffff' }}>
      <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 4 } }}>
        <Typography
          variant="h6"
          component="div"
          sx={{
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: "1.5rem",
            ml: 5,
            background: 'none',
            color: '#ffffff',
            letterSpacing: 1.5,
            textShadow: '0 2px 8px rgba(0,0,0,0.10)',
          }}
          onClick={() => navigate('/')}
        >
          CetereleceNet
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {currentUser ? (
            <>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={() => navigate('/create-post')}
                sx={{ 
                  mr: 2,
                  borderRadius: '24px',
                  px: 2,
                  color: '#ffffff',
                  borderColor: '#ffffff',
                  fontWeight: 600,
                  background: 'transparent',
                  '&:hover': {
                    background: '#64b5f6',
                    borderColor: '#ffffff',
                  }
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
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.18)',
                  }
                }}
              >
                <Avatar 
                  alt={userData?.displayName || currentUser.email} 
                  src={userData?.photoURL || profileImage || defaultAvatar}
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
                color="inherit"
                variant="outlined"
                onClick={() => navigate('/login')}
                sx={{ borderRadius: '20px', color: '#ffffff', borderColor: '#ffffff', fontWeight: 600, background: 'transparent', '&:hover': { background: '#64b5f6', borderColor: '#ffffff' } }}
              >
                Giriş Yap
              </Button>
              <Button 
                color="inherit"
                variant="contained"
                onClick={() => navigate('/register')}
                sx={{ borderRadius: '20px', background: '#ffffff', color: '#23272f', fontWeight: 700, '&:hover': { background: '#343942', color: '#23272f' } }}
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