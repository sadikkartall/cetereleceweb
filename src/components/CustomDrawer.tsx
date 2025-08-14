import React from 'react';
import { View, StyleSheet } from 'react-native';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';

const CustomDrawer: React.FC<any> = (props) => {
  const navigation = useNavigation();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Çıkış yapılırken hata oluştu:', error);
    }
  };

  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.drawerContent}>
        <DrawerItem
          icon={({ color, size }) => (
            <MaterialIcons name="home" color={color} size={size} />
          )}
          label="Ana Sayfa"
          onPress={() => navigation.navigate('MainTabs')}
        />
        <DrawerItem
          icon={({ color, size }) => (
            <MaterialIcons name="settings" color={color} size={size} />
          )}
          label="Ayarlar"
          onPress={() => navigation.navigate('Settings')}
        />
        <DrawerItem
          icon={({ color, size }) => (
            <MaterialIcons name="info" color={color} size={size} />
          )}
          label="Hakkında"
          onPress={() => navigation.navigate('About')}
        />
        <DrawerItem
          icon={({ color, size }) => (
            <MaterialIcons name="contact-support" color={color} size={size} />
          )}
          label="İletişim"
          onPress={() => navigation.navigate('Contact')}
        />
        <DrawerItem
          icon={({ color, size }) => (
            <MaterialIcons name="exit-to-app" color={color} size={size} />
          )}
          label="Çıkış Yap"
          onPress={handleSignOut}
        />
      </View>
    </DrawerContentScrollView>
  );
};

const styles = StyleSheet.create({
  drawerContent: {
    flex: 1,
    paddingTop: 20,
  },
});

export default CustomDrawer; 