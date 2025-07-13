import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Dimensions, ImageBackground, Modal, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import BottomNavBar from '../components/BottomNavBar';

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
  const [selectedTab, setSelectedTab] = useState(1); // Changed to 1 (center) for HomeScreen
  const [hasGoal, setHasGoal] = useState(false); // New state for goal presence
  const [modalVisible, setModalVisible] = useState(false); // Modal state
  const [goalInput, setGoalInput] = useState(''); // Goal input state
  const [confirmVisible, setConfirmVisible] = useState(false); // Confirmation modal
  const [waitingQuestions, setWaitingQuestions] = useState(false); // Waiting for questions
  const [loading, setLoading] = useState(false); // Loading state for webhook
  // Questions modal state
  const [questionsModalVisible, setQuestionsModalVisible] = useState(false);
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  // Add a state to store the last submitted goal
  const [lastGoal, setLastGoal] = useState('');
  const router = useRouter();

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
    // Consistent navigation logic
    if (idx === 0) {
      router.push('/StatsPage');
    } else if (idx === 1) {
      // Already on HomeScreen, no navigation needed
      return;
    } else if (idx === 2) {
      router.push('/CommunityPage');
    }
  };

  const handleGoalSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://n8n.srv777212.hstgr.cloud/webhook/Question_Creation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: goalInput }),
      });
      console.log('Webhook response status:', response.status);
      const raw = await response.text();
      console.log('Webhook raw response:', raw);
      let data;
      try {
        data = JSON.parse(raw);
      } catch (e) {
        console.log('Failed to parse JSON:', e);
        throw e;
      }
      console.log('Parsed webhook data:', data);
      // Parse the questions from the webhook response
      const parsed = JSON.parse(data[0].text);
      console.log('Parsed questions:', parsed);
      setQuestions((parsed.questions as any[]).map((q: any) => q.question));
      setAnswers(Array((parsed.questions as any[]).length).fill(''));
      setCurrentQuestion(0);
      setQuestionsModalVisible(true);
      setHasGoal(true);
      setWaitingQuestions(false);
      setGoalInput('');
      setLastGoal(goalInput); // Save the goal for later submission
    } catch (e) {
      Alert.alert('Erreur', "Impossible d'envoyer l'objectif. Veuillez réessayer.");
    } finally {
      setLoading(false);
      setConfirmVisible(false);
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Quel est ton objectif ?</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Décris ton objectif..."
              value={goalInput}
              onChangeText={setGoalInput}
              autoFocus
            />
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setConfirmVisible(true)}
              disabled={!goalInput.trim()}
            >
              <Text style={styles.modalButtonText}>Valider</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Confirmation Modal */}
      <Modal
        visible={confirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmVisible(false)}
      >
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
      {/* Questions Modal */}
      <Modal
        visible={questionsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setQuestionsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              Question {currentQuestion + 1} / {questions.length}
            </Text>
            <Text style={styles.questionText}>{questions[currentQuestion]}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Votre réponse..."
              value={answers[currentQuestion]}
              onChangeText={text => {
                const newAnswers = [...answers];
                newAnswers[currentQuestion] = text;
                setAnswers(newAnswers);
              }}
            />
            <View style={{ flexDirection: 'row', marginTop: 16 }}>
              <TouchableOpacity
                style={[styles.modalButton, { opacity: currentQuestion === 0 ? 0.5 : 1 }]}
                disabled={currentQuestion === 0}
                onPress={() => setCurrentQuestion(currentQuestion - 1)}
              >
                <Text style={styles.modalButtonText}>Précédent</Text>
              </TouchableOpacity>
              <View style={{ width: 16 }} />
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  if (currentQuestion < questions.length - 1) {
                    setCurrentQuestion(currentQuestion + 1);
                  } else {
                    setQuestionsModalVisible(false);
                    // Send answers and goal to Level_Creation webhook
                    fetch('https://n8n.srv777212.hstgr.cloud/webhook-test/Level_Creation', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        goal: lastGoal,
                        responses: Object.fromEntries(questions.map((q, i) => [q, answers[i]])),
                      }),
                    })
                      .then(res => res.text())
                      .then(resText => {
                        console.log('Level_Creation webhook response:', resText);
                      })
                      .catch(err => {
                        console.log('Level_Creation webhook error:', err);
                      });
                  }
                }}
              >
                <Text style={styles.modalButtonText}>
                  {currentQuestion < questions.length - 1 ? 'Suivant' : 'Terminer'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <ImageBackground
        source={require('../assets/images/Untitled.png')}
        style={styles.container}
        resizeMode="cover"
      >
        <View style={styles.content}>
          {!hasGoal ? (
            <View style={styles.noGoalCard}>
              <Text style={styles.noGoalText}>Pas d&apos;objectif en cours</Text>
              <TouchableOpacity style={styles.plusButton} onPress={() => setModalVisible(true)}>
                <Text style={styles.plusButtonText}>+</Text>
              </TouchableOpacity>
              <Text style={styles.createGoalText}>Créer un objectif</Text>
            </View>
          ) : waitingQuestions ? (
            <View style={styles.noGoalCard}>
              <Text style={styles.noGoalText}>Merci ! Veuillez patienter pendant que des questions complémentaires sont générées...</Text>
              <ActivityIndicator size="large" color={ORANGE} style={{ marginTop: 16 }} />
            </View>
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
  noGoalCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 20,
    borderRadius: 10,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  noGoalText: {
    fontSize: 20,
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
  },
  plusButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: ORANGE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  plusButtonText: {
    fontSize: 36,
    color: '#fff',
    fontWeight: 'bold',
  },
  createGoalText: {
    fontSize: 18,
    color: ORANGE,
    textDecorationLine: 'underline',
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
});