import { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../components/Card';
import { ItemImage } from '../components/ItemImage';
import { fetchMenuItems, groupItemsByCategory } from '../services/menuService';
import { APP_CONFIG } from '../config/constants';
import { hasSelectedRestaurante } from '../utils/validation';

export default function Menu() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const scrollRef = useRef(null);
  const categoryRefs = useRef({});
  
  // Ordem fixa das categorias no cardápio
  const CATEGORY_ORDER = ['Pratos', 'Bebidas', 'Sobremesas'];
  
  const [selectedCategory, setSelectedCategory] = useState('Pratos');
  const [tableNumber, setTableNumber] = useState('');
  const [menuData, setMenuData] = useState({});
  const [categories, setCategories] = useState(['Pratos', 'Bebidas', 'Sobremesas']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkRestaurante();
  }, []);

  // Recarrega número da mesa sempre que a tela recebe foco
  useFocusEffect(
    useCallback(() => {
      loadTableNumber();
    }, [])
  );

  const checkRestaurante = async () => {
    try {
      const hasRestaurante = await hasSelectedRestaurante();
      
      if (!hasRestaurante) {
        // Redireciona imediatamente sem mostrar alerta (já está bloqueado na tab)
        router.replace('/');
        return;
      }

      // Se tem restaurante válido, carrega os dados
      await loadTableNumber();
      await loadMenuItems();
    } catch (error) {
      console.error('Erro em checkRestaurante:', error);
      setError('Erro ao verificar restaurante');
      setLoading(false);
    }
  };

  const loadTableNumber = async () => {
    try {
      const saved = await AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.TABLE_NUMBER);
      if (saved) setTableNumber(saved);
    } catch (e) {
      console.warn('Falha ao carregar número da mesa salvo', e);
    }
  };

  const loadMenuItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const items = await fetchMenuItems();
      const grouped = groupItemsByCategory(items);
      setMenuData(grouped);
      
      // Ordena as categorias conforme a ordem definida: Pratos, Bebidas, Sobremesas
      const availableCategories = Object.keys(grouped);
      console.log('📦 Categorias disponíveis da API:', availableCategories);
      
      // Função para normalizar categoria (case-insensitive)
      const normalizeCategory = (cat) => {
        return cat.toLowerCase().trim();
      };
      
      // Função para verificar se duas categorias são equivalentes (singular/plural)
      const categoriesMatch = (cat1, cat2) => {
        const norm1 = normalizeCategory(cat1);
        const norm2 = normalizeCategory(cat2);
        
        // Exatamente igual
        if (norm1 === norm2) return true;
        
        // Uma contém a outra (ex: "prato" contém "pratos" ou vice-versa)
        if (norm1.includes(norm2) || norm2.includes(norm1)) return true;
        
        // Mapeamento específico para singular/plural
        const matches = {
          'prato': ['pratos'],
          'pratos': ['prato'],
          'bebida': ['bebidas'],
          'bebidas': ['bebida'],
          'sobremesa': ['sobremesas'],
          'sobremesas': ['sobremesa'],
        };
        
        const variants1 = matches[norm1] || [];
        const variants2 = matches[norm2] || [];
        
        return variants1.includes(norm2) || variants2.includes(norm1);
      };
      
      // Ordena conforme CATEGORY_ORDER: Pratos, Bebidas, Sobremesas
      const orderedCategories = [];
      
      // Itera na ordem desejada: Pratos, Bebidas, Sobremesas
      CATEGORY_ORDER.forEach(desiredCat => {
        // Procura a categoria correspondente na API
        const foundCategory = availableCategories.find(availCat => 
          categoriesMatch(availCat, desiredCat)
        );
        
        if (foundCategory) {
          orderedCategories.push(foundCategory);
        }
      });
      
      console.log('🔍 Categorias encontradas na ordem:', orderedCategories);
      
      // Adiciona categorias que não estão na ordem definida (caso existam)
      const remainingCategories = availableCategories.filter(cat => 
        !orderedCategories.includes(cat)
      );
      
      const finalCategories = [...orderedCategories, ...remainingCategories];
      
      console.log('✅ Categorias ordenadas FINAIS:', finalCategories);
      
      if (finalCategories.length > 0) {
        setCategories(finalCategories);
        setSelectedCategory(finalCategories[0]);
      }
    } catch (err) {
      console.error('Erro ao carregar cardápio:', err);
      setError('Não foi possível carregar o cardápio. Verifique sua conexão.');
      Alert.alert('Erro', 'Não foi possível carregar o cardápio. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleItemPress = (item) => {
    router.push({
      pathname: '/item',
      params: {
        id: item.id,
        name: item.name,
        price: item.price.toString(),
        image: item.image,
        description: item.description,
        category: item.category,
      }
    });
  };

  const scrollToCategory = (category) => {
    setSelectedCategory(category);
    if (categoryRefs.current[category]) {
      categoryRefs.current[category].measureLayout(
        scrollRef.current,
        (x, y) => {
          scrollRef.current?.scrollTo({ y: y - 10, animated: true });
        },
        () => {}
      );
    }
  };

  const renderItem = ({ item }) => (
    <Card onPress={() => handleItemPress(item)}>
      <View style={styles.itemContainer}>
        <ItemImage source={item.image} emoji={item.image} size={60} />
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemPrice}>
            R$ {item.price.toFixed(2)}
          </Text>
        </View>
        <Text style={styles.addButton}>+</Text>
      </View>
    </Card>
  );

  const renderCategory = (category) => {
    const items = menuData[category] || [];
    if (items.length === 0) return null;
    
    return (
      <View 
        key={category}
        ref={(ref) => (categoryRefs.current[category] = ref)}
        onLayout={() => {}}
      >
        <Text style={styles.categoryTitle}>{category}</Text>
        {items.map(item => (
          <View key={item.id}>
            {renderItem({ item })}
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.tableInfo}>Mesa {tableNumber || '...'}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Carregando cardápio...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.tableInfo}>Mesa {tableNumber || '...'}</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadMenuItems}
          >
            <Text style={styles.retryButtonText}>Tentar Novamente</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.tableInfo}>Mesa {tableNumber || '...'}</Text>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryTab,
              selectedCategory === category && styles.categoryTabActive
            ]}
            onPress={() => scrollToCategory(category)}
          >
            <Text style={[
              styles.categoryTabText,
              selectedCategory === category && styles.categoryTabTextActive
            ]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView 
        ref={scrollRef}
        style={styles.menuScroll}
        contentContainerStyle={styles.menuContent}
      >
        {categories.map(category => renderCategory(category))}
      </ScrollView>

            <TouchableOpacity
              style={styles.cartButton}
              onPress={() => router.push('/cart')}
            >
              <Ionicons name="cart-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.cartButtonText}>Ver Comanda</Text>
            </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#1E3A5F', 
  },
  tableInfo: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#7F8C8D',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#DC3545',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  categoriesContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    maxHeight: 60,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  categoryTab: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryTabActive: {
    backgroundColor: '#FF6B35',
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7F8C8D',
    textAlignVertical: 'center',
    includeFontPadding: false, 
  },
  categoryTabTextActive: {
    color: '#FFFFFF',
  },
  menuScroll: {
    flex: 1,
  },
  menuContent: {
    padding: 16,
  },
  categoryTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2C3E50',
    marginTop: 16,
    marginBottom: 12,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6B35',
  },
  addButton: {
    fontSize: 32,
    color: '#FF6B35',
    fontWeight: '600',
  },
  cartButton: {
    backgroundColor: '#FF6B35',
    padding: 14,
    margin: 16,
    borderRadius: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cartButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
