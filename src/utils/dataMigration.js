import { uploadProfileImageFromBase64 } from '../firebase/storage';
import { getDocument, setDocument, updateDocument } from '../firebase/firestore';
import { db } from '../firebase/config';
import { collection, getDocs, query, where } from 'firebase/firestore';

/**
 * Tüm eski base64 profil fotoğraflarını Firebase Storage'a taşır
 * ve Firestore veritabanındaki belgeleri günceller
 * @returns {Promise<{success: boolean, migrated: number, errors: number}>}
 */
export const migrateProfileImages = async () => {
  try {
    console.log('Profil fotoğrafı taşıma başlatılıyor...');
    
    // Profil fotoğrafı olan kullanıcıları al
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('profileImage', '!=', null));
    const querySnapshot = await getDocs(q);
    
    let migrated = 0;
    let errors = 0;
    
    console.log(`Taşınacak ${querySnapshot.size} kullanıcı profili bulundu.`);
    
    // Her kullanıcı için profil fotoğrafını taşı
    for (const docSnapshot of querySnapshot.docs) {
      const userId = docSnapshot.id;
      const userData = docSnapshot.data();
      
      try {
        // Base64 profil fotoğrafı varsa, Storage'a yükle
        if (userData.profileImage && typeof userData.profileImage === 'string' && userData.profileImage.startsWith('data:')) {
          console.log(`${userId} için profil fotoğrafı Storage'a yükleniyor...`);
          
          // Storage'a yükle
          const photoURL = await uploadProfileImageFromBase64(userData.profileImage, userId);
          
          // Firestore belgesini güncelle
          await setDocument('users', userId, {
            photoURL: photoURL,
            // Eskisini temizle (opsiyonel - alandan tasarruf etmek için)
            profileImage: null
          }, { merge: true });
          
          console.log(`${userId} için profil fotoğrafı taşındı.`);
          migrated++;
        }
      } catch (userError) {
        console.error(`${userId} kullanıcısı için taşıma hatası:`, userError);
        errors++;
      }
    }
    
    console.log(`Taşıma tamamlandı. Başarılı: ${migrated}, Hata: ${errors}`);
    
    return {
      success: true,
      migrated,
      errors
    };
  } catch (error) {
    console.error('Profil fotoğrafı taşıma işlemi başarısız:', error);
    return {
      success: false,
      migrated: 0,
      errors: 1,
      error: error.message
    };
  }
};

/**
 * Tek bir kullanıcının profil fotoğrafını Firebase Storage'a taşır
 * @param {string} userId - Kullanıcı kimliği
 * @returns {Promise<{success: boolean, photoURL: string|null}>}
 */
export const migrateUserProfileImage = async (userId) => {
  try {
    // Kullanıcı verisini al
    const userData = await getDocument('users', userId);
    
    if (!userData) {
      console.error(`${userId} kullanıcısı bulunamadı.`);
      return { success: false, photoURL: null };
    }
    
    // Base64 profil fotoğrafı varsa, Storage'a yükle
    if (userData.profileImage && typeof userData.profileImage === 'string' && userData.profileImage.startsWith('data:')) {
      console.log(`${userId} için profil fotoğrafı Storage'a yükleniyor...`);
      
      // Storage'a yükle
      const photoURL = await uploadProfileImageFromBase64(userData.profileImage, userId);
      
      // Firestore belgesini güncelle
      await setDocument('users', userId, {
        photoURL: photoURL,
        // Eskisini temizle (opsiyonel - alandan tasarruf etmek için)
        profileImage: null
      }, { merge: true });
      
      console.log(`${userId} için profil fotoğrafı taşındı.`);
      return { success: true, photoURL };
    } else {
      console.log(`${userId} için taşınacak profil fotoğrafı bulunamadı.`);
      return { success: false, photoURL: null };
    }
  } catch (error) {
    console.error(`${userId} kullanıcısı için taşıma hatası:`, error);
    return { success: false, photoURL: null, error: error.message };
  }
}; 