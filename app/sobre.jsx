// app/sobre.jsx
// Tela "Sobre o App" — exigida pela Sprint 4 (deve mostrar o hash do commit
// pra confirmar correspondência entre versão publicada e código avaliado)
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useTheme } from '../context/ThemeContext';
import { colors, shared } from '../styles/theme';

// Hash do commit injetado no build (fallback pro valor abaixo em dev)
const COMMIT_HASH = Constants.expoConfig?.extra?.commitHash || 'dev-local';
const APP_VERSION = Constants.expoConfig?.version || '1.0.0';

export default function SobreScreen() {
  const router = useRouter();
  const { theme } = useTheme();

  return (
    <View style={[shared.screen, { backgroundColor: theme.background }]}>
      <View style={[s.header, { backgroundColor: colors.navy }]}>
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={shared.headerTitle}>Sobre o App</Text>
          <View style={{ width: 30 }} />
        </View>
      </View>

      <ScrollView contentContainerStyle={s.content}>
        <View style={[s.card, { backgroundColor: theme.surface, borderColor: colors.border }]}>
          <Text style={[s.appName, { color: theme.text }]}>Pedix</Text>
          <Text style={[s.tagline, { color: theme.textSecondary }]}>
            Sistema de comanda digital para restaurantes
          </Text>
        </View>

        <View style={[s.card, { backgroundColor: theme.surface, borderColor: colors.border }]}>
          <Text style={[s.sectionTitle, { color: theme.text }]}>Versão</Text>
          <View style={s.row}>
            <Text style={[s.label, { color: theme.textSecondary }]}>App</Text>
            <Text style={[s.value, { color: theme.text }]}>{APP_VERSION}</Text>
          </View>
          <View style={s.row}>
            <Text style={[s.label, { color: theme.textSecondary }]}>Commit</Text>
            <Text style={[s.value, s.mono, { color: colors.orange }]}>{COMMIT_HASH}</Text>
          </View>
        </View>

        <View style={[s.card, { backgroundColor: theme.surface, borderColor: colors.border }]}>
          <Text style={[s.sectionTitle, { color: theme.text }]}>Equipe CodeGirls</Text>
          <Text style={[s.author, { color: theme.text }]}>Anna Bonfim</Text>
          <Text style={[s.author, { color: theme.text }]}>Alane Rocha</Text>
        </View>

        <View style={[s.card, { backgroundColor: theme.surface, borderColor: colors.border }]}>
          <Text style={[s.sectionTitle, { color: theme.text }]}>Repositórios</Text>
          <TouchableOpacity
            style={s.linkRow}
            onPress={() => Linking.openURL('https://github.com/annabonfim/pedix-mobile-sprint3')}
          >
            <Ionicons name="logo-github" size={18} color={theme.text} />
            <Text style={[s.linkText, { color: theme.text }]}>App Mobile</Text>
            <Ionicons name="open-outline" size={16} color={theme.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={s.linkRow}
            onPress={() => Linking.openURL('https://github.com/alanerochaa/pedix-api')}
          >
            <Ionicons name="logo-github" size={18} color={theme.text} />
            <Text style={[s.linkText, { color: theme.text }]}>API Java</Text>
            <Ionicons name="open-outline" size={16} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={[s.footer, { color: theme.textSecondary }]}>
          FIAP · Challenge Oracle 2026 · Sprint 4
        </Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  header: { paddingTop: 52, paddingBottom: 14, paddingHorizontal: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { padding: 4 },

  content: { padding: 16, gap: 12, paddingBottom: 40 },

  card: {
    borderRadius: 12, borderWidth: 1, padding: 16, gap: 8,
  },
  appName: { fontSize: 28, fontWeight: '800' },
  tagline: { fontSize: 13, lineHeight: 18 },

  sectionTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },

  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  label: { fontSize: 14 },
  value: { fontSize: 14, fontWeight: '600' },
  mono: { fontFamily: 'Courier' },

  author: { fontSize: 14, paddingVertical: 2 },

  linkRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8,
  },
  linkText: { fontSize: 14, flex: 1 },

  footer: { textAlign: 'center', fontSize: 12, marginTop: 16 },
});
