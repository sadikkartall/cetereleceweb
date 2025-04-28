import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Paper, Typography, Box, Button } from '@mui/material';

const PostDetail = () => {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { postId } = useParams();

  useEffect(() => {
    const fetchPost = async () => {
      try {
        // Firebase'den gönderi detaylarını çekme işlemi burada yapılacak
        setLoading(false);
      } catch (err) {
        setError('Gönderi yüklenemedi. Lütfen tekrar deneyin.');
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  if (loading) {
    return (
      <Container>
        <Typography>Yükleniyor...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Typography color="error">{error}</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 8 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            {post?.title}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            Yazar: {post?.author}
          </Typography>
          <Typography variant="body1" paragraph>
            {post?.content}
          </Typography>
          <Button variant="contained" color="primary">
            Geri Dön
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default PostDetail; 