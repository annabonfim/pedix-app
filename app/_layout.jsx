import { useState, useEffect, useCallback } from 'react';
import { Tabs, useRouter, useSegments } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { CartProvider } from '../context/CartContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { APP_CONFIG, RESTAURANTE_VALIDO_ID } from '../config/constants';
import { clearAllData } from '../utils/storage';

// QUERY CLIENT 
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 2 * 60 * 1000, // 2 min padrão
    },
  },
});

//  ICON HELPER 
const Icon = ({ name, size, color }) => {
  const icons = {
    home: 'home-outline',
    qr: 'qr-code-outline',
    menu: 'restaurant-outline',
    cart: 'cart-outline',
    orders: 'receipt-outline',
  };
  return <Ionicons name={icons[name] || 'ellipse-outline'} size={size || 20} color={color || '#666'} />;
};

//  AUTH GUARD (dentro de AuthProvider) 
function AuthGuard({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inAuthScreen = segments[0] === 'login' || segments[0] === 'signup';

    if (!isAuthenticated && !inAuthScreen) {
      router.replace('/login');
    } else if (isAuthenticated && inAuthScreen) {
      router.replace('/');
    }
  }, [isAuthenticated, loading, segments]);

  return children;
}

//  TABS LAYOUT 
function TabLayout() {
  const [hasRestaurante, setHasRestaurante] = useState(false);
  const { isAuthenticated, isAdmin, user } = useAuth();
  const { theme } = useTheme();

  const checkRestaurante = useCallback(async () => {
    try {
      const restauranteId = await AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.RESTAURANTE_ID);
      const isValid = restauranteId && parseInt(restauranteId, 10) === RESTAURANTE_VALIDO_ID;
      setHasRestaurante(isValid);
    } catch {
      setHasRestaurante(false);
    }
  }, []);

  useEffect(() => {
    let interval;

    const init = async () => {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        // Descomente para limpar dados em dev:
        // await clearAllData();
      }
      await checkRestaurante();
      interval = setInterval(checkRestaurante, 1000);
    };

    init();
    return () => { if (interval) clearInterval(interval); };
  }, [checkRestaurante]);

  return (
    <CartProvider>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: theme.primary,
          tabBarInactiveTintColor: theme.textSecondary,
          tabBarStyle: {
            backgroundColor: theme.tabBar,
            borderTopWidth: 1,
            borderTopColor: theme.tabBarBorder,
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
            tabBarIcon: ({ color, size }) => <Icon name="home" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="scan"
          options={{
            title: 'Mesa',
            tabBarIcon: ({ color, size }) => <Icon name="qr" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="menu"
          options={{
            title: 'Cardápio',
            tabBarIcon: ({ color, size }) => <Icon name="menu" size={size} color={color} />,
            href: hasRestaurante ? '/menu' : null,
          }}
        />
        <Tabs.Screen
          name="cart"
          options={{
            title: 'Carrinho',
            tabBarIcon: ({ color, size }) => <Icon name="cart" size={size} color={color} />,
            href: hasRestaurante ? '/cart' : null,
          }}
        />
        <Tabs.Screen
          name="orders"
          options={{
            title: 'Pedidos',
            tabBarIcon: ({ color, size }) => <Icon name="orders" size={size} color={color} />,
            href: hasRestaurante ? '/orders' : null,
          }}
        />
        {/* Tab exclusiva do garçom/admin */}
        <Tabs.Screen
          name="admin/mesas"
          options={{
            title: 'Mesas',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="grid-outline" size={size} color={color} />
            ),
            href: isAdmin ? '/admin/mesas' : null, // invisível para clientes
          }}
        />

        {/* Telas sem tab bar */}
        <Tabs.Screen name="item" options={{ href: null }} />
        <Tabs.Screen name="edit-order" options={{ href: null }} />
        <Tabs.Screen name="login" options={{ href: null }} />
        <Tabs.Screen name="signup" options={{ href: null }} />
        <Tabs.Screen name="admin/mesa-pedidos" options={{ href: null }} />
      </Tabs>
    </CartProvider>
  );
}

//  ROOT LAYOUT 
export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <AuthGuard>
            <TabLayout />
          </AuthGuard>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}