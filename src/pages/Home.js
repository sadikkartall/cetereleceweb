import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
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
} from '@mui/material';
import {
  Search as SearchIcon,
  Favorite as FavoriteIcon,
  Comment as CommentIcon,
  Share as ShareIcon,
  Bookmark as BookmarkIcon,
  TrendingUp as TrendingUpIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Add,
} from '@mui/icons-material';

// Örnek gönderi verisi
const samplePosts = [
  {
    id: 1,
    title: 'React Hooks ile Modern Web Geliştirme',
    content: 'React Hooks, fonksiyonel bileşenlerde state yönetimini ve yaşam döngüsü metodlarını kullanmamızı sağlayan güçlü bir özelliktir. Bu yazıda React Hooks\'un temel kullanımını ve best practice\'leri inceleyeceğiz.',
    image: 'https://source.unsplash.com/random/1200x600?coding',
    author: 'Ahmet Yılmaz',
    authorAvatar: 'https://source.unsplash.com/random/40x40?portrait',
    date: '15 Mart 2024',
    likes: 245,
    comments: 56,
    category: 'React',
    readTime: '5 dk',
  },
  {
    id: 2,
    title: 'Modern JavaScript ve ES6+ Özellikleri',
    content: 'JavaScript\'in modern özellikleri ile daha temiz ve etkili kod yazmanın yollarını keşfedin. Arrow functions, destructuring, async/await ve daha fazlası...',
    image: 'https://source.unsplash.com/random/1200x600?javascript',
    author: 'Mehmet Demir',
    authorAvatar: 'https://source.unsplash.com/random/40x40?man',
    date: '14 Mart 2024',
    likes: 189,
    comments: 34,
    category: 'JavaScript',
    readTime: '7 dk',
  },
];

const Home = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { mode } = useTheme();
  const isDark = mode === 'dark';
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [tabValue, setTabValue] = useState(0);

  // Kategoriler
  const categories = ['all', 'React', 'JavaScript', 'CSS', 'Web Development', 'Node.js', 'Python'];

  // Gönderileri filtreleme
  const filteredPosts = samplePosts.filter((post) => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Popüler gönderiler
  const popularPosts = [...samplePosts].sort((a, b) => b.likes - a.likes).slice(0, 3);

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
            background: isDark 
              ? 'linear-gradient(45deg, #BB86FC 30%, #03DAC6 90%)'
              : 'linear-gradient(45deg, #5a01d5 30%, #00bfad 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: isDark 
              ? '0 0 30px rgba(187, 134, 252, 0.3)'
              : '0 0 20px rgba(90, 1, 213, 0.25)',
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
                placeholder="Gönderilerde ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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

            {filteredPosts.map((post) => (
              <Card key={post.id} sx={{ mb: 4 }}>
                <CardMedia
                  component="img"
                  height="300"
                  image={post.image}
                  alt={post.title}
                  sx={{
                    objectFit: 'cover',
                  }}
                />
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Chip
                      label={post.category}
                      color="primary"
                      size="small"
                      sx={{ mr: 2 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {post.readTime} okuma
                    </Typography>
                  </Box>
                  
                  <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                    {post.title}
                  </Typography>
                  
                  <Typography variant="body1" color="text.secondary" paragraph>
                    {post.content}
                  </Typography>

                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Avatar src={post.authorAvatar} sx={{ mr: 2 }} />
                    <Box>
                      <Typography variant="subtitle2">{post.author}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {post.date}
                      </Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <IconButton color="primary">
                        <FavoriteIcon />
                      </IconButton>
                      <Typography variant="body2" sx={{ mt: 1 }}>{post.likes}</Typography>
                      <IconButton>
                        <CommentIcon />
                      </IconButton>
                      <Typography variant="body2" sx={{ mt: 1 }}>{post.comments}</Typography>
                    </Box>
                    <Box>
                      <IconButton>
                        <BookmarkIcon />
                      </IconButton>
                      <IconButton>
                        <ShareIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
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
                {popularPosts.map((post, index) => (
                  <Box key={post.id} sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', mb: 1 }}>
                      <Typography variant="h3" color="primary" sx={{ mr: 2, opacity: 0.5 }}>
                        {index + 1}
                      </Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                        {post.title}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', ml: 5 }}>
                      <FavoriteIcon fontSize="small" color="error" sx={{ mr: 1 }} />
                      <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
                        {post.likes}
                      </Typography>
                      <CommentIcon fontSize="small" sx={{ mr: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        {post.comments}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </CardContent>
            </Card>

            {/* Önerilen Yazarlar */}
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Önerilen Yazarlar
                </Typography>
                {samplePosts.map((post) => (
                  <Box key={post.id} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar src={post.authorAvatar} sx={{ mr: 2 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2">{post.author}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {post.category} uzmanı
                      </Typography>
                    </Box>
                    <Button variant="outlined" size="small">
                      Takip Et
                    </Button>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Home; 