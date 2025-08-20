## CetereleceNet – Web Uygulaması

Firebase üzerinde çalışan modern bir sosyal içerik platformu (web). Kullanıcılar kayıt olabilir, gönderi oluşturabilir, beğenebilir, yorum yapabilir, yazarları takip edebilir ve profillerini yönetebilir.

### Özellikler
- Kullanıcı kayıt/giriş (Firebase Auth; e‑posta/şifre ve opsiyonel OAuth sağlayıcıları)
- Gönderi oluşturma/detay (Tiptap zengin metin editörü)
- Beğeni, yorum, yer imi ve takip (Firestore koleksiyonları)
- Profil ve profil fotoğrafı yükleme (Firebase Storage)
- Tema ve modern arayüz (Material UI)
- İstemci tarafı yönlendirme (React Router v6)

### Teknoloji Yığını
- Diller: JavaScript (ES6+), kısmen TypeScript (TS/TSX)
- UI: React 18, Material UI (MUI)
- Durum/Yapı: React Context API (Auth/Theme)
- Backend-as-a-Service: Firebase (Auth, Firestore, Storage)
- Araçlar: CRA (react-scripts), Jest, ESLint, Prettier

### Gereksinimler
- Node.js 16+ (LTS önerilir)
- npm veya yarn

### Kurulum ve Çalıştırma
```bash
# Bağımlılıklar
npm install

# Geliştirme
npm start

# Üretim derlemesi
npm run build

# Test
npm test

# Kod kalitesi
npm run lint
npm run format
```

### Ortam Değişkenleri (.env)
Create React App gereği değişkenler `REACT_APP_` önekiyle başlamalıdır. Kök dizinde `.env` oluşturun:
```bash
REACT_APP_FIREBASE_API_KEY=YOUR_API_KEY
REACT_APP_FIREBASE_AUTH_DOMAIN=YOUR_PROJECT.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
REACT_APP_FIREBASE_STORAGE_BUCKET=YOUR_PROJECT.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=XXXXXXXXXXXX
REACT_APP_FIREBASE_APP_ID=1:XXXXXXXXXXXX:web:XXXXXXXXXXXX
REACT_APP_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```
Uygulama bu anahtarları `src/firebase/config.js` içinde kullanır ve Firebase’e bağlanır.

### Firebase Kurulumu (Özet)
1) Firebase Console’da proje oluşturun ve Web App ekleyin.
2) Üstteki `.env` anahtarlarını alın ve kökte `.env` dosyasına ekleyin.
3) Authentication: Email/Password ve kullanacağınız OAuth sağlayıcılarını etkinleştirin.
4) Firestore: Veritabanını başlatın ve kuralları ihtiyaca göre ayarlayın.
5) Storage: Depolamayı başlatın (profil fotoğrafları ve medya burada tutulur).
6) CORS/Rules: `firebase.json` ve `storage.rules` dosyalarındaki örnekleri ihtiyacınıza göre uygulayın.

### Uygulama Nasıl Kullanılır?
- Giriş/Kayıt: `/login` veya `/register` sayfalarından oturum açın.
- Gönderi Oluşturma: `/create-post` üzerinden başlık, içerik ve isterseniz görsel ekleyin.
- Beğeni/Yorum: Gönderi kartlarındaki aksiyonlar ile etkileşime geçin.
- Yer İmi (Kaydet): Gönderileri daha sonra okumak için kaydedin.
- Takip: Yazarları takip edin; “Takip Edilenler” sekmesinde içeriklerini görün.
- Arama: Üst arama alanından gönderi veya kullanıcı arayın.
- Trend: Yan panelde trend başlıkları görüntüleyin.

### Yönlendirme (Başlıca Rotalar)
- `/` Ana sayfa
- `/login`, `/register`
- `/create-post`
- `/post/:postId`
- `/profile`, `/profile/:userId`
- `/settings`, `/about`, `/privacy-policy`, `/terms`, `/contact`

### Proje Yapısı (Özet)
```
public/
  index.html
src/
  index.js            # React giriş noktası
  App.js / App.tsx    # Uygulama bileşeni
  routes.js           # Route ağacı ve tema sağlayıcı
  index.css           # Global stiller
  components/         # Navbar, Footer, Tiptap editor vb.
  pages/              # Home, Login, Register, CreatePost, PostDetail, Profile, Settings...
  contexts/           # AuthContext, ThemeContext
  firebase/           # config, auth, firestore, storage servisleri
  services/           # postService, userService, likeService, commentService, followService...
  admin/              # MigrationTools (opsiyonel araçlar)
```

### NPM Script’leri
- Geliştirme: `npm start`
- Derleme: `npm run build`
- Test: `npm test`
- Lint: `npm run lint`
- Format: `npm run format`

### Dağıtım
- Netlify/Vercel: `npm run build` sonrası `build/` klasörünü dağıtın.
- Firebase Hosting:
  - `firebase init hosting` (hosting yapılandırması ekleyin)
  - `npm run build`
  - `firebase deploy`

### Sorun Giderme
- Boş sayfa/403: `.env` anahtarlarını ve Firebase proje izinlerini doğrulayın.
- Firestore izin hatası: Güvenlik kuralları ve kullanıcı oturumunu kontrol edin.
- Storage yükleme/CORS: `firebase.json` içindeki CORS yapılandırmasını uygulayın.
- Node sürümü: 16+ önerilir; sorun yaşarsanız LTS sürüme geçin.

### Güvenlik Notları
- `.env`, `node_modules/`, `build/` gibi dizinler `.gitignore` ile versiyon kontrolü dışında tutulur.
- Üretim Firestore/Storage kurallarını minimum ayrıcalık ilkesiyle ayarlayın.

### Bağlantılar
- Repo: `https://github.com/sadikkartall/cetereleceweb`

### Lisans
Bu depoda lisans belirtilmemiştir. İhtiyacınıza uygun bir lisans dosyası ekleyebilirsiniz.
