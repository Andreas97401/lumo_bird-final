import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mvypwnihbkqnavrxwmyi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12eXB3bmloYmtxbmF2cnh3bXlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNTkyODAsImV4cCI6MjA2NzkzNTI4MH0.kjmJG-ruOCKbRfkb19_D68HnZoQ-pNdRD2_3QlOLnFk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types pour l'utilisateur
export interface UserProfile {
  id: string;
  email: string;
  prenom: string;
  age: number;
  genre: string;
  created_at?: string;
  updated_at?: string;
}

// Fonction pour créer un utilisateur
export const createUser = async (userData: {
  email: string;
  password: string;
  prenom: string;
  age: number;
  genre: string;
  first_connection?: boolean;
}) => {
  try {
    console.log('Début de la création de l\'utilisateur:', { email: userData.email, prenom: userData.prenom });
    
    // Créer l'utilisateur dans auth.users
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
    });

    console.log('Résultat auth.signUp:', { authData, authError });

    if (authError) {
      console.error('Erreur auth.signUp:', authError);
      throw authError;
    }

    if (!authData.user) {
      console.error('Aucun utilisateur créé dans auth.users');
      throw new Error('Aucun utilisateur créé');
    }

    console.log('Utilisateur créé dans auth.users:', authData.user.id);

    // Vérifier si la table user_profiles existe
    const { data: tableCheck, error: tableError } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1);

    console.log('Vérification table user_profiles:', { tableCheck, tableError });

    if (tableError) {
      console.error('Erreur lors de la vérification de la table user_profiles:', tableError);
      // Si la table n'existe pas, on crée juste l'utilisateur dans auth.users
      return { 
        success: true, 
        user: authData.user,
        message: 'Compte créé avec succès. La table user_profiles n\'existe pas encore.'
      };
    }

    // Insérer les données supplémentaires dans la table user_profiles
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .insert([
        {
          id: authData.user.id,
          email: userData.email,
          prenom: userData.prenom,
          age: userData.age,
          genre: userData.genre,
          first_connection: userData.first_connection ?? true,
        }
      ])
      .select();

    console.log('Résultat insertion user_profiles:', { profileData, profileError });

    if (profileError) {
      console.error('Erreur lors de l\'insertion dans user_profiles:', profileError);
      // Même si l'insertion dans user_profiles échoue, l'utilisateur est créé dans auth.users
      return { 
        success: true, 
        user: authData.user,
        message: 'Compte créé avec succès. Erreur lors de la sauvegarde du profil.'
      };
    }

    return { success: true, user: authData.user };
  } catch (error) {
    console.error('Erreur complète lors de la création de l\'utilisateur:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    };
  }
};

// Fonction pour se connecter
export const signIn = async (email: string, password: string) => {
  try {
    console.log('Tentative de connexion pour:', email);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log('Résultat signIn:', { data, error });

    if (error) {
      console.error('Erreur de connexion:', error);
      throw error;
    }

    return { success: true, user: data.user };
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur de connexion'
    };
  }
};

// Fonction pour se déconnecter
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    return { success: true };
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur de déconnexion'
    };
  }
};

// Recherche d'utilisateurs par pseudo ou email (hors amis déjà ajoutés et soi-même)
export const searchUsersByPseudoOrEmail = async (query: string, excludeIds: string[]): Promise<UserProfile[]> => {
  if (!query || query.length < 2) return [];
  let filter = `prenom.ilike.%${query}%,email.ilike.%${query}%`;
  let req = supabase
    .from('user_profiles')
    .select('id, prenom, email, age, genre')
    .or(filter);
  if (excludeIds.length > 0) req = req.not('id', 'in', `(${excludeIds.join(',')})`);
  const { data, error } = await req;
  if (error) {
    console.error('Erreur recherche utilisateurs:', error);
    return [];
  }
  return data || [];
};