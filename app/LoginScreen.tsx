import { signIn, supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Dimensions, Image, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

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
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    setIsLoading(true);
    try {
      const result = await signIn(email, password);
      
      if (result.success) {
        // Récupérer le profil utilisateur pour afficher le nom
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('prenom')
            .eq('id', user.id)
            .single();
          
          const userName = profile?.prenom || email.split('@')[0];
          
          Alert.alert(
            'Connexion réussie !', 
            `Bienvenue ${userName} ! Vous allez être redirigé vers votre espace personnel.`,
            [
              {
                text: 'OK',
                onPress: () => router.push('/HomePage')
              }
            ]
          );
        } else {
          router.push('/HomePage');
        }
      } else {
        Alert.alert('Erreur', `Erreur de connexion: ${result.error}`);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue lors de la connexion');
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
            <Text style={styles.title}>Connexion</Text>
            <Text style={styles.subtitle}>
              Connectez-vous avec vos identifiants
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#C6E7E2"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Mot de passe"
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
                {isLoading ? 'Connexion...' : 'Se connecter'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.switchButton} onPress={handleSignup}>
              <Text style={styles.switchButtonText}>Pas encore de compte ? S'inscrire</Text>
            </TouchableOpacity>
            <View style={styles.helpContainer}>
              <Text style={styles.helpText}>
                💡 Après inscription, vérifiez votre email et cliquez sur le lien de confirmation avant de vous connecter.
              </Text>
            </View>
          </Animated.View>
          <Image
            source={require('../assets/images/head.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      </KeyboardAvoidingView>
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
}); 