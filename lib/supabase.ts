import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Support multiple env var naming conventions
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY

// Lazy-initialized client to avoid build-time errors when env vars aren't available
let _supabaseClient: SupabaseClient | null = null

function getClient(): SupabaseClient {
  if (!_supabaseClient) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase URL or ANON/PUBLISHABLE key environment variables')
    }

    _supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
  }
  return _supabaseClient
}

// Use a Proxy to forward all property/method access to the lazy client
// This preserves the supabase.from('Table')... API without initializing at module load
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getClient()
    const value = (client as any)[prop]
    return typeof value === 'function' ? value.bind(client) : value
  },
})

// Server-side client with service role (for admin operations)
export function createServerClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase URL or SERVICE/SECRET key environment variables')
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

// Export URL/key for use in adapter config
export const supabaseConfig = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
  serviceKey: supabaseServiceKey,
}
