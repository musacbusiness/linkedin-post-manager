import { User } from '@supabase/supabase-js'

export interface AuthUser extends User {
  email: string
  user_metadata?: {
    full_name?: string
    avatar_url?: string
  }
}

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
