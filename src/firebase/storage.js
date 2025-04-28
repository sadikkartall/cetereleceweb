import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
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
    
    // Profil resmi için referans oluştur
    const storageRef = ref(storage, `profile_images/${userId}`);
    
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
 * Profil resmini Firebase Storage'dan siler
 * @param {string} userId - Kullanıcı kimliği
 * @returns {Promise<void>}
 */
export const deleteProfileImage = async (userId) => {
  try {
    // Profil resmi referansını oluştur
    const storageRef = ref(storage, `profile_images/${userId}`);
    
    // Dosyayı sil
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Profil resmi silme hatası:', error);
    throw error;
  }
};

/**
 * Dosya nesnesini işler (yeniden boyutlandırma, zoom, vs.)
 * @param {File} file - İşlenecek dosya
 * @param {number} zoom - Yakınlaştırma seviyesi
 * @returns {Promise<Blob>} - İşlenmiş dosya (Blob olarak)
 */
const processImageFile = async (file, zoom) => {
  return new Promise((resolve, reject) => {
    try {
      // Basit kontrol - dosya formatı problemi olabileceğinden direkt file dönelim
      if (zoom === 1) {
        console.log('Zoom değeri 1, direkt dosyayı kullanıyoruz');
        return resolve(file);
      }
      
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const img = new Image();
        
        img.onload = () => {
          try {
            // Canvas oluştur
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Canvas boyutunu ayarla (sabit boyut: 500x500)
            canvas.width = 500;
            canvas.height = 500;
            
            // Resmin oranlarını hesapla
            const size = Math.min(img.width, img.height);
            const x = (img.width - size) / 2;
            const y = (img.height - size) / 2;
            
            // Zoom seviyesini uygula
            const scaledSize = size / zoom;
            const scaledX = x + (size - scaledSize) / 2;
            const scaledY = y + (size - scaledSize) / 2;
            
            // Arkaplanı temizle
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Resmi kare olarak kes ve canvas'a çiz
            ctx.drawImage(
              img,
              scaledX, scaledY, scaledSize, scaledSize,
              0, 0, canvas.width, canvas.height
            );
            
            // Canvas'ı Blob'a dönüştür
            canvas.toBlob((blob) => {
              if (blob) {
                console.log('Canvas başarıyla Blob\'a dönüştürüldü');
                resolve(blob);
              } else {
                console.error('Blob oluşturulamadı');
                // Blob oluşturulamazsa orijinal dosyayı kullan
                resolve(file);
              }
            }, file.type || 'image/jpeg');
          } catch (canvasError) {
            console.error('Canvas işleme hatası:', canvasError);
            // Herhangi bir canvas hatası durumunda orijinal dosyayı kullan
            resolve(file);
          }
        };
        
        img.onerror = (imgError) => {
          console.error('Resim yüklenirken hata:', imgError);
          resolve(file);
        };
        
        img.src = event.target.result;
      };
      
      reader.onerror = (readerError) => {
        console.error('Dosya okunamadı:', readerError);
        resolve(file);
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Genel resim işleme hatası:', error);
      resolve(file);
    }
  });
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
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error('Dosya yükleme hatası:', error);
    throw error;
  }
}; 