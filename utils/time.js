// Utilitários para manipulação de tempo

// Converte string ISO pra Date tratando timestamps sem `Z` como UTC.
// A API .NET serializa DateTime UTC sem o `Z` no fim (ex: "2026-05-22T21:39:00").
// JS interpretaria isso como hora LOCAL e geraria offset de 3h no Brasil.
function parseAsUtc(date) {
  if (date instanceof Date) return date;
  if (typeof date !== 'string') return new Date(date);
  // Se já tem timezone (Z ou ±HH:MM no fim), usa direto
  if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(date)) return new Date(date);
  // Sem timezone → trata como UTC
  return new Date(date + 'Z');
}

// Calcula quantos minutos se passaram desde uma data
export function getMinutesSince(date) {
  if (!date) return null;

  const now = new Date();
  const targetDate = parseAsUtc(date);
  const diffMs = now - targetDate;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  return diffMinutes;
}

// Verifica se um pedido pode ser editado/cancelado (dentro do tempo limite)
export function canEditPedido(pedido, maxMinutes = 5) {
  if (!pedido || !pedido.dataCriacao) return false;

  const minutesSince = getMinutesSince(pedido.dataCriacao);
  if (minutesSince === null) return false;

  // Não pode editar se já foi cancelado, entregue ou finalizado (pago)
  const st = (pedido.status || '').toUpperCase();
  if (st === 'CANCELADO' || st === 'ENTREGUE' || st === 'FINALIZADO') {
    return false;
  }

  return minutesSince >= 0 && minutesSince <= maxMinutes;
}

// Formata a data/hora de criação do pedido
export function formatPedidoDate(dateString) {
  if (!dateString) return 'Data não disponível';

  const date = parseAsUtc(dateString);
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
    'ABERTO': 'Aberto',
    'PENDENTE': 'Pendente',
    'PREPARANDO': 'Preparando',
    'EM_PREPARO': 'Em Preparo',
    'PRONTO': 'Pronto',
    'ENTREGUE': 'Entregue',
    'FINALIZADO': 'Finalizado',
    'CANCELADO': 'Cancelado',
  };

  return statusMap[status] || status;
}
