import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

export interface AppSettings {
  notifications: boolean;
  soundEffects: boolean;
  hapticFeedback: boolean;
  darkMode: boolean;
  autoLogin: boolean;
  dataSync: boolean;
  language: 'fr' | 'en'; // Ajout de la langue
}

const defaultSettings: AppSettings = {
  notifications: true,
  soundEffects: true,
  hapticFeedback: true,
  darkMode: false,
  autoLogin: true,
  dataSync: true,
  language: 'fr', // Valeur par défaut
};

export const useSettings = () => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les paramètres au démarrage
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('appSettings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsedSettings });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings: AppSettings) => {
    try {
      await AsyncStorage.setItem('appSettings', JSON.stringify(newSettings));
      setSettings(newSettings);
      console.log('Paramètres sauvegardés:', newSettings);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des paramètres:', error);
    }
  };

  const updateSetting = async (key: keyof AppSettings, value: boolean | 'fr' | 'en') => {
    const newSettings = { ...settings, [key]: value };
    await saveSettings(newSettings);
  };

  const setLanguage = async (lang: 'fr' | 'en') => {
    await updateSetting('language', lang);
  };

  const resetSettings = async () => {
    await saveSettings(defaultSettings);
  };

  const clearAllData = async () => {
    try {
      await AsyncStorage.clear();
      setSettings(defaultSettings);
      console.log('Toutes les données ont été effacées');
    } catch (error) {
      console.error('Erreur lors de l\'effacement des données:', error);
    }
  };

  return {
    settings,
    isLoading,
    updateSetting,
    resetSettings,
    clearAllData,
    loadSettings,
    language: settings.language,
    setLanguage,
  };
}; 