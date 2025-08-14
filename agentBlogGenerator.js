require('dotenv').config();
const axios = require('axios');

const CATEGORIES = [
  'Veri Bilimi', 'Siber Güvenlik', 'Donanım', 'Yazılım', 'Yapay Zeka', 'Mobil', 'Web', 'Oyun'
];

function getRandomCategory() {
  return CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
}

async function generateBlogPost(category) {
  const prompt = `Bir teknoloji blogunda yayınlanacak şekilde, "${category}" hakkında profesyonel, detaylı ve özgün bir Türkçe blog yazısı yaz. Giriş, gelişme ve sonuç bölümleri olsun. Yazının başında uygun bir görsel için açıklama da ekle.`;

  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 800
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return response.data.choices[0].message.content.trim();
}

async function getUnsplashImage(category) {
  const response = await axios.get(
    `https://api.unsplash.com/photos/random?query=${encodeURIComponent(category)}&orientation=landscape&client_id=${process.env.UNSPLASH_ACCESS_KEY}`
  );
  return response.data.urls.regular;
}

async function createAgentBlog() {
  const category = getRandomCategory();
  const blogText = await generateBlogPost(category);
  const imageUrl = await getUnsplashImage(category);

  // Görseli blog yazısının başına ekle (Markdown formatında)
  const blogContentWithImage = `![${category} görseli](${imageUrl})\n\n${blogText}`;

  const blog = {
    title: `${category} Hakkında`,
    category,
    content: blogContentWithImage,
    createdAt: new Date().toISOString()
  };

  console.log(blog);
  return blog;
}

// Test için çalıştır
if (require.main === module) {
  createAgentBlog();
} 