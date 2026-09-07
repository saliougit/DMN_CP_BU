"use client"

import Link from "next/link"
import Image from "next/image"
import { BookOpen, LogIn, Upload, User, LogOut, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "./theme-toggle"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

export function PublicNavbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const router = useRouter()

  async function handleLogout() {
    await logout()
    router.push("/")
  }

  function handleSoumettre() {
    if (isAuthenticated) {
      router.push("/soumettre")
    } else {
      router.push("/connexion?from=/soumettre")
    }
  }

  const initials = user ? `${user.prenom.charAt(0)}${user.nom.charAt(0)}` : "?"

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-primary/20 group-hover:ring-primary/50 transition-all bg-white dark:bg-white p-0.5">
            <Image src="/logo.png" alt="Logo DMN" fill className="object-contain" priority />
          </div>
          <div className="hidden sm:block">
            <span className="block text-sm font-bold leading-tight text-primary">DMN-BU</span>
            <span className="block text-xs text-muted-foreground leading-tight">Bibliothèque Numérique</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <Button variant="ghost" size="sm" className="gap-2" onClick={handleSoumettre}>
            <Upload className="h-4 w-4" /> Déposer un document
          </Button>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger render={<span />} nativeButton={false}>
                <Button variant="ghost" size="sm" className="gap-2 px-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-xs font-medium">{user.prenom}</span>
                  <ChevronDown className="h-3 w-3 text-muted-foreground hidden sm:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => router.push("/profil")} className="gap-2 text-xs">
                  <User className="h-3.5 w-3.5" /> Mon profil
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/profil/mes-documents")} className="gap-2 text-xs">
                  <BookOpen className="h-3.5 w-3.5" /> Mes documents
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => router.push("/gestion")} className="gap-2 text-xs">
                    <BookOpen className="h-3.5 w-3.5" /> Administration
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleLogout} className="gap-2 text-xs text-destructive">
                  <LogOut className="h-3.5 w-3.5" /> Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link href="/connexion">
                <Button variant="ghost" size="sm" className="gap-2">
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">Connexion</span>
                </Button>
              </Link>
              <Link href="/inscription">
                <Button size="sm" className="gap-2 bg-primary hover:bg-primary/90">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">S&apos;inscrire</span>
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
