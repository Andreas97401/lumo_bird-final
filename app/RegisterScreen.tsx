import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { useRouter } from 'expo-router';

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

  // Validation des champs
  const validateField = (name: string, value: string) => {
    switch (name) {
      case 'prenom':
        return value.length < 2 ? 'Le prénom doit contenir au moins 2 caractères' : '';
      case 'age':
        return isNaN(Number(value)) || value === '' ? 'L\'âge doit être un nombre' : '';
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return !emailRegex.test(value) ? 'Email invalide' : '';
      case 'password':
        return value.length < 6 ? '6 caractères minimum' : '';
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

  const handleSubmit = () => {
    if (!isButtonEnabled) return;
    Alert.alert('Succès', 'Inscription validée !');
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.contentWrapper}>
          {/* Titre */}
          <Animated.Text 
            style={[
              styles.title,
              { opacity: fadeAnim, transform: [{ translateY }] }
            ]}
          >
            Tout d'abord, présentez-vous :
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
              <Text style={styles.label}>Prénom</Text>
              <TextInput
                style={[styles.input, errors.prenom ? styles.inputError : null]}
                placeholder="Prénom"
                placeholderTextColor="rgba(198, 231, 226, 0.5)"
                onChangeText={(value) => handleChange('prenom', value)}
                value={formData.prenom}
              />
              {errors.prenom ? <Text style={styles.errorText}>{errors.prenom}</Text> : null}
            </View>

            {/* Âge et Genre sur la même ligne */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}> 
                <Text style={styles.label}>Âge</Text>
                <TextInput
                  style={[styles.input, errors.age ? styles.inputError : null]}
                  placeholder="Âge"
                  placeholderTextColor="rgba(198, 231, 226, 0.5)"
                  keyboardType="numeric"
                  onChangeText={(value) => handleChange('age', value)}
                  value={formData.age}
                />
                {errors.age ? <Text style={styles.errorText}>{errors.age}</Text> : null}
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}> 
                <Text style={styles.label}>Genre</Text>
                <Pressable onPress={() => setShowGenderModal(true)}>
                  <View style={styles.input}>
                    <Text style={[styles.inputText, !formData.genre && styles.placeholder]}>
                      {formData.genre || 'Sélectionner'}
                    </Text>
                  </View>
                </Pressable>
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Adresse mail</Text>
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
              <Text style={styles.label}>Mot de passe</Text>
              <TextInput
                style={[styles.input, errors.password ? styles.inputError : null]}
                placeholder="Mot de passe"
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
              <Text style={styles.buttonText}>Suivant</Text>
              <Text style={[styles.buttonText, { marginLeft: -4 }]}>→</Text>
            </Animated.View>
          </Pressable>

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
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#041836',
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