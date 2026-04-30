// js/supabase-client.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const SUPABASE_URL = 'https://ezuajvsramdykpfshhex.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_...' // ← вставь полный ключ!

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

export async function getCurrentUser() {
  const {  { user }, error } = await supabase.auth.getUser()
  return error ? null : user
}
