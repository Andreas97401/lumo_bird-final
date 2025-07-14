/* HomeScreen.tsx */
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  ImageBackground,
  Keyboard,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';

import { useTranslation } from 'react-i18next';
import Svg, { Path } from 'react-native-svg';

import BottomNavBar from '../components/BottomNavBar';
import { Text } from '../components/Text';
import { supabase } from '../lib/supabase'; // Fixed: named import

/* -------------------------------------------------------------------------- */
/*                          CONSTANTES & UTILITAIRES                          */
/* -------------------------------------------------------------------------- */

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);
const { width, height } = Dimensions.get('window');
const statusBarHeight = StatusBar.currentHeight || 0;
const ORANGE = '#FD8B5A';
const CURVE_HEIGHT = height * 6;
const CURVE_WIDTH = width;
const AMPLITUDE = width * 0.25;
const CIRCLE_RADIUS = 32;
const EXPANDED_RADIUS = 70;
const OSCILLATIONS = 6;

export default function HomeScreen() {
  /* ------------------------------ STATES ---------------------------------- */
  const scrollY = useRef(new Animated.Value(0)).current;
  const [selectedTab, setSelectedTab] = useState(1);
  const [hasGoals, setHasGoals] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true); // Start with true
  const [initializing, setInitializing] = useState(true); // Add initialization state

  /* ----- Auth state ----- */
  const [user, setUser] = useState<any>(null);

  /* ----- Modals & création d'objectif ----- */
  const [modalVisible, setModalVisible] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [questionsModalVisible, setQuestionsModalVisible] = useState(false);
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [waitingQuestions, setWaitingQuestions] = useState(false);
  const [lastGoal, setLastGoal] = useState('');

  /* ----- Niveaux & affichage ----- */
  const [goal, setGoal] = useState<any>(null);
  const [allLevels, setAllLevels] = useState<any[]>([]);
  const [expandedLevel, setExpandedLevel] = useState<number | null>(null);
  const [levelModalVisible, setLevelModalVisible] = useState(false);
  const [selectedLevelData, setSelectedLevelData] = useState<any>(null);
  const [levelUnlockedBanner, setLevelUnlockedBanner] = useState(false);

  /* ----- Navigation & scroll state management ----- */
  const [isReturningFromNavigation, setIsReturningFromNavigation] = useState(false);
  const currentScrollPosition = useRef<number>(0);

  const router = useRouter();
  const { t } = useTranslation();
  const scrollViewRef = useRef<any>(null);
  const savedScrollPosition = useRef<number>(0);
  const isFirstLoad = useRef<boolean>(true);
  const isDataFetched = useRef<boolean>(false);

  /* ------------------------- AUTH INITIALIZATION -------------------------- */
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
        }
        
        if (mounted) {
          setUser(session?.user || null);
          setInitializing(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setUser(null);
          setInitializing(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        if (mounted) {
          setUser(session?.user || null);
          
          if (!session?.user) {
            setGoal(null);
            setAllLevels([]);
            setHasGoals(false);
            isDataFetched.current = false;
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  /* ------------------------- RÉCUPÉRATION DU GOAL ------------------------- */
  useEffect(() => {
    if (!user || initializing || isDataFetched.current) {
      setLoading(false);
      return;
    }

    let mounted = true;

    async function fetchGoalAndLevels() {
      if (!mounted) return;
      
      setLoading(true);
      isDataFetched.current = true;
      
      try {
        const fetchedGoal = await fetchLatestGoalForUser();
        console.log('Fetched goal (initial):', fetchedGoal);
        
        if (!mounted) return;
        
        setGoal(fetchedGoal);
        setHasGoals(!!fetchedGoal);

        if (fetchedGoal && fetchedGoal.levels) {
          let processedLevels;
          if (Array.isArray(fetchedGoal.levels)) {
            if (fetchedGoal.levels[0] && fetchedGoal.levels[0].levels) {
              processedLevels = fetchedGoal.levels.flatMap((section: any) =>
                (section.levels as any[]).map((lvl: any) => ({
                  ...lvl,
                  sectionTitle: section.title,
                  sectionSummary: section.summary,
                }))
              );
            } else {
              processedLevels = fetchedGoal.levels;
            }
          } else if (typeof fetchedGoal.levels === 'object') {
            if (fetchedGoal.levels.levels) {
              processedLevels = fetchedGoal.levels.levels;
            } else {
              processedLevels = Object.values(fetchedGoal.levels);
            }
          } else {
            processedLevels = [];
          }
          
          if (mounted) {
            setAllLevels(processedLevels || []);
          }
        } else {
          if (mounted) {
            setAllLevels([]);
          }
        }
      } catch (error) {
        console.error('Error fetching goal and levels:', error);
        if (mounted) {
          setHasGoals(false);
          setAllLevels([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchGoalAndLevels();

    return () => {
      mounted = false;
    };
  }, [user, initializing]);

  /* ------------------------------ COURBE ---------------------------------- */
  const curvePoints = React.useMemo(() => {
    const pts: { x: number; y: number }[] = [];
    for (let y = 0; y <= CURVE_HEIGHT; y += 3) {
      const normY = y / CURVE_HEIGHT;
      const x = CURVE_WIDTH / 2 - AMPLITUDE * Math.sin(normY * 2 * Math.PI * OSCILLATIONS);
      pts.push({ x, y });
    }
    return pts;
  }, []);

  const curvePath = React.useMemo(() => {
    if (!curvePoints.length) return '';
    return curvePoints.reduce(
      (p, c, idx) => `${p}${idx === 0 ? `M${c.x},${c.y}` : ` L${c.x},${c.y}`}`,
      '',
    );
  }, [curvePoints]);

  const getLevelPositionOnCurve = React.useCallback((idx: number) => {
    if (allLevels.length === 0) return { x: CURVE_WIDTH / 2, y: CURVE_HEIGHT / 2 };

    const PADDING_PERCENT = 0.005;
    const usableHeight = CURVE_HEIGHT * (1 - 2 * PADDING_PERCENT);
    const startY = CURVE_HEIGHT * PADDING_PERCENT;
    
    const reversedIdx = allLevels.length === 1 ? 0 : (allLevels.length - 1 - idx);
    
    const curveProgress = allLevels.length === 1 
      ? 0.5
      : reversedIdx / (allLevels.length - 1);
    
    const targetY = startY + (curveProgress * usableHeight);

    let closest = curvePoints[0];
    let minDist = Math.abs(curvePoints[0].y - targetY);

    for (const pt of curvePoints) {
      const d = Math.abs(pt.y - targetY);
      if (d < minDist) {
        minDist = d;
        closest = pt;
      }
    }
    return closest;
  }, [allLevels.length, curvePoints]);

  const levelPositions = React.useMemo(() => 
    allLevels.map((_, i) => getLevelPositionOnCurve(i)), 
    [allLevels, getLevelPositionOnCurve]
  );

  const initialScrollY = React.useMemo(() => {
    if (isFirstLoad.current && !isReturningFromNavigation) {
      return CURVE_HEIGHT + height * 1.5 - height;
    } else {
      return savedScrollPosition.current;
    }
  }, [isReturningFromNavigation]);

  // Parse current_level from Supabase (e.g., '1_1' for first level/first subquest, 1-based)
  const [validatedLevel, validatedSubquest] = React.useMemo(() => {
    if (!goal?.current_level) return [1, 1];
    const [lvl, sq] = goal.current_level.split('_').map(Number);
    return [lvl ?? 1, sq ?? 1];
  }, [goal]);

  // Helper to scroll to the current level
  const scrollToCurrentLevel = React.useCallback(() => {
    if (!levelPositions.length || !goal?.current_level) return;
    // Use validatedLevel (1-based) to find the current accessible level
    const [validatedLevel] = goal.current_level.split('_').map(Number);
    // Find the index in allLevels array (0-based) that matches the validatedLevel (1-based)
    const lvlIdx = allLevels.findIndex(lvl => lvl.level_number === validatedLevel);
    if (lvlIdx === -1) {
      console.log(`Level ${validatedLevel} not found in allLevels array`);
      return;
    }
    // The levelPositions array uses the same order as allLevels array
    const { y } = levelPositions[lvlIdx];
    // Center the level in the viewport, accounting for the marginTop offset
    const scrollY = Math.max(0, y + height * 0.5 - height / 2);
    scrollViewRef.current?.scrollTo({ y: scrollY, animated: true });
    // Save the position after scrolling
    savedScrollPosition.current = scrollY;
  }, [levelPositions, goal, allLevels, height, scrollViewRef, savedScrollPosition]);

  // Validate a subquest
  const handleValidateSubquest = async (levelIdx: number, subquestIdx: number) => {
    const levelNum = levelIdx + 1;
    const subquestNum = subquestIdx + 1;
    // Only allow validating the current subquest
    if (levelNum !== validatedLevel || subquestNum !== validatedSubquest) return;
    let newCurrentLevel;
    const level = allLevels[levelIdx];
    if (level && subquestNum < level.sub_quests.length) {
      // Move to next subquest in the same level
      newCurrentLevel = `${levelNum}_${subquestNum + 1}`;
    } else {
      // If last subquest, increment subquest value by 1 (to enable level validation)
      newCurrentLevel = `${levelNum}_${subquestNum + 1}`;
    }
    await supabase.from('goals').update({ current_level: newCurrentLevel }).eq('id', goal.id);
    const updatedGoal = await fetchLatestGoalForUser();
    setGoal(updatedGoal);
    setSelectedLevelData(allLevels[levelIdx]);
    // Scroll to the newly current level when validating
    setTimeout(() => {
      scrollToCurrentLevel();
      // Update saved position after scrolling
      setTimeout(() => {
        const [validatedLevel] = (updatedGoal?.current_level || '1_1').split('_').map(Number);
        const lvlIdx = allLevels.findIndex(lvl => lvl.level_number === validatedLevel);
        if (lvlIdx !== -1) {
          const { y } = levelPositions[lvlIdx];
          savedScrollPosition.current = y + height * 0.5 - height / 2;
        }
      }, 700);
    }, 300);
  };

  // Handler to validate a level (when all subquests are validated, 1-based)
  const handleValidateLevel = async (levelIdx: number) => {
    const levelNum = levelIdx + 1;
    const level = allLevels[levelIdx];
    if (!level || !level.sub_quests || validatedLevel !== levelNum || validatedSubquest <= level.sub_quests.length) return;
    // Move to next level, first subquest (reset subquest to 1)
    const newCurrentLevel = `${levelNum + 1}_1`;
    await supabase.from('goals').update({ current_level: newCurrentLevel }).eq('id', goal.id);
    const updatedGoal = await fetchLatestGoalForUser();
    setGoal(updatedGoal);
    // Close the current level modal
    setSelectedLevelData(null);
    setLevelModalVisible(false);
    // Show the level unlocked banner
    setLevelUnlockedBanner(true);
    setTimeout(() => setLevelUnlockedBanner(false), 2000);
    // Scroll to the newly unlocked level
    setTimeout(() => {
      scrollToCurrentLevel();
    }, 300);
  };

  // Function to refresh data after level creation
  const refreshData = useCallback(async () => {
    try {
      const fetchedGoal = await fetchLatestGoalForUser();
      if (fetchedGoal) {
        setGoal(fetchedGoal);
        setHasGoals(!!fetchedGoal);
        
        if (fetchedGoal.levels) {
          let processedLevels;
          if (Array.isArray(fetchedGoal.levels)) {
            if (fetchedGoal.levels[0] && fetchedGoal.levels[0].levels) {
              processedLevels = fetchedGoal.levels.flatMap((section: any) =>
                (section.levels as any[]).map((lvl: any) => ({
                  ...lvl,
                  sectionTitle: section.title,
                  sectionSummary: section.summary,
                }))
              );
            } else {
              processedLevels = fetchedGoal.levels;
            }
          } else if (typeof fetchedGoal.levels === 'object') {
            if (fetchedGoal.levels.levels) {
              processedLevels = fetchedGoal.levels.levels;
            } else {
              processedLevels = Object.values(fetchedGoal.levels);
            }
          } else {
            processedLevels = [];
          }
          setAllLevels(processedLevels || []);
        }
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  }, []);

  /* -------------------------- HANDLERS ------------------------------------ */
  const handleTabSelect = (idx: number) => {
    savedScrollPosition.current = currentScrollPosition.current;
    setSelectedTab(idx);
    if (idx === 0) router.push('/StatsPage');
    if (idx === 2) router.push('/CommunityPage');
  };

  const handleLevelPress = (levelIndex: number) => {
    const level = allLevels[levelIndex];
    setSelectedLevelData(level);
    setLevelModalVisible(true);
  };

  const handleGoalSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://n8n.srv777212.hstgr.cloud/webhook/Question_Creation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: goalInput }),
      });
      const raw = await response.text();
      const data = JSON.parse(raw);
      const parsed = JSON.parse(data[0].text);
      setQuestions((parsed.questions as any[]).map((q: any) => q.question));
      setAnswers(Array((parsed.questions as any[]).length).fill(''));
      setCurrentQuestion(0);
      setQuestionsModalVisible(true);
      setHasGoals(true);
      setGoalInput('');
      setLastGoal(goalInput);
    } catch (e) {
      Alert.alert('Erreur', "Impossible d'envoyer l'objectif. Veuillez réessayer.");
    } finally {
      setLoading(false);
      setConfirmVisible(false);
    }
  };

  /* ----------------------------- RENDER ----------------------------------- */
  if (initializing) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A1B2B', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={ORANGE} />
        <Text style={{ color: '#fff', marginTop: 16 }}>Initialisation...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A1B2B', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontSize: 18, marginBottom: 20 }}>Vous devez être connecté</Text>
        <TouchableOpacity
          style={{ backgroundColor: ORANGE, padding: 16, borderRadius: 8 }}
          onPress={() => router.push('/AuthPage')}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Se connecter</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A1B2B', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={ORANGE} />
        <Text style={{ color: '#fff', marginTop: 16 }}>Chargement...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Modals here */}
      <Modal visible={confirmVisible} transparent animationType="fade" onRequestClose={() => setConfirmVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Confirmer l&apos;objectif</Text>
            <Text style={{ fontSize: 16, color: '#3A5A6A', marginBottom: 16, textAlign: 'center' }}>{goalInput}</Text>
            {loading ? (
              <ActivityIndicator size="large" color={ORANGE} />
            ) : (
              <>
                <TouchableOpacity style={styles.modalButton} onPress={handleGoalSubmit}>
                  <Text style={styles.modalButtonText}>Envoyer</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setConfirmVisible(false)}>
                  <Text style={styles.modalCancelText}>Annuler</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={levelModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLevelModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.levelModalCard}>
            <View style={styles.levelModalHeader}>
              <Text style={styles.levelModalTitle}>
                Niveau {selectedLevelData?.level_number || '?'}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setLevelModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#3A5A6A" />
              </TouchableOpacity>
            </View>
            
            {selectedLevelData && (
              <ScrollView style={styles.levelModalContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.levelTitle}>{selectedLevelData.title}</Text>
                <Text style={styles.levelSummary}>{selectedLevelData.summary}</Text>
                
                {selectedLevelData.sub_quests && selectedLevelData.sub_quests.length > 0 && (
                  <View style={styles.subQuestsContainer}>
                    <Text style={styles.subQuestsTitle}>Sous-quêtes :</Text>
                    {selectedLevelData.sub_quests.map((sq: any, idx: number) => {
                      const levelNum = selectedLevelData.level_number;
                      // Only subquests with idx+1 < validatedSubquest are validated
                      const isValidated = levelNum < validatedLevel || (levelNum === validatedLevel && idx + 1 < validatedSubquest);
                      return (
                        <View key={idx} style={[styles.subQuestCard, isValidated && { backgroundColor: '#D4F5E9', borderLeftColor: '#71ABA4' }]}> 
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={[styles.subQuestTitle, isValidated && { color: '#71ABA4' }]}>{sq.title}</Text>
                            {isValidated && <Ionicons name="checkmark-circle" size={22} color="#71ABA4" />}
                          </View>
                          <Text style={styles.subQuestInstructions}>{sq.instructions}</Text>
                          {!isValidated && (
                            <TouchableOpacity style={[styles.levelModalButton, { marginTop: 10, paddingVertical: 8 }]} onPress={() => handleValidateSubquest(selectedLevelData.level_number - 1, idx)}>
                              <Text style={styles.levelModalButtonText}>Valider</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}
                {/* Validation condition for the level */}
                {selectedLevelData.validation && (
                  <View style={styles.validationContainer}>
                    <Text style={styles.validationTitle}>Condition de validation :</Text>
                    <Text style={styles.validationDescription}>{selectedLevelData.validation.description}</Text>
                  </View>
                )}
                {/* Validation button for the level */}
                {selectedLevelData.sub_quests && selectedLevelData.sub_quests.length > 0 && (
                  <TouchableOpacity
                    style={[styles.levelModalButton, { marginTop: 16, backgroundColor: (selectedLevelData.level_number < validatedLevel || (selectedLevelData.level_number === validatedLevel && validatedSubquest > selectedLevelData.sub_quests.length)) ? ORANGE : '#ccc' }]}
                    disabled={!(selectedLevelData.level_number < validatedLevel || (selectedLevelData.level_number === validatedLevel && validatedSubquest > selectedLevelData.sub_quests.length))}
                    onPress={() => handleValidateLevel(selectedLevelData.level_number - 1)}
                  >
                    <Text style={styles.levelModalButtonText}>Valider le niveau</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}
            
          </View>
        </View>
      </Modal>

      <ImageBackground source={require('../assets/images/Untitled.png')} style={styles.container} resizeMode="cover">
        <View style={styles.content}>
          {hasGoals === false ? (
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={{ flex: 1 }}>
                <AnimatedQuestBox t={t} onComplete={refreshData} />
              </View>
            </TouchableWithoutFeedback>
          ) : (
            <View style={{ flex: 1 }}>
              <AnimatedScrollView
                ref={scrollViewRef}
                style={styles.scrollView}
                contentContainerStyle={{ height: CURVE_HEIGHT + height * 1.5 }}
                showsVerticalScrollIndicator={false}
                scrollEventThrottle={16}
                contentOffset={{ x: 0, y: initialScrollY }}
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
                  useNativeDriver: false,
                  listener: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
                    const yOffset = e.nativeEvent.contentOffset.y;
                    currentScrollPosition.current = yOffset;
                    
                    let minDist = Infinity;
                    let minIdx = 0;
                    for (let i = 0; i < allLevels.length; i++) {
                      const lvlY = (levelPositions[i]?.y || 0) + height * 0.5;
                      const dist = Math.abs(lvlY - yOffset - height / 2);
                      if (dist < minDist) {
                        minDist = dist;
                        minIdx = i;
                      }
                    }
                    setExpandedLevel(minIdx);
                  },
                })}
              >
                <View style={{ width: CURVE_WIDTH, height: CURVE_HEIGHT, marginTop: height * 0.5 }}>
                  <Svg width={CURVE_WIDTH} height={CURVE_HEIGHT} style={{ position: 'absolute', top: 0, left: 0 }}>
                    <Path d={curvePath} stroke={ORANGE} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>

                  {allLevels.map((level, i) => {
                    const { x, y } = levelPositions[i] || { x: CURVE_WIDTH / 2, y: CURVE_HEIGHT / 2 };
                    const selected = expandedLevel === i;
                    const levelNum = level.level_number || (i + 1);
                    const isCompleted = levelNum < validatedLevel;
                    const isCurrent = levelNum === validatedLevel;
                    const isAccessible = isCompleted || isCurrent;
                    
                    return (
                      <View
                        key={i}
                        style={{
                          position: 'absolute',
                          left: x - (selected ? EXPANDED_RADIUS : CIRCLE_RADIUS),
                          top: y - (selected ? EXPANDED_RADIUS : CIRCLE_RADIUS),
                          width: (selected ? EXPANDED_RADIUS : CIRCLE_RADIUS) * 2,
                          height: (selected ? EXPANDED_RADIUS : CIRCLE_RADIUS) * 2,
                          borderRadius: 999,
                          backgroundColor: isCompleted ? ORANGE : isAccessible ? (selected ? '#fff' : '#71ABA4') : '#D3D3D3',
                          zIndex: selected ? 2 : 1,
                          borderWidth: selected ? 3 : 2,
                          borderColor: selected ? ORANGE : 'rgba(255,255,255,0.3)',
                          justifyContent: 'center',
                          alignItems: 'center',
                          elevation: selected ? 8 : 3,
                          shadowColor: '#000',
                          shadowOpacity: selected ? 0.25 : 0.1,
                          shadowRadius: selected ? 10 : 4,
                          shadowOffset: { width: 0, height: selected ? 4 : 2 },
                        }}
                      >
                        {isAccessible ? (
                          <TouchableOpacity
                            style={{ flex: 1, width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}
                            activeOpacity={0.85}
                            onPress={() => handleLevelPress(i)}
                          >
                            {selected ? (
                              <>
                                <Text style={{ color: '#71ABA4', fontSize: 22, fontWeight: 'bold', marginBottom: 8 }}>
                                  {`Niveau ${levelNum}`}
                                </Text>
                                <View
                                  style={{
                                    marginTop: 6,
                                    width: 38,
                                    height: 38,
                                    borderRadius: 19,
                                    backgroundColor: ORANGE,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderWidth: 2,
                                    borderColor: '#fff',
                                    shadowColor: ORANGE,
                                    shadowOpacity: 0.3,
                                    shadowRadius: 4,
                                    elevation: 3,
                                  }}
                                >
                                  <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold' }}>+</Text>
                                </View>
                              </>
                            ) : (
                              <Text style={{ color: isCompleted ? '#fff' : '#3A5A6A', fontSize: 20, fontWeight: 'bold' }}>
                                {levelNum}
                              </Text>
                            )}
                            {isCompleted && !selected && (
                              <Ionicons name="checkmark-circle" size={28} color="#fff" style={{ marginTop: 4 }} />
                            )}
                          </TouchableOpacity>
                        ) : (
                          <View style={{ flex: 1, width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', opacity: 0.6 }}>
                            <Ionicons name="lock-closed" size={28} color="#888" style={{ marginBottom: 4 }} />
                            <Text style={{ color: '#888', fontSize: 18, fontWeight: 'bold' }}>{levelNum}</Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              </AnimatedScrollView>
            </View>
          )}
        </View>

        <BottomNavBar selectedIndex={selectedTab} onSelect={handleTabSelect} />
      </ImageBackground>
    </>
  );
}

// Fixed AnimatedQuestBox component
function AnimatedQuestBox({ t, onComplete }: { t: (key: string, options?: any) => string; onComplete: () => void }) {
  const [step, setStep] = useState<'intro' | 'input' | 'questions'>('intro');
  const [goalInput, setGoalInput] = useState('');
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [anim] = useState(new Animated.Value(1));
  const [inputAnim] = useState(new Animated.Value(0));
  const [questionsAnim] = useState(new Animated.Value(0));
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const handleLaunch = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.timing(anim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setStep('input');
      Animated.timing(inputAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleSend = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowConfirmModal(true);
  };

  const confirmSend = async () => {
    setShowConfirmModal(false);
    setLoading(true);
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
    
    try {
      const response = await fetch('https://n8n.srv777212.hstgr.cloud/webhook/Question_Creation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: goalInput }),
      });
      const isOk = response.ok;
      response.json().then(jsonArr => {
        setTimeout(async () => {
          try {
            const textObj = JSON.parse(jsonArr[0].text);
            const qList = textObj.questions.map((q: any) => q.question);
            setQuestions(qList);
            setCurrentQuestion(0);
            setAnswers([]);
            setInputValue('');
            setStep('questions');
            setLoading(false);
            rotateAnim.stopAnimation();
            rotateAnim.setValue(0);
            Animated.timing(questionsAnim, {
              toValue: 1,
              duration: 350,
              useNativeDriver: true,
            }).start();
          } catch (err) {
            setLoading(false);
            rotateAnim.stopAnimation();
            rotateAnim.setValue(0);
          }
        }, 1000);
      });
    } catch (e) {
      setLoading(false);
      rotateAnim.stopAnimation();
      rotateAnim.setValue(0);
    }
  };

  const cancelSend = () => {
    setShowConfirmModal(false);
  };

  const handleNext = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = inputValue;
    setAnswers(newAnswers);
    setInputValue('');
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;
        const responsesObj = Object.fromEntries(questions.map((q, i) => [q, newAnswers[i]]));
        const payload = {
          goal: goalInput,
          responses: responsesObj,
          user_id: user?.id || null,
        };
        
        await fetch('https://n8n.srv777212.hstgr.cloud/webhook/Level_Creation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        
        // Fixed: Use the callback instead of window.location.reload()
        setTimeout(() => {
          onComplete();
        }, 3000);
      } catch (err) {
        console.log('Level creation error:', err);
      }
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      {step === 'intro' && (
        <Animated.View
          style={{
            backgroundColor: '#fff',
            borderRadius: 24,
            padding: 32,
            alignItems: 'center',
            width: '85%',
            opacity: anim,
            transform: [{ scale: anim }],
            position: 'absolute',
          }}
        >
          <Text style={{ color: '#71ABA4', fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 }}>
            {t('homeScreen.no_quest_title')}
          </Text>
          <Text style={{ color: '#71ABA4', fontSize: 17, textAlign: 'center', marginBottom: 28 }}>
            {t('homeScreen.no_quest_subtitle')}
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: ORANGE,
              borderRadius: 999,
              paddingVertical: 14,
              width: '95%',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 8,
              shadowColor: ORANGE,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.18,
              shadowRadius: 8,
              elevation: 4,
            }}
            activeOpacity={0.85}
            onPress={handleLaunch}
          >
            <Ionicons name="rocket-outline" size={26} color="#fff" style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 18, color: '#fff', fontWeight: 'bold' }}>{t('homeScreen.launch_quest')}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {step === 'input' && (
        <>
          <Animated.View
            style={{
              backgroundColor: '#fff',
              borderRadius: 24,
              padding: 32,
              alignItems: 'center',
              width: '85%',
              opacity: inputAnim,
              transform: [{ scale: inputAnim }],
              position: 'absolute',
            }}
          >
            <Text style={{ color: '#71ABA4', fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 18 }}>
              {t('homeScreen.goal_modal_title')}
            </Text>
            <TextInput
              value={goalInput}
              onChangeText={setGoalInput}
              placeholder={t('homeScreen.goal_placeholder')}
              placeholderTextColor="#B0CFC7"
              style={{
                width: '100%',
                borderWidth: 1.5,
                borderColor: '#71ABA4',
                borderRadius: 12,
                padding: 14,
                fontSize: 17,
                color: '#3A5A6A',
                marginBottom: 24,
                backgroundColor: '#F7FAF9',
              }}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              returnKeyType="done"
              blurOnSubmit={true}
              onSubmitEditing={() => Keyboard.dismiss()}
            />
            <TouchableOpacity
              style={{
                backgroundColor: ORANGE,
                borderRadius: 999,
                paddingVertical: 14,
                width: '95%',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 8,
                shadowColor: ORANGE,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.18,
                shadowRadius: 8,
                elevation: 4,
              }}
              activeOpacity={0.85}
              onPress={handleSend}
            >
              <Text style={{ fontSize: 18, color: '#fff', fontWeight: 'bold', marginRight: 8 }}>{t('homeScreen.send')}</Text>
              <Animated.Image
                source={require('../assets/images/head.png')}
                style={{
                  width: 28,
                  height: 28,
                  marginLeft: 8,
                  tintColor: '#fff',
                  transform: [
                    {
                      rotate: loading
                        ? rotateAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', '360deg'],
                          })
                        : '0deg',
                    },
                  ],
                }}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </Animated.View>
          <Modal
            visible={showConfirmModal}
            transparent
            animationType="fade"
            onRequestClose={cancelSend}
          >
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'center', alignItems: 'center' }}>
              <View style={{ backgroundColor: '#fff', borderRadius: 24, padding: 28, width: '80%', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 }}>
                <Text style={{ color: '#3A5A6A', fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 18 }}>
                  {t('homeScreen.confirm_goal_title')}
                </Text>
                <Text style={{ color: '#71ABA4', fontSize: 18, textAlign: 'center', marginBottom: 28 }}>
                  {goalInput}
                </Text>
                <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between' }}>
                  <TouchableOpacity
                    style={{ backgroundColor: '#5F9E8A', borderRadius: 999, paddingVertical: 12, paddingHorizontal: 28 }}
                    onPress={confirmSend}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{t('homeScreen.confirm')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ backgroundColor: '#FD8B5A', borderRadius: 999, paddingVertical: 12, paddingHorizontal: 28 }}
                    onPress={cancelSend}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{t('homeScreen.cancel')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </>
      )}

      {step === 'questions' && questions.length > 0 && (
        <Animated.View
          style={{
            backgroundColor: '#fff',
            borderRadius: 24,
            padding: 32,
            alignItems: 'center',
            width: '85%',
            opacity: questionsAnim,
            transform: [{ scale: questionsAnim }],
            position: 'absolute',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 18 }}>
            {currentQuestion > 0 && (
              <TouchableOpacity 
                style={{ padding: 4, marginRight: 8 }}
                onPress={() => setCurrentQuestion(currentQuestion - 1)}
              >
                <Ionicons name="arrow-back" size={24} color="#71ABA4" />
              </TouchableOpacity>
            )}
            <View style={{ flex: 1, alignItems: 'center', flexDirection: 'row' }}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <View style={{ width: '100%', height: 4, backgroundColor: '#E6E6E6', borderRadius: 2, overflow: 'hidden' }}>
                  <Animated.View
                    style={{
                      height: 4,
                      backgroundColor: '#71ABA4',
                      width: `${((currentQuestion + 1) / questions.length) * 100}%`,
                      borderRadius: 2,
                    }}
                  />
                </View>
              </View>
              <Text style={{ color: '#71ABA4', fontSize: 15, fontWeight: 'bold', minWidth: 48, textAlign: 'right' }}>
                {`${currentQuestion + 1} / ${questions.length}`}
              </Text>
            </View>
          </View>
          <Text style={{ color: '#3A5A6A', fontSize: 18, textAlign: 'center', marginBottom: 18 }}>
            {questions[currentQuestion]}
          </Text>
          <TextInput
            value={inputValue}
            onChangeText={setInputValue}
            placeholder={t('homeScreen.answer_placeholder')}
            placeholderTextColor="#B0CFC7"
            style={{
              width: '100%',
              borderWidth: 1.5,
              borderColor: '#71ABA4',
              borderRadius: 12,
              padding: 14,
              fontSize: 17,
              color: '#3A5A6A',
              marginBottom: 24,
              backgroundColor: '#F7FAF9',
            }}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            returnKeyType="done"
            blurOnSubmit={true}
            onSubmitEditing={() => {
              Keyboard.dismiss();
              handleNext();
            }}
          />
          <TouchableOpacity
            style={{
              backgroundColor: ORANGE,
              borderRadius: 999,
              paddingVertical: 14,
              width: '95%',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 8,
              shadowColor: ORANGE,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.18,
              shadowRadius: 8,
              elevation: 4,
            }}
            activeOpacity={0.85}
            onPress={handleNext}
          >
            <Text style={{ fontSize: 18, color: '#fff', fontWeight: 'bold' }}>
              {currentQuestion === questions.length - 1 ? t('homeScreen.finish') : t('homeScreen.next')}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}

async function fetchLatestGoalForUser() {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      console.log('User not found or error:', userError);
      return null;
    }
    const userId = userData.user.id;
    console.log('Fetching goals for user:', userId);

    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.log('Supabase fetch error:', error);
      return null;
    }
    
    console.log('Raw Supabase data:', data);
    
    if (data && data.length > 0) {
      const goal = data[0];
      console.log('Found goal:', goal);
      
      if (!goal.current_level) {
        console.log('No current_level found, setting default to 1_1');
        const { error: updateError } = await supabase
          .from('goals')
          .update({ current_level: '1_1' })
          .eq('id', goal.id);
        
        if (!updateError) {
          goal.current_level = '1_1';
        }
      }
      
      return goal;
    }
    
    console.log('No goals found for user');
    return null;
  } catch (error) {
    console.error('Error in fetchLatestGoalForUser:', error);
    return null;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: width,
    height: height + statusBarHeight,
    paddingTop: statusBarHeight,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3A5A6A',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#E6E6E6',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 18,
    backgroundColor: '#F7F7F7',
    color: '#333',
  },
  modalButton: {
    backgroundColor: ORANGE,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 32,
    marginBottom: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalCancelText: {
    color: '#888',
    fontSize: 16,
    marginTop: 4,
    textDecorationLine: 'underline',
  },
  questionText: {
    fontSize: 18,
    color: '#3A5A6A',
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 24,
    color: '#71ABA4',
  },
  levelModalCard: {
    width: '90%',
    height: '85%',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  levelModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E6E6E6',
  },
  levelModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: ORANGE,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F7F7F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelModalContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  levelTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#3A5A6A',
    marginBottom: 12,
  },
  levelSummary: {
    fontSize: 16,
    color: '#71ABA4',
    lineHeight: 24,
    marginBottom: 20,
  },
  subQuestsContainer: {
    marginBottom: 20,
  },
  subQuestsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3A5A6A',
    marginBottom: 12,
  },
  subQuestCard: {
    backgroundColor: '#F7FAF9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: ORANGE,
  },
  subQuestTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: ORANGE,
    marginBottom: 8,
  },
  subQuestInstructions: {
    fontSize: 14,
    color: '#3A5A6A',
    lineHeight: 20,
  },
  validationContainer: {
    backgroundColor: '#E8F5F3',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  validationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#71ABA4',
    marginBottom: 8,
  },
  validationDescription: {
    fontSize: 14,
    color: '#3A5A6A',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  levelModalButton: {
    backgroundColor: ORANGE,
    borderRadius: 16,
    paddingVertical: 16,
    marginHorizontal: 24,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: ORANGE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  levelModalButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});