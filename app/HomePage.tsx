import { signOut, supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

const { width, height } = Dimensions.get('window');

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const router = useRouter();

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    const checkUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          console.log('Utilisateur non connecté, redirection vers LoginScreen');
          router.push('/LoginScreen');
          return;
        }

        console.log('Utilisateur connecté:', user.email);
        setUser(user);
        
        // Récupérer le profil utilisateur
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          console.error('Erreur lors de la récupération du profil:', profileError);
          // Même si le profil n'existe pas, on peut continuer
        } else {
          console.log('Profil utilisateur récupéré:', profile);
          setUserProfile(profile);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de l\'utilisateur:', error);
        router.push('/LoginScreen');
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      // Animation d'entrée seulement après le chargement
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [isLoading]);

  const handleLogout = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await signOut();
              if (result.success) {
                console.log('Déconnexion réussie');
                router.push('/LoginScreen');
              } else {
                Alert.alert('Erreur', 'Erreur lors de la déconnexion');
              }
            } catch (error) {
              console.error('Erreur lors de la déconnexion:', error);
              Alert.alert('Erreur', 'Erreur lors de la déconnexion');
            }
          },
        },
      ]
    );
  };

  const handleStartChat = () => {
    Alert.alert('Chat', 'Fonctionnalité de chat à venir !');
  };

  const handleViewProfile = () => {
    Alert.alert('Profil', 'Page de profil à venir !');
  };

  const handleNavigateToStats = () => {
    router.push('/StatsPage');
  };

  const handleNavigateToCommunity = () => {
    router.push('/CommunityPage');
  };

  // Affichage de chargement
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#041836" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FD8B5A" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Si pas d'utilisateur, rediriger
  if (!user) {
    return null; // La redirection se fait dans useEffect
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#041836" />
      
      <Animated.View 
        style={[
          styles.content,
          { 
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>
              Bonjour {userProfile?.prenom || user.email?.split('@')[0] || 'Utilisateur'} ! 👋
            </Text>
            <Text style={styles.subtitleText}>
              Prêt à explorer LumoBird ?
            </Text>
            {userProfile?.prenom && (
              <Text style={styles.userInfo}>
                Connecté en tant que : {userProfile.prenom} ({user.email})
              </Text>
            )}
          </View>
          
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Déconnexion</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Section Profil */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mon Profil</Text>
            <TouchableOpacity style={styles.profileCard} onPress={handleViewProfile}>
              <View style={styles.profileInfo}>
                <View style={styles.avatarContainer}>
                  <Text style={styles.avatarText}>
                    {userProfile?.prenom?.charAt(0) || user.email?.charAt(0) || 'U'}
                  </Text>
                </View>
                <View style={styles.profileDetails}>
                  <Text style={styles.profileName}>
                    {userProfile?.prenom || 'Utilisateur'}
                  </Text>
                  <Text style={styles.profileEmail}>{user.email}</Text>
                </View>
              </View>
              <Text style={styles.editText}>Modifier</Text>
            </TouchableOpacity>
          </View>

          {/* Section Actions Rapides */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Actions Rapides</Text>
            <View style={styles.actionsGrid}>
              <TouchableOpacity style={styles.actionCard} onPress={handleStartChat}>
                <View style={styles.actionIcon}>
                  <Text style={styles.actionIconText}>💬</Text>
                </View>
                <Text style={styles.actionTitle}>Commencer un chat</Text>
                <Text style={styles.actionSubtitle}>Discuter avec la communauté</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard} onPress={handleNavigateToStats}>
                <View style={styles.actionIcon}>
                  <Text style={styles.actionIconText}>📊</Text>
                </View>
                <Text style={styles.actionTitle}>Mes Statistiques</Text>
                <Text style={styles.actionSubtitle}>Voir mes progrès</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard} onPress={handleNavigateToCommunity}>
                <View style={styles.actionIcon}>
                  <Text style={styles.actionIconText}>👥</Text>
                </View>
                <Text style={styles.actionTitle}>Communauté</Text>
                <Text style={styles.actionSubtitle}>Rejoindre les discussions</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard} onPress={handleViewProfile}>
                <View style={styles.actionIcon}>
                  <Text style={styles.actionIconText}>👤</Text>
                </View>
                <Text style={styles.actionTitle}>Mon Profil</Text>
                <Text style={styles.actionSubtitle}>Gérer mes informations</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Section Activité Récente */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Activité Récente</Text>
            <View style={styles.activityCard}>
              <View style={styles.activityItem}>
                <View style={styles.activityDot} />
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>Bienvenue sur LumoBird !</Text>
                  <Text style={styles.activitySubtitle}>Il y a quelques minutes</Text>
                </View>
              </View>
              
              <View style={styles.activityItem}>
                <View style={styles.activityDot} />
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>Profil créé avec succès</Text>
                  <Text style={styles.activitySubtitle}>Il y a quelques minutes</Text>
                </View>
              </View>
              
              <View style={styles.activityItem}>
                <View style={styles.activityDot} />
                <View style={styles.activityContent}>
                  <Text style={styles.activityTitle}>Prêt à commencer l'aventure</Text>
                  <Text style={styles.activitySubtitle}>Il y a quelques minutes</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#041836',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#C6E7E2',
    fontSize: 16,
    marginTop: 16,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(198, 231, 226, 0.1)',
  },
  welcomeSection: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#C6E7E2',
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 14,
    color: 'rgba(198, 231, 226, 0.7)',
    marginBottom: 4,
  },
  userInfo: {
    fontSize: 12,
    color: 'rgba(198, 231, 226, 0.5)',
    fontStyle: 'italic',
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(253, 139, 90, 0.2)',
    borderWidth: 1,
    borderColor: '#FD8B5A',
  },
  logoutText: {
    color: '#FD8B5A',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  section: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#C6E7E2',
    marginBottom: 15,
  },
  profileCard: {
    backgroundColor: 'rgba(198, 231, 226, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(198, 231, 226, 0.2)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FD8B5A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#C6E7E2',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: 'rgba(198, 231, 226, 0.7)',
    marginBottom: 2,
  },
  editText: {
    color: '#FD8B5A',
    fontSize: 14,
    fontWeight: '600',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: (width - 60) / 2,
    backgroundColor: 'rgba(198, 231, 226, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(198, 231, 226, 0.2)',
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(253, 139, 90, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionIconText: {
    fontSize: 20,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#C6E7E2',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: 'rgba(198, 231, 226, 0.6)',
  },
  activityCard: {
    backgroundColor: 'rgba(198, 231, 226, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(198, 231, 226, 0.2)',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FD8B5A',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    color: '#C6E7E2',
    marginBottom: 2,
  },
  activitySubtitle: {
    fontSize: 12,
    color: 'rgba(198, 231, 226, 0.5)',
  },
}); 