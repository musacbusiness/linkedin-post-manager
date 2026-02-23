'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { AuthUser, LoginCredentials, SignUpCredentials, AuthResponse } from '@/types/auth'

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Use ref to keep stable Supabase client reference
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  // Listen for auth changes on mount - the only source of truth for auth state
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // This listener will fire immediately with the current session if one exists
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user as AuthUser | null)
      setLoading(false)
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  // Login with email/password
  async function login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      setError(null)

      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })

      if (error) {
        setError(error.message)
        return { success: false, error: error.message }
      }

      setUser(data.user as AuthUser)

      // Small delay to ensure state updates before navigation
      await new Promise(resolve => setTimeout(resolve, 100))

      router.push('/dashboard')

      return { success: true, user: data.user as AuthUser }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed'
      setError(message)
      return { success: false, error: message }
    }
  }

  // Sign up with email/password
  async function signUp(credentials: SignUpCredentials): Promise<AuthResponse> {
    try {
      setError(null)
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            full_name: credentials.fullName || '',
          },
        },
      })

      if (error) {
        setError(error.message)
        return { success: false, error: error.message }
      }

      setUser(data.user as AuthUser)
      router.push('/dashboard')
      return { success: true, user: data.user as AuthUser }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign up failed'
      setError(message)
      return { success: false, error: message }
    }
  }

  // Sign out
  async function signOut(): Promise<AuthResponse> {
    try {
      setError(null)
      const { error } = await supabase.auth.signOut()

      if (error) {
        setError(error.message)
        return { success: false, error: error.message }
      }

      setUser(null)
      router.push('/login')
      return { success: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign out failed'
      setError(message)
      return { success: false, error: message }
    }
  }

  return {
    user,
    loading,
    error,
    login,
    signUp,
    signOut,
    isAuthenticated: !!user,
  }
}
