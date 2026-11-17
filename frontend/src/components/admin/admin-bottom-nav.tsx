"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { LayoutDashboard, ClipboardList, BookMarked, FolderTree, Users } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"

const ITEMS: { title: string; href: string; icon: LucideIcon; badge?: true }[] = [
  { title: "Accueil", href: "/gestion", icon: LayoutDashboard },
  { title: "Soumissions", href: "/gestion/soumissions", icon: ClipboardList, badge: true },
  { title: "Documents", href: "/gestion/documents", icon: BookMarked },
  { title: "Classification", href: "/gestion/classification", icon: FolderTree },
  { title: "Membres", href: "/gestion/membres", icon: Users },
]

// Barre de navigation fixe en bas de l'écran sur mobile — remplace le
// sidebar en tiroir (pas adapté : un panneau latéral de 288px n'a pas sa
// place sur un petit écran). Visible uniquement sous md, sidebar classique
// inchangée au-dessus (voir gestion/layout.tsx).
export function AdminBottomNav() {
  const pathname = usePathname()
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    api.getDocumentsAdmin({ statut: "en_attente" })
      .then((docs) => setPendingCount(docs.length))
      .catch(() => {})
  }, [])

  function isActive(href: string) {
    return href === "/gestion" ? pathname === "/gestion" : pathname.startsWith(href)
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-border bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label="Navigation administration"
    >
      {ITEMS.map((item) => {
        const active = isActive(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
              active ? "text-primary" : "text-muted-foreground"
            )}
          >
            <span className="relative">
              <item.icon className="h-5 w-5" />
              {item.badge && pendingCount > 0 && (
                <span className="absolute -top-1 -right-1.5 h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
              )}
            </span>
            {item.title}
          </Link>
        )
      })}
    </nav>
  )
}
