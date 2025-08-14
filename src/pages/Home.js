import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getPosts, getTrendingPosts } from '../services/postService';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Box,
  Chip,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Avatar,
  IconButton,
  Divider,
  CircularProgress,
  ButtonBase,
  styled
} from '@mui/material';
import {
  Search as SearchIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Add,
  ChatBubbleOutline as CommentIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Share as ShareIcon,
  Link as LinkIcon,
  TrendingUp as TrendingUpIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import {
  likePost,
  unlikePost,
  bookmarkPost,
  unbookmarkPost
} from '../services/postService';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { followUser, unfollowUser } from '../services/followService';
import { searchUsers, getRecommendedAuthors } from '../services/userService';
import { getUserProfile } from '../firebase/firestore';

function stripHtml(html) {
  if (!html) return '';
  
  let cleanText = html;
  
  // Markdown formatındaki görselleri kaldır ![alt](url)
  cleanText = cleanText.replace(/!\[([^\]]*)\]\([^)]+\)/g, '');
  
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

// Yardımcı fonksiyon: İçerikten ilk img src'sini bul (hem HTML hem mobil format)
function getFirstImageSrc(html) {
  // HTML img tag formatını kontrol et
  const htmlMatch = html.match(/<img[^>]+src=["']([^"']+)["']/);
  if (htmlMatch) return htmlMatch[1];
  
  // Mobil format [IMAGE:...] kontrol et
  const mobileMatch = html.match(/\[IMAGE:([^\]]+)\]/);
  if (mobileMatch) return mobileMatch[1];
  
  return null;
}

// İçerikten ilk img tag'ini kaldır (hem HTML hem mobil format)
function removeFirstImgTag(html) {
  // HTML img tag'ini kaldır
  html = html.replace(/<img[^>]+src=["'][^"']+["'][^>]*>/, '');
  
  // Mobil format [IMAGE:...] kaldır
  html = html.replace(/\[IMAGE:[^\]]+\]/, '');
  
  return html;
}

// Mobil formatındaki görselleri HTML'e çevir
function convertMobileImagesToHtml(content) {
  if (!content) return content;
  
  // [IMAGE:URL] formatını <img> tagine çevir
  return content.replace(/\[IMAGE:([^\]]+)\]/g, '<img src="$1" alt="Görsel" style="max-width: 100%; height: auto; display: block; margin: 16px auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />');
}

// Markdown formatını HTML'e çevir (ajan içerikleri için)
function convertMarkdownToHtml(content) {
  if (!content) return content;
  
  let html = content;
  
  // Markdown başlıkları çevir
  html = html.replace(/^## (.+)$/gm, '<h2 style="font-size: 1.5rem; font-weight: 700; margin: 24px 0 16px 0; color: #1a1a1a;">$1</h2>');
  html = html.replace(/^### (.+)$/gm, '<h3 style="font-size: 1.25rem; font-weight: 600; margin: 20px 0 12px 0; color: #2a2a2a;">$1</h3>');
  html = html.replace(/^#### (.+)$/gm, '<h4 style="font-size: 1.1rem; font-weight: 600; margin: 16px 0 8px 0; color: #3a3a3a;">$1</h4>');
  
  // Kalın yazı formatı
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight: 600;">$1</strong>');
  
  // İtalik yazı formatı
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  
  // Link formatı
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" style="color: #1976d2; text-decoration: underline;">$1</a>');
  
  // Liste formatı (- ile başlayan)
  html = html.replace(/^- (.+)$/gm, '<li style="margin: 4px 0;">$1</li>');
  html = html.replace(/(<li[^>]*>.*<\/li>)/gs, '<ul style="margin: 12px 0; padding-left: 20px;">$1</ul>');
  
  // Paragrafları ayır ve <p> taglerinde sarmak
  const paragraphs = html.split(/\n\s*\n/);
  html = paragraphs.map(paragraph => {
    paragraph = paragraph.trim();
    if (!paragraph) return '';
    
    // Eğer zaten HTML tag'i varsa (h2, h3, ul, etc.) olduğu gibi bırak
    if (paragraph.match(/^<(h[1-6]|ul|ol|blockquote|div)/)) {
      return paragraph;
    }
    
    // Görsel tag'i varsa olduğu gibi bırak
    if (paragraph.includes('<img')) {
      return paragraph;
    }
    
    // Diğer durumlarda p tag'i ile sarmak
    return `<p style="margin: 12px 0; line-height: 1.6; color: #333;">${paragraph}</p>`;
  }).join('');
  
  return html;
}

// İçerikten özet (ilk paragraf veya ilk 200 karakter)
function getSummary(html) {
  if (!html) return '';
  
  // Önce tüm görselleri temizle (markdown ve HTML)
  let cleanContent = html;
  
  // Markdown formatındaki görselleri kaldır ![alt](url)
  cleanContent = cleanContent.replace(/!\[([^\]]*)\]\([^)]+\)/g, '');
  
  // Mobil format [IMAGE:...] kaldır
  cleanContent = cleanContent.replace(/\[IMAGE:[^\]]+\]/g, '');
  
  // HTML img taglerini kaldır
  cleanContent = cleanContent.replace(/<img[^>]*>/gi, '');
  
  // Markdown'u HTML'e çevir
  const convertedHtml = convertMarkdownToHtml(cleanContent);
  
  const tmp = document.createElement('DIV');
  tmp.innerHTML = convertedHtml;
  
  // İlk paragrafı bul
  const firstP = tmp.querySelector('p');
  let text = firstP ? firstP.textContent : (tmp.textContent || tmp.innerText || '');
  
  // Fazla boşlukları temizle
  text = text.replace(/\s+/g, ' ').trim();
  
  if (text.length > 200) {
    text = text.slice(0, 200) + '...';
  }
  return text;
}

// Modern feed kartı için styled component
const FeedCard = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'stretch',
  background: theme.palette.background.paper,
  borderRadius: 20,
  boxShadow: '0 4px 24px rgba(162,89,255,0.08)',
  marginBottom: 32,
  cursor: 'pointer',
  transition: 'box-shadow 0.2s, transform 0.2s',
  minHeight: 180,
  position: 'relative',
  overflow: 'hidden',
  paddingRight: 0,
  [theme.breakpoints.down('sm')]: {
    minHeight: 90,
    borderRadius: 12,
    flexDirection: 'column',
  },
  '&:hover': {
    boxShadow: '0 8px 32px rgba(162,89,255,0.16)',
    transform: 'translateY(-4px) scale(1.01)',
  },
}));

const FeedCardCover = styled('img')(({ theme }) => ({
  width: '32%',
  minWidth: 200,
  maxWidth: 350,
  height: '100%',
  objectFit: 'contain',
  borderTopRightRadius: 20,
  borderBottomRightRadius: 20,
  marginLeft: 0,
  background: theme.palette.grey[200],
  display: 'block',
  alignSelf: 'stretch',
  [theme.breakpoints.down('sm')]: {
    width: '100%',
    minWidth: 0,
    maxWidth: '100%',
    height: 180,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 0,
    borderBottomLeftRadius: 12,
    borderTopLeftRadius: 12,
    marginLeft: 0,
    alignSelf: 'flex-start',
  },
}));

const FeedCardContent = styled('div')(({ theme }) => ({
  flex: 1,
  padding: 28,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  minWidth: 0,
  [theme.breakpoints.down('sm')]: {
    padding: 12,
  },
}));

const FeedCardMeta = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  color: theme.palette.text.secondary,
  fontSize: 15,
  marginBottom: 8,
}));

const FeedCardTitle = styled('div')(({ theme }) => ({
  fontWeight: 700,
  fontSize: 22,
  color: theme.palette.text.primary,
  marginBottom: 8,
  wordBreak: 'break-word',
  whiteSpace: 'pre-line',
}));

const FeedCardSummary = styled('div')(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontSize: 16,
  marginBottom: 8,
  minHeight: 32,
  wordBreak: 'break-word',
  whiteSpace: 'pre-line',
}));

const Home = () => {
  const navigate = useNavigate();
  const { currentUser, userData, setUserData } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [tabValue, setTabValue] = useState(0);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [sharePost, setSharePost] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [followingIds, setFollowingIds] = useState([]);
  const [userResults, setUserResults] = useState([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [recommendedAuthors, setRecommendedAuthors] = useState([]);

  // Kategoriler
  const categories = ['all', 'Yazılım', 'Donanım', 'Siber Güvenlik', 'Python', 'Yapay Zeka', 'Mobil', 'Web', 'Oyun', 'Veri Bilimi', 'Diğer'];

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const { posts } = await getPosts(20);
        setPosts(posts);
      } catch (err) {
        setPosts([]);
      }
      setLoading(false);
    };
    fetchPosts();

    // Fetch following user IDs for the current user
    const fetchFollowing = async () => {
      if (currentUser) {
        const followingRef = collection(db, 'users', currentUser.uid, 'following');
        const snapshot = await getDocs(followingRef);
        setFollowingIds(snapshot.docs.map(doc => doc.id));
      } else {
        setFollowingIds([]);
      }
    };
    fetchFollowing();
  }, [currentUser]);

  // Önerilen yazarları güncelle
  useEffect(() => {
    const updateRecommendations = async () => {
      if (currentUser && userData && posts.length > 0) {
        const recommended = await getRecommendedAuthors(
          currentUser.uid,
          userData,
          posts,
          followingIds,
          5
        );
        setRecommendedAuthors(recommended);
      }
    };
    updateRecommendations();
  }, [currentUser, userData, posts, followingIds]);

  // Gönderileri filtreleme
  const filteredPosts = posts.filter((post) => {
    const search = searchTerm.toLowerCase();
    const matchesTitle = post.title.toLowerCase().includes(search);
    const matchesContent = stripHtml(post.content).toLowerCase().includes(search);
    const matchesAuthorName = post.authorName && post.authorName.toLowerCase().includes(search);
    const matchesAuthorUsername = post.authorUsername && post.authorUsername.toLowerCase().includes(search);
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    return (matchesTitle || matchesContent || matchesAuthorName || matchesAuthorUsername) && matchesCategory;
  });

  // Kullanıcının hobileriyle eşleşen gönderiler
  let hobbyPosts = [];
  let otherPosts = filteredPosts;
  if (currentUser && userData?.hobbies?.length > 0) {
    hobbyPosts = filteredPosts.filter(post =>
      userData.hobbies.some(hobby =>
        (post.category && post.category.toLowerCase().includes(hobby.toLowerCase())) ||
        (post.title && post.title.toLowerCase().includes(hobby.toLowerCase()))
      )
    );
    // Diğer gönderilerden hobilerle eşleşenleri çıkar
    otherPosts = filteredPosts.filter(post => !hobbyPosts.includes(post));
  }

  // Akıllı trend algoritması ile popüler gönderileri hesapla
  const popularPosts = getTrendingPosts(posts, 5);

  // Optimistic update for like
  const handleLike = async (post) => {
    if (!currentUser) return;
    const isLiked = post.likes && post.likes.includes(currentUser.uid);
    // Optimistically update UI
    setPosts((prevPosts) => prevPosts.map((p) =>
      p.id === post.id
        ? {
            ...p,
            likes: isLiked
              ? p.likes.filter((uid) => uid !== currentUser.uid)
              : [...(p.likes || []), currentUser.uid],
          }
        : p
    ));
    try {
      if (isLiked) {
        await unlikePost(post.id, currentUser.uid);
      } else {
        await likePost(post.id, currentUser.uid);
      }
    } catch (err) {
      // Revert on error
      setPosts((prevPosts) => prevPosts.map((p) =>
        p.id === post.id ? post : p
      ));
    }
  };

  // Optimistic update for bookmark
  const handleBookmark = async (post) => {
    if (!currentUser) return;
    const isBookmarked = post.bookmarks && post.bookmarks.includes(currentUser.uid);
    setPosts((prevPosts) => prevPosts.map((p) =>
      p.id === post.id
        ? {
            ...p,
            bookmarks: isBookmarked
              ? p.bookmarks.filter((uid) => uid !== currentUser.uid)
              : [...(p.bookmarks || []), currentUser.uid],
          }
        : p
    ));
    try {
      if (isBookmarked) {
        await unbookmarkPost(post.id, currentUser.uid);
      } else {
        await bookmarkPost(post.id, currentUser.uid);
      }
      // Kullanıcı profilini güncelle
      if (typeof setUserData === 'function' && currentUser?.uid) {
        const updatedProfile = await getUserProfile(currentUser.uid);
        setUserData(updatedProfile);
      }
    } catch (err) {
      setPosts((prevPosts) => prevPosts.map((p) =>
        p.id === post.id ? post : p
      ));
    }
  };

  const handleShare = (post) => {
    const url = window.location.origin + '/post/' + post.id;
    setShareUrl(url);
    setSharePost(post);
    setShareOpen(true);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setSnackbarOpen(true);
  };

  // Tab-based post filtering
  let tabPosts = filteredPosts;
  if (tabValue === 1) {
    tabPosts = popularPosts;
  } else if (tabValue === 2) {
    tabPosts = filteredPosts.filter(post => followingIds.includes(post.authorId));
  }

  const handleUserSearch = async (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (value.length > 1) {
      const users = await searchUsers(value);
      setUserResults(users);
      setShowUserDropdown(true);
    } else {
      setUserResults([]);
      setShowUserDropdown(false);
    }
  };

  return (
    <Box sx={{ 
      backgroundColor: 'background.default',
      minHeight: '100vh',
      pt: 8,
      pb: 8
    }}>
      <Container maxWidth="lg">
        {/* Hero Section */}
        <Box sx={{ mb: 6, textAlign: 'center' }}>
          <Typography variant="h2" component="h1" gutterBottom sx={{ 
            fontWeight: 700,
            background: '#23272f',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 20px rgba(90, 1, 213, 0.25)',
          }}>
            CetereleceNet
          </Typography>
          <Typography variant="h5" color="text.secondary" sx={{ mb: 4 }}>
            Bilgi paylaşım platformu
          </Typography>
        </Box>

        {/* Arama ve Kategori Filtreleri */}
        <Box sx={{ mb: 6 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Gönderi veya kullanıcı arayın: Başlık, içerik veya kullanıcı adı ile hızlıca bulun."
                value={searchTerm}
                onChange={handleUserSearch}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    height: '56px',
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {categories.map((category) => (
                  <Chip
                    key={category}
                    label={category}
                    onClick={() => setSelectedCategory(category)}
                    color={selectedCategory === category ? 'primary' : 'default'}
                    sx={{
                      fontSize: '0.9rem',
                      height: '36px',
                    }}
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        </Box>

        {showUserDropdown && userResults.length > 0 && (
          <Box sx={{ position: 'absolute', zIndex: 10, background: '#fff', width: '100%', boxShadow: 3, borderRadius: 2, mt: 1 }}>
            {userResults.map(user => (
              <Box
                key={user.id}
                sx={{ display: 'flex', alignItems: 'center', p: 1, cursor: 'pointer', '&:hover': { background: '#f5f5f5' } }}
                onClick={() => { setShowUserDropdown(false); navigate(`/profile/${user.id}`); }}
              >
                <Avatar src={user.photoURL} sx={{ width: 32, height: 32, mr: 1 }} />
                <Box>
                  <Typography variant="subtitle2">{user.displayName}</Typography>
                  <Typography variant="caption" color="text.secondary">@{user.username}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        )}

        <Grid container spacing={4}>
          {/* Ana İçerik */}
          <Grid item xs={12} md={8}>
            <Tabs
              value={tabValue}
              onChange={(e, newValue) => setTabValue(newValue)}
              sx={{
                mb: 4,
                '& .MuiTab-root': {
                  fontSize: '1rem',
                  textTransform: 'none',
                  minHeight: '48px',
                },
              }}
            >
              <Tab label="Son Gönderiler" />
              <Tab label="Popüler" />
              <Tab label="Takip Edilenler" />
            </Tabs>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 6 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                {/* Feed Başlangıcı */}
                {currentUser && userData?.hobbies?.length > 0 && hobbyPosts.length > 0 && (
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                      Senin İçin
                    </Typography>
                    <Grid container spacing={2}>
                      {hobbyPosts.map((post) => {
                        const firstImg = getFirstImageSrc(post.content);
                        const summary = getSummary(removeFirstImgTag(post.content));
                        const isLiked = post.likes && currentUser && post.likes.includes(currentUser.uid);
                        const isBookmarked = post.bookmarks && currentUser && post.bookmarks.includes(currentUser.uid);
                        return (
                          <Grid item xs={12} key={post.id}>
                            <FeedCard onClick={() => navigate(`/post/${post.id}`)}>
                              <FeedCardContent>
                                <FeedCardMeta>
                                  <Avatar src={post.authorAvatar || 'https://ui-avatars.com/api/?name=Anonim'} sx={{ width: 32, height: 32, fontSize: 18, mr: 1 }}>
                                    {post.authorName ? post.authorName[0] : '?'}
                                  </Avatar>
                                  <span>{post.authorName || 'Anonim'}</span>
                                  <span>{post.createdAt ? new Date(post.createdAt).toLocaleDateString('tr-TR') : ''}</span>
                                </FeedCardMeta>
                                <FeedCardTitle>{stripHtml(post.title)}</FeedCardTitle>
                                <FeedCardSummary as={Typography} variant="body1" component="div">
                                  {summary}
                                </FeedCardSummary>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 18 }} onClick={e => e.stopPropagation()}>
                                  <IconButton onClick={() => handleLike(post)} color={isLiked ? 'error' : 'default'}>
                                    {isLiked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                                  </IconButton>
                                  <span>{Array.isArray(post.likes) ? post.likes.length : 0}</span>
                                  <IconButton onClick={() => navigate(`/post/${post.id}#comments`)}>
                                    <CommentIcon />
                                  </IconButton>
                                  <span>{typeof post.comments === 'number' ? post.comments : (Array.isArray(post.comments) ? post.comments.length : 0)}</span>
                                  <IconButton onClick={() => handleBookmark(post)} color={isBookmarked ? 'primary' : 'default'}>
                                    {isBookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                                  </IconButton>
                                  <span>{Array.isArray(post.bookmarks) ? post.bookmarks.length : 0}</span>
                                  <IconButton onClick={(e) => { e.stopPropagation(); handleShare(post); }}>
                                    <ShareIcon />
                                  </IconButton>
                                  <IconButton onClick={() => handleCopyLink()}>
                                    <LinkIcon />
                                  </IconButton>
                                </div>
                              </FeedCardContent>
                              {firstImg && (
                                <FeedCardCover src={firstImg} alt="Kapak" />
                              )}
                            </FeedCard>
                          </Grid>
                        );
                      })}
                    </Grid>
                    <Divider sx={{ my: 4 }} />
                  </Box>
                )}
                {/* Diğer gönderiler */}
                <Grid container spacing={2}>
                  {tabPosts.map((post) => {
                    const firstImg = getFirstImageSrc(post.content);
                    const summary = getSummary(removeFirstImgTag(post.content));
                    const isLiked = post.likes && currentUser && post.likes.includes(currentUser.uid);
                    const isBookmarked = post.bookmarks && currentUser && post.bookmarks.includes(currentUser.uid);
                    return (
                      <Grid item xs={12} key={post.id}>
                        <FeedCard onClick={() => navigate(`/post/${post.id}`)}>
                          <FeedCardContent>
                            <FeedCardMeta>
                              <Avatar src={post.authorAvatar || 'https://ui-avatars.com/api/?name=Anonim'} sx={{ width: 32, height: 32, fontSize: 18, mr: 1 }}>
                                {post.authorName ? post.authorName[0] : '?'}
                              </Avatar>
                              <span>{post.authorName || 'Anonim'}</span>
                              <span>{post.createdAt ? new Date(post.createdAt).toLocaleDateString('tr-TR') : ''}</span>
                            </FeedCardMeta>
                            <FeedCardTitle>{stripHtml(post.title)}</FeedCardTitle>
                            <FeedCardSummary as={Typography} variant="body1" component="div">
                              {summary}
                            </FeedCardSummary>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 18 }} onClick={e => e.stopPropagation()}>
                              <IconButton onClick={() => handleLike(post)} color={isLiked ? 'error' : 'default'}>
                                {isLiked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                              </IconButton>
                              <span>{Array.isArray(post.likes) ? post.likes.length : 0}</span>
                              <IconButton onClick={() => navigate(`/post/${post.id}#comments`)}>
                                <CommentIcon />
                              </IconButton>
                              <span>{typeof post.comments === 'number' ? post.comments : (Array.isArray(post.comments) ? post.comments.length : 0)}</span>
                              <IconButton onClick={() => handleBookmark(post)} color={isBookmarked ? 'primary' : 'default'}>
                                {isBookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                              </IconButton>
                              <span>{Array.isArray(post.bookmarks) ? post.bookmarks.length : 0}</span>
                              <IconButton onClick={(e) => { e.stopPropagation(); handleShare(post); }}>
                                <ShareIcon />
                              </IconButton>
                              <IconButton onClick={() => handleCopyLink()}>
                                <LinkIcon />
                              </IconButton>
                            </div>
                          </FeedCardContent>
                          {firstImg && (
                            <FeedCardCover src={firstImg} alt="Kapak" />
                          )}
                        </FeedCard>
                      </Grid>
                    );
                  })}
                </Grid>
              </>
            )}
          </Grid>

          {/* Yan Panel */}
          <Grid item xs={12} md={4}>
            {/* Trend Başlıklar */}
            <Card sx={{ mb: 4 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Trend Başlıklar</Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 3, display: 'block', fontStyle: 'italic' }}>
                  Beğeni, yorum, görüntülenme ve zaman faktörü ile hesaplanan akıllı trend puanlaması
                </Typography>
                {popularPosts.map((post, index) => (
                  <Box key={post.id} sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', mb: 1 }}>
                      <Typography variant="h3" color="primary" sx={{ mr: 2, opacity: 0.5 }}>
                        {index + 1}
                      </Typography>
                      <Typography 
                        variant="subtitle1" 
                        sx={{ fontWeight: 500, cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={() => navigate(`/post/${post.id}`)}
                      >
                        {stripHtml(post.title)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', ml: 5, mb: 1 }}>
                      <FavoriteIcon fontSize="small" color="error" sx={{ mr: 1 }} />
                      <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
                        {Array.isArray(post.likes) ? post.likes.length : (post.likes || 0)}
                      </Typography>
                      <CommentIcon fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
                        {Array.isArray(post.comments) ? post.comments.length : (post.comments || 0)}
                      </Typography>
                      <VisibilityIcon fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
                        {post.views || 0}
                      </Typography>
                      {post.trendScore && (
                        <>
                          <TrendingUpIcon fontSize="small" color="primary" sx={{ mr: 1 }} />
                          <Typography variant="body2" color="primary" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>
                            {post.trendScore.toFixed(1)} puan
                          </Typography>
                        </>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, mb: 1 }}>
                      <Avatar src={post.authorAvatar || 'https://ui-avatars.com/api/?name=Anonim'} sx={{ width: 28, height: 28, fontSize: 15, mr: 1 }}>
                        {post.authorName ? post.authorName[0] : '?'}
                      </Avatar>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 500, mr: 1, cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={() => navigate(`/profile/${post.authorId}`)}
                      >
                        {post.authorName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        @{post.authorUsername}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1, ml: 5 }}>
                      {getSummary(post.content)}
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>

            {/* Önerilen Yazarlar */}
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6">Önerilen Yazarlar</Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 3, display: 'block', fontStyle: 'italic' }}>
                  İlgi alanlarınız, okuma alışkanlıklarınız ve benzer kullanıcıların tercihleri analiz edilerek öneriliyor
                </Typography>
                {currentUser ? (
                  recommendedAuthors.length > 0 ? (
                    recommendedAuthors.map((author) => (
                      <Box key={author.id} sx={{ mb: 3, p: 2, border: '1px solid #f0f0f0', borderRadius: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Box
                            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', flex: 1 }}
                            onClick={() => navigate(`/profile/${author.id}`)}
                          >
                            <Avatar src={author.photoURL || 'https://ui-avatars.com/api/?name=Anonim'} sx={{ width: 40, height: 40, mr: 2 }} />
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{author.displayName}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                @{author.username}
                              </Typography>
                            </Box>
                          </Box>
                          <Button 
                            variant="outlined" 
                            size="small"
                            sx={{ minWidth: 80, height: 32 }}
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (currentUser) {
                                if (followingIds.includes(author.id)) {
                                  await unfollowUser(currentUser.uid, author.id);
                                  setFollowingIds(followingIds.filter(id => id !== author.id));
                                } else {
                                  await followUser(currentUser.uid, author.id);
                                  setFollowingIds([...followingIds, author.id]);
                                }
                              } else {
                                navigate('/login');
                              }
                            }}
                          >
                            {followingIds.includes(author.id) ? 'Takipte' : 'Takip Et'}
                          </Button>
                        </Box>
                        
                        {/* Yazar istatistikleri */}
                        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="caption" color="text.secondary">
                              {author.posts.length} gönderi
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <FavoriteIcon fontSize="small" color="error" sx={{ mr: 0.5 }} />
                            <Typography variant="caption" color="text.secondary">
                              {author.avgEngagement} ort. etkileşim
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <TrendingUpIcon fontSize="small" color="primary" sx={{ mr: 0.5 }} />
                            <Typography variant="caption" color="primary" sx={{ fontWeight: 'bold' }}>
                              {author.score} puan
                            </Typography>
                          </Box>
                        </Box>
                        
                        {/* Kategoriler */}
                        {author.categoriesArray && author.categoriesArray.length > 0 && (
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {author.categoriesArray.slice(0, 3).map((category) => (
                              <Chip 
                                key={category}
                                label={category} 
                                size="small" 
                                variant="outlined"
                                sx={{ fontSize: '0.7rem', height: 20 }}
                              />
                            ))}
                          </Box>
                        )}
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                      Henüz yeterli veri yok. Daha fazla gönderi beğenip takip ederek kişiselleştirilmiş öneriler alabilirsiniz.
                    </Typography>
                  )
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    Kişiselleştirilmiş yazar önerileri için giriş yapın.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
      {/* Share Modal */}
      <Dialog open={shareOpen} onClose={() => setShareOpen(false)}>
        <DialogTitle>Bağlantıyı Paylaş</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <TextField value={shareUrl} fullWidth InputProps={{ readOnly: true }} size="small" sx={{ mr: 1 }} />
            <Button onClick={handleCopyLink} variant="outlined">Kopyala</Button>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 1 }}>
            <Button color="primary" variant="contained" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareUrl)}`, '_blank')}>WhatsApp</Button>
            <Button color="primary" variant="contained" onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(sharePost?.title || '')}`, '_blank')}>Twitter</Button>
            <Button color="primary" variant="contained" onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank')}>Facebook</Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareOpen(false)}>Kapat</Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={snackbarOpen} autoHideDuration={2000} onClose={() => setSnackbarOpen(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <MuiAlert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
          Bağlantı kopyalandı!
        </MuiAlert>
      </Snackbar>
    </Box>
  );
};

export default Home;