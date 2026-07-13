"use client"

import * as React from "react"
import { X } from "lucide-react"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

/**
 * Tailles disponibles pour le drawer
 * sm   → 480px   (formulaires simples)
 * md   → 640px   (détail standard)
 * lg   → 860px   (document avec viewer)
 * xl   → 1100px  (split layout)
 * full → 100vw - 48px (lecture document, viewer plein écran)
 */
const SIZE_CLASSES: Record<string, string> = {
  sm:   "sm:max-w-[480px]",
  md:   "sm:max-w-[640px]",
  lg:   "sm:max-w-[860px]",
  xl:   "sm:max-w-[1100px]",
  full: "sm:max-w-[calc(100vw-3rem)]",
}

interface AppDrawerProps {
  open: boolean
  onClose: () => void
  title: React.ReactNode
  description?: React.ReactNode
  size?: "sm" | "md" | "lg" | "xl" | "full"
  /**
   * Par défaut (true) : le corps est enveloppé dans un ScrollArea.
   * Mettre à false pour les layouts qui gèrent leur propre scroll (ex. split viewer).
   */
  scrollBody?: boolean
  children: React.ReactNode
  footer?: React.ReactNode
  titleExtra?: React.ReactNode
}

export function AppDrawer({
  open,
  onClose,
  title,
  description,
  size = "md",
  scrollBody = true,
  children,
  footer,
  titleExtra,
}: AppDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={(open) => !open && onClose()} disablePointerDismissal>
      <SheetContent
        showCloseButton={false}
        className={cn(
          "flex flex-col gap-0 p-0 h-full w-full",
          SIZE_CLASSES[size],
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border/60 px-5 py-4 flex-shrink-0">
          <div className="flex-1 min-w-0">
            {titleExtra && <div className="mb-1.5">{titleExtra}</div>}
            <SheetTitle className="text-base font-semibold leading-snug">
              {title}
            </SheetTitle>
            {description && (
              <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors mt-0.5"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Corps */}
        {scrollBody ? (
          <ScrollArea className="flex-1 overflow-hidden">
            <div className="h-full">{children}</div>
          </ScrollArea>
        ) : (
          <div className="flex-1 flex min-h-0 overflow-hidden">
            {children}
          </div>
        )}

        {/* Footer */}
        {footer && (
          <div className="flex items-center gap-2 border-t border-border/60 px-5 py-4 flex-shrink-0 bg-muted/20">
            {footer}
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
