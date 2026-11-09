"use client"

import { useEffect, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { DmnLoader } from "@/components/ui/dmn-loader"

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
    return <DmnLoader fullscreen size="lg" />
  }

  if (!isAuthenticated) return null
  if (requiredRole === "admin" && user?.role !== "admin") return null

  return <>{children}</>
}
