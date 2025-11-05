import { useState, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartProvider } from '../context/CartContext';
import { APP_CONFIG, RESTAURANTE_VALIDO_ID } from '../config/constants';

const Icon = ({ name, size, color }) => {
  const icons = {
    home: 'home-outline',
    qr: 'qr-code-outline',
    menu: 'restaurant-outline',
    cart: 'cart-outline',
    orders: 'receipt-outline',
  };

  const iconName = icons[name] || 'ellipse-outline';
  const s = size || 20;
  const c = color || '#666';

  return (
    <Ionicons name={iconName} size={s} color={c} />
  );
};

export default function TabLayout() {
  const [hasRestaurante, setHasRestaurante] = useState(false);

  useEffect(() => {
    // Verifica se tem restaurante selecionado
    const checkRestaurante = async () => {
      try {
        const restauranteId = await AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.RESTAURANTE_ID);
        const isValid = restauranteId && parseInt(restauranteId, 10) === RESTAURANTE_VALIDO_ID;
        setHasRestaurante(isValid);
      } catch (error) {
        setHasRestaurante(false);
      }
    };

    checkRestaurante();
    
    // Verifica periodicamente (a cada 1 segundo)
    const interval = setInterval(checkRestaurante, 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <CartProvider>
      <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FF6B35',
        tabBarInactiveTintColor: '#95A5A6',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
          paddingBottom: 10,
          paddingTop: 8,
          marginBottom: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Mesa',
          tabBarIcon: ({ color, size }) => (
            <Icon name="qr" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Cardápio',
          tabBarIcon: ({ color, size }) => (
            <Icon name="menu" size={size} color={color} />
          ),
          href: hasRestaurante ? '/menu' : null,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Carrinho',
          tabBarIcon: ({ color, size }) => (
            <Icon name="cart" size={size} color={color} />
          ),
          href: hasRestaurante ? '/cart' : null,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Pedidos',
          tabBarIcon: ({ color, size }) => (
            <Icon name="orders" size={size} color={color} />
          ),
          href: hasRestaurante ? '/orders' : null,
        }}
      />
      <Tabs.Screen
        name="item"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="edit-order"
        options={{
          href: null,
        }}
      />
    </Tabs>
    </CartProvider>
  );
}
