import { createClient } from '@supabase/supabase-js'
import { serve } from 'std/server'

serve(async (req) => {
  // Récupère l'ID utilisateur à supprimer depuis le body JSON
  const { userId } = await req.json()

  // Crée un client Supabase avec la clé service role (jamais exposée côté client)
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Supprime l'utilisateur
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }
  return new Response(JSON.stringify({ success: true }), { status: 200 })
}) 