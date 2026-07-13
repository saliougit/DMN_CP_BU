"use client"
import { createContext, useContext, useState, type ReactNode } from "react"
import type { User, UserRole } from "@/types"
import { MOCK_USERS, MOCK_PASSWORDS } from "@/lib/mock-users"

interface AuthResult { success: boolean; role?: UserRole; error?: string }
interface AuthCtx {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  login: (email: string, password: string) => Promise<AuthResult>
  register: (form: Record<string, string>) => Promise<AuthResult>
  logout: () => void
}
const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function login(email: string, password: string): Promise<AuthResult> {
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    setIsLoading(false)

    // Cherche dans les utilisateurs mock avec mot de passe enregistré
    const knownUser = MOCK_USERS.find((u) => u.email === email)
    if (knownUser) {
      const expectedPassword = MOCK_PASSWORDS[email]
      if (expectedPassword && password !== expectedPassword) {
        return { success: false, error: "Mot de passe incorrect" }
      }
      setUser(knownUser)
      return { success: true, role: knownUser.role }
    }

    // Compte visiteur anonyme : n'importe quel email + mdp ≥ 4 caractères
    if (email && password.length >= 4) {
      const u: User = { id: "u_new", nom: "Utilisateur", prenom: "Membre", email, role: "membre", createdAt: new Date().toISOString() }
      setUser(u); return { success: true, role: "membre" }
    }

    return { success: false, error: "Identifiants incorrects" }
  }

  async function register(form: Record<string, string>): Promise<AuthResult> {
    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 1000))
    setIsLoading(false)
    const u: User = { id: `u_${Date.now()}`, nom: form.nom, prenom: form.prenom, email: form.email, role: "membre", niveau: form.niveau, faculte: form.faculte, filiere: form.filiere, createdAt: new Date().toISOString() }
    setUser(u); return { success: true, role: "membre" }
  }

  function logout() { setUser(null) }

  const isAuthenticated = user !== null
  const isAdmin = user?.role === "admin"

  return <Ctx.Provider value={{ user, isLoading, isAuthenticated, isAdmin, login, register, logout }}>{children}</Ctx.Provider>
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error("useAuth doit être dans AuthProvider")
  return ctx
}
