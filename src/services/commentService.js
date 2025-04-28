import {
  addDocument,
  getDocuments,
  updateDocument,
  deleteDocument,
  subscribeToCollection,
  setDocument
} from '../firebase/firestore';
import { 
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment
} from 'firebase/firestore';

// Koleksiyon adı
const COLLECTION_NAME = 'comments';

/**
 * Yeni bir yorum ekle
 * @param {object} commentData - Yorum verisi (postId, userId, text, vs)
 * @returns {Promise<string>} - Oluşturulan yorumun ID'si
 */
export const addComment = async (commentData) => {
  try {
    // Yorum verilerini hazırla
    const newCommentData = {
      ...commentData,
      likes: 0,
      createdAt: serverTimestamp(),
    };
    
    // Firestore'a ekle
    const commentId = await addDocument(COLLECTION_NAME, newCommentData);
    
    // Gönderi yorumları sayacını güncelle
    if (commentData.postId) {
      const postCollectionName = 'posts';
      await updateDocument(postCollectionName, commentData.postId, {
        comments: increment(1)
      });
    }
    
    return commentId;
  } catch (error) {
    console.error('Yorum eklenirken hata:', error);
    throw error;
  }
};

/**
 * Belirli bir gönderinin yorumlarını getir
 * @param {string} postId - Gönderi ID'si 
 * @param {number} limitCount - Kaç yorum getirileceği
 * @returns {Promise<Array>} - Yorumlar dizisi
 */
export const getPostComments = async (postId, limitCount = 20) => {
  try {
    const queryConstraints = [
      where('postId', '==', postId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    ];
    
    return await getDocuments(COLLECTION_NAME, queryConstraints);
  } catch (error) {
    console.error('Yorumlar alınırken hata:', error);
    throw error;
  }
};

/**
 * Yorum güncelle
 * @param {string} commentId - Yorum ID'si
 * @param {object} commentData - Güncellenecek veriler
 * @returns {Promise<void>}
 */
export const updateComment = async (commentId, commentData) => {
  try {
    await updateDocument(COLLECTION_NAME, commentId, {
      ...commentData,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Yorum güncellenirken hata:', error);
    throw error;
  }
};

/**
 * Yorum sil
 * @param {string} commentId - Yorum ID'si
 * @param {string} postId - Gönderi ID'si
 * @returns {Promise<void>}
 */
export const deleteComment = async (commentId, postId) => {
  try {
    // Yorumu sil
    await deleteDocument(COLLECTION_NAME, commentId);
    
    // Gönderi yorumları sayacını güncelle
    if (postId) {
      const postCollectionName = 'posts';
      await updateDocument(postCollectionName, postId, {
        comments: increment(-1)
      });
    }
  } catch (error) {
    console.error('Yorum silinirken hata:', error);
    throw error;
  }
};

/**
 * Gönderi yorumlarını gerçek zamanlı dinle
 * @param {string} postId - Gönderi ID'si
 * @param {function} callback - Yorumlar değiştiğinde çağrılacak fonksiyon
 * @param {number} limitCount - Yorum sayısı limiti
 * @returns {function} - Aboneliği iptal et
 */
export const subscribeToComments = (postId, callback, limitCount = 20) => {
  const queryConstraints = [
    where('postId', '==', postId),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  ];
  
  return subscribeToCollection(COLLECTION_NAME, queryConstraints, callback);
};

/**
 * Bir yorumu beğen/beğenmekten vazgeç
 * @param {string} commentId - Yorum ID'si
 * @param {string} userId - Kullanıcı ID'si
 * @param {boolean} isLike - Beğenme işlemi mi, yoksa beğenmekten vazgeçme mi?
 * @returns {Promise<void>}
 */
export const toggleLikeComment = async (commentId, userId, isLike = true) => {
  try {
    // Likes koleksiyonu
    const likesCollectionName = 'commentLikes';
    const likeId = `${commentId}_${userId}`;
    
    if (isLike) {
      // Beğeni ekle
      await setDocument(likesCollectionName, likeId, {
        commentId,
        userId,
        createdAt: serverTimestamp()
      });
      
      // Yorum beğeni sayısını arttır
      await updateDocument(COLLECTION_NAME, commentId, {
        likes: increment(1)
      });
    } else {
      // Beğeniyi kaldır
      await deleteDocument(likesCollectionName, likeId);
      
      // Yorum beğeni sayısını azalt
      await updateDocument(COLLECTION_NAME, commentId, {
        likes: increment(-1)
      });
    }
  } catch (error) {
    console.error('Yorum beğenme işlemi sırasında hata:', error);
    throw error;
  }
}; 