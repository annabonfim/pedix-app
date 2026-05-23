// app/signup.jsx
import { useState, useEffect } from 'react';
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
  const { register, isAuthenticated } = useAuth();
  const { theme } = useTheme();

  const [nome, setNome]         = useState('');
  const [email, setEmail]       = useState('');
  const [senha, setSenha]       = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [telefone, setTelefone] = useState('');
  const [nascimento, setNascimento] = useState(''); // formato DD/MM/AAAA
  const [loading, setLoading]   = useState(false);

  // Limpa todos os campos quando o usuário desloga. expo-router mantém
  // a tela montada, então dados de um signup anterior persistiriam.
  useEffect(() => {
    if (!isAuthenticated) {
      setNome('');
      setEmail('');
      setSenha('');
      setShowSenha(false);
      setTelefone('');
      setNascimento('');
    }
  }, [isAuthenticated]);

  // Aplica máscara DD/MM/AAAA conforme digita
  const handleNascimentoChange = (raw) => {
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    let out = digits;
    if (digits.length > 4) out = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    else if (digits.length > 2) out = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    setNascimento(out);
  };

  // Converte DD/MM/AAAA → ISO "AAAA-MM-DDT00:00:00", ou null se inválido
  const parseNascimentoToIso = (str) => {
    const m = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!m) return null;
    const [_, dd, mm, yyyy] = m;
    const d = new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
    if (isNaN(d.getTime())) return null;
    // sanity: ano entre 1900 e hoje
    const year = parseInt(yyyy, 10);
    if (year < 1900 || year > new Date().getFullYear()) return null;
    return `${yyyy}-${mm}-${dd}T00:00:00`;
  };

  const handleSignup = async () => {
    if (!nome.trim())       { Alert.alert('Campo obrigatório', 'Informe seu nome.'); return; }
    if (!email.trim())      { Alert.alert('Campo obrigatório', 'Informe seu e-mail.'); return; }
    if (!senha.trim())      { Alert.alert('Campo obrigatório', 'Informe uma senha.'); return; }
    if (!telefone.trim())   { Alert.alert('Campo obrigatório', 'Informe seu telefone.'); return; }
    if (!nascimento.trim()) { Alert.alert('Campo obrigatório', 'Informe sua data de nascimento.'); return; }

    const iso = parseNascimentoToIso(nascimento);
    if (!iso) { Alert.alert('Data inválida', 'Use o formato DD/MM/AAAA.'); return; }

    setLoading(true);
    try {
      await register(nome.trim(), email.trim(), senha.trim(), telefone.trim(), iso);
      router.replace('/scan');
    } catch (error) {
      // Cadastro foi OK mas auto-login falhou — conta existe, basta logar manual.
      if (error?.stage === 'auto_login') {
        Alert.alert(
          'Conta criada! 🎉',
          error.message,
          [{ text: 'Ir pro login', onPress: () => router.replace('/login') }]
        );
      } else {
        Alert.alert('Erro no cadastro', error.message || 'Não foi possível criar sua conta.');
      }
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
              />
            </View>
          </View>

          <View style={s.fieldGap}>
            <Text style={[s.label, { color: theme.textSecondary }]}>Senha</Text>
            <View style={[s.inputRow, { backgroundColor: theme.inputBackground, borderColor: colors.border }]}>
              <Ionicons name="lock-closed-outline" size={16} color={colors.textSub} style={s.inputIcon} />
              <TextInput
                style={[s.input, { color: theme.text }]}
                placeholder="Crie uma senha"
                placeholderTextColor={colors.textMuted}
                value={senha} onChangeText={setSenha}
                secureTextEntry={!showSenha}
                autoCorrect={false} autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowSenha((v) => !v)}
                style={s.eyeBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={showSenha ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={colors.textSub}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={s.fieldGap}>
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

          <View style={[s.fieldGap, { marginBottom: 24 }]}>
            <Text style={[s.label, { color: theme.textSecondary }]}>Data de nascimento</Text>
            <View style={[s.inputRow, { backgroundColor: theme.inputBackground, borderColor: colors.border }]}>
              <Ionicons name="calendar-outline" size={16} color={colors.textSub} style={s.inputIcon} />
              <TextInput
                style={[s.input, { color: theme.text }]}
                placeholder="DD/MM/AAAA"
                placeholderTextColor={colors.textMuted}
                value={nascimento} onChangeText={handleNascimentoChange}
                keyboardType="number-pad"
                maxLength={10}
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
  eyeBtn:    { paddingHorizontal: 14, height: '100%', justifyContent: 'center' },
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
