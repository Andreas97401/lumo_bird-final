import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

export interface AuthState {
  user: any | null;
  profile: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    profile: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Vérifier l'état d'authentification au démarrage
  const checkAuthState = async () => {
    try {
      console.log('Vérification de l\'état d\'authentification...');
      
      // Vérifier si l'utilisateur est connecté
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.log('Erreur lors de la vérification de l\'utilisateur:', error);
        setAuthState({
          user: null,
          profile: null,
          isLoading: false,
          isAuthenticated: false,
        });
        return;
      }

      if (user) {
        console.log('Utilisateur connecté trouvé:', user.email);
        
        // Récupérer le profil utilisateur
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.log('Erreur lors de la récupération du profil:', profileError);
          // Vérifier si c'est une erreur de colonne manquante
          if (profileError.message.includes('first_connection')) {
            console.log('Colonne first_connection manquante, utilisation du fallback');
            // Fallback : vérifier si l'utilisateur a terminé l'onboarding via AsyncStorage
            const onboardingDone = await AsyncStorage.getItem('onboardingDone');
            const hasCompletedOnboarding = onboardingDone === 'true';
            
            setAuthState({
              user,
              profile: { first_connection: !hasCompletedOnboarding },
              isLoading: false,
              isAuthenticated: true,
            });
          } else {
            setAuthState({
              user,
              profile: null,
              isLoading: false,
              isAuthenticated: true,
            });
          }
        } else {
          console.log('Profil utilisateur récupéré:', profile);
          setAuthState({
            user,
            profile,
            isLoading: false,
            isAuthenticated: true,
          });
        }
      } else {
        console.log('Aucun utilisateur connecté');
        setAuthState({
          user: null,
          profile: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'authentification:', error);
      setAuthState({
        user: null,
        profile: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  };

  // Écouter les changements d'état d'authentification
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Changement d\'état d\'authentification:', event, session?.user?.email);
        
        if (event === 'SIGNED_IN' && session?.user) {
          // Utilisateur connecté
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError && profileError.message.includes('first_connection')) {
            // Fallback pour la colonne manquante
            const onboardingDone = await AsyncStorage.getItem('onboardingDone');
            const hasCompletedOnboarding = onboardingDone === 'true';
            
            setAuthState({
              user: session.user,
              profile: { first_connection: !hasCompletedOnboarding },
              isLoading: false,
              isAuthenticated: true,
            });
          } else {
            setAuthState({
              user: session.user,
              profile: profileError ? null : profile,
              isLoading: false,
              isAuthenticated: true,
            });
          }
        } else if (event === 'SIGNED_OUT') {
          // Utilisateur déconnecté
          setAuthState({
            user: null,
            profile: null,
            isLoading: false,
            isAuthenticated: false,
          });
        }
      }
    );

    // Vérifier l'état initial
    checkAuthState();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    ...authState,
    checkAuthState,
  };
}; 