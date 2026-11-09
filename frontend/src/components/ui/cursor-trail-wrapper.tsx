"use client"

import { usePathname } from "next/navigation"
import { CursorTrail, useCursorTrailEnabled } from "./cursor-trail"

export function CursorTrailWrapper() {
  const pathname = usePathname()
  const { enabled, toggle } = useCursorTrailEnabled()

  // Pas d'effet curseur sur la partie admin : inutile pour un usage pro.
  if (pathname?.startsWith("/gestion")) return null

  return (
    <>
      <CursorTrail enabled={enabled} />
      {/* Bouton toggle discret en bas à droite */}
      <button
        onClick={toggle}
        title={enabled ? "Désactiver l'effet curseur" : "Activer l'effet curseur"}
        className="fixed bottom-4 right-4 z-[9997] hidden items-center gap-1.5 rounded-full border border-border/60 bg-background/80 backdrop-blur-sm px-2.5 py-1.5 text-[10px] text-muted-foreground shadow-sm hover:text-foreground hover:border-border transition-all opacity-40 hover:opacity-100 sm:flex"
      >
        <span
          className={`inline-block h-2 w-2 rounded-full transition-colors ${enabled ? "bg-primary" : "bg-muted-foreground/40"}`}
        />
        Effet curseur
      </button>
    </>
  )
}
