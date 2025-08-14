import { initializeApp } from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// Firebase yapılandırma bilgileri
const firebaseConfig = {
  apiKey: "AIzaSyD5h-Ezu83f1KqhVhUjJMhClTXBdBLup20",
  authDomain: "ceterelecenet.firebaseapp.com",
  projectId: "ceterelecenet",
  storageBucket: "ceterelecenet.firebasestorage.app",
  messagingSenderId: "424785111488",
  appId: "1:424785111488:web:c997563cefd7b65918c025",
  measurementId: "G-ZFWF6EV9JD"
};

// Firebase'i başlat
const app = initializeApp(firebaseConfig);

export { app, auth, firestore }; 