import { signIn, supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Animated, Dimensions, Image, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { Text } from '../components/Text';

const { width, height } = Dimensions.get('window');

export const options = {
  tabBarStyle: { display: 'none' },
  headerShown: false,
};

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('login.error'), t('login.fill_all_fields'));
      return;
    }

    setIsLoading(true);
    try {
      const result = await signIn(email, password);
      
      if (result.success) {
        // Récupérer l'utilisateur
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          Alert.alert(t('login.error'), t('login.user_not_found'));
          setIsLoading(false);
          return;
        }
        // Récupérer le profil utilisateur dans user_profiles
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('first_connection')
          .eq('id', user.id)
          .single();
        if (profileError) {
          Alert.alert(t('login.error'), t('login.profile_not_found'));
          setIsLoading(false);
          return;
        }
        if (profile?.first_connection) {
          router.push('/OnboardingScreen');
        } else {
          router.push('/HomeScreen');
        }
      } else {
        Alert.alert(t('login.error'), t('login.login_error', { error: result.error }));
      }
    } catch (error) {
      Alert.alert(t('login.error'), t('login.unknown_error'));
      console.error('Erreur handleLogin:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = () => {
    router.push('/Signup');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <Animated.View style={[
            styles.formContainer,
            { opacity: fadeAnim, transform: [{ translateY }] }
          ]}>
            <Text style={styles.title}>{t('login.title')}</Text>
            <Text style={styles.subtitle}>{t('login.subtitle')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('login.email')}
              placeholderTextColor="#C6E7E2"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder={t('login.password')}
              placeholderTextColor="#C6E7E2"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <TouchableOpacity 
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? t('login.loading') : t('login.login_button')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.switchButton} onPress={handleSignup}>
              <Text style={styles.switchButtonText}>{t('login.no_account')}</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
      <Image
        source={require('../assets/images/head.png')}
        style={styles.logoFixed}
        resizeMode="contain"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#041836',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  formContainer: {
    marginTop: 60,
  },
  title: {
    fontSize: 42,
    color: '#C6E7E2',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: 1,
    fontWeight: 'bold',
    textShadowColor: 'rgba(198, 231, 226, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(198, 231, 226, 0.7)',
    marginBottom: 30,
    textAlign: 'center',
    lineHeight: 22,
  },
  input: {
    backgroundColor: 'rgba(198, 231, 226, 0.1)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    color: '#C6E7E2',
    borderWidth: 1,
    borderColor: 'rgba(198, 231, 226, 0.2)',
  },
  button: {
    backgroundColor: '#FD8B5A',
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#FD8B5A',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchButtonText: {
    color: '#C6E7E2',
    fontSize: 16,
    opacity: 0.9,
  },
  logo: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    marginBottom: 40,
    tintColor: '#FFFFFF',
    opacity: 0.8,
  },
  buttonDisabled: {
    opacity: 0.7,
    backgroundColor: '#ccc',
  },
  helpContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  helpText: {
    fontSize: 12,
    color: 'rgba(198, 231, 226, 0.6)',
    textAlign: 'center',
    lineHeight: 16,
  },
  logoFixed: {
    width: 120,
    height: 120,
    position: 'relative',
    left: 0,
    right: 500,
    bottom: 80, // Légèrement au-dessus du bas
    alignSelf: 'center',
    tintColor: '#FFFFFF',
    opacity: 0.8,
    zIndex: 10,
  },
}); 