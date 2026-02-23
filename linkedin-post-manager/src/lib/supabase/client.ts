import { createBrowserClient } from '@supabase/ssr'

// Browser client for use in client components.
// Uses @supabase/ssr to automatically sync auth tokens with cookies,
// which is required for the middleware to read the session.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      isSingleton: true,
    }
  )
}

