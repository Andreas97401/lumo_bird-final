import { createUser } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Animated, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { Text } from '../components/Text';

const GENRE_OPTIONS = ['Homme', 'Femme', 'Je préfère ne pas le dire'];

export const options = { headerShown: false };

export default function RegisterScreen() {
  const [formData, setFormData] = useState({
    prenom: '',
    age: '',
    genre: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({
    prenom: '',
    age: '',
    genre: '',
    email: '',
    password: '',
  });
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const modalScale = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  // Ajout d'un état pour le modal de succès
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const { t } = useTranslation();

  // Validation des champs
  const validateField = (name: string, value: string) => {
    switch (name) {
      case 'prenom':
        return value.length < 2 ? t('signup.firstname_min') : '';
      case 'age':
        return isNaN(Number(value)) || value === '' ? t('signup.age_number') : '';
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return !emailRegex.test(value) ? t('signup.invalid_email') : '';
      case 'password':
        return value.length < 6 ? t('signup.password_min') : '';
      default:
        return '';
    }
  };

  // Mise à jour des champs avec validation
  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error }));
    setTimeout(() => {
      const hasErrors = Object.values(errors).some(error => error !== '');
      const allFilled = Object.values({ ...formData, [name]: value }).every(v => v !== '');
      setIsButtonEnabled(!hasErrors && allFilled);
    }, 0);
  };

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

  useEffect(() => {
    if (showGenderModal) {
      Animated.spring(modalScale, {
        toValue: 1,
        useNativeDriver: true,
        damping: 15,
        stiffness: 100,
      }).start();
    } else {
      modalScale.setValue(0);
    }
  }, [showGenderModal]);

  const handleGenderSelect = (gender: string) => {
    handleChange('genre', gender);
    setShowGenderModal(false);
  };

  const onPressIn = () => {
    if (isButtonEnabled) {
      Animated.spring(buttonScale, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    }
  };

  const onPressOut = () => {
    if (isButtonEnabled) {
      Animated.spring(buttonScale, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleSubmit = async () => {
    if (!isButtonEnabled) return;
    
    try {
      const result = await createUser({
        email: formData.email,
        password: formData.password,
        prenom: formData.prenom,
        age: parseInt(formData.age),
        genre: formData.genre,
      });

      if (result.success) {
        setShowSuccessModal(true);
      } else {
        Alert.alert(t('signup.error'), t('signup.create_error', { error: result.error }));
      }
    } catch (error) {
      Alert.alert(t('signup.error'), t('signup.unknown_error'));
      console.error('Erreur handleSubmit:', error);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        <View style={styles.contentWrapper}>
          {/* Titre */}
          <Animated.Text 
            style={[
              styles.title,
              { opacity: fadeAnim, transform: [{ translateY }] }
            ]}
          >
            {t('signup.intro')}
          </Animated.Text>

          {/* Formulaire */}
          <Animated.View 
            style={[
              styles.form,
              { opacity: fadeAnim, transform: [{ translateY }] }
            ]}
          >
            {/* Prénom */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('signup.firstname')}</Text>
              <TextInput
                style={[styles.input, errors.prenom ? styles.inputError : null]}
                placeholder={t('signup.firstname')}
                placeholderTextColor="rgba(198, 231, 226, 0.5)"
                onChangeText={(value) => handleChange('prenom', value)}
                value={formData.prenom}
              />
              {errors.prenom ? <Text style={styles.errorText}>{errors.prenom}</Text> : null}
            </View>

            {/* Âge et Genre sur la même ligne */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}> 
                <Text style={styles.label}>{t('signup.age')}</Text>
                <TextInput
                  style={[styles.input, errors.age ? styles.inputError : null]}
                  placeholder={t('signup.age')}
                  placeholderTextColor="rgba(198, 231, 226, 0.5)"
                  keyboardType="numeric"
                  onChangeText={(value) => handleChange('age', value)}
                  value={formData.age}
                />
                {errors.age ? <Text style={styles.errorText}>{errors.age}</Text> : null}
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}> 
                <Text style={styles.label}>{t('signup.gender')}</Text>
                <Pressable onPress={() => setShowGenderModal(true)}>
                  <View style={styles.input}>
                    <Text style={[styles.inputText, !formData.genre && styles.placeholder]}>
                      {formData.genre || t('signup.select')}
                    </Text>
                  </View>
                </Pressable>
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('signup.email')}</Text>
              <TextInput
                style={[styles.input, errors.email ? styles.inputError : null]}
                placeholder="Lumobird@gmail.com"
                placeholderTextColor="rgba(198, 231, 226, 0.5)"
                keyboardType="email-address"
                autoCapitalize="none"
                onChangeText={(value) => handleChange('email', value)}
                value={formData.email}
              />
              {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
            </View>

            {/* Mot de passe */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('signup.password')}</Text>
              <TextInput
                style={[styles.input, errors.password ? styles.inputError : null]}
                placeholder={t('signup.password')}
                placeholderTextColor="rgba(198, 231, 226, 0.5)"
                secureTextEntry
                onChangeText={(value) => handleChange('password', value)}
                value={formData.password}
              />
              {errors.password ? <Text style={styles.errorText}>{errors.password}</Text> : null}
            </View>
          </Animated.View>

          {/* Bouton Suivant */}
          <Pressable 
            onPressIn={onPressIn} 
            onPressOut={onPressOut}
            disabled={!isButtonEnabled}
            onPress={handleSubmit}
          >
            <Animated.View 
              style={[
                styles.button,
                { 
                  transform: [{ scale: buttonScale }],
                  opacity: isButtonEnabled ? 1 : 0.5
                }
              ]}
            >
              <Text style={styles.buttonText}>{t('signup.next')}</Text>
              <Text style={[styles.buttonText, { marginLeft: -4 }]}>→</Text>
            </Animated.View>
          </Pressable>

          {/* Lien vers la connexion */}
          <TouchableOpacity onPress={() => router.push('/LoginScreen')} style={{ alignSelf: 'center', marginTop: 18 }}>
            <Text style={{ color: '#C6E7E2', fontSize: 15, textDecorationLine: 'underline' }}>
              {t('signup.already_account')}
            </Text>
          </TouchableOpacity>

          {/* Modal pour le choix du genre */}
          <Modal
            visible={showGenderModal}
            transparent
            animationType="none"
            onRequestClose={() => setShowGenderModal(false)}
          >
            <TouchableOpacity 
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowGenderModal(false)}
            >
              <Animated.View 
                style={[
                  styles.modalContent,
                  { 
                    transform: [{ scale: modalScale }],
                    opacity: modalScale
                  }
                ]}
              >
                {GENRE_OPTIONS.map((option, index) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.genderOption,
                      index < GENRE_OPTIONS.length - 1 && styles.genderOptionBorder,
                      formData.genre === option && styles.genderOptionActive
                    ]}
                    onPress={() => handleGenderSelect(option)}
                  >
                    <Text style={[
                      styles.genderOptionText,
                      formData.genre === option && styles.genderOptionSelected
                    ]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </Animated.View>
            </TouchableOpacity>
          </Modal>

          {/* Modal de succès esthétique */}
          <Modal
            visible={showSuccessModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowSuccessModal(false)}
          >
            <View style={{ flex: 1, backgroundColor: 'rgba(4,24,54,0.85)', justifyContent: 'center', alignItems: 'center' }}>
              <View style={{ backgroundColor: '#0A2547', borderRadius: 20, padding: 32, alignItems: 'center', marginHorizontal: 32, borderWidth: 1, borderColor: '#71ABA4' }}>
                <Text style={{ fontSize: 32, marginBottom: 12, color: '#71ABA4' }}>🎉</Text>
                <Text style={{ fontSize: 22, color: '#C6E7E2', fontWeight: 'bold', marginBottom: 10, textAlign: 'center', fontFamily: 'Righteous' }}>{t('signup.success_title')}</Text>
                <Text style={{ fontSize: 16, color: '#C6E7E2', textAlign: 'center', marginBottom: 24 }}>
                  {t('signup.success_text')}
                </Text>
                <TouchableOpacity
                  style={{ backgroundColor: '#FD8B5A', borderRadius: 8, paddingHorizontal: 32, paddingVertical: 12, marginTop: 8 }}
                  onPress={() => {
                    setShowSuccessModal(false);
                    router.push('/LoginScreen');
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>{t('signup.ok')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#041836',
  },
  scrollContent: {
    flexGrow: 1,
  },
  contentWrapper: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    color: '#C6E7E2',
    marginBottom: 32,
    fontWeight: 'bold',
    fontFamily: 'Righteous', // AJOUTE cette ligne
  },
  form: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 16,
    color: '#C6E7E2',
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    fontSize: 16,
    color: '#C6E7E2',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(198, 231, 226, 0.2)',
    paddingVertical: 10,
    backgroundColor: 'transparent',
  },
  inputError: {
    borderBottomColor: '#FF6B6B',
  },
  errorText: {
    fontSize: 13,
    color: '#FF6B6B',
    marginTop: 4,
  },
  button: {
    backgroundColor: '#FD8B5A',
    paddingVertical: 16,
    paddingHorizontal: 36,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
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
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginRight: 4,
  },
  inputText: {
    fontSize: 16,
    color: '#C6E7E2',
  },
  placeholder: {
    color: 'rgba(198, 231, 226, 0.5)',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(4, 24, 54, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#0A2547',
    borderRadius: 15,
    width: '80%',
    overflow: 'hidden',
  },
  genderOption: {
    paddingVertical: 20,
    paddingHorizontal: 25,
  },
  genderOptionActive: {
    backgroundColor: 'rgba(253, 139, 90, 0.1)',
  },
  genderOptionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(198, 231, 226, 0.1)',
  },
  genderOptionText: {
    fontSize: 16,
    color: '#C6E7E2',
    textAlign: 'center',
  },
  genderOptionSelected: {
    color: '#FD8B5A',
    fontWeight: 'bold',
  },
}); 