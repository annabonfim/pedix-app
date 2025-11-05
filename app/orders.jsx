import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { fetchPedidosByComanda, deletarPedido } from '../services/pedidoService';
import { fetchMenuItemById } from '../services/menuService';
import { APP_CONFIG } from '../config/constants';
import { hasSelectedRestaurante } from '../utils/validation';
import { canEditPedido, formatPedidoDate, getTimeRemaining, translateStatus } from '../utils/time';

export default function OrdersScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [pedidos, setPedidos] = useState([]);
  const [tableNumber, setTableNumber] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [itensCache, setItensCache] = useState({}); // Cache de nomes e preços de itens { id: { name, price } }

  useEffect(() => {
    checkRestaurante();
  }, []);

  // Recarrega número da mesa e pedidos sempre que a tela recebe foco
  useFocusEffect(
    useCallback(() => {
      // Primeiro recarrega o número da mesa (pode ter mudado na tela de scan)
      const reload = async () => {
        try {
          const saved = await AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.TABLE_NUMBER);
          if (saved && saved !== tableNumber) {
            setTableNumber(saved);
            // Delay para garantir que API processou o pedido
            setTimeout(() => {
              loadPedidos(parseInt(saved, 10), false);
            }, 500);
          } else if (saved && saved === tableNumber) {
            // Mesma mesa, só recarrega pedidos
            setTimeout(() => {
              loadPedidos(parseInt(saved, 10), false);
            }, 500);
          }
        } catch (e) {
          console.warn('Erro ao recarregar mesa:', e);
        }
      };
      
      reload();
    }, [tableNumber])
  );

  const checkRestaurante = async () => {
    const hasRestaurante = await hasSelectedRestaurante();
    
    if (!hasRestaurante) {
      router.replace('/');
      return;
    }

    loadTableNumber();
  };

  const loadTableNumber = async () => {
    try {
      const saved = await AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.TABLE_NUMBER);
      if (saved) {
        setTableNumber(saved);
        loadPedidos(parseInt(saved, 10));
      } else {
        setLoading(false);
      }
    } catch (e) {
      console.warn('Falha ao carregar número da mesa', e);
      setLoading(false);
    }
  };

  const loadPedidos = async (comandaId, showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const pedidosData = await fetchPedidosByComanda(comandaId);
      
      // Ordena por data mais recente primeiro
      const sortedPedidos = pedidosData.sort((a, b) => {
        const dateA = new Date(a.dataCriacao || 0);
        const dateB = new Date(b.dataCriacao || 0);
        return dateB - dateA;
      });
      
      setPedidos(sortedPedidos);
      
      // Busca nomes e preços dos itens que não têm dados completos
      const itemIdsToFetch = new Set();
      sortedPedidos.forEach((pedido) => {
        if (pedido.itens && Array.isArray(pedido.itens)) {
          pedido.itens.forEach((item) => {
            const itemId = item.itemCardapioId || item.itemCardapio?.id;
            const hasName = item.itemCardapio?.nome || item.itemCardapio?.name;
            const hasPrice = item.itemCardapio?.preco || item.itemCardapio?.price;
            
            // Se não tem nome ou preço E não está no cache, precisa buscar
            if (itemId && (!hasName || !hasPrice) && !itensCache[itemId]) {
              itemIdsToFetch.add(itemId);
            }
          });
        }
      });
      
      // Busca nomes e preços em paralelo
      if (itemIdsToFetch.size > 0) {
        const fetchPromises = Array.from(itemIdsToFetch).map(async (itemId) => {
          try {
            const item = await fetchMenuItemById(itemId);
            return { 
              id: itemId, 
              name: item.name,
              price: item.price || 0,
            };
          } catch (error) {
            console.warn(`Erro ao buscar item ${itemId}:`, error);
            return null;
          }
        });
        
        const results = await Promise.all(fetchPromises);
        const newCache = { ...itensCache };
        results.forEach((result) => {
          if (result) {
            // Armazena nome e preço no cache
            newCache[result.id] = {
              name: result.name,
              price: result.price || 0,
            };
          }
        });
        
        if (Object.keys(newCache).length > Object.keys(itensCache).length) {
          setItensCache(newCache);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      // Só mostra alerta se não estiver apenas atualizando silenciosamente
      if (showLoading) {
        Alert.alert('Erro', 'Não foi possível carregar os pedidos. Verifique sua conexão.');
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    if (tableNumber) {
      setRefreshing(true);
      await loadPedidos(parseInt(tableNumber, 10));
    }
  };

  const handleEditPedido = (pedido) => {
    const canEdit = canEditPedido(pedido, 5);
    
    if (!canEdit) {
      Alert.alert(
        'Tempo Esgotado',
        'Você só pode editar pedidos nos primeiros 5 minutos após o envio.',
        [{ text: 'OK' }]
      );
      return;
    }

    router.push({
      pathname: '/edit-order',
      params: {
        pedidoId: pedido.id.toString(),
        comandaId: tableNumber,
      },
    });
  };

  const handleCancelPedido = (pedido) => {
    const canCancel = canEditPedido(pedido, 5);
    
    if (!canCancel) {
      Alert.alert(
        'Tempo Esgotado',
        'Você só pode cancelar pedidos nos primeiros 5 minutos após o envio.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Cancelar Pedido',
      `Deseja realmente cancelar o pedido #${pedido.id}?`,
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim, Cancelar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletarPedido(pedido.id);
              Alert.alert('Sucesso', 'Pedido cancelado com sucesso!');
              loadPedidos(parseInt(tableNumber, 10));
            } catch (error) {
              Alert.alert(
                'Erro',
                'Não foi possível cancelar o pedido. Tente novamente.'
              );
            }
          },
        },
      ]
    );
  };

  const formatItens = (itens) => {
    if (!itens || !Array.isArray(itens)) return 'Sem itens';
    
    return itens.map((item) => {
      // Tenta pegar nome de diferentes formas
      let nome = item.itemCardapio?.nome || 
                 item.itemCardapio?.name ||
                 item.nome ||
                 item.name ||
                 null;
      
      const itemCardapioId = item.itemCardapioId || item.itemCardapio?.id;
      const quantidade = item.quantidade || 1;
      
      // Se não encontrou nome no objeto, verifica no cache
      if (!nome && itemCardapioId) {
        const cacheData = itensCache[itemCardapioId];
        if (cacheData) {
          nome = typeof cacheData === 'string' ? cacheData : cacheData.name;
        }
      }
      
      // Se ainda não encontrou, usa ID como fallback
      if (!nome && itemCardapioId) {
        nome = `Item ${itemCardapioId}`;
      }
      
      return `${quantidade}x ${nome || 'Item'}`;
    }).join(', ');
  };

  const calculateTotal = (itens) => {
    if (!itens || !Array.isArray(itens)) return 0;
    
    return itens.reduce((sum, item) => {
      // Tenta pegar preço de diferentes formas
      let preco = parseFloat(item.itemCardapio?.preco || 
                             item.itemCardapio?.price ||
                             item.preco ||
                             item.price ||
                             0);
      
      const itemCardapioId = item.itemCardapioId || item.itemCardapio?.id;
      
      // Se não tem preço no objeto, verifica no cache
      if (preco === 0 && itemCardapioId && itensCache[itemCardapioId]) {
        const cacheData = itensCache[itemCardapioId];
        if (typeof cacheData === 'object' && cacheData.price) {
          preco = parseFloat(cacheData.price || 0);
        }
      }
      
      const quantidade = item.quantidade || 1;
      return sum + (preco * quantidade);
    }, 0);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Meus Pedidos</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Carregando pedidos...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meus Pedidos</Text>
        {tableNumber && (
          <Text style={styles.headerSubtitle}>Mesa {tableNumber}</Text>
        )}
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {pedidos.length === 0 ? (
          <Card>
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={64} color="#BDC3C7" />
              <Text style={styles.emptyText}>Nenhum pedido encontrado</Text>
              <Text style={styles.emptySubtext}>
                Faça seu primeiro pedido no cardápio!
              </Text>
              <Button
                title="Ver Cardápio"
                onPress={() => router.push('/menu')}
              />
            </View>
          </Card>
        ) : (
          pedidos.map((pedido) => {
            const canEdit = canEditPedido(pedido, 5);
            const timeRemaining = getTimeRemaining(pedido.dataCriacao, 5);
            const total = calculateTotal(pedido.itens);
            const status = translateStatus(pedido.status);

            return (
              <Card key={pedido.id}>
                <View style={styles.pedidoHeader}>
                  <View>
                    <Text style={styles.pedidoId}>Pedido #{pedido.id}</Text>
                    <Text style={styles.pedidoDate}>
                      {formatPedidoDate(pedido.dataCriacao)}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, getStatusStyle(pedido.status)]}>
                    <Text style={styles.statusText}>{status}</Text>
                  </View>
                </View>

                <View style={styles.pedidoContent}>
                  <Text style={styles.itensText}>{formatItens(pedido.itens)}</Text>
                  
                  {pedido.observacao && (
                    <View style={styles.observacaoContainer}>
                      <Ionicons name="document-text-outline" size={14} color="#7F8C8D" />
                      <Text style={styles.observacaoText}>
                        {pedido.observacao}
                      </Text>
                    </View>
                  )}
                  
                  <Text style={styles.totalText}>Total: R$ {total.toFixed(2)}</Text>
                </View>

                {canEdit && timeRemaining && (
                  <View style={styles.timeRemaining}>
                    <Text style={styles.timeRemainingText}>
                      ⏱️ {timeRemaining}
                    </Text>
                  </View>
                )}

                <View style={styles.pedidoActions}>
                  {canEdit && pedido.status !== 'CANCELADO' && (
                    <View style={styles.actionButtonsRow}>
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => handleEditPedido(pedido)}
                      >
                        <Ionicons name="create-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.editButtonText}>Editar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => handleCancelPedido(pedido)}
                      >
                        <Text style={styles.cancelButtonText}>Cancelar</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  
                  {pedido.status === 'CANCELADO' && (
                    <Text style={styles.canceledText}>Pedido cancelado</Text>
                  )}
                  
                  {!canEdit && pedido.status !== 'CANCELADO' && (
                    <Text style={styles.cantEditText}>
                      Não é possível editar após 5 minutos
                    </Text>
                  )}
                </View>
              </Card>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

function getStatusStyle(status) {
  const styles = {
    PENDENTE: { backgroundColor: '#FFF3CD', borderColor: '#FFC107' },
    PREPARANDO: { backgroundColor: '#D1ECF1', borderColor: '#17A2B8' },
    PRONTO: { backgroundColor: '#D4EDDA', borderColor: '#28A745' },
    ENTREGUE: { backgroundColor: '#E2E3E5', borderColor: '#6C757D' },
    CANCELADO: { backgroundColor: '#F8D7DA', borderColor: '#DC3545' },
  };
  
  return styles[status] || styles.PENDENTE;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#1E3A5F',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
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
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 24,
    textAlign: 'center',
  },
  pedidoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  pedidoId: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
  },
  pedidoDate: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2C3E50',
  },
  pedidoContent: {
    marginBottom: 12,
  },
  itensText: {
    fontSize: 16,
    color: '#2C3E50',
    marginBottom: 8,
  },
  observacaoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  observacaoText: {
    fontSize: 14,
    color: '#7F8C8D',
    fontStyle: 'italic',
    flex: 1,
  },
  totalText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF6B35',
    marginTop: 8,
  },
  timeRemaining: {
    backgroundColor: '#E8F5E9',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  timeRemainingText: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '600',
    textAlign: 'center',
  },
  pedidoActions: {
    marginTop: 8,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    flex: 1,
    backgroundColor: '#FF6B35',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  editButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#DC3545',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  canceledText: {
    fontSize: 14,
    color: '#DC3545',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  cantEditText: {
    fontSize: 12,
    color: '#7F8C8D',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

