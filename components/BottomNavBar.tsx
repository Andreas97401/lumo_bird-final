import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, Image, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const { width } = Dimensions.get('window');
const NAVBAR_WIDTH = width * 0.92;
const NAVBAR_HEIGHT = 70;
const ICON_COUNT = 3;
const ICON_SIZE = 36;
const BUBBLE_SIZE = 56;
const NAV_BG = '#FD8B5A'; // Orange
const BUBBLE_COLOR = '#FD8B5A'; // Orange for bubble
const SHADOW_COLOR = '#000';

const ICONS = [
  require('../assets/images/Chart_Line.png'),
  require('../assets/images/Calque_2.png'),
  require('../assets/images/Users_Group.png'),
];

function getCutoutPath(bubbleCenterX: number, r: number) {
  const y = 0; // top of navbar
  const left = 0;
  const right = NAVBAR_WIDTH;
  const cornerRadius = 16; // Navbar corner radius
  
  // Smooth cutout that gently curves around the bubble
  const cutoutWidth = r * 1.8; // Width of the cutout area
  const cutoutDepth = r * 0.4; // How deep the curve goes (much gentler)
  const cutoutLeft = bubbleCenterX - cutoutWidth;
  const cutoutRight = bubbleCenterX + cutoutWidth;
  
  // Control points for very gentle curves
  const cp1X = bubbleCenterX - cutoutWidth * 0.5;
  const cp1Y = y + cutoutDepth * 0.3;
  const cp2X = bubbleCenterX + cutoutWidth * 0.5;
  const cp2Y = y + cutoutDepth * 0.3;
  
  return `M${left + cornerRadius},${y}
    L${Math.max(left + cornerRadius, cutoutLeft)},${y}
    Q${cp1X},${cp1Y} ${bubbleCenterX},${y + cutoutDepth}
    Q${cp2X},${cp2Y} ${Math.min(right - cornerRadius, cutoutRight)},${y}
    L${right - cornerRadius},${y}
    Q${right},${y} ${right},${y + cornerRadius}
    L${right},${NAVBAR_HEIGHT - cornerRadius}
    Q${right},${NAVBAR_HEIGHT} ${right - cornerRadius},${NAVBAR_HEIGHT}
    L${left + cornerRadius},${NAVBAR_HEIGHT}
    Q${left},${NAVBAR_HEIGHT} ${left},${NAVBAR_HEIGHT - cornerRadius}
    L${left},${y + cornerRadius}
    Q${left},${y} ${left + cornerRadius},${y}
    Z`;
}

export default function BottomNavBar({ selectedIndex, onSelect }: {
  selectedIndex: number;
  onSelect: (idx: number) => void;
}) {
  const anim = useRef(new Animated.Value(selectedIndex)).current;
  const [cutoutCenter, setCutoutCenter] = React.useState(() => {
    // Initialize with correct position based on selectedIndex
    const iconSpacing = NAVBAR_WIDTH / ICON_COUNT;
    return iconSpacing / 2 + selectedIndex * iconSpacing;
  });

  const [questionsModalVisible, setQuestionsModalVisible] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  useEffect(() => {
    Animated.spring(anim, {
      toValue: selectedIndex,
      useNativeDriver: false,
      stiffness: 200,
      damping: 18,
      mass: 0.8,
    }).start();
  }, [selectedIndex]);

  // Calculate bubble position
  const iconSpacing = NAVBAR_WIDTH / ICON_COUNT;
  const bubbleLeft = anim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [
      iconSpacing / 2 - BUBBLE_SIZE / 2,
      iconSpacing + iconSpacing / 2 - BUBBLE_SIZE / 2,
      iconSpacing * 2 + iconSpacing / 2 - BUBBLE_SIZE / 2
    ],
    extrapolate: 'clamp',
  });

  // This is the key fix - we need this animated value for the cutout
  const bubbleCenterX = anim.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [
      iconSpacing / 2,
      iconSpacing + iconSpacing / 2,
      iconSpacing * 2 + iconSpacing / 2
    ],
    extrapolate: 'clamp',
  });

  // THE FIX: Use useEffect to listen to bubbleCenterX changes
  useEffect(() => {
    const listenerId = bubbleCenterX.addListener(({ value }) => {
      setCutoutCenter(value);
    });

    return () => {
      bubbleCenterX.removeListener(listenerId);
    };
  }, [bubbleCenterX]);

  const r = BUBBLE_SIZE / 2 + 4; // radius of semicircle cutout, slightly larger than bubble

  // Bubble should be half embedded in the navbar
  const bubbleTop = NAVBAR_HEIGHT / 2 - BUBBLE_SIZE / 4;

  const handleGoalSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://n8n.srv777212.hstgr.cloud/webhook-test/Question_Creation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: goalInput }),
      });
      const data = await response.json();
      // Parse the questions from the webhook response
      const parsed = JSON.parse(data[0].text);
      setQuestions(parsed.questions.map(q => q.question));
      setAnswers(Array(parsed.questions.length).fill(''));
      setCurrentQuestion(0);
      setQuestionsModalVisible(true);
      setHasGoal(true);
      setWaitingQuestions(false);
      setGoalInput('');
    } catch (e) {
      Alert.alert('Erreur', "Impossible d'envoyer l'objectif. Veuillez réessayer.");
    } finally {
      setLoading(false);
      setConfirmVisible(false);
    }
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.shadow} />
      <Svg
        width={NAVBAR_WIDTH}
        height={NAVBAR_HEIGHT}
        style={styles.svgBg}
      >
        <Path d={getCutoutPath(cutoutCenter, r)} fill={NAV_BG} />
      </Svg>
      <Animated.View
        style={[
          styles.bubble,
          {
            left: bubbleLeft,
            top: bubbleTop,
            shadowOpacity: 0.18,
            shadowRadius: 12,
            elevation: 8,
            zIndex: 2,
            transform: [
              { scale: anim.interpolate({
                  inputRange: [0, 1, 2],
                  outputRange: [
                    selectedIndex === 0 ? 1.1 : 0.95,
                    selectedIndex === 1 ? 1.1 : 0.95,
                    selectedIndex === 2 ? 1.1 : 0.95
                  ],
                  extrapolate: 'clamp',
                }) },
            ],
            backgroundColor: BUBBLE_COLOR,
          },
        ]}
      >
        <View style={[styles.bubbleInner, { backgroundColor: BUBBLE_COLOR }]}> 
          <Image
            source={ICONS[selectedIndex]}
            style={styles.bubbleIcon}
            resizeMode="contain"
          />
        </View>
      </Animated.View>
      <View style={styles.iconRow}>
        {ICONS.map((icon, idx) => {
          if (idx === selectedIndex) return <View key={idx} style={styles.iconBtn} />; // Empty space for bubble
          return (
            <TouchableOpacity
              key={idx}
              style={styles.iconBtn}
              activeOpacity={0.7}
              onPress={() => onSelect(idx)}
            >
              <Image
                source={icon}
                style={styles.iconImage}
                resizeMode="contain"
              />
            </TouchableOpacity>
          );
        })}
      </View>

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
                    // You can handle answers submission here
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    left: (width - NAVBAR_WIDTH) / 2,
    width: NAVBAR_WIDTH,
    height: NAVBAR_HEIGHT + BUBBLE_SIZE / 2 + 16,
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 10,
  },
  shadow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 6,
    height: 24,
    borderRadius: NAVBAR_HEIGHT / 2,
    backgroundColor: SHADOW_COLOR,
    opacity: 0.08,
    zIndex: 0,
  },
  svgBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  bubble: {
    position: 'absolute',
    width: BUBBLE_SIZE,
    height: BUBBLE_SIZE,
    borderRadius: BUBBLE_SIZE / 2,
    backgroundColor: BUBBLE_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: SHADOW_COLOR,
    borderWidth: 2,
    borderColor: '#E6E6E6',
  },
  bubbleInner: {
    width: BUBBLE_SIZE - 10,
    height: BUBBLE_SIZE - 10,
    borderRadius: (BUBBLE_SIZE - 10) / 2,
    backgroundColor: BUBBLE_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: SHADOW_COLOR,
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  bubbleIcon: {
    width: 36,
    height: 36,
    opacity: 1,
  },
  iconRow: {
    flexDirection: 'row',
    width: NAVBAR_WIDTH,
    height: NAVBAR_HEIGHT,
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 3,
  },
  iconBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: NAVBAR_HEIGHT,
  },
  iconImage: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    opacity: 0.85,
  },
  noGoalCard: {
    margin: 32,
    padding: 32,
    backgroundColor: '#fff',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  noGoalText: {
    fontSize: 20,
    color: '#3A5A6A',
    fontWeight: 'bold',
    marginBottom: 16,
  },
  plusButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FD8B5A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    elevation: 2,
  },
  plusButtonText: {
    fontSize: 36,
    color: '#fff',
    fontWeight: 'bold',
  },
  createGoalText: {
    fontSize: 16,
    color: '#FD8B5A',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3A5A6A',
    marginBottom: 16,
  },
  questionText: {
    fontSize: 18,
    color: '#3A5A6A',
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  modalInput: {
    width: '100%',
    height: 50,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    fontSize: 16,
    color: '#3A5A6A',
  },
  modalButton: {
    width: '45%',
    height: 50,
    borderRadius: 12,
    backgroundColor: '#FD8B5A',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});