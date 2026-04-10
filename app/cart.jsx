import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput, Modal } from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ItemImage } from '../components/ItemImage';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { createPedido } from '../services/pedidoService';
import { APP_CONFIG } from '../config/constants';
import { hasSelectedRestaurante } from '../utils/validation';
import { colors } from '../styles/theme';
import { logger } from '../utils/logger';

export default function CartScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { cartItems, removeFromCart, updateItemQuantity, updateItemObservacao, clearCart } = useCart();
  const { theme, toggleTheme } = useTheme();
  const [tableNumber, setTableNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingObservacaoIndex, setEditingObservacaoIndex] = useState(null);
  const [editingObservacaoText, setEditingObservacaoText] = useState('');

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
    const hasRestaurante = await hasSelectedRestaurante();
    
    if (!hasRestaurante) {
      // Redireciona imediatamente sem mostrar alerta (já está bloqueado na tab)
      router.replace('/');
      return;
    }

    // Se tem restaurante válido, carrega os dados
    loadTableNumber();
  };

  const loadTableNumber = async () => {
    try {
      const saved = await AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.TABLE_NUMBER);
      if (saved) setTableNumber(saved);
    } catch (e) {
      logger.warn('Falha ao carregar número da mesa salvo', e);
    }
  };

  const handleRemoveItem = (index) => {
    Alert.alert(
      'Remover Item',
      'Deseja remover este item da comanda?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => removeFromCart(index)
        }
      ]
    );
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => {
      const quantity = item.quantity || 1;
      return sum + (item.price * quantity);
    }, 0);
  };

  const handleQuantityChange = (index, delta) => {
    const currentQuantity = cartItems[index].quantity || 1;
    const newQuantity = currentQuantity + delta;
    updateItemQuantity(index, newQuantity);
  };

  const handleEditObservacao = (index) => {
    const item = cartItems[index];
    setEditingObservacaoText(item.observacao || '');
    setEditingObservacaoIndex(index);
  };

  const handleSaveObservacao = () => {
    if (editingObservacaoIndex !== null) {
      updateItemObservacao(editingObservacaoIndex, editingObservacaoText);
      setEditingObservacaoIndex(null);
      setEditingObservacaoText('');
    }
  };

  const handleCancelObservacao = () => {
    setEditingObservacaoIndex(null);
    setEditingObservacaoText('');
  };

  const handleConfirmOrder = async () => {
    if (!tableNumber) {
      Alert.alert('Erro', 'Número da mesa não identificado. Volte e informe a mesa.');
      return;
    }

    Alert.alert(
      'Confirmar Pedido',
      `Total: R$ ${calculateTotal().toFixed(2)}\n\nDeseja enviar o pedido para a cozinha?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            await submitOrder();
          }
        }
      ]
    );
  };

  const submitOrder = async () => {
    try {
      setIsSubmitting(true);
      
      const comandaId = parseInt(tableNumber, 10);
      if (isNaN(comandaId)) {
        throw new Error('Número da mesa inválido');
      }

      // Agrupa itens por ID e observação, somando quantidades
      const itemsMap = {};
      const observacoes = [];
      
      cartItems.forEach((item) => {
        const quantity = item.quantity || 1;
        const observacao = item.observacao || null;
        const key = `${item.id}_${observacao || 'sem_obs'}`;
        
        // Coleta observações únicas
        if (observacao && !observacoes.includes(observacao)) {
          observacoes.push(observacao);
        }
        
        // Agrupa itens por ID e observação
        if (itemsMap[key]) {
          itemsMap[key].quantity += quantity;
        } else {
          itemsMap[key] = {
            id: item.id,
            quantity: quantity,
          };
        }
      });

      const items = Object.values(itemsMap);
      
      // Junta todas as observações em uma string
      const observacaoGeral = observacoes.length > 0 
        ? observacoes.join(' | ') 
        : '';

      // Cria o pedido na API
      await createPedido(comandaId, items, observacaoGeral);

      Alert.alert('Sucesso!', 'Pedido enviado para a cozinha! 🎉');
      clearCart();
      router.push('/orders');
    } catch (error) {
      logger.error('Erro ao enviar pedido:', error);
      Alert.alert(
        'Erro',
        error.message || 'Não foi possível enviar o pedido. Verifique sua conexão e tente novamente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.header }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push('/menu')}
        >
          <Text style={[styles.backArrow, { color: theme.headerText }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.headerText }]}>Comanda - Mesa {tableNumber}</Text>
        <TouchableOpacity style={styles.backButton} onPress={toggleTheme}>
          <Ionicons
            name={theme.mode === 'dark' ? 'sunny-outline' : 'moon-outline'}
            size={20} color={theme.headerText}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {cartItems.length === 0 ? (
          <Card>
            <View style={styles.emptyCart}>
              <Ionicons name="cart-outline" size={64} color={theme.textMuted} />
              <Text style={[styles.emptyCartText, { color: theme.textSecondary }]}>Sua comanda está vazia</Text>
              <Button
                title="Ver Cardápio"
                onPress={() => router.push('/menu')}
              />
            </View>
          </Card>
        ) : (
          <>
            {cartItems.map((item, index) => {
              const quantity = item.quantity || 1;
              const itemTotal = item.price * quantity;
              
              return (
                <Card key={index}>
                  <View style={styles.cartItem}>
                    <ItemImage source={item.image} emoji={item.image} size={60} />
                    <View style={styles.itemContent}>
                      <Text style={[styles.itemName, { color: theme.text }]}>{item.name}</Text>
                      <Text style={styles.itemPrice}>
                        R$ {item.price.toFixed(2)} {quantity > 1 && `× ${quantity} = R$ ${itemTotal.toFixed(2)}`}
                      </Text>
                      
                      {/* Observação */}
                      <View style={styles.observacaoContainer}>
                        {item.observacao ? (
                          <View style={styles.observacaoWithIcon}>
                            <Ionicons name="document-text-outline" size={14} color="#7F8C8D" />
                            <Text style={styles.observacaoText}>
                              {item.observacao}
                            </Text>
                          </View>
                        ) : (
                          <Text style={styles.observacaoPlaceholder}>
                            Sem observação
                          </Text>
                        )}
                        <TouchableOpacity
                          style={styles.editObservacaoButton}
                          onPress={() => handleEditObservacao(index)}
                        >
                          <Ionicons name="create-outline" size={18} color="#FF6B35" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    
                    {/* Controles de quantidade */}
                    <View style={styles.quantityControls}>
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => handleQuantityChange(index, -1)}
                      >
                        <Text style={styles.quantityButtonText}>-</Text>
                      </TouchableOpacity>
                      <Text style={[styles.quantityText, { color: theme.text }]}>{quantity}</Text>
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => handleQuantityChange(index, 1)}
                      >
                        <Text style={styles.quantityButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                    
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemoveItem(index)}
                    >
                      <Ionicons name="trash-outline" size={20} color="#DC3545" />
                    </TouchableOpacity>
                  </View>
                </Card>
              );
            })}

            <Card>
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>Total</Text>
                <Text style={[styles.totalValue, { color: theme.text }]}>R$ {calculateTotal().toFixed(2)}</Text>
              </View>
            </Card>
          </>
        )}
      </ScrollView>

      {cartItems.length > 0 && (
        <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          <Button
            title={isSubmitting ? 'Enviando...' : 'Enviar Pedido'}
            onPress={handleConfirmOrder}
            disabled={isSubmitting}
          />
          {isSubmitting && (
            <ActivityIndicator size="small" color="#FF6B35" style={{ marginTop: 8 }} />
          )}
        </View>
      )}

      {/* Modal para editar observação */}
      <Modal
        visible={editingObservacaoIndex !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCancelObservacao}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Editar Observação</Text>
            <TextInput
              style={[styles.modalInput, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
              placeholder="Digite uma observação (opcional)"
              value={editingObservacaoText}
              onChangeText={setEditingObservacaoText}
              multiline
              numberOfLines={4}
              placeholderTextColor={colors.textMuted}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={handleCancelObservacao}
              >
                <Text style={styles.modalButtonTextCancel}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave]}
                onPress={handleSaveObservacao}
              >
                <Text style={styles.modalButtonTextSave}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#1E3A5F',
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
    textAlign: 'center',
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  emptyCart: {
    alignItems: 'center',
    padding: 32,
  },
  emptyCartText: {
    fontSize: 18,
    color: '#7F8C8D',
    marginBottom: 24,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemContent: {
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
    marginBottom: 8,
  },
  observacaoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  observacaoWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  observacaoText: {
    fontSize: 12,
    color: '#7F8C8D',
    fontStyle: 'italic',
    flex: 1,
  },
  observacaoPlaceholder: {
    fontSize: 12,
    color: '#BDC3C7',
    fontStyle: 'italic',
    flex: 1,
  },
  editObservacaoButton: {
    marginLeft: 8,
    padding: 4,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    gap: 8,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6B35',
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
    color: '#2C3E50',
    minWidth: 30,
    textAlign: 'center',
  },
  removeButton: {
    marginLeft: 8,
    padding: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 16,
    color: '#7F8C8D',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  totalRowFinal: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  totalLabelFinal: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C3E50',
  },
  totalValueFinal: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF6B35',
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#2C3E50',
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#E8E8E8',
  },
  modalButtonSave: {
    backgroundColor: '#FF6B35',
  },
  modalButtonTextCancel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  modalButtonTextSave: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});