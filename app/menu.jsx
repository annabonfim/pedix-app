// app/menu.jsx
import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useMenuItems, useDeleteMenuItem } from '../hooks/useMenuItems';
import { useCart } from '../context/CartContext';
import { ItemImage } from '../components/ItemImage';
import { colors, shared, radius, typography } from '../styles/theme';
import { CATEGORIES } from '../config/constants';

const ALL = { value: null, label: 'Todos' };
const CATS = [ALL, ...CATEGORIES];

export default function MenuScreen() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { logout, isGerente } = useAuth();
  const { addItem, cartCount } = useCart();
  const deleteMutation = useDeleteMenuItem();

  const [selectedCat, setSelectedCat] = useState(ALL);
  const [search, setSearch] = useState('');

  const { data: items = [], isLoading, refetch, isFetching } = useMenuItems(
    selectedCat.value
  );

  const handleDelete = (item) => {
    Alert.alert(
      'Remover item',
      `Deseja remover "${item.name}" do cardápio?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(item.id);
              Alert.alert('Sucesso', 'Item removido do cardápio.');
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível remover o item.');
            }
          },
        },
      ]
    );
  };

  const categoryOrder = { PRATO: 0, BEBIDA: 1, SOBREMESA: 2 };

  const filtered = items
    .filter(item =>
      item.available !== false &&
      (search === '' || item.name.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      const oa = categoryOrder[(a.category || '').toUpperCase()] ?? 99;
      const ob = categoryOrder[(b.category || '').toUpperCase()] ?? 99;
      return oa - ob;
    });

  return (
    <View style={[shared.screen, { backgroundColor: theme.background }]}>

      {/* Header */}
      <View style={[s.header, { backgroundColor: colors.navy }]}>
        <View style={s.headerRow}>
          <View>
            <Text style={shared.headerTitle}>Cardápio</Text>
            <Text style={shared.headerSub}>Mesa selecionada · Italiano</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity onPress={toggleTheme} style={{ padding: 4 }}>
              <Ionicons
                name={theme.mode === 'dark' ? 'sunny-outline' : 'moon-outline'}
                size={20} color="rgba(255,255,255,0.75)"
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={logout} style={{ padding: 4 }}>
              <Ionicons name="log-out-outline" size={20} color="rgba(255,255,255,0.75)" />
            </TouchableOpacity>
            <TouchableOpacity style={s.cartBtn} onPress={() => router.push('/cart')}>
              <Ionicons name="cart-outline" size={22} color="#FFFFFF" />
              {cartCount > 0 && (
                <View style={s.cartBadge}>
                  <Text style={s.cartBadgeText}>{cartCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Busca */}
        <View style={s.searchRow}>
          <Ionicons name="search-outline" size={16} color={colors.textSub} style={s.searchIcon} />
          <TextInput
            style={[s.searchInput, { color: theme.text }]}
            placeholder="Buscar no cardápio..."
            placeholderTextColor={colors.textMuted}
            value={search} onChangeText={setSearch}
          />
          {search !== '' && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={colors.textSub} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categorias */}
      <View style={[s.catBar, { backgroundColor: theme.surface, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.catScroll}>
          {CATS.map(cat => (
            <TouchableOpacity
              key={cat.label}
              style={[s.chip, selectedCat.value === cat.value && s.chipActive]}
              onPress={() => setSelectedCat(cat)}
            >
              <Text style={[s.chipText, selectedCat.value === cat.value && s.chipTextActive]}>{cat.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Lista de itens */}
      {isLoading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.orange} />
          <Text style={[s.loadingText, { color: theme.textSecondary }]}>Carregando cardápio...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.list}>
          {isGerente && (
            <TouchableOpacity
              style={s.newItemBtn}
              onPress={() => router.push('/gerente/item-form')}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle" size={22} color="#FFFFFF" />
              <Text style={s.newItemBtnText}>Adicionar novo item ao cardápio</Text>
            </TouchableOpacity>
          )}
          {filtered.length === 0 ? (
            <View style={s.empty}>
              <Ionicons name="restaurant-outline" size={56} color={colors.textMuted} />
              <Text style={[s.emptyText, { color: theme.text }]}>Nenhum item encontrado</Text>
            </View>
          ) : (
            filtered.map(item => (
              <TouchableOpacity
                key={item.id}
                style={[s.itemCard, { backgroundColor: theme.surface, borderColor: colors.border }]}
                onPress={() => router.push({ pathname: '/item', params: { id: item.id, name: item.name, price: String(item.price), description: item.description || '', image: item.image || '' } })}
                activeOpacity={0.8}
              >
                <View style={[s.itemEmoji, { backgroundColor: theme.background }]}>
                  <ItemImage source={item.image} size={30} />
                </View>
                <View style={s.itemInfo}>
                  <Text style={[s.itemName, { color: theme.text }]}>{item.name}</Text>
                  {item.description ? (
                    <Text style={[s.itemDesc, { color: theme.textSecondary }]} numberOfLines={2}>
                      {item.description}
                    </Text>
                  ) : null}
                  <View style={s.itemFooter}>
                    <Text style={[typography.price, { color: colors.orange }]}>
                      R$ {item.price.toFixed(2)}
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {isGerente && (
                        <>
                          <TouchableOpacity
                            style={[s.actionBtn, { backgroundColor: colors.blue }]}
                            onPress={() => router.push({
                              pathname: '/gerente/item-form',
                              params: {
                                id: item.id,
                                name: item.name,
                                price: String(item.price),
                                category: item.category,
                                description: item.description || '',
                                image: item.image || '',
                              },
                            })}
                          >
                            <Ionicons name="pencil" size={14} color="#FFFFFF" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[s.actionBtn, { backgroundColor: '#E53935' }]}
                            onPress={() => handleDelete(item)}
                          >
                            <Ionicons name="trash" size={14} color="#FFFFFF" />
                          </TouchableOpacity>
                        </>
                      )}
                      <TouchableOpacity
                        style={s.addBtn}
                        onPress={() => addItem(item)}
                      >
                        <Ionicons name="add" size={18} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    paddingTop: 52, paddingBottom: 14, paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: 12,
  },
  cartBtn: { padding: 4, position: 'relative' },
  cartBadge: {
    position: 'absolute', top: -2, right: -2,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: colors.orange,
    alignItems: 'center', justifyContent: 'center',
  },
  cartBadgeText: { fontSize: 9, fontWeight: '800', color: '#FFFFFF' },

  // Busca
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10, paddingHorizontal: 10, height: 38,
  },
  searchIcon: { marginRight: 6 },
  searchInput: {
    flex: 1, fontSize: 14, height: '100%',
    color: '#FFFFFF',
  },

  // Categorias
  catBar: { borderBottomWidth: 1, paddingVertical: 10 },
  catScroll: { paddingHorizontal: 16, gap: 8 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: 20, borderWidth: 1.5, borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.orange, borderColor: colors.orange },
  chipText:       { fontSize: 12, fontWeight: '600', color: colors.textSub },
  chipTextActive: { color: '#FFFFFF' },

  // Lista
  list: { padding: 14, gap: 10 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: { fontSize: 14 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText: { fontSize: 15, fontWeight: '600' },

  // Item card
  itemCard: {
    flexDirection: 'row', borderRadius: radius.card,
    padding: 14, gap: 12, alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#1E3A5F', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 2,
  },
  itemEmoji: {
    width: 56, height: 56, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '600' },
  itemDesc: { fontSize: 11, marginTop: 2, lineHeight: 15 },
  itemFooter: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginTop: 8,
  },
  newItemBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.orange, borderRadius: 10,
    paddingVertical: 10, paddingHorizontal: 16, gap: 6,
    alignSelf: 'center', marginBottom: 4,
  },
  newItemBtnText: {
    color: '#FFFFFF', fontSize: 13, fontWeight: '700',
  },
  actionBtn: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  addBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: colors.orange,
    alignItems: 'center', justifyContent: 'center',
  },
});