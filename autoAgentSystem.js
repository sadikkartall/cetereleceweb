require('dotenv').config();
const cron = require('node-cron');
const axios = require('axios');
const { agentService } = require('./src/services/agentService.js');
const { addDocument, getDocuments, setDocument } = require('./src/firebase/firestore.js');

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
  const user = `"${category}" konusunda kapsamlı bir blog yazısı üret. Çıkışı şu JSON formatında ver:\n{\n  "title": string,\n  "image_prompt": string,\n  "markdown": string\n}\nKurallar:\n- En az 1000 kelime yaz.\n- Markdown başlıkları (##, ###) kullan.\n- Tekrarı azalt, özgün ol.\n- image_prompt bir cümle olsun ve sahneyi net betimlesin.`;

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
    const titleMatch = raw.match(/^##\s*(.+)$/m);
    parsed = {
      title: titleMatch ? titleMatch[1].trim() : `${category} Hakkında`,
      image_prompt: category,
      markdown: raw
    };
  }
  if (!parsed?.title || !parsed?.markdown) throw new Error('Geçersiz blog çıktısı');
  if (!parsed.image_prompt) parsed.image_prompt = category;
  return parsed;
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

async function createAgentBlog(agent) {
  const category = getRandomCategory();
  const structured = await generateBlogPostStructured(category);
  const imageUrl = await getUnsplashImage(structured.image_prompt || category);
  const blogContentWithImage = `![${structured.image_prompt}](${imageUrl})\n\n${structured.markdown}`;
  const blog = {
    title: structured.title,
    category,
    content: blogContentWithImage,
    createdAt: new Date().toISOString(),
    authorId: agent.uid,
    likes: [],
    comments: []
  };
  await addDocument('posts', blog);
  return blog;
}

// Haftada 3 yeni ajan oluştur (her hafta belirli zaman)
cron.schedule('0 9 * * 1', async () => {
  console.log('Haftalık ajan oluşturuluyor...');
  for (let i = 0; i < 3; i++) {
    const agent = await agentService.createAgent();
    console.log('Yeni ajan:', agent.displayName);
  }
});

// Her gün rastgele bir ajan ile blog postu oluştur
cron.schedule('0 12 * * *', async () => {
  const agents = await getDocuments('users');
  const aiAgents = (agents || []).filter(a => a.isAgent);
  if (aiAgents.length === 0) return;
  const agent = aiAgents[Math.floor(Math.random() * aiAgents.length)];
  const blog = await createAgentBlog(agent);
  console.log('Yeni blog:', blog.title, '->', agent.displayName);
});

// Her gün rastgele etkileşim (beğeni, yorum, takip)
cron.schedule('0 15 * * *', async () => {
  const agents = await getDocuments('users');
  const aiAgents = (agents || []).filter(a => a.isAgent);
  const posts = await getDocuments('posts');
  if (aiAgents.length < 2 || (posts || []).length === 0) return;
  const agent = aiAgents[Math.floor(Math.random() * aiAgents.length)];
  const otherAgentCandidates = aiAgents.filter(a => a.uid !== agent.uid);
  if (otherAgentCandidates.length === 0) return;
  const otherAgent = otherAgentCandidates[Math.floor(Math.random() * otherAgentCandidates.length)];
  const post = posts[Math.floor(Math.random() * posts.length)];

  const types = ['like', 'comment', 'follow'];
  const type = types[Math.floor(Math.random() * types.length)];

  if (type === 'like') {
    const likes = Array.isArray(post.likes) ? post.likes : [];
    if (!likes.includes(agent.uid)) {
      await setDocument('posts', post.id, { likes: [...likes, agent.uid] }, { merge: true });
      console.log(agent.displayName, 'bir postu beğendi');
    }
  } else if (type === 'comment') {
    const comments = Array.isArray(post.comments) ? post.comments : [];
    const comment = {
      content: 'Çok faydalı bir yazı, teşekkürler!',
      authorId: agent.uid,
      createdAt: new Date().toISOString()
    };
    await setDocument('posts', post.id, { comments: [...comments, comment] }, { merge: true });
    console.log(agent.displayName, 'bir posta yorum yaptı');
  } else if (type === 'follow') {
    const following = Array.isArray(agent.following) ? agent.following : [];
    const followers = Array.isArray(otherAgent.followers) ? otherAgent.followers : [];
    if (!following.includes(otherAgent.uid)) {
      await setDocument('users', agent.uid, { following: [...following, otherAgent.uid] }, { merge: true });
      await setDocument('users', otherAgent.uid, { followers: [...followers, agent.uid] }, { merge: true });
      console.log(agent.displayName, otherAgent.displayName + ' adlı ajanı takip etti');
    }
  }
});

console.log('AI Agent otomasyon sistemi başlatıldı.'); 