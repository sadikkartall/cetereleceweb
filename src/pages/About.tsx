import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card } from 'react-native-paper';

const About = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Hakkında</Text>
        
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Uygulama Hakkında</Text>
            <Text style={styles.text}>
              Ceterelece, kullanıcıların düşüncelerini ve deneyimlerini paylaşabilecekleri
              bir sosyal platformdur. Bu uygulama, insanların birbirleriyle etkileşime
              geçmesini ve bilgi paylaşımını kolaylaştırmayı amaçlamaktadır.
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Özellikler</Text>
            <Text style={styles.text}>
              • Gönderi paylaşma ve düzenleme{'\n'}
              • Kullanıcı profilleri{'\n'}
              • Bildirim sistemi{'\n'}
              • Karanlık mod desteği{'\n'}
              • Çoklu dil desteği
            </Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Versiyon</Text>
            <Text style={styles.text}>1.0.0</Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>İletişim</Text>
            <Text style={styles.text}>
              Soru, öneri ve şikayetleriniz için bize ulaşabilirsiniz.{'\n\n'}
              E-posta: info@ceterelece.com{'\n'}
              Web: www.ceterelece.com
            </Text>
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
  },
});

export default About; 