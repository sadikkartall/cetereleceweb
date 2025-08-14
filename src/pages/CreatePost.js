import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createPost } from '../services/postService';
import { 
  Container, 
  Paper, 
  TextField, 
  Button, 
  Typography, 
  Box,
  MenuItem,
  IconButton,
  Grid,
  Alert,
  Snackbar
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import TiptapEditor from '../components/TiptapEditor';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const ImagePreview = styled('img')({
  width: '100%',
  maxHeight: '200px',
  objectFit: 'cover',
  marginTop: '8px',
  borderRadius: '4px',
});

const categories = [
  'Yazılım',
  'Donanım',
  'Siber Güvenlik',
  'Python',
  'Yapay Zeka',
  'Mobil',
  'Web',
  'Oyun',
  'Veri Bilimi',
  'Diğer'
];

const CreatePost = () => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [media, setMedia] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const editorRef = useRef();

  useEffect(() => {
    if (!currentUser) {
      navigate('/login', { 
        state: { 
          from: '/create-post',
          message: 'Gönderi oluşturmak için giriş yapmalısınız.'
        } 
      });
    }
  }, [currentUser, navigate]);

  const handleMediaChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Dosya boyutu 5MB\'dan küçük olmalıdır.');
        setShowError(true);
        return;
      }
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        setError('Sadece resim ve video dosyaları yükleyebilirsiniz.');
        setShowError(true);
        return;
      }
      setMedia(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveMedia = () => {
    setMedia(null);
    setMediaPreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      setError('Gönderi oluşturmak için giriş yapmalısınız.');
      setShowError(true);
      return;
    }
    const content = editorRef.current.getContent();
    if (!title.trim() || !content.trim() || !category) {
      setError('Lütfen tüm alanları doldurun');
      setShowError(true);
      return;
    }
    try {
      setLoading(true);
      setError('');
      const postData = {
        title: title.trim(),
        content: content.trim(),
        category,
        authorId: currentUser.uid,
        authorName: currentUser.displayName || currentUser.email || 'Anonim',
        authorEmail: currentUser.email,
      };
      await createPost(postData, media);
      navigate('/', { state: { message: 'Gönderi başarıyla oluşturuldu!' } });
    } catch (err) {
      setError(err.message || 'Gönderi oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Yeni Gönderi Oluştur
          </Typography>
          <Snackbar 
            open={showError} 
            autoHideDuration={6000} 
            onClose={() => setShowError(false)}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <Alert onClose={() => setShowError(false)} severity="error" sx={{ width: '100%' }}>
              {error}
            </Alert>
          </Snackbar>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Başlık"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Kategori"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                >
                  {categories.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  İçerik
                </Typography>
                <TiptapEditor
                  ref={editorRef}
                  key="main-editor"
                  placeholder="İçeriğinizi buraya yazın..."
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Button
                    component="label"
                    variant="outlined"
                    startIcon={<CloudUploadIcon />}
                  >
                    Medya Yükle
                    <VisuallyHiddenInput
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleMediaChange}
                    />
                  </Button>
                  {mediaPreview && (
                    <IconButton onClick={handleRemoveMedia} color="error">
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>
                {mediaPreview && (
                  <ImagePreview src={mediaPreview} alt="Preview" />
                )}
              </Grid>
              <Grid item xs={12}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  type="submit"
                  disabled={loading}
                  sx={{ mt: 2 }}
                >
                  {loading ? 'Yükleniyor...' : 'Gönderi Oluştur'}
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default CreatePost; 