import { useState, useEffect, useCallback } from 'react';
import { LogBox } from 'react-native';
import { Tabs, useRouter, useSegments } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';

import { CartProvider } from '../context/CartContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { TuttiChatProvider, useTuttiChat } from '../context/TuttiChatContext';
import { APP_CONFIG, RESTAURANTE_VALIDO_ID } from '../config/constants';
import { clearAllData } from '../utils/storage';
import { requestNotificationPermission, setupAndroidChannel } from '../utils/notifications';
import { logger } from '../utils/logger';

// Suprime o aviso do expo-notifications no Expo Go (SDK 53+): push remoto
// foi removido, mas as notificações LOCAIS — que é tudo o que a gente usa —
// continuam funcionando normalmente. O aviso é só ruído na demo.
LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications (remote notifications)',
  '`expo-notifications` functionality is not fully supported in Expo Go',
]);

// CONFIGURAÇÃO DO TANSTACK QUERY
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 2 * 60 * 1000, // 2 min padrão
    },
  },
});

// AUXILIAR DE ÍCONES
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

// PROTEÇÃO DE ROTAS (redireciona pra login se não autenticado)
function AuthGuard({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    // Telas públicas (não exigem autenticação). "sobre" precisa ficar
    // aqui porque é linkada do login.jsx — sem isso o AuthGuard joga
    // o usuário de volta pra /login no clique.
    const PUBLIC_SCREENS = ['login', 'signup', 'sobre'];
    const inPublicScreen = PUBLIC_SCREENS.includes(segments[0]);
    const inAuthScreen = segments[0] === 'login' || segments[0] === 'signup';

    if (!isAuthenticated && !inPublicScreen) {
      router.replace('/login');
    } else if (isAuthenticated && inAuthScreen) {
      router.replace('/');
    }
  }, [isAuthenticated, loading, segments]);

  return children;
}

// LAYOUT DAS ABAS (muda conforme perfil do usuário)
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
      await setupAndroidChannel();
      await requestNotificationPermission();
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
        {/* href: null esconde a tab da barra (rota continua acessível via push).
            Usamos pra mostrar tabs diferentes por tipo de usuário. */}
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => <Icon name="home" size={size} color={color} />,
            // Sempre visível pra qualquer perfil autenticado. Cliente sem mesa
            // vê só o atalho "Selecionar mesa" na home (o conteúdo já se adapta).
            href: isAuthenticated ? '/' : null,
          }}
        />
        <Tabs.Screen
          name="scan"
          options={{
            title: 'Mesa',
            tabBarIcon: ({ color, size }) => <Icon name="qr" size={size} color={color} />,
            href: isAdmin ? null : undefined, // cliente vê, garçom não
          }}
        />
        <Tabs.Screen
          name="menu"
          options={{
            title: 'Cardápio',
            tabBarIcon: ({ color, size }) => <Icon name="menu" size={size} color={color} />,
            href: (isAdmin || hasRestaurante) ? '/menu' : null,
          }}
        />
        <Tabs.Screen
          name="cart"
          options={{
            title: 'Carrinho',
            tabBarIcon: ({ color, size }) => <Icon name="cart" size={size} color={color} />,
            href: isAdmin ? null : (hasRestaurante ? '/cart' : null), // esconde pra garçom
          }}
        />
        <Tabs.Screen
          name="orders"
          options={{
            title: 'Pedidos',
            tabBarIcon: ({ color, size }) => <Icon name="orders" size={size} color={color} />,
            href: isAdmin ? null : (hasRestaurante ? '/orders' : null),
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
        <Tabs.Screen name="login" options={{ href: null, tabBarStyle: { display: 'none' } }} />
        <Tabs.Screen name="signup" options={{ href: null, tabBarStyle: { display: 'none' } }} />
        <Tabs.Screen name="admin/mesa-pedidos" options={{ href: null }} />
        <Tabs.Screen name="gerente/item-form" options={{ href: null }} />
        <Tabs.Screen name="gerente/relatorios" options={{ href: null }} />
        <Tabs.Screen name="gerente/categorias" options={{ href: null }} />
        <Tabs.Screen name="avaliacoes" options={{ href: null }} />
        <Tabs.Screen name="avaliacao-form" options={{ href: null }} />
        <Tabs.Screen name="historico" options={{ href: null }} />
        <Tabs.Screen name="sobre" options={{ href: null, tabBarStyle: { display: 'none' } }} />
        <Tabs.Screen name="pagamento" options={{ href: null }} />
      </Tabs>
    </CartProvider>
  );
}

// TAP HANDLER DE NOTIFICAÇÕES
// Quando o cliente toca numa notificação local, navegamos pra tela relevante
// baseado em `data.action` que foi setado quando a notif foi disparada.
function NotificationTapHandler() {
  const router = useRouter();
  const { openChat } = useTuttiChat();

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const action = response?.notification?.request?.content?.data?.action;
      logger.log('[NOTIF TAP]', action);
      if (action === 'open_tutti') {
        router.push('/menu');
        // Pequeno delay pra navegação completar antes de abrir o modal
        setTimeout(openChat, 350);
      } else if (action === 'open_orders') {
        router.push('/orders');
      }
    });
    return () => sub.remove();
  }, [router, openChat]);

  return null;
}

// LAYOUT PRINCIPAL
export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TuttiChatProvider>
            <NotificationTapHandler />
            <AuthGuard>
              <TabLayout />
            </AuthGuard>
          </TuttiChatProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}