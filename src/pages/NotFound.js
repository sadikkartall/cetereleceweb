import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Paper, Typography, Button, Box } from '@mui/material';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h1" component="h1" gutterBottom>
            404
          </Typography>
          <Typography variant="h4" component="h2" gutterBottom>
            Sayfa Bulunamadı
          </Typography>
          <Typography variant="body1" paragraph>
            Aradığınız sayfa mevcut değil veya taşınmış olabilir.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/')}
          >
            Ana Sayfaya Dön
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default NotFound; 