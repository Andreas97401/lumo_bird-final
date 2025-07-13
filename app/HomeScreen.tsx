import React, { useRef, useState } from 'react';
import { Animated, Dimensions, ImageBackground, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
  const [selectedTab, setSelectedTab] = useState(2); // Default to center

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

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ImageBackground
        source={require('../assets/images/Untitled.png')}
        style={styles.container}
        resizeMode="cover"
      >
        <View style={styles.content}>
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
        </View>
        <BottomNavBar selectedIndex={selectedTab} onSelect={setSelectedTab} />
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
});