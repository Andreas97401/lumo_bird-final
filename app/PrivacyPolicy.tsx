import { useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '../components/Text';

export default function PrivacyPolicy() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>‹ Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Politique de confidentialité</Text>
        <View style={{ width: 60 }} />
      </View>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>1. Collecte des données</Text>
        <Text style={styles.text}>
          LumoBird collecte uniquement les données nécessaires au bon fonctionnement de l’application, telles que le prénom, l’âge, le genre, l’email et les données d’utilisation.
        </Text>
        <Text style={styles.sectionTitle}>2. Utilisation des données</Text>
        <Text style={styles.text}>
          Vos données sont utilisées pour personnaliser votre expérience, assurer la sécurité de votre compte et améliorer nos services. Elles ne sont jamais vendues à des tiers.
        </Text>
        <Text style={styles.sectionTitle}>3. Partage des données</Text>
        <Text style={styles.text}>
          Les données peuvent être partagées avec des partenaires techniques uniquement pour assurer le fonctionnement de l’application. Aucun partage commercial n’est effectué sans votre consentement.
        </Text>
        <Text style={styles.sectionTitle}>4. Sécurité</Text>
        <Text style={styles.text}>
          Nous mettons en œuvre toutes les mesures nécessaires pour protéger vos données contre tout accès non autorisé, altération ou destruction.
        </Text>
        <Text style={styles.sectionTitle}>5. Droits de l’utilisateur</Text>
        <Text style={styles.text}>
          Vous disposez d’un droit d’accès, de rectification et de suppression de vos données. Pour exercer ces droits, contactez-nous à l’adresse : contact@lumobird.com
        </Text>
        <Text style={styles.sectionTitle}>6. Conservation des données</Text>
        <Text style={styles.text}>
          Vos données sont conservées aussi longtemps que nécessaire pour l’utilisation de l’application ou jusqu’à la suppression de votre compte.
        </Text>
        <Text style={styles.sectionTitle}>7. Modifications</Text>
        <Text style={styles.text}>
          Cette politique peut être modifiée à tout moment. Les utilisateurs seront informés des changements importants via l’application.
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
}); 