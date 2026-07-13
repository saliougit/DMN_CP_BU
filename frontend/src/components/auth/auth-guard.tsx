"use client"

import { useEffect, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"

interface AuthGuardProps {
  children: ReactNode
  requiredRole?: "admin" | "membre"
}

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      router.replace(`/connexion?from=${encodeURIComponent(pathname)}`)
      return
    }
    if (requiredRole === "admin" && user?.role !== "admin") {
      router.replace("/")
    }
  }, [isLoading, isAuthenticated, user, requiredRole, router])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthenticated) return null
  if (requiredRole === "admin" && user?.role !== "admin") return null

  return <>{children}</>
}
