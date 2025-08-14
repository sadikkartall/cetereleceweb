import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Kullanıcı arama
 * @param {string} searchTerm - Arama terimi
 * @returns {Promise<Array>} - Bulunan kullanıcılar
 */
export const searchUsers = async (searchTerm) => {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    const users = [];
    snapshot.forEach(doc => {
      const userData = doc.data();
      const searchLower = searchTerm.toLowerCase();
      
      if (
        userData.displayName?.toLowerCase().includes(searchLower) ||
        userData.username?.toLowerCase().includes(searchLower) ||
        userData.email?.toLowerCase().includes(searchLower)
      ) {
        users.push({
          id: doc.id,
          ...userData
        });
      }
    });
    
    return users.slice(0, 5); // İlk 5 sonucu döndür
  } catch (error) {
    console.error('Kullanıcı arama hatası:', error);
    return [];
  }
};

/**
 * Akıllı yazar önerisi algoritması
 * @param {string} currentUserId - Mevcut kullanıcı ID'si
 * @param {object} userData - Kullanıcı verisi
 * @param {Array} allPosts - Tüm gönderiler
 * @param {Array} followingIds - Takip edilen kullanıcı ID'leri
 * @param {number} limitCount - Kaç öneri döndürüleceği
 * @returns {Promise<Array>} - Önerilen yazarlar
 */
export const getRecommendedAuthors = async (currentUserId, userData, allPosts, followingIds = [], limitCount = 5) => {
  try {
    if (!currentUserId) return [];

    // Tüm yazarları topla
    const authors = new Map();
    
    allPosts.forEach(post => {
      if (post.authorId && post.authorId !== currentUserId && !followingIds.includes(post.authorId)) {
        if (!authors.has(post.authorId)) {
          authors.set(post.authorId, {
            id: post.authorId,
            displayName: post.authorName,
            username: post.authorUsername,
            photoURL: post.authorAvatar,
            posts: [],
            totalLikes: 0,
            totalComments: 0,
            totalViews: 0,
            categories: new Set(),
            lastPostDate: null,
            score: 0
          });
        }
        
        const author = authors.get(post.authorId);
        author.posts.push(post);
        
        // İstatistikleri hesapla
        const likes = Array.isArray(post.likes) ? post.likes.length : (post.likes || 0);
        const comments = Array.isArray(post.comments) ? post.comments.length : (post.comments || 0);
        const views = post.views || 0;
        
        author.totalLikes += likes;
        author.totalComments += comments;
        author.totalViews += views;
        
        if (post.category) {
          author.categories.add(post.category);
        }
        
        // En son post tarihi
        const postDate = post.createdAt instanceof Date ? post.createdAt : new Date(post.createdAt);
        if (!author.lastPostDate || postDate > author.lastPostDate) {
          author.lastPostDate = postDate;
        }
      }
    });

    // Her yazar için öneri puanı hesapla
    const recommendedAuthors = Array.from(authors.values()).map(author => {
      let score = 0;
      
      // 1. İçerik kalitesi puanı (beğeni, yorum, görüntülenme)
      const avgLikes = author.totalLikes / author.posts.length;
      const avgComments = author.totalComments / author.posts.length;
      const avgViews = author.totalViews / author.posts.length;
      const engagementScore = (avgLikes * 2) + (avgComments * 3) + (avgViews * 0.1);
      score += engagementScore * 10;
      
      // 2. Aktiflik puanı (son gönderi ne kadar yakın)
      if (author.lastPostDate) {
        const daysSinceLastPost = (new Date() - author.lastPostDate) / (1000 * 60 * 60 * 24);
        const activityScore = Math.max(0, 30 - daysSinceLastPost) / 30; // Son 30 gün içinde bonus
        score += activityScore * 50;
      }
      
      // 3. Üretkenlik puanı (gönderi sayısı)
      const productivityScore = Math.min(author.posts.length, 10) * 5; // Max 10 post için bonus
      score += productivityScore;
      
      // 4. İlgi alanı uyumluluğu
      if (userData?.hobbies?.length > 0) {
        const userInterests = userData.hobbies.map(h => h.toLowerCase());
        const authorCategories = Array.from(author.categories).map(c => c.toLowerCase());
        
        const commonInterests = userInterests.filter(interest => 
          authorCategories.some(category => 
            category.includes(interest) || interest.includes(category)
          )
        );
        
        const interestMatch = (commonInterests.length / Math.max(userInterests.length, 1)) * 100;
        score += interestMatch;
      }
      
      // 5. Kategori çeşitliliği bonusu
      const diversityBonus = Math.min(author.categories.size, 3) * 10;
      score += diversityBonus;
      
      // 6. Yenilik puanı (yeni yazarları destekleme)
      if (author.posts.length <= 3) {
        score += 20; // Yeni yazarlara bonus
      }
      
      return {
        ...author,
        score: Math.round(score),
        avgEngagement: Math.round((avgLikes + avgComments) * 10) / 10,
        categoriesArray: Array.from(author.categories)
      };
    });

    // Puanlara göre sırala ve en iyi önerileri döndür
    return recommendedAuthors
      .filter(author => author.score > 10) // Minimum puan kontrolü
      .sort((a, b) => b.score - a.score)
      .slice(0, limitCount);
      
  } catch (error) {
    console.error('Yazar önerisi hatası:', error);
    return [];
  }
};

/**
 * Kullanıcının beğendiği gönderilerin kategorilerini analiz et
 * @param {string} userId - Kullanıcı ID'si
 * @param {Array} allPosts - Tüm gönderiler
 * @returns {Array} - En çok beğenilen kategoriler
 */
export const getUserInterestCategories = (userId, allPosts) => {
  try {
    const categoryCount = {};
    
    allPosts.forEach(post => {
      if (post.likes && Array.isArray(post.likes) && post.likes.includes(userId)) {
        if (post.category) {
          categoryCount[post.category] = (categoryCount[post.category] || 0) + 1;
        }
      }
    });
    
    // Kategorileri beğeni sayısına göre sırala
    return Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .map(([category, count]) => ({ category, count }))
      .slice(0, 5);
  } catch (error) {
    console.error('İlgi alanı analizi hatası:', error);
    return [];
  }
};

/**
 * Benzer kullanıcılar bul (collaborative filtering)
 * @param {string} userId - Kullanıcı ID'si
 * @param {Array} allPosts - Tüm gönderiler
 * @returns {Array} - Benzer kullanıcı ID'leri
 */
export const findSimilarUsers = (userId, allPosts) => {
  try {
    // Kullanıcının beğendiği gönderiler
    const userLikedPosts = allPosts
      .filter(post => post.likes && Array.isArray(post.likes) && post.likes.includes(userId))
      .map(post => post.id);
    
    if (userLikedPosts.length === 0) return [];
    
    // Diğer kullanıcıların beğenileri
    const userSimilarity = {};
    
    allPosts.forEach(post => {
      if (post.likes && Array.isArray(post.likes)) {
        post.likes.forEach(otherUserId => {
          if (otherUserId !== userId) {
            if (!userSimilarity[otherUserId]) {
              userSimilarity[otherUserId] = { common: 0, total: 0 };
            }
            
            if (userLikedPosts.includes(post.id)) {
              userSimilarity[otherUserId].common++;
            }
            userSimilarity[otherUserId].total++;
          }
        });
      }
    });
    
    // Benzerlik puanı hesapla (Jaccard similarity)
    const similarUsers = Object.entries(userSimilarity)
      .map(([otherUserId, stats]) => ({
        userId: otherUserId,
        similarity: stats.common / (userLikedPosts.length + stats.total - stats.common)
      }))
      .filter(user => user.similarity > 0.1) // Minimum %10 benzerlik
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10)
      .map(user => user.userId);
    
    return similarUsers;
  } catch (error) {
    console.error('Benzer kullanıcı bulma hatası:', error);
    return [];
  }
}; 