import React from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const sections = [
  {
    title: 'Giriş',
    content: `CetereleceNet olarak kullanıcılarımızın gizliliğine büyük önem veriyoruz. Bu gizlilik politikası, kişisel verilerinizin nasıl toplandığını, kullanıldığını ve korunduğunu açıklar.`
  },
  {
    title: 'Toplanan Bilgiler',
    content: (
      <ul>
        <li><b>Kayıt Bilgileri:</b> Ad, e-posta adresi, kullanıcı adı, profil fotoğrafı gibi bilgiler.</li>
        <li><b>Kullanıcı İçeriği:</b> Paylaştığınız gönderiler, yorumlar, hobiler ve ilgi alanları.</li>
        <li><b>Otomatik Toplanan Bilgiler:</b> IP adresi, cihaz bilgisi, tarayıcı türü, kullanım istatistikleri (Google Analytics/Firebase Analytics ile).</li>
      </ul>
    )
  },
  {
    title: 'Bilgilerin Kullanımı',
    content: (
      <ul>
        <li>Hesap oluşturma ve yönetimi</li>
        <li>Kişiselleştirilmiş içerik sunma</li>
        <li>Platformun güvenliğini sağlama</li>
        <li>İstatistiksel analiz ve geliştirme</li>
      </ul>
    )
  },
  {
    title: 'Bilgilerin Paylaşımı',
    content: (
      <ul>
        <li><b>Üçüncü Taraf Servisler:</b> Firebase (barındırma, kimlik doğrulama, veri tabanı, depolama)</li>
        <li>Yasal zorunluluklar haricinde bilgileriniz üçüncü kişilerle paylaşılmaz.</li>
      </ul>
    )
  },
  {
    title: 'Çerezler ve Takip Teknolojileri',
    content: 'Platformumuzda kullanıcı deneyimini geliştirmek için çerezler ve benzeri teknolojiler kullanılır.'
  },
  {
    title: 'Verilerin Saklanması ve Güvenliği',
    content: 'Verileriniz güvenli sunucularda saklanır. Yetkisiz erişime karşı teknik ve idari önlemler alınır.'
  },
  {
    title: 'Kullanıcı Hakları',
    content: (
      <ul>
        <li>Kişisel verilerinize erişme, düzeltme veya silme hakkınız vardır.</li>
        <li>Hesabınızı istediğiniz zaman silebilirsiniz.</li>
      </ul>
    )
  },
  {
    title: 'Değişiklikler',
    content: 'Gizlilik politikamızda değişiklik yapıldığında bu sayfadan duyurulur.'
  },
  {
    title: 'İletişim',
    content: (
      <>
        Sorularınız için: <b>info@ceterelece.net</b>
      </>
    )
  }
];

const PrivacyPolicy = () => {

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
            Gizlilik Politikası
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4, maxWidth: '700px', mx: 'auto' }}>
            Kişisel verilerinizin gizliliği ve güvenliği bizim için önemlidir. Lütfen aşağıdaki politikamızı dikkatlice okuyun.
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

export default PrivacyPolicy; 