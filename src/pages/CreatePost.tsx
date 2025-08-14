import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

const CreatePost = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigation = useNavigation();
  const { user } = useAuth();

  const handleCreatePost = async () => {
    if (!title.trim() || !content.trim()) {
      setError('Başlık ve içerik alanları zorunludur');
      return;
    }

    try {
      setError('');
      setLoading(true);

      await firestore().collection('posts').add({
        title: title.trim(),
        content: content.trim(),
        author: user?.displayName || 'Anonim',
        authorId: user?.uid,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

      navigation.goBack();
    } catch (err) {
      setError('Gönderi oluşturulurken bir hata oluştu');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Yeni Gönderi Oluştur</Text>
        
        {error ? <Text style={styles.error}>{error}</Text> : null}
        
        <TextInput
          label="Başlık"
          value={title}
          onChangeText={setTitle}
          style={styles.input}
        />
        
        <TextInput
          label="İçerik"
          value={content}
          onChangeText={setContent}
          style={styles.input}
          multiline
          numberOfLines={6}
        />
        
        <Button
          mode="contained"
          onPress={handleCreatePost}
          loading={loading}
          disabled={loading}
          style={styles.button}
        >
          Gönderi Oluştur
        </Button>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 12,
  },
  error: {
    color: 'red',
    marginBottom: 12,
    textAlign: 'center',
  },
});

export default CreatePost; 