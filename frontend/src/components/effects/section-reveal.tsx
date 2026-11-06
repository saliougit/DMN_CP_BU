"use client"

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react"
import { cn } from "@/lib/utils"

export type RevealVariant =
  | "fade-up" | "fade-down" | "fade-left" | "fade-right"
  | "zoom-in" | "blur-in" | "rise"

type VariantStyle = { in: string; out: string; duration: string }

export const REVEAL_VARIANTS: Record<RevealVariant, VariantStyle> = {
  "fade-up":   { out: "opacity-0 translate-y-12",  in: "opacity-100 translate-y-0", duration: "duration-700" },
  "fade-down": { out: "opacity-0 -translate-y-12", in: "opacity-100 translate-y-0", duration: "duration-700" },
  "fade-left": { out: "opacity-0 -translate-x-16", in: "opacity-100 translate-x-0", duration: "duration-700" },
  "fade-right":{ out: "opacity-0 translate-x-16",  in: "opacity-100 translate-x-0", duration: "duration-700" },
  "zoom-in":   { out: "opacity-0 scale-90",        in: "opacity-100 scale-100",     duration: "duration-700" },
  "blur-in":   { out: "opacity-0 blur-md",         in: "opacity-100 blur-none",     duration: "duration-700" },
  rise:        { out: "opacity-0 translate-y-20",  in: "opacity-100 translate-y-0", duration: "duration-1000" },
}

function useReplayInView() {
  const ref = useRef<HTMLElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    if (prefersReduced || typeof IntersectionObserver === "undefined") {
      setShown(true)
      return
    }

    // Un seuil de ratio (ex: "12% du bloc visible") echoue des qu'un bloc
    // est plus haut que l'ecran — frequent sur mobile (viewport court, texte
    // qui passe a la ligne) — car ce ratio reste alors inatteignable meme a
    // 100% d'ecran rempli, et l'animation restait bloquee a l'etat invisible.
    // isIntersecting seul (threshold 0) ne depend jamais de la hauteur du
    // bloc : des qu'un pixel entre dans la zone visible, c'est declenche.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return
        setShown(entry.isIntersecting)
      },
      { threshold: 0, rootMargin: "0px 0px -8% 0px" }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return { ref, shown }
}

/**
 * Enveloppe une section entiere : apparait quand le scroll l'atteint,
 * disparait quand elle en sort, et rejoue a chaque passage (aller-retour).
 */
export function SectionReveal({
  children, variant = "fade-up", delay = 0, className,
}: { children: ReactNode; variant?: RevealVariant; delay?: number; className?: string }) {
  const { ref, shown } = useReplayInView()
  const style = REVEAL_VARIANTS[variant]

  return (
    <div ref={ref as React.RefObject<HTMLDivElement>} className={cn("overflow-clip", className)}>
      <div
        className={cn(
          "transition-all ease-[cubic-bezier(0.16,1,0.3,1)]",
          style.duration,
          shown ? style.in : style.out,
          !shown && "pointer-events-none"
        )}
        style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      >
        {children}
      </div>
    </div>
  )
}

/**
 * Revele un element interne (badge, titre, bouton...) avec sa propre
 * variante/delai — permet une cascade a l'interieur d'un SectionReveal.
 */
export function SectionRevealItem({
  children, variant = "fade-up", delay = 0, as = "div", className,
}: { children: ReactNode; variant?: RevealVariant; delay?: number; as?: ElementType; className?: string }) {
  const { ref, shown } = useReplayInView()
  const style = REVEAL_VARIANTS[variant]
  const Tag = as

  return (
    <Tag
      ref={ref}
      className={cn(
        "block",
        className,
        "transition-all ease-[cubic-bezier(0.16,1,0.3,1)]",
        style.duration,
        shown ? style.in : style.out,
        !shown && "pointer-events-none"
      )}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  )
}
