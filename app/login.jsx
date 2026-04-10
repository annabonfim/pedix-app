// app/login.jsx
import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { colors } from '../styles/theme';

const MASCOT_FACE = require('../assets/pedix-mascot.png');

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [role, setRole]       = useState('CLIENTE');
  const [email, setEmail]     = useState('');
  const [senha, setSenha]     = useState('');
  const [loading, setLoading] = useState(false);

  const isAdmin = role === 'ADMIN';
  const isGerente = role === 'GERENTE';

  const handleLogin = async () => {
    if (!email.trim()) { Alert.alert('Campo obrigatório', 'Informe seu e-mail.'); return; }
    if (!senha.trim()) { Alert.alert('Campo obrigatório', 'Informe sua senha.'); return; }
    setLoading(true);
    try {
      await login(email.trim(), senha.trim(), role);
      router.replace('/');
    } catch (error) {
      Alert.alert('Acesso negado', error.message || 'E-mail ou senha incorretos.');
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

        {/* Cabeçalho navy com mascote */}
        <View style={s.hero}>
          <TouchableOpacity style={s.themeBtn} onPress={toggleTheme}>
            <Ionicons
              name={theme.mode === 'dark' ? 'sunny-outline' : 'moon-outline'}
              size={20} color="rgba(255,255,255,0.75)"
            />
          </TouchableOpacity>

          <Image source={MASCOT_FACE} style={s.mascotImg} resizeMode="contain" />
          <Text style={s.appSub}>Sistema de atendimento de restaurante</Text>
        </View>

        {/* Card de login */}
        <View style={[s.card, { backgroundColor: theme.surface }]}>

          {/* Toggle de perfil */}
          <View style={[s.roleRow, { backgroundColor: theme.background }]}>
            <TouchableOpacity
              style={[s.roleBtn, role === 'CLIENTE' && s.roleBtnActive]}
              onPress={() => { setRole('CLIENTE'); setEmail(''); setSenha(''); }}
            >
              <Ionicons
                name="person-circle-outline" size={16}
                color={role === 'CLIENTE' ? '#FFFFFF' : colors.textSub}
              />
              <Text style={[s.roleBtnText, role === 'CLIENTE' && s.roleBtnTextActive]}> Cliente</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.roleBtn, role === 'ADMIN' && s.roleBtnActive]}
              onPress={() => { setRole('ADMIN'); setEmail(''); setSenha(''); }}
            >
              <Ionicons
                name="shield-checkmark-outline" size={16}
                color={role === 'ADMIN' ? '#FFFFFF' : colors.textSub}
              />
              <Text style={[s.roleBtnText, role === 'ADMIN' && s.roleBtnTextActive]}> Garçom</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.roleBtn, isGerente && s.roleBtnActive]}
              onPress={() => { setRole('GERENTE'); setEmail(''); setSenha(''); }}
            >
              <Ionicons
                name="briefcase-outline" size={16}
                color={isGerente ? '#FFFFFF' : colors.textSub}
              />
              <Text style={[s.roleBtnText, isGerente && s.roleBtnTextActive]}> Gerente</Text>
            </TouchableOpacity>
          </View>

          {/* Info do perfil */}
          <View style={[s.infoBox, { backgroundColor: theme.background }]}>
            <Ionicons name="information-circle-outline" size={14} color={colors.textSub} />
            <Text style={[s.infoText, { color: theme.textSecondary }]}>
              Use seu e-mail e senha cadastrados no sistema.
            </Text>
          </View>

          {/* Campos */}
          <View style={s.fieldGap}>
            <Text style={[s.label, { color: theme.textSecondary }]}>E-mail</Text>
            <View style={[s.inputRow, { backgroundColor: theme.inputBackground, borderColor: colors.border }]}>
              <Ionicons name="mail-outline" size={16} color={colors.textSub} style={s.inputIcon} />
              <TextInput
                style={[s.input, { color: theme.text }]}
                placeholder="email@exemplo.com"
                placeholderTextColor={colors.textMuted}
                value={email} onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none" autoCorrect={false}
                autoComplete="off" importantForAutofill="no"
              />
            </View>
          </View>

          <View style={[s.fieldGap, { marginBottom: 20 }]}>
            <Text style={[s.label, { color: theme.textSecondary }]}>Senha</Text>
            <View style={[s.inputRow, { backgroundColor: theme.inputBackground, borderColor: colors.border }]}>
              <Ionicons name="lock-closed-outline" size={16} color={colors.textSub} style={s.inputIcon} />
              <TextInput
                style={[s.input, { color: theme.text }]}
                placeholder="Digite sua senha"
                placeholderTextColor={colors.textMuted}
                value={senha} onChangeText={setSenha}
                secureTextEntry
                autoCorrect={false} autoCapitalize="none"
                autoComplete="off" importantForAutofill="no"
              />
            </View>
          </View>

          <TouchableOpacity
            style={[s.btn, loading && { opacity: 0.7 }]}
            onPress={handleLogin} disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#FFFFFF" />
              : <>
                  <Ionicons name="log-in-outline" size={18} color="#FFFFFF" />
                  <Text style={s.btnText}>  Entrar</Text>
                </>
            }
          </TouchableOpacity>
        </View>

        {/* Link para cadastro (apenas clientes) */}
        {!isAdmin && !isGerente && (
          <TouchableOpacity style={s.signupLink} onPress={() => router.push('/signup')}>
            <Text style={s.signupLinkText}>
              Não tem conta?{' '}
              <Text style={{ color: colors.orange, fontWeight: '700' }}>Cadastre-se</Text>
            </Text>
          </TouchableOpacity>
        )}

        {/* Legenda */}
        <View style={[s.legend, { backgroundColor: theme.surface }]}>
          <Text style={[s.legendTitle, { color: colors.textSub }]}>Perfis de acesso</Text>
          <View style={s.legendRow}>
            <Ionicons name="person-circle-outline" size={15} color={colors.blue} />
            <Text style={[s.legendText, { color: theme.textSecondary }]}>
              <Text style={{ fontWeight: '700' }}>Cliente</Text> — cardápio e acompanhamento de pedidos
            </Text>
          </View>
          <View style={[s.legendRow, { marginTop: 6 }]}>
            <Ionicons name="shield-checkmark-outline" size={15} color={colors.orange} />
            <Text style={[s.legendText, { color: theme.textSecondary }]}>
              <Text style={{ fontWeight: '700' }}>Garçom</Text> — gerencia mesas e pedidos
            </Text>
          </View>
          <View style={[s.legendRow, { marginTop: 6 }]}>
            <Ionicons name="briefcase-outline" size={15} color="#8E24AA" />
            <Text style={[s.legendText, { color: theme.textSecondary }]}>
              <Text style={{ fontWeight: '700' }}>Gerente</Text> — tudo do garçom + gerencia o cardápio
            </Text>
          </View>
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
    alignItems: 'center',
  },
  themeBtn:     { position: 'absolute', top: 52, right: 20, padding: 8 },
  mascotImg: { width: 140, height: 140, marginBottom: 8 },
  appSub:    { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 },

  card: {
    margin: 16, borderRadius: 16, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },

  roleRow: { flexDirection: 'row', borderRadius: 12, padding: 4, marginBottom: 12 },
  roleBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 11, borderRadius: 9,
  },
  roleBtnActive:     { backgroundColor: colors.orange },
  roleBtnText:       { fontSize: 13, fontWeight: '600', color: colors.textSub },
  roleBtnTextActive: { color: '#FFFFFF' },

  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start',
    padding: 10, borderRadius: 8, marginBottom: 18, gap: 6,
  },
  infoText: { fontSize: 12, flex: 1, lineHeight: 18 },

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

  legend: {
    marginHorizontal: 16, padding: 14, borderRadius: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  legendTitle: {
    fontSize: 11, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8,
  },
  legendRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  legendText: { fontSize: 13, flex: 1, lineHeight: 18 },

  signupLink:     { alignItems: 'center', marginHorizontal: 16, marginBottom: 12 },
  signupLinkText: { fontSize: 14, color: 'rgba(255,255,255,0.75)' },
});
