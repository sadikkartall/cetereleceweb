import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Container, 
  Paper, 
  TextField, 
  Button, 
  Typography, 
  Box, 
  Divider, 
  Grid,
  styled 
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { signInWithGoogle } from '../firebase/auth';

// Sosyal medya butonları için özel stil
const SocialButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2),
  marginBottom: theme.spacing(1),
  padding: theme.spacing(1),
  borderRadius: 4,
  fontWeight: 'bold',
  textTransform: 'none',
  display: 'flex',
  justifyContent: 'flex-start',
  '& .MuiButton-startIcon': {
    marginRight: theme.spacing(1.5),
  },
}));

const GoogleButton = styled(SocialButton)({
  backgroundColor: '#ffffff',
  color: '#757575',
  border: '1px solid #dadce0',
  '&:hover': {
    backgroundColor: '#f2f2f2',
    border: '1px solid #d2d2d2',
  },
});

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError('Şifreler eşleşmiyor');
    }

    try {
      setError('');
      setLoading(true);
      const userData = {
        displayName: `${firstName} ${lastName}`.trim(),
        username: username.trim(),
      };
      await register(email, password, userData);
      navigate('/');
    } catch (err) {
      console.error('Kayıt hatası:', err);
      
      // Özel hata mesajlarını kontrol et
      if (err.message) {
        setError(err.message);
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Bu e-posta adresi zaten kullanılıyor.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Geçersiz e-posta adresi.');
      } else if (err.code === 'auth/weak-password') {
        setError('Şifre çok zayıf. Lütfen en az 6 karakter uzunluğunda bir şifre seçin.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('E-posta/şifre kayıt yöntemi şu anda etkin değil.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Ağ hatası. Lütfen internet bağlantınızı kontrol edin.');
      } else {
        setError('Hesap oluşturulamadı. Lütfen tekrar deneyin.');
      }
    }
    setLoading(false);
  };

  const handleSocialSignUp = async () => {
    try {
      setError('');
      setLoading(true);
      
      await signInWithGoogle();
      navigate('/');
    } catch (err) {
      console.error('Google ile kayıt hatası:', err);
      
      // Özel hata mesajlarını kontrol et
      if (err.message) {
        setError(err.message);
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Oturum açma penceresi kapatıldı. Lütfen tekrar deneyin.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        setError('İşlem iptal edildi. Lütfen tekrar deneyin.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Popup engellendi. Lütfen tarayıcı ayarlarınızı kontrol edin.');
      } else if (err.code === 'auth/account-exists-with-different-credential') {
        setError('Bu e-posta adresi farklı bir hesap ile zaten kullanılıyor.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Google ile giriş özelliği Firebase konsolunda etkinleştirilmemiş.');
      } else {
        setError('Google ile kayıt başarısız. Lütfen tekrar deneyin.');
      }
    }
    setLoading(false);
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Kayıt Ol
          </Typography>
          {error && (
            <Typography color="error" align="center" gutterBottom>
              {error}
            </Typography>
          )}
          
          {/* Sosyal Medya ile Kayıt */}
          <Box sx={{ mt: 3, mb: 3 }}>
            <GoogleButton 
              fullWidth 
              startIcon={<GoogleIcon />}
              disabled={loading}
              onClick={handleSocialSignUp}
            >
              Google ile Kayıt Ol
            </GoogleButton>
          </Box>
          
          <Divider sx={{ my: 2 }}>veya</Divider>
          
          {/* E-posta ile Kayıt */}
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Ad"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  margin="normal"
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Soyad"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  margin="normal"
                  required
                />
              </Grid>
            </Grid>
            
            {/* Kullanıcı adı alanı */}
            <TextField
              fullWidth
              label="Kullanıcı Adı"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              margin="normal"
              required
              helperText="Kullanıcı adınız benzersiz olmalı ve sadece harfler, sayılar ve alt çizgi (_) içerebilir"
            />
            
            <TextField
              fullWidth
              label="E-posta"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Şifre"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              helperText="Şifre en az 6 karakter olmalıdır"
              error={password.length > 0 && password.length < 6}
            />
            <TextField
              fullWidth
              label="Şifre Tekrar"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              margin="normal"
              required
              helperText={confirmPassword.length > 0 && password !== confirmPassword ? "Şifreler eşleşmiyor" : ""}
              error={confirmPassword.length > 0 && password !== confirmPassword}
            />
            <Button
              fullWidth
              variant="contained"
              color="primary"
              type="submit"
              disabled={loading}
              sx={{ mt: 3 }}
            >
              Kayıt Ol
            </Button>
          </form>
          
          <Box textAlign="center" mt={2}>
            <Typography variant="body2">
              Zaten hesabın var mı?{' '}
              <Button 
                color="primary" 
                onClick={() => navigate('/login')}
                sx={{ textTransform: 'none' }}
              >
                Giriş Yap
              </Button>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register; 