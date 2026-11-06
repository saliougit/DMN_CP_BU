import type { Metadata } from "next"
import { Geist, Geist_Mono, Literata } from "next/font/google"
import { ThemeProvider } from "next-themes"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { CursorTrailWrapper } from "@/components/ui/cursor-trail-wrapper"
import "./globals.css"

const geistSans = Geist({ variable: "--font-sans", subsets: ["latin"] })
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] })
// Police "livre" (conçue pour Google Play Books) pour les titres — look
// bibliothèque/académique, distincte du sans-serif utilitaire du reste de l'UI.
const literata = Literata({ variable: "--font-literata", subsets: ["latin"], weight: ["500", "600", "700", "800"] })

export const metadata: Metadata = {
  title: "DMN-BN | Bibliothèque Numérique",
  description:
    "Plateforme de consultation et de dépôt de mémoires, licences et thèses des membres du Daara Madjmahoun Noreyni (DMN) — UCAD, Dakar.",
  keywords: ["bibliothèque", "mémoires", "thèses", "mouride", "daara", "recherche"],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} ${literata.variable} h-full`}>
      <body className="min-h-full antialiased" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <TooltipProvider>
              <CursorTrailWrapper />
              {children}
              <Toaster richColors position="top-right" />
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
