import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ItemImage } from '../components/ItemImage';
import { useCart } from '../context/CartContext';

export default function ItemDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { addToCart } = useCart();
  const [observacao, setObservacao] = useState('');

  const handleAddToCart = () => {
    const item = {
      id: params.id,
      name: params.name,
      price: parseFloat(params.price),
      image: params.image,
      description: params.description,
      observacao: observacao.trim() || null,
    };
    
    addToCart(item);
    router.push('/cart');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.imageContainer}>
        <ItemImage source={params.image} emoji={params.image} size={100} />
      </View>

      <View style={styles.cardContainer}>
        <Card>
          <Text style={styles.name}>{params.name}</Text>
          <Text style={styles.price}>R$ {parseFloat(params.price).toFixed(2)}</Text>
          <Text style={styles.description}>{params.description}</Text>
        </Card>

        <Card style={{ marginTop: 16 }}>
          <Text style={styles.observacaoLabel}>Observação (opcional)</Text>
          <TextInput
            style={styles.observacaoInput}
            placeholder="Ex: sem cebola, bem passado, etc."
            value={observacao}
            onChangeText={setObservacao}
            multiline
            numberOfLines={3}
            placeholderTextColor="#95A5A6"
          />
        </Card>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="Adicionar à Comanda"
          onPress={handleAddToCart}
        />
        <Button
          title="Voltar"
          variant="secondary"
          onPress={() => router.push('/menu')}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  imageContainer: {
    alignItems: 'center',
    padding: 40,
    paddingTop: 80,
    backgroundColor: '#FFFFFF',
  },
  cardContainer: {
    paddingHorizontal: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 8,
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FF6B35',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#7F8C8D',
    lineHeight: 24,
  },
  observacaoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  observacaoInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#2C3E50',
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  buttonContainer: {
    padding: 16,
    gap: 12,
  },
});

