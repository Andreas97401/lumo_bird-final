import { signOut, supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Modal,
    Pressable,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    TouchableOpacity,
    View
} from 'react-native';
import { Text } from '../components/Text';
import { useSettings } from '../hooks/useSettings';

const { width, height } = Dimensions.get('window');

interface SettingsSection {
  title: string;
  items: SettingsItem[];
}

interface SettingsItem {
  id: string;
  title: string;
  subtitle?: string;
  type: 'toggle' | 'button' | 'link' | 'info';
  value?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
  icon?: string;
}

// Fonction utilitaire pour appeler la Edge Function
async function deleteUserFromSupabase(userId: string, accessToken: string) {
  const response = await fetch('https://mvypwnihbkqnavrxwmyi.functions.supabase.co/delete-user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({ userId }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Erreur lors de la suppression');
  return data;
}

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false); // loading suppression
  const { settings, updateSetting, clearAllData } = useSettings();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const router = useRouter();
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const { t, i18n } = useTranslation();
  const { language, setLanguage } = useSettings();

  // Synchroniser la langue i18n avec le choix utilisateur
  useEffect(() => {
    if (language) i18n.changeLanguage(language);
  }, [language]);

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté
    const checkUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error || !user) {
          console.log('Utilisateur non connecté, redirection vers LoginScreen');
          router.push('/LoginScreen');
          return;
        }

        console.log('Utilisateur connecté:', user.email);
        setUser(user);
        
        // Récupérer le profil utilisateur
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileError) {
          console.error('Erreur lors de la récupération du profil:', profileError);
        } else {
          console.log('Profil utilisateur récupéré:', profile);
          setUserProfile(profile);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification de l\'utilisateur:', error);
        router.push('/LoginScreen');
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [isLoading]);

  const handleToggle = (key: keyof typeof settings) => {
    updateSetting(key, !settings[key]);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter de votre compte ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await signOut();
              if (result.success) {
                console.log('Déconnexion réussie');
                router.push('/LoginScreen');
              } else {
                Alert.alert('Erreur', 'Erreur lors de la déconnexion');
              }
            } catch (error) {
              console.error('Erreur lors de la déconnexion:', error);
              Alert.alert('Erreur', 'Erreur lors de la déconnexion');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Suppression du compte',
      'Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Continuer',
          style: 'destructive',
          onPress: () => {
            // Deuxième confirmation
            Alert.alert(
              'Confirmer la suppression',
              '⚠️ Toutes vos données seront définitivement supprimées. Voulez-vous vraiment continuer ?',
              [
                {
                  text: 'Annuler',
                  style: 'cancel',
                },
                {
                  text: 'Supprimer mon compte',
                  style: 'destructive',
                  onPress: async () => {
                    setIsDeleting(true);
                    try {
                      // Supprimer le profil utilisateur
                      const { error: profileError } = await supabase
                        .from('user_profiles')
                        .delete()
                        .eq('id', user.id);

                      if (profileError) {
                        console.error('Erreur lors de la suppression du profil:', profileError);
                      }

                      // Récupérer le token utilisateur
                      const session = await supabase.auth.getSession();
                      const accessToken = session.data.session?.access_token;
                      if (!accessToken) throw new Error('Token utilisateur manquant');

                      // Appeler la Edge Function
                      await deleteUserFromSupabase(user.id, accessToken);

                      Alert.alert('Compte supprimé', 'Votre compte a été supprimé avec succès');
                      setIsDeleting(false);
                      router.push('/LoginScreen');
                    } catch (error) {
                      setIsDeleting(false);
                      console.error('Erreur lors de la suppression du compte:', error);
                      const errMsg = error instanceof Error ? error.message : 'Erreur lors de la suppression du compte';
                      Alert.alert('Erreur', errMsg);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleClearData = () => {
    Alert.alert(
      'Effacer les données',
      'Toutes les données locales seront supprimées. Voulez-vous continuer ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Effacer',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllData();
              Alert.alert('Données effacées', 'Toutes les données locales ont été supprimées');
            } catch (error) {
              console.error('Erreur lors de l\'effacement des données:', error);
              Alert.alert('Erreur', 'Erreur lors de l\'effacement des données');
            }
          },
        },
      ]
    );
  };

  const settingsSections: SettingsSection[] = [
    {
      title: t('settings.account'),
      items: [
        {
          id: 'profile',
          title: t('settings.account'),
          subtitle: `${userProfile?.prenom || 'Non défini'} • ${user?.email || 'Non défini'}`,
          type: 'info',
        },
        {
          id: 'editProfile',
          title: t('settings.edit_profile', 'Modifier le profil'),
          type: 'button',
          onPress: () => Alert.alert(t('settings.edit_profile', 'Modifier le profil'), t('settings.coming_soon', 'Fonctionnalité à venir !')),
        },
        {
          id: 'changePassword',
          title: t('settings.change_password', 'Changer le mot de passe'),
          type: 'button',
          onPress: () => Alert.alert(t('settings.change_password', 'Changer le mot de passe'), t('settings.coming_soon', 'Fonctionnalité à venir !')),
        },
      ],
    },
    {
      title: 'Notifications',
      items: [
        {
          id: 'notifications',
          title: 'Notifications push',
          subtitle: 'Recevoir des notifications',
          type: 'toggle',
          value: settings.notifications,
          onToggle: () => handleToggle('notifications'),
        },
        {
          id: 'soundEffects',
          title: 'Effets sonores',
          subtitle: 'Sons et vibrations',
          type: 'toggle',
          value: settings.soundEffects,
          onToggle: () => handleToggle('soundEffects'),
        },
        {
          id: 'hapticFeedback',
          title: 'Retour haptique',
          subtitle: 'Vibrations tactiles',
          type: 'toggle',
          value: settings.hapticFeedback,
          onToggle: () => handleToggle('hapticFeedback'),
        },
      ],
    },
    {
      title: t('settings.language'),
      items: [
        {
          id: 'language',
          title: t('settings.language'),
          subtitle: t(language === 'fr' ? 'settings.french' : 'settings.english'),
          type: 'button',
          onPress: () => setShowLanguageModal(true),
        },
      ],
    },
    {
      title: 'Apparence',
      items: [
        {
          id: 'darkMode',
          title: 'Mode sombre',
          subtitle: 'Interface sombre',
          type: 'toggle',
          value: settings.darkMode,
          onToggle: () => handleToggle('darkMode'),
        },
      ],
    },
    {
      title: 'Sécurité',
      items: [
        {
          id: 'autoLogin',
          title: 'Connexion automatique',
          subtitle: 'Rester connecté',
          type: 'toggle',
          value: settings.autoLogin,
          onToggle: () => handleToggle('autoLogin'),
        },
        {
          id: 'dataSync',
          title: 'Synchronisation des données',
          subtitle: 'Sauvegarder automatiquement',
          type: 'toggle',
          value: settings.dataSync,
          onToggle: () => handleToggle('dataSync'),
        },
      ],
    },
    {
      title: t('settings.about'),
      items: [
        {
          id: 'version',
          title: 'Version',
          subtitle: '1.0.0',
          type: 'info',
        },
        {
          id: 'terms',
          title: t('settings.terms'),
          type: 'link',
          onPress: () => router.push('/TermsOfUse'),
        },
        {
          id: 'privacy',
          title: t('settings.privacy'),
          type: 'link',
          onPress: () => router.push('/PrivacyPolicy'),
        },
        {
          id: 'help',
          title: t('settings.help'),
          type: 'link',
          onPress: () => router.push('/HelpSupport'),
        },
      ],
    },
    {
      title: 'Compte',
      items: [
        {
          id: 'logout',
          title: 'Se déconnecter',
          type: 'button',
          onPress: handleLogout,
        },
        {
          id: 'deleteAccount',
          title: 'Supprimer le compte',
          subtitle: 'Action irréversible',
          type: 'button',
          onPress: handleDeleteAccount,
        },
      ],
    },
  ];

  const renderSettingsItem = (item: SettingsItem) => {
    const isClickable = item.type === 'button' || item.type === 'link';
    const content = (
      <View style={styles.itemContent}>
        <View style={styles.itemText}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          {item.subtitle && (
            <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
          )}
        </View>
        {item.type === 'toggle' && (
          <Switch
            value={item.value}
            onValueChange={item.onToggle}
            trackColor={{ false: '#2A3F5F', true: '#FD8B5A' }}
            thumbColor={item.value ? '#fff' : '#f4f3f4'}
            ios_backgroundColor="#2A3F5F"
          />
        )}
        {(item.type === 'button' || item.type === 'link') && (
          <Text style={styles.itemAction}>›</Text>
        )}
      </View>
    );
    return isClickable ? (
      <TouchableOpacity key={item.id} style={styles.settingsItem} onPress={item.onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    ) : (
      <View key={item.id} style={styles.settingsItem}>
        {content}
      </View>
    );
  };

  if (isLoading || isDeleting) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#041836" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FD8B5A" />
          <Text style={styles.loadingText}>{isDeleting ? 'Suppression du compte...' : 'Chargement...'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#041836" />
      
      <Animated.View 
        style={[
          styles.content,
          { 
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>‹ Retour</Text>
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>{t('settings.title')}</Text>
          
          <View style={styles.headerSpacer} />
        </View>

        {/* Settings Content */}
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {settingsSections.map((section, sectionIndex) => (
            <View key={sectionIndex} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.sectionContent}>
                {section.items.map((item) => renderSettingsItem(item))}
              </View>
            </View>
          ))}
        </ScrollView>
      </Animated.View>
      {/* Modal de sélection de langue */}
      <Modal
        visible={showLanguageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowLanguageModal(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('settings.choose_language')}</Text>
            <TouchableOpacity
              style={[styles.languageOption, language === 'fr' && styles.languageOptionActive]}
              onPress={() => { setLanguage('fr'); setShowLanguageModal(false); }}
            >
              <Text style={[styles.languageOptionText, language === 'fr' && styles.languageOptionSelected]}>{t('settings.french')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.languageOption, language === 'en' && styles.languageOptionActive]}
              onPress={() => { setLanguage('en'); setShowLanguageModal(false); }}
            >
              <Text style={[styles.languageOptionText, language === 'en' && styles.languageOptionSelected]}>{t('settings.english')}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#041836',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#1A2F4A',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    color: '#FD8B5A',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Righteous',
  },
  headerSpacer: {
    width: 60,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    marginTop: 30,
  },
  sectionTitle: {
    color: '#71ABA4',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    paddingHorizontal: 20,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionContent: {
    backgroundColor: '#0A2547',
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingsItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#1A2F4A',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  itemText: {
    flex: 1,
  },
  itemTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  itemSubtitle: {
    color: '#C6E7E2',
    fontSize: 14,
    marginTop: 2,
  },
  itemAction: {
    color: '#FD8B5A',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(4,24,54,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#0A2547',
    borderRadius: 18,
    padding: 28,
    alignItems: 'center',
    minWidth: 260,
    borderWidth: 1,
    borderColor: '#71ABA4',
  },
  modalTitle: {
    fontSize: 20,
    color: '#FD8B5A',
    fontWeight: 'bold',
    marginBottom: 18,
    fontFamily: 'Righteous',
  },
  languageOption: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: 'transparent',
    width: 180,
    alignItems: 'center',
  },
  languageOptionActive: {
    backgroundColor: 'rgba(253, 139, 90, 0.08)',
    borderWidth: 1,
    borderColor: '#FD8B5A',
  },
  languageOptionText: {
    fontSize: 16,
    color: '#C6E7E2',
  },
  languageOptionSelected: {
    color: '#FD8B5A',
    fontWeight: 'bold',
  },
}); 