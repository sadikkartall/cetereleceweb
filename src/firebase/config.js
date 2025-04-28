import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Firebase yapılandırması
const firebaseConfig = {
  apiKey: "AIzaSyD5h-Ezu83f1KqhVhUjJMhClTXBdBLup20",
  authDomain: "ceterelecenet.firebaseapp.com",
  projectId: "ceterelecenet",
  storageBucket: "ceterelecenet.appspot.com",
  messagingSenderId: "424785111488",
  appId: "1:424785111488:web:c997563cefd7b65918c025",
  measurementId: "G-ZFWF6EV9JD"
};

// Firebase'i başlat
const app = initializeApp(firebaseConfig);

// Firestore, Authentication ve Storage servisleri
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
const analytics = getAnalytics(app);

export { db, auth, storage, analytics };
export default app; 