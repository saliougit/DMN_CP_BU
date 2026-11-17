"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeftRight, LogOut } from "lucide-react"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminBottomNav } from "@/components/admin/admin-bottom-nav"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { useAuth } from "@/contexts/auth-context"
import { AdminGuard } from "./AdminGuard"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { logout } = useAuth()

  function handleLogout() {
    logout()
    router.push("/")
  }

  return (
    <AdminGuard>
      <SidebarProvider>
        <AdminSidebar />
        <SidebarInset>
          <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border/60 px-3 sm:px-4">
            {/* Sidebar en tiroir réservée au desktop — navigation mobile = AdminBottomNav */}
            <SidebarTrigger className="-ml-1 hidden md:inline-flex" />
            <div className="ml-auto flex items-center gap-1 md:hidden">
              <ThemeToggle />
              <Link href="/" className="rounded p-1.5 text-muted-foreground hover:bg-muted transition-colors" aria-label="Espace membre">
                <ArrowLeftRight className="h-4 w-4" />
              </Link>
              <button onClick={handleLogout} className="rounded p-1.5 text-muted-foreground hover:bg-muted transition-colors" aria-label="Se déconnecter">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </header>
          <div className="flex-1 p-3 pb-20 sm:p-6 md:pb-6">{children}</div>
          <AdminBottomNav />
        </SidebarInset>
      </SidebarProvider>
    </AdminGuard>
  )
}
