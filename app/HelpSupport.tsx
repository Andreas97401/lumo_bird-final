import { useRouter } from 'expo-router';
import React from 'react';
import { Linking, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '../components/Text';

export default function HelpSupport() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>‹ Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Aide & Support</Text>
        <View style={{ width: 60 }} />
      </View>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>FAQ</Text>
        <Text style={styles.text}>
          <Text style={styles.bold}>Q : Je n’arrive pas à me connecter.</Text>{'\n'}
          R : Vérifiez votre email et votre mot de passe. Si le problème persiste, utilisez la fonction « Mot de passe oublié » ou contactez-nous.
        </Text>
        <Text style={styles.text}>
          <Text style={styles.bold}>Q : Comment supprimer mon compte ?</Text>{'\n'}
          R : Rendez-vous dans les paramètres, puis cliquez sur « Supprimer mon compte ».
        </Text>
        <Text style={styles.text}>
          <Text style={styles.bold}>Q : Mes données sont-elles sécurisées ?</Text>{'\n'}
          R : Oui, nous utilisons des protocoles de sécurité avancés pour protéger vos informations.
        </Text>
        <Text style={styles.sectionTitle}>Contact</Text>
        <Text style={styles.text}>
          Pour toute question ou assistance, contactez-nous à l’adresse suivante :
        </Text>
        <TouchableOpacity onPress={() => Linking.openURL('mailto:support@lumobird.com')}>
          <Text style={styles.link}>contact@lumobird.com</Text>
        </TouchableOpacity>
        <Text style={styles.sectionTitle}>Signaler un bug</Text>
        <Text style={styles.text}>
          Si vous rencontrez un bug, merci de nous envoyer une description détaillée par email. Nous ferons notre possible pour le corriger rapidement !
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#041836',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#1A2F4A',
    backgroundColor: '#041836',
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
  container: {
    flex: 1,
    backgroundColor: '#041836',
  },
  content: {
    padding: 24,
    paddingBottom: 48,
    flexGrow: 1,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#C6E7E2',
    fontWeight: 'bold',
    marginTop: 18,
    marginBottom: 6,
  },
  text: {
    fontSize: 15,
    color: '#C6E7E2',
    marginBottom: 10,
    lineHeight: 22,
  },
  link: {
    color: '#FD8B5A',
    fontSize: 16,
    textDecorationLine: 'underline',
    marginBottom: 18,
  },
  bold: {
    fontWeight: 'bold',
    color: '#C6E7E2',
  },
}); 