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

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError('Giriş başarısız. Lütfen bilgilerinizi kontrol edin.');
      console.error(err);
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    try {
      setError('');
      setLoading(true);
      
      await signInWithGoogle();
      navigate('/');
    } catch (err) {
      console.error('Google ile giriş hatası:', err);
      
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
        setError('Google ile giriş başarısız. Lütfen tekrar deneyin.');
      }
    }
    setLoading(false);
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Giriş Yap
          </Typography>
          {error && (
            <Typography color="error" align="center" gutterBottom>
              {error}
            </Typography>
          )}
          
          {/* Sosyal Medya ile Giriş */}
          <Box sx={{ mt: 3, mb: 3 }}>
            <GoogleButton 
              fullWidth 
              startIcon={<GoogleIcon />}
              disabled={loading}
              onClick={handleGoogleLogin}
            >
              Google ile Giriş Yap
            </GoogleButton>
          </Box>
          
          <Divider sx={{ my: 2 }}>veya</Divider>
          
          {/* E-posta ile Giriş */}
          <form onSubmit={handleSubmit}>
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
            />
            <Button
              fullWidth
              variant="contained"
              color="primary"
              type="submit"
              disabled={loading}
              sx={{ mt: 3 }}
            >
              Giriş Yap
            </Button>
          </form>
          
          <Box textAlign="center" mt={2}>
            <Typography variant="body2">
              Hesabın yok mu?{' '}
              <Button 
                color="primary" 
                onClick={() => navigate('/register')}
                sx={{ textTransform: 'none' }}
              >
                Kayıt Ol
              </Button>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login; 