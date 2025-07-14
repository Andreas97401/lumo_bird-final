import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Image, StyleSheet, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');
const NAVBAR_WIDTH = width; // Augmenté de 0.92 à 0.95
const NAVBAR_HEIGHT = 85; // Augmenté de 70 à 85
const ICON_COUNT = 3;
const ICON_SIZE = 36; // Taille des icônes inchangée
const BUBBLE_SIZE = 56;
const NAV_BG = '#FD8B5A'; // Orange
const BUBBLE_COLOR = '#FD8B5A'; // Orange for bubble
const SHADOW_COLOR = '#000';

const ICONS = [
  require('../assets/images/Chart_Line.png'),
  require('../assets/images/head.png'), // Changé pour head.png
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
  // Animation values - using simple timing
  const bubbleTranslateXAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const [internalSelectedIndex, setInternalSelectedIndex] = useState(selectedIndex);
  const [isInitialized, setIsInitialized] = useState(false);

  // Calculate positions
  const iconSpacing = NAVBAR_WIDTH / ICON_COUNT;
  const bubbleLeft = iconSpacing / 2 + internalSelectedIndex * iconSpacing - BUBBLE_SIZE / 2;

  const bubbleTop = NAVBAR_HEIGHT / 2 - BUBBLE_SIZE / 4;

  // Mémoriser les styles des icônes pour éviter les re-calculs
  const iconStyles = useMemo(() => {
    return ICONS.map((_, idx) => [
      styles.iconImage,
      idx === 1 && { tintColor: '#fff' } // Icône du milieu (head.png) en blanc
    ]);
  }, []);

  // Initialize position on mount
  useEffect(() => {
    if (!isInitialized) {
      bubbleTranslateXAnim.setValue(bubbleLeft);
      setIsInitialized(true);
    }
  }, []);

  // Handle internal state changes - immediate response
  const handleInternalSelect = (idx: number) => {
    // Update internal state immediately for instant visual feedback
    setInternalSelectedIndex(idx);
    
    // Call the external handler (page navigation) immediately
    onSelect(idx);
    Haptics.selectionAsync(); // Haptic feedback à chaque changement
  };

  // Simple animation without complex calculations - only if initialized
  useEffect(() => {
    if (isInitialized) {
      // Stop any existing float animation
      floatAnim.stopAnimation();
      floatAnim.setValue(0);
      
      // Animation de la bulle
      Animated.timing(bubbleTranslateXAnim, {
        toValue: bubbleLeft,
        duration: 600,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.2)),
      }).start(() => {
        // Effet de float 1 seconde après l'arrêt
        setTimeout(() => {
          Animated.loop(
            Animated.sequence([
              Animated.timing(floatAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
                easing: Easing.inOut(Easing.sin),
              }),
              Animated.timing(floatAnim, {
                toValue: 0,
                duration: 1000,
                useNativeDriver: true,
                easing: Easing.inOut(Easing.sin),
              }),
            ])
          ).start();
        }, 1000);
      });
    }
  }, [internalSelectedIndex, isInitialized]);

  // Sync with external selectedIndex only on initial load
  useEffect(() => {
    if (!isInitialized) {
      setInternalSelectedIndex(selectedIndex);
    }
  }, [selectedIndex, isInitialized]);

  // Mémoriser les icônes pour éviter les re-renders
  const memoizedIcons = useMemo(() => ICONS, []);

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.shadow} />
      {/* Background simple sans cutout */}
      <View style={[styles.simpleBg, { backgroundColor: NAV_BG }]} />
      <Animated.View
        style={[
          styles.bubble,
          {
            left: 0, // Position statique
            top: bubbleTop,
            shadowOpacity: 0.25, // Ombre plus visible
            shadowRadius: 15, // Ombre plus large
            shadowOffset: { width: 0, height: 4 }, // Ombre vers le bas
            elevation: 12, // Ombre Android plus prononcée
            zIndex: 2,
            backgroundColor: BUBBLE_COLOR,
            transform: [
              { translateX: bubbleTranslateXAnim },
              { translateY: floatAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -3], // Léger mouvement vers le haut
              })}
            ],
          },
        ]}
      >
        <View style={[styles.bubbleInner, { 
          backgroundColor: BUBBLE_COLOR,
          shadowColor: SHADOW_COLOR,
          shadowOpacity: 0.15, // Ombre interne
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: 4,
        }]}> 
          <Image
            source={memoizedIcons[internalSelectedIndex]}
            style={[styles.bubbleIcon, { tintColor: '#041836' }]} // Icône dans la bulle en #041836
            resizeMode="contain"
          />
        </View>
      </Animated.View>
      <View style={styles.iconRow}>
        {memoizedIcons.map((icon, idx) => {
          if (idx === internalSelectedIndex) return <View key={idx} style={styles.iconBtn} />; // Empty space for bubble
          return (
            <TouchableOpacity
              key={idx}
              style={styles.iconBtn}
              activeOpacity={0.7}
              onPress={() => handleInternalSelect(idx)}
            >
              <Image
                source={icon}
                style={iconStyles[idx]}
                resizeMode="contain"
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0, // Descendu de 24 à 12
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
  simpleBg: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: NAVBAR_HEIGHT,
    borderTopLeftRadius: NAVBAR_HEIGHT / 2,
    borderTopRightRadius: NAVBAR_HEIGHT / 2,
    zIndex: 1,
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
});