// app/gerente/categorias.jsx
// CRUD de categorias do cardápio (apenas Gerente)
import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
  Alert, TextInput, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import {
  useCategorias,
  useCreateCategoria,
  useUpdateCategoria,
  useDeleteCategoria,
} from '../../hooks/useCategorias';
import { colors, shared } from '../../styles/theme';

export default function CategoriasScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  const { data: categorias = [], isLoading } = useCategorias();
  const createMutation = useCreateCategoria();
  const updateMutation = useUpdateCategoria();
  const deleteMutation = useDeleteCategoria();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');

  const openNew = () => {
    setEditing(null);
    setNome('');
    setDescricao('');
    setModalOpen(true);
  };

  const openEdit = (cat) => {
    setEditing(cat);
    setNome(cat.nome || '');
    setDescricao(cat.descricao || '');
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!nome.trim()) {
      Alert.alert('Campo obrigatório', 'Informe o nome da categoria.');
      return;
    }
    const data = { nome: nome.trim(), descricao: descricao.trim(), ativo: true };
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, data });
      } else {
        await createMutation.mutateAsync(data);
      }
      setModalOpen(false);
    } catch (error) {
      Alert.alert('Erro', error.message || 'Não foi possível salvar.');
    }
  };

  const handleDelete = (cat) => {
    Alert.alert(
      'Remover categoria',
      `Deseja remover "${cat.nome}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(cat.id);
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível remover.');
            }
          },
        },
      ]
    );
  };

  const saving = createMutation.isPending || updateMutation.isPending;

  return (
    <View style={[shared.screen, { backgroundColor: theme.background }]}>
      <View style={[s.header, { backgroundColor: colors.navy }]}>
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={s.iconBtn}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={shared.headerTitle}>Categorias</Text>
          <TouchableOpacity onPress={openNew} style={s.iconBtn}>
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={colors.orange} />
        </View>
      ) : categorias.length === 0 ? (
        <View style={s.center}>
          <Ionicons name="pricetags-outline" size={56} color={colors.textMuted} />
          <Text style={[s.empty, { color: theme.text }]}>Nenhuma categoria</Text>
          <TouchableOpacity style={s.emptyBtn} onPress={openNew}>
            <Ionicons name="add-circle" size={18} color="#FFFFFF" />
            <Text style={s.emptyBtnText}>Criar categoria</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.list}>
          {categorias.map((cat) => (
            <View
              key={cat.id}
              style={[s.card, { backgroundColor: theme.surface, borderColor: colors.border }]}
            >
              <View style={[s.icon, { backgroundColor: theme.background }]}>
                <Ionicons name="pricetag" size={18} color={colors.orange} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.name, { color: theme.text }]}>{cat.nome}</Text>
                {cat.descricao ? (
                  <Text style={[s.desc, { color: theme.textSecondary }]} numberOfLines={2}>
                    {cat.descricao}
                  </Text>
                ) : null}
              </View>
              <View style={s.actions}>
                <TouchableOpacity
                  style={[s.actionBtn, { backgroundColor: colors.blue }]}
                  onPress={() => openEdit(cat)}
                >
                  <Ionicons name="pencil" size={14} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.actionBtn, { backgroundColor: '#E53935' }]}
                  onPress={() => handleDelete(cat)}
                >
                  <Ionicons name="trash" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Modal de criação/edição */}
      <Modal
        visible={modalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setModalOpen(false)}
      >
        <KeyboardAvoidingView
          style={s.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[s.modalContent, { backgroundColor: theme.surface }]}>
            <View style={s.modalHeader}>
              <Text style={[s.modalTitle, { color: theme.text }]}>
                {editing ? 'Editar categoria' : 'Nova categoria'}
              </Text>
              <TouchableOpacity onPress={() => setModalOpen(false)}>
                <Ionicons name="close" size={22} color={theme.text} />
              </TouchableOpacity>
            </View>

            <Text style={[s.label, { color: theme.textSecondary }]}>Nome *</Text>
            <TextInput
              style={[s.input, { backgroundColor: theme.background, color: theme.text, borderColor: colors.border }]}
              value={nome}
              onChangeText={setNome}
              placeholder="Ex: Pratos principais"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={[s.label, { color: theme.textSecondary }]}>Descrição</Text>
            <TextInput
              style={[s.input, s.textArea, { backgroundColor: theme.background, color: theme.text, borderColor: colors.border }]}
              value={descricao}
              onChangeText={setDescricao}
              placeholder="Descrição da categoria..."
              placeholderTextColor={colors.textMuted}
              multiline
            />

            <TouchableOpacity
              style={[s.saveBtn, saving && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={s.saveBtnText}>Salvar</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  header: { paddingTop: 52, paddingBottom: 14, paddingHorizontal: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconBtn: { padding: 4 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 14 },
  empty: { fontSize: 16, fontWeight: '700' },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.orange, paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: 10,
  },
  emptyBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },

  list: { padding: 14, gap: 10 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, borderWidth: 1, padding: 14, gap: 12,
  },
  icon: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  name: { fontSize: 15, fontWeight: '700' },
  desc: { fontSize: 12, marginTop: 2, lineHeight: 16 },

  actions: { flexDirection: 'row', gap: 6 },
  actionBtn: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },

  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: '700' },

  label: { fontSize: 13, fontWeight: '700', marginTop: 12, marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 14,
    height: 46, fontSize: 14,
  },
  textArea: { height: 80, paddingTop: 12, textAlignVertical: 'top' },

  saveBtn: {
    backgroundColor: colors.orange, borderRadius: 12, height: 50,
    alignItems: 'center', justifyContent: 'center', marginTop: 20,
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
