import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, Text, TouchableOpacity, View, SafeAreaView } from 'react-native';

const { width, height } = Dimensions.get('window');
const NAME_WIDTH = 300;
const LOGO_SIZE = 80;

export default function HomeScreen() {
  const slideAnim = useRef(new Animated.ValueXY({ x: -120, y: 120 })).current;
  const birdX = useRef(new Animated.Value(-140)).current;
  const nameX = useRef(new Animated.Value(-300)).current;
  const logoY = useRef(new Animated.Value(-LOGO_SIZE)).current;
  const [showRow, setShowRow] = React.useState(false);
  const [showLogo, setShowLogo] = React.useState(false);
  const [showChat, setShowChat] = React.useState(false);
  const chatX = useRef(new Animated.Value(-60)).current;
  const buttonFade = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => {
      Animated.timing(slideAnim, {
        toValue: { x: -70, y: 50 },
        duration: 500,
        useNativeDriver: true,
        easing: Easing.out(Easing.exp),
      }).start(() => {
        setTimeout(() => {
          Animated.timing(slideAnim, {
            toValue: { x: -120, y: 120 },
            duration: 500,
            useNativeDriver: true,
            easing: Easing.in(Easing.exp),
          }).start(() => {
            Animated.timing(slideAnim, {
              toValue: { x: width, y: -height },
              duration: 1200,
              useNativeDriver: true,
              easing: Easing.inOut(Easing.exp),
            }).start(() => {
              setShowRow(true);
              Animated.parallel([
                Animated.timing(birdX, {
                  toValue: width + 200,
                  duration: 1000,
                  useNativeDriver: true,
                  easing: Easing.inOut(Easing.exp),
                }),
                Animated.timing(nameX, {
                  toValue: (width - NAME_WIDTH) / 2 - 20,
                  duration: 1000,
                  useNativeDriver: true,
                  easing: Easing.inOut(Easing.exp),
                }),
              ]).start(() => {
                setShowLogo(true);
                Animated.spring(logoY, {
                  toValue: height / 2.4 - LOGO_SIZE / 2, // Position finale plus haute
                  useNativeDriver: true,
                  friction: 5,
                  tension: 80,
                  // L'effet "bounce" est géré par spring
                }).start(() => {
                  setShowChat(true);
                  Animated.timing(buttonFade, {
                    toValue: 1,
                    duration: 700,
                    useNativeDriver: true,
                  }).start();
                  Animated.loop(
                    Animated.timing(chatX, {
                      toValue: width + 60,
                      duration: 2500,
                      useNativeDriver: true,
                      easing: Easing.linear,
                    })
                  ).start();
                });
              });
            });
          });
        }, 300);
      });
    }, 100);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#041836' }}>
      <View style={styles.container}>
        {/* Animation initiale de l'oiseau */}
        {!showRow && (
          <Animated.Image
            source={require('../assets/images/bird.png')}
            style={[
              styles.bird,
              {
                transform: [
                  { translateX: slideAnim.x },
                  { translateY: slideAnim.y },
                  { rotate: '-20deg' },
                ],
              },
            ]}
            resizeMode="contain"
          />
        )}
        {/* Animation de traversée bird + name */}
        {showRow && (
          <View style={styles.rowContainer}>
            <Animated.Image
              source={require('../assets/images/bird.png')}
              style={[
                styles.birdRow,
                { transform: [{ translateX: birdX }] },
              ]}
              resizeMode="contain"
            />
            <Animated.Image
              source={require('../assets/images/name.png')}
              style={[
                styles.nameRow,
                { transform: [{ translateX: nameX }] },
              ]}
              resizeMode="contain"
            />
          </View>
        )}
        {/* Animation du logo qui descend du haut */}
        {showLogo && (
          <Animated.Image
            source={require('../assets/images/logo.png')}
            style={[
              styles.logo,
              { transform: [{ translateY: logoY }] },
            ]}
            resizeMode="contain"
          />
        )}
        {/* Animation du chat qui traverse le bas de l'écran */}
        {showChat && (
          <>
            <Animated.Image
              source={require('../assets/images/chat.png')}
              style={[
                styles.chat,
                { tintColor: '#fff', transform: [{ translateX: chatX }] },
              ]}
              resizeMode="contain"
            />
            {/* Boutons connexion/inscription avec fade-in */}
            <Animated.View style={[styles.buttonContainer, { opacity: buttonFade }]}>
              <TouchableOpacity style={[styles.button, styles.loginButton]} onPress={() => router.push('/LoginScreen')}>
                <Text style={styles.buttonText}>Se connecter</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.signupButton]}>
                <Text style={styles.buttonText}>S'inscrire</Text>
              </TouchableOpacity>
            </Animated.View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

export const options = {
  headerShown: false,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#041836',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
  },
  bird: {
    width: 140,
    height: 140,
    tintColor: '#fff',
    position: 'absolute',
    left: 0,
    bottom: 0,
  },
  rowContainer: {
    position: 'absolute',
    top: height / 2 - 200,
    left: 0,
    width: width,
    height: 160,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  birdRow: {
    width: 140,
    height: 140,
    tintColor: '#fff',
    position: 'absolute',
    left: 0,
  },
  nameRow: {
    width: NAME_WIDTH,
    height: 150,
    marginLeft: 20,
    tintColor: '#fff',
    position: 'absolute',
    left: 0,
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    position: 'absolute',
    left: (width - LOGO_SIZE) / 2,
    top: -120,
  },
  chat: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    width: 40,
    height: 40,
    opacity: 0.85,
  },
  buttonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 250,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: 200,
    paddingVertical: 14,
    borderRadius: 28,
    marginVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  loginButton: {
    backgroundColor: '#FD8B5A',
  },
  signupButton: {
    backgroundColor: '#71ABA4',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
}); 