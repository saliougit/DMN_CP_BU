"use client"

import { useState } from "react"
import { Mail, X } from "lucide-react"

function IconLinkedIn() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

function IconGitHub() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  )
}

export function ContactDrawer() {
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40 flex items-stretch">
      {/* Panel de contact — s'étend à gauche quand open */}
      {open && (
        <div className="flex flex-col gap-3 rounded-l-xl border border-r-0 border-border/60 bg-card px-4 py-4 shadow-md">
          {/* Nom + email */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
              BSN
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-foreground leading-tight">Baye Saliou Niane</p>
              <a href="mailto:nianebayezale@gmail.com"
                className="text-[10px] text-primary hover:underline transition-colors truncate block">
                nianebayezale@gmail.com
              </a>
            </div>
          </div>

          <div className="h-px bg-border/50" />

          {/* Icônes sociales */}
          <div className="flex items-center gap-2">
            <a href="mailto:nianebayezale@gmail.com"
              className="flex items-center justify-center h-8 w-8 rounded-lg border border-border/60 text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all"
              title="E-mail">
              <Mail className="h-4 w-4" />
            </a>
            <a href="https://www.linkedin.com/in/saliou-niane-a0a06523a" target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center h-8 w-8 rounded-lg border border-border/60 text-muted-foreground hover:text-blue-500 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all"
              title="LinkedIn">
              <IconLinkedIn />
            </a>
            <a href="https://github.com/saliougit" target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center h-8 w-8 rounded-lg border border-border/60 text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted transition-all"
              title="GitHub">
              <IconGitHub />
            </a>
          </div>
        </div>
      )}

      {/* Bouton trigger — tout vertical dans la même colonne */}
      <button
        onClick={() => setOpen(!open)}
        style={{ writingMode: "vertical-rl" }}
        className="flex items-center gap-2 rounded-l-lg border border-r-0 border-border/60 bg-card px-2.5 py-4 text-muted-foreground shadow-sm transition-all duration-200 hover:bg-accent hover:text-foreground hover:shadow-md cursor-pointer"
      >
        {open ? <X className="h-3.5 w-3.5" /> : <Mail className="h-3.5 w-3.5" />}
        <span className="text-[10px] tracking-wider">Contact</span>
      </button>
    </div>
  )
}
