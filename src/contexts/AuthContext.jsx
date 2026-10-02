import { useEffect, useState } from 'react'
import { getUserRole, signIn as supabaseSignIn, signOut as supabaseSignOut } from '../lib/api'
import { supabase } from '../lib/supabase'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    const loadRole = async (userId) => {
      try {
        const nextRole = await getUserRole(userId)
        if (active) {
          setRole(nextRole)
          setError('')
        }
      } catch (cause) {
        if (active) setError(cause.message || 'Could not load your account role.')
      }
    }

    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return
      if (sessionError) setError(sessionError.message)
      const currentSession = data?.session ?? null
      setSession(currentSession)
      setLoading(false)
      if (currentSession?.user) void loadRole(currentSession.user.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      if (!nextSession) {
        setRole(null)
        return
      }
      queueMicrotask(() => void loadRole(nextSession.user.id))
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email, password) => {
    setError('')
    const data = await supabaseSignIn(email, password)
    setSession(data.session)
    const nextRole = await getUserRole(data.user.id)
    setRole(nextRole)
    return { ...data, role: nextRole }
  }

  const signOut = async () => {
    setError('')
    await supabaseSignOut()
    setSession(null)
    setRole(null)
  }

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, role, loading, error, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
