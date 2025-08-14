import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Card,
  FormControlLabel,
  Switch,
  Alert
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const Settings = () => {
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [notifications, setNotifications] = useState(true);
  
  const { currentUser, updateProfile } = useAuth();

  const handleUpdateProfile = async () => {
    if (!displayName.trim()) {
      setError('Ad Soyad alanı zorunludur');
      return;
    }

    try {
      setError('');
      setSuccess('');
      setLoading(true);
      await updateProfile({ displayName: displayName.trim() });
      setSuccess('Profil başarıyla güncellendi');
      setDisplayName('');
    } catch (err) {
      setError('Profil güncellenirken bir hata oluştu');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      backgroundColor: 'background.default',
      minHeight: '100vh',
      pt: 8,
      pb: 8
    }}>
      <Container maxWidth="md">
        <Typography variant="h4" component="h1" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
          Ayarlar
        </Typography>
        
        <Card sx={{ p: 4, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Profil Bilgileri
          </Typography>
          
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          
          <TextField
            fullWidth
            label="Ad Soyad"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={currentUser?.displayName || 'Ad Soyad'}
            sx={{ mb: 3 }}
          />
          
          <Button
            variant="contained"
            onClick={handleUpdateProfile}
            disabled={loading || !displayName.trim()}
            sx={{ minWidth: 120 }}
          >
            {loading ? 'Güncelleniyor...' : 'Profili Güncelle'}
          </Button>
        </Card>

        <Card sx={{ p: 4 }}>
          <Typography variant="h6" gutterBottom>
            Uygulama Ayarları
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={notifications}
                onChange={(e) => setNotifications(e.target.checked)}
              />
            }
            label="Bildirimler"
            sx={{ mb: 2 }}
          />
        </Card>
      </Container>
    </Box>
  );
};

export default Settings; 