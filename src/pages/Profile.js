import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserPosts, deletePost, updatePost, getPosts, getPost } from '../services/postService';
import { getFollowersCount, getFollowingCount, followUser, unfollowUser, isFollowing } from '../services/followService';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  Button, 
  Grid, 
  Avatar, 
  Divider,
  Card,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Snackbar,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import { 
  Person as PersonIcon,
  Email as EmailIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  WarningAmber as WarningAmberIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import TiptapEditor from '../components/TiptapEditor';
import { updateUserProfile, getUserProfile } from '../firebase/firestore';
import { uploadProfileImage } from '../firebase/storage';
import { styled } from '@mui/material/styles';

const Input = styled('input')({
  display: 'none',
});

// HTML etiketlerini ve görsel URL'lerini temizleyen gelişmiş fonksiyon
function stripHtml(html) {
  if (!html) return '';
  
  let cleanText = html;
  
  // Markdown formatındaki görselleri kaldır ![alt](url)
  cleanText = cleanText.replace(/!\[([^\]]*)\]\([^)]+\)/g, '');
  
  // Mobil format [IMAGE:...] kaldır
  cleanText = cleanText.replace(/\[IMAGE:[^\]]+\]/g, '');
  
  // HTML img taglerini kaldır
  cleanText = cleanText.replace(/<img[^>]*>/gi, '');
  
  // Diğer HTML taglerini kaldır
  const tmp = document.createElement('DIV');
  tmp.innerHTML = cleanText;
  
  let textContent = tmp.textContent || tmp.innerText || '';
  
  // Fazla boşlukları temizle
  textContent = textContent.replace(/\s+/g, ' ').trim();
  
  return textContent;
}

// İçerikten temiz özet çıkaran fonksiyon
function getSummary(html, maxLength = 120) {
  if (!html) return '';
  
  // Önce tüm görselleri temizle (markdown ve HTML)
  let cleanContent = html;
  
  // Markdown formatındaki görselleri kaldır ![alt](url)
  cleanContent = cleanContent.replace(/!\[([^\]]*)\]\([^)]+\)/g, '');
  
  // Mobil format [IMAGE:...] kaldır
  cleanContent = cleanContent.replace(/\[IMAGE:[^\]]+\]/g, '');
  
  // HTML img taglerini kaldır
  cleanContent = cleanContent.replace(/<img[^>]*>/gi, '');
  
  // HTML taglerini kaldır
  const tmp = document.createElement('DIV');
  tmp.innerHTML = cleanContent;
  
  let text = tmp.textContent || tmp.innerText || '';
  
  // Fazla boşlukları temizle
  text = text.replace(/\s+/g, ' ').trim();
  
  if (text.length > maxLength) {
    text = text.slice(0, maxLength) + '...';
  }
  return text;
}

const categories = [
  'Genel',
  'Teknoloji',
  'Bilim',
  'Sanat',
  'Spor',
  'Yaşam',
  'Diğer'
];

const Profile = () => {
  const { currentUser, userData: authUserData } = useAuth();
  const { userId } = useParams();
  const [userPosts, setUserPosts] = useState([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editPost, setEditPost] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tab, setTab] = useState(0);
  const [bookmarkedPosts, setBookmarkedPosts] = useState([]);
  const [followingStatus, setFollowingStatus] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Profil sahibinin kimliği - URL'den gelen userId veya mevcut kullanıcı
  const profileUserId = userId || currentUser?.uid;
  const isOwnProfile = !userId || userId === currentUser?.uid;

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const uid = userId || currentUser?.uid;
        if (!uid) return;
        const profile = await getUserProfile(uid);
        setUserData(profile);
        await fetchUserPosts(uid);
        const [followers, following] = await Promise.all([
          getFollowersCount(uid),
          getFollowingCount(uid)
        ]);
        setFollowersCount(followers);
        setFollowingCount(following);

        // Başka birinin profiliyse takip durumunu kontrol et
        if (!isOwnProfile && currentUser?.uid) {
          const isFollowingUser = await isFollowing(currentUser.uid, uid);
          setFollowingStatus(isFollowingUser);
        }

        setLoading(false);
      } catch (err) {
        setLoading(false);
      }
    };
    if (userId || currentUser) fetchUserData();
  }, [userId, currentUser, isOwnProfile]);

  useEffect(() => {
    if ((userId === undefined || userId === currentUser?.uid) && authUserData) {
      setUserData(authUserData);
    }
  }, [authUserData, userId, currentUser]);

  useEffect(() => {
    const fetchBookmarkedPosts = async () => {
      console.log('userData.bookmarks:', userData?.bookmarks);
      if (userData?.bookmarks && userData.bookmarks.length > 0) {
        const posts = await Promise.all(
          userData.bookmarks.map(async (id) => {
            try {
              const post = await getPost(id);
              return post;
            } catch {
              return null;
            }
          })
        );
        setBookmarkedPosts(posts.filter(Boolean));
        console.log('bookmarkedPosts:', posts.filter(Boolean));
      } else {
        setBookmarkedPosts([]);
        console.log('bookmarkedPosts: []');
      }
    };
    fetchBookmarkedPosts();
  }, [userData]);

  const fetchUserPosts = async (uid) => {
    try {
      const posts = await getUserPosts(uid);
      setUserPosts(posts);
    } catch (err) {
      setUserPosts([]);
    }
  };

  // Silme işlemi
  const handleDelete = (postId) => {
    setDeleteTargetId(postId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setDeleteLoading(true);
    try {
      await deletePost(deleteTargetId);
      setSnackbar({ open: true, message: 'Gönderi silindi.', severity: 'success' });
      await fetchUserPosts(deleteTargetId);
    } catch (err) {
      setSnackbar({ open: true, message: 'Gönderi silinirken hata oluştu.', severity: 'error' });
    }
    setDeleteLoading(false);
    setDeleteDialogOpen(false);
    setDeleteTargetId(null);
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDeleteTargetId(null);
  };

  // Düzenleme işlemi
  const handleEditOpen = (post) => {
    setEditPost({ ...post });
    setEditOpen(true);
  };
  const handleEditClose = () => {
    setEditOpen(false);
    setEditPost(null);
  };
  const handleEditChange = (e) => {
    setEditPost({ ...editPost, [e.target.name]: e.target.value });
  };
  const handleEditContentChange = (val) => {
    setEditPost({ ...editPost, content: val });
  };
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      await updatePost(editPost.id, {
        title: editPost.title,
        content: editPost.content,
        category: editPost.category
      });
      setSnackbar({ open: true, message: 'Gönderi güncellendi.', severity: 'success' });
      await fetchUserPosts(editPost.id);
      handleEditClose();
    } catch (err) {
      setSnackbar({ open: true, message: 'Gönderi güncellenirken hata oluştu.', severity: 'error' });
    }
    setEditLoading(false);
  };

  const handleFollowToggle = async () => {
    if (!currentUser?.uid || !profileUserId || followLoading || isOwnProfile) return;
    
    setFollowLoading(true);
    try {
      if (followingStatus) {
        await unfollowUser(currentUser.uid, profileUserId);
        setFollowingStatus(false);
        setFollowersCount(prev => prev - 1);
        setSnackbar({ open: true, message: 'Takibi bıraktınız', severity: 'success' });
      } else {
        await followUser(currentUser.uid, profileUserId);
        setFollowingStatus(true);
        setFollowersCount(prev => prev + 1);
        setSnackbar({ open: true, message: 'Kullanıcıyı takip etmeye başladınız', severity: 'success' });
      }
    } catch (err) {
      setSnackbar({ open: true, message: 'Takip işlemi sırasında bir hata oluştu', severity: 'error' });
      console.error(err);
    } finally {
      setFollowLoading(false);
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      setError('');

      // Fotoğrafı yükle
      const photoURL = await uploadProfileImage(file, currentUser.uid);

      // Profili güncelle
      await updateUserProfile(currentUser.uid, {
        ...userData,
        photoURL
      });

      setUserData(prev => ({
        ...prev,
        photoURL
      }));

      setSuccess('Profil fotoğrafı başarıyla güncellendi');
    } catch (error) {
      console.error('Fotoğraf yükleme hatası:', error);
      setError('Fotoğraf yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 8, textAlign: 'center' }}>
          <Typography variant="h6">Bu sayfayı görüntülemek için giriş yapmalısınız.</Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => navigate('/login')}
            sx={{ mt: 2 }}
          >
            Giriş Yap
          </Button>
        </Box>
      </Container>
    );
  }

  const defaultAvatar = "https://ui-avatars.com/api/?name=Anonim";

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1">
              Profil
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              {/* Takip et/Takibi bırak butonu - sadece başka kullanıcıların profili için */}
              {!isOwnProfile && currentUser && (
                <Button
                  variant={followingStatus ? "outlined" : "contained"}
                  color="primary"
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                >
                  {followLoading ? 'Yükleniyor...' : (followingStatus ? 'Takibi Bırak' : 'Takip Et')}
                </Button>
              )}
              {/* Düzenle butonu - sadece kendi profili için */}
              {isOwnProfile && (
                <Button
                  variant="outlined" 
                  startIcon={<EditIcon />}
                  onClick={() => navigate('/settings')}
                >
                  Düzenle
                </Button>
              )}
            </Box>
          </Box>
          <Grid container spacing={4}>
            {/* Profil Bilgileri */}
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Avatar 
                  src={userData?.photoURL || defaultAvatar} 
                  alt={userData?.displayName || currentUser.email}
                  sx={{ width: 180, height: 180, mb: 2, border: '4px solid', borderColor: 'primary.light', boxShadow: 3 }}
                />
                {isOwnProfile && (
                  <label htmlFor="photo-upload">
                    <Input
                      accept="image/*"
                      id="photo-upload"
                      type="file"
                      onChange={handlePhotoChange}
                      disabled={loading}
                    />
                    <Button
                      variant="contained"
                      component="span"
                      disabled={loading}
                    >
                      Fotoğraf Yükle
                    </Button>
                  </label>
                )}
                <Typography variant="h5" align="center" gutterBottom>
                  {userData?.displayName || 'İsimsiz Kullanıcı'}
                </Typography>
                <Chip icon={<PersonIcon />} label={`@${userData?.username || 'kullanıcı'}`} variant="outlined" sx={{ mb: 1 }} />
                <Chip icon={<EmailIcon />} label={userData?.email || ''} variant="outlined" />
                {/* Takipçi ve Takip edilen */}
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6">{followersCount}</Typography>
                    <Typography variant="body2" color="text.secondary">Takipçi</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6">{followingCount}</Typography>
                    <Typography variant="body2" color="text.secondary">Takip</Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>
            {/* Gönderiler */}
            <Grid item xs={12} md={8}>
              <Box sx={{ mb: 4 }}>
                <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 2 }}>
                  <Tab label="Gönderiler" />
                  {isOwnProfile && <Tab label="Kaydedilenler" />}
                </Tabs>
                {tab === 0 && (
                  loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : userPosts.length > 0 ? (
                    <Grid container spacing={2}>
                      {userPosts.map((post) => (
                        <Grid item xs={12} key={post.id}>
                          <Card 
                            sx={{ borderRadius: 3, boxShadow: 2, p: 1, position: 'relative', cursor: 'pointer' }}
                            onClick={() => navigate(`/post/${post.id}`)}
                          >
                            {post.mediaUrl && (
                              <CardMedia
                                component="img"
                                height="180"
                                image={post.mediaUrl}
                                alt={post.title}
                                sx={{ borderRadius: 2, objectFit: 'cover', mb: 1 }}
                              />
                            )}
                            <CardContent>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <Avatar src={post.authorAvatar || defaultAvatar} sx={{ width: 32, height: 32, fontSize: 18, mr: 1 }}>
                                  {post.authorName ? post.authorName[0] : '?'}
                                </Avatar>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mr: 1 }}>{post.authorName}</Typography>
                                <Typography variant="caption" color="text.secondary">{post.createdAt ? new Date(post.createdAt).toLocaleDateString('tr-TR') : ''}</Typography>
                              </Box>
                              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>{stripHtml(post.title)}</Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{getSummary(post.content, 120)}</Typography>
                              <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Chip label={post.category} size="small" color="primary" variant="outlined" />
                              </Box>
                              {isOwnProfile && (
                                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<EditIcon />}
                                    onClick={(e) => { e.stopPropagation(); handleEditOpen(post); }}
                                  >
                                    Düzenle
                                  </Button>
                                  <Button
                                    variant="outlined"
                                    color="error"
                                    size="small"
                                    startIcon={<DeleteIcon />}
                                    onClick={(e) => { e.stopPropagation(); handleDelete(post.id); }}
                                    disabled={deleteLoading}
                                  >
                                    Sil
                                  </Button>
                                </Box>
                              )}
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body1" color="text.secondary">
                        Henüz gönderi bulunmuyor.
                      </Typography>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => navigate('/create-post')}
                        sx={{ mt: 2 }}
                      >
                        İlk Gönderiyi Oluştur
                      </Button>
                    </Box>
                  )
                )}
                {tab === 1 && isOwnProfile && (
                  bookmarkedPosts.length > 0 ? (
                    <Grid container spacing={2}>
                      {bookmarkedPosts.map((post) => (
                        <Grid item xs={12} key={post.id}>
                          <Card sx={{ borderRadius: 3, boxShadow: 2, p: 1, position: 'relative', cursor: 'pointer' }} onClick={() => navigate(`/post/${post.id}`)}>
                            {post.mediaUrl && (
                              <CardMedia
                                component="img"
                                height="180"
                                image={post.mediaUrl}
                                alt={post.title}
                                sx={{ borderRadius: 2, objectFit: 'cover', mb: 1 }}
                              />
                            )}
                            <CardContent>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <Avatar src={post.authorAvatar || 'https://ui-avatars.com/api/?name=Anonim'} sx={{ width: 32, height: 32, fontSize: 18, mr: 1 }}>
                                  {post.authorName ? post.authorName[0] : '?'}
                                </Avatar>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mr: 1 }}>{post.authorName}</Typography>
                                <Typography variant="caption" color="text.secondary">{post.createdAt ? new Date(post.createdAt).toLocaleDateString('tr-TR') : ''}</Typography>
                              </Box>
                              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>{stripHtml(post.title)}</Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {getSummary(post.content, 120)}
                              </Typography>
                              <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Chip label={post.category} size="small" color="primary" variant="outlined" />
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body1" color="text.secondary">Henüz kaydedilen gönderi yok.</Typography>
                    </Box>
                  )
                )}
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>
      {/* Düzenleme Modalı */}
      <Dialog open={editOpen} onClose={handleEditClose} maxWidth="sm" fullWidth>
        <DialogTitle>Gönderiyi Düzenle</DialogTitle>
        <form onSubmit={handleEditSubmit}>
          <DialogContent>
            <TextField
              margin="normal"
              fullWidth
              label="Başlık"
              name="title"
              value={editPost?.title || ''}
              onChange={handleEditChange}
              required
            />
            <TiptapEditor
              value={editPost?.content || ''}
              onChange={handleEditContentChange}
              placeholder="İçeriğinizi buraya yazın..."
            />
            <TextField
              margin="normal"
              fullWidth
              select
              label="Kategori"
              name="category"
              value={editPost?.category || ''}
              onChange={handleEditChange}
              required
            >
              {categories.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleEditClose}>İptal</Button>
            <Button type="submit" variant="contained" color="primary" disabled={editLoading}>
              Kaydet
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      {/* Silme Onay Dialogu */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningAmberIcon color="warning" /> Gönderiyi Sil
        </DialogTitle>
        <DialogContent>
          <Typography>Bu gönderiyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} variant="outlined">İptal</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" disabled={deleteLoading}>Sil</Button>
        </DialogActions>
      </Dialog>
      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError('')}
      >
        <Alert severity="error" onClose={() => setError('')}>
          {error}
        </Alert>
      </Snackbar>
      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess('')}
      >
        <Alert severity="success" onClose={() => setSuccess('')}>
          {success}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Profile; 