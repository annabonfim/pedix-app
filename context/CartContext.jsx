import { createContext, useState, useContext } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  // Cada item no carrinho tem: id, nome, preço, imagem, descrição, observação e quantidade
  const [cartItems, setCartItems] = useState([]);

  const addToCart = (item) => {
    setCartItems(prevItems => {
      // Verifica se já existe um item com o mesmo ID e observação
      const existingIndex = prevItems.findIndex(
        i => i.id === item.id && i.observacao === (item.observacao || null)
      );

      if (existingIndex >= 0) {
        // Se existe, aumenta a quantidade
        const updated = [...prevItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: (updated[existingIndex].quantity || 1) + 1,
        };
        return updated;
      } else {
        // Se não existe, adiciona novo item com quantity = 1
        return [...prevItems, { ...item, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (index) => {
    setCartItems(prevItems => prevItems.filter((_, i) => i !== index));
  };

  const updateItemQuantity = (index, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(index);
      return;
    }
    setCartItems(prevItems => {
      const updated = [...prevItems];
      updated[index] = {
        ...updated[index],
        quantity: newQuantity,
      };
      return updated;
    });
  };

  const updateItemObservacao = (index, observacao) => {
    setCartItems(prevItems => {
      const updated = [...prevItems];
      updated[index] = {
        ...updated[index],
        observacao: observacao.trim() || null,
      };
      return updated;
    });
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartCount = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      cartCount,
      addToCart,
      addItem: addToCart,
      removeFromCart,
      updateItemQuantity,
      updateItemObservacao,
      clearCart
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart deve ser usado dentro de <CartProvider>');
  }
  return context;
};