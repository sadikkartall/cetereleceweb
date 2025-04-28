import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  register as registerUser,
  loginWithEmail,
  logout as signOutUser,
  resetPassword,
  updateUserProfile,
  subscribeToAuthChanges,
  deleteAccount as deleteUserAccount
} from '../firebase/auth';
import { getDocument, setDocument } from '../firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileImage, setProfileImage] = useState('');

  // Kullanıcı kaydı
  async function register(email, password, userData = {}) {
    try {
      console.log('AuthContext - register çağrıldı', email);
      return await registerUser(email, password, userData);
    } catch (error) {
      console.error('Kayıt işlemi başarısız:', error);
      throw error;
    }
  }

  // Kullanıcı girişi
  async function login(email, password) {
    try {
      return await loginWithEmail(email, password);
    } catch (error) {
      console.error('Giriş işlemi başarısız:', error);
      throw error;
    }
  }

  // Kullanıcı çıkışı
  async function logout() {
    try {
      await signOutUser();
      setUserData(null);
      setProfileImage('');
    } catch (error) {
      console.error('Çıkış işlemi başarısız:', error);
      throw error;
    }
  }

  // Şifre sıfırlama
  async function forgotPassword(email) {
    try {
      await resetPassword(email);
    } catch (error) {
      console.error('Şifre sıfırlama işlemi başarısız:', error);
      throw error;
    }
  }

  // Kullanıcı profili güncelleme
  async function updateProfile(profileData) {
    try {
      if (!currentUser) throw new Error('Kullanıcı oturumu bulunamadı');
      
      // Firebase Authentication profilini güncelle
      await updateUserProfile(currentUser, profileData);
      
      // Yerel kullanıcı verisini güncelle
      setUserData(prev => ({
        ...prev,
        ...profileData
      }));
    } catch (error) {
      console.error('Profil güncelleme işlemi başarısız:', error);
      throw error;
    }
  }

  // Profil fotoğrafını güncelleme (Firestore'da saklama)
  async function updateProfilePhoto(photoBase64) {
    try {
      if (!currentUser) throw new Error('Kullanıcı oturumu bulunamadı');
      
      // Firestore'a profil fotoğrafını kaydet
      await setDocument('users', currentUser.uid, {
        profileImage: photoBase64,
        displayName: userData?.displayName || currentUser.email,
        email: currentUser.email
      }, { merge: true });
      
      // Yerel profil fotoğrafı state'ini güncelle
      setProfileImage(photoBase64);
      
      // Firestore'daki fotoğrafa referans göstermek için bir işaret koy
      const timestamp = Date.now();
      await updateUserProfile(currentUser, { 
        photoURL: `photo-${timestamp}` 
      });
      
      // Kullanıcı verilerini yenilemek için fetchUserData fonksiyonunu çağır
      await fetchUserData(currentUser.uid);
      
    } catch (error) {
      console.error('Profil fotoğrafı güncelleme hatası:', error);
      throw error;
    }
  }

  // Kullanıcı verilerini yenileme
  async function refreshUserData() {
    try {
      if (!currentUser) throw new Error('Kullanıcı oturumu bulunamadı');
      return await fetchUserData(currentUser.uid);
    } catch (error) {
      console.error('Kullanıcı verileri yenilenemedi:', error);
      throw error;
    }
  }

  // Profil fotoğrafını silme
  async function deleteProfilePhoto() {
    try {
      if (!currentUser) throw new Error('Kullanıcı oturumu bulunamadı');
      
      // Firestore'dan profil fotoğrafını kaldır
      await setDocument('users', currentUser.uid, {
        profileImage: null
      }, { merge: true });
      
      // Yerel profil fotoğrafı state'ini temizle
      setProfileImage('');
      
      // Firebase Authentication profilinden referansı kaldır
      await updateUserProfile(currentUser, { photoURL: '' });
      
    } catch (error) {
      console.error('Profil fotoğrafı silme hatası:', error);
      throw error;
    }
  }

  // Firestore'dan kullanıcı verisini getir
  async function fetchUserData(userId) {
    try {
      const data = await getDocument('users', userId);
      if (data) {
        setUserData(data);
        
        // Profil fotoğrafını al
        if (data.profileImage) {
          setProfileImage(data.profileImage);
        }
      }
      return data;
    } catch (error) {
      console.error('Kullanıcı verisi alınamadı:', error);
      return null;
    }
  }

  // Kullanıcı hesabını sil
  async function deleteAccount(password) {
    try {
      if (!currentUser) throw new Error('Kullanıcı oturumu bulunamadı');
      await deleteUserAccount(password);
      // Hesap silindikten sonra userData'yı ve currentUser'ı sıfırla
      setUserData(null);
      setCurrentUser(null);
      setProfileImage('');
    } catch (error) {
      console.error('Hesap silme işlemi başarısız:', error);
      throw error;
    }
  }

  // Auth durumunu takip et
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Kullanıcı oturum açtığında Firestore'dan verilerini getir
        await fetchUserData(user.uid);
      } else {
        setUserData(null);
        setProfileImage('');
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userData,
    profileImage,
    register,
    login,
    logout,
    forgotPassword,
    updateProfile,
    updateProfilePhoto,
    deleteProfilePhoto,
    fetchUserData,
    isAuthenticated: !!currentUser,
    deleteAccount,
    refreshUserData
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 