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
import { uploadProfileImageFromBase64, deleteProfileImage } from '../firebase/storage';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileImage, setProfileImage] = useState('');
  const navigate = useNavigate();

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

  // Profil fotoğrafını güncelleme (Firebase Storage'da saklama)
  async function updateProfilePhoto(photoBase64) {
    try {
      if (!currentUser) throw new Error('Kullanıcı oturumu bulunamadı');
      
      // Firebase Storage'a profil fotoğrafını yükle
      const photoURL = await uploadProfileImageFromBase64(photoBase64, currentUser.uid);
      
      if (!photoURL) {
        throw new Error('Fotoğraf URL alınamadı');
      }
      
      // Önce yerel state'i güncelle (kullanıcı deneyimi için)
      setProfileImage(photoURL);
      
      // Firestore'a profil fotoğrafı URL'sini kaydet
      const userData = {
        photoURL: photoURL,
        updatedAt: new Date()
      };
      
      await setDocument('users', currentUser.uid, userData, { merge: true });
      
      // Firebase Authentication profilini güncelle
      await updateUserProfile(currentUser, { 
        photoURL: photoURL 
      });
      
      // Kullanıcı verilerini yenilemek için fetchUserData fonksiyonunu çağır
      await fetchUserData(currentUser.uid);
      
      return photoURL;
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
      
      try {
        // Firebase Storage'dan profil fotoğrafını sil
        await deleteProfileImage(currentUser.uid);
      } catch (storageError) {
        // Eğer dosya zaten silinmişse veya bulunamazsa, bu hatayı görmezden gel
        if (storageError.code !== 'storage/object-not-found') {
          throw storageError;
        }
        console.log('Profil fotoğrafı zaten silinmiş veya bulunamadı');
      }
      
      // Firestore'dan profil fotoğrafı URL'sini kaldır
      const updatedUserData = {
        photoURL: '',
        updatedAt: new Date()
      };
      
      await setDocument('users', currentUser.uid, updatedUserData, { merge: true });
      
      // Yerel state'leri güncelle
      setProfileImage('');
      setUserData(prev => ({ ...prev, photoURL: '' }));
      
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
        // Firestore'daki photoURL varsa, hem userData'ya hem profileImage'e ata
        setUserData(prev => ({ ...prev, ...data, photoURL: data.photoURL || prev?.photoURL || '' }));
        if (data.photoURL) {
          setProfileImage(data.photoURL);
        } else if (currentUser?.photoURL) {
          setProfileImage(currentUser.photoURL);
        }
      } else if (currentUser?.photoURL) {
        setProfileImage(currentUser.photoURL);
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
    setUserData,
    loading,
    profileImage,
    setProfileImage,
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