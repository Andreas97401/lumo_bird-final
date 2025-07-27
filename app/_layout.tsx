import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { useTranslation } from 'react-i18next';
import { AuthProvider } from '../components/AuthProvider';
import { useSettings } from '../hooks/useSettings';
import '../lib/i18n';
import { NotificationService } from '../lib/notifications';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    Righteous: require('../assets/fonts/Righteous-Regular.ttf'),
  });
  const { language } = useSettings();
  const { i18n } = useTranslation();
  
  // Synchronisation globale de la langue
  React.useEffect(() => {
    if (language) i18n.changeLanguage(language);
  }, [language]);

  // Initialiser les notifications
  React.useEffect(() => {
    const initializeNotifications = async () => {
      try {
        // Enregistrer pour les notifications push
        const token = await NotificationService.registerForPushNotifications();
        if (token) {
          console.log('Notifications initialisées avec succès');
        }
        
        // Configurer les listeners
        const cleanup = NotificationService.setupNotificationListeners();
        return cleanup;
      } catch (error) {
        console.error('Erreur lors de l\'initialisation des notifications:', error);
      }
    };

    initializeNotifications();
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthProvider>
          <Stack
            screenOptions={{
              animation: 'none', // Désactive toutes les animations de transition
              animationTypeForReplace: 'push',
              // Optimisations pour accélérer le chargement
              gestureEnabled: false, // Désactive les gestes pour plus de performance
              gestureDirection: 'horizontal',
              // Préchargement des écrans
              presentation: 'card',
              // Optimisations de performance
              headerShown: false,
            }}
          >
            <Stack.Screen 
              name="index" 
              options={{ 
                headerShown: false,
                // Préchargement de la page d'accueil
                freezeOnBlur: false,
              }} 
            />
            <Stack.Screen 
              name="LoginScreen" 
              options={{ 
                headerShown: false,
                freezeOnBlur: false,
              }} 
            />
            <Stack.Screen 
              name="Signup" 
              options={{ 
                headerShown: false,
                freezeOnBlur: false,
              }} 
            />
            <Stack.Screen 
              name="HomeScreen" 
              options={{ 
                headerShown: false,
                freezeOnBlur: false,
              }} 
            />
            <Stack.Screen 
              name="CommunityPage" 
              options={{ 
                headerShown: false,
                freezeOnBlur: false,
              }} 
            />
            <Stack.Screen 
              name="StatsPage" 
              options={{ 
                headerShown: false,
                freezeOnBlur: false,
              }} 
            />
            <Stack.Screen 
              name="OnboardingScreen" 
              options={{ 
                headerShown: false,
                freezeOnBlur: false,
              }} 
            />
            <Stack.Screen 
              name="SettingsPage" 
              options={{ 
                headerShown: false,
                freezeOnBlur: false,
              }} 
            />
            <Stack.Screen 
              name="HelpSupport" 
              options={{ 
                headerShown: false,
                freezeOnBlur: false,
              }} 
            />
            <Stack.Screen 
              name="PrivacyPolicy" 
              options={{ 
                headerShown: false,
                freezeOnBlur: false,
              }} 
            />
            <Stack.Screen 
              name="TermsOfUse" 
              options={{ 
                headerShown: false,
                freezeOnBlur: false,
              }} 
            />
            <Stack.Screen 
              name="GroupPage" 
              options={{ 
                headerShown: false,
                freezeOnBlur: false,
              }} 
            />
          </Stack>
          <StatusBar style="auto" />
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
