import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { colors, shared, radius } from '../styles/theme';
import { APP_CONFIG, RESTAURANTES, RESTAURANTE_VALIDO_ID } from '../config/constants';
import { isRestauranteValido } from '../utils/validation';
import { csharpApi } from '../services/csharpAPi';
import { logger } from '../utils/logger';

// Procura o Guid da mesa na API .NET pelo número (1, 2, 3...).
// Se a mesa não existir lá ainda, cria automaticamente.
async function resolveMesaIdByNumero(numero) {
  const num = parseInt(numero, 10);
  if (Number.isNaN(num)) throw new Error('Número de mesa inválido.');
  const mesas = await csharpApi.get('/mesas');
  const lista = Array.isArray(mesas) ? mesas : mesas?.data || [];
  const found = lista.find((m) => Number(m.numero) === num);
  if (found?.id) return found.id;
  // Mesa não existe → cria sob demanda (Sprint 4 simples)
  const criada = await csharpApi.post('/mesas', {
    numero: num,
    capacidade: 4,
    localizacao: 'Salão',
    qrCode: `QR${String(num).padStart(3, '0')}`,
  });
  return criada.id;
}

export default function ScanScreen() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const [tableNumber, setTableNumber] = useState('');

  const handleLogout = () => {
    Alert.alert(
      'Sair da conta',
      'Deseja voltar para a tela de login?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: logout },
      ]
    );
  };
  const [selectedRestaurante, setSelectedRestaurante] = useState(null);
  const [saved, setSaved] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);

  const [permission, requestPermission] = useCameraPermissions();

  useFocusEffect(
    useCallback(() => {
      loadSavedData();
      setScanned(false); // reset ao voltar pra tela
    }, [])
  );

  const loadSavedData = async () => {
    try {
      const t = await AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.TABLE_NUMBER);
      const r = await AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.RESTAURANTE_ID);
      if (t) { setTableNumber(t); setSaved(t); }
      if (r) setSelectedRestaurante(parseInt(r, 10));
    } catch (e) { logger.warn('Erro ao carregar dados salvos', e); }
  };

  // ─── ESCANEAR QR CODE ─────────────────────────────────────────────────────
  const handleOpenCamera = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permissão necessária', 'Permita o acesso à câmera para escanear o QR Code.');
        return;
      }
    }
    setScanned(false);
    setScanning(true);
  };

  const handleBarCodeScanned = async ({ data }) => {
    if (scanned) return;
    setScanned(true);
    setScanning(false);

    try {
      // Aceita dois formatos:
      // DB format: "QR005"  →  mesa = 5, restauranteId = 1
      // JSON:      {"restauranteId":1,"mesa":5}
      let restauranteId, mesa;

      if (/^QR\d+$/i.test(data.trim())) {
        restauranteId = RESTAURANTE_VALIDO_ID;
        mesa = String(parseInt(data.trim().replace(/^QR/i, ''), 10));
      } else if (data.startsWith('{')) {
        const parsed = JSON.parse(data);
        restauranteId = parsed.restauranteId;
        mesa = String(parsed.mesa);
      } else {
        throw new Error('Formato inválido');
      }

      if (!restauranteId || !mesa) throw new Error('Dados incompletos');

      if (!isRestauranteValido(restauranteId)) {
        Alert.alert('QR Code inválido', 'Este QR Code não pertence a um restaurante disponível.', [
          { text: 'Tentar novamente', onPress: () => setScanned(false) },
        ]);
        return;
      }

      const mesaId = await resolveMesaIdByNumero(mesa);

      await AsyncStorage.setItem(APP_CONFIG.STORAGE_KEYS.TABLE_NUMBER, mesa);
      await AsyncStorage.setItem(APP_CONFIG.STORAGE_KEYS.MESA_ID, mesaId);
      await AsyncStorage.setItem(APP_CONFIG.STORAGE_KEYS.RESTAURANTE_ID, String(restauranteId));
      setSaved(mesa);
      setTableNumber(mesa);
      setSelectedRestaurante(restauranteId);

      Alert.alert('Mesa confirmada!', `Mesa ${mesa} selecionada com sucesso.`, [
        { text: 'Ver cardápio', onPress: () => router.push('/menu') },
        { text: 'OK' },
      ]);
    } catch (e) {
      logger.warn('QR inválido:', data, e);
      Alert.alert('QR Code inválido', 'Não foi possível ler os dados da mesa. Use a entrada manual.', [
        { text: 'OK', onPress: () => setScanned(false) },
      ]);
    }
  };

  // ─── CONFIRMAR MANUALMENTE ────────────────────────────────────────────────
  const handleConfirmar = async () => {
    if (!tableNumber) { Alert.alert('Campo obrigatório', 'Informe o número da mesa.'); return; }
    if (!selectedRestaurante) { Alert.alert('Campo obrigatório', 'Selecione o restaurante.'); return; }
    if (!isRestauranteValido(selectedRestaurante)) {
      Alert.alert('Restaurante indisponível', 'Este restaurante não está disponível no momento.');
      return;
    }
    try {
      const mesaId = await resolveMesaIdByNumero(tableNumber);
      await AsyncStorage.setItem(APP_CONFIG.STORAGE_KEYS.TABLE_NUMBER, tableNumber);
      await AsyncStorage.setItem(APP_CONFIG.STORAGE_KEYS.MESA_ID, mesaId);
      await AsyncStorage.setItem(APP_CONFIG.STORAGE_KEYS.RESTAURANTE_ID, String(selectedRestaurante));
      setSaved(tableNumber);
      Alert.alert('Mesa confirmada!', `Mesa ${tableNumber} selecionada com sucesso.`, [
        { text: 'Ver cardápio', onPress: () => router.push('/menu') },
        { text: 'OK' },
      ]);
    } catch (e) {
      logger.warn('Erro ao confirmar mesa:', e);
      Alert.alert('Erro', 'Não foi possível registrar a mesa. Tente novamente.');
    }
  };

  // ─── TELA DA CÂMERA ───────────────────────────────────────────────────────
  if (scanning) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        />
        {/* Overlay */}
        <View style={s.scanOverlay} pointerEvents="none">
          <View style={s.scanFrame} />
          <Text style={s.scanHint}>Aponte para o QR Code da mesa</Text>
        </View>
        <TouchableOpacity style={s.closeCamera} onPress={() => setScanning(false)}>
          <Ionicons name="close-circle" size={36} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    );
  }

  // ─── TELA PRINCIPAL ───────────────────────────────────────────────────────
  return (
    <View style={[shared.screen, { backgroundColor: theme.background }]}>

      <View style={[s.header, { backgroundColor: colors.navy }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Text style={shared.headerTitle}>Mesa</Text>
          <View style={{ flexDirection: 'row', gap: 4 }}>
            <TouchableOpacity onPress={toggleTheme} style={{ padding: 4 }}>
              <Ionicons
                name={theme.mode === 'dark' ? 'sunny-outline' : 'moon-outline'}
                size={20} color="rgba(255,255,255,0.75)"
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={{ padding: 4 }}>
              <Ionicons name="log-out-outline" size={20} color="rgba(255,255,255,0.75)" />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={shared.headerSub}>Escaneie o QR Code ou informe manualmente</Text>
      </View>

      <ScrollView contentContainerStyle={s.content}>

        {saved && (
          <View style={[s.savedCard, { backgroundColor: colors.orangePale, borderColor: colors.orange }]}>
            <Ionicons name="checkmark-circle" size={20} color={colors.orange} />
            <View style={{ flex: 1 }}>
              <Text style={[s.savedTitle, { color: colors.orange }]}>Mesa atual: {saved}</Text>
              <Text style={[s.savedSub, { color: colors.orangeDim }]}>
                Toque em confirmar para trocar de mesa
              </Text>
            </View>
          </View>
        )}

        {/* QR Code button */}
        <TouchableOpacity
          style={[s.qrCard, { backgroundColor: theme.surface, borderColor: colors.border }]}
          onPress={handleOpenCamera}
          activeOpacity={0.8}
        >
          <View style={[s.qrBox, { backgroundColor: theme.background }]}>
            <Ionicons name="qr-code-outline" size={52} color={colors.orange} />
          </View>
          <Text style={[s.qrTitle, { color: theme.text }]}>Escanear QR Code</Text>
          <Text style={[s.qrSub, { color: theme.textSecondary }]}>
            Toque aqui para abrir a câmera e escanear o código da mesa
          </Text>
          <View style={[s.scanBtn, { backgroundColor: colors.orange }]}>
            <Ionicons name="camera-outline" size={16} color="#FFFFFF" />
            <Text style={s.scanBtnText}>  Abrir câmera</Text>
          </View>
        </TouchableOpacity>

        {/* Divider */}
        <View style={s.divider}>
          <View style={[s.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[s.dividerText, { color: colors.textMuted }]}>ou informe manualmente</Text>
          <View style={[s.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        {/* Manual form */}
        <View style={[s.formCard, { backgroundColor: theme.surface, borderColor: colors.border }]}>

          <Text style={[s.label, { color: theme.textSecondary }]}>Restaurante</Text>
          <View style={s.restRow}>
            {RESTAURANTES.map(rest => (
              <TouchableOpacity
                key={rest.id}
                style={[
                  s.restBtn,
                  { borderColor: colors.border, backgroundColor: theme.background },
                  selectedRestaurante === rest.id && {
                    borderColor: colors.orange, backgroundColor: colors.orangePale,
                  },
                ]}
                onPress={() => setSelectedRestaurante(rest.id)}
              >
                <Text style={[
                  s.restText, { color: theme.textSecondary },
                  selectedRestaurante === rest.id && { color: colors.orange, fontWeight: '700' },
                ]}>
                  {rest.nome}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[s.label, { color: theme.textSecondary, marginTop: 14 }]}>Número da mesa</Text>
          <View style={[s.inputRow, { backgroundColor: theme.background, borderColor: colors.border }]}>
            <Ionicons name="grid-outline" size={16} color={colors.textSub} style={{ paddingLeft: 12 }} />
            <TextInput
              style={[s.input, { color: theme.text }]}
              placeholder="Ex: 5"
              placeholderTextColor={colors.textMuted}
              value={tableNumber} onChangeText={setTableNumber}
              keyboardType="numeric"
            />
          </View>

          <TouchableOpacity
            style={[s.confirmBtn, { backgroundColor: colors.orange }]}
            onPress={handleConfirmar}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
            <Text style={s.confirmText}>  Confirmar mesa</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  header: { paddingTop: 52, paddingBottom: 20, paddingHorizontal: 20 },
  content: { padding: 16, gap: 14 },

  savedCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 12, borderWidth: 1.5, padding: 12,
  },
  savedTitle: { fontSize: 14, fontWeight: '700' },
  savedSub:   { fontSize: 11, marginTop: 2 },

  qrCard: {
    borderRadius: radius.card, borderWidth: 1, padding: 24,
    alignItems: 'center', gap: 10,
    shadowColor: '#1E3A5F', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 2,
  },
  qrBox: {
    width: 100, height: 100, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  qrTitle: { fontSize: 15, fontWeight: '700' },
  qrSub:   { fontSize: 12, textAlign: 'center', lineHeight: 18 },
  scanBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 20, marginTop: 4,
  },
  scanBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },

  // Camera overlay
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
  },
  scanFrame: {
    width: 220, height: 220,
    borderWidth: 3, borderColor: '#FFFFFF',
    borderRadius: 16,
  },
  scanHint: {
    color: '#FFFFFF', fontSize: 14, fontWeight: '600',
    marginTop: 20, textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  closeCamera: {
    position: 'absolute', top: 52, right: 20,
  },

  divider: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 12, fontWeight: '600' },

  formCard: {
    borderRadius: radius.card, borderWidth: 1, padding: 16,
    shadowColor: '#1E3A5F', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 2,
  },
  label: { fontSize: 12, fontWeight: '700', marginBottom: 8 },
  restRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  restBtn: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5,
  },
  restText: { fontSize: 13, fontWeight: '500' },

  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderRadius: 12, height: 50,
  },
  input: { flex: 1, height: '100%', paddingHorizontal: 12, fontSize: 15 },

  confirmBtn: {
    borderRadius: 12, height: 50, marginTop: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  confirmText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
