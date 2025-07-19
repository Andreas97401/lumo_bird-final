import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AccessibilityInfo, Animated, Dimensions, Easing, Image, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import PagerView from 'react-native-pager-view';
import { Text } from '../components/Text';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const [page, setPage] = useState(0);
  const [userName, setUserName] = useState<string | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const router = useRouter();
  const pagerRef = useRef(null);
  const anims = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
  const bgAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const { t } = useTranslation();

  // Remplace les SLIDES par des textes statiques en français
  const SLIDES = [
    {
      key: 'community',
      image: require('../assets/images/Community.png'),
      title: 'Découvre la communauté',
      subtitle: 'Partage tes progrès, motive tes amis et avance ensemble !',
      animation: 'fadeInRight',
      button: 'Suivant',
      bg: ['#0A1B2B', '#7BA9A3'],
    },
    {
      key: 'analytics',
      image: require('../assets/images/Analytics.png'),
      title: 'Analyse tes stats',
      subtitle: 'Suis ta progression, débloque des badges et bats tes records !',
      animation: 'fadeInUp',
      button: 'Suivant',
      bg: ['#7BA9A3', '#F48B6C'],
    },
    {
      key: 'goals',
      image: require('../assets/images/Goals.png'),
      title: userName ? `Bienvenue ${userName} !` : 'Bienvenue !',
      subtitle: 'Fixe-toi un objectif et commence ton aventure Lumo Bird.',
      animation: 'zoomIn',
      button: 'Créer mon objectif',
      bg: ['#F48B6C', '#0A1B2B'],
    },
  ];

  // Préchargement des images
  useEffect(() => {
    const loadImages = async () => {
      const promises = SLIDES.map(slide => Image.prefetch(Image.resolveAssetSource(slide.image).uri));
      await Promise.all(promises);
      setImagesLoaded(true);
    };
    loadImages();
  }, []);

  // Accessibilité : réduire les animations si besoin
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  // Récupérer le prénom utilisateur si dispo
  useEffect(() => {
    const fetchName = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;
        console.log('USER:', user);
        console.log('USER METADATA:', user?.user_metadata);
        if (user && user.user_metadata && user.user_metadata.first_name) {
          setUserName(user.user_metadata.first_name);
          console.log('Prénom trouvé dans user_metadata.first_name:', user.user_metadata.first_name);
        } else if (user && user.id) {
          // Chercher dans la table user_profiles
          const { data: profil, error } = await supabase
            .from('user_profiles')
            .select('prenom')
            .eq('id', user.id)
            .single();
          if (profil && profil.prenom) {
            setUserName(profil.prenom);
            console.log('Prénom trouvé dans user_profiles:', profil.prenom);
          } else {
            // fallback local storage
            const name = await AsyncStorage.getItem('userFirstName');
            if (name) {
              setUserName(name);
              console.log('Prénom trouvé dans AsyncStorage:', name);
            } else {
              console.log('Aucun prénom trouvé');
            }
          }
        } else {
          // fallback local storage
          const name = await AsyncStorage.getItem('userFirstName');
          if (name) {
            setUserName(name);
            console.log('Prénom trouvé dans AsyncStorage:', name);
          } else {
            console.log('Aucun prénom trouvé');
          }
        }
      } catch (e) { console.log('Erreur fetchName', e); }
    };
    fetchName();
  }, []);

  // Animation à l'arrivée sur chaque slide
  useEffect(() => {
    anims.forEach((a, i) => a.setValue(i === page ? 0 : 1));
    let animConf;
    if (SLIDES[page].animation === 'fadeInRight' || SLIDES[page].animation === 'fadeInUp' || SLIDES[page].animation === 'zoomIn') {
      animConf = Animated.timing(anims[page], { toValue: 1, duration: 600, useNativeDriver: true, easing: Easing.out(Easing.exp) });
    }
    if (!reduceMotion) animConf && animConf.start();
    // Animation du fond
    Animated.timing(bgAnim, { toValue: page, duration: 500, useNativeDriver: false }).start();
  }, [page, reduceMotion]);

  // Animation flottante (float) pour les images d'icônes
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Gestion bouton press animé + haptique
  const handleButtonPressIn = () => {
    Animated.spring(buttonScale, { toValue: 0.95, useNativeDriver: true }).start();
    Haptics.selectionAsync();
  };
  const handleButtonPressOut = () => {
    Animated.spring(buttonScale, { toValue: 1, useNativeDriver: true }).start();
  };

  // Navigation
  const goToNext = () => {
    if (page < 2 && pagerRef.current) {
      // @ts-ignore
      pagerRef.current.setPage(page + 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };
  const goToPrev = () => {
    if (page > 0 && pagerRef.current) {
      // @ts-ignore
      pagerRef.current.setPage(page - 1);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };
  const goToPage = (i: number) => {
    if (pagerRef.current) {
      // @ts-ignore
      pagerRef.current.setPage(i);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleFinish = async () => {
    await AsyncStorage.setItem('onboardingDone', 'true');
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;
      if (user && user.id) {
        // Mettre à jour la colonne first_connection à FALSE dans user_profiles
        const { error } = await supabase
          .from('user_profiles')
          .update({ first_connection: false })
          .eq('id', user.id);
        if (error) {
          console.log('Erreur update first_connection:', error);
        }
        await supabase.auth.updateUser({ data: { onboarding_done: true } });
      }
    } catch (e) { console.log('Erreur handleFinish onboarding:', e); }
    router.push('/HomeScreen');
  };

  // Couleur de fond unique
  const bgColor = '#0A1B2B';

  // Barre de progression
  const progress = bgAnim.interpolate({
    inputRange: [0, 2],
    outputRange: ['0%', '100%'],
  });

  // Animation flottante pour les images d'icônes
  const floatTranslate = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 10],
  });

  // Position animée du chat sur la barre de progression
  const progressBarMargin = 40;
  const progressBarWidth = width - 2 * progressBarMargin;
  const birdTranslateX = bgAnim.interpolate({
    inputRange: [0, 2],
    outputRange: [-30, progressBarWidth - 30], // Pour que le centre de l'oiseau arrive à la fin de la barre
    extrapolate: 'clamp',
  });

  if (!imagesLoaded) {
    return (
      <View style={[styles.root, { backgroundColor: '#0A1B2B', justifyContent: 'center', alignItems: 'center' }]}> 
        <Text style={{ color: '#fff', fontSize: 18 }}>{t('onboarding.loading')}</Text>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.root, { backgroundColor: bgColor }]}
      accessibilityLabel={t('onboarding.screen_label')}
      accessibilityRole="summary"
    >
      {/* Barre de progression */}
      <View style={[styles.progressBarContainer, { width: progressBarWidth, alignSelf: 'center', marginHorizontal: progressBarMargin }]}> 
        <Animated.View style={[styles.progressBar, { width: progress }]} />
        {/* Oiseau qui suit la progression */}
        <Animated.Image
          source={require('../assets/images/bird.png')} // Assuming BIRD is no longer needed here
          style={[
            styles.chatIcon,
            { transform: [{ translateX: birdTranslateX }], tintColor: '#fff' },
          ]}
          resizeMode="contain"
          accessibilityLabel="Oiseau qui suit la progression"
          accessible={true}
        />
      </View>
      {/* PagerView */}
      <PagerView
        style={styles.pager}
        initialPage={0}
        ref={pagerRef}
        onPageSelected={(e: { nativeEvent: { position: number } }) => setPage(e.nativeEvent.position)}
        accessible={true}
        accessibilityLabel={t('onboarding.pager_label')}
      >
        {SLIDES.map((slide, idx) => {
          const showName = idx === 2 && userName;
          return (
            <View style={styles.slide} key={slide.key}>
              <View style={styles.animatedContainer}>
                <Animated.Image
                  source={slide.image}
                  style={[
                    styles.image,
                    {
                      transform: [
                        { translateY: floatTranslate },
                      ],
                    },
                  ]}
                  resizeMode="contain"
                  accessibilityLabel={slide.title}
                  accessible={true}
                />
                <Text style={styles.title} accessibilityRole="header">
                  {idx === 2
                    ? 'Bienvenue !'
                    : slide.title}
                </Text>
                <Text style={styles.subtitle} accessibilityRole="text">
                  {slide.subtitle}
                  {showName && (
                    <Text style={{ color: '#fff', fontWeight: 'bold' }}> {userName} !</Text>
                  )}
                </Text>
                <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                  {idx < 2 ? (
                    <TouchableOpacity
                      style={styles.button}
                      activeOpacity={0.8}
                      onPress={goToNext}
                      onPressIn={handleButtonPressIn}
                      onPressOut={handleButtonPressOut}
                      accessibilityLabel={`Bouton ${slide.button}`}
                      accessibilityRole="button"
                    >
                      <Text style={styles.buttonText}>{slide.button}</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.button}
                      activeOpacity={0.8}
                      onPress={handleFinish}
                      onPressIn={handleButtonPressIn}
                      onPressOut={handleButtonPressOut}
                      accessibilityLabel="Bouton terminer l'onboarding"
                      accessibilityRole="button"
                    >
                      <Text style={styles.buttonText}>{slide.button}</Text>
                    </TouchableOpacity>
                  )}
                </Animated.View>
              </View>
            </View>
          );
        })}
      </PagerView>
      {/* Pagination cliquable */}
      <View style={styles.pagination} accessible={true} accessibilityRole="tablist">
        {[0, 1, 2].map(i => (
          <TouchableOpacity
            key={i}
            style={[styles.dot, page === i ? styles.dotActive : styles.dotInactive]}
            onPress={() => goToPage(i)}
            accessibilityLabel={`Aller à la page ${i + 1}`}
            accessibilityRole="tab"
            accessibilityState={{ selected: page === i }}
          />
        ))}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pager: {
    flex: 1,
    width: '100%',
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  animatedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  image: {
    width: width * 0.7,
    height: width * 0.7,
    marginBottom: 32,
  },
  title: {
    color: '#FD8B5A',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#FD8B5A',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 30,
    width: '95%',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#FD8B5A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 36,
    left: 0,
    right: 0,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 7,
  },
  dotActive: {
    backgroundColor: '#F48B6C',
  },
  dotInactive: {
    backgroundColor: 'rgba(123, 169, 163, 0.4)',
  },
  progressBarContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 34,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    zIndex: 10,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#F48B6C',
    borderRadius: 2,
  },
  prevButton: {
    marginTop: 16,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(10,27,43,0.12)',
  },
  prevButtonText: {
    color: '#7BA9A3',
    fontSize: 15,
    fontWeight: '600',
  },
  chatIcon: {
    position: 'absolute',
    top: -28,
    left: 0,
    width: 60,
    height: 60,
    zIndex: 20,
  },
}); 