import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Avatar,
  Divider
} from '@mui/material';
import {
  Code as CodeIcon,
  School as SchoolIcon,
  Group as GroupIcon,
  EmojiObjects as EmojiObjectsIcon,
  Security as SecurityIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';
import { getCollectionCount } from '../firebase/firestore';

const CATEGORY_LIST = [
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

const About = () => {

  // İstatistikler için state
  const [userCount, setUserCount] = useState(null);
  const [postCount, setPostCount] = useState(null);

  useEffect(() => {
    // Kullanıcı ve gönderi sayısını Firestore'dan çek
    const fetchCounts = async () => {
      try {
        const [users, posts] = await Promise.all([
          getCollectionCount('users'),
          getCollectionCount('posts')
        ]);
        setUserCount(users);
        setPostCount(posts);
      } catch (err) {
        setUserCount('—');
        setPostCount('—');
      }
    };
    fetchCounts();
  }, []);

  const features = [
    {
      icon: <CodeIcon sx={{ fontSize: 40 }} />,
      title: 'Teknoloji Odaklı',
      description: 'Yazılım, donanım, yapay zeka ve daha fazlası hakkında güncel içerikler sunuyoruz.'
    },
    {
      icon: <SchoolIcon sx={{ fontSize: 40 }} />,
      title: 'Öğrenme Platformu',
      description: 'Kullanıcılarımızın bilgi paylaşımı ve öğrenme süreçlerini destekliyoruz.'
    },
    {
      icon: <GroupIcon sx={{ fontSize: 40 }} />,
      title: 'Topluluk',
      description: 'Teknoloji meraklılarından oluşan güçlü bir topluluk oluşturuyoruz.'
    },
    {
      icon: <EmojiObjectsIcon sx={{ fontSize: 40 }} />,
      title: 'Yenilikçi',
      description: 'Sürekli gelişen teknoloji dünyasını yakından takip ediyor ve paylaşıyoruz.'
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 40 }} />,
      title: 'Güvenli',
      description: 'Kullanıcı verilerinin güvenliği ve gizliliği bizim için öncelikli.'
    },
    {
      icon: <SpeedIcon sx={{ fontSize: 40 }} />,
      title: 'Hızlı',
      description: 'Modern altyapımız ile hızlı ve kesintisiz bir deneyim sunuyoruz.'
    }
  ];

  return (
    <Box sx={{ 
      backgroundColor: 'background.default',
      minHeight: '100vh',
      pt: 8,
      pb: 8
    }}>
      <Container maxWidth="lg">
        {/* Hero Section */}
        <Box sx={{ mb: 8, textAlign: 'center' }}>
          <Typography variant="h2" component="h1" gutterBottom sx={{ 
            fontWeight: 700,
            background: '#23272f',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 20px rgba(90, 1, 213, 0.25)',
          }}>
            Hakkımızda
          </Typography>
          <Typography variant="h5" color="text.secondary" sx={{ mb: 4, maxWidth: '800px', mx: 'auto' }}>
            Teknoloji dünyasında bilgi paylaşımını ve öğrenmeyi kolaylaştıran modern bir platform
          </Typography>
        </Box>

        {/* Misyon ve Vizyon */}
        <Grid container spacing={4} sx={{ mb: 8 }}>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%', p: 3 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                Misyonumuz
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Teknoloji meraklılarının bilgi ve deneyimlerini paylaşabilecekleri, 
                öğrenme süreçlerini destekleyecekleri güvenli ve modern bir platform sunmak. 
                Kullanıcılarımızın teknoloji dünyasındaki gelişmeleri yakından takip etmelerini 
                ve bu gelişmelere katkıda bulunmalarını sağlamak.
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%', p: 3 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                Vizyonumuz
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Türkiye'nin ve dünyanın en büyük teknoloji topluluklarından biri olmak. 
                Kullanıcılarımızın ihtiyaçlarına yönelik sürekli gelişen ve yenilenen bir platform 
                sunarak, teknoloji dünyasındaki bilgi paylaşımını daha erişilebilir hale getirmek.
              </Typography>
            </Card>
          </Grid>
        </Grid>

        {/* Özellikler */}
        <Typography variant="h4" gutterBottom sx={{ mb: 4, textAlign: 'center', fontWeight: 600 }}>
          Platformumuzun Özellikleri
        </Typography>
        <Grid container spacing={3} sx={{ mb: 8 }}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card sx={{ height: '100%', p: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                  <Box sx={{ 
                    color: 'primary.main',
                    mb: 2,
                    p: 2,
                    borderRadius: '50%',
                    bgcolor: 'rgba(90, 1, 213, 0.1)'
                  }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* İstatistikler */}
        <Box sx={{ mb: 8 }}>
          <Card sx={{ p: 4 }}>
            <Grid container spacing={4} justifyContent="center">
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" color="primary" sx={{ fontWeight: 700 }}>
                    {userCount !== null ? `${userCount}` : '...'}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Aktif Kullanıcı
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" color="primary" sx={{ fontWeight: 700 }}>
                    {postCount !== null ? `${postCount}` : '...'}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Paylaşılan İçerik
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" color="primary" sx={{ fontWeight: 700 }}>
                    {CATEGORY_LIST.length}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Kategori
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" color="primary" sx={{ fontWeight: 700 }}>
                    24/7
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Destek
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Card>
        </Box>

        {/* İletişim */}
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
            Bizimle İletişime Geçin
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Sorularınız, önerileriniz veya işbirliği talepleriniz için bize ulaşabilirsiniz.
          </Typography>
          <Typography variant="h6" color="primary">
            info@ceterelece.net
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default About; 