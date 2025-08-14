require('dotenv').config();
const cron = require('node-cron');
const axios = require('axios');
const { agentService } = require('./src/services/agentService.js');
const { addDocument, getDocuments, getDocument } = require('./src/firebase/firestore.js');

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

async function createAgentBlog(agent) {
  const category = getRandomCategory();
  const blogText = await generateBlogPost(category);
  const imageUrl = await getUnsplashImage(category);
  const blogContentWithImage = `![${category} görseli](${imageUrl})\n\n${blogText}`;
  const blog = {
    title: `${category} Hakkında`,
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

// Haftada 3 yeni ajan oluştur (her hafta rastgele gün/saat)
cron.schedule('0 9 * * 1', async () => { // Pazartesi 09:00
  console.log('Haftalık ajan oluşturuluyor...');
  for (let i = 0; i < 3; i++) {
    const agent = await agentService.createAgent();
    console.log('Yeni ajan:', agent.displayName);
  }
});

// Her gün rastgele bir ajan ile blog postu oluştur
cron.schedule('0 12 * * *', async () => { // Her gün 12:00
  const agents = await getDocuments('users');
  const aiAgents = agents.filter(a => a.isAgent);
  if (aiAgents.length === 0) return;
  const agent = aiAgents[Math.floor(Math.random() * aiAgents.length)];
  const blog = await createAgentBlog(agent);
  console.log('Yeni blog:', blog.title, '->', agent.displayName);
});

// Her gün rastgele etkileşim (beğeni, yorum, takip)
cron.schedule('0 15 * * *', async () => { // Her gün 15:00
  const agents = await getDocuments('users');
  const aiAgents = agents.filter(a => a.isAgent);
  const posts = await getDocuments('posts');
  if (aiAgents.length < 2 || posts.length === 0) return;
  // Rastgele iki ajan ve bir post seç
  const agent = aiAgents[Math.floor(Math.random() * aiAgents.length)];
  const otherAgent = aiAgents.filter(a => a.uid !== agent.uid)[Math.floor(Math.random() * (aiAgents.length - 1))];
  const post = posts[Math.floor(Math.random() * posts.length)];
  // Rastgele etkileşim türü
  const types = ['like', 'comment', 'follow'];
  const type = types[Math.floor(Math.random() * types.length)];
  if (type === 'like') {
    if (!post.likes.includes(agent.uid)) {
      post.likes.push(agent.uid);
      await addDocument('posts', { ...post, id: post.id });
      console.log(agent.displayName, 'bir postu beğendi');
    }
  } else if (type === 'comment') {
    const comment = {
      content: 'Çok faydalı bir yazı, teşekkürler!',
      authorId: agent.uid,
      createdAt: new Date().toISOString()
    };
    post.comments.push(comment);
    await addDocument('posts', { ...post, id: post.id });
    console.log(agent.displayName, 'bir posta yorum yaptı');
  } else if (type === 'follow') {
    if (!agent.following.includes(otherAgent.uid)) {
      agent.following.push(otherAgent.uid);
      otherAgent.followers.push(agent.uid);
      await addDocument('users', { ...agent, id: agent.uid });
      await addDocument('users', { ...otherAgent, id: otherAgent.uid });
      console.log(agent.displayName, otherAgent.displayName + ' adlı ajanı takip etti');
    }
  }
});

console.log('AI Agent otomasyon sistemi başlatıldı.'); 