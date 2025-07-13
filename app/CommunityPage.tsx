import BottomNavBar from '@/components/BottomNavBar';
import { signOut, supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
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

export default function CommunityPage() {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('community');
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

        setUser(user);
        
        // Récupérer le profil utilisateur
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (!profileError) {
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

  const handleTabPress = (tab: string) => {
    setActiveTab(tab);
    
    switch (tab) {
      case 'community':
        // Déjà sur la page communauté
        break;
      case 'home':
        router.push('/HomePage');
        break;
      case 'stats':
        router.push('/StatsPage');
        break;
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            const result = await signOut();
            if (result.success) {
              router.push('/LoginScreen');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#041836" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
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
            <Text style={styles.welcomeText}>Communauté 👥</Text>
            <Text style={styles.subtitleText}>
              Rejoignez la communauté LumoBird
            </Text>
          </View>
          
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Déconnexion</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Section Membres */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Membres Actifs</Text>
            <View style={styles.membersGrid}>
              <View style={styles.memberCard}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberInitial}>A</Text>
                </View>
                <Text style={styles.memberName}>Alice</Text>
                <Text style={styles.memberStatus}>En ligne</Text>
              </View>
              
              <View style={styles.memberCard}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberInitial}>B</Text>
                </View>
                <Text style={styles.memberName}>Bob</Text>
                <Text style={styles.memberStatus}>En ligne</Text>
              </View>
              
              <View style={styles.memberCard}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberInitial}>C</Text>
                </View>
                <Text style={styles.memberName}>Clara</Text>
                <Text style={styles.memberStatus}>Hors ligne</Text>
              </View>
            </View>
          </View>

          {/* Section Discussions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Discussions Récentes</Text>
            <View style={styles.discussionCard}>
              <View style={styles.discussionHeader}>
                <Text style={styles.discussionTitle}>Conseils pour débutants</Text>
                <Text style={styles.discussionTime}>Il y a 2h</Text>
              </View>
              <Text style={styles.discussionPreview}>
                "Salut tout le monde ! Je débute avec LumoBird, avez-vous des conseils ?"
              </Text>
              <View style={styles.discussionStats}>
                <Text style={styles.statText}>💬 12 réponses</Text>
                <Text style={styles.statText}>👁️ 45 vues</Text>
              </View>
            </View>
            
            <View style={styles.discussionCard}>
              <View style={styles.discussionHeader}>
                <Text style={styles.discussionTitle}>Partage de progrès</Text>
                <Text style={styles.discussionTime}>Il y a 5h</Text>
              </View>
              <Text style={styles.discussionPreview}>
                "J'ai atteint mon objectif du mois ! 🎉"
              </Text>
              <View style={styles.discussionStats}>
                <Text style={styles.statText}>💬 8 réponses</Text>
                <Text style={styles.statText}>👁️ 32 vues</Text>
              </View>
            </View>
          </View>

          {/* Section Événements */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Événements à Venir</Text>
            <View style={styles.eventCard}>
              <Text style={styles.eventTitle}>🏆 Challenge Mensuel</Text>
              <Text style={styles.eventDate}>15-30 Décembre</Text>
              <Text style={styles.eventDescription}>
                Participez au challenge de fin d'année et gagnez des récompenses !
              </Text>
              <TouchableOpacity style={styles.eventButton}>
                <Text style={styles.eventButtonText}>Participer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Barre de navigation */}
        <BottomNavBar 
          activeTab={activeTab}
          onTabPress={handleTabPress}
        />
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
  membersGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  memberCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(198, 231, 226, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(198, 231, 226, 0.2)',
    minWidth: 80,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FD8B5A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  memberInitial: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  memberName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#C6E7E2',
    marginBottom: 2,
  },
  memberStatus: {
    fontSize: 10,
    color: 'rgba(198, 231, 226, 0.6)',
  },
  discussionCard: {
    backgroundColor: 'rgba(198, 231, 226, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(198, 231, 226, 0.2)',
  },
  discussionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  discussionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#C6E7E2',
  },
  discussionTime: {
    fontSize: 12,
    color: 'rgba(198, 231, 226, 0.6)',
  },
  discussionPreview: {
    fontSize: 14,
    color: 'rgba(198, 231, 226, 0.8)',
    marginBottom: 12,
    lineHeight: 20,
  },
  discussionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statText: {
    fontSize: 12,
    color: 'rgba(198, 231, 226, 0.6)',
  },
  eventCard: {
    backgroundColor: 'rgba(198, 231, 226, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(198, 231, 226, 0.2)',
    alignItems: 'center',
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#C6E7E2',
    marginBottom: 8,
  },
  eventDate: {
    fontSize: 14,
    color: '#FD8B5A',
    marginBottom: 12,
  },
  eventDescription: {
    fontSize: 14,
    color: 'rgba(198, 231, 226, 0.7)',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  eventButton: {
    backgroundColor: '#FD8B5A',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  eventButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
}); 