// context/TuttiChatContext.jsx
// Estado global do chat do Tutti (modal aberto/fechado).
// Permite abrir o chat de fora do TuttiFAB — ex: quando o cliente toca
// na notificação proativa, o listener navega pro menu e chama openChat().

import { createContext, useCallback, useContext, useState } from 'react';

const TuttiChatContext = createContext(null);

export function TuttiChatProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const openChat = useCallback(() => setIsOpen(true), []);
  const closeChat = useCallback(() => setIsOpen(false), []);

  return (
    <TuttiChatContext.Provider value={{ isOpen, openChat, closeChat }}>
      {children}
    </TuttiChatContext.Provider>
  );
}

export function useTuttiChat() {
  const ctx = useContext(TuttiChatContext);
  if (!ctx) throw new Error('useTuttiChat deve ser usado dentro de <TuttiChatProvider>');
  return ctx;
}
