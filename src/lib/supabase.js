import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
      scopes: 'https://www.googleapis.com/auth/calendar.events',
    },
  })
  if (error) throw error
}

export async function fetchUserData(userId) {
  const { data, error } = await supabase
    .from('user_data')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) { console.error('fetchUserData error:', error); return null }
  return data
}

export async function upsertUserData(userId, updates) {
  const { error } = await supabase
    .from('user_data')
    .upsert(
      { user_id: userId, ...updates, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
  if (error) console.error('Cloud sync error:', error)
}
