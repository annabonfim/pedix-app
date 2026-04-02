// app/signup.jsx
import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../styles/theme';

export default function SignupScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const { theme } = useTheme();

  const [nome, setNome]         = useState('');
  const [cpf, setCpf]           = useState('');
  const [telefone, setTelefone] = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSignup = async () => {
    if (!nome.trim())     { Alert.alert('Campo obrigatório', 'Informe seu nome.'); return; }
    if (!cpf.trim())      { Alert.alert('Campo obrigatório', 'Informe seu CPF.'); return; }
    if (!telefone.trim()) { Alert.alert('Campo obrigatório', 'Informe seu telefone.'); return; }

    setLoading(true);
    try {
      await register(nome.trim(), cpf.trim(), telefone.trim());
      router.replace('/');
    } catch (error) {
      Alert.alert('Erro no cadastro', error.message || 'Não foi possível criar sua conta.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[s.root, { backgroundColor: colors.navyDark }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* Cabeçalho */}
        <View style={s.hero}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="rgba(255,255,255,0.85)" />
          </TouchableOpacity>
          <Ionicons name="person-add-outline" size={48} color="rgba(255,255,255,0.9)" />
          <Text style={s.title}>Criar conta</Text>
          <Text style={s.subtitle}>Cadastre-se para fazer pedidos</Text>
        </View>

        {/* Card */}
        <View style={[s.card, { backgroundColor: theme.surface }]}>

          <View style={s.fieldGap}>
            <Text style={[s.label, { color: theme.textSecondary }]}>Nome completo</Text>
            <View style={[s.inputRow, { backgroundColor: theme.inputBackground, borderColor: colors.border }]}>
              <Ionicons name="person-outline" size={16} color={colors.textSub} style={s.inputIcon} />
              <TextInput
                style={[s.input, { color: theme.text }]}
                placeholder="Ex: Maria Silva"
                placeholderTextColor={colors.textMuted}
                value={nome} onChangeText={setNome}
                autoCapitalize="words" autoCorrect={false}
              />
            </View>
          </View>

          <View style={s.fieldGap}>
            <Text style={[s.label, { color: theme.textSecondary }]}>CPF</Text>
            <View style={[s.inputRow, { backgroundColor: theme.inputBackground, borderColor: colors.border }]}>
              <Ionicons name="id-card-outline" size={16} color={colors.textSub} style={s.inputIcon} />
              <TextInput
                style={[s.input, { color: theme.text }]}
                placeholder="123.456.789-00"
                placeholderTextColor={colors.textMuted}
                value={cpf} onChangeText={setCpf}
                keyboardType="number-pad"
                autoCorrect={false} autoCapitalize="none"
              />
            </View>
          </View>

          <View style={[s.fieldGap, { marginBottom: 24 }]}>
            <Text style={[s.label, { color: theme.textSecondary }]}>Telefone</Text>
            <View style={[s.inputRow, { backgroundColor: theme.inputBackground, borderColor: colors.border }]}>
              <Ionicons name="call-outline" size={16} color={colors.textSub} style={s.inputIcon} />
              <TextInput
                style={[s.input, { color: theme.text }]}
                placeholder="(11) 91234-5678"
                placeholderTextColor={colors.textMuted}
                value={telefone} onChangeText={setTelefone}
                keyboardType="phone-pad"
                autoCorrect={false}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[s.btn, loading && { opacity: 0.7 }]}
            onPress={handleSignup} disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#FFFFFF" />
              : <>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                  <Text style={s.btnText}>  Criar conta</Text>
                </>
            }
          </TouchableOpacity>

          <TouchableOpacity style={s.loginLink} onPress={() => router.back()}>
            <Text style={[s.loginLinkText, { color: theme.textSecondary }]}>
              Já tem conta? <Text style={{ color: colors.orange, fontWeight: '700' }}>Entrar</Text>
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: 40 },

  hero: {
    backgroundColor: colors.navy,
    paddingTop: 56, paddingBottom: 36,
    alignItems: 'center', gap: 8,
  },
  backBtn:  { position: 'absolute', top: 52, left: 20, padding: 8 },
  title:    { fontSize: 24, fontWeight: '800', color: '#FFFFFF', marginTop: 8 },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },

  card: {
    margin: 16, borderRadius: 16, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },

  fieldGap: { marginBottom: 14 },
  label:    { fontSize: 12, fontWeight: '700', marginBottom: 6 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderRadius: 12, height: 50,
  },
  inputIcon: { paddingLeft: 14 },
  input:     { flex: 1, height: '100%', paddingHorizontal: 12, fontSize: 15 },

  btn: {
    backgroundColor: colors.orange, borderRadius: 12, height: 52,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: 4,
  },
  btnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },

  loginLink:     { alignItems: 'center', marginTop: 16 },
  loginLinkText: { fontSize: 14 },
});
