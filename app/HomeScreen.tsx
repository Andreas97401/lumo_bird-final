import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, Easing, ImageBackground, Keyboard, Modal, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StatusBar, StyleSheet, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import BottomNavBar from '../components/BottomNavBar';
import { Text } from '../components/Text';
import { supabase } from '../lib/supabase';

const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

const { width, height } = Dimensions.get('window');
const statusBarHeight = StatusBar.currentHeight || 0;
const CURVE_HEIGHT = height * 3;
const CURVE_WIDTH = width;
const AMPLITUDE = width * 0.28;
const LEVEL_COUNT = 8;
const INTERVAL = CURVE_HEIGHT / (LEVEL_COUNT + 1);
const CIRCLE_RADIUS = 32;
const EXPANDED_RADIUS = 60;
const CIRCLE_COLOR = '#71ABA4';
const EXPANDED_COLOR = '#fff';
const TEXT_COLOR = '#71ABA4';
const EXPANDED_TEXT_COLOR = '#3A5A6A';
const ORANGE = '#FD8B5A';
const OSCILLATIONS = 3;

function getSineX(y: number) {
  return CURVE_WIDTH / 2 + AMPLITUDE * Math.sin((y / CURVE_HEIGHT) * 2 * Math.PI * OSCILLATIONS);
}

function LevelCircle({
  y, number, isSelected, onPress
}: {
  y: number;
  number: number;
  isSelected: boolean;
  onPress: () => void;
}) {
  const x = getSineX(y);
  return (
    <Animated.View
      style={[
        styles.levelCircle,
        {
          left: x - (isSelected ? EXPANDED_RADIUS : CIRCLE_RADIUS),
          top: y - (isSelected ? EXPANDED_RADIUS : CIRCLE_RADIUS),
          width: isSelected ? EXPANDED_RADIUS * 2 : CIRCLE_RADIUS * 2,
          height: isSelected ? EXPANDED_RADIUS * 2 : CIRCLE_RADIUS * 2,
          backgroundColor: isSelected ? EXPANDED_COLOR : CIRCLE_COLOR,
          zIndex: isSelected ? 2 : 1,
          borderWidth: isSelected ? 2 : 0,
          borderColor: ORANGE,
          justifyContent: 'center',
          alignItems: 'center',
          position: 'absolute',
          elevation: isSelected ? 5 : 1,
          shadowColor: '#000',
          shadowOpacity: isSelected ? 0.2 : 0,
          shadowRadius: isSelected ? 8 : 0,
        },
      ]}
    >
      <TouchableOpacity style={{flex:1, justifyContent:'center', alignItems:'center'}} onPress={onPress} activeOpacity={0.8}>
        <Text style={{
          color: isSelected ? EXPANDED_TEXT_COLOR : '#fff',
          fontSize: isSelected ? 24 : 18,
          fontWeight: 'bold',
        }}>{isSelected ? `Niveau ${number}` : `${number}`}</Text>
        {isSelected && (
          <View style={styles.plusCircle}>
            <Text style={{ color: ORANGE, fontSize: 28, fontWeight: 'bold' }}>+</Text>
          </View>
        )}
      </TouchableOpacity>
      {isSelected && (
        <View style={styles.taskListPlaceholder}>
          <Text style={{ color: '#888', fontSize: 16, marginTop: 8 }}>[Liste de tâches ici]</Text>
        </View>
      )}
    </Animated.View>
  );
}

export default function HomeScreen() {
  const scrollY = useRef(new Animated.Value(0)).current;
  const [selected, setSelected] = useState(0);
  const [selectedTab, setSelectedTab] = useState(2); // Default to center
  const [loading, setLoading] = useState(true);
  const [hasGoals, setHasGoals] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setHasGoals(false);
          setLoading(false);
          return;
        }
        const { data: goals, error } = await supabase
          .from('goals')
          .select('id')
          .eq('user_id', user.id);
        if (error) {
          setHasGoals(false);
        } else {
          setHasGoals(goals && goals.length > 0);
        }
      } catch (e) {
        setHasGoals(false);
      } finally {
        setLoading(false);
      }
    };
    fetchGoals();
  }, []);

  const levels = Array.from({ length: LEVEL_COUNT }, (_, i) => {
    const y = CURVE_HEIGHT - INTERVAL * (i + 1);
    return { y, number: i + 1 };
  });

  const path = Array.from({ length: 200 }, (_, i) => {
    const y = CURVE_HEIGHT - (i / 199) * CURVE_HEIGHT;
    const x = getSineX(y);
    return `${i === 0 ? 'M' : 'L'}${x},${y}`;
  }).join(' ');

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const y = e.nativeEvent.contentOffset.y;
        let minDist = Infinity;
        let minIdx = 0;
        for (let i = 0; i < levels.length; i++) {
          const dist = Math.abs((levels[i].y - y) - height / 2);
          if (dist < minDist) {
            minDist = dist;
            minIdx = i;
          }
        }
        setSelected(minIdx);
      },
    }
  );

  const handleTabSelect = (idx: number) => {
    setSelectedTab(idx);
    if (idx === 2) {
      router.push('/CommunityPage');
    }
    // Tu peux ajouter d'autres redirections pour les autres index si besoin
  };

  // Affichage conditionnel
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A1B2B', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#F48B6C" />
      </View>
    );
  }

  // Affichage principal avec fond et nav bar toujours visibles
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ImageBackground
        source={require('../assets/images/Untitled.png')}
        style={styles.container}
        resizeMode="cover"
      >
        <View style={styles.content}>
          {hasGoals === false ? (
            <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
              <View style={{ flex: 1 }}>
                <AnimatedQuestBox />
              </View>
            </TouchableWithoutFeedback>
          ) : (
            <AnimatedScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              scrollEventThrottle={16}
              onScroll={handleScroll}
            >
              <View style={styles.curveContainer}>
                <Svg width={CURVE_WIDTH} height={CURVE_HEIGHT} style={{ position: 'absolute' }}>
                  <Path d={path} stroke={ORANGE} strokeWidth={3} fill="none" />
                </Svg>
                {levels.map((level, i) => (
                  <LevelCircle
                    key={i}
                    y={level.y}
                    number={level.number}
                    isSelected={i === selected}
                    onPress={() => setSelected(i)}
                  />
                ))}
              </View>
            </AnimatedScrollView>
          )}
        </View>
        <BottomNavBar selectedIndex={selectedTab} onSelect={handleTabSelect} />
      </ImageBackground>
    </>
  );
}

// --- Composant animé pour la box de quête ---
function AnimatedQuestBox() {
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
  const router = useRouter();
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const handleLaunch = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Animation de disparition de la première box
    Animated.timing(anim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setStep('input');
      // Animation d'apparition de la deuxième box
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
    // Animation de rotation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
    try {
      // Récupérer l'utilisateur connecté
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      console.log('Tentative d\'insertion dans goals :', { user_id: user?.id, titre: goalInput, statut: 'nouveau' });
      // Insérer l'objectif dans la table goals
      if (user && user.id) {
        const { error: insertError } = await supabase
          .from('goals')
          .insert({
            user_id: user.id,
            titre: goalInput,
            statut: 'nouveau',
          });
        if (insertError) {
          console.log('Erreur insertion goals :', insertError);
          alert("Erreur lors de l'enregistrement de l'objectif dans la base : " + insertError.message);
          setLoading(false);
          rotateAnim.stopAnimation();
          rotateAnim.setValue(0);
          return;
        } else {
          console.log('Insertion goals réussie !');
          alert('Objectif enregistré dans la base !');
        }
      }
      const response = await fetch('https://n8n.srv777212.hstgr.cloud/webhook/Question_Creation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: goalInput }),
      });
      const isOk = response.ok;
      response.json().then(jsonArr => {
        // DEBUG : afficher la réponse brute
        console.log('Réponse n8n:', jsonArr);
        // Pop-up de confirmation objectif
        alert('Votre objectif est bien : ' + goalInput);
        setTimeout(() => {
          try {
            const textObj = JSON.parse(jsonArr[0].text);
            const qList = textObj.questions.map((q: any) => q.question);
            setQuestions(qList);
            setCurrentQuestion(0);
            setAnswers([]);
            setInputValue('');
            setStep('questions');
            Animated.timing(questionsAnim, {
              toValue: 1,
              duration: 350,
              useNativeDriver: true,
            }).start();
          } catch (err) {
            alert("Erreur lors de la lecture des questions.");
          }
        }, 1000);
      });
    } catch (e) {
      setLoading(false);
      rotateAnim.stopAnimation();
      rotateAnim.setValue(0);
      alert("Erreur lors de l'envoi de l'objectif.");
    }
  };

  const cancelSend = () => {
    setShowConfirmModal(false);
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = inputValue;
    setAnswers(newAnswers);
    setInputValue('');
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      alert('Merci, toutes les réponses ont été envoyées !');
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
            Tu n’as pas encore de quête…
          </Text>
          <Text style={{ color: '#71ABA4', fontSize: 17, textAlign: 'center', marginBottom: 28 }}>
            Et si tu en lançais une aujourd’hui ?
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
            <Text style={{ fontSize: 18, color: '#fff', fontWeight: 'bold' }}>Lancer une nouvelle quête</Text>
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
              Quel est ton objectif ?
            </Text>
            <TextInput
              value={goalInput}
              onChangeText={setGoalInput}
              placeholder="Décris ton objectif..."
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
              <Text style={{ fontSize: 18, color: '#fff', fontWeight: 'bold', marginRight: 8 }}>Envoyer</Text>
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
          {/* Modal de confirmation custom */}
          <Modal
            visible={showConfirmModal}
            transparent
            animationType="fade"
            onRequestClose={cancelSend}
          >
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.25)', justifyContent: 'center', alignItems: 'center' }}>
              <View style={{ backgroundColor: '#fff', borderRadius: 24, padding: 28, width: '80%', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 }}>
                <Text style={{ color: '#3A5A6A', fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 18 }}>
                  Confirmez-vous que votre objectif est :
                </Text>
                <Text style={{ color: '#71ABA4', fontSize: 18, textAlign: 'center', marginBottom: 28 }}>
                  {goalInput}
                </Text>
                <View style={{ flexDirection: 'row', width: '100%', justifyContent: 'space-between' }}>
                  <TouchableOpacity
                    style={{ backgroundColor: '#5F9E8A', borderRadius: 999, paddingVertical: 12, paddingHorizontal: 28 }}
                    onPress={confirmSend}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Confirmer</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ backgroundColor: '#FD8B5A', borderRadius: 999, paddingVertical: 12, paddingHorizontal: 28 }}
                    onPress={cancelSend}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Annuler</Text>
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
          {/* Barre de progression */}
          <View style={{ width: '100%', height: 6, backgroundColor: '#E6E6E6', borderRadius: 3, marginBottom: 24, overflow: 'hidden' }}>
            <Animated.View
              style={{
                height: 6,
                backgroundColor: '#71ABA4',
                width: `${((currentQuestion + 1) / questions.length) * 100}%`,
                borderRadius: 3,
              }}
            />
          </View>
          <Text style={{ color: '#71ABA4', fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 18 }}>
            {`Question N°${currentQuestion + 1} :`}
          </Text>
          <Text style={{ color: '#3A5A6A', fontSize: 18, textAlign: 'center', marginBottom: 18 }}>
            {questions[currentQuestion]}
          </Text>
          <TextInput
            value={inputValue}
            onChangeText={setInputValue}
            placeholder="Ta réponse..."
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
            numberOfLines={2}
            textAlignVertical="top"
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
            <Text style={{ fontSize: 18, color: '#fff', fontWeight: 'bold' }}>{currentQuestion === questions.length - 1 ? 'Terminer' : 'Next'}</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
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
  scrollContent: {
    height: CURVE_HEIGHT + height,
  },
  curveContainer: {
    width: CURVE_WIDTH,
    height: CURVE_HEIGHT,
    position: 'absolute',
  },
  levelCircle: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    borderRadius: 100,
    overflow: 'visible',
  },
  plusCircle: {
    marginTop: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: ORANGE,
    shadowColor: ORANGE,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  taskListPlaceholder: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    alignItems: 'center',
    marginTop: 8,
  },
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: ORANGE,
    height: 64,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 24,
  },
  navIcon: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconImage: {
    width: 36,
    height: 36,
    tintColor: undefined,
  },
  iconText: {
    fontSize: 32,
    color: '#fff',
    opacity: 0.9,
  },
});