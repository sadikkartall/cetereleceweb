import { addDocument, getDocument, setDocument } from '../firebase/firestore.js';
import { register } from '../firebase/auth.js';
import { faker } from '@faker-js/faker/locale/tr';

class AgentService {
  constructor() {
    this.agents = [];
    this.agentTypes = [
      'tech_enthusiast',
      'lifestyle_blogger',
      'food_critic',
      'travel_writer',
      'book_reviewer',
      'movie_critic',
      'fitness_expert',
      'fashion_blogger'
    ];
  }

  // Yeni bir ajan oluştur
  async createAgent() {
    try {
      const agentType = this.getRandomAgentType();
      const agentData = this.generateAgentData(agentType);
      
      // Firebase Auth'da kullanıcı oluştur
      const userCredential = await register(agentData.email, agentData.password);
      
      // Firestore'da ajan verilerini kaydet
      const agentDoc = {
        ...agentData,
        uid: userCredential.user.uid,
        createdAt: new Date(),
        lastActive: new Date(),
        type: agentType,
        isAgent: true,
        followers: [],
        following: [],
        posts: [],
        likes: [],
        comments: []
      };

      await setDocument('users', userCredential.user.uid, agentDoc);
      
      return agentDoc;
    } catch (error) {
      console.error('Ajan oluşturma hatası:', error);
      throw error;
    }
  }

  // Ajan verilerini oluştur
  generateAgentData(type) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const username = faker.internet.userName({ firstName, lastName });
    
    return {
      displayName: `${firstName} ${lastName}`,
      username: username,
      email: faker.internet.email({ firstName, lastName }),
      password: faker.internet.password(),
      bio: this.generateBio(type),
      photoURL: faker.image.avatar(),
      interests: this.generateInterests(type),
      location: faker.location.city(),
      website: faker.internet.url(),
      socialLinks: {
        twitter: `https://twitter.com/${username}`,
        instagram: `https://instagram.com/${username}`,
        linkedin: `https://linkedin.com/in/${username}`
      }
    };
  }

  // Ajan tipine göre biyografi oluştur
  generateBio(type) {
    const bios = {
      tech_enthusiast: [
        "Teknoloji tutkunu ve yazılım geliştirici. Yapay zeka ve blockchain konularında uzman.",
        "Teknoloji dünyasındaki son gelişmeleri takip eden ve paylaşan bir yazar.",
        "Yazılım mühendisi ve teknoloji blog yazarı. Yeni teknolojileri keşfetmeyi seviyorum."
      ],
      lifestyle_blogger: [
        "Yaşam tarzı ve kişisel gelişim üzerine yazılar yazan bir blogger.",
        "Günlük yaşam, sağlık ve wellness konularında içerik üreten bir yazar.",
        "Modern yaşamın getirdiği zorlukları ve çözümleri paylaşan bir blogger."
      ],
      // Diğer tipler için benzer şekilde devam eder...
    };

    const typeBios = bios[type] || bios.tech_enthusiast;
    return faker.helpers.arrayElement(typeBios);
  }

  // Ajan tipine göre ilgi alanları oluştur
  generateInterests(type) {
    const interests = {
      tech_enthusiast: ['Yapay Zeka', 'Blockchain', 'Yazılım Geliştirme', 'Siber Güvenlik'],
      lifestyle_blogger: ['Sağlıklı Yaşam', 'Kişisel Gelişim', 'Meditasyon', 'Yoga'],
      // Diğer tipler için benzer şekilde devam eder...
    };

    return interests[type] || interests.tech_enthusiast;
  }

  // Rastgele ajan tipi seç
  getRandomAgentType() {
    return faker.helpers.arrayElement(this.agentTypes);
  }

  // Haftalık ajan oluşturma işlemi
  async createWeeklyAgents() {
    try {
      const newAgents = [];
      for (let i = 0; i < 3; i++) {
        const agent = await this.createAgent();
        newAgents.push(agent);
      }
      return newAgents;
    } catch (error) {
      console.error('Haftalık ajan oluşturma hatası:', error);
      throw error;
    }
  }

  // Blog yazısı oluştur
  async createBlogPost(agentId, topic) {
    try {
      // Blog yazısı oluşturma mantığı burada olacak
      // OpenAI veya başka bir AI servisi kullanılabilir
      const post = {
        title: faker.lorem.sentence(),
        content: faker.lorem.paragraphs(5),
        images: [faker.image.url()],
        createdAt: new Date(),
        authorId: agentId,
        likes: [],
        comments: []
      };

      await addDocument('posts', post);
      return post;
    } catch (error) {
      console.error('Blog yazısı oluşturma hatası:', error);
      throw error;
    }
  }

  // Beğeni ve yorum işlemleri
  async interactWithPost(agentId, postId, type) {
    try {
      const delay = type === 'like' ? 3 : 2; // Beğeni için 3 gün, yorum için 2 gün
      const interactionDate = new Date(Date.now() + delay * 24 * 60 * 60 * 1000);

      if (type === 'like') {
        await setDocument('posts', postId, {
          likes: [...(await getDocument('posts', postId)).likes, agentId]
        }, { merge: true });
      } else if (type === 'comment') {
        const comment = {
          content: faker.lorem.paragraph(),
          authorId: agentId,
          createdAt: interactionDate
        };
        await setDocument('posts', postId, {
          comments: [...(await getDocument('posts', postId)).comments, comment]
        }, { merge: true });
      }
    } catch (error) {
      console.error('Etkileşim hatası:', error);
      throw error;
    }
  }
}

export const agentService = new AgentService(); 