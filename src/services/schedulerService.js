import { agentService } from './agentService';
import { getDocuments } from '../firebase/firestore';

class SchedulerService {
  constructor() {
    this.schedules = new Map();
  }

  // Haftalık ajan oluşturma zamanlayıcısı
  scheduleWeeklyAgentCreation() {
    // Her hafta 3 farklı rastgele gün ve saatte çalışacak
    const schedule = {
      type: 'weekly',
      times: Array.from({ length: 3 }, () => ({
        day: Math.floor(Math.random() * 7), // 0-6 arası (Pazar-Cumartesi)
        hour: Math.floor(Math.random() * 24), // 0-23 arası
        minute: Math.floor(Math.random() * 60) // 0-59 arası
      }))
    };

    this.schedules.set('weeklyAgents', schedule);
    this.startScheduler();
  }

  // Blog yazısı oluşturma zamanlayıcısı
  scheduleBlogPostCreation() {
    // Her gün rastgele bir saatte çalışacak
    const schedule = {
      type: 'daily',
      hour: Math.floor(Math.random() * 24),
      minute: Math.floor(Math.random() * 60)
    };

    this.schedules.set('blogPosts', schedule);
    this.startScheduler();
  }

  // Etkileşim zamanlayıcısı
  scheduleInteractions() {
    // Her gün rastgele saatlerde çalışacak
    const schedule = {
      type: 'daily',
      times: Array.from({ length: 5 }, () => ({
        hour: Math.floor(Math.random() * 24),
        minute: Math.floor(Math.random() * 60)
      }))
    };

    this.schedules.set('interactions', schedule);
    this.startScheduler();
  }

  // Zamanlayıcıyı başlat
  startScheduler() {
    setInterval(async () => {
      const now = new Date();
      
      // Haftalık ajan oluşturma kontrolü
      const weeklySchedule = this.schedules.get('weeklyAgents');
      if (weeklySchedule) {
        const shouldCreateAgent = weeklySchedule.times.some(time => 
          now.getDay() === time.day && 
          now.getHours() === time.hour && 
          now.getMinutes() === time.minute
        );
        
        if (shouldCreateAgent) {
          await this.createSingleAgent();
        }
      }

      // Blog yazısı oluşturma kontrolü
      const blogSchedule = this.schedules.get('blogPosts');
      if (blogSchedule && 
          now.getHours() === blogSchedule.hour && 
          now.getMinutes() === blogSchedule.minute) {
        await this.createBlogPosts();
      }

      // Etkileşim kontrolü
      const interactionSchedule = this.schedules.get('interactions');
      if (interactionSchedule) {
        const shouldInteract = interactionSchedule.times.some(time => 
          now.getHours() === time.hour && now.getMinutes() === time.minute
        );
        if (shouldInteract) {
          await this.createInteractions();
        }
      }
    }, 60000); // Her dakika kontrol et
  }

  // Tek bir ajan oluştur
  async createSingleAgent() {
    try {
      const agent = await agentService.createAgent();
      console.log('Yeni ajan oluşturuldu:', agent);
    } catch (error) {
      console.error('Ajan oluşturma hatası:', error);
    }
  }

  // Blog yazıları oluştur
  async createBlogPosts() {
    try {
      const agents = await getDocuments('users', { isAgent: true });
      const activeAgents = agents.filter(agent => Math.random() > 0.3); // %70 olasılıkla blog yazacak

      for (const agent of activeAgents) {
        await agentService.createBlogPost(agent.uid, agent.interests[0]);
      }
    } catch (error) {
      console.error('Blog yazısı oluşturma hatası:', error);
    }
  }

  // Etkileşimler oluştur
  async createInteractions() {
    try {
      const agents = await getDocuments('users', { isAgent: true });
      const posts = await getDocuments('posts', { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } });

      for (const agent of agents) {
        const randomPosts = posts.sort(() => 0.5 - Math.random()).slice(0, 3);
        
        for (const post of randomPosts) {
          if (post.authorId !== agent.uid) {
            if (Math.random() > 0.5) {
              await agentService.interactWithPost(agent.uid, post.id, 'like');
            }
            if (Math.random() > 0.7) {
              await agentService.interactWithPost(agent.uid, post.id, 'comment');
            }
          }
        }
      }
    } catch (error) {
      console.error('Etkileşim oluşturma hatası:', error);
    }
  }
}

export const schedulerService = new SchedulerService(); 