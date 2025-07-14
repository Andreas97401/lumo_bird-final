import { signOut } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';

import { useTranslation } from 'react-i18next';
import BottomNavBar from '../components/BottomNavBar';
import { Text } from '../components/Text';

export default function CommunityPage() {
  const [selectedTab, setSelectedTab] = useState(2); // 2 = Communauté
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const { t } = useTranslation();

  useEffect(() => {
    // Animations parallèles pour un chargement plus rapide
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200, // Réduit de 600ms à 200ms
        useNativeDriver: true,
        easing: Easing.out(Easing.quad), // Easing plus rapide
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
    ]).start();
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      t('community.logout'),
      t('community.logout_confirm'),
      [
        {
          text: t('community.cancel'),
          style: 'cancel',
        },
        {
          text: t('community.logout'),
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await signOut();
              if (result.success) {
                console.log('Déconnexion réussie');
                router.push('/LoginScreen');
              } else {
                Alert.alert(t('community.error'), t('community.logout_error'));
              }
            } catch (error) {
              console.error('Erreur lors de la déconnexion:', error);
              Alert.alert(t('community.error'), t('community.logout_error'));
            }
          },
        },
      ]
    );
  };

  const handleStartDiscussion = () => {
    Alert.alert(t('community.discussion'), t('community.coming_soon'));
  };

  const handleJoinEvent = () => {
    Alert.alert(t('community.event'), t('community.coming_soon'));
  };

  const handleViewMember = () => {
    Alert.alert(t('community.member'), t('community.coming_soon'));
  };

  const handleTabSelect = (idx: number) => {
    setSelectedTab(idx);
    // Consistent navigation logic
    if (idx === 0) {
      router.push('/StatsPage');
    } else if (idx === 1) {
      router.push('/HomeScreen');
    } else if (idx === 2) {
      // Already on CommunityPage, no navigation needed
      return;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#041836" />
      
      <Animated.View 
        style={[
          styles.content,
          { 
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>
              {t('community.title')}
            </Text>
            <Text style={styles.subtitleText}>
              {t('community.subtitle')}
            </Text>
          </View>
          
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>{t('community.logout')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Section Membres */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('community.active_members')}</Text>
            <View style={styles.membersGrid}>
              <TouchableOpacity style={styles.memberCard} onPress={handleViewMember}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberInitial}>A</Text>
                </View>
                <Text style={styles.memberName}>Alice</Text>
                <Text style={styles.memberStatus}>{t('community.online')}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.memberCard} onPress={handleViewMember}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberInitial}>B</Text>
                </View>
                <Text style={styles.memberName}>Bob</Text>
                <Text style={styles.memberStatus}>{t('community.active')}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.memberCard} onPress={handleViewMember}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberInitial}>C</Text>
                </View>
                <Text style={styles.memberName}>Clara</Text>
                <Text style={styles.memberStatus}>{t('community.online')}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.memberCard} onPress={handleViewMember}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberInitial}>D</Text>
                </View>
                <Text style={styles.memberName}>David</Text>
                <Text style={styles.memberStatus}>{t('community.active')}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Section Discussions */}
          <View style={styles.section}>
            <View style={styles.discussionsHeader}>
              <Text style={styles.sectionTitle}>{t('community.recent_discussions')}</Text>
              <TouchableOpacity style={styles.startDiscussionButton} onPress={handleStartDiscussion}>
                <Text style={styles.startDiscussionText}>{t('community.new_discussion')}</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.discussionsList}>
              <View style={styles.discussionCard}>
                <View style={styles.discussionHeader}>
                  <Text style={styles.discussionTitle}>{t('community.tips_for_beginners')}</Text>
                  <Text style={styles.discussionAuthor}>{t('community.by', { name: 'Alice' })}</Text>
                </View>
                <Text style={styles.discussionPreview}>{t('community.tips_preview')}</Text>
                <View style={styles.discussionStats}>
                  <Text style={styles.discussionStat}>{t('community.replies', { count: 12 })}</Text>
                  <Text style={styles.discussionStat}>{t('community.views', { count: 45 })}</Text>
                  <Text style={styles.discussionTime}>{t('community.ago', { time: '2h' })}</Text>
                </View>
              </View>

              <View style={styles.discussionCard}>
                <View style={styles.discussionHeader}>
                  <Text style={styles.discussionTitle}>{t('community.share_experience')}</Text>
                  <Text style={styles.discussionAuthor}>{t('community.by', { name: 'Bob' })}</Text>
                </View>
                <Text style={styles.discussionPreview}>{t('community.share_preview')}</Text>
                <View style={styles.discussionStats}>
                  <Text style={styles.discussionStat}>{t('community.replies', { count: 8 })}</Text>
                  <Text style={styles.discussionStat}>{t('community.views', { count: 32 })}</Text>
                  <Text style={styles.discussionTime}>{t('community.ago', { time: '4h' })}</Text>
                </View>
              </View>

              <View style={styles.discussionCard}>
                <View style={styles.discussionHeader}>
                  <Text style={styles.discussionTitle}>{t('community.tech_question')}</Text>
                  <Text style={styles.discussionAuthor}>{t('community.by', { name: 'Clara' })}</Text>
                </View>
                <Text style={styles.discussionPreview}>{t('community.tech_preview')}</Text>
                <View style={styles.discussionStats}>
                  <Text style={styles.discussionStat}>{t('community.replies', { count: 5 })}</Text>
                  <Text style={styles.discussionStat}>{t('community.views', { count: 28 })}</Text>
                  <Text style={styles.discussionTime}>{t('community.ago', { time: '6h' })}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Section Événements */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('community.upcoming_events')}</Text>
            
            <View style={styles.eventsList}>
              <TouchableOpacity style={styles.eventCard} onPress={handleJoinEvent}>
                <View style={styles.eventHeader}>
                  <Text style={styles.eventTitle}>{t('community.webinar')}</Text>
                  <Text style={styles.eventDate}>15 Jan 2024</Text>
                </View>
                <Text style={styles.eventDescription}>{t('community.webinar_desc')}</Text>
                <View style={styles.eventStats}>
                  <Text style={styles.eventStat}>{t('community.participants', { count: 25 })}</Text>
                  <Text style={styles.eventTime}>14:00 - 15:30</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.eventCard} onPress={handleJoinEvent}>
                <View style={styles.eventHeader}>
                  <Text style={styles.eventTitle}>{t('community.challenge')}</Text>
                  <Text style={styles.eventDate}>20 Jan 2024</Text>
                </View>
                <Text style={styles.eventDescription}>{t('community.challenge_desc')}</Text>
                <View style={styles.eventStats}>
                  <Text style={styles.eventStat}>{t('community.participants', { count: 18 })}</Text>
                  <Text style={styles.eventTime}>16:00 - 18:00</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Section Statistiques Communauté */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('community.community_stats')}</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>156</Text>
                <Text style={styles.statLabel}>{t('community.active_members')}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>23</Text>
                <Text style={styles.statLabel}>{t('community.discussions')}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>89</Text>
                <Text style={styles.statLabel}>{t('community.messages')}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>5</Text>
                <Text style={styles.statLabel}>{t('community.events')}</Text>
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