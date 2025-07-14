# Guide de Dépannage - Auto-Login

## 🚨 Problèmes courants et solutions

### 1. **L'utilisateur n'est pas automatiquement connecté**

#### **Symptômes :**
- L'app affiche toujours la page d'accueil même après connexion
- L'utilisateur doit se reconnecter à chaque fois

#### **Solutions :**

**A. Vérifier la configuration Supabase**
```sql
-- Exécuter dans l'éditeur SQL de Supabase
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_profiles';
```

**B. Ajouter la colonne first_connection si manquante**
```sql
-- Exécuter ce script si la colonne n'existe pas
ALTER TABLE user_profiles ADD COLUMN first_connection BOOLEAN DEFAULT TRUE;
```

**C. Vérifier les logs de console**
```typescript
// Dans les logs, chercher :
console.log('Vérification de l\'état d\'authentification...');
console.log('Utilisateur connecté trouvé:', user.email);
console.log('Aucun utilisateur connecté');
```

### 2. **Redirection en boucle**

#### **Symptômes :**
- L'app redirige en boucle entre les écrans
- Écran de chargement infini

#### **Solutions :**

**A. Vérifier la logique de redirection**
```typescript
// Dans AuthProvider.tsx, vérifier :
if (profile?.first_connection) {
  router.replace('/OnboardingScreen');
} else {
  router.replace('/HomeScreen');
}
```

**B. Ajouter des logs de débogage**
```typescript
console.log('État de connexion:', { isAuthenticated, user, profile });
console.log('first_connection:', profile?.first_connection);
```

### 3. **Erreur "first_connection column does not exist"**

#### **Symptômes :**
- Erreur dans les logs : `column "first_connection" does not exist`
- L'auto-login ne fonctionne pas

#### **Solutions :**

**A. Exécuter le script de migration**
```sql
-- Exécuter dans Supabase SQL Editor
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'first_connection'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN first_connection BOOLEAN DEFAULT TRUE;
    END IF;
END $$;
```

**B. Vérifier que la colonne a été ajoutée**
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name = 'first_connection';
```

### 4. **Session perdue après redémarrage**

#### **Symptômes :**
- L'utilisateur est déconnecté après fermeture/réouverture de l'app
- Les sessions ne persistent pas

#### **Solutions :**

**A. Vérifier la configuration Supabase**
- Aller dans Supabase Dashboard
- **Authentication** → **Settings**
- Vérifier que les sessions sont activées

**B. Vérifier les tokens**
```typescript
// Dans les logs, vérifier :
const { data: { user }, error } = await supabase.auth.getUser();
console.log('Token valide:', !!user);
```

### 5. **Écran de chargement infini**

#### **Symptômes :**
- L'app reste bloquée sur "Vérification de la connexion..."
- Pas de redirection

#### **Solutions :**

**A. Vérifier la connectivité réseau**
```typescript
// Ajouter des logs de débogage
console.log('Début de la vérification d\'auth');
console.log('Fin de la vérification d\'auth');
```

**B. Vérifier les erreurs dans les logs**
```typescript
// Chercher les erreurs :
console.error('Erreur lors de la vérification de l\'authentification:', error);
```

## 🔧 Tests de diagnostic

### **Test 1 : Vérification de base**
```typescript
// Ajouter temporairement dans useAuth.ts
console.log('=== DIAGNOSTIC AUTO-LOGIN ===');
console.log('1. Début de checkAuthState');
console.log('2. Vérification utilisateur:', !!user);
console.log('3. Vérification profil:', !!profile);
console.log('4. first_connection:', profile?.first_connection);
console.log('5. isAuthenticated:', isAuthenticated);
console.log('6. isLoading:', isLoading);
```

### **Test 2 : Test de session**
```typescript
// Dans la console, tester :
const { data: { user } } = await supabase.auth.getUser();
console.log('Utilisateur connecté:', !!user);
```

### **Test 3 : Test de profil**
```typescript
// Dans la console, tester :
const { data: profile } = await supabase
  .from('user_profiles')
  .select('*')
  .eq('id', 'USER_ID')
  .single();
console.log('Profil récupéré:', profile);
```

## 📊 Logs utiles

### **Logs à surveiller :**
```typescript
// Dans useAuth.ts
console.log('Vérification de l\'état d\'authentification...');
console.log('Utilisateur connecté trouvé:', user.email);
console.log('Profil utilisateur récupéré:', profile);
console.log('Aucun utilisateur connecté');
console.log('Erreur lors de la vérification de l\'utilisateur:', error);
console.log('Erreur lors de la récupération du profil:', profileError);
```

### **Logs dans AuthProvider :**
```typescript
console.log('Première connexion détectée, redirection vers OnboardingScreen');
console.log('Utilisateur connecté, redirection vers HomeScreen');
console.log('Utilisateur non connecté, affichage de la page d\'accueil');
```

## 🛠️ Solutions rapides

### **Solution 1 : Reset complet**
1. Se déconnecter manuellement
2. Fermer complètement l'app
3. Rouvrir l'app
4. Se reconnecter

### **Solution 2 : Clear AsyncStorage**
```typescript
// Dans la console, exécuter :
await AsyncStorage.clear();
```

### **Solution 3 : Vérifier la base de données**
```sql
-- Dans Supabase SQL Editor
SELECT * FROM user_profiles WHERE id = 'USER_ID';
```

## 📱 Test en conditions réelles

### **Scénarios à tester :**

1. **Première connexion**
   - Inscription → Onboarding → HomeScreen
   - Vérifier que `first_connection = FALSE` après onboarding

2. **Connexion normale**
   - Connexion → HomeScreen direct
   - Vérifier que `first_connection = FALSE`

3. **Déconnexion/Reconnexion**
   - Se déconnecter → Page d'accueil
   - Se reconnecter → HomeScreen

4. **Fermeture/Réouverture**
   - Fermer l'app complètement
   - Rouvrir → Auto-login vers HomeScreen

## 🚀 Optimisations

### **Performance :**
- Cache des profils utilisateur
- Réduction des requêtes Supabase
- Optimisation des redirections

### **UX :**
- Écran de chargement plus informatif
- Transitions fluides
- Gestion des erreurs gracieuse

## 📞 Support

Si les problèmes persistent :
1. Vérifier les logs de console
2. Tester les scénarios ci-dessus
3. Vérifier la configuration Supabase
4. Consulter la documentation Supabase 