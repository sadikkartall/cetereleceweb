import {
  setDocument,
  deleteDocument,
  getDocuments,
  getDocument,
  updateDocument
} from '../firebase/firestore';
import { 
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment
} from 'firebase/firestore';

// Koleksiyon adı
const COLLECTION_NAME = 'likes';

/**
 * Bir gönderiyi beğen/beğenmekten vazgeç
 * @param {string} postId - Gönderi ID'si
 * @param {string} userId - Kullanıcı ID'si
 * @param {boolean} isLike - Beğenme işlemi mi, yoksa beğenmekten vazgeçme mi?
 * @returns {Promise<void>}
 */
export const toggleLikePost = async (postId, userId, isLike = true) => {
  try {
    const likeId = `${postId}_${userId}`;
    
    if (isLike) {
      // Beğeni ekle
      await setDocument(COLLECTION_NAME, likeId, {
        postId,
        userId,
        createdAt: serverTimestamp()
      });
      
      // Gönderi beğeni sayısını arttır
      await updateDocument('posts', postId, {
        likes: increment(1)
      });
    } else {
      // Beğeniyi kaldır
      await deleteDocument(COLLECTION_NAME, likeId);
      
      // Gönderi beğeni sayısını azalt
      await updateDocument('posts', postId, {
        likes: increment(-1)
      });
    }
  } catch (error) {
    console.error('Gönderi beğenme işlemi sırasında hata:', error);
    throw error;
  }
};

/**
 * Kullanıcının gönderiyi beğenip beğenmediğini kontrol et
 * @param {string} postId - Gönderi ID'si
 * @param {string} userId - Kullanıcı ID'si
 * @returns {Promise<boolean>} - Beğenmiş mi beğenmemiş mi?
 */
export const isPostLikedByUser = async (postId, userId) => {
  try {
    const likeId = `${postId}_${userId}`;
    const like = await getDocument(COLLECTION_NAME, likeId);
    return !!like; // Eğer beğeni varsa true, yoksa false döner
  } catch (error) {
    console.error('Beğeni durumu kontrol edilirken hata:', error);
    return false;
  }
};

/**
 * Gönderiyi beğenen kullanıcıları getir
 * @param {string} postId - Gönderi ID'si
 * @param {number} limitCount - Kaç beğeni getirileceği
 * @returns {Promise<Array>} - Beğeniler dizisi
 */
export const getPostLikes = async (postId, limitCount = 20) => {
  try {
    const queryConstraints = [
      where('postId', '==', postId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    ];
    
    return await getDocuments(COLLECTION_NAME, queryConstraints);
  } catch (error) {
    console.error('Beğeniler alınırken hata:', error);
    throw error;
  }
};

/**
 * Kullanıcının beğendiği gönderileri getir
 * @param {string} userId - Kullanıcı ID'si
 * @param {number} limitCount - Kaç beğeni getirileceği
 * @returns {Promise<Array>} - Beğeniler dizisi
 */
export const getUserLikes = async (userId, limitCount = 20) => {
  try {
    const queryConstraints = [
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    ];
    
    return await getDocuments(COLLECTION_NAME, queryConstraints);
  } catch (error) {
    console.error('Kullanıcı beğenileri alınırken hata:', error);
    throw error;
  }
}; 