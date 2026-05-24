import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { ItemImage } from '../components/ItemImage';
import { fetchPedidoById, atualizarPedido } from '../services/pedidoService';
import { fetchMenuItems, fetchMenuItemById } from '../services/menuService';
import { pedidoKeys } from '../hooks/usePedidos';
import { canEditPedido } from '../utils/time';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../styles/theme';
import { logger } from '../utils/logger';

export default function EditOrderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { pedidoId } = params;
  const queryClient = useQueryClient();
  const { theme } = useTheme();
  const shortId = pedidoId ? String(pedidoId).slice(-4).toUpperCase() : '';
  const s = makeStyles(theme);
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pedidoOriginal, setPedidoOriginal] = useState(null);
  const [itensPedido, setItensPedido] = useState([]);
  const [menuItens, setMenuItens] = useState([]);
  const [observacao, setObservacao] = useState('');

  useEffect(() => {
    // Limpa estado anterior quando pedidoId muda
    setItensPedido([]);
    setObservacao('');
    setLoading(true);
    
    if (pedidoId) {
      loadData();
    }
  }, [pedidoId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Limpa estado anterior
      setItensPedido([]);
      setObservacao('');
      
      logger.log('🔄 Carregando pedido #' + pedidoId);
      
      // Carrega pedido original
      const pedido = await fetchPedidoById(pedidoId);
      
      logger.log('📦 Pedido carregado:', {
        id: pedido.id,
        itensCount: pedido.itens?.length || 0,
        itens: pedido.itens,
      });
      
      setPedidoOriginal(pedido);
      
      // Verifica se é o pedido correto
      if (String(pedido.id) !== String(pedidoId)) {
        logger.error('❌ ID do pedido não confere!', {
          esperado: pedidoId,
          recebido: pedido.id,
        });
        Alert.alert('Erro', 'Pedido não encontrado ou ID incorreto.');
        router.push('/orders');
        return;
      }
      
      // Valida que tem itens
      const itensDoPedido = pedido.itens || [];
      logger.log('📝 Itens do pedido na API:', itensDoPedido);
      
      if (itensDoPedido.length === 0) {
        logger.warn('⚠️ Pedido sem itens!');
        setItensPedido([]);
        setObservacao(pedido.observacao || '');
        setLoading(false);
        return;
      }
      
      // Converte itens do pedido para formato editável
      const itensPromises = itensDoPedido.map(async (item, index) => {
        const itemCardapioId = item.itemCardapioId || item.itemCardapio?.id;
        const quantidade = item.quantidade || 1;
        
        logger.log(`  Item ${index}:`, {
          itemCardapioId,
          quantidade,
          temNome: !!item.itemCardapio?.nome,
          temPreco: !!item.itemCardapio?.preco,
        });
        
        // Se já tem os dados completos, usa eles
        if (item.itemCardapio?.nome && item.itemCardapio?.preco) {
          return {
            id: itemCardapioId?.toString() || String(itemCardapioId),
            name: item.itemCardapio.nome,
            price: parseFloat(item.itemCardapio.preco || 0),
            quantity: quantidade,
            image: item.itemCardapio.imagemUrl || '🍽️',
          };
        }
        
        // Se não tem dados completos, busca da API
        if (itemCardapioId) {
          try {
            logger.log(`  Buscando item completo ${itemCardapioId}...`);
            const itemCompleto = await fetchMenuItemById(itemCardapioId);
            logger.log(`  ✅ Item ${itemCardapioId} carregado:`, {
              name: itemCompleto.name,
              price: itemCompleto.price,
            });
            
            return {
              id: itemCardapioId.toString(),
              name: itemCompleto.name || `Item ${itemCardapioId}`,
              price: parseFloat(itemCompleto.price || 0),
              quantity: quantidade,
              image: itemCompleto.image || itemCompleto.imageUrl || '🍽️',
            };
          } catch (error) {
            logger.warn(`  ❌ Erro ao buscar item ${itemCardapioId}:`, error);
            // Fallback com dados básicos
            return {
              id: itemCardapioId.toString(),
              name: `Item ${itemCardapioId}`,
              price: 0,
              quantity: quantidade,
              image: '🍽️',
            };
          }
        }
        
        // Fallback final
        logger.warn(`  ⚠️ Item sem ID:`, item);
        return {
          id: itemCardapioId?.toString() || '0',
          name: `Item ${itemCardapioId || 'Desconhecido'}`,
          price: 0,
          quantity: quantidade,
          image: '🍽️',
        };
      });
      
      const itens = await Promise.all(itensPromises);
      
      logger.log('✅ Itens processados:', itens);
      logger.log('📋 Quantidade de itens no pedido:', itens.length);
      
      // Filtra apenas itens válidos (com ID)
      const itensValidos = itens.filter(item => item && item.id);
      
      if (itensValidos.length !== itens.length) {
        logger.warn('⚠️ Alguns itens foram filtrados!', {
          original: itens.length,
          validos: itensValidos.length,
        });
      }
      
      setItensPedido(itensValidos);
      setObservacao(pedido.observacao || '');
      
      // Carrega itens do menu para adicionar novos
      const menu = await fetchMenuItems();
      setMenuItens(menu);
    } catch (error) {
      logger.error('❌ Erro ao carregar dados:', error);
      Alert.alert('Erro', 'Não foi possível carregar o pedido. Tente novamente.');
      router.push('/orders');
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (index, delta) => {
    const newItens = [...itensPedido];
    newItens[index].quantity = Math.max(1, newItens[index].quantity + delta);
    setItensPedido(newItens);
  };

  const handleRemoveItem = (index) => {
    Alert.alert(
      'Remover Item',
      'Deseja remover este item do pedido?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => {
            const newItens = itensPedido.filter((_, i) => i !== index);
            setItensPedido(newItens);
          },
        },
      ]
    );
  };

  const handleAddItem = (item) => {
    // Verifica se item já existe
    const existingIndex = itensPedido.findIndex((i) => i.id === item.id);
    
    if (existingIndex >= 0) {
      // Aumenta quantidade se já existe
      const newItens = [...itensPedido];
      newItens[existingIndex].quantity += 1;
      setItensPedido(newItens);
    } else {
      // Adiciona novo item
      setItensPedido([...itensPedido, { ...item, quantity: 1 }]);
    }
  };

  const calculateTotal = () => {
    return itensPedido.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleSave = async () => {
    if (itensPedido.length === 0) {
      Alert.alert('Atenção', 'O pedido deve ter pelo menos um item.');
      return;
    }

    Alert.alert(
      'Salvar Alterações',
      `Total atualizado: R$ ${calculateTotal().toFixed(2)}\n\nDeseja salvar as alterações?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salvar',
          onPress: async () => {
            try {
              setSaving(true);

              if (!user?.id) {
                throw new Error('Usuário não autenticado. Faça login novamente.');
              }

              // Backend espera Guid do cliente, não o número da mesa.
              // O `comandaId` no params é só o número da mesa (legacy),
              // usado pra invalidar cache.
              // Também incluímos `price` em cada item — o pedidoService
              // converte em precoMomento (sem isso vira 0).
              const items = itensPedido.map((item) => ({
                id: item.id,
                quantity: item.quantity,
                price: item.price,
              }));

              await atualizarPedido(pedidoId, user.id, items, observacao.trim());

              queryClient.invalidateQueries({ queryKey: pedidoKeys.byCliente(user.id) });
              queryClient.invalidateQueries({ queryKey: pedidoKeys.detail(pedidoId) });

              Alert.alert(
                'Sucesso!',
                'Pedido atualizado com sucesso! 🎉',
                [
                  {
                    text: 'OK',
                    onPress: () => router.push('/orders'),
                  },
                ]
              );
            } catch (error) {
              logger.error('Erro ao atualizar pedido:', error);
              Alert.alert(
                'Erro',
                'Não foi possível atualizar o pedido. Tente novamente.'
              );
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={s.container}>
        <View style={s.header}>
          <TouchableOpacity
            style={s.backButton}
            onPress={() => router.push('/orders')}
          >
            <Text style={s.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Editar Pedido</Text>
          <View style={s.backButton} />
        </View>
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={s.loadingText}>Carregando pedido...</Text>
        </View>
      </View>
    );
  }

  if (!pedidoOriginal) {
    return (
      <View style={s.container}>
        <View style={s.header}>
          <TouchableOpacity
            style={s.backButton}
            onPress={() => router.push('/orders')}
          >
            <Text style={s.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Editar Pedido</Text>
          <View style={s.backButton} />
        </View>
        <Card>
          <Text style={s.errorText}>Pedido não encontrado</Text>
          <Button title="Voltar" onPress={() => router.push('/orders')} />
        </Card>
      </View>
    );
  }

  const canEdit = canEditPedido(pedidoOriginal, 5);

  if (!canEdit) {
    return (
      <View style={s.container}>
        <View style={s.header}>
          <TouchableOpacity
            style={s.backButton}
            onPress={() => router.push('/orders')}
          >
            <Text style={s.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Editar Pedido</Text>
          <View style={s.backButton} />
        </View>
        <Card>
          <Text style={s.errorText}>
            Este pedido não pode mais ser editado. O prazo de 5 minutos expirou.
          </Text>
          <Button title="Voltar" onPress={() => router.push('/orders')} />
        </Card>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity
          style={s.backButton}
          onPress={() => router.push('/orders')}
        >
          <Text style={s.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Editar Pedido #{shortId}</Text>
        <View style={s.backButton} />
      </View>

      <ScrollView style={s.content} contentContainerStyle={s.contentContainer}>
        {/* Itens do pedido */}
        <Text style={s.sectionTitle}>Itens do Pedido</Text>
        
        {itensPedido.map((item, index) => (
          <Card key={`${item.id}-${index}`}>
            <View style={s.itemRow}>
              <ItemImage source={item.image} emoji={item.image} size={60} />
              <View style={s.itemInfo}>
                <Text style={s.itemName}>{item.name}</Text>
                <Text style={s.itemPrice}>R$ {item.price.toFixed(2)}</Text>
              </View>
              <View style={s.quantityControls}>
                <TouchableOpacity
                  style={s.quantityButton}
                  onPress={() => handleQuantityChange(index, -1)}
                >
                  <Text style={s.quantityButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={s.quantityText}>{item.quantity}</Text>
                <TouchableOpacity
                  style={s.quantityButton}
                  onPress={() => handleQuantityChange(index, 1)}
                >
                  <Text style={s.quantityButtonText}>+</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={s.removeButton}
                onPress={() => handleRemoveItem(index)}
              >
                <Ionicons name="trash-outline" size={20} color="#DC3545" />
              </TouchableOpacity>
            </View>
          </Card>
        ))}

        {/* Adicionar novos itens */}
        <Text style={s.sectionTitle}>Adicionar Itens</Text>
        
        {menuItens.map((item) => (
          <Card key={item.id} onPress={() => handleAddItem(item)}>
            <View style={s.itemRow}>
              <ItemImage source={item.image} emoji={item.image} size={50} />
              <View style={s.itemInfo}>
                <Text style={s.itemName}>{item.name}</Text>
                <Text style={s.itemPrice}>R$ {item.price.toFixed(2)}</Text>
              </View>
              <Text style={s.addButton}>+</Text>
            </View>
          </Card>
        ))}

        {/* Observação */}
        <Text style={s.sectionTitle}>Observação</Text>
        <Card>
          <TextInput
            style={s.observacaoInput}
            placeholder="Digite uma observação (opcional)"
            value={observacao}
            onChangeText={setObservacao}
            multiline
            numberOfLines={3}
            placeholderTextColor="#95A5A6"
          />
        </Card>

        {/* Total */}
        <Card>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Total</Text>
            <Text style={s.totalValue}>R$ {calculateTotal().toFixed(2)}</Text>
          </View>
        </Card>
      </ScrollView>

      <View style={s.footer}>
        <Button
          title={saving ? 'Salvando...' : 'Salvar Alterações'}
          onPress={handleSave}
          disabled={saving || itensPedido.length === 0}
        />
      </View>
    </View>
  );
}

function makeStyles(theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      paddingTop: 50,
      backgroundColor: colors.navy, // header navy fixo (visual de branding)
    },
    backButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backArrow: {
      fontSize: 28,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: '#FFFFFF',
      flex: 1,
      textAlign: 'center',
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
      color: theme.textSecondary,
    },
    errorText: {
      fontSize: 16,
      color: '#DC3545',
      textAlign: 'center',
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.text,
      marginTop: 16,
      marginBottom: 12,
    },
    itemRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    itemInfo: {
      flex: 1,
      marginLeft: 12,
    },
    itemName: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 4,
    },
    itemPrice: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    quantityControls: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 8,
    },
    quantityButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.orange,
      alignItems: 'center',
      justifyContent: 'center',
    },
    quantityButtonText: {
      fontSize: 18,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    quantityText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      marginHorizontal: 12,
      minWidth: 30,
      textAlign: 'center',
    },
    removeButton: {
      padding: 8,
    },
    addButton: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.orange,
      marginLeft: 8,
    },
    observacaoInput: {
      backgroundColor: theme.inputBackground,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 12,
      fontSize: 16,
      color: theme.text,
      minHeight: 80,
      textAlignVertical: 'top',
    },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    totalLabel: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.text,
    },
    totalValue: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.orange,
    },
    footer: {
      padding: 16,
      backgroundColor: theme.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
  });
}

