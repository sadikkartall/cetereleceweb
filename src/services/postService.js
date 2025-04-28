import {
  addDocument,
  getDocument,
  getDocuments,
  updateDocument,
  deleteDocument,
  subscribeToDocument,
  subscribeToCollection,
  setDocument
} from '../firebase/firestore';
import { 
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase/config';

// Koleksiyon adı
const COLLECTION_NAME = 'posts';

/**
 * Yeni bir gönderi oluştur
 * @param {object} postData - Gönderi verisi
 * @param {File} imageFile - Yüklenecek görsel dosyası (varsa)
 * @returns {Promise<string>} - Oluşturulan gönderinin ID'si
 */
export const createPost = async (postData, imageFile = null) => {
  try {
    let imageUrl = null;
    
    // Eğer resim dosyası varsa, Storage'a yükle
    if (imageFile) {
      const fileName = `posts/${Date.now()}_${imageFile.name}`;
      const storageRef = ref(storage, fileName);
      await uploadBytes(storageRef, imageFile);
      imageUrl = await getDownloadURL(storageRef);
    }
    
    // Gönderi verilerini hazırla
    const newPostData = {
      ...postData,
      imageUrl,
      likes: 0,
      comments: 0,
      createdAt: serverTimestamp(),
    };
    
    // Firestore'a ekle
    const postId = await addDocument(COLLECTION_NAME, newPostData);
    return postId;
  } catch (error) {
    console.error('Gönderi oluşturulurken hata:', error);
    throw error;
  }
};

/**
 * Belirli bir gönderiyi getir
 * @param {string} postId - Gönderi ID'si
 * @returns {Promise<object>} - Gönderi verisi
 */
export const getPost = async (postId) => {
  try {
    return await getDocument(COLLECTION_NAME, postId);
  } catch (error) {
    console.error('Gönderi alınırken hata:', error);
    throw error;
  }
};

/**
 * Tüm gönderileri getir (sayfalama ile)
 * @param {number} pageSize - Sayfa başına gönderi sayısı
 * @param {object} lastVisible - Son görünen belge (sayfalama için)
 * @param {string} category - Kategori filtresi (opsiyonel)
 * @returns {Promise<{posts: Array, lastVisible: object}>} - Gönderiler ve son görünen belge
 */
export const getPosts = async (pageSize = 10, lastVisible = null, category = null) => {
  try {
    const queryConstraints = [];
    
    // Kategori filtresi ekle
    if (category) {
      queryConstraints.push(where('category', '==', category));
    }
    
    // Sıralama ekle
    queryConstraints.push(orderBy('createdAt', 'desc'));
    
    // Sayfalama ekle
    queryConstraints.push(limit(pageSize));
    if (lastVisible) {
      queryConstraints.push(startAfter(lastVisible));
    }
    
    // Verileri getir
    const posts = await getDocuments(COLLECTION_NAME, queryConstraints);
    
    return {
      posts,
      lastVisible: posts.length > 0 ? posts[posts.length - 1].createdAt : null
    };
  } catch (error) {
    console.error('Gönderiler alınırken hata:', error);
    throw error;
  }
};

/**
 * Belirli bir kullanıcının gönderilerini getir
 * @param {string} userId - Kullanıcı ID'si
 * @param {number} pageSize - Sayfa başına gönderi sayısı
 * @returns {Promise<Array>} - Kullanıcının gönderileri
 */
export const getUserPosts = async (userId, pageSize = 10) => {
  try {
    const queryConstraints = [
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    ];
    
    return await getDocuments(COLLECTION_NAME, queryConstraints);
  } catch (error) {
    console.error('Kullanıcı gönderileri alınırken hata:', error);
    throw error;
  }
};

/**
 * Gönderiyi güncelle
 * @param {string} postId - Gönderi ID'si
 * @param {object} postData - Güncellenecek veriler
 * @param {File} imageFile - Yeni görsel dosyası (varsa)
 * @returns {Promise<void>}
 */
export const updatePost = async (postId, postData, imageFile = null) => {
  try {
    // Mevcut gönderiyi al
    const existingPost = await getDocument(COLLECTION_NAME, postId);
    if (!existingPost) {
      throw new Error('Gönderi bulunamadı');
    }
    
    let imageUrl = existingPost.imageUrl;
    
    // Eğer yeni resim dosyası varsa
    if (imageFile) {
      // Eski resmi sil (varsa)
      if (existingPost.imageUrl) {
        try {
          const oldImageRef = ref(storage, existingPost.imageUrl);
          await deleteObject(oldImageRef);
        } catch (error) {
          console.warn('Eski görsel silinirken hata:', error);
        }
      }
      
      // Yeni resmi yükle
      const fileName = `posts/${Date.now()}_${imageFile.name}`;
      const storageRef = ref(storage, fileName);
      await uploadBytes(storageRef, imageFile);
      imageUrl = await getDownloadURL(storageRef);
    }
    
    // Gönderiyi güncelle
    await updateDocument(COLLECTION_NAME, postId, {
      ...postData,
      imageUrl,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Gönderi güncellenirken hata:', error);
    throw error;
  }
};

/**
 * Gönderiyi sil
 * @param {string} postId - Gönderi ID'si
 * @returns {Promise<void>}
 */
export const deletePost = async (postId) => {
  try {
    // Gönderiyi al
    const post = await getDocument(COLLECTION_NAME, postId);
    if (!post) {
      throw new Error('Gönderi bulunamadı');
    }
    
    // Gönderi resmini sil (varsa)
    if (post.imageUrl) {
      try {
        const imageRef = ref(storage, post.imageUrl);
        await deleteObject(imageRef);
      } catch (error) {
        console.warn('Görsel silinirken hata:', error);
      }
    }
    
    // Gönderiyi sil
    await deleteDocument(COLLECTION_NAME, postId);
  } catch (error) {
    console.error('Gönderi silinirken hata:', error);
    throw error;
  }
};

/**
 * Gönderi için gerçek zamanlı güncelleme
 * @param {string} postId - Gönderi ID'si
 * @param {function} callback - Gönderi değiştiğinde çağrılacak fonksiyon
 * @returns {function} - Aboneliği iptal et
 */
export const subscribeToPost = (postId, callback) => {
  return subscribeToDocument(COLLECTION_NAME, postId, callback);
};

/**
 * Tüm gönderiler için gerçek zamanlı güncelleme
 * @param {function} callback - Gönderiler değiştiğinde çağrılacak fonksiyon
 * @param {number} limitCount - Gönderi sayısı limiti
 * @returns {function} - Aboneliği iptal et
 */
export const subscribeToPosts = (callback, limitCount = 10, category = null) => {
  const queryConstraints = [];
  
  if (category) {
    queryConstraints.push(where('category', '==', category));
  }
  
  queryConstraints.push(orderBy('createdAt', 'desc'));
  queryConstraints.push(limit(limitCount));
  
  return subscribeToCollection(COLLECTION_NAME, queryConstraints, callback);
}; 