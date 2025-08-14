require('dotenv').config();
const { agentService } = require('./src/services/agentService.js');
const { addDocument } = require('./src/firebase/firestore.js');
const axios = require('axios');

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

async function generateBlogStructured(category) {
  const system = `Sen Türkiye'nin en çok okunan teknoloji blogunun başyazarı ve editörüsün. Türkçe yaz, akıcı ve profesyonel bir üslup kullan.`;
  const user = `"${category}" konusunda kapsamlı bir blog yazısı üret. Çıkışı şu JSON formatında ver:\n{\n  "title": string,\n  "image_prompt": string,\n  "markdown": string\n}\nKurallar:\n- En az 1000 kelime yaz.\n- Markdown başlıkları (##, ###) kullan.\n- Tekrarı azalt, özgün ol.\n- image_prompt bir cümle olsun.`;
  const payload = {
    model: OPENAI_MODEL,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user }
    ],
    temperature: 0.75,
    max_tokens: 2000
  };
  const res = await withRetry(() => axios.post(OPENAI_API_URL, payload, {
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    timeout: 30000
  }));
  const raw = res.data.choices?.[0]?.message?.content?.trim() || '';
  try {
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (_) {
    const titleMatch = raw.match(/^##\s*(.+)$/m);
    return {
      title: titleMatch ? titleMatch[1].trim() : `${category} Hakkında`,
      image_prompt: category,
      markdown: raw
    };
  }
}

async function getUnsplashImage(query) {
  return await withRetry(async () => {
    const res = await axios.get(
      `https://api.unsplash.com/photos/random`,
      {
        params: { query, orientation: 'landscape' },
        headers: { 'Accept-Version': 'v1' },
        timeout: 15000,
        validateStatus: s => (s >= 200 && s < 300) || s === 404
      }
    );
    if (res.status === 404 || !res.data?.urls?.regular) {
      return 'https://source.unsplash.com/1200x630/?technology,ai';
    }
    return res.data.urls.regular;
  });
}

async function testCreateAgentAndBlog() {
  try {
    const agent = await agentService.createAgent();
    console.log('Oluşturulan ajan:', agent.displayName);

    const category = 'Yapay Zeka';
    const structured = await generateBlogStructured(category);

    const imageUrl = await getUnsplashImage(structured.image_prompt || category);

    const blogContent = `![${structured.image_prompt}](${imageUrl})\n\n${structured.markdown}`;

    const blog = {
      title: structured.title,
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
    console.error('Test sırasında hata:', error?.response?.data || error);
  }
}

testCreateAgentAndBlog(); 