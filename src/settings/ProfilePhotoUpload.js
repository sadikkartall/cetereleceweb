import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Avatar, 
  Typography, 
  CircularProgress,
  IconButton,
  Alert,
  Paper,
  Slider
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  PhotoCamera as CameraIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { setDocument } from '../firebase/firestore';
import { updateUserProfile } from '../firebase/auth';

const ProfilePhotoUpload = ({ onPhotoUpdate, hideAvatar }) => {
  const { currentUser, userData, updateProfilePhoto, deleteProfilePhoto, profileImage, setProfileImage, setUserData } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const fileInputRef = useRef(null);

  const defaultAvatar = "https://via.placeholder.com/150";
  const currentAvatar = userData?.photoURL || profileImage || defaultAvatar;

  // Profil fotoğrafını image/jpeg olarak sıkıştırıp base64 formatına dönüştür
  const compressAndConvertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 300;
          
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          resolve(compressedBase64);
        };
        
        img.onerror = (error) => {
          reject(error);
        };
      };
      
      reader.onerror = (error) => {
        reject(error);
      };
    });
  };

  const validateFile = (file) => {
    // Dosya tipi kontrolü
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, message: 'Sadece JPEG ve PNG formatları desteklenmektedir.' };
    }
    
    // Dosya boyutu kontrolü (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { valid: false, message: 'Dosya boyutu 5MB\'tan küçük olmalıdır.' };
    }
    
    return { valid: true };
  };

  const handleFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Dosyayı doğrula
    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.message);
      return;
    }
    
    // Dosya okuyucu oluştur
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedFile(file);
      setPreviewUrl(e.target.result);
      setError('');
      setSuccess('');
    };
    
    reader.onerror = () => {
      setError('Dosya okunamadı. Lütfen tekrar deneyin.');
    };
    
    // Dosyayı oku
    reader.readAsDataURL(file);
  };

  const handleZoomChange = (event, newValue) => {
    setZoomLevel(newValue);
  };

  // Profil fotoğrafını yükle
  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Lütfen bir fotoğraf seçin');
      return;
    }

    try {
      setUploading(true);
      setError('');
      setSuccess('');

      // Base64'e dönüştür
      const base64Image = await compressAndConvertToBase64(selectedFile);
      
      // Profil fotoğrafını güncelle
      console.log('ProfilePhotoUpload: updateProfilePhoto çağrılıyor');
      const photoURL = await updateProfilePhoto(base64Image);
      console.log('ProfileImage güncellendi:', photoURL);
      
      if (!photoURL) {
        throw new Error('Fotoğraf URL alınamadı');
      }

      // Firestore'da kullanıcı belgesini güncelle
      const userData = {
        photoURL: photoURL,
        updatedAt: new Date()
      };
      
      await setDocument('users', currentUser.uid, userData, { merge: true });

      // Firebase Auth profilini güncelle
      await updateUserProfile(currentUser, {
        photoURL: photoURL
      });
      
      setUploading(false);
      setSuccess('Profil fotoğrafı başarıyla yüklendi');
      setSelectedFile(null);
      setPreviewUrl('');
      
      // Callback'i çağır
      if (typeof onPhotoUpdate === 'function') {
        onPhotoUpdate();
      }
    } catch (error) {
      console.error('Profil fotoğrafı yükleme hatası:', error);
      console.error('Hata detayları:', { 
        code: error.code, 
        message: error.message,
        name: error.name,
        stack: error.stack 
      });
      
      setUploading(false);
      
      // CORS hatası kontrolü
      if (error.message && error.message.includes('CORS')) {
        setError(`CORS Hatası: Tarayıcı güvenlik politikası engeli. Firebase Storage yapılandırmasını kontrol edin.`);
      } else {
        setError(`Yükleme hatası: ${error.message || 'Bilinmeyen hata'}`);
      }
    }
  };

  // Profil fotoğrafını sil
  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      setError('');
      setSuccess('');
      
      // Firebase Storage'dan fotoğrafı sil
      await deleteProfilePhoto();
      
      // Firestore'dan fotoğraf URL'sini kaldır
      const userData = {
        photoURL: '',
        updatedAt: new Date()
      };
      
      await setDocument('users', currentUser.uid, userData, { merge: true });

      // Firebase Auth profilinden fotoğrafı kaldır
      await updateUserProfile(currentUser, {
        photoURL: ''
      });
      
      // UI'ı güncelle
      setPreviewUrl('');
      setProfileImage('');
      
      setDeleteLoading(false);
      setSuccess('Profil fotoğrafı başarıyla silindi');
      
      // Callback'i çağır
      if (typeof onPhotoUpdate === 'function') {
        onPhotoUpdate();
      }
      
    } catch (error) {
      setDeleteLoading(false);
      setError(`Silme hatası: ${error.message}`);
      console.error('Profil fotoğrafı silme hatası:', error);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Yükleme Butonları */}
      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
        <Button
          variant="outlined"
          startIcon={<UploadIcon />}
          component="label"
          disabled={uploading}
        >
          Fotoğraf Seç
          <input
            type="file"
            hidden
            accept="image/jpeg, image/png"
            onChange={handleFileChange}
          />
        </Button>
        
        {(userData?.photoURL || profileImage) && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDelete}
            disabled={deleteLoading}
          >
            Kaldır
          </Button>
        )}
      </Box>

      {/* Profil Fotoğrafı ve Düzenleme Butonu */}
      {!hideAvatar && (
        <Box sx={{ position: 'relative', mb: 2 }}>
          <Avatar
            src={previewUrl || currentAvatar}
            alt={userData?.displayName || currentUser?.email}
            sx={{ 
              width: 150, 
              height: 150,
              boxShadow: 2
            }}
          />
          <IconButton
            color="primary"
            aria-label="upload picture"
            component="label"
            sx={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              backgroundColor: 'background.paper',
              '&:hover': { backgroundColor: 'background.default' },
              boxShadow: 1
            }}
            disabled={uploading}
          >
            <CameraIcon />
            <input
              type="file"
              hidden
              accept="image/jpeg, image/png"
              onChange={handleFileChange}
            />
          </IconButton>
        </Box>
      )}

      {/* Önizleme ve Zoom Kontrolü */}
      {previewUrl && (
        <Paper 
          elevation={3} 
          sx={{ 
            p: 2, 
            mb: 2, 
            width: '100%', 
            maxWidth: 350,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center' 
          }}
        >
          <Typography variant="subtitle2" gutterBottom>
            Fotoğraf Önizleme
          </Typography>
          
          <Box 
            id="preview-container"
            sx={{ 
              width: 200, 
              height: 200, 
              overflow: 'hidden',
              borderRadius: '50%',
              mb: 2,
              border: '2px solid #eee'
            }}
          >
            <img 
              src={previewUrl} 
              alt="Preview" 
              style={{ 
                width: '100%', 
                height: '100%',
                objectFit: 'cover',
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'center'
              }} 
            />
          </Box>
          
          <Box sx={{ width: '100%', px: 2 }}>
            <Typography id="zoom-slider" gutterBottom>
              Yakınlaştırma
            </Typography>
            <Slider
              value={zoomLevel}
              onChange={handleZoomChange}
              aria-labelledby="zoom-slider"
              min={1}
              max={3}
              step={0.1}
              valueLabelDisplay="auto"
            />
          </Box>
          
          <Button
            variant="contained"
            color="primary"
            onClick={handleUpload}
            disabled={uploading}
            startIcon={uploading ? <CircularProgress size={20} /> : <UploadIcon />}
            sx={{ mt: 2 }}
            fullWidth
          >
            {uploading ? 'Yükleniyor...' : 'Yükle'}
          </Button>
        </Paper>
      )}

      {/* Hata ve Başarı Mesajları */}
      {error && (
        <Alert severity="error" sx={{ mt: 1, mb: 1, width: '100%' }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mt: 1, mb: 1, width: '100%' }}>
          {success}
        </Alert>
      )}

      {/* Yükleniyor Göstergesi */}
      {uploading && (
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
          <CircularProgress size={24} sx={{ mr: 1 }} />
          <Typography variant="body2">Yükleniyor...</Typography>
        </Box>
      )}
    </Box>
  );
};

export default ProfilePhotoUpload; 