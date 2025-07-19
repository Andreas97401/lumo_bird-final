import { useRouter } from 'expo-router';
import i18next from 'i18next';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Animated,
    Easing,
    Modal,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import BottomNavBar from '../components/BottomNavBar';
import { SettingsButton } from '../components/SettingsButton';
import { Text } from '../components/Text';
import { IconSymbol } from '../components/ui/IconSymbol';
import { supabase } from '../lib/supabase';

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
  { id: 4, name: 'Social', description: 'Ajouté 3 amis', unlocked: false, icon: '👥' },
  { id: 5, name: 'Expert', description: 'Niveau 5 atteint', unlocked: false, icon: '🏆' },
  // 🔵 Badges de difficulté
  { id: 7, name: 'Le Spartiate', description: 'Objectif complété en “extrême” (Full parcours hard)', unlocked: false, icon: '🏅' },
  { id: 8, name: "L'Adaptatif", description: '2 changements de difficulté maîtrisés (Switch intelligent)', unlocked: false, icon: '🏅' },
  { id: 9, name: 'Le Roc', description: 'Aucun abandon d’objectif en 30 jours (Persistance)', unlocked: false, icon: '🏅' },
  // 🟡 Badges de transformation
  { id: 10, name: 'Le Groupe Uni', description: 'Créer un groupe où chacun avance vers ses objectifs', unlocked: false, icon: '🏆' },
  { id: 11, name: 'Le Collectif', description: 'Créer un groupe pour atteindre un objectif commun', unlocked: false, icon: '🏆' },
  // 🟣 Badges communautaires ou symboliques
  { id: 13, name: 'Premier envol', description: '1er objectif terminé', unlocked: false, icon: '🌱' },
  { id: 14, name: 'L’Envergure du Phoenix', description: '100 niveaux cumulés', unlocked: false, icon: '🕊️' },
  { id: 15, name: 'LumoMaster', description: '5 objectifs réussis dans des domaines différents', unlocked: false, icon: '🎯' },
  { id: 16, name: 'Le Veilleur de Nuit', description: 'Objectif commencé après 22h', unlocked: false, icon: '✨' },
  // 🔥 Badges secrets ou cachés
  { id: 17, name: 'Le Perfectionniste', description: 'Refaire un niveau déjà validé volontairement', unlocked: false, icon: '👀' },
  { id: 18, name: 'Le Stratège intérieur', description: 'Laisser une note personnelle 7 jours de suite', unlocked: false, icon: '💬' },
  { id: 19, name: 'Le Faiseur de Quêtes', description: 'Créer un objectif avec un nom original', unlocked: false, icon: '💡' },
];

// Les valeurs doivent être les clés de traduction (français) pour permettre l'affichage multilingue correct
const KEY_STATS = [
  { label: 'stats.quest_completed', value: '12', unit: '' },
  { label: 'stats.levels_done', value: '34', unit: '' },
  { label: 'stats.current_difficulty', value: 'extreme', unit: '' }, // ex: 'facile', 'intermediaire', 'difficile', 'extreme', 'personnalisee'
  { label: 'stats.objectives_done', value: '7', unit: '' },
];

const TIP_OF_THE_DAY = {
  title: 'Conseil du jour',
  content: 'Participez à la communauté pour gagner plus de points et débloquer de nouveaux badges !',
};

// Fonction utilitaire pour translittérer les noms de badges en clés de traduction
function badgeKey(name: string) {
  const map: Record<string, string> = {"é":"e","è":"e","ê":"e","ë":"e","à":"a","â":"a","î":"i","ï":"i","ô":"o","ö":"o","ù":"u","û":"u","ü":"u","ç":"c","œ":"oe","æ":"ae","-":"_"," ":"_","'":"","’":"",".":""};
  return name
    .toLowerCase()
    .replace(/^(le |la |les |l'|the )/, '')
    .replace(/ |'|’|\.|é|è|ê|ë|à|â|î|ï|ô|ö|ù|û|ü|ç|œ|æ|-/g, (c) => map[c] || "");
}
// Fonction utilitaire pour normaliser la clé de difficulté
function normalizeKey(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // enlève les accents unicode
    .replace(/[^a-z0-9_]/g, ''); // enlève tout caractère spécial sauf underscore
}

export default function StatsPage() {
  const [badgeModalVisible, setBadgeModalVisible] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState(0); // 0 = Stats
  const [goal, setGoal] = useState<{ titre: string; progress: number } | null>(null);
  const [loadingGoal, setLoadingGoal] = useState(true);
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

  useEffect(() => {
    // Récupérer l'objectif principal de l'utilisateur
    const fetchGoal = async () => {
      setLoadingGoal(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setGoal(null);
          setLoadingGoal(false);
          return;
        }
        const { data: goals, error } = await supabase
          .from('goals')
          .select('*')
          .eq('user_id', user.id)
          .order('id', { ascending: false })
          .limit(1);
        if (error || !goals || goals.length === 0) {
          setGoal(null);
        } else {
          setGoal({ titre: goals[0].titre, progress: 0 }); // Progression à 0 par défaut
        }
      } catch (e) {
        setGoal(null);
      } finally {
        setLoadingGoal(false);
      }
    };
    fetchGoal();
  }, []);

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
      
      <Animated.View style={{ 
        flex: 1, 
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }]
      }}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 40}}>
        {/* Header sticky */}
        <View style={[styles.header, { position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#041836' }]}> 
          <Text style={styles.headerTitle}>{t('stats.header')}</Text>
          <SettingsButton style={styles.settingsButton} />
        </View>

        {/* Titre principal */}
        <View style={styles.header}>
          {/* Suppression du titre et de la phrase d'introduction */}
        </View>

        {/* Objectif principal ergonomique */}
        <View style={styles.section}>
          <View style={[styles.goalCard, {alignItems:'center', paddingVertical:28}]}> 
            <Text style={{fontSize:32, marginBottom:8}}>🎯</Text>
            <Text style={[styles.sectionTitle, {marginBottom:8}]}>{t('stats.main_goal')} :</Text>
            {loadingGoal ? (
              <Text style={styles.goalTitle}>{t('stats.loading_goal')}</Text>
            ) : goal ? (
              <>
                <Text style={[styles.goalTitle, {textAlign:'center', fontSize:20, marginBottom:10}]}>{goal.titre}</Text>
                <View style={{width:'90%', alignItems:'center', marginBottom:10}}>
                  <View style={{width:'100%', height:12, backgroundColor:'#E6E6E6', borderRadius:6, overflow:'hidden'}}>
                    <View style={{height:12, backgroundColor:'#FD8B5A', width:'0%', borderRadius:6}} />
                  </View>
                  <Text style={{color:'#71ABA4', fontWeight:'bold', marginTop:5}}>2 / 5 niveaux</Text>
                </View>
              </>
            ) : (
              <Text style={[styles.goalTitle, {color:'#FD8B5A', textAlign:'center', fontSize:18}]}>{t('stats.no_goal')}</Text>
            )}
          </View>
        </View>

        {/* Statistiques clés ergonomiques */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('stats.key_stats')}</Text>
          <View style={{flexDirection:'row', flexWrap:'wrap', justifyContent:'space-between', gap:12}}>
            {KEY_STATS.map((stat, index) => (
              <View key={index} style={{backgroundColor:'#0A2547', borderRadius:16, padding:18, alignItems:'center', width:'47%', marginBottom:12, borderWidth:1, borderColor:'#1A2F4A', shadowColor:'#000', shadowOpacity:0.08, shadowRadius:4, elevation:2}}>
                <Text style={{fontSize:13, color:'#71ABA4', textAlign:'center', marginBottom:8}}>{t(stat.label)}</Text>
                <Text style={{fontSize: stat.label === 'stats.current_difficulty' ? 20 : 28, color:'#FD8B5A', fontWeight:'bold', marginBottom:2}}>
                  {(() => {
                    if (stat.label === 'stats.current_difficulty') {
                      // Affiche toujours 'extrême' sans traduction
                      return 'extrême';
                    }
                    return stat.value;
                  })()}
                </Text>
                <Text style={{fontSize:13, color:'#C6E7E2', marginBottom:2}}>{stat.unit}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Niveaux ergonomiques */}
        <View style={[styles.section, {alignItems:'center'}]}>
          <View style={{backgroundColor:'rgba(253,139,90,0.12)', borderRadius:18, padding:24, alignItems:'center', width:'100%', marginBottom:8, borderWidth:1, borderColor:'#FD8B5A', shadowColor:'#FD8B5A', shadowOpacity:0.08, shadowRadius:8, elevation:3}}>
            <IconSymbol name="calendar" size={32} color="#FD8B5A" style={{marginBottom:10}} />
            <Text style={{color:'#C6E7E2', fontSize:18, fontWeight:'bold', marginBottom:8, textAlign:'center'}}>{t('stats.projection_title')}</Text>
            <Text style={{color:'#fff', fontSize:16, marginBottom:8, textAlign:'center'}}>{t('stats.projection_text', {date: 'August 15, 2024'})}</Text>
            <Text style={{color:'#71ABA4', fontSize:17, fontWeight:'bold', textAlign:'center'}}>{t('stats.projection_days_left', {days: 27})}</Text>
          </View>
        </View>

        {/* Badges ergonomiques */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('stats.badges')}</Text>
          <View style={{flexDirection:'row', flexWrap:'wrap', gap:12, justifyContent:'space-between'}}>
            {BADGES.map((badge) => (
              <TouchableOpacity
                key={badge.id}
                style={{backgroundColor:'#0A2547', borderRadius:16, padding:18, alignItems:'center', width:'30%', marginBottom:12, borderWidth:1, borderColor:badge.unlocked ? '#FD8B5A' : '#1A2F4A', opacity:badge.unlocked ? 1 : 0.5, shadowColor:'#000', shadowOpacity:0.08, shadowRadius:4, elevation:2}}
                onPress={() => handleBadgePress(badge)}
                activeOpacity={0.8}
              >
                <Text style={{fontSize:36, marginBottom:6}}>{badge.icon}</Text>
                <Text style={{fontSize:15, color:'#C6E7E2', fontWeight:'bold', textAlign:'center', marginBottom:2}} numberOfLines={1} ellipsizeMode="tail">{t('stats.badge_' + badgeKey(badge.name), {defaultValue: badge.name})}</Text>
                {/* La description n'est plus affichée ici */}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Conseil du jour ergonomique */}
        <View style={styles.section}>
          <View style={{backgroundColor:'#FD8B5A', borderRadius:16, padding:20, alignItems:'center', marginBottom:8, flexDirection:'row', gap:12}}>
            <Text style={{fontSize:28, marginRight:10}}>💡</Text>
            <View style={{flex:1}}>
              <Text style={{color:'#fff', fontWeight:'bold', fontSize:16, marginBottom:4}}>{TIP_OF_THE_DAY.title}</Text>
              <Text style={{color:'#fff', fontSize:14}}>{TIP_OF_THE_DAY.content}</Text>
            </View>
          </View>
        </View>

        {/* Bouton Historique ergonomique */}
      </ScrollView>
      <Text style={{color:'#fff', backgroundColor:'#FD8B5A', padding:8, borderRadius:8, margin:10}}>
        Debug i18n — Langue active : {i18next.language} | Clé : stats.intermediaire | Traduction : {t('stats.intermediaire')}
      </Text>
      </Animated.View>

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
                <Text style={styles.modalBadgeName}>{t('stats.badge_' + badgeKey(selectedBadge.name), {defaultValue: selectedBadge.name})}</Text>
                <Text style={styles.modalBadgeDescription}>{t('stats.badge_' + badgeKey(selectedBadge.name) + '_desc', {defaultValue: selectedBadge.description})}</Text>
                <Text style={styles.modalBadgeStatus}>
                  {selectedBadge.unlocked ? t('stats.unlocked_status') : t('stats.locked_status')}
                </Text>
              </>
            )}
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setBadgeModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>{t('stats.close')}</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: 'Righteous',
  },
  settingsButton: {
    marginLeft: 12,
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