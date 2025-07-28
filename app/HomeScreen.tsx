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
  Image,
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
const BASE_CURVE_HEIGHT = height * 4; // Minimum curve height
const CURVE_WIDTH = width;
const AMPLITUDE = width * 0.25;
const CIRCLE_RADIUS = 32;
const EXPANDED_RADIUS = 70;
const OSCILLATIONS = 6;
const ITEM_SPACING = 180; // Fixed spacing between timeline items (phases and levels)

// Global flag to track if this is the very first app load
let isVeryFirstLoad = true;

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

  /* ----- Difficulty selection ----- */
  const [difficulty, setDifficulty] = useState('facile');
  const [difficultyDropdownVisible, setDifficultyDropdownVisible] = useState(false);

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

  /* ----------------------- DIFFICULTY FILTERING HELPER ------------------- */
  const applyDifficultyFilter = useCallback((levels: any[], difficultyParam: string) => {
    if (difficultyParam === 'facile') {
      return levels; // Return all levels
    }
    
    const skipRatio = difficultyParam === 'normal' ? 3 : 2; // Skip 1 in 3 for normal, 1 in 2 for difficile
    let nonCoreCounter = 0;
    
    const filteredLevels = levels.filter((level) => {
      if (level.core) {
        return true; // Always include core levels
      }
      
      nonCoreCounter++;
      const shouldKeep = (nonCoreCounter % skipRatio) !== 0;
      return shouldKeep;
    });
    
    return filteredLevels;
  }, []);

  // Level mapping system to track original level numbers while displaying sequential numbers
  const [levelMapping, setLevelMapping] = useState<{[key: number]: number}>({}); // displayLevel -> originalLevel
  const [reverseLevelMapping, setReverseLevelMapping] = useState<{[key: number]: number}>({}); // originalLevel -> displayLevel

  const processGoalLevels = useCallback((fetchedGoal: any, currentDifficulty: string = difficulty) => {
    if (!fetchedGoal || !fetchedGoal.levels) {
      return [];
    }

    let processedLevels;
    let newLevelMapping: {[key: number]: number} = {};
    let newReverseLevelMapping: {[key: number]: number} = {};
    let displayLevelCounter = 1;
    if (Array.isArray(fetchedGoal.levels)) {
      if (fetchedGoal.levels[0] && fetchedGoal.levels[0].levels) {
        // New structure: phases with levels
        // First, collect all levels from all phases with their phase info
        let allLevelsWithPhaseInfo: any[] = [];
        fetchedGoal.levels.forEach((phase: any) => {
          if (phase.levels && Array.isArray(phase.levels)) {
            phase.levels.forEach((lvl: any) => {
              allLevelsWithPhaseInfo.push({
                ...lvl,
                phaseTitle: phase.title,
                phaseSummary: phase.summary,
              });
            });
          }
        });
        
        // Apply difficulty filter to all levels at once
        const filteredLevels = applyDifficultyFilter(allLevelsWithPhaseInfo, currentDifficulty);
        
        // Now organize them back into timeline with phases and create mapping
        let timelineItems: any[] = [];
        let currentPhase = '';
        
        filteredLevels.forEach((lvl: any) => {
          // Add phase marker when we encounter a new phase
          if (lvl.phaseTitle !== currentPhase) {
            timelineItems.push({
              type: 'phase',
              title: lvl.phaseTitle,
              summary: lvl.phaseSummary,
            });
            currentPhase = lvl.phaseTitle;
          }
          
          // Create mapping: displayLevel -> originalLevel
          const originalLevel = lvl.level_number;
          newLevelMapping[displayLevelCounter] = originalLevel;
          newReverseLevelMapping[originalLevel] = displayLevelCounter;
          
          // Add the level with display level number
          timelineItems.push({
            type: 'level',
            ...lvl,
            original_level_number: originalLevel, // Keep original for database operations
            level_number: displayLevelCounter, // Use display number for UI
            sectionTitle: lvl.phaseTitle,
            sectionSummary: lvl.phaseSummary,
          });
          
          displayLevelCounter++;
        });
        
        processedLevels = timelineItems;
      } else {
        // Fallback: just levels
        const filteredLevels = applyDifficultyFilter(fetchedGoal.levels, currentDifficulty);
        processedLevels = filteredLevels.map((lvl: any) => {
          const originalLevel = lvl.level_number;
          newLevelMapping[displayLevelCounter] = originalLevel;
          newReverseLevelMapping[originalLevel] = displayLevelCounter;
          
          const result = {
            type: 'level',
            ...lvl,
            original_level_number: originalLevel,
            level_number: displayLevelCounter,
          };
          
          displayLevelCounter++;
          return result;
        });
      }
    } else if (typeof fetchedGoal.levels === 'object') {
      if (fetchedGoal.levels.levels) {
        const filteredLevels = applyDifficultyFilter(fetchedGoal.levels.levels, currentDifficulty);
        processedLevels = filteredLevels.map((lvl: any) => {
          const originalLevel = lvl.level_number;
          newLevelMapping[displayLevelCounter] = originalLevel;
          newReverseLevelMapping[originalLevel] = displayLevelCounter;
          
          const result = {
            type: 'level',
            ...lvl,
            original_level_number: originalLevel,
            level_number: displayLevelCounter,
          };
          
          displayLevelCounter++;
          return result;
        });
      } else {
        const levelsArray = Object.values(fetchedGoal.levels);
        const filteredLevels = applyDifficultyFilter(levelsArray, currentDifficulty);
        processedLevels = filteredLevels.map((lvl: any) => {
          const originalLevel = lvl.level_number;
          newLevelMapping[displayLevelCounter] = originalLevel;
          newReverseLevelMapping[originalLevel] = displayLevelCounter;
          
          const result = {
            type: 'level',
            ...lvl,
            original_level_number: originalLevel,
            level_number: displayLevelCounter,
          };
          
          displayLevelCounter++;
          return result;
        });
      }
    } else {
      processedLevels = [];
    }
    
    // Update the mappings
    setLevelMapping(newLevelMapping);
    setReverseLevelMapping(newReverseLevelMapping);
    
    return processedLevels || [];
  }, [applyDifficultyFilter]);

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
        
        if (!mounted) return;
        
        setGoal(fetchedGoal);
        setHasGoals(!!fetchedGoal);

        const processedLevels = processGoalLevels(fetchedGoal, difficulty);
        
        if (mounted) {
          setAllLevels(processedLevels);
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
  }, [user, initializing, processGoalLevels]);

  /* ----------------------- RE-PROCESS LEVELS ON DIFFICULTY CHANGE --------- */
  const processingRef = useRef(false);
  
  useEffect(() => {
    if (goal && !processingRef.current) {
      processingRef.current = true;
      
      const processedLevels = processGoalLevels(goal, difficulty);
      setAllLevels(processedLevels);
      
      // Small delay to ensure state updates are processed
      setTimeout(() => {
        processingRef.current = false;
      }, 50);
    }
  }, [difficulty, goal, processGoalLevels]);



  /* ------------------------------ COURBE ---------------------------------- */
  // Calculate dynamic curve height based on number of timeline items
  const CURVE_HEIGHT = React.useMemo(() => {
    const itemCount = allLevels.length;
    const phaseCount = allLevels.filter(item => item.type === 'phase').length;
    const levelCount = allLevels.filter(item => item.type === 'level').length;
    
    console.log(`🏔️ CURVE HEIGHT CALCULATION`);
    console.log(`🏔️ Current difficulty: ${difficulty}`);
    console.log(`🏔️ Total timeline items: ${itemCount}`);
    console.log(`🏔️ Breakdown - Phases: ${phaseCount}, Levels: ${levelCount}`);
    console.log(`🏔️ Expected: Phases + Levels = ${phaseCount + levelCount} = ${itemCount} ✓`);
    
    const requiredHeight = (itemCount + 2) * ITEM_SPACING; // +2 for padding
    return Math.max(BASE_CURVE_HEIGHT, requiredHeight);
  }, [allLevels.length, allLevels, difficulty]);

  const curvePoints = React.useMemo(() => {
    const pts: { x: number; y: number }[] = [];
    for (let y = 0; y <= CURVE_HEIGHT; y += 3) {
      const normY = y / CURVE_HEIGHT;
      const x = CURVE_WIDTH / 2 - AMPLITUDE * Math.sin(normY * 2 * Math.PI * OSCILLATIONS);
      pts.push({ x, y });
    }
    return pts;
  }, [CURVE_HEIGHT]);

  const curvePath = React.useMemo(() => {
    if (!curvePoints.length) return '';
    return curvePoints.reduce(
      (p, c, idx) => `${p}${idx === 0 ? `M${c.x},${c.y}` : ` L${c.x},${c.y}`}`,
      '',
    );
  }, [curvePoints]);

  const getLevelPositionOnCurve = React.useCallback((idx: number) => {
    if (allLevels.length === 0) return { x: CURVE_WIDTH / 2, y: CURVE_HEIGHT / 2 };

    // Use fixed spacing between items, starting from the bottom
    const startY = CURVE_HEIGHT - (ITEM_SPACING * 2); // Start a bit from the bottom
    const itemY = startY - (idx * ITEM_SPACING); // Each item is ITEM_SPACING pixels apart
    
    // Ensure we don't go above the curve
    const targetY = Math.max(ITEM_SPACING, itemY);

    // Find the closest point on the curve to our target Y position
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
  }, [allLevels.length, curvePoints, CURVE_HEIGHT]);

  const levelPositions = React.useMemo(() => 
    allLevels.map((_, i) => getLevelPositionOnCurve(i)), 
    [allLevels, getLevelPositionOnCurve]
  );

  const initialScrollY = React.useMemo(() => {
    if (isFirstLoad.current && !isReturningFromNavigation) {
      // Always start at top of curve on initial load - let auto-scroll handle positioning
      return height * 0.5;
    } else {
      return savedScrollPosition.current;
    }
  }, [isReturningFromNavigation, height]);

  // Parse current_level from Supabase (e.g., '1_1' for first level/first subquest, 1-based) 
  // and map to display level numbers
  const [validatedLevel, validatedSubquest, originalValidatedLevel] = React.useMemo(() => {
    if (!goal?.current_level) return [1, 1, 1];
    const [originalLvl, sq] = goal.current_level.split('_').map(Number);
    const displayLvl = reverseLevelMapping[originalLvl] ?? originalLvl;
    
    console.log(`🎯 Current Level Mapping: Original=${originalLvl}, Display=${displayLvl}, Subquest=${sq}`);
    
    return [displayLvl ?? 1, sq ?? 1, originalLvl ?? 1];
  }, [goal, reverseLevelMapping]);

  // Helper to scroll to the current level
  const scrollToCurrentLevel = React.useCallback(() => {
    if (!levelPositions.length || !goal?.current_level) {
      console.log('🎯 scrollToCurrentLevel: Missing data - levelPositions:', levelPositions.length, 'goal.current_level:', goal?.current_level);
      return;
    }
    
    // Get the original level from database and map to display level
    const [originalLevel] = goal.current_level.split('_').map(Number);
    const displayLevel = reverseLevelMapping[originalLevel] ?? originalLevel;
    
    console.log('🎯 scrollToCurrentLevel: originalLevel =', originalLevel, 'displayLevel =', displayLevel);
    console.log('🎯 scrollToCurrentLevel: reverseLevelMapping =', reverseLevelMapping);
    
    // Find the index in allLevels array (0-based) that matches the display level (1-based)
    // Only search in level items, not phase items
    const lvlIdx = allLevels.findIndex(item => item.type === 'level' && item.level_number === displayLevel);
    if (lvlIdx === -1) {
      console.log(`🎯 Display Level ${displayLevel} (original: ${originalLevel}) not found in allLevels array`);
      console.log('🎯 Available levels:', allLevels.filter(item => item.type === 'level').map(item => item.level_number));
      return;
    }
    
    // Ensure we have valid position data
    if (!levelPositions[lvlIdx]) {
      console.log('🎯 No position data for level index:', lvlIdx);
      return;
    }
    
    // The levelPositions array uses the same order as allLevels array
    const { y } = levelPositions[lvlIdx];
    // Center the level in the viewport, accounting for the marginTop offset
    const scrollY = Math.max(0, y + height * 0.5 - height / 2);
    
    console.log('🎯 scrollToCurrentLevel: Scrolling to y =', scrollY, 'for level at position y =', y);
    
    scrollViewRef.current?.scrollTo({ y: scrollY, animated: true });
    // Save the position after scrolling
    savedScrollPosition.current = scrollY;
  }, [levelPositions, goal, allLevels, height, scrollViewRef, savedScrollPosition, reverseLevelMapping]);

  /* ----------------------- COMBINED SCROLL MANAGEMENT ---------- */
  const scrollTimeoutRef = useRef<number | null>(null);
  
  useEffect(() => {
    // Clear any existing timeout to prevent conflicts
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = null;
    }
    
    // Don't scroll if still loading or missing data
    if (loading || !goal || allLevels.length === 0 || levelPositions.length === 0) {
      console.log('🎯 Skipping scroll animation - loading:', loading);
      return;
    }
    
    // Only animate on initial app load or difficulty changes, not navigation returns
        console.log('🎯 Managing scroll animation - isVeryFirstLoad:', isVeryFirstLoad, 'difficulty:', difficulty, 'selectedTab:', selectedTab);
    
    if (isVeryFirstLoad) {
      // On initial app load: start at level 1, then animate to current level
      const firstLevelIdx = allLevels.findIndex(item => item.type === 'level');
      if (firstLevelIdx !== -1) {
        const { y: firstY } = levelPositions[firstLevelIdx];
        const firstScrollY = Math.max(0, firstY + height * 0.5 - height / 2);
        
        // Immediately scroll to level 1 without animation
        scrollViewRef.current?.scrollTo({ y: firstScrollY, animated: false });
        savedScrollPosition.current = firstScrollY;
        
        // Then animate to current level after a delay
        scrollTimeoutRef.current = setTimeout(() => {
          console.log('🎯 Initial auto-scroll to current level');
          scrollToCurrentLevel();
          isVeryFirstLoad = false; // Mark as no longer first load globally
        }, 800);
      }
    } else {
      // On difficulty change or navigation return: go directly to current level
      console.log('🎯 Difficulty change or return - direct scroll to current level');
      scrollTimeoutRef.current = setTimeout(() => {
        // Ensure mappings are ready before scrolling
        if (Object.keys(reverseLevelMapping).length > 0) {
          scrollToCurrentLevel();
        } else {
          console.log('🎯 Mappings not ready, waiting longer...');
          // Wait a bit more if mappings aren't ready
          setTimeout(() => scrollToCurrentLevel(), 200);
        }
      }, 200); // Longer delay to ensure all state updates complete
    }
    
    // Cleanup function
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = null;
      }
    };
     }, [loading, goal, allLevels, levelPositions, scrollToCurrentLevel, difficulty, height]);

  // Validate a subquest
  const handleValidateSubquest = async (levelIdx: number, subquestIdx: number) => {
    // Find the actual level item (skip phases)
    const levelItem = allLevels[levelIdx];
    if (levelItem.type !== 'level') return;
    
    const displayLevelNum = levelItem.level_number; // This is now the display level number
    const originalLevelNum = levelItem.original_level_number; // This is the original level number for DB
    const subquestNum = subquestIdx + 1;
    
    // Only allow validating the current subquest (compare with display level)
    if (displayLevelNum !== validatedLevel || subquestNum !== validatedSubquest) return;
    
    let newCurrentLevel;
    if (levelItem && subquestNum < levelItem.sub_quests.length) {
      // Move to next subquest in the same level (use original level number for DB)
      newCurrentLevel = `${originalLevelNum}_${subquestNum + 1}`;
    } else {
      // If last subquest, increment subquest value by 1 (to enable level validation)
      newCurrentLevel = `${originalLevelNum}_${subquestNum + 1}`;
    }
    
    console.log(`🔄 Validating subquest: Display Level ${displayLevelNum}, Original Level ${originalLevelNum}, Subquest ${subquestNum}`);
    console.log(`🔄 New current_level for DB: ${newCurrentLevel}`);
    
    await supabase.from('goals').update({ current_level: newCurrentLevel }).eq('id', goal.id);
    const updatedGoal = await fetchLatestGoalForUser();
    setGoal(updatedGoal);
    setSelectedLevelData(levelItem);
    
    // Scroll to the newly current level when validating
    setTimeout(() => {
      scrollToCurrentLevel();
      // Update saved position after scrolling
      setTimeout(() => {
        const [originalValidatedLevel] = (updatedGoal?.current_level || '1_1').split('_').map(Number);
        const displayValidatedLevel = reverseLevelMapping[originalValidatedLevel] ?? originalValidatedLevel;
        const lvlIdx = allLevels.findIndex(item => item.type === 'level' && item.level_number === displayValidatedLevel);
        if (lvlIdx !== -1) {
          const { y } = levelPositions[lvlIdx];
          savedScrollPosition.current = y + height * 0.5 - height / 2;
        }
      }, 700);
    }, 300);
  };

  // Handler to validate a level (when all subquests are validated, 1-based)
  const handleValidateLevel = async (levelIdx: number) => {
    // Find the actual level item (skip phases)
    const levelItem = allLevels[levelIdx];
    if (levelItem.type !== 'level') return;
    
    const displayLevelNum = levelItem.level_number; // Display level number
    const originalLevelNum = levelItem.original_level_number; // Original level number for DB
    
    if (!levelItem || !levelItem.sub_quests || validatedLevel !== displayLevelNum || validatedSubquest <= levelItem.sub_quests.length) return;
    
    // Move to next original level, first subquest (reset subquest to 1)
    const newCurrentLevel = `${originalLevelNum + 1}_1`;
    
    console.log(`🔄 Validating level: Display Level ${displayLevelNum}, Original Level ${originalLevelNum}`);
    console.log(`🔄 New current_level for DB: ${newCurrentLevel}`);
    
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
        
        const processedLevels = processGoalLevels(fetchedGoal, difficulty);
        console.log(`🔄 REFRESH DATA - Processed levels: ${processedLevels.length}`);
        console.log(`🔄 Refresh difficulty: ${difficulty}`);
        setAllLevels(processedLevels);
        console.log(`🔄 Refresh setAllLevels called with ${processedLevels.length} items`);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  }, [processGoalLevels, difficulty]);

  /* -------------------------- HANDLERS ------------------------------------ */
  const handleTabSelect = (idx: number) => {
    setSelectedTab(idx);
    if (idx === 0) router.push('/StatsPage');
    if (idx === 2) router.push('/CommunityPage');
  };

  const handleLevelPress = (levelIndex: number) => {
    const item = allLevels[levelIndex];
    if (item.type !== 'level') return; // Only handle level items
    setSelectedLevelData(item);
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
          onPress={() => router.push('/LoginScreen')}
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
                      const displayLevelNum = selectedLevelData.level_number; // This is now the display level number
                      // Only subquests with idx+1 < validatedSubquest are validated
                      const isValidated = displayLevelNum < validatedLevel || (displayLevelNum === validatedLevel && idx + 1 < validatedSubquest);
                      return (
                        <View key={idx} style={[styles.subQuestCard, isValidated && { backgroundColor: '#D4F5E9', borderLeftColor: '#71ABA4' }]}> 
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={[styles.subQuestTitle, isValidated && { color: '#71ABA4' }]}>{sq.title}</Text>
                            {isValidated && <Ionicons name="checkmark-circle" size={22} color="#71ABA4" />}
                          </View>
                          <Text style={styles.subQuestInstructions}>{sq.instructions}</Text>
                                                      {!isValidated && (
                              <TouchableOpacity style={[styles.levelModalButton, { marginTop: 10, paddingVertical: 8 }]} onPress={() => handleValidateSubquest(allLevels.findIndex(item => item.type === 'level' && item.level_number === selectedLevelData.level_number), idx)}>
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
                    onPress={() => handleValidateLevel(allLevels.findIndex(item => item.type === 'level' && item.level_number === selectedLevelData.level_number))}
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
          {/* Difficulty Selection Card */}
          <View style={styles.difficultyCard}>
            <TouchableOpacity
              style={styles.difficultyButton}
              onPress={() => setDifficultyDropdownVisible(!difficultyDropdownVisible)}
            >
              <Text style={styles.difficultyText}>
                {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
              </Text>
              <Ionicons 
                name={difficultyDropdownVisible ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#71ABA4" 
              />
            </TouchableOpacity>
            
            {difficultyDropdownVisible && (
              <View style={styles.difficultyDropdown}>
                {['facile', 'normal', 'difficile'].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.difficultyOption,
                      difficulty === option && styles.difficultyOptionSelected
                    ]}
                    onPress={() => {
                      setDifficulty(option);
                      setDifficultyDropdownVisible(false);
                    }}
                  >
                    <Text style={[
                      styles.difficultyOptionText,
                      difficulty === option && styles.difficultyOptionTextSelected
                    ]}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

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
                contentContainerStyle={{ height: CURVE_HEIGHT + height * 2 }} // Dynamic height based on number of items
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
                    // Only consider level items for expansion, not phase items
                    for (let i = 0; i < allLevels.length; i++) {
                      const item = allLevels[i];
                      if (item.type === 'level') {
                        const lvlY = (levelPositions[i]?.y || 0) + height * 0.5;
                        const dist = Math.abs(lvlY - yOffset - height / 2);
                        if (dist < minDist) {
                          minDist = dist;
                          minIdx = i;
                        }
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

                  {allLevels.map((item, i) => {
                    const { x, y } = levelPositions[i] || { x: CURVE_WIDTH / 2, y: CURVE_HEIGHT / 2 };
                    
                    if (item.type === 'phase') {
                      // Render phase title
                      return (
                        <View
                          key={`phase-${i}`}
                          style={{
                            position: 'absolute',
                            left: x - 100, // Center the label
                            top: y - 25,   // Position above the curve
                            width: 200,
                            alignItems: 'center',
                            zIndex: 3,
                          }}
                        >
                          <Text style={{ 
                            color: ORANGE, 
                            fontWeight: 'bold', 
                            fontSize: 16, 
                            backgroundColor: 'rgba(255,255,255,0.9)', 
                            padding: 8, 
                            borderRadius: 12,
                            textAlign: 'center',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 4,
                            elevation: 2,
                          }}>
                            {item.title}
                          </Text>
                        </View>
                      );
                    }
                    
                    // Render level (existing code)
                    const level = item;
                    const selected = expandedLevel === i;
                    const displayLevelNum = level.level_number || (i + 1); // This is now the display level number
                    const isCompleted = displayLevelNum < validatedLevel;
                    const isCurrent = displayLevelNum === validatedLevel;
                    const isAccessible = isCompleted || isCurrent;
                    
                    return (
                      <React.Fragment key={i}>
                        <View
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
                                    {`Niveau ${displayLevelNum}`}
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
                                  {displayLevelNum}
                                </Text>
                              )}
                              {isCompleted && !selected && (
                                <Ionicons name="checkmark-circle" size={28} color="#fff" style={{ marginTop: 4 }} />
                              )}
                            </TouchableOpacity>
                          ) : (
                            <View style={{ flex: 1, width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', opacity: 0.6 }}>
                              <Ionicons name="lock-closed" size={28} color="#888" style={{ marginBottom: 4 }} />
                              <Text style={{ color: '#888', fontSize: 18, fontWeight: 'bold' }}>{displayLevelNum}</Text>
                            </View>
                          )}
                        </View>
                        
                        {/* Bird indicator between current level and next level */}
                        {isCurrent && (
                          (() => {
                            // Find the next level item in the timeline
                            let nextLevelIndex = -1;
                            for (let j = i + 1; j < allLevels.length; j++) {
                              if (allLevels[j].type === 'level') {
                                nextLevelIndex = j;
                                break;
                              }
                            }
                            
                            if (nextLevelIndex === -1) return null; // No next level found
                            
                            const currentPos = levelPositions[i];
                            const nextPos = levelPositions[nextLevelIndex];
                            
                            if (!currentPos || !nextPos) return null;
                            
                            // Calculate midpoint between current and next level
                            const midX = (currentPos.x + nextPos.x) / 2;
                            const midY = (currentPos.y + nextPos.y) / 2;
                            
                            return (
                              <View
                                key={`bird-${displayLevelNum}`}
                                style={{
                                  position: 'absolute',
                                  left: midX - 20, // Center the bird (40px width / 2)
                                  top: midY - 20,  // Center the bird (40px height / 2)
                                  width: 40,
                                  height: 40,
                                  zIndex: 4, // Above everything else
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <Image
                                  source={require('../assets/images/bird.png')}
                                  style={{
                                    width: 35,
                                    height: 35,
                                    tintColor: ORANGE,
                                  }}
                                  resizeMode="contain"
                                />
                              </View>
                            );
                          })()
                        )}
                      </React.Fragment>
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
  difficultyCard: {
    position: 'absolute',
    top: statusBarHeight + 20, // Position below status bar
    left: width * 0.5 - 60, // Center horizontally (assuming card width ~120px)
    zIndex: 10, // Above other content
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  difficultyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  difficultyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3A5A6A',
    marginRight: 8,
  },
  difficultyDropdown: {
    position: 'absolute',
    top: 55, // Position below the main card
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  difficultyOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  difficultyOptionSelected: {
    backgroundColor: '#E8F5F3',
    borderLeftWidth: 3,
    borderLeftColor: ORANGE,
  },
  difficultyOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#3A5A6A',
    textAlign: 'center',
  },
  difficultyOptionTextSelected: {
    color: ORANGE,
    fontWeight: 'bold',
  },
});