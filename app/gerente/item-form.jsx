// app/gerente/item-form.jsx
// Tela de criar/editar item do cardápio (apenas Gerente)
import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useCreateMenuItem, useUpdateMenuItem } from '../../hooks/useMenuItems';
import { colors, shared } from '../../styles/theme';
import { CATEGORIES } from '../../config/constants';

export default function ItemFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme } = useTheme();

  const isEditing = !!params.id;

  const [nome, setNome] = useState(params.name || '');
  const [preco, setPreco] = useState(params.price || '');
  const [categoria, setCategoria] = useState(params.category || 'PRATO');
  const [descricao, setDescricao] = useState(params.description || '');
  const [imagem, setImagem] = useState(params.image || '');

  // Atualiza os campos quando os params mudam (navegação pro mesmo screen)
  useEffect(() => {
    setNome(params.name || '');
    setPreco(params.price || '');
    setCategoria(params.category || 'PRATO');
    setDescricao(params.description || '');
    setImagem(params.image || '');
  }, [params.id]);

  const createMutation = useCreateMenuItem();
  const updateMutation = useUpdateMenuItem();

  const saving = createMutation.isPending || updateMutation.isPending;

  const handleSave = async () => {
    if (!nome.trim()) {
      Alert.alert('Campo obrigatório', 'Informe o nome do item.');
      return;
    }
    const precoNum = parseFloat(preco);
    if (!preco || isNaN(precoNum) || precoNum <= 0) {
      Alert.alert('Campo obrigatório', 'Informe um preço válido.');
      return;
    }

    const itemData = {
      name: nome.trim(),
      price: precoNum,
      category: categoria,
      description: descricao.trim(),
      image: imagem.trim() || '🍽️',
      available: true,
    };

    try {
      let savedItem;
      if (isEditing) {
        savedItem = await updateMutation.mutateAsync({ itemId: params.id, itemData });
        Alert.alert('Sucesso', 'Item atualizado com sucesso!');
      } else {
        savedItem = await createMutation.mutateAsync(itemData);
        Alert.alert('Sucesso', 'Item criado com sucesso!');
      }
      router.replace({
        pathname: '/item',
        params: {
          id: savedItem?.id || params.id,
          name: itemData.name,
          price: String(itemData.price),
          description: itemData.description,
          image: itemData.image,
        },
      });
    } catch (error) {
      Alert.alert('Erro', error.message || 'Não foi possível salvar o item.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={[shared.screen, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[s.header, { backgroundColor: colors.navy }]}>
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={shared.headerTitle}>
            {isEditing ? 'Editar Item' : 'Novo Item'}
          </Text>
          <View style={{ width: 30 }} />
        </View>
      </View>

      <ScrollView contentContainerStyle={s.form} keyboardShouldPersistTaps="handled">
        {/* Nome */}
        <Text style={[s.label, { color: theme.textSecondary }]}>Nome *</Text>
        <TextInput
          style={[s.input, { backgroundColor: theme.surface, color: theme.text, borderColor: colors.border }]}
          placeholder="Ex: Pizza Calabresa"
          placeholderTextColor={colors.textMuted}
          value={nome}
          onChangeText={setNome}
        />

        {/* Preço */}
        <Text style={[s.label, { color: theme.textSecondary }]}>Preço (R$) *</Text>
        <TextInput
          style={[s.input, { backgroundColor: theme.surface, color: theme.text, borderColor: colors.border }]}
          placeholder="Ex: 35.00"
          placeholderTextColor={colors.textMuted}
          value={preco}
          onChangeText={setPreco}
          keyboardType="decimal-pad"
        />

        {/* Categoria */}
        <Text style={[s.label, { color: theme.textSecondary }]}>Categoria *</Text>
        <View style={s.catRow}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.value}
              style={[
                s.catChip,
                { borderColor: colors.border },
                categoria === cat.value && s.catChipActive,
              ]}
              onPress={() => setCategoria(cat.value)}
            >
              <Text style={[
                s.catChipText,
                categoria === cat.value && s.catChipTextActive,
              ]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Descrição */}
        <Text style={[s.label, { color: theme.textSecondary }]}>Descrição</Text>
        <TextInput
          style={[s.input, s.textArea, { backgroundColor: theme.surface, color: theme.text, borderColor: colors.border }]}
          placeholder="Descrição do item..."
          placeholderTextColor={colors.textMuted}
          value={descricao}
          onChangeText={setDescricao}
          multiline
          numberOfLines={3}
        />

        {/* Imagem/Emoji */}
        <Text style={[s.label, { color: theme.textSecondary }]}>Imagem (URL ou emoji)</Text>
        <TextInput
          style={[s.input, { backgroundColor: theme.surface, color: theme.text, borderColor: colors.border }]}
          placeholder="Ex: 🍕 ou https://..."
          placeholderTextColor={colors.textMuted}
          value={imagem}
          onChangeText={setImagem}
        />

        {/* Botão salvar */}
        <TouchableOpacity
          style={[s.saveBtn, saving && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name={isEditing ? 'checkmark-circle-outline' : 'add-circle-outline'} size={20} color="#FFFFFF" />
              <Text style={s.saveBtnText}>
                {isEditing ? 'Salvar Alterações' : 'Criar Item'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  header: {
    paddingTop: 52, paddingBottom: 14, paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  backBtn: { padding: 4 },

  form: { padding: 20, gap: 4, paddingBottom: 40 },

  label: {
    fontSize: 13, fontWeight: '700', marginTop: 12, marginBottom: 6,
  },
  input: {
    borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14,
    height: 48, fontSize: 15,
  },
  textArea: {
    height: 90, paddingTop: 12, textAlignVertical: 'top',
  },

  catRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  catChip: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1.5, alignItems: 'center',
  },
  catChipActive: { backgroundColor: colors.orange, borderColor: colors.orange },
  catChipText: { fontSize: 13, fontWeight: '600', color: colors.textSub },
  catChipTextActive: { color: '#FFFFFF' },

  saveBtn: {
    backgroundColor: colors.orange, borderRadius: 12, height: 52,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: 24, gap: 8,
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
