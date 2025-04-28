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
import { setDocument, getDocument } from '../firebase/firestore';

const ProfilePhotoUpload = ({ onPhotoUpdate }) => {
  const { currentUser, userData, updateProfile, updateProfilePhoto, deleteProfilePhoto, profileImage } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const fileInputRef = useRef(null);

  const defaultAvatar = "https://via.placeholder.com/150";
  // Firestore'dan fotoğrafı göster veya photoURL
  const currentAvatar = avatarUrl || userData?.photoURL || defaultAvatar;

  // Bileşen ilk yüklendiğinde Firestore'dan profil resmini getir
  useEffect(() => {
    if (currentUser?.uid) {
      const loadProfileImage = async () => {
        try {
          const userDoc = await getDocument('users', currentUser.uid);
          if (userDoc && userDoc.profileImage) {
            setAvatarUrl(userDoc.profileImage);
          }
        } catch (error) {
          console.error('Profil resmi yüklenirken hata:', error);
        }
      };
      
      loadProfileImage();
    }
  }, [currentUser]);

  // Mevcut profil fotoğrafını göster
  useEffect(() => {
    if (profileImage) {
      setPreviewUrl(profileImage);
    } else {
      setPreviewUrl('');
    }
  }, [profileImage]);

  // Profil fotoğrafını image/jpeg olarak sıkıştırıp base64 formatına dönüştür
  const compressAndConvertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        
        img.onload = () => {
          // Resmi daha küçük boyuta sıkıştır (100x100)
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 100; // 250'den 100'e düşürüldü
          
          let width = img.width;
          let height = img.height;
          
          // Büyük kenarı en fazla MAX_SIZE olacak şekilde ölçekle
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
          
          // JPEG formatında, 0.3 kalitesinde sıkıştır (0.5'ten düşürüldü)
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.3);
          console.log('Resim sıkıştırıldı', compressedBase64.length);
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

      // Doğrudan seçilen dosyayı kullan - önizleme yoksa
      if (!document.getElementById('preview-container')) {
        // Base64'e dönüştür
        const base64Image = await compressAndConvertToBase64(selectedFile);
        await updateProfilePhoto(base64Image);
        
        setUploading(false);
        setSuccess('Profil fotoğrafı başarıyla yüklendi');
        setSelectedFile(null);
        
        // Callback'i çağır
        if (typeof onPhotoUpdate === 'function') {
          onPhotoUpdate(base64Image);
        }
        
        return;
      }

      // Canvas'tan ayarlanan görüntüyü al
      const canvas = document.createElement('canvas');
      const imageContainer = document.getElementById('preview-container');
      const img = imageContainer.querySelector('img');

      if (!img) {
        setError('Resim bulunamadı. Lütfen tekrar bir dosya seçin.');
        setUploading(false);
        return;
      }

      // Canvas boyutunu ayarla
      const size = 300; // Standart boyut
      canvas.width = size;
      canvas.height = size;

      // Canvas'a resmi çiz ve yakınlaştırma uygula
      const ctx = canvas.getContext('2d');
      
      // Resmin merkezi için hesaplamalar
      const imgWidth = img.naturalWidth;
      const imgHeight = img.naturalHeight;
      
      // Kare kırpma için kaynak koordinatları
      const minDimension = Math.min(imgWidth, imgHeight);
      const sourceX = (imgWidth - minDimension) / 2;
      const sourceY = (imgHeight - minDimension) / 2;
      
      // Zoom faktörü uygulanmış boyutlar
      const zoomedSize = minDimension / zoomLevel;
      const zoomedX = sourceX + (minDimension - zoomedSize) / 2;
      const zoomedY = sourceY + (minDimension - zoomedSize) / 2;
      
      // Kare kırpılmış ve zoom uygulanmış resmi çiz
      ctx.drawImage(
        img,
        zoomedX, zoomedY, zoomedSize, zoomedSize, // Kaynak koordinatları
        0, 0, size, size // Hedef koordinatları (kare)
      );
      
      // Base64 formatına dönüştür
      const base64Image = canvas.toDataURL('image/jpeg', 0.9);
      
      // Profil fotoğrafını güncelle
      await updateProfilePhoto(base64Image);
      
      setUploading(false);
      setSuccess('Profil fotoğrafı başarıyla yüklendi');
      setSelectedFile(null);
      
      // Callback'i çağır
      if (typeof onPhotoUpdate === 'function') {
        onPhotoUpdate(base64Image);
      }
      
    } catch (error) {
      setUploading(false);
      setError(`Yükleme hatası: ${error.message}`);
      console.error('Profil fotoğrafı yükleme hatası:', error);
    }
  };

  // Profil fotoğrafını sil
  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      setError('');
      setSuccess('');
      
      await deleteProfilePhoto();
      
      setDeleteLoading(false);
      setSuccess('Profil fotoğrafı başarıyla silindi');
      setPreviewUrl('');
      
    } catch (error) {
      setDeleteLoading(false);
      setError(`Silme hatası: ${error.message}`);
      console.error('Profil fotoğrafı silme hatası:', error);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Profil Fotoğrafı ve Düzenleme Butonu */}
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
          onClick={() => fileInputRef.current.click()}
        >
          <CameraIcon />
          <input
            hidden
            ref={fileInputRef}
            accept="image/jpeg, image/png"
            type="file"
            onChange={handleFileChange}
          />
        </IconButton>
      </Box>

      {/* Önizleme ve Zoom Kontrolü */}
      {selectedFile && previewUrl && (
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

      {/* Yükleme Butonları */}
      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
        <Button
          variant="outlined"
          startIcon={<UploadIcon />}
          onClick={() => fileInputRef.current.click()}
          disabled={uploading}
        >
          Fotoğraf Seç
        </Button>
        
        {(userData?.photoURL || avatarUrl) && (
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