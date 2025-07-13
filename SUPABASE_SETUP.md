# Configuration Supabase

## Étapes pour configurer Supabase

### 1. Accéder au Dashboard Supabase
- Allez sur https://supabase.com
- Connectez-vous à votre compte
- Sélectionnez votre projet

### 2. Configurer la base de données
1. Allez dans la section "SQL Editor" dans le menu de gauche
2. Créez un nouveau script SQL
3. Copiez et collez le contenu du fichier `supabase_setup.sql`
4. Exécutez le script

### 3. Vérifier la configuration
1. Allez dans "Table Editor" dans le menu de gauche
2. Vous devriez voir la table `user_profiles` créée
3. Vérifiez que les politiques RLS sont en place

### 4. Configuration de l'authentification (optionnel)
1. Allez dans "Authentication" > "Settings"
2. Configurez les paramètres d'email selon vos besoins
3. Activez la confirmation d'email si nécessaire

## Structure de la base de données

### Table `user_profiles`
- `id`: UUID (clé primaire, référence auth.users)
- `email`: Email de l'utilisateur
- `prenom`: Prénom de l'utilisateur
- `age`: Âge de l'utilisateur
- `genre`: Genre de l'utilisateur
- `created_at`: Date de création
- `updated_at`: Date de dernière modification

## Fonctionnalités implémentées

### Inscription
- Création d'un compte dans `auth.users`
- Insertion des données utilisateur dans `user_profiles`
- Validation des données côté client
- Messages d'erreur appropriés

### Connexion
- Authentification avec email/mot de passe
- Redirection vers l'écran principal après connexion
- Gestion des erreurs de connexion

### Sécurité
- Row Level Security (RLS) activé
- Politiques pour limiter l'accès aux données
- Validation côté serveur

## Utilisation dans l'application

### Création d'un compte
```typescript
const result = await createUser({
  email: 'user@example.com',
  password: 'password123',
  prenom: 'Jean',
  age: 25,
  genre: 'Homme'
});
```

### Connexion
```typescript
const result = await signIn('user@example.com', 'password123');
```

### Déconnexion
```typescript
const result = await signOut();
```

## Notes importantes

1. **Confirmation d'email**: Par défaut, Supabase envoie un email de confirmation. Vous pouvez désactiver cette fonctionnalité dans les paramètres d'authentification.

2. **Politiques RLS**: Les politiques garantissent que les utilisateurs ne peuvent accéder qu'à leurs propres données.

3. **Gestion d'erreurs**: L'application gère les erreurs courantes et affiche des messages appropriés à l'utilisateur.

4. **Validation**: La validation est effectuée côté client et serveur pour une meilleure sécurité. 