import { signOut, supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import BottomNavBar from '../components/BottomNavBar';

export default function CommunityPage() {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const [selectedTab, setSelectedTab] = useState(2); // 2 = Communauté
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

  const handleStartDiscussion = () => {
    Alert.alert('Discussion', 'Fonctionnalité de création de discussion à venir !');
  };

  const handleJoinEvent = () => {
    Alert.alert('Événement', 'Fonctionnalité de participation aux événements à venir !');
  };

  const handleViewMember = () => {
    Alert.alert('Membre', 'Page de profil membre à venir !');
  };

  const handleTabSelect = (idx: number) => {
    setSelectedTab(idx);
    if (idx === 0) {
      router.push('/StatsPage');
    } else if (idx === 1) {
      router.push('/HomeScreen');
    } else if (idx === 2) {
      router.push('/CommunityPage');
    }
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
              Communauté LumoBird 👥
            </Text>
            <Text style={styles.subtitleText}>
              Rejoignez la conversation et partagez vos expériences
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
              <TouchableOpacity style={styles.memberCard} onPress={handleViewMember}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberInitial}>A</Text>
                </View>
                <Text style={styles.memberName}>Alice</Text>
                <Text style={styles.memberStatus}>En ligne</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.memberCard} onPress={handleViewMember}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberInitial}>B</Text>
                </View>
                <Text style={styles.memberName}>Bob</Text>
                <Text style={styles.memberStatus}>Actif</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.memberCard} onPress={handleViewMember}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberInitial}>C</Text>
                </View>
                <Text style={styles.memberName}>Clara</Text>
                <Text style={styles.memberStatus}>En ligne</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.memberCard} onPress={handleViewMember}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberInitial}>D</Text>
                </View>
                <Text style={styles.memberName}>David</Text>
                <Text style={styles.memberStatus}>Actif</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Section Discussions */}
          <View style={styles.section}>
            <View style={styles.discussionsHeader}>
              <Text style={styles.sectionTitle}>Discussions Récentes</Text>
              <TouchableOpacity style={styles.startDiscussionButton} onPress={handleStartDiscussion}>
                <Text style={styles.startDiscussionText}>Nouvelle discussion</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.discussionsList}>
              <View style={styles.discussionCard}>
                <View style={styles.discussionHeader}>
                  <Text style={styles.discussionTitle}>Conseils pour débutants</Text>
                  <Text style={styles.discussionAuthor}>par Alice</Text>
                </View>
                <Text style={styles.discussionPreview}>
                  Salut tout le monde ! Je suis nouvelle et j'aimerais avoir des conseils...
                </Text>
                <View style={styles.discussionStats}>
                  <Text style={styles.discussionStat}>💬 12 réponses</Text>
                  <Text style={styles.discussionStat}>👁️ 45 vues</Text>
                  <Text style={styles.discussionTime}>Il y a 2h</Text>
                </View>
              </View>

              <View style={styles.discussionCard}>
                <View style={styles.discussionHeader}>
                  <Text style={styles.discussionTitle}>Partage d'expérience</Text>
                  <Text style={styles.discussionAuthor}>par Bob</Text>
                </View>
                <Text style={styles.discussionPreview}>
                  Voici comment j'ai réussi à atteindre mes objectifs...
                </Text>
                <View style={styles.discussionStats}>
                  <Text style={styles.discussionStat}>💬 8 réponses</Text>
                  <Text style={styles.discussionStat}>👁️ 32 vues</Text>
                  <Text style={styles.discussionTime}>Il y a 4h</Text>
                </View>
              </View>

              <View style={styles.discussionCard}>
                <View style={styles.discussionHeader}>
                  <Text style={styles.discussionTitle}>Question technique</Text>
                  <Text style={styles.discussionAuthor}>par Clara</Text>
                </View>
                <Text style={styles.discussionPreview}>
                  Quelqu'un peut m'aider avec cette fonctionnalité ?
                </Text>
                <View style={styles.discussionStats}>
                  <Text style={styles.discussionStat}>💬 5 réponses</Text>
                  <Text style={styles.discussionStat}>👁️ 28 vues</Text>
                  <Text style={styles.discussionTime}>Il y a 6h</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Section Événements */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Événements à Venir</Text>
            
            <View style={styles.eventsList}>
              <TouchableOpacity style={styles.eventCard} onPress={handleJoinEvent}>
                <View style={styles.eventHeader}>
                  <Text style={styles.eventTitle}>Webinaire LumoBird</Text>
                  <Text style={styles.eventDate}>15 Jan 2024</Text>
                </View>
                <Text style={styles.eventDescription}>
                  Découvrez les nouvelles fonctionnalités de LumoBird
                </Text>
                <View style={styles.eventStats}>
                  <Text style={styles.eventStat}>👥 25 participants</Text>
                  <Text style={styles.eventTime}>14:00 - 15:30</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.eventCard} onPress={handleJoinEvent}>
                <View style={styles.eventHeader}>
                  <Text style={styles.eventTitle}>Challenge Communauté</Text>
                  <Text style={styles.eventDate}>20 Jan 2024</Text>
                </View>
                <Text style={styles.eventDescription}>
                  Participez au défi mensuel de la communauté
                </Text>
                <View style={styles.eventStats}>
                  <Text style={styles.eventStat}>🏆 50 participants</Text>
                  <Text style={styles.eventTime}>Toute la journée</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Section Statistiques Communauté */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Statistiques Communauté</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>156</Text>
                <Text style={styles.statLabel}>Membres actifs</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>23</Text>
                <Text style={styles.statLabel}>Discussions</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>89</Text>
                <Text style={styles.statLabel}>Messages</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>5</Text>
                <Text style={styles.statLabel}>Événements</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </Animated.View>
      <BottomNavBar selectedIndex={selectedTab} onSelect={handleTabSelect} />
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
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  memberCard: {
    width: '48%',
    backgroundColor: 'rgba(198, 231, 226, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(198, 231, 226, 0.2)',
  },
  memberAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FD8B5A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  memberInitial: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  memberName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#C6E7E2',
    marginBottom: 4,
  },
  memberStatus: {
    fontSize: 12,
    color: '#71ABA4',
  },
  discussionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  startDiscussionButton: {
    backgroundColor: '#FD8B5A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  startDiscussionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  discussionsList: {
    gap: 12,
  },
  discussionCard: {
    backgroundColor: 'rgba(198, 231, 226, 0.1)',
    borderRadius: 12,
    padding: 16,
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
    flex: 1,
  },
  discussionAuthor: {
    fontSize: 12,
    color: 'rgba(198, 231, 226, 0.6)',
  },
  discussionPreview: {
    fontSize: 14,
    color: 'rgba(198, 231, 226, 0.7)',
    marginBottom: 12,
    lineHeight: 20,
  },
  discussionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  discussionStat: {
    fontSize: 12,
    color: 'rgba(198, 231, 226, 0.6)',
  },
  discussionTime: {
    fontSize: 12,
    color: 'rgba(198, 231, 226, 0.5)',
  },
  eventsList: {
    gap: 12,
  },
  eventCard: {
    backgroundColor: 'rgba(198, 231, 226, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(198, 231, 226, 0.2)',
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#C6E7E2',
    flex: 1,
  },
  eventDate: {
    fontSize: 12,
    color: '#FD8B5A',
    fontWeight: '600',
  },
  eventDescription: {
    fontSize: 14,
    color: 'rgba(198, 231, 226, 0.7)',
    marginBottom: 12,
    lineHeight: 20,
  },
  eventStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventStat: {
    fontSize: 12,
    color: 'rgba(198, 231, 226, 0.6)',
  },
  eventTime: {
    fontSize: 12,
    color: 'rgba(198, 231, 226, 0.5)',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: 'rgba(198, 231, 226, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(198, 231, 226, 0.2)',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FD8B5A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(198, 231, 226, 0.6)',
    textAlign: 'center',
  },
}); 