import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, ScrollView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Dropdown } from '../components/Dropdown';
import { APP_CONFIG, RESTAURANTES } from '../config/constants';
import { isRestauranteValido } from '../utils/validation';
import { logger } from '../utils/logger';

export default function Scan() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [tableNumber, setTableNumber] = useState('');
  const [selectedRestaurante, setSelectedRestaurante] = useState(null);

  useEffect(() => {
    loadSavedData();
  }, []);

  // Recarrega dados sempre que a tela recebe foco
  useFocusEffect(
    useCallback(() => {
      loadSavedData();
    }, [])
  );

  const loadSavedData = async () => {
    try {
      const savedTable = await AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.TABLE_NUMBER);
      if (savedTable) setTableNumber(savedTable);
      
      const savedRestaurante = await AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.RESTAURANTE_ID);
      if (savedRestaurante) {
        const id = parseInt(savedRestaurante, 10);
        setSelectedRestaurante(id);
      }
    } catch (e) {
      logger.warn('Falha ao carregar dados salvos', e);
    }
  };

  const handleTableSubmit = async () => {
    if (!tableNumber) {
      Alert.alert('Erro', 'Por favor, digite o número da mesa');
      return;
    }

    // Valida restaurante selecionado
    if (!selectedRestaurante) {
      Alert.alert('Atenção', 'Por favor, selecione um restaurante');
      return;
    }

    if (!isRestauranteValido(selectedRestaurante)) {
      Alert.alert(
        'Restaurante Indisponível',
        'Este restaurante ainda não está disponível. Por favor, selecione outro.'
      );
      return;
    }
    
    try {
      // Salva restaurante selecionado
      await AsyncStorage.setItem(
        APP_CONFIG.STORAGE_KEYS.RESTAURANTE_ID,
        String(selectedRestaurante)
      );
      
      // Salva número da mesa
      await AsyncStorage.setItem(APP_CONFIG.STORAGE_KEYS.TABLE_NUMBER, tableNumber);
      
      router.push('/menu');
    } catch (e) {
      logger.warn('Falha ao salvar dados', e);
      Alert.alert('Erro', 'Não foi possível salvar os dados. Tente novamente.');
    }
  };

  const handleQRCodePress = () => {
    Alert.alert(
      'Em Breve',
      'O scanner de QR Code será implementado em breve!',
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Conectar à Mesa</Text>
        {params.name && (
          <Text style={styles.welcomeText}>Olá, {params.name}! 👋</Text>
        )}
        <Text style={styles.subtitle}>
          Escaneie o QR Code ou digite o número da mesa
        </Text>

        <Card onPress={handleQRCodePress}>
          <View style={styles.qrPlaceholder}>
            <Text style={styles.qrIcon}>📷</Text>
            <Text style={styles.qrText}>Tocar para escanear QR Code</Text>
            <Text style={styles.qrSubtext}>(Em breve)</Text>
          </View>
        </Card>

        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.dividerText}>OU</Text>
          <View style={styles.line} />
        </View>

        <Card>
          <Text style={styles.label}>Selecione o restaurante</Text>
          <Dropdown
            options={RESTAURANTES}
            selectedValue={selectedRestaurante}
            onSelect={setSelectedRestaurante}
            placeholder="Escolha um restaurante"
          />
        </Card>

        <Card>
          <Text style={styles.label}>Digite o número da mesa</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 5"
            value={tableNumber}
            onChangeText={setTableNumber}
            keyboardType="numeric"
            placeholderTextColor="#95A5A6"
          />
        </Card>

        <Button 
          title="Continuar" 
          onPress={handleTableSubmit}
          disabled={!tableNumber || !selectedRestaurante}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Platform.OS === 'web' ? 20 : 24,
    paddingTop: Platform.OS === 'web' ? 20 : 60,
    paddingBottom: Platform.OS === 'web' ? 40 : 24,
    maxWidth: Platform.OS === 'web' ? 600 : '100%',
    alignSelf: Platform.OS === 'web' ? 'center' : 'stretch',
  },
  title: {
    fontSize: Platform.OS === 'web' ? 24 : 28,
    fontWeight: '700',
    color: '#1E3A5F',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF6B35',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#95A5A6',
    textAlign: 'center',
    marginBottom: 32,
  },
  qrPlaceholder: {
    alignItems: 'center',
    padding: Platform.OS === 'web' ? 24 : 32,
  },
  qrIcon: {
    fontSize: Platform.OS === 'web' ? 48 : 64,
    marginBottom: 16,
  },
  qrText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A5F',
    marginBottom: 4,
  },
  qrSubtext: {
    fontSize: 14,
    color: '#95A5A6',
    fontStyle: 'italic',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#95A5A6',
    fontWeight: '600',
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
    padding: Platform.OS === 'web' ? 12 : 16,
    fontSize: Platform.OS === 'web' ? 14 : 16,
    color: '#2C3E50',
  },
});