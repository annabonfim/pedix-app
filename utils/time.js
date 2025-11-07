// Utilitários para manipulação de tempo

// Calcula quantos minutos se passaram desde uma data
export function getMinutesSince(date) {
  if (!date) return null;
  
  const now = new Date();
  const targetDate = new Date(date);
  const diffMs = now - targetDate;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  
  return diffMinutes;
}

// Verifica se um pedido pode ser editado/cancelado (dentro do tempo limite)
export function canEditPedido(pedido, maxMinutes = 5) {
  if (!pedido || !pedido.dataCriacao) return false;
  
  const minutesSince = getMinutesSince(pedido.dataCriacao);
  if (minutesSince === null) return false;
  
  // Não pode editar se já foi cancelado ou entregue
  if (pedido.status === 'CANCELADO' || pedido.status === 'ENTREGUE') {
    return false;
  }
  
  return minutesSince <= maxMinutes;
}

// Formata a data/hora de criação do pedido
export function formatPedidoDate(dateString) {
  if (!dateString) return 'Data não disponível';
  
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return 'Data inválida';
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${day}/${month}/${year} às ${hours}:${minutes}`;
}

// Formata tempo restante para editar (ex: "2 min restantes")
export function getTimeRemaining(date, maxMinutes = 5) {
  if (!date) return null;
  
  const minutesSince = getMinutesSince(date);
  if (minutesSince === null) return null;
  
  const remaining = maxMinutes - minutesSince;
  
  if (remaining <= 0) {
    return 'Tempo esgotado';
  }
  
  if (remaining === 1) {
    return '1 min restante';
  }
  
  return `${remaining} min restantes`;
}

// Traduz status do pedido para português
export function translateStatus(status) {
  const statusMap = {
    'PENDENTE': 'Pendente',
    'PREPARANDO': 'Preparando',
    'PRONTO': 'Pronto',
    'ENTREGUE': 'Entregue',
    'CANCELADO': 'Cancelado',
  };
  
  return statusMap[status] || status;
}


