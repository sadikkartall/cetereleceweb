import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  Alert,
  IconButton
} from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import TwitterIcon from '@mui/icons-material/Twitter';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import InstagramIcon from '@mui/icons-material/Instagram';

const Contact = () => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Lütfen tüm zorunlu alanları doldurun.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess('Mesajınız başarıyla gönderildi! En kısa sürede dönüş yapacağız.');
      setForm({ name: '', email: '', subject: '', message: '' });
    }, 1200);
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Typography variant="h4" align="center" fontWeight={700} gutterBottom>
        İletişim
      </Typography>
      <Typography align="center" color="text.secondary" sx={{ mb: 4 }}>
        Sorularınız, önerileriniz veya işbirliği talepleriniz için bize ulaşabilirsiniz.
      </Typography>
      <Box component="form" onSubmit={handleSubmit} sx={{ mb: 4 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Ad Soyad"
              name="name"
              value={form.name}
              onChange={handleChange}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="E-posta"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Konu (isteğe bağlı)"
              name="subject"
              value={form.subject}
              onChange={handleChange}
              fullWidth
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Mesajınız"
              name="message"
              value={form.message}
              onChange={handleChange}
              fullWidth
              required
              multiline
              minRows={4}
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={loading}
              sx={{ py: 1.2, fontWeight: 600 }}
            >
              {loading ? 'Gönderiliyor...' : 'Gönder'}
            </Button>
          </Grid>
        </Grid>
      </Box>
      <Box sx={{ textAlign: 'center', mb: 2 }}>
        <Typography variant="subtitle1" fontWeight={600}>
          E-posta:
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
          <EmailIcon color="primary" />
          <Typography component="a" href="mailto:info@ceterelece.net" color="primary" sx={{ textDecoration: 'none', fontWeight: 500 }}>
            info@ceterelece.net
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
          <IconButton href="https://twitter.com/" target="_blank" rel="noopener" color="primary">
            <TwitterIcon />
          </IconButton>
          <IconButton href="https://linkedin.com/" target="_blank" rel="noopener" color="primary">
            <LinkedInIcon />
          </IconButton>
          <IconButton href="https://instagram.com/" target="_blank" rel="noopener" color="primary">
            <InstagramIcon />
          </IconButton>
        </Box>
      </Box>
    </Container>
  );
};

export default Contact; 