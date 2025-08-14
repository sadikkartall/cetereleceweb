require('dotenv').config();
const axios = require('axios');

const CATEGORIES = [
  'Veri Bilimi', 'Siber Güvenlik', 'Donanım', 'Yazılım', 'Yapay Zeka', 'Mobil', 'Web', 'Oyun'
];

function getRandomCategory() {
  return CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
}

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

async function withRetry(fn, { retries = 3, baseDelayMs = 500 } = {}) {
  let attempt = 0;
  let lastError;
  while (attempt < retries) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const status = err?.response?.status;
      const isRetryable = status === 429 || (status >= 500 && status < 600) || !status;
      if (!isRetryable || attempt === retries - 1) break;
      const delay = baseDelayMs * Math.pow(2, attempt) + Math.floor(Math.random() * 200);
      await new Promise(r => setTimeout(r, delay));
      attempt += 1;
    }
  }
  throw lastError;
}

async function generateBlogPostStructured(category) {
  const system = `Sen Türkiye'nin en çok okunan teknoloji blogunun başyazarı ve editörüsün. Türkçe yaz, akıcı ve profesyonel bir üslup kullan.`;
  const user = `"${category}" konusunda kapsamlı bir blog yazısı üret. Çıkışı şu JSON formatında ver:
{
  "title": string,                 // Çarpıcı başlık
  "image_prompt": string,          // Görsel araması için net ve betimleyici cümle
  "markdown": string               // Markdown biçiminde yazı (Giriş, Gelişme, Sonuç, Kaynakça)
}
Kurallar:
- En az 1000 kelime yaz.
- Markdown başlıkları (##, ###) kullan.
- Tekrarı azalt, özgün ol.
- image_prompt bir cümle olsun ve sahneyi net betimlesin.`;

  const payload = {
    model: OPENAI_MODEL,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user }
    ],
    temperature: 0.7,
    max_tokens: 2000
  };

  const response = await withRetry(() => axios.post(OPENAI_API_URL, payload, {
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    timeout: 30000
  }));

  const raw = response.data.choices?.[0]?.message?.content?.trim() || '';
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (_) {
    // Model JSON vermediyse basit bir çıkarım yapmaya çalış
    const titleMatch = raw.match(/^##\s*(.+)$/m);
    parsed = {
      title: titleMatch ? titleMatch[1].trim() : `${category} Hakkında`,
      image_prompt: category,
      markdown: raw
    };
  }

  if (!parsed?.title || !parsed?.markdown) {
    throw new Error('Geçersiz blog çıktısı alındı');
  }
  if (!parsed.image_prompt) parsed.image_prompt = category;
  return parsed;
}

async function getUnsplashImage(query) {
  return await withRetry(async () => {
    const res = await axios.get(
      `https://api.unsplash.com/photos/random`,
      {
        params: {
          query,
          orientation: 'landscape'
        },
        headers: {
          'Accept-Version': 'v1'
        },
        timeout: 15000,
        validateStatus: s => (s >= 200 && s < 300) || s === 404,
      }
    );
    if (res.status === 404 || !res.data?.urls?.regular) {
      return 'https://source.unsplash.com/1200x630/?technology,ai';
    }
    return res.data.urls.regular;
  });
}

async function createAgentBlog() {
  const category = getRandomCategory();
  const structured = await generateBlogPostStructured(category);
  const imageUrl = await getUnsplashImage(structured.image_prompt || category);

  const blogContentWithImage = `![${structured.image_prompt}](${imageUrl})\n\n${structured.markdown}`;

  const blog = {
    title: structured.title,
    category,
    content: blogContentWithImage,
    createdAt: new Date().toISOString()
  };

  console.log(blog);
  return blog;
}

// Test için çalıştır
if (require.main === module) {
  createAgentBlog().catch(err => {
    console.error('createAgentBlog hata:', err?.response?.data || err);
    process.exitCode = 1;
  });
} 