require('dotenv').config();
const axios = require('axios');

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_MODEL = 'gpt-3.5-turbo';

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

async function generateDraft(category) {
  const system = `Kıdemli bir teknoloji editörüsün.`;
  const user = `"${category}" konusunda detaylı bir taslak üret. Sıkı JSON formatı kullan:
{"title": string, "image_prompt": string, "outline": [string], "key_points": [string]}
Kurallar: 8-12 maddelik outline, her madde net; image_prompt tek cümle.`;
  const payload = {
    model: OPENAI_MODEL,
    messages: [ { role: 'system', content: system }, { role: 'user', content: user } ],
    temperature: 0.6,
    max_tokens: 800
  };
  const res = await withRetry(() => axios.post(OPENAI_API_URL, payload, {
    headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    timeout: 30000
  }));
  const raw = res.data.choices?.[0]?.message?.content?.trim() || '';
  return JSON.parse(raw);
}

async function humanizeFromDraft(category, draft) {
  const system = `Çok okunan bir teknoloji blogunun insan yazarısın. Sıcak, hikaye anlatan bir üslup kullan; gerçek teknolojiler ve örneklerle konuş.`;
  const user = `Aşağıdaki taslaktan uzun bir makale yaz. Türkçe yaz. JSON ver:
{"title": string, "image_prompt": string, "markdown": string}
Taslak:
${JSON.stringify(draft, null, 2)}
Kurallar:
- En az 1500 kelime.
- Bölümler: ## Başlık (kısa), ### Giriş (hikaye), ### Temel Kavramlar, ### Gerçek Dünya Örnekleri, ### Küçük Kod Parçaları (code fence), ### En İyi Uygulamalar, ### Riskler ve Etik, ### Sonuç, ### Kaynakça (3+ güvenilir kaynak).
- Somut ürün/teknoloji adları (Azure OpenAI, TensorFlow, ONNX, Docker, Redis, gRPC vb.)
- Klişe cümlelerden kaçın; veri, tarih ve sayılarla destekle.`;
  const payload = {
    model: OPENAI_MODEL,
    messages: [ { role: 'system', content: system }, { role: 'user', content: user } ],
    temperature: 0.8,
    max_tokens: 3500
  };
  const res = await withRetry(() => axios.post(OPENAI_API_URL, payload, {
    headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    timeout: 45000
  }));
  const raw = res.data.choices?.[0]?.message?.content?.trim() || '';
  return JSON.parse(raw);
}

async function generateBlogStructured(category) {
  console.log('Blog üretimi başlıyor (iki aşamalı)...');
  const draft = await generateDraft(category);
  try {
    const final = await humanizeFromDraft(category, draft);
    return final;
  } catch (e) {
    // İnsanileştirme başarısızsa tek aşamalı üretime geri dön
    const fallback = {
      title: draft.title || `${category} Hakkında`,
      image_prompt: draft.image_prompt || category,
      markdown: `## ${draft.title || category}\n\n### Giriş\n${(draft.key_points||[]).slice(0,3).join(' ')}\n\n### Başlıklar\n${(draft.outline||[]).map(h=>`- ${h}`).join('\n')}`
    };
    return fallback;
  }
}

async function getUnsplashImage(query) {
  console.log('Görsel alma başlıyor...');
  const fallback = 'https://source.unsplash.com/1200x630/?technology,ai';
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    console.log('Unsplash anahtarı yok, fallback kullanılıyor');
    return fallback;
  }
  return await withRetry(async () => {
    const res = await axios.get(
      `https://api.unsplash.com/photos/random`,
      {
        params: { query, orientation: 'landscape', client_id: accessKey },
        headers: { 'Accept-Version': 'v1' },
        timeout: 15000,
        validateStatus: s => (s >= 200 && s < 300) || s === 404
      }
    );
    if (res.status === 404 || !res.data?.urls?.regular) {
      return fallback;
    }
    return res.data.urls.regular;
  });
}

async function testCreateAgentAndBlog() {
  try {
    console.log('Test başlıyor...');
    console.log('ESM modülleri yükleniyor...');
    const { agentService } = await import('./src/services/agentService.js');
    const { addDocument } = await import('./src/firebase/firestore.js');
    console.log('Modüller yüklendi');

    const agent = await agentService.createAgent();
    console.log('Oluşturulan ajan:', agent.displayName);

    const category = 'Yapay Zeka';
    console.log('Blog kategorisi:', category);
    const structured = await generateBlogStructured(category);
    console.log('Blog yapısı oluşturuldu:', structured.title);

    console.log('Görsel alınıyor...');
    const imageUrl = await getUnsplashImage(structured.image_prompt || category);
    console.log('Görsel URL alındı:', imageUrl);

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
    console.log('Blog objesi oluşturuldu, Firestore\'a yazılıyor...');
    await addDocument('posts', blog);
    console.log('Blog yazısı oluşturuldu ve paylaşıldı!');
  } catch (error) {
    console.error('Test sırasında hata:', error?.response?.data || error);
    console.error('Hata stack:', error?.stack);
  }
}

testCreateAgentAndBlog(); 