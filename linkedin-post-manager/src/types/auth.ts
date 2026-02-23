import { User } from '@supabase/supabase-js'

// Use Supabase's User type directly
export type AuthUser = User

export interface AuthState {
  user: AuthUser | null
  loading: boolean
  error: string | null
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignUpCredentials {
  email: string
  password: string
  fullName?: string
}

export interface AuthResponse {
  success: boolean
  error?: string
  user?: AuthUser
}
