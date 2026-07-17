"use client"
import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { User, UserRole } from "@/types"
import { api, tokens } from "@/lib/api"

interface AuthResult { success: boolean; role?: UserRole; error?: string }

interface AuthCtx {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  login: (email: string, password: string) => Promise<AuthResult>
  register: (form: Record<string, string>) => Promise<AuthResult>
  logout: () => Promise<void>
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Restaurer la session depuis le token stocké
  useEffect(() => {
    const restore = async () => {
      if (tokens.getAccess()) {
        try {
          const me = await api.me()
          setUser(me)
        } catch {
          tokens.clear()
        }
      }
      setIsLoading(false)
    }
    restore()
  }, [])

  async function login(email: string, password: string): Promise<AuthResult> {
    setIsLoading(true)
    try {
      const { user: me } = await api.login(email, password)
      setUser(me)
      return { success: true, role: me.role }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Identifiants incorrects" }
    } finally {
      setIsLoading(false)
    }
  }

  async function register(form: Record<string, string>): Promise<AuthResult> {
    setIsLoading(true)
    try {
      await api.register({
        username:   form.email,
        email:      form.email,
        first_name: form.prenom,
        last_name:  form.nom,
        password:   form.password,
        telephone:  form.telephone,
      })
      // Connexion automatique après inscription
      return login(form.email, form.password)
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Erreur lors de l'inscription" }
    } finally {
      setIsLoading(false)
    }
  }

  async function logout() {
    await api.logout()  // blackliste le refresh token côté serveur
    setUser(null)
  }

  return (
    <Ctx.Provider value={{
      user,
      isLoading,
      isAuthenticated: user !== null,
      isAdmin:         user?.role === "admin",
      login,
      register,
      logout,
    }}>
      {children}
    </Ctx.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useAuth doit être dans AuthProvider")
  return ctx
}
