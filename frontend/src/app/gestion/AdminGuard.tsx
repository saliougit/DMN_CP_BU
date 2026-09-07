"use client"

import { AuthGuard } from "@/components/auth/auth-guard"

export function AdminGuard({ children }: { children: React.ReactNode }) {
  return <AuthGuard requiredRole="admin">{children}</AuthGuard>
}
