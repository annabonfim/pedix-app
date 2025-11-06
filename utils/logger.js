// Logger utilitário que só funciona em modo desenvolvimento
// Em produção, as chamadas são no-ops (não fazem nada)

const isDev = typeof __DEV__ !== 'undefined' && __DEV__;

export const logger = {
  log: (...args) => {
    if (isDev) {
      console.log(...args);
    }
  },
  
  error: (...args) => {
    if (isDev) {
      console.error(...args);
    }
  },
  
  warn: (...args) => {
    if (isDev) {
      console.warn(...args);
    }
  },
  
  info: (...args) => {
    if (isDev) {
      console.info(...args);
    }
  },
};



