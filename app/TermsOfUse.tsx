import { useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '../components/Text';

export default function TermsOfUse() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>‹ Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Conditions d’utilisation</Text>
        <View style={{ width: 60 }} />
      </View>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>1. Acceptation des conditions</Text>
        <Text style={styles.text}>
          En utilisant l’application LumoBird, vous acceptez sans réserve les présentes conditions d’utilisation. Si vous n’acceptez pas ces conditions, veuillez ne pas utiliser l’application.
        </Text>
        <Text style={styles.sectionTitle}>2. Utilisation de l’application</Text>
        <Text style={styles.text}>
          L’utilisateur s’engage à utiliser l’application de manière conforme à la loi et à l’ordre public. Toute utilisation abusive, frauduleuse ou contraire à l’éthique est strictement interdite.
        </Text>
        <Text style={styles.sectionTitle}>3. Création de compte</Text>
        <Text style={styles.text}>
          Pour accéder à certaines fonctionnalités, la création d’un compte est nécessaire. Vous vous engagez à fournir des informations exactes et à les mettre à jour si nécessaire.
        </Text>
        <Text style={styles.sectionTitle}>4. Propriété intellectuelle</Text>
        <Text style={styles.text}>
          Tous les contenus présents sur l’application (textes, images, logos, etc.) sont protégés par le droit d’auteur et sont la propriété exclusive de LumoBird ou de ses partenaires.
        </Text>
        <Text style={styles.sectionTitle}>5. Responsabilité</Text>
        <Text style={styles.text}>
          LumoBird ne saurait être tenu responsable des dommages directs ou indirects résultant de l’utilisation ou de l’impossibilité d’utiliser l’application.
        </Text>
        <Text style={styles.sectionTitle}>6. Modification des conditions</Text>
        <Text style={styles.text}>
          LumoBird se réserve le droit de modifier à tout moment les présentes conditions. Les utilisateurs seront informés des modifications via l’application.
        </Text>
        <Text style={styles.sectionTitle}>7. Contact</Text>
        <Text style={styles.text}>
          Pour toute question concernant ces conditions, vous pouvez nous contacter à l’adresse : contact@lumobird.com
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