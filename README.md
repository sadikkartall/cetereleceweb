CetereleceNet – Web Uygulaması Dokümantasyonu
Bu doküman, yalnızca web (React) uygulamasına yöneliktir. Mobil/React Native dosyaları ve Expo yapılandırmaları kapsam dışıdır.

Genel Bakış
CetereleceNet; React tabanlı, Firebase altyapısını kullanan modern bir sosyal platform arayüzüdür. Kimlik doğrulama, gönderi oluşturma/görüntüleme, profil yönetimi ve zengin metin düzenleme gibi özellikler sunar.

Özellikler
Kullanıcı kayıt/giriş (E-posta/şifre, Google, GitHub, Twitter)
Gönderi oluşturma ve detay sayfası (Tiptap editör desteği)
Beğeni, yorum, takip servis katmanı (API servisleri)
Profil sayfası ve profil fotoğrafı yükleme
Tema yönetimi (MUI + özel tema context)
İstemci tarafı yönlendirme (React Router v6)
Teknoloji Yığını
Programlama dilleri: JavaScript (ES6+), TypeScript (TS/TSX – bazı bileşenler)
UI: React 18, Material UI (MUI)
Yönlendirme: React Router v6 (src/routes.js)
Zengin metin editörü: Tiptap (src/components/TiptapEditor.js)
Durum/yapı: React Context API (src/contexts/AuthContext.*, src/contexts/ThemeContext.*)
Backend-as-a-Service: Firebase (Auth, Firestore, Storage)
Araçlar: CRA (react-scripts), Jest, ESLint, Prettier
Bağlantı: GitHub – sadikkartall/cetereleceweb

Sistem Gereksinimleri
Node.js 16+ (önerilen LTS)
npm veya yarn
Kurulum
# Bağımlılıkları kurun
npm install

# Geliştirme sunucusunu başlatın
npm start

# Üretim derlemesi
npm run build

# Testler
npm test

# Kod kalitesi
npm run lint
npm run format
Ortam Değişkenleri (.env)
Firebase yapılandırması, .env üzerinden aşağıdaki anahtarlarla sağlanır. CRA gereği değişkenler REACT_APP_ önekiyle başlar. Örnek:

REACT_APP_FIREBASE_API_KEY=...
REACT_APP_FIREBASE_AUTH_DOMAIN=...
REACT_APP_FIREBASE_PROJECT_ID=...
REACT_APP_FIREBASE_STORAGE_BUCKET=...
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...
REACT_APP_FIREBASE_APP_ID=...
REACT_APP_FIREBASE_MEASUREMENT_ID=...
Uygulama bu değişkenleri src/firebase/config.js içinde kullanır ve Firebase App’i başlatır.

Firebase Kurulumu
Firebase projesi oluşturun (Console).
Web App ekleyin, yukarıdaki .env anahtarlarını alın ve .env dosyasına ekleyin.
Authentication: Email/Password ve kullanacağınız OAuth sağlayıcılarını etkinleştirin (Google, GitHub, Twitter).
Firestore: Veritabanını başlatın (Production/Test mod seçeceğinize göre kuralları ayarlayın).
Storage: Depolamayı başlatın. Bu depoda profil fotoğrafları gibi içerikler saklanır.
CORS: firebase.json içerisinde Storage için CORS örneği bulunmaktadır. Gerekliyse firebase storage:rules ve CORS yapılandırmalarını uygulayın.
Notlar:

Web tarafında kullanılan Firebase giriş noktaları: src/firebase/config.js, src/firebase/auth.js, src/firebase/firestore.js, src/firebase/storage.js.
Yönlendirme (Routes)
Yönlendirme src/routes.js üzerinden yönetilir. Başlıca yollar:

/ Ana sayfa
/login Giriş
/register Kayıt
/create-post Gönderi oluşturma
/post/:postId Gönderi detayı
/profile Profilim, /profile/:userId Diğer kullanıcı profil
/settings Ayarlar
/about, /privacy-policy, /terms, /contact
/admin/migration Veri taşıma araçları (yönetim)
Navbar ve Footer tüm sayfalarda ortak olarak yer alır.

Proje Yapısı (Özet)
public/
  index.html
src/
  index.js            # React giriş noktası
  App.js              # Uygulama bileşeni
  routes.js           # Route ağacı ve tema sağlayıcı
  index.css           # Global stiller
  components/         # Navbar, Footer, Tiptap editor vb.
  pages/              # Home, Login, Register, CreatePost, PostDetail, Profile, Settings...
  contexts/           # AuthContext, ThemeContext
  firebase/           # config, auth, firestore, storage servisleri
  services/           # postService, userService, likeService, commentService, followService...
  admin/              # MigrationTools (opsiyonel yönetim araçları)
Kod Kalitesi
ESLint: npm run lint
Prettier: npm run format
Jest testleri: npm test
Dağıtım (Opsiyonel)
Firebase Hosting, Netlify veya Vercel gibi hizmetler kullanılabilir.
CRA için üretim çıktısı build/ klasörüne alınır (npm run build).
Firebase Hosting kullanacaksanız firebase.json içine hosting yapılandırması eklenmeli ve firebase init hosting ile kurulum yapılmalıdır.
Güvenlik ve Kurallar
Firestore ve Storage kurallarını üretim senaryosuna uygun şekilde ayarlayın.
Storage için örnek kurallar storage.rules dosyasındadır.
Lisans
Bu depoda lisans dosyası belirtilmemiştir. Gerekliyse uygun bir lisans ekleyiniz.
