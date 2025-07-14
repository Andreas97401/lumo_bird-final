-- Script pour ajouter la colonne first_connection à la table user_profiles existante
-- Exécutez ce script dans l'éditeur SQL de Supabase si la table existe déjà

-- Ajouter la colonne first_connection si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'user_profiles' 
        AND column_name = 'first_connection'
    ) THEN
        ALTER TABLE user_profiles ADD COLUMN first_connection BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- Mettre à jour tous les utilisateurs existants pour qu'ils aient first_connection = FALSE
-- (car ils ont probablement déjà utilisé l'app)
UPDATE user_profiles 
SET first_connection = FALSE 
WHERE first_connection IS NULL OR first_connection = TRUE;

-- Vérifier que la colonne a été ajoutée
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name = 'first_connection'; 