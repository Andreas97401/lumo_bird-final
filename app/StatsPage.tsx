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
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
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

// Type pour les badges avec icônes MaterialIcons ou MaterialCommunityIcons
type BadgeIconType = {
  type: 'MaterialIcons' | 'MaterialCommunityIcons';
  name: string;
  color?: string;
  size?: number;
};

const BADGES = [
  { id: 1, name: 'Premier Pas', description: 'Première connexion', unlocked: true, icon: { type: 'MaterialIcons', name: 'star', color: '#FFD700', size: 36 } as BadgeIconType },
  { id: 4, name: 'Social', description: 'Ajouté 3 amis', unlocked: false, icon: { type: 'MaterialIcons', name: 'people', color: '#4682B4', size: 36 } as BadgeIconType },
  { id: 5, name: 'Expert', description: 'Niveau 5 atteint', unlocked: false, icon: { type: 'MaterialCommunityIcons', name: 'trophy', color: '#FFD700', size: 36 } as BadgeIconType },
  // Badges de difficulté
  { id: 7, name: 'Le Spartiate', description: 'Objectif complété en "extrême" (Full parcours hard)', unlocked: false, icon: { type: 'MaterialCommunityIcons', name: 'medal', color: '#C0C0C0', size: 36 } as BadgeIconType },
  { id: 8, name: "L'Adaptatif", description: '2 changements de difficulté maîtrisés (Switch intelligent)', unlocked: false, icon: { type: 'MaterialCommunityIcons', name: 'medal-outline', color: '#C0C0C0', size: 36 } as BadgeIconType },
  { id: 9, name: 'Le Roc', description: 'Aucun abandon d\'objectif en 30 jours (Persistance)', unlocked: false, icon: { type: 'MaterialIcons', name: 'shield', color: '#C0C0C0', size: 36 } as BadgeIconType },
  // Badges de transformation
  { id: 10, name: 'Le Groupe Uni', description: 'Créer un groupe où chacun avance vers ses objectifs', unlocked: false, icon: { type: 'MaterialCommunityIcons', name: 'trophy-award', color: '#FFD700', size: 36 } as BadgeIconType },
  { id: 11, name: 'Le Collectif', description: 'Créer un groupe pour atteindre un objectif commun', unlocked: false, icon: { type: 'MaterialCommunityIcons', name: 'trophy-variant', color: '#FFD700', size: 36 } as BadgeIconType },
  // Badges communautaires ou symboliques
  { id: 13, name: 'Premier envol', description: '1er objectif terminé', unlocked: false, icon: { type: 'MaterialIcons', name: 'eco', color: '#32CD32', size: 36 } as BadgeIconType },
  { id: 14, name: 'L\'Envergure du Phoenix', description: '100 niveaux cumulés', unlocked: false, icon: { type: 'MaterialIcons', name: 'flight', color: '#87CEEB', size: 36 } as BadgeIconType },
  { id: 15, name: 'LumoMaster', description: '5 objectifs réussis dans des domaines différents', unlocked: false, icon: { type: 'MaterialIcons', name: 'track-changes', color: '#FF6347', size: 36 } as BadgeIconType },
  { id: 16, name: 'Le Veilleur de Nuit', description: 'Objectif commencé après 22h', unlocked: false, icon: { type: 'MaterialIcons', name: 'nights-stay', color: '#9370DB', size: 36 } as BadgeIconType },
  // Badges secrets ou cachés
  { id: 17, name: 'Le Perfectionniste', description: 'Refaire un niveau déjà validé volontairement', unlocked: false, icon: { type: 'MaterialIcons', name: 'visibility', color: '#1E90FF', size: 36 } as BadgeIconType },
  { id: 18, name: 'Le Stratège intérieur', description: 'Laisser une note personnelle 7 jours de suite', unlocked: false, icon: { type: 'MaterialIcons', name: 'chat', color: '#9370DB', size: 36 } as BadgeIconType },
  { id: 19, name: 'Le Faiseur de Quêtes', description: 'Créer un objectif avec un nom original', unlocked: false, icon: { type: 'MaterialIcons', name: 'lightbulb', color: '#FFA500', size: 36 } as BadgeIconType },
];

// Les valeurs seront mises à jour dynamiquement
const DEFAULT_KEY_STATS = [
  { label: 'stats.quest_completed', value: '0', unit: '' },
  { label: 'stats.levels_done', value: '0', unit: '' },
  { label: 'stats.current_difficulty', value: 'extreme', unit: '' }, // ex: 'facile', 'intermediaire', 'difficile', 'extreme', 'personnalisee'
  { label: 'stats.objectives_done', value: '0', unit: '' },
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
  const [goal, setGoal] = useState<{ titre: string; progress: number; current_level?: string; levels_data?: any } | null>(null); // levels_data contient les données de la colonne 'levels'
  const [loadingGoal, setLoadingGoal] = useState(true);
  const [completedLevels, setCompletedLevels] = useState(0);
  const [completedQuests, setCompletedQuests] = useState(0);
  const [maxLevel, setMaxLevel] = useState(0);
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
          const currentGoal = goals[0];
          
          // Extraire les données de niveaux si elles existent
          let levelsData = null;
          try {
            if (currentGoal.levels && typeof currentGoal.levels === 'string') {
              levelsData = JSON.parse(currentGoal.levels);
            } else if (currentGoal.levels) {
              levelsData = currentGoal.levels;
            }
          } catch (e) {
            console.error('Erreur lors du parsing des données de niveaux:', e);
          }
          
          setGoal({ 
            titre: currentGoal.titre, 
            progress: 0, 
            current_level: currentGoal.current_level,
            levels_data: levelsData
          });
          
          // Déterminer le niveau maximum à partir des données
          let maxLevelFound = 0;
          if (levelsData) {
            try {
              // Parcourir les sections pour trouver le niveau le plus élevé
              levelsData.forEach((section: any) => {
                if (section.levels && Array.isArray(section.levels)) {
                  section.levels.forEach((level: any) => {
                    if (level.level_number && typeof level.level_number === 'number') {
                      maxLevelFound = Math.max(maxLevelFound, level.level_number);
                    }
                  });
                }
              });
            } catch (e) {
              console.error('Erreur lors de l\'extraction du niveau maximum:', e);
            }
          }
          
          // Si aucun niveau maximum n'a été trouvé, utiliser une valeur par défaut
          if (maxLevelFound === 0) {
            maxLevelFound = 11; // Valeur par défaut
          }
          
          setMaxLevel(maxLevelFound);
          
          // Calculer les statistiques basées sur current_level
          if (currentGoal.current_level) {
            const levelParts = currentGoal.current_level.split('_');
            if (levelParts.length === 2) {
              const currentLevel = parseInt(levelParts[0], 10);
              if (!isNaN(currentLevel)) {
                // Niveaux effectués = X - 1 (car current_level correspond au niveau en cours, pas terminé)
                const levelsCompleted = Math.max(0, currentLevel - 1);
                setCompletedLevels(levelsCompleted);
                
                // Quêtes complétées = (X - 1) × 2
                const questsCompleted = levelsCompleted * 2;
                setCompletedQuests(questsCompleted);
              }
            }
          }
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
                    {/* Calcul dynamique de la largeur de la barre de progression */}
                    <View style={{
                      height: 12, 
                      backgroundColor: '#FD8B5A', 
                      width: `${Math.min(100, (completedLevels / maxLevel) * 100)}%`, 
                      borderRadius: 6
                    }} />
                  </View>
                  <Text style={{color:'#71ABA4', fontWeight:'bold', marginTop:5}}>
                    {completedLevels} / {maxLevel} niveaux
                  </Text>
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
            {DEFAULT_KEY_STATS.map((stat, index) => {
              // Déterminer la valeur à afficher en fonction du type de statistique
              let displayValue = stat.value;
              
              if (stat.label === 'stats.quest_completed') {
                displayValue = completedQuests.toString();
              } else if (stat.label === 'stats.levels_done') {
                displayValue = completedLevels.toString();
              } else if (stat.label === 'stats.current_difficulty') {
                // Affiche toujours 'extrême' sans traduction
                displayValue = 'extrême';
              }
              
              return (
                <View key={index} style={{backgroundColor:'#0A2547', borderRadius:16, padding:18, alignItems:'center', width:'47%', marginBottom:12, borderWidth:1, borderColor:'#1A2F4A', shadowColor:'#000', shadowOpacity:0.08, shadowRadius:4, elevation:2}}>
                  <Text style={{fontSize:13, color:'#71ABA4', textAlign:'center', marginBottom:8}}>{t(stat.label)}</Text>
                  <Text style={{fontSize: stat.label === 'stats.current_difficulty' ? 20 : 28, color:'#FD8B5A', fontWeight:'bold', marginBottom:2}}>
                    {displayValue}
                  </Text>
                  <Text style={{fontSize:13, color:'#C6E7E2', marginBottom:2}}>{stat.unit}</Text>
                </View>
              );
            })}
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
                {badge.icon && badge.icon.type === 'MaterialIcons' ? (
                  <MaterialIcons 
                    name={badge.icon.name as keyof typeof MaterialIcons.glyphMap} 
                    size={badge.icon.size || 36} 
                    color={badge.icon.color || '#FFFFFF'} 
                    style={{marginBottom:6}} 
                  />
                ) : badge.icon && badge.icon.type === 'MaterialCommunityIcons' ? (
                  <MaterialCommunityIcons 
                    name={badge.icon.name as keyof typeof MaterialCommunityIcons.glyphMap} 
                    size={badge.icon.size || 36} 
                    color={badge.icon.color || '#FFFFFF'} 
                    style={{marginBottom:6}} 
                  />
                ) : (
                  <Text style={{fontSize:36, marginBottom:6}}>🏆</Text>
                )}
                <Text style={{fontSize:15, color:'#C6E7E2', fontWeight:'bold', textAlign:'center', marginBottom:2}} numberOfLines={1} ellipsizeMode="tail">{t('stats.badge_' + badgeKey(badge.name), {defaultValue: badge.name})}</Text>
                {/* La description n'est plus affichée ici */}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Conseil du jour ergonomique */}
        <View style={styles.section}>
          <View style={{backgroundColor:'#FD8B5A', borderRadius:16, padding:20, alignItems:'center', marginBottom:8, flexDirection:'row', gap:12}}>
            <MaterialIcons name="lightbulb" size={28} color="#FFFFFF" style={{marginRight:10}} />
            <View style={{flex:1}}>
              <Text style={{color:'#fff', fontWeight:'bold', fontSize:16, marginBottom:4}}>{TIP_OF_THE_DAY.title}</Text>
              <Text style={{color:'#fff', fontSize:14}}>{TIP_OF_THE_DAY.content}</Text>
            </View>
          </View>
        </View>

        {/* Bouton Historique ergonomique */}
      </ScrollView>
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
                <View style={styles.modalBadgeIconContainer}>
                  {selectedBadge.icon && selectedBadge.icon.type === 'MaterialIcons' ? (
                    <MaterialIcons 
                      name={selectedBadge.icon.name as keyof typeof MaterialIcons.glyphMap} 
                      size={selectedBadge.icon.size || 60} 
                      color={selectedBadge.icon.color || '#FFFFFF'} 
                    />
                  ) : selectedBadge.icon && selectedBadge.icon.type === 'MaterialCommunityIcons' ? (
                    <MaterialCommunityIcons 
                      name={selectedBadge.icon.name as keyof typeof MaterialCommunityIcons.glyphMap} 
                      size={selectedBadge.icon.size || 60} 
                      color={selectedBadge.icon.color || '#FFFFFF'} 
                    />
                  ) : (
                    <Text style={{fontSize:60, marginBottom:10}}>🏆</Text>
                  )}
                </View>
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
    width: 300,
    height: 350,
    justifyContent: 'center',
  },
  modalBadgeIconContainer: {
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBadgeName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#C6E7E2',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalBadgeDescription: {
    fontSize: 16,
    color: 'rgba(198, 231, 226, 0.7)',
    textAlign: 'center',
    marginBottom: 25,
    paddingHorizontal: 10,
  },
  modalBadgeStatus: {
    fontSize: 16,
    color: '#FD8B5A',
    marginBottom: 30,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    backgroundColor: '#FD8B5A',
    borderRadius: 8,
    paddingHorizontal: 30,
    paddingVertical: 12,
    width: 150,
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});