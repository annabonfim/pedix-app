import { View, StyleSheet, Pressable } from 'react-native';

export function Card({ children, onPress }) {
  if (onPress) {
    return (
      <Pressable style={styles.card} onPress={onPress}>
        {children}
      </Pressable>
    );
  }

  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
});