import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  Button, 
  TextField, 
  Divider,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Alert,
  AlertTitle,
  Grid,
  Card,
  CardContent,
  CardActions,
  Stack,
  IconButton
} from '@mui/material';
import { 
  LockReset as LockResetIcon,
  Person as PersonIcon,
  Delete as DeleteIcon,
  KeyboardArrowRight as ArrowIcon,
  Close as CloseIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import ProfilePhotoUpload from '../settings/ProfilePhotoUpload';

const Settings = () => {
  const { currentUser, updatePassword, updateEmail, deleteAccount, userData, updateProfile } = useAuth();
  const navigate = useNavigate();

  // Genel durum kontrolü
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Şifre değiştirme modalı için state
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Kullanıcı adı değiştirme modalı için state
  const [openUsernameDialog, setOpenUsernameDialog] = useState(false);
  const [newUsername, setNewUsername] = useState(userData?.username || '');
  const [usernamePassword, setUsernamePassword] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [changingUsername, setChangingUsername] = useState(false);

  // Hesap silme modalı için state
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Şifre değiştirme modalını aç
  const handleOpenPasswordDialog = () => {
    setOpenPasswordDialog(true);
    resetPasswordForm();
  };

  // Şifre değiştirme modalını kapat
  const handleClosePasswordDialog = () => {
    setOpenPasswordDialog(false);
  };

  // Şifre değiştirme formunu temizle
  const resetPasswordForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
  };

  // Şifre değiştir
  const handleChangePassword = async () => {
    // Doğrulama
    if (!currentPassword) {
      setPasswordError('Mevcut şifrenizi girmelisiniz');
      return;
    }
    if (!newPassword) {
      setPasswordError('Yeni şifrenizi girmelisiniz');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Şifreler eşleşmiyor');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Şifre en az 6 karakter olmalıdır');
      return;
    }

    try {
      setPasswordError('');
      setChangingPassword(true);
      
      // Burada şifre değiştirme işlemi gerçekleştirilecek
      // Not: Gerçek implementasyonda mevcut şifre ile yeniden doğrulama da yapılmalı
      await updatePassword(newPassword);
      
      setOpenPasswordDialog(false);
      setMessage('Şifreniz başarıyla güncellendi');
    } catch (err) {
      console.error('Şifre değiştirme hatası:', err);
      setPasswordError(err.message || 'Şifre değiştirilemedi. Lütfen tekrar deneyin.');
    } finally {
      setChangingPassword(false);
    }
  };

  // Kullanıcı adı değiştirme modalını aç
  const handleOpenUsernameDialog = () => {
    setOpenUsernameDialog(true);
    resetUsernameForm();
  };

  // Kullanıcı adı değiştirme modalını kapat
  const handleCloseUsernameDialog = () => {
    setOpenUsernameDialog(false);
  };

  // Kullanıcı adı değiştirme formunu temizle
  const resetUsernameForm = () => {
    setNewUsername(userData?.username || '');
    setUsernamePassword('');
    setUsernameError('');
  };

  // Kullanıcı adı değiştir
  const handleChangeUsername = async () => {
    // Doğrulama
    if (!newUsername) {
      setUsernameError('Yeni kullanıcı adınızı girmelisiniz');
      return;
    }
    if (!usernamePassword) {
      setUsernameError('Şifrenizi girmelisiniz');
      return;
    }
    if (newUsername === userData?.username) {
      setUsernameError('Yeni kullanıcı adı, mevcut kullanıcı adınızla aynı olamaz');
      return;
    }

    // Kullanıcı adı formatını kontrol et (sadece harfler, sayılar ve alt çizgi)
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(newUsername)) {
      setUsernameError('Kullanıcı adı sadece harfler, sayılar ve alt çizgi (_) içerebilir');
      return;
    }

    try {
      setUsernameError('');
      setChangingUsername(true);
      
      // Burada kullanıcı adı değiştirme işlemi gerçekleştirilecek
      // Gerçek implementasyonda mevcut şifre ile yeniden doğrulama da yapılmalı
      await updateProfile({ username: newUsername });
      
      setOpenUsernameDialog(false);
      setMessage('Kullanıcı adınız başarıyla güncellendi');
    } catch (err) {
      console.error('Kullanıcı adı değiştirme hatası:', err);
      setUsernameError(err.message || 'Kullanıcı adı değiştirilemedi. Lütfen tekrar deneyin.');
    } finally {
      setChangingUsername(false);
    }
  };

  // Hesap silme modalını aç
  const handleOpenDeleteDialog = () => {
    setOpenDeleteDialog(true);
    setDeletePassword('');
    setDeleteError('');
  };

  // Hesap silme modalını kapat
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
  };

  // Hesabı sil
  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setDeleteError('Hesabınızı silmek için şifrenizi girmelisiniz');
      return;
    }

    try {
      setDeleteError('');
      setDeletingAccount(true);
      
      await deleteAccount(deletePassword);
      setOpenDeleteDialog(false);
      navigate('/');
    } catch (err) {
      console.error('Hesap silme hatası:', err);
      setDeleteError(err.message || 'Hesap silinemedi. Lütfen şifrenizi kontrol edin ve tekrar deneyin.');
    } finally {
      setDeletingAccount(false);
    }
  };

  // Profil fotoğrafı güncellendiğinde çağrılacak fonksiyon
  const handlePhotoUpdate = (photoURL) => {
    setMessage('Profil fotoğrafınız başarıyla güncellendi');
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Hesap Ayarları
            </Typography>
            <IconButton 
              color="primary" 
              onClick={() => navigate('/profile')}
              sx={{ p: 1 }}
            >
              <ArrowIcon fontSize="large" />
            </IconButton>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          {message && (
            <Alert 
              severity="success" 
              sx={{ mb: 3 }}
              action={
                <IconButton
                  aria-label="close"
                  color="inherit"
                  size="small"
                  onClick={() => setMessage('')}
                >
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              }
            >
              {message}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Profil Fotoğrafı Yükleme */}
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Typography variant="h6" gutterBottom align="center">
                    Profil Fotoğrafı
                  </Typography>
                  <ProfilePhotoUpload onPhotoUpdate={handlePhotoUpdate} />
                </CardContent>
              </Card>
            </Grid>

            {/* Kullanıcı Bilgileri */}
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Kullanıcı Bilgileri
                  </Typography>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body1" color="text.secondary">
                        Kullanıcı Adı:
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        @{userData?.username || 'kullanıcı'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body1" color="text.secondary">
                        Ad Soyad:
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {userData?.displayName || 'İsimsiz Kullanıcı'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body1" color="text.secondary">
                        E-posta:
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {currentUser?.email}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
                <CardActions>
                  <Button 
                    startIcon={<EditIcon />}
                    onClick={() => navigate('/profile')}
                  >
                    Profili Düzenle
                  </Button>
                </CardActions>
              </Card>
            </Grid>

            {/* Kullanıcı Adı Değiştir */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <PersonIcon color="primary" sx={{ fontSize: 40, mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Kullanıcı Adı Değiştir
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Profilinizde görünen kullanıcı adınızı değiştirebilirsiniz. Kullanıcı adınız benzersiz olmalıdır.
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    variant="contained" 
                    color="primary"
                    onClick={handleOpenUsernameDialog}
                    fullWidth
                  >
                    Kullanıcı Adı Değiştir
                  </Button>
                </CardActions>
              </Card>
            </Grid>

            {/* Şifre Değiştir */}
            <Grid item xs={12} md={6}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <LockResetIcon color="primary" sx={{ fontSize: 40, mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Şifre Değiştir
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Hesap güvenliğiniz için periyodik olarak şifrenizi değiştirmenizi öneririz. Güçlü şifreler kullanın.
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    variant="contained" 
                    color="primary"
                    onClick={handleOpenPasswordDialog}
                    fullWidth
                  >
                    Şifre Değiştir
                  </Button>
                </CardActions>
              </Card>
            </Grid>

            {/* Hesabı Sil */}
            <Grid item xs={12}>
              <Card sx={{ bgcolor: 'error.lighter', borderColor: 'error.main' }} variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <DeleteIcon color="error" sx={{ fontSize: 40, mr: 2 }} />
                    <Typography variant="h6" color="error.main">
                      Tehlikeli Bölge
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Hesabınızı sildiğinizde, tüm verileriniz ve gönderileriniz kalıcı olarak silinecektir. Bu işlem geri alınamaz.
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    variant="outlined" 
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={handleOpenDeleteDialog}
                    fullWidth
                  >
                    Hesabımı Sil
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      {/* Kullanıcı Adı Değiştirme Modalı */}
      <Dialog open={openUsernameDialog} onClose={handleCloseUsernameDialog}>
        <DialogTitle>
          Kullanıcı Adı Değiştir
        </DialogTitle>
        <DialogContent>
          <DialogContentText gutterBottom>
            Yeni kullanıcı adınızı girin. Kullanıcı adı sadece harfler, sayılar ve alt çizgi (_) içerebilir. Değişikliği onaylamak için şifrenizi girmeniz gerekecektir.
          </DialogContentText>
          {usernameError && (
            <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
              {usernameError}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Yeni Kullanıcı Adı"
            fullWidth
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            required
            variant="outlined"
            sx={{ mb: 2, mt: 2 }}
          />
          <TextField
            margin="dense"
            label="Şifreniz"
            type="password"
            fullWidth
            value={usernamePassword}
            onChange={(e) => setUsernamePassword(e.target.value)}
            required
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseUsernameDialog} disabled={changingUsername}>
            Vazgeç
          </Button>
          <Button 
            onClick={handleChangeUsername} 
            color="primary" 
            variant="contained"
            disabled={changingUsername || !newUsername || !usernamePassword}
          >
            {changingUsername ? 'Değiştiriliyor...' : 'Kullanıcı Adı Değiştir'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Şifre Değiştirme Modalı */}
      <Dialog open={openPasswordDialog} onClose={handleClosePasswordDialog}>
        <DialogTitle>
          Şifre Değiştir
        </DialogTitle>
        <DialogContent>
          <DialogContentText gutterBottom>
            Güvenlik için mevcut şifrenizi ve yeni şifrenizi girin. Yeni şifreniz en az 6 karakter uzunluğunda olmalıdır.
          </DialogContentText>
          {passwordError && (
            <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
              {passwordError}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Mevcut Şifreniz"
            type="password"
            fullWidth
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            variant="outlined"
            sx={{ mb: 2, mt: 2 }}
          />
          <TextField
            margin="dense"
            label="Yeni Şifre"
            type="password"
            fullWidth
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            variant="outlined"
            sx={{ mb: 2 }}
            error={newPassword.length > 0 && newPassword.length < 6}
            helperText={newPassword.length > 0 && newPassword.length < 6 ? "Şifre en az 6 karakter olmalıdır" : ""}
          />
          <TextField
            margin="dense"
            label="Yeni Şifre Tekrar"
            type="password"
            fullWidth
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            variant="outlined"
            error={confirmPassword.length > 0 && newPassword !== confirmPassword}
            helperText={confirmPassword.length > 0 && newPassword !== confirmPassword ? "Şifreler eşleşmiyor" : ""}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePasswordDialog} disabled={changingPassword}>
            Vazgeç
          </Button>
          <Button 
            onClick={handleChangePassword} 
            color="primary"
            variant="contained"
            disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
          >
            {changingPassword ? 'Değiştiriliyor...' : 'Şifre Değiştir'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Hesap Silme Onay Modalı */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle sx={{ color: 'error.main' }}>
          Hesabınızı silmek istediğinizden emin misiniz?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bu işlem geri alınamaz. Hesabınız ve tüm verileriniz kalıcı olarak silinecektir. 
            Devam etmek istiyorsanız, lütfen şifrenizi girin.
          </DialogContentText>
          {deleteError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {deleteError}
            </Alert>
          )}
          <TextField
            autoFocus
            margin="dense"
            label="Şifreniz"
            type="password"
            fullWidth
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            required
            variant="outlined"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} disabled={deletingAccount}>
            Vazgeç
          </Button>
          <Button 
            onClick={handleDeleteAccount} 
            color="error" 
            disabled={deletingAccount || !deletePassword}
          >
            {deletingAccount ? 'İşleniyor...' : 'Hesabımı Sil'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Settings; 