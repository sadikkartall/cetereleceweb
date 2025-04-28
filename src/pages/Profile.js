import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
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
  Tabs,
  Tab,
  IconButton,
  Badge,
  Stack
} from '@mui/material';
import { 
  Person as PersonIcon,
  Email as EmailIcon,
  Edit as EditIcon,
  People as PeopleIcon,
  Bookmark as BookmarkIcon,
  ImageOutlined as ImageIcon,
  FavoriteBorder as LikeIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getDocument } from '../firebase/firestore';

const Profile = () => {
  const { currentUser, userData, profileImage } = useAuth();
  const [userPosts, setUserPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        // Firebase'den kullanıcının gönderilerini çekme işlemi
        await fetchUserPosts();
        // Kayıtlı gönderileri çek
        await fetchSavedPosts();
        // Takipçileri çek
        await fetchFollowers();
        // Takip edilenleri çek
        await fetchFollowing();
        
        setLoading(false);
      } catch (err) {
        console.error('Kullanıcı verileri yüklenemedi:', err);
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchUserData();
    }
  }, [currentUser]);

  // Kullanıcının gönderilerini getir
  const fetchUserPosts = async () => {
    try {
      // Firebase'den kullanıcının gönderilerini çekme işlemi burada yapılacak
      // Örnek veri (gerçek uygulamada Firestore'dan çekilecek)
      setUserPosts([]);
    } catch (err) {
      console.error('Gönderiler yüklenemedi:', err);
    }
  };

  // Kayıtlı gönderileri getir
  const fetchSavedPosts = async () => {
    try {
      // Firebase'den kullanıcının kaydettiği gönderileri çekme işlemi
      // Örnek veri (gerçek uygulamada Firestore'dan çekilecek)
      setSavedPosts([]);
    } catch (err) {
      console.error('Kayıtlı gönderiler yüklenemedi:', err);
    }
  };

  // Takipçileri getir
  const fetchFollowers = async () => {
    try {
      // Firebase'den kullanıcının takipçilerini çekme işlemi
      // Örnek veri (gerçek uygulamada Firestore'dan çekilecek)
      setFollowers([]);
    } catch (err) {
      console.error('Takipçiler yüklenemedi:', err);
    }
  };

  // Takip edilenleri getir
  const fetchFollowing = async () => {
    try {
      // Firebase'den kullanıcının takip ettiği kişileri çekme işlemi
      // Örnek veri (gerçek uygulamada Firestore'dan çekilecek)
      setFollowing([]);
    } catch (err) {
      console.error('Takip edilenler yüklenemedi:', err);
    }
  };

  // Tab değişikliği
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
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

  const defaultAvatar = "https://via.placeholder.com/150";

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" component="h1">
              Profil
            </Typography>
            <Button 
              variant="outlined" 
              startIcon={<EditIcon />}
              onClick={() => navigate('/settings')}
            >
              Düzenle
            </Button>
          </Box>
          
          <Grid container spacing={4}>
            {/* Profil Bilgileri */}
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Avatar 
                  src={profileImage || userData?.photoURL || defaultAvatar} 
                  alt={userData?.displayName || currentUser.email}
                  sx={{ 
                    width: 180, 
                    height: 180, 
                    mb: 2,
                    border: '4px solid',
                    borderColor: 'primary.light',
                    boxShadow: 3
                  }}
                />
                
                {/* Edit button to navigate to settings */}
                <Box 
                  sx={{ 
                    position: 'relative', 
                    top: -28, 
                    right: -60, 
                    mb: -3,
                    bgcolor: 'background.paper',
                    borderRadius: '50%',
                    boxShadow: 1,
                    zIndex: 1
                  }}
                >
                  <IconButton 
                    color="primary" 
                    onClick={() => navigate('/settings')}
                    size="small"
                  >
                    <EditIcon />
                  </IconButton>
                </Box>
                
                <Typography variant="h5" align="center" gutterBottom>
                  {userData?.displayName || 'İsimsiz Kullanıcı'}
                </Typography>
                <Chip 
                  icon={<PersonIcon />} 
                  label={`@${userData?.username || 'kullanıcı'}`} 
                  color="primary" 
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
                
                {/* İstatistikler */}
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-around', 
                  width: '100%',
                  mb: 2,
                  p: 2,
                  borderRadius: 1,
                  bgcolor: 'background.paper',
                  boxShadow: 1
                }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6">{userPosts.length}</Typography>
                    <Typography variant="body2" color="text.secondary">Gönderi</Typography>
                  </Box>
                  <Divider orientation="vertical" flexItem />
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6">{followers.length}</Typography>
                    <Typography variant="body2" color="text.secondary">Takipçi</Typography>
                  </Box>
                  <Divider orientation="vertical" flexItem />
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6">{following.length}</Typography>
                    <Typography variant="body2" color="text.secondary">Takip</Typography>
                  </Box>
                </Box>
                
                <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
                  <EmailIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                  {currentUser.email}
                </Typography>
                
                {userData?.bio && (
                  <Typography variant="body1" sx={{ textAlign: 'center', mb: 2 }}>
                    {userData.bio}
                  </Typography>
                )}
              </Box>
            </Grid>
            
            {/* İçerik Alanı */}
            <Grid item xs={12} md={8}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs 
                  value={tabValue} 
                  onChange={handleTabChange} 
                  variant="fullWidth"
                  indicatorColor="primary"
                  textColor="primary"
                >
                  <Tab 
                    icon={<ImageIcon />} 
                    label="Gönderilerim" 
                    iconPosition="start"
                  />
                  <Tab 
                    icon={<BookmarkIcon />} 
                    label="Kaydedilenler" 
                    iconPosition="start"
                  />
                  <Tab 
                    icon={<PeopleIcon />} 
                    label="Takip" 
                    iconPosition="start"
                  />
                </Tabs>
              </Box>
              
              {/* Gönderi Sekmesi */}
              {tabValue === 0 && (
                <Box>
                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : userPosts.length === 0 ? (
                    <Box sx={{ 
                      p: 3, 
                      textAlign: 'center', 
                      bgcolor: 'background.default', 
                      borderRadius: 1 
                    }}>
                      <Typography variant="body1">Henüz gönderiniz bulunmuyor.</Typography>
                      <Button 
                        variant="contained" 
                        color="primary" 
                        sx={{ mt: 2 }}
                        onClick={() => navigate('/create-post')}
                      >
                        Yeni Gönderi Oluştur
                      </Button>
                    </Box>
                  ) : (
                    <Grid container spacing={2}>
                      {userPosts.map((post) => (
                        <Grid item xs={12} key={post.id}>
                          <Card sx={{ display: 'flex', cursor: 'pointer' }} onClick={() => navigate(`/post/${post.id}`)}>
                            {post.image && (
                              <CardMedia
                                component="img"
                                sx={{ width: 120 }}
                                image={post.image}
                                alt={post.title}
                              />
                            )}
                            <CardContent sx={{ flex: 1 }}>
                              <Typography variant="h6">{post.title}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {post.category && (
                                  <Chip 
                                    label={post.category} 
                                    size="small" 
                                    sx={{ mr: 1, mb: 1 }} 
                                  />
                                )}
                                {new Date(post.createdAt?.toDate()).toLocaleDateString('tr-TR')}
                              </Typography>
                              <Typography variant="body2" noWrap>
                                {post.content}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </Box>
              )}
              
              {/* Kaydedilenler Sekmesi */}
              {tabValue === 1 && (
                <Box>
                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <CircularProgress />
                    </Box>
                  ) : savedPosts.length === 0 ? (
                    <Box sx={{ 
                      p: 3, 
                      textAlign: 'center', 
                      bgcolor: 'background.default', 
                      borderRadius: 1 
                    }}>
                      <Typography variant="body1">Henüz kaydettiğiniz gönderi bulunmuyor.</Typography>
                      <Button 
                        variant="contained" 
                        color="primary" 
                        sx={{ mt: 2 }}
                        onClick={() => navigate('/')}
                      >
                        Göz At
                      </Button>
                    </Box>
                  ) : (
                    <Grid container spacing={2}>
                      {savedPosts.map((post) => (
                        <Grid item xs={12} key={post.id}>
                          <Card sx={{ display: 'flex', cursor: 'pointer' }} onClick={() => navigate(`/post/${post.id}`)}>
                            {post.image && (
                              <CardMedia
                                component="img"
                                sx={{ width: 120 }}
                                image={post.image}
                                alt={post.title}
                              />
                            )}
                            <CardContent sx={{ flex: 1 }}>
                              <Typography variant="h6">{post.title}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {post.author && (
                                  <Typography component="span" sx={{ mr: 1 }}>
                                    <strong>{post.author}</strong>
                                  </Typography>
                                )}
                                {post.category && (
                                  <Chip 
                                    label={post.category} 
                                    size="small" 
                                    sx={{ mr: 1, mb: 1 }} 
                                  />
                                )}
                                {new Date(post.createdAt?.toDate()).toLocaleDateString('tr-TR')}
                              </Typography>
                              <Typography variant="body2" noWrap>
                                {post.content}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </Box>
              )}
              
              {/* Takip Sekmesi */}
              {tabValue === 2 && (
                <Box>
                  <Tabs
                    value={tabValue > 2 ? tabValue : 3}
                    onChange={(e, newValue) => setTabValue(newValue)}
                    variant="fullWidth"
                    sx={{ mb: 2 }}
                  >
                    <Tab 
                      label="Takipçilerim" 
                      value={3}
                    />
                    <Tab 
                      label="Takip Ettiklerim" 
                      value={4}
                    />
                  </Tabs>
                  
                  {/* Takipçiler */}
                  {tabValue === 3 && (
                    <Box>
                      {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                          <CircularProgress />
                        </Box>
                      ) : followers.length === 0 ? (
                        <Box sx={{ 
                          p: 3, 
                          textAlign: 'center', 
                          bgcolor: 'background.default', 
                          borderRadius: 1 
                        }}>
                          <Typography variant="body1">Henüz takipçiniz bulunmuyor.</Typography>
                        </Box>
                      ) : (
                        <Stack spacing={2}>
                          {followers.map((follower) => (
                            <Card key={follower.id} variant="outlined">
                              <CardContent sx={{ 
                                display: 'flex', 
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                py: 1,
                                '&:last-child': { pb: 1 }
                              }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Avatar 
                                    src={follower.photoURL || defaultAvatar}
                                    alt={follower.displayName}
                                    sx={{ mr: 2, width: 40, height: 40 }}
                                  />
                                  <Box>
                                    <Typography variant="subtitle1">{follower.displayName}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      @{follower.username}
                                    </Typography>
                                  </Box>
                                </Box>
                                <Button variant="outlined" size="small">
                                  Profil
                                </Button>
                              </CardContent>
                            </Card>
                          ))}
                        </Stack>
                      )}
                    </Box>
                  )}
                  
                  {/* Takip Edilenler */}
                  {tabValue === 4 && (
                    <Box>
                      {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                          <CircularProgress />
                        </Box>
                      ) : following.length === 0 ? (
                        <Box sx={{ 
                          p: 3, 
                          textAlign: 'center', 
                          bgcolor: 'background.default', 
                          borderRadius: 1 
                        }}>
                          <Typography variant="body1">Henüz takip ettiğiniz kimse bulunmuyor.</Typography>
                          <Button 
                            variant="contained" 
                            color="primary" 
                            sx={{ mt: 2 }}
                            onClick={() => navigate('/')}
                          >
                            Kullanıcı Keşfet
                          </Button>
                        </Box>
                      ) : (
                        <Stack spacing={2}>
                          {following.map((user) => (
                            <Card key={user.id} variant="outlined">
                              <CardContent sx={{ 
                                display: 'flex', 
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                py: 1,
                                '&:last-child': { pb: 1 }
                              }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Avatar 
                                    src={user.photoURL || defaultAvatar}
                                    alt={user.displayName}
                                    sx={{ mr: 2, width: 40, height: 40 }}
                                  />
                                  <Box>
                                    <Typography variant="subtitle1">{user.displayName}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      @{user.username}
                                    </Typography>
                                  </Box>
                                </Box>
                                <Button 
                                  variant="outlined"
                                  color="primary"
                                  size="small"
                                >
                                  Takibi Bırak
                                </Button>
                              </CardContent>
                            </Card>
                          ))}
                        </Stack>
                      )}
                    </Box>
                  )}
                </Box>
              )}
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Container>
  );
};

export default Profile; 