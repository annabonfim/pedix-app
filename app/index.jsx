import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Image } from 'react-native';
import { useRouter } from 'expo-router'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { APP_CONFIG } from '../config/constants';

export default function Home() {
  const router = useRouter(); 
  const [name, setName] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const savedName = await AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.USER_NAME);
        if (savedName) setName(savedName);
      } catch (e) {
        console.warn('Falha ao carregar nome salvo', e);
      }
    })();
  }, []);

  const handleStart = async () => {
    try {
      const trimmed = name.trim();
      if (trimmed.length > 0) {
        await AsyncStorage.setItem(APP_CONFIG.STORAGE_KEYS.USER_NAME, trimmed);
      }

      router.push('/scan');
    } catch (e) {
      console.warn('Falha ao salvar dados', e);
      router.push('/scan');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Image 
          source={require('../assets/pedix-mascot.png')} 
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.subtitle}>Seu cardápio inteligente</Text>
      </View>

      <Card>
        <Text style={styles.label}>Boas-vindas! Qual é seu nome? (opcional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Digite seu primeiro nome"
          value={name}
          onChangeText={setName}
          placeholderTextColor="#95A5A6"
        />
      </Card>

      <Button title="Continuar" onPress={handleStart} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#95A5A6',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    padding: 16,
    fontSize: 16,
    color: '#2C3E50',
  },
});
