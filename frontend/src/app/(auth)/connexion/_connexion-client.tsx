"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff, LogIn, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"

export function ConnexionClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const from = searchParams.get("from")
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const result = await login(email, password)
    setLoading(false)

    if (result.success) {
      toast.success("Connexion réussie", {
        description: result.role === "admin" ? "Bienvenue dans l'administration" : "Bienvenue sur DMN-BU",
      })
      if (result.role === "admin") {
        router.push("/admin")
      } else {
        // Retour à la page d'origine si redirigé par le guard, sinon catalogue
        router.push(from && from.startsWith("/") && !from.startsWith("/connexion") ? from : "/")
      }
    } else {
      toast.error("Connexion échouée", {
        description: result.error ?? "Vérifiez vos identifiants",
      })
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/20 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="relative h-16 w-16 overflow-hidden rounded-full ring-4 ring-primary/20 shadow-lg bg-white dark:bg-white p-1">
            <Image src="/logo.png" alt="Logo DMN" fill className="object-contain" priority />
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-primary">DMN-BU</h1>
            <p className="text-xs text-muted-foreground">Daara Madjmahoun Noreyni · UCAD · Dakar</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
          <div>
            <h2 className="text-base font-semibold">Connexion</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Accédez à votre espace personnel</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs">Adresse e-mail</Label>
              <Input id="email" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com" required className="h-10 text-sm rounded-lg" />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs">Mot de passe</Label>
                <Link href="/mot-de-passe" className="text-xs text-primary hover:underline">
                  Mot de passe oublié ?
                </Link>
              </div>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"}
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" required className="h-10 text-sm rounded-lg pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full gap-2 bg-primary hover:bg-primary/90" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              {loading ? "Connexion…" : "Se connecter"}
            </Button>
          </form>

          <Separator />

          <p className="text-center text-xs text-muted-foreground">
            Pas encore de compte ?{" "}
            <Link href="/inscription" className="text-primary font-medium hover:underline">
              Créer un compte
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors">← Retour au catalogue</Link>
        </p>
      </div>
    </div>
  )
}
