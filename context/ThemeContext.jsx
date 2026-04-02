import { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = 'app:theme'; // 'light' | 'dark' | 'system'

//  palettes  
export const lightTheme = {
  mode: 'light',
  primary: '#FF6B35',
  primaryDark: '#E55A27',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  header: '#1E3A5F',
  headerText: '#FFFFFF',
  text: '#2C3E50',
  textSecondary: '#7F8C8D',
  textMuted: '#BDC3C7',
  border: '#E0E0E0',
  inputBackground: '#FFFFFF',
  tabBar: '#FFFFFF',
  tabBarBorder: '#E0E0E0',
  card: '#FFFFFF',
  cardShadow: '#000',
  danger: '#DC3545',
  success: '#28A745',
  warning: '#FFC107',
  info: '#17A2B8',
};

export const darkTheme = {
  mode: 'dark',
  primary: '#FF6B35',
  primaryDark: '#E55A27',
  background: '#121212',
  surface: '#1E1E1E',
  header: '#0D2137',
  headerText: '#FFFFFF',
  text: '#E8E8E8',
  textSecondary: '#A0A0A0',
  textMuted: '#555',
  border: '#2C2C2C',
  inputBackground: '#2C2C2C',
  tabBar: '#1A1A1A',
  tabBarBorder: '#2C2C2C',
  card: '#1E1E1E',
  cardShadow: '#000',
  danger: '#FF4D5B',
  success: '#4CAF50',
  warning: '#FFC107',
  info: '#29B6F6',
};

// Context
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme(); // 'light' | 'dark'
  const [preference, setPreference] = useState('system'); // 'light' | 'dark' | 'system'

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((saved) => {
      if (saved) setPreference(saved);
    });
  }, []);

  const toggleTheme = async () => {
    const next = resolvedMode === 'light' ? 'dark' : 'light';
    setPreference(next);
    await AsyncStorage.setItem(THEME_KEY, next);
  };

  const setTheme = async (mode) => {
    setPreference(mode);
    await AsyncStorage.setItem(THEME_KEY, mode);
  };

  const resolvedMode =
    preference === 'system' ? (systemScheme || 'light') : preference;

  const theme = resolvedMode === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, preference }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme deve ser usado dentro de <ThemeProvider>');
  return ctx;
}