import {
  collection,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from './config.js';

/**
 * Belirli bir koleksiyondan veri getir
 * @param {string} collectionName - Koleksiyon adı
 * @param {object} queryConstraints - Sorgu kısıtlamaları (where, orderBy, limit vb.)
 * @returns {Promise<Array>} - Belgelerin dizisi
 */
export const getDocuments = async (collectionName, queryConstraints = []) => {
  try {
    const collectionRef = collection(db, collectionName);
    const q = query(collectionRef, ...queryConstraints);
    const querySnapshot = await getDocs(q);
    
    const documents = [];
    querySnapshot.forEach((doc) => {
      documents.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return documents;
  } catch (error) {
    console.error('Belgeleri getirirken hata oluştu:', error);
    throw error;
  }
};

/**
 * Belirli bir belgeyi getir
 * @param {string} collectionName - Koleksiyon adı
 * @param {string} documentId - Belge kimliği
 * @returns {Promise<object>} - Belge verisi
 */
export const getDocument = async (collectionName, documentId) => {
  try {
    const docRef = doc(db, collectionName, documentId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Belgeyi getirirken hata oluştu:', error);
    throw error;
  }
};

/**
 * Yeni bir belge ekle
 * @param {string} collectionName - Koleksiyon adı
 * @param {object} data - Belge verisi
 * @returns {Promise<string>} - Oluşturulan belgenin kimliği
 */
export const addDocument = async (collectionName, data) => {
  try {
    const docRef = await addDoc(collection(db, collectionName), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Belge eklerken hata oluştu:', error);
    throw error;
  }
};

/**
 * Belge oluştur veya güncelle
 * @param {string} collection - Koleksiyon adı
 * @param {string} docId - Belge ID'si
 * @param {object} data - Belge verisi
 * @param {object} options - Ek seçenekler (merge: true/false)
 * @returns {Promise<void>} - İşlem sonucu
 */
export const setDocument = async (collection, docId, data, options = {}) => {
  try {
    const docRef = doc(db, collection, docId);
    const { merge = false } = options;
    
    if (merge) {
      await setDoc(docRef, data, { merge: true });
    } else {
      await setDoc(docRef, data);
    }
  } catch (error) {
    console.error(`'${collection}/${docId}' belgesi kaydedilirken hata:`, error);
    throw error;
  }
};

/**
 * Belgeyi güncelle
 * @param {string} collectionName - Koleksiyon adı
 * @param {string} documentId - Belge kimliği
 * @param {object} data - Güncellenecek alanlar
 * @returns {Promise<void>}
 */
export const updateDocument = async (collectionName, documentId, data) => {
  try {
    const docRef = doc(db, collectionName, documentId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Belge güncellerken hata oluştu:', error);
    throw error;
  }
};

/**
 * Belgeyi sil
 * @param {string} collectionName - Koleksiyon adı
 * @param {string} documentId - Belge kimliği
 * @returns {Promise<void>}
 */
export const deleteDocument = async (collectionName, documentId) => {
  try {
    const docRef = doc(db, collectionName, documentId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Belge silerken hata oluştu:', error);
    throw error;
  }
};

/**
 * Gerçek zamanlı belge dinleyicisi
 * @param {string} collectionName - Koleksiyon adı
 * @param {string} documentId - Belge kimliği
 * @param {function} callback - Veri değiştiğinde çağrılacak fonksiyon
 * @returns {function} - Dinleyiciyi kapat
 */
export const subscribeToDocument = (collectionName, documentId, callback) => {
  const docRef = doc(db, collectionName, documentId);
  const unsubscribe = onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      callback({
        id: doc.id,
        ...doc.data()
      });
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('Belge dinlerken hata oluştu:', error);
  });
  
  return unsubscribe;
};

/**
 * Gerçek zamanlı koleksiyon dinleyicisi
 * @param {string} collectionName - Koleksiyon adı
 * @param {object} queryConstraints - Sorgu kısıtlamaları (where, orderBy, limit vb.)
 * @param {function} callback - Veri değiştiğinde çağrılacak fonksiyon
 * @returns {function} - Dinleyiciyi kapat
 */
export const subscribeToCollection = (collectionName, queryConstraints = [], callback) => {
  const collectionRef = collection(db, collectionName);
  const q = query(collectionRef, ...queryConstraints);
  
  const unsubscribe = onSnapshot(q, (querySnapshot) => {
    const documents = [];
    querySnapshot.forEach((doc) => {
      documents.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    callback(documents);
  }, (error) => {
    console.error('Koleksiyon dinlerken hata oluştu:', error);
  });
  
  return unsubscribe;
};

/**
 * Bir koleksiyondaki belge sayısını getirir
 * @param {string} collectionName - Koleksiyon adı
 * @returns {Promise<number>} - Belge sayısı
 */
export const getCollectionCount = async (collectionName) => {
  try {
    const collectionRef = collection(db, collectionName);
    const querySnapshot = await getDocs(collectionRef);
    return querySnapshot.size;
  } catch (error) {
    console.error('Koleksiyon sayısı alınırken hata oluştu:', error);
    throw error;
  }
};

export const updateUserProfile = async (userId, profileData) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...profileData,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Profil güncelleme hatası:', error);
    throw error;
  }
};

export const getUserProfile = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return {
        id: userSnap.id,
        ...userSnap.data()
      };
    }
    return null;
  } catch (error) {
    console.error('Kullanıcı profili getirme hatası:', error);
    throw error;
  }
}; 