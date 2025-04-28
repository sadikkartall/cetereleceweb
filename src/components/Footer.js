import React from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Link,
  IconButton,
} from '@mui/material';
import {
  Facebook,
  Twitter,
  Instagram,
  LinkedIn,
  GitHub,
} from '@mui/icons-material';

// Alt bilgi bileşeni
const Footer = () => {
  return (
    // Alt bilgi container'ı
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) =>
          theme.palette.mode === 'light'
            ? theme.palette.grey[200]
            : theme.palette.grey[800],
      }}
    >
      <Container maxWidth="lg">
        {/* Grid sistemi ile içerik düzeni */}
        <Grid container spacing={4}>
          {/* Sol kolon - Site bilgileri */}
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              Ceterelece
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Bilgi paylaşım platformu
            </Typography>
          </Grid>

          {/* Orta kolon - Hızlı bağlantılar */}
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              Hızlı Bağlantılar
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Link href="/about" color="inherit" underline="hover">
                Hakkımızda
              </Link>
              <Link href="/contact" color="inherit" underline="hover">
                İletişim
              </Link>
              <Link href="/privacy" color="inherit" underline="hover">
                Gizlilik Politikası
              </Link>
              <Link href="/terms" color="inherit" underline="hover">
                Kullanım Koşulları
              </Link>
            </Box>
          </Grid>

          {/* Sağ kolon - Sosyal medya bağlantıları */}
          <Grid item xs={12} sm={4}>
            <Typography variant="h6" color="text.primary" gutterBottom>
              Bizi Takip Edin
            </Typography>
            <Box>
              {/* Sosyal medya ikonları */}
              <IconButton color="inherit" aria-label="Facebook">
                <Facebook />
              </IconButton>
              <IconButton color="inherit" aria-label="Twitter">
                <Twitter />
              </IconButton>
              <IconButton color="inherit" aria-label="Instagram">
                <Instagram />
              </IconButton>
              <IconButton color="inherit" aria-label="LinkedIn">
                <LinkedIn />
              </IconButton>
              <IconButton color="inherit" aria-label="GitHub">
                <GitHub />
              </IconButton>
            </Box>
          </Grid>
        </Grid>

        {/* Telif hakkı bilgisi */}
        <Box mt={3}>
          <Typography variant="body2" color="text.secondary" align="center">
            {'© '}
            {new Date().getFullYear()}
            {' Ceterelece. Tüm hakları saklıdır.'}
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer; 