import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';

export function Button({ 
  title, 
  onPress, 
  variant = 'primary',
  loading = false,
  disabled = false 
}) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === 'primary' ? styles.primary : styles.secondary,
        (disabled || loading) && styles.disabled
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#FFFFFF' : '#1E3A5F'} />
      ) : (
        <Text style={variant === 'primary' ? styles.primaryText : styles.secondaryText}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  primary: {
    backgroundColor: '#FF6B35',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  secondary: {
    backgroundColor: '#F8F9FA',
  },
  disabled: {
    opacity: 0.5,
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryText: {
    color: '#1E3A5F',
    fontSize: 16,
    fontWeight: '600',
  },
});