import { createContext, useContext } from 'react'
import type { User } from 'firebase/auth'
import type { SelfRegistration } from './registration-policy'

export type AuthContextValue = {
  user: User | null
  loading: boolean
  profileReady: boolean
  profileLoading: boolean
  signUp: (registration: SelfRegistration) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  sendPasswordReset: (email: string) => Promise<void>
  resendVerification: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider.')
  return context
}
