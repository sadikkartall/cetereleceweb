import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, ActivityIndicator, IconButton } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  authorId: string;
  createdAt: any;
}

const PostDetail = () => {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { postId } = route.params as { postId: string };

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const postDoc = await firestore()
          .collection('posts')
          .doc(postId)
          .get();

        if (postDoc.exists) {
          setPost({ id: postDoc.id, ...postDoc.data() } as Post);
        } else {
          setError('Gönderi bulunamadı');
        }
      } catch (err) {
        setError('Gönderi yüklenirken bir hata oluştu');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  const handleDelete = async () => {
    try {
      await firestore().collection('posts').doc(postId).delete();
      navigation.goBack();
    } catch (err) {
      setError('Gönderi silinirken bir hata oluştu');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>{post.title}</Text>
        <Text style={styles.author}>Yazar: {post.author}</Text>
        <Text style={styles.date}>
          {post.createdAt?.toDate().toLocaleDateString()}
        </Text>
        <Text style={styles.content}>{post.content}</Text>

        {user?.uid === post.authorId && (
          <View style={styles.actions}>
            <IconButton
              icon="delete"
              size={24}
              onPress={handleDelete}
              style={styles.deleteButton}
            />
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  author: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#999',
    marginBottom: 16,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  deleteButton: {
    backgroundColor: '#ffebee',
  },
  error: {
    color: 'red',
    textAlign: 'center',
  },
});

export default PostDetail; 