import { db } from '../firebase/config';
import { doc, setDoc, deleteDoc, getDocs, collection, getDoc } from 'firebase/firestore';

// Takip et
export const followUser = async (currentUserId, targetUserId) => {
  // Takip edilenin followers'ına ekle
  await setDoc(doc(db, 'users', targetUserId, 'followers', currentUserId), {
    userId: currentUserId,
    followedAt: new Date()
  });
  // Takip edenin following'ine ekle
  await setDoc(doc(db, 'users', currentUserId, 'following', targetUserId), {
    userId: targetUserId,
    followedAt: new Date()
  });
};

// Takibi bırak
export const unfollowUser = async (currentUserId, targetUserId) => {
  await deleteDoc(doc(db, 'users', targetUserId, 'followers', currentUserId));
  await deleteDoc(doc(db, 'users', currentUserId, 'following', targetUserId));
};

// Takip durumunu kontrol et
export const isFollowing = async (currentUserId, targetUserId) => {
  const followDoc = await getDoc(doc(db, 'users', currentUserId, 'following', targetUserId));
  return followDoc.exists();
};

// Takipçi ve takip edilen sayılarını çek
export const getFollowersCount = async (userId) => {
  const snapshot = await getDocs(collection(db, 'users', userId, 'followers'));
  return snapshot.size;
};

export const getFollowingCount = async (userId) => {
  const snapshot = await getDocs(collection(db, 'users', userId, 'following'));
  return snapshot.size;
}; 