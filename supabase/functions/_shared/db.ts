import { createClient } from 'npm:@supabase/supabase-js@2.45.4'

// Service-role client: bypasses RLS. Only used inside edge functions.
export const db = () =>
  createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  })

export const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), { status, headers: { 'content-type': 'application/json' } })

// Cron calls carry a shared secret as a bearer token. The secret lives in the
// database (private.config) and is checked through a service-role-only function.
export async function authorized(req: Request) {
  const auth = req.headers.get('authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token) return false
  const env = Deno.env.get('CRON_SECRET')
  if (env) return token === env
  const { data, error } = await db().rpc('check_cron_secret', { s: token })
  return !error && data === true
}
