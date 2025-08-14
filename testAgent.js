require('dotenv').config();
const { agentService } = require('./src/services/agentService.js');
const { addDocument } = require('./src/firebase/firestore.js');
const axios = require('axios');

async function testCreateAgentAndBlog() {
  try {
    // 1. Yeni ajan oluştur
    const agent = await agentService.createAgent();
    console.log('Oluşturulan ajan:', agent);

    // 2. Blog başlığı ve kategori
    const category = 'Yapay Zeka';

    // 3. Gelişmiş prompt
    const prompt = `
Sen, Türkiye'nin en çok okunan teknoloji blogunun başyazarısın. Aşağıdaki kurallara göre, insan gibi, akıcı, özgün ve profesyonel bir Türkçe blog yazısı üret:
- Konu: "${category}"
- Yazının başında, blog yazısına uygun, gerçekçi ve ilgi çekici bir görsel için 1 cümlelik açıklama üret (ör: "Bir laboratuvarda insanlarla iş birliği yapan gelişmiş bir yapay zeka robotu").
- Sonra, aşağıdaki bölümleri oluştur:
  - ## Başlık: (Çarpıcı ve özgün bir başlık)
  - ### Giriş: (Konuya ilgi çekici bir giriş, güncel gelişmelerden bahset)
  - ### Gelişme: (Detaylı teknik açıklamalar, gerçek hayattan örnekler, istatistikler, güncel haberler, avantajlar/dezavantajlar, etik tartışmalar, sektörlere etkisi)
  - ### Sonuç: (Geleceğe dair öngörüler, kişisel yorum, kapanış)
  - ### Kaynakça: (En az 2 gerçek kaynak veya ek okuma önerisi)
- Her bölüm için uygun başlıklar kullan.
- Görsel açıklamasını ayrı bir satırda "**Görsel Açıklaması:**" ile başlat.
- Blog yazısını markdown formatında üret (## Başlık, ### Giriş, ...).
- Minimum 1000 kelime yaz.
- Yazı tamamen özgün, tekrar etmeyen, insan gibi ve bilgi dolu olsun.
`;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.85,
        max_tokens: 2048
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    const fullText = response.data.choices[0].message.content.trim();

    // Görsel açıklamasını ve blog metnini ayır
    const match = fullText.match(/\*\*Görsel Açıklaması:\*\*\s*(.+)\n([\s\S]*)/);
    let imageDescription = 'yapay zeka';
    let blogText = fullText;
    if (match) {
      imageDescription = match[1].trim();
      blogText = match[2].trim();
    }

    // Unsplash'tan alakalı görsel çek
    let imageUrl = '';
    try {
      const unsplashRes = await axios.get(
        `https://api.unsplash.com/photos/random?query=${encodeURIComponent(imageDescription)}&orientation=landscape&client_id=${process.env.UNSPLASH_ACCESS_KEY}`
      );
      imageUrl = unsplashRes.data.urls.regular;
    } catch (imgErr) {
      imageUrl = 'https://source.unsplash.com/800x400/?ai,technology';
    }

    // Blog içeriğine markdown görseli ekle
    const blogContent = `![${imageDescription}](${imageUrl})\n\n${blogText}`;

    // Başlığı markdown'dan çek (## ile başlayan ilk satır)
    let title = `${category} Hakkında`;
    const titleMatch = blogText.match(/^##\s*(.+)$/m);
    if (titleMatch) title = titleMatch[1].trim();

    const blog = {
      title,
      category,
      content: blogContent,
      createdAt: new Date().toISOString(),
      authorId: agent.uid,
      likes: [],
      comments: []
    };
    await addDocument('posts', blog);
    console.log('Blog yazısı oluşturuldu ve paylaşıldı!');
  } catch (error) {
    console.error('Test sırasında hata:', error);
  }
}

testCreateAgentAndBlog(); 