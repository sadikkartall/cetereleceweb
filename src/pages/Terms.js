import React from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const sections = [
  {
    title: 'Giriş',
    content: `CetereleceNet'e hoş geldiniz! Bu kullanım koşulları, platformumuzu kullanırken uymanız gereken kuralları ve haklarınızı açıklar.`
  },
  {
    title: 'Hesap Oluşturma ve Güvenlik',
    content: (
      <ul>
        <li>Hesap oluştururken doğru ve güncel bilgiler vermelisiniz.</li>
        <li>Hesabınızın güvenliğinden siz sorumlusunuz.</li>
        <li>Hesabınızın izinsiz kullanıldığını fark ederseniz hemen bize bildirin.</li>
      </ul>
    )
  },
  {
    title: 'İçerik Paylaşımı',
    content: (
      <ul>
        <li>Paylaştığınız içeriklerden siz sorumlusunuz.</li>
        <li>Yasa dışı, zararlı, tehdit edici, hakaret içeren veya telif hakkı ihlali yapan içerikler paylaşmak yasaktır.</li>
        <li>Platformda paylaşılan içerikler, topluluk kurallarına ve yasalara uygun olmalıdır.</li>
      </ul>
    )
  },
  {
    title: 'Fikri Mülkiyet',
    content: (
      <ul>
        <li>Platformdaki tüm marka, logo ve içeriklerin hakları saklıdır.</li>
        <li>Kullanıcılar, başkalarına ait içerikleri izinsiz paylaşamaz.</li>
      </ul>
    )
  },
  {
    title: 'Platformun Kullanımı',
    content: (
      <ul>
        <li>Platformu yasalara ve topluluk kurallarına uygun şekilde kullanmalısınız.</li>
        <li>Platformun işleyişini bozacak, zarar verecek veya kötüye kullanacak eylemler yasaktır.</li>
      </ul>
    )
  },
  {
    title: 'Hesabın Sonlandırılması',
    content: (
      <ul>
        <li>Kurallara aykırı davranışlarda bulunan kullanıcıların hesapları askıya alınabilir veya silinebilir.</li>
      </ul>
    )
  },
  {
    title: 'Sorumluluk Reddi',
    content: (
      <ul>
        <li>Platformda paylaşılan içeriklerden kullanıcılar sorumludur.</li>
        <li>CetereleceNet, kullanıcılar tarafından paylaşılan içeriklerin doğruluğunu garanti etmez.</li>
      </ul>
    )
  },
  {
    title: 'Değişiklikler',
    content: 'Kullanım koşullarında değişiklik yapma hakkımız saklıdır. Değişiklikler bu sayfada yayınlanır.'
  },
  {
    title: 'İletişim',
    content: (
      <>Sorularınız için: <b>info@ceterelece.net</b></>
    )
  }
];

const Terms = () => {

  return (
    <Box sx={{ backgroundColor: 'background.default', minHeight: '100vh', pt: 8, pb: 8 }}>
      <Container maxWidth="md">
        <Box sx={{ mb: 6, textAlign: 'center' }}>
          <Typography variant="h2" component="h1" gutterBottom sx={{
            fontWeight: 700,
            background: '#23272f',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 20px rgba(90, 1, 213, 0.25)',
          }}>
            Kullanım Koşulları
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4, maxWidth: '700px', mx: 'auto' }}>
            Platformumuzu kullanmadan önce lütfen aşağıdaki koşulları dikkatlice okuyun.
          </Typography>
        </Box>
        <Card sx={{ p: { xs: 2, sm: 4 } }}>
          {sections.map((section, idx) => (
            <Accordion key={section.title} defaultExpanded={idx === 0}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>{section.title}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body1" color="text.secondary">
                  {section.content}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Card>
      </Container>
    </Box>
  );
};

export default Terms; 