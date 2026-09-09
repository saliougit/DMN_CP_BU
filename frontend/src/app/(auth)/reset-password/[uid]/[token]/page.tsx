"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Loader2, Lock, CheckCircle2, Eye, EyeOff } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { api } from "@/lib/api"

export default function ResetPasswordPage() {
  const params = useParams<{ uid: string; token: string }>()
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { toast.error("Les mots de passe ne correspondent pas"); return }
    if (password.length < 8) { toast.error("8 caractères minimum"); return }
    setLoading(true)
    try {
      await api.confirmPasswordReset(params.uid, params.token, password)
      setDone(true)
      toast.success("Mot de passe mis à jour")
      setTimeout(() => router.push("/connexion"), 2000)
    } catch (err: any) {
      toast.error(err?.message ?? "Lien invalide ou expiré")
    } finally {
      setLoading(false)
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
            <h1 className="text-xl font-bold text-primary">DMN-BN</h1>
            <p className="text-xs text-muted-foreground">Daara Madjmahoun Noreyni · UCAD · Dakar</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
          {done ? (
            <div className="text-center space-y-4 py-4">
              <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
              <h2 className="text-base font-semibold">Mot de passe mis à jour</h2>
              <p className="text-xs text-muted-foreground">Redirection vers la connexion…</p>
            </div>
          ) : (
            <>
              <div>
                <h2 className="text-base font-semibold">Nouveau mot de passe</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Choisissez un mot de passe d'au moins 8 caractères.</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="pwd" className="text-xs">Nouveau mot de passe</Label>
                  <div className="relative">
                    <Input id="pwd" type={showPwd ? "text" : "password"} value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="8 caractères minimum" required className="h-10 text-sm rounded-lg pr-10" />
                    <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPwd((v) => !v)}>
                      {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm" className="text-xs">Confirmer</Label>
                  <Input id="confirm" type={showPwd ? "text" : "password"} value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Répétez le mot de passe" required className="h-10 text-sm rounded-lg" />
                </div>
                <Button type="submit" className="w-full gap-2 bg-primary hover:bg-primary/90" disabled={loading}>
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Enregistrement…</> : <><Lock className="h-4 w-4" /> Enregistrer</>}
                </Button>
              </form>
              <p className="text-center text-xs text-muted-foreground">
                <Link href="/connexion" className="text-primary hover:underline">Retour à la connexion</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
