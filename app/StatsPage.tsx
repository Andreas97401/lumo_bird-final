import BottomNavBar from '@/components/BottomNavBar';
import { Feather, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Dimensions, Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

const ORANGE = '#FD8B5A';
const GREENBLUE = '#71ABA4';
const DARK = '#041836';
const DARKER = '#11223A';
const DARKEST = '#223A4D';

const MAIN_GOAL = {
  title: 'Atteindre 66 kg',
  current: 70,
  target: 66,
  progress: 0.72, // 72%
  estimatedDate: '15/08/2024',
  motivation: 'Tu es sur la bonne voie, continue comme ça !',
};

const LEVELS = [
  { name: 'Novice', unlocked: true, date: '01/05/2024', desc: 'Bravo, tu as franchi le cap du débutant !' },
  { name: 'Intermédiaire', unlocked: true, date: '15/05/2024', desc: 'Tu progresses vite, continue !' },
  { name: 'Avancé', unlocked: false, date: null, desc: 'Encore un effort pour atteindre ce niveau.' },
  { name: 'Expert', unlocked: false, date: null, desc: 'Le sommet est proche, persévère !' },
];

const BADGES = [
  { icon: 'award', color: ORANGE, title: '50 quêtes', unlocked: true, desc: 'Avoir complété 50 quêtes.' },
  { icon: 'star', color: ORANGE, title: '10 niveaux', unlocked: true, desc: 'Atteindre 10 niveaux.' },
  { icon: 'calendar', color: GREENBLUE, title: '3 jours d’affilée', unlocked: false, desc: 'Être actif 3 jours de suite.' },
  { icon: 'zap', color: '#7B61FF', title: 'Super motivation', unlocked: false, desc: 'Se connecter 7 jours d’affilée.' },
];

const KEY_STATS = [
  { icon: 'calendar-check', color: ORANGE, label: 'Jours actifs', value: 24 },
  { icon: 'fire', color: '#FFD700', label: 'Meilleure série', value: '7j' },
  { icon: 'trending-up', color: GREENBLUE, label: 'Progression hebdo', value: '+1.2kg' },
];

const TIP_OF_THE_DAY = {
  text: 'Bois un verre d’eau avant chaque repas pour booster ta motivation et ton métabolisme.',
};

export default function StatsPage() {
  const [activeTab, setActiveTab] = useState('stats');
  const [badgeModal, setBadgeModal] = useState<{visible: boolean, badge?: any}>({visible: false});

  const handleTabPress = (tab: string) => {
    setActiveTab(tab);
    switch (tab) {
      case 'community':
        window.location.href = '/CommunityPage';
        break;
      case 'home':
        window.location.href = '/HomePage';
        break;
      case 'stats':
        break;
    }
  };

  const unlockedBadges = BADGES.filter(b => b.unlocked).length;
  const badgePercent = Math.round((unlockedBadges / BADGES.length) * 100);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Objectif principal enrichi */}
        <Text style={styles.sectionTitle}>Objectif principal</Text>
        <View style={styles.goalCard}>
          <View style={styles.goalHeaderRow}>
            <Text style={styles.goalTitle}>{MAIN_GOAL.title}</Text>
            <MaterialCommunityIcons name="target" size={22} color={ORANGE} style={{marginLeft: 8}} />
          </View>
          <Text style={styles.goalSub}>{MAIN_GOAL.current} kg → <Text style={{color:ORANGE, fontWeight:'bold'}}>{MAIN_GOAL.target} kg</Text></Text>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${MAIN_GOAL.progress * 100}%` }]} />
            </View>
            <Text style={styles.progressPercent}>{Math.round(MAIN_GOAL.progress * 100)}%</Text>
          </View>
          <Text style={styles.goalEstimation}>Estimation : <Text style={{color:GREENBLUE}}>{MAIN_GOAL.estimatedDate}</Text></Text>
          <Text style={styles.goalMotivation}>{MAIN_GOAL.motivation}</Text>
        </View>

        {/* Statistiques clés */}
        <View style={styles.keyStatsRow}>
          {KEY_STATS.map(stat => (
            <View key={stat.label} style={styles.keyStatCard}>
              <Feather name={stat.icon as any} size={22} color={stat.color} style={{marginBottom: 4}} />
              <Text style={[styles.keyStatValue, stat.color === ORANGE && {color: ORANGE}]}>{stat.value}</Text>
              <Text style={styles.keyStatLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Conseil du jour */}
        <View style={styles.tipCard}>
          <Feather name="info" size={18} color={GREENBLUE} style={{marginRight: 8}} />
          <Text style={styles.tipText}>{TIP_OF_THE_DAY.text}</Text>
        </View>

        {/* Niveaux atteints - timeline */}
        <Text style={styles.sectionTitle}>Niveaux</Text>
        <View style={styles.levelsTimeline}>
          {LEVELS.map((level, idx) => (
            <View key={level.name} style={styles.levelTimelineItem}>
              <View style={[styles.levelCircle, level.unlocked ? styles.levelCircleUnlocked : styles.levelCircleLocked]}>
                {level.unlocked ? (
                  <FontAwesome name="star" size={18} color={ORANGE} />
                ) : (
                  <Feather name="lock" size={16} color={GREENBLUE} />
                )}
              </View>
              <View style={styles.levelTimelineContent}>
                <Text style={[styles.levelName, level.unlocked ? {color: ORANGE} : styles.levelNameLocked]}>{level.name}</Text>
                <Text style={styles.levelDesc}>{level.desc}</Text>
                {level.unlocked && <Text style={styles.levelDate}>{level.date}</Text>}
              </View>
            </View>
          ))}
        </View>

        {/* Badges */}
        <View style={styles.badgesHeaderRow}>
          <Text style={styles.sectionTitle}>Badges</Text>
          <Text style={[styles.badgePercent, {color: ORANGE}]}>{badgePercent}% débloqués</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.badgesRow}>
          {BADGES.map((badge, idx) => (
            <Pressable
              key={badge.title}
              style={[styles.badgeCard, badge.unlocked ? styles.badgeOrange : styles.badgeLocked]}
              onPress={() => setBadgeModal({visible: true, badge})}
            >
              <Feather
                name={badge.icon as any}
                size={32}
                color={badge.unlocked ? badge.color : GREENBLUE}
                style={{ marginBottom: 8 }}
              />
              <Text style={[styles.badgeTitle, badge.unlocked ? {color: ORANGE} : styles.badgeTitleLocked]}>{badge.title}</Text>
            </Pressable>
          ))}
        </ScrollView>
        {/* Historique bouton */}
        <TouchableOpacity style={styles.historyBtn} onPress={() => alert('Historique détaillé à venir !')}>
          <Feather name="bar-chart-2" size={18} color={ORANGE} style={{marginRight: 8}} />
          <Text style={[styles.historyBtnText, {color: ORANGE}]}>Voir mon historique</Text>
        </TouchableOpacity>
      </ScrollView>
      <BottomNavBar activeTab={activeTab} onTabPress={handleTabPress} />
      {/* Modal badge */}
      <Modal
        visible={badgeModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setBadgeModal({visible: false})}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Feather
              name={badgeModal.badge?.icon as any}
              size={40}
              color={badgeModal.badge?.unlocked ? badgeModal.badge?.color : GREENBLUE}
              style={{ marginBottom: 12 }}
            />
            <Text style={[styles.modalBadgeTitle, badgeModal.badge?.unlocked && {color: ORANGE}]}>{badgeModal.badge?.title}</Text>
            <Text style={styles.modalBadgeDesc}>{badgeModal.badge?.desc}</Text>
            <TouchableOpacity style={[styles.modalCloseBtn, {backgroundColor: ORANGE}]} onPress={() => setBadgeModal({visible: false})}>
              <Text style={styles.modalCloseBtnText}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 120,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    marginTop: 24,
  },
  goalCard: {
    backgroundColor: DARKER,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DARKEST,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  goalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  goalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: ORANGE,
  },
  goalSub: {
    fontSize: 15,
    color: '#fff',
    marginBottom: 10,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 6,
  },
  progressBarBg: {
    flex: 1,
    height: 14,
    backgroundColor: DARKEST,
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: ORANGE,
    borderRadius: 8,
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: 'bold',
    color: ORANGE,
    minWidth: 40,
    textAlign: 'right',
  },
  goalEstimation: {
    fontSize: 13,
    color: GREENBLUE,
    marginTop: 2,
    marginBottom: 2,
    fontWeight: '600',
  },
  goalMotivation: {
    fontSize: 13,
    color: '#fff',
    marginTop: 4,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  keyStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
    marginTop: 8,
  },
  keyStatCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: DARKER,
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: DARKEST,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  keyStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: GREENBLUE,
  },
  keyStatLabel: {
    fontSize: 12,
    color: '#fff',
    textAlign: 'center',
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#193A4D',
    borderRadius: 10,
    padding: 12,
    marginBottom: 18,
    borderLeftWidth: 4,
    borderLeftColor: GREENBLUE,
  },
  tipText: {
    color: '#fff',
    fontSize: 13,
    flex: 1,
  },
  levelsTimeline: {
    marginBottom: 16,
    marginTop: 8,
  },
  levelTimelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  levelCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 2,
  },
  levelCircleUnlocked: {
    backgroundColor: '#FFF9E5',
    borderColor: ORANGE,
  },
  levelCircleLocked: {
    backgroundColor: DARKEST,
    borderColor: GREENBLUE,
  },
  levelTimelineContent: {
    flex: 1,
  },
  levelName: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  levelNameLocked: {
    color: GREENBLUE,
    fontWeight: '600',
  },
  levelDesc: {
    fontSize: 13,
    color: '#C6E7E2',
    marginBottom: 2,
  },
  levelDate: {
    fontSize: 12,
    color: GREENBLUE,
    fontWeight: '600',
  },
  badgesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 18,
  },
  badgePercent: {
    fontSize: 13,
    color: ORANGE,
    fontWeight: 'bold',
  },
  badgesRow: {
    marginTop: 8,
    marginBottom: 32,
  },
  badgeCard: {
    width: 110,
    height: 110,
    backgroundColor: DARKER,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: DARKEST,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  badgeOrange: {
    borderColor: ORANGE,
    shadowColor: ORANGE,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  badgeLocked: {
    opacity: 0.4,
    backgroundColor: DARKEST,
  },
  badgeTitle: {
    fontSize: 13,
    color: ORANGE,
    textAlign: 'center',
    fontWeight: '600',
  },
  badgeTitleLocked: {
    color: GREENBLUE,
    fontWeight: '400',
  },
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 8,
    backgroundColor: DARKER,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: ORANGE,
    shadowColor: ORANGE,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  historyBtnText: {
    color: ORANGE,
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: DARKER,
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
    width: width * 0.8,
    shadowColor: ORANGE,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  modalBadgeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: ORANGE,
    marginBottom: 8,
  },
  modalBadgeDesc: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 18,
  },
  modalCloseBtn: {
    backgroundColor: ORANGE,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  modalCloseBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
}); 