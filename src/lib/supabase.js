import { createClient } from '@supabase/supabase-js'
import { BACKEND, SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js'

// Only the public anon key is used here. Row Level Security (supabase/schema.sql) decides what a user may read or change.
export const supabase =
  BACKEND === 'supabase'
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
    : null
