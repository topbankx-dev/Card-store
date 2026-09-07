import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Support multiple env var naming conventions
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || ''

// Lazy-initialized clients to avoid build-time errors
let _supabaseClient: SupabaseClient | null = null
let _serverClient: SupabaseClient | null = null

function getClient(): SupabaseClient {
  if (!_supabaseClient) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables')
    }
    _supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
  }
  return _supabaseClient
}

function getServerClient(): SupabaseClient {
  if (!_serverClient) {
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY environment variables')
    }
    _serverClient = createClient(supabaseUrl, supabaseServiceKey)
  }
  return _serverClient
}

// Use a Proxy for the anon client — lazy initializes only when methods are called
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getClient()
    const value = (client as any)[prop]
    return typeof value === 'function' ? value.bind(client) : value
  },
})

// Server-side client with service role (for admin operations)
// Returns a Proxy that lazy-initializes when methods are called
export function createServerClient(): SupabaseClient {
  // Return a Proxy that defers getServerClient() until first method access
  return new Proxy({} as SupabaseClient, {
    get(_target, prop) {
      const client = getServerClient()
      const value = (client as any)[prop]
      return typeof value === 'function' ? value.bind(client) : value
    },
  })
}

// Export URL/key for use in adapter config
export const supabaseConfig = {
  url: supabaseUrl || undefined,
  anonKey: supabaseAnonKey || undefined,
  serviceKey: supabaseServiceKey || undefined,
}
