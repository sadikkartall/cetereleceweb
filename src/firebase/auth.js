import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  sendEmailVerification,
  onAuthStateChanged,
  GoogleAuthProvider,
  GithubAuthProvider,
  TwitterAuthProvider,
  signInWithPopup,
  linkWithPopup,
  getAdditionalUserInfo,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { auth } from './config';
import { setDocument, getDocument, getDocuments, deleteDocument } from './firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './config';
import { where } from 'firebase/firestore';

// Provider'ları oluştur
const googleProvider = new GoogleAuthProvider();
const githubProvider = new GithubAuthProvider();
const twitterProvider = new TwitterAuthProvider();

/**
 * Kullanıcı adının benzersiz olup olmadığını kontrol et
 * @param {string} username - Kontrol edilecek kullanıcı adı
 * @returns {Promise<boolean>} - Kullanıcı adı benzersiz ise true, değilse false
 */
const isUsernameUnique = async (username) => {
  try {
    const users = await getDocuments('users', [where('username', '==', username)]);
    return users.length === 0; // Eğer hiç kullanıcı bulunamazsa kullanıcı adı benzersizdir
  } catch (error) {
    console.error('Kullanıcı adı kontrolü sırasında hata:', error);
    throw error;
  }
};

/**
 * Registers a new user with email and password
 * @param {string} email - The user's email
 * @param {string} password - The user's password
 * @param {Object} userData - Additional user data (displayName, photoURL, etc.)
 * @returns {Promise<UserCredential>} A promise that resolves with the user credential
 */
export const register = async (email, password, userData = {}) => {
  try {
    // E-posta ve şifre doğrulaması
    if (!email) throw new Error('E-posta adresi gereklidir.');
    if (!password) throw new Error('Şifre gereklidir.');
    if (password.length < 6) throw new Error('Şifre en az 6 karakter olmalıdır.');
    
    // Kullanıcı adı doğrulaması
    if (userData.username) {
      // Kullanıcı adı formatını kontrol et (sadece harfler, sayılar ve alt çizgi)
      const usernameRegex = /^[a-zA-Z0-9_]+$/;
      if (!usernameRegex.test(userData.username)) {
        throw new Error('Kullanıcı adı sadece harfler, sayılar ve alt çizgi (_) içerebilir.');
      }
      
      // Kullanıcı adının benzersiz olup olmadığını kontrol et
      const isUnique = await isUsernameUnique(userData.username);
      if (!isUnique) {
        throw new Error('Bu kullanıcı adı zaten kullanılıyor. Lütfen başka bir kullanıcı adı seçin.');
      }
    }
    
    console.log('Kayıt oluşturuluyor:', email);
    
    // Firebase'de kullanıcı oluştur
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log('Kullanıcı oluşturuldu:', userCredential.user.uid);
    
    // Update profile if userData is provided
    if (userData.displayName || userData.photoURL) {
      try {
        await updateProfile(userCredential.user, {
          displayName: userData.displayName || null,
          photoURL: userData.photoURL || null
        });
        console.log('Profil güncellendi');
      } catch (profileError) {
        console.error('Profil güncelleme hatası:', profileError);
        // Profil güncellemesi başarısız olsa bile devam et
      }
    }
    
    // If user provided a profile image as a file, upload it to storage
    if (userData.profileImage) {
      try {
        const storageRef = ref(storage, `profile_images/${userCredential.user.uid}`);
        await uploadBytes(storageRef, userData.profileImage);
        const downloadURL = await getDownloadURL(storageRef);
        
        // Update user profile with the storage URL
        await updateProfile(userCredential.user, {
          photoURL: downloadURL
        });
        
        // Update photoURL in userData for Firestore
        userData.photoURL = downloadURL;
        console.log('Profil resmi yüklendi');
      } catch (imageError) {
        console.error('Profil resmi yükleme hatası:', imageError);
        // Resim yükleme hatası olsa bile devam et
      }
    }
    
    // Create user document in Firestore
    try {
      await setDocument('users', userCredential.user.uid, {
        email: userCredential.user.email,
        displayName: userData.displayName || '',
        username: userData.username || '',
        photoURL: userData.photoURL || '',
        bio: userData.bio || '',
        createdAt: new Date(),
        lastLogin: new Date(),
        provider: 'email'
      });
      console.log('Firestore kullanıcı belgesi oluşturuldu');
    } catch (firestoreError) {
      console.error('Firestore kullanıcı kaydı hatası:', firestoreError);
      // Firestore error should not prevent user from being created
    }
    
    return userCredential;
  } catch (error) {
    console.error("Error in register:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    
    // Daha anlaşılır hata mesajları
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('Bu e-posta adresi zaten kullanılıyor.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Geçersiz e-posta adresi formatı.');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Şifre çok zayıf. Lütfen en az 6 karakter uzunluğunda bir şifre seçin.');
    } else if (error.code === 'auth/operation-not-allowed') {
      throw new Error('E-posta/şifre kayıt yöntemi şu anda etkin değil. Lütfen yönetici ile iletişime geçin.');
    } else if (error.code === 'auth/network-request-failed') {
      throw new Error('Ağ hatası. Lütfen internet bağlantınızı kontrol edin ve tekrar deneyin.');
    } else {
      throw error;
    }
  }
};

/**
 * Google ile giriş yap veya kayıt ol
 * @returns {Promise<object>} - Kullanıcı nesnesi
 */
export const signInWithGoogle = async () => {
  try {
    // Google popup için ayarlar
    googleProvider.setCustomParameters({
      prompt: 'select_account'
    });
    
    const result = await signInWithPopup(auth, googleProvider);
    const isNewUser = getAdditionalUserInfo(result)?.isNewUser;
    
    // Yeni kullanıcıysa Firestore'a kaydet
    if (isNewUser) {
      const { user } = result;
      try {
        // Google ile giriş yapan kullanıcılar için otomatik kullanıcı adı oluştur
        let username = user.email.split('@')[0]; // E-posta adresinin @ işaretinden önceki kısmını kullan
        
        // Kullanıcı adının benzersiz olup olmadığını kontrol et
        let isUnique = await isUsernameUnique(username);
        let counter = 1;
        
        // Eğer kullanıcı adı zaten kullanılıyorsa, sonuna sayı ekleyerek benzersiz bir isim oluştur
        while (!isUnique) {
          username = `${user.email.split('@')[0]}${counter}`;
          isUnique = await isUsernameUnique(username);
          counter++;
        }
        
        await setDocument('users', user.uid, {
          email: user.email,
          displayName: user.displayName || '',
          username: username, // Benzersiz kullanıcı adı
          photoURL: user.photoURL || '',
          bio: '',
          createdAt: new Date(),
          provider: 'google',
          lastLogin: new Date(),
        });
      } catch (firestoreError) {
        console.error('Firestore kayıt hatası:', firestoreError);
        // Firestore hatası olsa bile kullanıcı giriş yapabilir
      }
    } else {
      // Mevcut kullanıcının son giriş bilgisini güncelle
      try {
        const { user } = result;
        await setDocument('users', user.uid, {
          lastLogin: new Date()
        }, { merge: true });
      } catch (updateError) {
        console.error('Firestore güncelleme hatası:', updateError);
        // Güncelleme hatası olsa bile kullanıcı giriş yapabilir
      }
    }
    
    return result.user;
  } catch (error) {
    console.error('Google ile giriş yaparken hata:', error);
    console.error('Hata kodu:', error.code);
    console.error('Hata mesajı:', error.message);
    
    // PopupBlocked hatasını kontrol et
    if (error.code === 'auth/popup-blocked') {
      throw new Error('Popup penceresi tarayıcı tarafından engellendi. Lütfen popup izinlerinizi kontrol edin.');
    }
    
    // Ağ hatasını kontrol et
    if (error.code === 'auth/network-request-failed') {
      throw new Error('Ağ bağlantısı hatası. Lütfen internet bağlantınızı kontrol edin.');
    }
    
    // Operation not allowed hatasını kontrol et
    if (error.code === 'auth/operation-not-allowed') {
      throw new Error('Google ile giriş yapma özelliği Firebase konsolunda etkinleştirilmemiş. Lütfen yönetici ile iletişime geçin.');
    }
    
    // Genel hata
    throw error;
  }
};

/**
 * GitHub ile giriş yap veya kayıt ol
 * @returns {Promise<object>} - Kullanıcı nesnesi
 */
export const signInWithGithub = async () => {
  try {
    const result = await signInWithPopup(auth, githubProvider);
    const isNewUser = getAdditionalUserInfo(result)?.isNewUser;
    
    // Yeni kullanıcıysa Firestore'a kaydet
    if (isNewUser) {
      const { user } = result;
      const profile = getAdditionalUserInfo(result)?.profile;
      
      await setDocument('users', user.uid, {
        email: user.email,
        displayName: user.displayName || profile?.name || '',
        photoURL: user.photoURL || '',
        bio: profile?.bio || '',
        createdAt: new Date(),
        provider: 'github',
        githubUsername: profile?.login || '',
      });
    }
    
    return result.user;
  } catch (error) {
    console.error('GitHub ile giriş yaparken hata:', error);
    throw error;
  }
};

/**
 * Twitter ile giriş yap veya kayıt ol
 * @returns {Promise<object>} - Kullanıcı nesnesi
 */
export const signInWithTwitter = async () => {
  try {
    const result = await signInWithPopup(auth, twitterProvider);
    const isNewUser = getAdditionalUserInfo(result)?.isNewUser;
    
    // Yeni kullanıcıysa Firestore'a kaydet
    if (isNewUser) {
      const { user } = result;
      const profile = getAdditionalUserInfo(result)?.profile;
      
      await setDocument('users', user.uid, {
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        bio: profile?.description || '',
        createdAt: new Date(),
        provider: 'twitter',
        twitterUsername: profile?.screen_name || '',
      });
    }
    
    return result.user;
  } catch (error) {
    console.error('Twitter ile giriş yaparken hata:', error);
    throw error;
  }
};

/**
 * Mevcut hesaba sosyal medya hesabı bağla
 * @param {string} providerName - Sağlayıcı adı ('google', 'github', 'twitter')
 * @returns {Promise<object>} - Kullanıcı nesnesi
 */
export const linkAccountWithProvider = async (providerName) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Oturum açık değil');
    
    let provider;
    switch (providerName) {
      case 'google':
        provider = googleProvider;
        break;
      case 'github':
        provider = githubProvider;
        break;
      case 'twitter':
        provider = twitterProvider;
        break;
      default:
        throw new Error('Geçersiz sağlayıcı');
    }
    
    const result = await linkWithPopup(currentUser, provider);
    return result.user;
  } catch (error) {
    console.error('Hesap bağlanırken hata:', error);
    throw error;
  }
};

/**
 * E-posta ve şifre ile oturum aç
 * @param {string} email - Kullanıcı e-postası
 * @param {string} password - Kullanıcı şifresi
 * @returns {Promise<object>} - Kullanıcı nesnesi
 */
export const loginWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Oturum açarken hata:', error);
    throw error;
  }
};

/**
 * Oturumu kapat
 * @returns {Promise<void>} - İşlem tamamlandığında boş bir Promise döner
 */
export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Oturum kapatırken hata:', error);
    throw error;
  }
};

/**
 * Şifre sıfırlama e-postası gönder
 * @param {string} email - Kullanıcı e-postası
 * @returns {Promise<void>} - İşlem tamamlandığında boş bir Promise döner
 */
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Şifre sıfırlama e-postası gönderirken hata:', error);
    throw error;
  }
};

/**
 * Kullanıcı profilini güncelle
 * @param {object} user - Kullanıcı nesnesi
 * @param {object} profileData - Güncellenecek profil bilgileri
 * @returns {Promise<void>} - İşlem tamamlandığında boş bir Promise döner
 */
export const updateUserProfile = async (user, profileData) => {
  try {
    // Firebase Authentication profilini güncelle
    await updateProfile(user, {
      displayName: profileData.displayName || user.displayName,
      photoURL: profileData.photoURL || user.photoURL
    });
    
    // Firestore'da kullanıcı belgesini güncelle
    await setDocument('users', user.uid, profileData);
  } catch (error) {
    console.error('Profil güncellenirken hata:', error);
    throw error;
  }
};

/**
 * Kullanıcı kimlik değişikliklerini dinle
 * @param {function} callback - Kullanıcı değiştiğinde çağrılacak fonksiyon
 * @returns {function} - Dinleyiciyi kapatmak için çağrılabilecek fonksiyon
 */
export const subscribeToAuthChanges = (callback) => {
  return onAuthStateChanged(auth, (user) => {
    callback(user);
  });
};

/**
 * Kullanıcıyı yeniden doğrula (hesap silme ve hassas işlemler için)
 * @param {string} password - Kullanıcının şifresi
 * @returns {Promise<UserCredential>} Kullanıcı kimlik bilgileri
 */
export const reauthenticateUser = async (password) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Oturum açık değil');
    
    const credential = EmailAuthProvider.credential(user.email, password);
    return await reauthenticateWithCredential(user, credential);
  } catch (error) {
    console.error('Yeniden kimlik doğrulama hatası:', error);
    
    if (error.code === 'auth/wrong-password') {
      throw new Error('Yanlış şifre. Lütfen şifrenizi kontrol edin.');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Çok fazla başarısız giriş denemesi. Lütfen daha sonra tekrar deneyin.');
    } else if (error.code === 'auth/user-mismatch') {
      throw new Error('Kullanıcı eşleşmedi. Lütfen doğru hesapla giriş yaptığınızdan emin olun.');
    } else {
      throw error;
    }
  }
};

/**
 * Kullanıcı hesabını ve ilişkili verileri sil
 * @param {string} password - Kullanıcının mevcut şifresi (doğrulama için)
 * @returns {Promise<void>}
 */
export const deleteAccount = async (password) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Oturum açık değil');
    
    // Önce kullanıcıyı yeniden doğrula
    await reauthenticateUser(password);
    
    // Kullanıcının profilini ve diğer ilişkili kaynaklarını sil
    try {
      // 1. Kullanıcının profil resmini Storage'dan sil (varsa)
      try {
        const photoURL = user.photoURL;
        if (photoURL && photoURL.includes('firebase')) {
          const storageRef = ref(storage, `profile_images/${user.uid}`);
          await deleteObject(storageRef);
        }
      } catch (storageError) {
        console.error('Profil resmi silme hatası:', storageError);
        // Hata olsa bile devam et
      }
      
      // 2. Kullanıcının Firestore'daki bilgilerini sil
      await deleteDocument('users', user.uid);
      
      // 3. Kullanıcının gönderilerini sil (varsa)
      // Bu kısmı projenizin yapısına göre uygulamanız gerekebilir
      
    } catch (cleanupError) {
      console.error('Kullanıcı verilerini temizleme hatası:', cleanupError);
      // Temizleme hatası olsa bile hesabı silmeyi dene
    }
    
    // 4. Firebase Authentication kullanıcısını sil
    await deleteUser(user);
    
    return true;
  } catch (error) {
    console.error('Hesap silme hatası:', error);
    throw error;
  }
}; 