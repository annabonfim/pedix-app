// Mapeamento de emojis para itens do cardápio

// Emojis por nome do item (prioridade)
const nameEmojiMap = {
  // Bebidas
  'refrigerante': '🥤',
  'coca': '🥤',
  'coca-cola': '🥤',
  'pepsi': '🥤',
  'suco': '🧃',
  'suco de laranja': '🧃',
  'suco de limão': '🧃',
  'água': '💧',
  'água mineral': '💧',
  'cerveja': '🍺',
  'vinho': '🍷',
  'café': '☕',
  'cafe': '☕',
  'chá': '🍵',
  'cha': '🍵',
  'milkshake': '🥤',
  'milkshake de chocolate': '🥤',
  'milkshake de morango': '🥤',
  
  // Pratos principais
  'pizza': '🍕',
//   'hambúrguer': '🍔',
//   'hamburguer': '🍔',
//   'hamburger': '🍔',
  'sanduíche': '🥪',
  'sanduiche': '🥪',
  'sandwich': '🥪',
  'lasanha': '🍝',
  'macarronada': '🍝',
  'espaguete': '🍝',
  'massa': '🍝',
  'sushi': '🍣',
  'sashimi': '🍱',
  'temaki': '🍣',
  'salmão': '🐟',
  'salmão grelhado': '🐟',
  'frango': '🍗',
  'frango grelhado': '🍗',
  'peixe': '🐟',
  'carne': '🥩',
  'bife': '🥩',
  'salada': '🥗',
  'risotto': '🍚',
  'risoto': '🍚',
  
  // Sobremesas
  'sorvete': '🍨',
  'açai': '🍧',
  'acai': '🍧',
  'pudim': '🍮',
  'mousse': '🍮',
  'bolo': '🎂',
  'torta': '🥧',
  'brownie': '🍫',
  'brigadeiro': '🍫',
  'brigadeiro de chocolate': '🍫',
  'petit gateau': '🍰',
  'tiramisu': '🍰',
  'cheesecake': '🍰',
  
  // Acompanhamentos
  'batata frita': '🍟',
  'batata': '🥔',
  'arroz': '🍚',
  'feijão': '🫘',
  'feijao': '🫘',
  'fritas': '🍟',
};

// Emojis por categoria
const categoryEmojiMap = {
  'Pratos': '🍽️',
  'Bebidas': '🥤',
  'Sobremesas': '🍰',
  'Acompanhamentos': '🍟',
};

// Função principal para obter emoji
export function getItemEmoji(item) {
  // Se tem imagemUrl e é uma URL válida (http/https), retorna null (usa a imagem)
  const imagemUrl = item.imagemUrl || item.image || item.imageUrl;
  if (imagemUrl && (imagemUrl.startsWith('http://') || imagemUrl.startsWith('https://'))) {
    return null;
  }
  // Se imagemUrl existe mas não é URL (é emoji), retorna null para usar o emoji direto do banco
  
  // Tenta pegar pelo nome (case insensitive)
  const itemName = (item.nome || item.name || '').toLowerCase().trim();
  
  if (itemName && nameEmojiMap[itemName]) {
    return nameEmojiMap[itemName];
  }
  
  // Tenta buscar por palavra-chave no nome
  const nameKeys = Object.keys(nameEmojiMap);
  for (let i = 0; i < nameKeys.length; i++) {
    if (itemName.includes(nameKeys[i])) {
      return nameEmojiMap[nameKeys[i]];
    }
  }
  
  // Tenta pegar pela categoria
  const category = item.categoria || item.category || '';
  if (category && categoryEmojiMap[category]) {
    return categoryEmojiMap[category];
  }
  
  // Fallback: emoji genérico baseado na categoria
  if (category === 'Bebidas' || category === 'bebidas') {
    return '🥤';
  }
  if (category === 'Sobremesas' || category === 'sobremesas') {
    return '🍰';
  }
  if (category === 'Pratos' || category === 'pratos') {
    return '🍽️';
  }
  
  // Fallback final
  return '🍽️';
}

