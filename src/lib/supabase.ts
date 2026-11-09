import { createClient } from '@supabase/supabase-js'

// Public values: the URL and publishable key are safe in the browser (RLS protects the data).
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? 'https://wzttcpnjnhsdhpcdqfhz.supabase.co'
export const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY ?? 'sb_publishable_BIQXh3rsye-CVUnKXeKnsg_8TmQtRDm'

// PKCE puts the login code in the query string (?code=...), which does not clash with the HashRouter.
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true },
})
