// React ve gerekli kütüphaneleri import ediyoruz
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';

// Korumalı rota bileşeni
// Bu bileşen, sadece giriş yapmış kullanıcıların erişebileceği sayfaları korumak için kullanılır
const PrivateRoute = ({ children }) => {
  // Kimlik doğrulama durumunu alıyoruz
  const { currentUser, loading } = useAuth();

  // Yükleme durumunda loading spinner göster
  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  // Kullanıcı giriş yapmışsa içeriği göster, yapmamışsa login sayfasına yönlendir
  return currentUser ? children : <Navigate to="/login" />;
};

export default PrivateRoute; 