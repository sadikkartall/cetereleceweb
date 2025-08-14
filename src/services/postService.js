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
import { db, storage } from '../firebase/config';
import { 
  collection, 
  addDoc,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  getDocs,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';

// Koleksiyon adı
const COLLECTION_NAME = 'posts';

// Dosya yükleme için yardımcı fonksiyon
const uploadFileWithRetry = async (file, path, maxRetries = 3) => {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      const storageRef = ref(storage, path);
      const snapshot = await uploadBytes(storageRef, file);
      return await getDownloadURL(snapshot.ref);
    } catch (error) {
      retries++;
      console.error(`Dosya yükleme denemesi ${retries}/${maxRetries} başarısız:`, error);
      if (retries === maxRetries) throw error;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
    }
  }
};

/**
 * Yeni bir gönderi oluştur
 * @param {object} postData - Gönderi verisi
 * @param {File} mediaFile - Yüklenecek medya dosyası (varsa)
 * @returns {Promise<string>} - Oluşturulan gönderinin ID'si
 */
export const createPost = async (postData, mediaFile) => {
  try {
    if (!postData.authorId) {
      console.error('Kullanıcı ID bulunamadı:', postData);
      throw new Error('Kullanıcı bilgisi bulunamadı. Lütfen tekrar giriş yapın.');
    }

    console.log('Gönderi oluşturma başladı:', { 
      authorId: postData.authorId, 
      title: postData.title,
      authorEmail: postData.authorEmail 
    });

    let mediaUrl = null;
    
    // Eğer medya dosyası varsa, önce onu yükle
    if (mediaFile) {
      const fileName = `posts/${postData.authorId}/${Date.now()}_${mediaFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      try {
        console.log('Medya yükleme başladı:', fileName);
        mediaUrl = await uploadFileWithRetry(mediaFile, fileName);
        console.log('Medya yükleme başarılı:', mediaUrl);
      } catch (uploadError) {
        console.error('Dosya yükleme hatası:', uploadError);
        if (uploadError.code === 'storage/unauthorized') {
          throw new Error('Dosya yükleme yetkisi yok. Lütfen tekrar giriş yapın.');
        }
        throw new Error('Dosya yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
      }
    }

    // Gönderiyi oluştur
    try {
      console.log('Firestore\'a gönderi ekleniyor...');
      const postRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...postData,
        mediaUrl,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'active', // Gönderi durumu
        likes: 0, // Beğeni sayısı
        comments: 0, // Yorum sayısı
        views: 0, // Görüntülenme sayısı
      });
      console.log('Gönderi başarıyla oluşturuldu:', postRef.id);
      return postRef.id;
    } catch (firestoreError) {
      console.error('Firestore hatası:', firestoreError);
      if (firestoreError.code === 'permission-denied') {
        console.error('İzin hatası detayları:', {
          code: firestoreError.code,
          message: firestoreError.message,
          authorId: postData.authorId,
          authorEmail: postData.authorEmail
        });
        throw new Error('Gönderi oluşturma yetkiniz yok. Lütfen tekrar giriş yapın.');
      }
      throw new Error('Gönderi oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  } catch (error) {
    console.error('Gönderi oluşturma hatası:', error);
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
    const docRef = doc(db, COLLECTION_NAME, postId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const postData = docSnap.data();
      // Yazar bilgilerini getir
      let authorData = {};
      if (postData.authorId) {
        const authorDoc = await getDoc(doc(db, 'users', postData.authorId));
        if (authorDoc.exists()) {
          authorData = authorDoc.data();
        }
      }
      return {
        id: docSnap.id,
        ...postData,
        authorName: authorData.displayName || 'Anonim',
        authorUsername: authorData.username || 'anonim',
        authorAvatar: authorData.photoURL,
        createdAt: postData.createdAt?.toDate?.() || new Date(),
        updatedAt: postData.updatedAt?.toDate?.() || new Date()
      };
    }
    throw new Error('Gönderi bulunamadı');
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
    console.log('Gönderiler getiriliyor...', { pageSize, category });
    
    let postsQuery = collection(db, COLLECTION_NAME);
    
    // Kategori filtresi ekle
    if (category) {
      postsQuery = query(postsQuery, where('category', '==', category));
    }
    
    // Sıralama ve sayfalama ekle
    postsQuery = query(
      postsQuery,
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    );
    
    if (lastVisible) {
      postsQuery = query(postsQuery, startAfter(lastVisible));
    }
    
    const querySnapshot = await getDocs(postsQuery);
    const posts = await Promise.all(querySnapshot.docs.map(async docSnap => {
      const postData = docSnap.data();
      // Yazar bilgilerini getir
      let authorData = {};
      if (postData.authorId) {
        const authorDoc = await getDoc(doc(db, 'users', postData.authorId));
        if (authorDoc.exists()) {
          authorData = authorDoc.data();
        }
      }
      
      return {
        id: docSnap.id,
        ...postData,
        authorName: authorData.displayName || 'Anonim',
        authorUsername: authorData.username || 'anonim',
        authorAvatar: authorData.photoURL,
        createdAt: postData.createdAt?.toDate?.() || new Date(),
        updatedAt: postData.updatedAt?.toDate?.() || new Date()
      };
    }));
    
    console.log(`${posts.length} gönderi başarıyla getirildi`);
    
    return {
      posts,
      lastVisible: posts.length > 0 ? querySnapshot.docs[querySnapshot.docs.length - 1] : null
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
    console.log('Kullanıcı gönderileri getiriliyor...', { userId });
    if (!userId) {
      console.error('Kullanıcı ID bulunamadı');
      return [];
    }
    const postsQuery = query(
      collection(db, COLLECTION_NAME),
      where('authorId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    );
    const querySnapshot = await getDocs(postsQuery);
    // Yazar bilgilerini bir kez çek
    let authorData = {};
    const authorDoc = await getDoc(doc(db, 'users', userId));
    if (authorDoc.exists()) {
      authorData = authorDoc.data();
    }
    const posts = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      authorName: authorData.displayName || 'Anonim',
      authorUsername: authorData.username || 'anonim',
      authorAvatar: authorData.photoURL,
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate?.() || new Date()
    }));
    console.log(`${posts.length} kullanıcı gönderisi başarıyla getirildi`);
    return posts;
  } catch (error) {
    console.error('Kullanıcı gönderileri alınırken hata:', error);
    if (error.code === 'failed-precondition') {
      console.error('Firestore indeksi gerekiyor. Lütfen Firebase Console\'da indeksi oluşturun.');
      // Yazar bilgilerini bir kez çek
      let authorData = {};
      const authorDoc = await getDoc(doc(db, 'users', userId));
      if (authorDoc.exists()) {
        authorData = authorDoc.data();
      }
      // İndeks oluşturulana kadar basit bir sorgu deneyelim
      try {
        const simpleQuery = query(
          collection(db, COLLECTION_NAME),
          where('authorId', '==', userId),
          limit(pageSize)
        );
        const simpleSnapshot = await getDocs(simpleQuery);
        const simplePosts = simpleSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          authorName: authorData.displayName || 'Anonim',
          authorUsername: authorData.username || 'anonim',
          authorAvatar: authorData.photoURL,
          createdAt: doc.data().createdAt?.toDate?.() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate?.() || new Date()
        }));
        console.log(`${simplePosts.length} gönderi basit sorgu ile getirildi`);
        return simplePosts;
      } catch (simpleError) {
        console.error('Basit sorgu da başarısız oldu:', simpleError);
        return [];
      }
    }
    return [];
  }
};

/**
 * Gönderiyi güncelle
 * @param {string} postId - Gönderi ID'si
 * @param {object} postData - Güncellenecek veriler
 * @param {File} mediaFile - Yeni medya dosyası (varsa)
 * @returns {Promise<void>}
 */
export const updatePost = async (postId, postData, mediaFile = null) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, postId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Gönderi bulunamadı');
    }
    
    let mediaUrl = docSnap.data().mediaUrl;
    
    // Eğer yeni medya dosyası varsa
    if (mediaFile) {
      // Eski medyayı sil (varsa)
      if (docSnap.data().mediaUrl) {
        try {
          const oldMediaRef = ref(storage, docSnap.data().mediaUrl);
          await deleteObject(oldMediaRef);
        } catch (error) {
          console.warn('Eski medya silinirken hata:', error);
        }
      }
      
      // Yeni medyayı yükle
      const storageRef = ref(storage, `posts/${Date.now()}_${mediaFile.name}`);
      const snapshot = await uploadBytes(storageRef, mediaFile);
      mediaUrl = await getDownloadURL(snapshot.ref);
    }
    
    // Gönderiyi güncelle
    await updateDoc(docRef, {
      ...postData,
      mediaUrl,
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
    const docRef = doc(db, COLLECTION_NAME, postId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Gönderi bulunamadı');
    }
    
    // Gönderi medyasını sil (varsa)
    if (docSnap.data().mediaUrl) {
      try {
        const mediaRef = ref(storage, docSnap.data().mediaUrl);
        await deleteObject(mediaRef);
      } catch (error) {
        console.warn('Medyayı silinirken hata:', error);
      }
    }
    
    // Gönderiyi sil
    await deleteDoc(docRef);
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
  const docRef = doc(db, COLLECTION_NAME, postId);
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() });
    } else {
      callback(null);
    }
  });
};

/**
 * Gönderiler için gerçek zamanlı güncelleme
 * @param {function} callback - Gönderiler değiştiğinde çağrılacak fonksiyon
 * @param {number} limitCount - Gönderi sayısı limiti
 * @returns {function} - Aboneliği iptal et
 */
export const subscribeToPosts = (callback, limitCount = 10, category = null) => {
  console.log('Gönderiler için gerçek zamanlı güncelleme başlatılıyor...');
  
  let postsQuery = collection(db, COLLECTION_NAME);
  
  if (category) {
    postsQuery = query(postsQuery, where('category', '==', category));
  }
  
  postsQuery = query(
    postsQuery,
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  
  return onSnapshot(postsQuery, (querySnapshot) => {
    const posts = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate?.() || new Date()
    }));
    console.log(`${posts.length} gönderi gerçek zamanlı olarak güncellendi`);
    callback(posts);
  }, (error) => {
    console.error('Gerçek zamanlı güncelleme hatası:', error);
  });
};

// Gönderiye beğeni ekle
export const likePost = async (postId, userId) => {
  const postRef = doc(db, COLLECTION_NAME, postId);
  await updateDoc(postRef, {
    likes: arrayUnion(userId)
  });
};

// Gönderiden beğeni kaldır
export const unlikePost = async (postId, userId) => {
  const postRef = doc(db, COLLECTION_NAME, postId);
  await updateDoc(postRef, {
    likes: arrayRemove(userId)
  });
};

// Gönderiyi kaydet
export const bookmarkPost = async (postId, userId) => {
  const postRef = doc(db, COLLECTION_NAME, postId);
  await updateDoc(postRef, {
    bookmarks: arrayUnion(userId)
  });
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    bookmarks: arrayUnion(postId)
  });
  console.log('BOOKMARK EKLENDİ:', { postId, userId });
};

// Kaydetmeyi kaldır
export const unbookmarkPost = async (postId, userId) => {
  const postRef = doc(db, COLLECTION_NAME, postId);
  await updateDoc(postRef, {
    bookmarks: arrayRemove(userId)
  });
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    bookmarks: arrayRemove(postId)
  });
  console.log('BOOKMARK KALDIRILDI:', { postId, userId });
};

// Yorumu ekle
export const addComment = async (postId, commentData) => {
  const commentsRef = collection(db, COLLECTION_NAME, postId, 'comments');
  await addDoc(commentsRef, {
    ...commentData,
    createdAt: serverTimestamp()
  });
};

// Yorumları getir
export const getComments = async (postId) => {
  const commentsRef = collection(db, COLLECTION_NAME, postId, 'comments');
  const snapshot = await getDocs(commentsRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

/**
 * Trend gönderileri için akıllı algoritma
 * Beğeni, yorum, görüntülenme sayısı, zaman faktörü ve etkileşim oranını hesaplar
 * @param {Array} posts - Gönderi listesi
 * @param {number} limitCount - Kaç trend gönderi döndürüleceği
 * @returns {Array} - Trend puanına göre sıralanmış gönderiler
 */
export const getTrendingPosts = (posts, limitCount = 5) => {
  const now = new Date();
  
  const calculateTrendScore = (post) => {
    // Güvenlik kontrolleri
    const likes = Array.isArray(post.likes) ? post.likes.length : (post.likes || 0);
    const comments = Array.isArray(post.comments) ? post.comments.length : (post.comments || 0);
    const bookmarks = Array.isArray(post.bookmarks) ? post.bookmarks.length : (post.bookmarks || 0);
    const views = post.views || 1; // 0'a bölünmeyi önlemek için minimum 1
    
    // Gönderi yaşı (saat cinsinden)
    const postDate = post.createdAt instanceof Date ? post.createdAt : new Date(post.createdAt);
    const ageInHours = Math.max(1, (now - postDate) / (1000 * 60 * 60));
    
    // Temel etkileşim puanı
    const baseEngagement = (likes * 1.0) + (comments * 2.0) + (bookmarks * 1.5);
    
    // Etkileşim oranı (engagement rate)
    const engagementRate = baseEngagement / views;
    
    // Zaman faktörü (yeni gönderiler daha avantajlı)
    // 24 saatten yeni gönderiler bonus alır, eski gönderiler cezalandırılır
    let timeFactor;
    if (ageInHours <= 24) {
      // İlk 24 saat: Bonus
      timeFactor = 2.0 - (ageInHours / 24) * 0.5; // 2.0'dan 1.5'e doğru azalır
    } else if (ageInHours <= 168) { // 7 gün
      // 1-7 gün arası: Normal
      timeFactor = 1.5 - ((ageInHours - 24) / 144) * 0.8; // 1.5'den 0.7'ye azalır
    } else {
      // 7 günden eski: Düşük factor
      timeFactor = Math.max(0.1, 0.7 * Math.exp(-(ageInHours - 168) / 500)); // Exponential decay
    }
    
    // Minimum etkileşim kontrolü (spam/düşük kalite filtresi)
    if (baseEngagement < 2) {
      return 0; // 2'den az etkileşimi olan gönderiler trend olamaz
    }
    
    // Hız faktörü (son 24 saatte ne kadar etkileşim aldı)
    // Bu kısım için gerçek veri yoksa varsayılan hesaplama yapıyoruz
    const recentEngagementBonus = ageInHours <= 24 ? 1.2 : 1.0;
    
    // Kategori çeşitliliği bonusu (farklı kategorilerden trend seçimi için)
    const categoryBonus = 1.0; // Bu kısım kategori çeşitliliği için kullanılabilir
    
    // Final trend puanı hesaplama
    const trendScore = (
      (baseEngagement * 10) +           // Temel etkileşim puanı
      (engagementRate * 50) +           // Etkileşim oranı bonusu
      (views * 0.1)                     // Görüntülenme bonusu (küçük ağırlık)
    ) * timeFactor * recentEngagementBonus * categoryBonus;
    
    return Math.round(trendScore * 100) / 100; // 2 ondalık basamağa yuvarla
  };
  
  // Her gönderi için trend puanı hesapla ve sırala
  const postsWithTrendScore = posts.map(post => ({
    ...post,
    trendScore: calculateTrendScore(post)
  }));
  
  // Trend puanına göre sırala ve istenen sayıda döndür
  return postsWithTrendScore
    .filter(post => post.trendScore > 0) // 0 puanı olanları filtrele
    .sort((a, b) => b.trendScore - a.trendScore)
    .slice(0, limitCount);
};

/**
 * Gelişmiş trend gönderileri getir - veritabanından direk
 * @param {number} limitCount - Kaç trend gönderi getirileceği
 * @param {number} hoursBack - Kaç saat geriye bakılacak (varsayılan: 168 = 7 gün)
 * @returns {Promise<Array>} - Trend gönderileri
 */
export const getAdvancedTrendingPosts = async (limitCount = 5, hoursBack = 168) => {
  try {
    // Son X saat içindeki gönderileri getir
    const cutoffDate = new Date(Date.now() - (hoursBack * 60 * 60 * 1000));
    
    const postsQuery = query(
      collection(db, COLLECTION_NAME),
      where('createdAt', '>=', cutoffDate),
      orderBy('createdAt', 'desc'),
      limit(50) // Yeterli sample almak için daha fazla getir
    );
    
    const querySnapshot = await getDocs(postsQuery);
    const recentPosts = await Promise.all(querySnapshot.docs.map(async docSnap => {
      const postData = docSnap.data();
      
      // Yazar bilgilerini getir
      let authorData = {};
      if (postData.authorId) {
        const authorDoc = await getDoc(doc(db, 'users', postData.authorId));
        if (authorDoc.exists()) {
          authorData = authorDoc.data();
        }
      }
      
      return {
        id: docSnap.id,
        ...postData,
        authorName: authorData.displayName || 'Anonim',
        authorUsername: authorData.username || 'anonim',
        authorAvatar: authorData.photoURL,
        createdAt: postData.createdAt?.toDate?.() || new Date(),
        updatedAt: postData.updatedAt?.toDate?.() || new Date()
      };
    }));
    
    // Trend algoritmasını uygula
    const trendingPosts = getTrendingPosts(recentPosts, limitCount);
    
    console.log(`${trendingPosts.length} trend gönderi algoritma ile hesaplandı`);
    return trendingPosts;
  } catch (error) {
    console.error('Trend gönderileri alınırken hata:', error);
    throw error;
  }
};

/**
 * Gönderi görüntülenmelerini artır
 * @param {string} postId - Gönderi ID'si
 * @returns {Promise<void>}
 */
export const incrementPostViews = async (postId) => {
  try {
    const postRef = doc(db, COLLECTION_NAME, postId);
    await updateDoc(postRef, {
      views: increment(1)
    });
  } catch (error) {
    console.error('Görüntülenme sayısı artırılırken hata:', error);
    // Bu hata silent olarak geçilebilir, çünkü core functionality değil
  }
}; 