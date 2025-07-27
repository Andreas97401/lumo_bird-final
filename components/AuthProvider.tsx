import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { NotificationService } from '../lib/notifications';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { user, profile, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && user) {
        // Sauvegarder le token push pour l'utilisateur connecté
        const savePushToken = async () => {
          try {
            const token = await NotificationService.registerForPushNotifications();
            if (token && user.id) {
              await NotificationService.savePushToken(user.id, token);
              console.log('Token push sauvegardé pour l\'utilisateur');
            }
          } catch (error) {
            console.error('Erreur lors de la sauvegarde du token push:', error);
          }
        };
        
        savePushToken();

        // Utilisateur connecté - vérifier s'il doit aller à l'onboarding
        if (profile?.first_connection) {
          console.log('Première connexion détectée, redirection vers OnboardingScreen');
          router.replace('/OnboardingScreen');
        } else {
          console.log('Utilisateur connecté, redirection vers HomeScreen');
          router.replace('/HomeScreen');
        }
      } else {
        // Utilisateur non connecté - rester sur la page d'accueil
        console.log('Utilisateur non connecté, affichage de la page d\'accueil');
      }
    }
  }, [isLoading, isAuthenticated, user, profile, router]);

  // Afficher un écran de chargement pendant la vérification d'auth
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Vérification de la connexion...</Text>
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#041836',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
  },
}); 