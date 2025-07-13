import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import BottomNavBar from '../components/BottomNavBar';

// Constantes pour les données
const MAIN_GOAL = {
  title: 'Atteindre 1000 points',
  current: 750,
  total: 1000,
  progress: 75,
};

const LEVELS = [
  { level: 1, name: 'Débutant', points: 0, unlocked: true },
  { level: 2, name: 'Intermédiaire', points: 200, unlocked: true },
  { level: 3, name: 'Avancé', points: 500, unlocked: true },
  { level: 4, name: 'Expert', points: 1000, unlocked: false },
  { level: 5, name: 'Maître', points: 2000, unlocked: false },
];

const BADGES = [
  { id: 1, name: 'Premier Pas', description: 'Première connexion', unlocked: true, icon: '🌟' },
  { id: 2, name: 'Discuteur', description: '10 messages envoyés', unlocked: true, icon: '💬' },
  { id: 3, name: 'Explorateur', description: 'Visité 5 pages', unlocked: true, icon: '🗺️' },
  { id: 4, name: 'Social', description: 'Ajouté 3 amis', unlocked: false, icon: '👥' },
  { id: 5, name: 'Expert', description: 'Niveau 5 atteint', unlocked: false, icon: '🏆' },
  { id: 6, name: 'Légende', description: '1000 points', unlocked: false, icon: '👑' },
];

const KEY_STATS = [
  { label: 'Points totaux', value: '750', unit: 'pts' },
  { label: 'Niveau actuel', value: '3', unit: '' },
  { label: 'Badges débloqués', value: '3', unit: '/6' },
  { label: 'Messages envoyés', value: '15', unit: '' },
];

const TIP_OF_THE_DAY = {
  title: 'Conseil du jour',
  content: 'Participez à la communauté pour gagner plus de points et débloquer de nouveaux badges !',
};

export default function StatsPage() {
  const [badgeModalVisible, setBadgeModalVisible] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState(0); // 0 = Stats
  const router = useRouter();

  const unlockedBadges = BADGES.filter(badge => badge.unlocked);
  const badgePercentage = Math.round((unlockedBadges.length / BADGES.length) * 100);

  const handleBadgePress = (badge: any) => {
    setSelectedBadge(badge);
    setBadgeModalVisible(true);
  };

  const handleHistoryPress = () => {
    // Fonctionnalité à venir
    console.log('Historique détaillé à venir');
  };

  const handleTabSelect = (idx: number) => {
    setSelectedTab(idx);
    // Consistent navigation logic
    if (idx === 0) {
      // Already on StatsPage, no navigation needed
      return;
    } else if (idx === 1) {
      router.push('/HomeScreen');
    } else if (idx === 2) {
      router.push('/CommunityPage');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#041836" />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Titre principal */}
        <View style={styles.header}>
          <Text style={styles.title}>Mes Statistiques</Text>
          <Text style={styles.subtitle}>Suivez vos progrès et vos accomplissements</Text>
        </View>

        {/* Objectif principal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Objectif Principal</Text>
          <View style={styles.goalCard}>
            <Text style={styles.goalTitle}>{MAIN_GOAL.title}</Text>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${MAIN_GOAL.progress}%` }]} />
              </View>
              <Text style={styles.progressText}>
                {MAIN_GOAL.current} / {MAIN_GOAL.total} points
              </Text>
            </View>
          </View>
        </View>

        {/* Statistiques clés */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistiques Clés</Text>
          <View style={styles.statsGrid}>
            {KEY_STATS.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statUnit}>{stat.unit}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Niveaux */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Progression des Niveaux</Text>
          <View style={styles.levelsContainer}>
            {LEVELS.map((level, index) => (
              <View key={level.level} style={styles.levelItem}>
                <View style={[styles.levelCircle, level.unlocked && styles.levelUnlocked]}>
                  <Text style={[styles.levelNumber, level.unlocked && styles.levelNumberUnlocked]}>
                    {level.level}
                  </Text>
                </View>
                <View style={styles.levelInfo}>
                  <Text style={[styles.levelName, level.unlocked && styles.levelNameUnlocked]}>
                    {level.name}
                  </Text>
                  <Text style={styles.levelPoints}>{level.points} points</Text>
                </View>
                {index < LEVELS.length - 1 && (
                  <View style={[styles.levelLine, level.unlocked && styles.levelLineUnlocked]} />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Badges */}
        <View style={styles.section}>
          <View style={styles.badgesHeader}>
            <Text style={styles.sectionTitle}>Badges</Text>
            <Text style={styles.badgeProgress}>{badgePercentage}% débloqués</Text>
          </View>
          <View style={styles.badgesGrid}>
            {BADGES.map((badge) => (
              <TouchableOpacity
                key={badge.id}
                style={[styles.badgeCard, badge.unlocked && styles.badgeUnlocked]}
                onPress={() => handleBadgePress(badge)}
              >
                <Text style={styles.badgeIcon}>{badge.icon}</Text>
                <Text style={[styles.badgeName, badge.unlocked && styles.badgeNameUnlocked]}>
                  {badge.name}
                </Text>
                <Text style={styles.badgeDescription}>{badge.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Conseil du jour */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{TIP_OF_THE_DAY.title}</Text>
          <View style={styles.tipCard}>
            <Text style={styles.tipContent}>{TIP_OF_THE_DAY.content}</Text>
          </View>
        </View>

        {/* Bouton Historique */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.historyButton} onPress={handleHistoryPress}>
            <Text style={styles.historyButtonText}>Voir l'historique détaillé</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <BottomNavBar selectedIndex={selectedTab} onSelect={handleTabSelect} />

      {/* Modal pour les détails des badges */}
      <Modal
        visible={badgeModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setBadgeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedBadge && (
              <>
                <Text style={styles.modalBadgeIcon}>{selectedBadge.icon}</Text>
                <Text style={styles.modalBadgeName}>{selectedBadge.name}</Text>
                <Text style={styles.modalBadgeDescription}>{selectedBadge.description}</Text>
                <Text style={styles.modalBadgeStatus}>
                  {selectedBadge.unlocked ? '✅ Débloqué' : '🔒 Verrouillé'}
                </Text>
              </>
            )}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setBadgeModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#041836',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#C6E7E2',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(198, 231, 226, 0.7)',
    textAlign: 'center',
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
  goalCard: {
    backgroundColor: 'rgba(198, 231, 226, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(198, 231, 226, 0.2)',
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#C6E7E2',
    marginBottom: 15,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(198, 231, 226, 0.2)',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FD8B5A',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    color: 'rgba(198, 231, 226, 0.7)',
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
  },
  statUnit: {
    fontSize: 14,
    color: 'rgba(198, 231, 226, 0.7)',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(198, 231, 226, 0.6)',
    textAlign: 'center',
  },
  levelsContainer: {
    backgroundColor: 'rgba(198, 231, 226, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(198, 231, 226, 0.2)',
  },
  levelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  levelCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(198, 231, 226, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  levelUnlocked: {
    backgroundColor: '#FD8B5A',
  },
  levelNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'rgba(198, 231, 226, 0.5)',
  },
  levelNumberUnlocked: {
    color: '#FFFFFF',
  },
  levelInfo: {
    flex: 1,
  },
  levelName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'rgba(198, 231, 226, 0.5)',
  },
  levelNameUnlocked: {
    color: '#C6E7E2',
  },
  levelPoints: {
    fontSize: 12,
    color: 'rgba(198, 231, 226, 0.5)',
  },
  levelLine: {
    position: 'absolute',
    left: 20,
    top: 40,
    width: 2,
    height: 20,
    backgroundColor: 'rgba(198, 231, 226, 0.2)',
  },
  levelLineUnlocked: {
    backgroundColor: '#FD8B5A',
  },
  badgesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  badgeProgress: {
    fontSize: 14,
    color: 'rgba(198, 231, 226, 0.7)',
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  badgeCard: {
    width: '48%',
    backgroundColor: 'rgba(198, 231, 226, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(198, 231, 226, 0.2)',
    opacity: 0.5,
  },
  badgeUnlocked: {
    opacity: 1,
    borderColor: '#FD8B5A',
  },
  badgeIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'rgba(198, 231, 226, 0.5)',
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeNameUnlocked: {
    color: '#C6E7E2',
  },
  badgeDescription: {
    fontSize: 10,
    color: 'rgba(198, 231, 226, 0.5)',
    textAlign: 'center',
  },
  tipCard: {
    backgroundColor: 'rgba(198, 231, 226, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(198, 231, 226, 0.2)',
  },
  tipContent: {
    fontSize: 16,
    color: '#C6E7E2',
    lineHeight: 24,
  },
  historyButton: {
    backgroundColor: '#FD8B5A',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  historyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#041836',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    marginHorizontal: 40,
    borderWidth: 1,
    borderColor: 'rgba(198, 231, 226, 0.2)',
  },
  modalBadgeIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  modalBadgeName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#C6E7E2',
    marginBottom: 8,
  },
  modalBadgeDescription: {
    fontSize: 16,
    color: 'rgba(198, 231, 226, 0.7)',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalBadgeStatus: {
    fontSize: 14,
    color: '#FD8B5A',
    marginBottom: 20,
  },
  modalCloseButton: {
    backgroundColor: '#FD8B5A',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  modalCloseText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 