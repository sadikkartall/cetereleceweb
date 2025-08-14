import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { migrateProfileImages, migrateUserProfileImage } from '../utils/dataMigration';

const MigrationTools = () => {
  const { currentUser, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [migrationStatus, setMigrationStatus] = useState('');

  // Yönetici kontrolü
  const isAdmin = userData?.role === 'admin';

  // Tüm profil fotoğraflarını taşıma işlemi
  const handleMigrateProfileImages = async () => {
    if (!isAdmin) {
      setError('Bu işlemi gerçekleştirmek için yönetici yetkisine sahip olmanız gerekiyor.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setResult(null);
      setMigrationStatus('Profil fotoğrafları taşınıyor...');

      // Taşıma işlemini başlat
      const migrationResult = await migrateProfileImages();
      
      setResult(migrationResult);
      setMigrationStatus(`Taşıma tamamlandı. ${migrationResult.migrated} profil fotoğrafı taşındı, ${migrationResult.errors} hata oluştu.`);
    } catch (error) {
      console.error('Taşıma işlemi sırasında hata:', error);
      setError(`Taşıma işlemi başarısız: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Mevcut kullanıcının profil fotoğrafını taşıma
  const handleMigrateCurrentUserPhoto = async () => {
    if (!currentUser) {
      setError('Bu işlemi gerçekleştirmek için giriş yapmanız gerekiyor.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setResult(null);
      setMigrationStatus('Profil fotoğrafınız taşınıyor...');

      // Mevcut kullanıcının profil fotoğrafını taşı
      const migrationResult = await migrateUserProfileImage(currentUser.uid);
      
      if (migrationResult.success) {
        setResult({ 
          success: true, 
          migrated: 1, 
          errors: 0, 
          photoURL: migrationResult.photoURL 
        });
        setMigrationStatus('Profil fotoğrafınız başarıyla taşındı.');
      } else {
        setResult({ 
          success: false, 
          migrated: 0, 
          errors: 1,
          error: migrationResult.error || 'Taşınacak profil fotoğrafı bulunamadı'
        });
        setMigrationStatus('Profil fotoğrafı taşıma işlemi başarısız oldu.');
      }
    } catch (error) {
      console.error('Taşıma işlemi sırasında hata:', error);
      setError(`Taşıma işlemi başarısız: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Veri Taşıma Araçları
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Profil Fotoğrafı Taşıma
        </Typography>
        <Typography variant="body1" paragraph>
          Bu araç, Firestore veritabanında base64 formatında saklanan profil fotoğraflarını
          Firebase Storage'a taşır ve fotoğraf URL'lerini kullanıcı profillerine kaydeder.
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {migrationStatus && (
          <Alert severity={result?.success ? "success" : "info"} sx={{ mb: 2 }}>
            {migrationStatus}
          </Alert>
        )}
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleMigrateCurrentUserPhoto}
            disabled={loading || !currentUser}
          >
            {loading ? <CircularProgress size={24} /> : 'Profil Fotoğrafımı Taşı'}
          </Button>
          
          {isAdmin && (
            <Button
              variant="contained"
              color="secondary"
              onClick={handleMigrateProfileImages}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Tüm Profil Fotoğraflarını Taşı'}
            </Button>
          )}
        </Box>
        
        {result && (
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Taşıma Sonuçları
            </Typography>
            <List>
              <ListItem>
                <ListItemText 
                  primary="Durum"
                  secondary={result.success ? 'Başarılı' : 'Başarısız'}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Taşınan Profil Fotoğrafı Sayısı"
                  secondary={result.migrated}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Hata Sayısı"
                  secondary={result.errors}
                />
              </ListItem>
              {result.photoURL && (
                <ListItem>
                  <ListItemText 
                    primary="Fotoğraf URL"
                    secondary={result.photoURL}
                  />
                </ListItem>
              )}
            </List>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default MigrationTools; 