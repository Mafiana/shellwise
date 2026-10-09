// Runtime configuration (set in .env, see .env.example). Nothing secret belongs here: these values ship to the browser.
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || ''
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
// 'supabase' when keys are present, otherwise a browser-only demo backend so the app still runs.
export const BACKEND = SUPABASE_URL && SUPABASE_ANON_KEY ? 'supabase' : 'local'
// Turn on only after the Paystack Edge Functions are deployed (see README).
export const PAYMENTS_ENABLED = BACKEND === 'supabase' && import.meta.env.VITE_PAYMENTS === 'on'
