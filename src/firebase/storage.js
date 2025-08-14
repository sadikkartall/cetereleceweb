import { ref, uploadBytes, getDownloadURL, deleteObject, uploadString } from 'firebase/storage';
import { storage } from './config';

/**
 * Profil resmini Firebase Storage'a yükler
 * @param {File} file - Yüklenecek dosya
 * @param {string} userId - Kullanıcı kimliği
 * @param {number} zoom - Yakınlaştırma seviyesi
 * @returns {Promise<string>} - Yüklenen dosyanın URL'si
 */
export const uploadProfileImage = async (file, userId, zoom = 1) => {
  try {
    console.log('Profil resmi yükleme başlatılıyor...', { userId, zoom });
    
    // Profil resmi için referans oluştur - users/{userId}/profile.jpg path'ini kullan
    const storageRef = ref(storage, `users/${userId}/profile.jpg`);
    
    // Dosya türünü ve içeriğini kontrol et
    if (!file || !file.type) {
      throw new Error('Geçersiz dosya türü veya boş dosya');
    }
    
    // Dosya verilerini ön işleme tabi tutma
    let processedFile;
    try {
      processedFile = await processImageFile(file, zoom);
      console.log('Resim işlendi:', processedFile instanceof Blob);
    } catch (processError) {
      console.error('Resim işleme hatası:', processError);
      // İşleme hatası oluşursa orijinal dosyayı kullan
      processedFile = file;
    }
    
    // Dosyayı yükle
    console.log('Dosya yükleniyor...');
    const snapshot = await uploadBytes(storageRef, processedFile);
    console.log('Yükleme tamamlandı:', snapshot);
    
    // Yüklenen dosyanın URL'sini al
    const downloadURL = await getDownloadURL(storageRef);
    console.log('Download URL alındı:', downloadURL);
    
    return downloadURL;
  } catch (error) {
    console.error('Profil resmi yükleme hatası:', error);
    console.error('Hata detayları:', { 
      code: error.code, 
      message: error.message,
      name: error.name,
      stack: error.stack 
    });
    throw error;
  }
};

/**
 * Base64 formatındaki profil resmini Firebase Storage'a yükler
 * @param {string} base64Image - Base64 formatındaki resim verisi
 * @param {string} userId - Kullanıcı kimliği
 * @returns {Promise<string>} - Yüklenen dosyanın URL'si
 */
export const uploadProfileImageFromBase64 = async (base64Image, userId) => {
  try {
    if (!base64Image) {
      throw new Error('Base64 resim verisi boş');
    }
    
    if (!userId) {
      throw new Error('Kullanıcı kimliği belirtilmedi');
    }
    
    console.log('Profil fotoğrafı yükleme başlatılıyor...', { userId });
    
    // Profil resmi için referans oluştur - users/{userId}/profile.jpg path'ini kullan
    const storageRef = ref(storage, `users/${userId}/profile.jpg`);
    
    console.log('Storage referansı oluşturuldu');
    
    // Data URL olarak yükle
    try {
      console.log('Upload string çağrılıyor...');
      const snapshot = await uploadString(storageRef, base64Image, 'data_url');
      console.log('Upload string tamamlandı:', snapshot);
    } catch (uploadError) {
      console.error('Upload string hatası:', uploadError);
      console.error('Upload string hata detayları:', { 
        code: uploadError.code, 
        message: uploadError.message,
        name: uploadError.name
      });
      throw uploadError;
    }
    
    // Yüklenen dosyanın URL'sini al
    try {
      console.log('Download URL alınıyor...');
      const downloadURL = await getDownloadURL(storageRef);
      console.log('Download URL alındı:', downloadURL);
      return downloadURL;
    } catch (urlError) {
      console.error('Download URL alma hatası:', urlError);
      console.error('URL hata detayları:', { 
        code: urlError.code, 
        message: urlError.message,
        name: urlError.name
      });
      throw urlError;
    }
  } catch (error) {
    console.error('Profil resmi yükleme hatası:', error);
    throw error;
  }
};

/**
 * Base64 formatındaki profil resmini doğrudan uploadString kullanarak Firebase Storage'a yükler
 * @param {string} base64Image - Base64 formatındaki resim verisi
 * @param {string} userId - Kullanıcı kimliği 
 * @returns {Promise<string>} - Yüklenen dosyanın URL'si
 */
export const uploadStringAsBase64 = async (base64Image, userId) => {
  try {
    console.log('uploadString ile yükleme başlatılıyor...');
    // users/{userId}/profile.jpg path'ini kullan
    const storageRef = ref(storage, `users/${userId}/profile.jpg`);
    
    // Önce data URL mı kontrol et
    if (!base64Image.startsWith('data:')) {
      throw new Error('Geçersiz base64 formatı, "data:" ile başlamalı');
    }
    
    // İçerik tipini doğrula
    const matches = base64Image.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('Base64 formatı geçerli değil');
    }
    
    const contentType = matches[1];
    console.log('İçerik tipi:', contentType);
    
    // Sadece görüntü dosyalarına izin ver
    if (!contentType.startsWith('image/')) {
      throw new Error('Sadece görüntü dosyalarına izin verilir');
    }
    
    // Data URL olarak yükle
    console.log('Yükleme başlıyor, data URL uzunluğu:', base64Image.length);
    const snapshot = await uploadString(storageRef, base64Image, 'data_url');
    console.log('uploadString ile yükleme tamamlandı:', snapshot);
    
    // URL'yi al
    const downloadURL = await getDownloadURL(storageRef);
    console.log('Upload String ile URL alındı:', downloadURL);
    
    return downloadURL;
  } catch (error) {
    console.error('uploadString hatası:', error);
    throw error;
  }
};

/**
 * Base64 formatındaki resmi blob'a dönüştürür
 * @param {string} base64Image - Base64 formatındaki resim verisi
 * @returns {Promise<Blob>} - Blob formatındaki resim
 */
const base64ToBlob = async (base64Image) => {
  try {
    // Data URL formatını kontrol et (örn: "data:image/jpeg;base64,/9j/4AAQ...")
    if (!base64Image.startsWith('data:')) {
      throw new Error('Geçersiz base64 formatı');
    }
    
    // Veri URL'sinden content-type ve base64 kısmını ayır
    const matches = base64Image.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    
    if (!matches || matches.length !== 3) {
      throw new Error('Base64 formatı geçerli değil');
    }
    
    const contentType = matches[1];
    const base64Data = matches[2];
    
    // Base64'ü binary dizisine çevir
    const byteCharacters = atob(base64Data);
    const byteArrays = [];
    
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      
      byteArrays.push(new Uint8Array(byteNumbers));
    }
    
    // Blob oluştur
    return new Blob(byteArrays, { type: contentType });
  } catch (error) {
    console.error('Base64 -> Blob dönüşüm hatası:', error);
    
    // Alternatif yöntem dene (fetch API)
    try {
      const base64Response = await fetch(base64Image);
      return await base64Response.blob();
    } catch (fetchError) {
      console.error('Fetch API ile dönüşüm de başarısız:', fetchError);
      throw error; // Orijinal hatayı fırlat
    }
  }
};

/**
 * Resmi işler (boyutlandırma, sıkıştırma gibi işlemler için hazır)
 * @param {File} file - İşlenecek dosya
 * @param {number} zoom - Yakınlaştırma seviyesi
 * @returns {Promise<Blob>} - İşlenmiş dosya
 */
const processImageFile = async (file, zoom = 1) => {
  // Burada resmi işleme kodları eklenebilir
  return file;
};

/**
 * Profil resmini Firebase Storage'dan siler
 * @param {string} userId - Kullanıcı kimliği
 * @returns {Promise<void>}
 */
export const deleteProfileImage = async (userId) => {
  try {
    // Profil resmi referansını oluştur - users/{userId}/profile.jpg path'ini kullan
    const storageRef = ref(storage, `users/${userId}/profile.jpg`);
    
    // Dosyayı sil
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Profil resmi silme hatası:', error);
    throw error;
  }
};

/**
 * Genel dosya yükleme fonksiyonu - Doğrudan yükle
 * @param {File} file - Yüklenecek dosya
 * @param {string} path - Storage yolu
 * @returns {Promise<string>} - Yüklenen dosyanın URL'si
 */
export const uploadFile = async (file, path) => {
  try {
    const storageRef = ref(storage, path);
    
    // File tipini al
    const fileReader = new FileReader();
    const dataUrl = await new Promise((resolve, reject) => {
      fileReader.onload = () => resolve(fileReader.result);
      fileReader.onerror = reject;
      fileReader.readAsDataURL(file);
    });
    
    // Data URL olarak yükle
    await uploadString(storageRef, dataUrl, 'data_url');
    
    // URL'yi al
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error('Dosya yükleme hatası:', error);
    throw error;
  }
}; 