# Guide des Paramètres - LumoBird

## 🎛️ Page de Paramètres

La page de paramètres de LumoBird offre un contrôle complet sur l'expérience utilisateur et la gestion du compte.

## 📱 Accès aux Paramètres

### **Depuis HomePage**
- Bouton ⚙️ dans le header
- Navigation directe vers `/SettingsPage`

### **Navigation**
- Bouton "‹ Retour" pour revenir à la page précédente
- Interface intuitive avec sections organisées

## 🔧 Sections Disponibles

### 1. **Compte**
Informations et gestion du profil utilisateur.

#### **Profil utilisateur**
- Affichage du prénom et email
- Informations en lecture seule

#### **Modifier le profil**
- Fonctionnalité à venir
- Permettra de modifier les informations personnelles

#### **Changer le mot de passe**
- Fonctionnalité à venir
- Sécurisation du compte

### 2. **Notifications**
Contrôle des notifications et alertes.

#### **Notifications push**
- `ON` : Recevoir les notifications push
- `OFF` : Désactiver toutes les notifications
- Sauvegarde automatique dans AsyncStorage

#### **Effets sonores**
- `ON` : Sons et vibrations pour les interactions
- `OFF` : Mode silencieux
- Affecte les sons de l'application

#### **Retour haptique**
- `ON` : Vibrations tactiles sur les interactions
- `OFF` : Désactiver les vibrations
- Améliore l'expérience tactile

### 3. **Apparence**
Personnalisation de l'interface.

#### **Mode sombre**
- `ON` : Interface sombre
- `OFF` : Interface claire
- Changement en temps réel

### 4. **Sécurité**
Paramètres de sécurité et de connexion.

#### **Connexion automatique**
- `ON` : Auto-login activé
- `OFF` : Connexion manuelle requise
- Contrôle l'auto-login basé sur l'appareil

#### **Synchronisation des données**
- `ON` : Sauvegarde automatique
- `OFF` : Sauvegarde manuelle uniquement
- Gestion des données utilisateur

### 5. **Données**
Gestion des données locales et export.

#### **Exporter mes données**
- Fonctionnalité à venir
- Export des données personnelles

#### **Effacer les données locales**
- Supprime le cache de l'application
- Efface AsyncStorage
- Confirmation requise

### 6. **À propos**
Informations sur l'application.

#### **Version**
- Version actuelle : 1.0.0
- Informations de build

#### **Conditions d'utilisation**
- Fonctionnalité à venir
- Liens vers les conditions

#### **Politique de confidentialité**
- Fonctionnalité à venir
- Informations sur la protection des données

#### **Aide et support**
- Fonctionnalité à venir
- Support utilisateur

### 7. **Compte**
Actions sur le compte utilisateur.

#### **Se déconnecter**
- Déconnexion sécurisée
- Confirmation requise
- Redirection vers LoginScreen

#### **Supprimer le compte**
- Suppression définitive
- Action irréversible
- Confirmation double requise

## 🛠️ Fonctionnalités Techniques

### **Sauvegarde Automatique**
```typescript
// Les paramètres sont automatiquement sauvegardés
const { settings, updateSetting } = useSettings();
await updateSetting('notifications', true);
```

### **Persistance des Données**
- AsyncStorage pour la persistance locale
- Synchronisation avec Supabase
- Gestion des erreurs robuste

### **Interface Réactive**
- Animations fluides
- Feedback visuel immédiat
- Design cohérent avec l'app

## 📊 Gestion des Paramètres

### **Hook useSettings**
```typescript
const { 
  settings, 
  updateSetting, 
  resetSettings, 
  clearAllData 
} = useSettings();
```

### **Structure des Paramètres**
```typescript
interface AppSettings {
  notifications: boolean;
  soundEffects: boolean;
  hapticFeedback: boolean;
  darkMode: boolean;
  autoLogin: boolean;
  dataSync: boolean;
}
```

### **Valeurs par Défaut**
```typescript
const defaultSettings: AppSettings = {
  notifications: true,
  soundEffects: true,
  hapticFeedback: true,
  darkMode: false,
  autoLogin: true,
  dataSync: true,
};
```

## 🔒 Sécurité

### **Gestion des Sessions**
- Vérification automatique de l'authentification
- Redirection si non connecté
- Protection des données sensibles

### **Suppression de Compte**
- Suppression du profil utilisateur
- Suppression du compte auth
- Nettoyage des données locales

### **Confirmation des Actions**
- Alertes pour les actions destructives
- Double confirmation pour la suppression
- Messages d'erreur informatifs

## 🎨 Design et UX

### **Interface Cohérente**
- Couleurs de la charte graphique
- Typographie Righteous
- Animations fluides

### **Accessibilité**
- Boutons de taille appropriée
- Contrastes suffisants
- Navigation intuitive

### **Responsive**
- Adaptation aux différentes tailles d'écran
- Gestion du SafeArea
- Scroll fluide

## 🚀 Améliorations Futures

### **Fonctionnalités Prévues**
- [ ] Modification du profil
- [ ] Changement de mot de passe
- [ ] Export des données
- [ ] Conditions d'utilisation
- [ ] Politique de confidentialité
- [ ] Aide et support

### **Optimisations**
- [ ] Cache des paramètres
- [ ] Synchronisation cloud
- [ ] Thèmes personnalisés
- [ ] Notifications avancées

## 📝 Notes de Développement

### **Architecture**
- Hook personnalisé `useSettings`
- Composant `SettingsButton` réutilisable
- Gestion centralisée des paramètres

### **Bonnes Pratiques**
- Sauvegarde automatique
- Gestion d'erreurs robuste
- Interface utilisateur intuitive
- Sécurité des données

### **Tests Recommandés**
- Test de tous les toggles
- Test de sauvegarde/restauration
- Test de suppression de compte
- Test de déconnexion
- Test de navigation

## 🔧 Dépannage

### **Problèmes Courants**

#### **Paramètres non sauvegardés**
- Vérifier AsyncStorage
- Vérifier les permissions
- Redémarrer l'application

#### **Interface non réactive**
- Vérifier les animations
- Vérifier les états React
- Vérifier les performances

#### **Erreurs de navigation**
- Vérifier les routes
- Vérifier l'authentification
- Vérifier les permissions

### **Logs Utiles**
```typescript
console.log('Paramètres sauvegardés:', newSettings);
console.log('Erreur lors de la sauvegarde:', error);
console.log('Utilisateur connecté:', user.email);
``` 