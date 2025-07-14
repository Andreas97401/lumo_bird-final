# Guide de l'Auto-Login

## 🚀 Fonctionnalité d'Auto-Login

L'application LumoBird dispose maintenant d'un système d'auto-login qui permet aux utilisateurs de rester connectés automatiquement sur leur appareil.

## 🔧 Comment ça fonctionne

### 1. **Vérification automatique au démarrage**
- Au lancement de l'application, le système vérifie automatiquement si l'utilisateur est connecté
- Cette vérification utilise les sessions persistantes de Supabase
- Aucune action de l'utilisateur n'est requise

### 2. **Redirection intelligente**
- **Utilisateur connecté** → Redirection automatique vers l'écran approprié :
  - Si première connexion → `OnboardingScreen`
  - Sinon → `HomeScreen`
- **Utilisateur non connecté** → Affichage de la page d'accueil avec options de connexion/inscription

### 3. **Gestion des sessions**
- Les sessions sont automatiquement persistées par Supabase
- L'utilisateur reste connecté même après fermeture de l'app
- La déconnexion manuelle efface la session

## 🏗️ Architecture technique

### Composants impliqués

#### 1. **Hook `useAuth`** (`hooks/useAuth.ts`)
```typescript
// Gère l'état d'authentification global
const { user, profile, isLoading, isAuthenticated } = useAuth();
```

**Fonctionnalités :**
- Vérification automatique de l'état de connexion
- Écoute des changements d'état d'authentification
- Récupération du profil utilisateur
- Gestion des erreurs

#### 2. **Provider `AuthProvider`** (`components/AuthProvider.tsx`)
```typescript
// Gère la redirection automatique
<AuthProvider>
  {/* Contenu de l'app */}
</AuthProvider>
```

**Fonctionnalités :**
- Redirection automatique selon l'état de connexion
- Affichage d'un écran de chargement pendant la vérification
- Logique de routage intelligente

#### 3. **Layout principal** (`app/_layout.tsx`)
```typescript
// Intègre l'AuthProvider au niveau global
<AuthProvider>
  <Stack>
    {/* Routes de l'application */}
  </Stack>
</AuthProvider>
```

## 📱 Expérience utilisateur

### Scénarios d'utilisation

#### **Première utilisation**
1. L'utilisateur ouvre l'app
2. Aucun utilisateur connecté → Page d'accueil
3. L'utilisateur s'inscrit/se connecte
4. Redirection automatique vers l'écran approprié

#### **Utilisation quotidienne**
1. L'utilisateur ouvre l'app
2. Utilisateur déjà connecté → Redirection automatique vers `HomeScreen`
3. L'utilisateur peut utiliser l'app immédiatement

#### **Déconnexion**
1. L'utilisateur se déconnecte manuellement
2. Session effacée
3. Prochaine ouverture → Page d'accueil

## 🔒 Sécurité

### Avantages
- ✅ Sessions sécurisées par Supabase
- ✅ Tokens JWT automatiquement gérés
- ✅ Expiration automatique des sessions
- ✅ Pas de stockage de mots de passe en local

### Bonnes pratiques
- Les sessions expirent automatiquement
- La déconnexion manuelle efface complètement la session
- Aucune donnée sensible stockée localement

## 🛠️ Configuration

### Dépendances requises
```json
{
  "@supabase/supabase-js": "^2.50.5",
  "@react-native-async-storage/async-storage": "^1.24.0"
}
```

### Variables d'environnement
```typescript
// lib/supabase.ts
const supabaseUrl = 'https://mvypwnihbkqnavrxwmyi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

## 🐛 Dépannage

### Problèmes courants

#### **L'utilisateur n'est pas automatiquement connecté**
- Vérifier que Supabase est correctement configuré
- Vérifier les logs de console pour les erreurs
- S'assurer que l'utilisateur s'est bien connecté précédemment

#### **Redirection en boucle**
- Vérifier la logique dans `AuthProvider`
- S'assurer que les routes sont correctement définies
- Vérifier les conditions de redirection

#### **Session perdue**
- Vérifier la configuration de Supabase
- S'assurer que les tokens ne sont pas expirés
- Vérifier la connectivité réseau

## 📊 Monitoring

### Logs utiles
```typescript
// Dans useAuth.ts
console.log('Vérification de l\'état d\'authentification...');
console.log('Utilisateur connecté trouvé:', user.email);
console.log('Aucun utilisateur connecté');
```

### Métriques à surveiller
- Temps de vérification d'authentification
- Taux de succès des auto-logins
- Fréquence des déconnexions manuelles

## 🚀 Améliorations futures

### Fonctionnalités possibles
- [ ] Biométrie (Touch ID / Face ID)
- [ ] Connexion avec les réseaux sociaux
- [ ] Sessions multiples
- [ ] Synchronisation cross-device
- [ ] Notifications push pour reconnexion

### Optimisations
- [ ] Cache des profils utilisateur
- [ ] Préchargement des données
- [ ] Optimisation des requêtes Supabase
- [ ] Gestion hors ligne

## 📝 Notes de développement

### Points d'attention
- L'AuthProvider doit être au plus haut niveau de l'app
- Les redirections utilisent `router.replace()` pour éviter les retours
- La vérification d'auth est asynchrone et peut prendre du temps
- Les erreurs réseau sont gérées gracieusement

### Tests recommandés
- Test de connexion/déconnexion
- Test de fermeture/réouverture de l'app
- Test avec différents états de réseau
- Test de performance avec de gros profils utilisateur 