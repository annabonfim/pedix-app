export const colors = {
  // Paleta principal
  navy:        '#1E3A5F',
  navyDark:    '#142A47',
  navyLight:   '#2A4F7F',
  orange:      '#FF6B35',
  orangeDim:   '#E55A27',
  orangePale:  '#FFF0EA',

  // Backgrounds
  bg:          '#F0F4F8',
  surface:     '#FFFFFF',
  grayPale:    '#F1F5F9',

  // Bordas e texto
  border:      '#E2E8F0',
  text:        '#2C3E50',
  textSub:     '#64748B',
  textMuted:   '#94A3B8',

  // Status
  green:       '#22C55E',
  greenPale:   '#DCFCE7',
  greenText:   '#16A34A',
  amber:       '#F59E0B',
  amberPale:   '#FEF3C7',
  amberText:   '#D97706',
  blue:        '#3B82F6',
  bluePale:    '#DBEAFE',
  blueText:    '#1D4ED8',
  red:         '#EF4444',
  redPale:     '#FEE2E2',
  redText:     '#DC2626',
};

export const shadows = {
  card: {
    shadowColor: '#1E3A5F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 3,
  },
  header: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
};

export const radius = {
  card: 14,
  sm:   8,
  pill: 20,
  full: 999,
};

export const typography = {
  h1:    { fontSize: 22, fontWeight: '800', color: colors.text },
  h2:    { fontSize: 18, fontWeight: '700', color: colors.text },
  h3:    { fontSize: 15, fontWeight: '700', color: colors.text },
  body:  { fontSize: 14, fontWeight: '400', color: colors.text },
  small: { fontSize: 12, fontWeight: '400', color: colors.textSub },
  label: { fontSize: 12, fontWeight: '700', color: colors.textSub },
  price: { fontSize: 15, fontWeight: '700', color: colors.orange },
  total: { fontSize: 18, fontWeight: '800', color: colors.orange },
  sectionTitle: {
    fontSize: 12, fontWeight: '700',
    color: colors.textSub, textTransform: 'uppercase', letterSpacing: 0.6,
  },
};

// Estilos reutilizáveis
export const shared = {
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  header: {
    backgroundColor: colors.navy,
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 50,
  },
  headerTitle: {
    fontSize: 20, fontWeight: '700', color: '#FFFFFF',
  },
  headerSub: {
    fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 3,
  },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: 12,
    fontSize: 14,
    color: colors.text,
  },
  btnPrimary: {
    backgroundColor: colors.orange,
    borderRadius: radius.sm,
    padding: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: {
    color: '#FFFFFF', fontWeight: '700', fontSize: 14,
  },
  btnSecondary: {
    backgroundColor: colors.grayPale,
    borderRadius: radius.sm,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryText: {
    color: colors.text, fontWeight: '600', fontSize: 13,
  },
  tabBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: 14,
    paddingTop: 8,
    height: 62,
  },
  tabLabel: {
    fontSize: 10, fontWeight: '600',
  },
};

// Badge helpers
export const badge = {
  base: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: radius.pill,
  },
  text: { fontSize: 11, fontWeight: '600' },
  orange: { backgroundColor: colors.orangePale, color: colors.orange },
  green:  { backgroundColor: colors.greenPale,  color: colors.greenText },
  amber:  { backgroundColor: colors.amberPale,  color: colors.amberText },
  blue:   { backgroundColor: colors.bluePale,   color: colors.blueText },
  red:    { backgroundColor: colors.redPale,    color: colors.redText },
  gray:   { backgroundColor: colors.grayPale,   color: colors.textSub },
};