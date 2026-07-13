"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Mail, Loader2, CheckCircle2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function MotDePasseOubliePage() {
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await new Promise((r) => setTimeout(r, 1200))
    setSent(true)
    setLoading(false)
    toast.success("Email envoyé", { description: "Consultez votre boîte de réception." })
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
          {sent ? (
            <div className="text-center space-y-4 py-4">
              <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
              <h2 className="text-base font-semibold">Email envoyé</h2>
              <p className="text-xs text-muted-foreground">
                Si un compte existe avec cette adresse, vous recevrez un lien pour réinitialiser votre mot de passe.
              </p>
              <Link href="/connexion"><Button variant="outline" size="sm" className="gap-2"><ArrowLeft className="h-4 w-4" /> Retour à la connexion</Button></Link>
            </div>
          ) : (
            <>
              <div>
                <h2 className="text-base font-semibold">Mot de passe oublié</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Saisissez votre email pour recevoir un lien de réinitialisation.</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs">Adresse e-mail</Label>
                  <Input id="email" type="email" value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vous@exemple.com" required className="h-10 text-sm rounded-lg" />
                </div>
                <Button type="submit" className="w-full gap-2 bg-primary hover:bg-primary/90" disabled={loading}>
                  {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Envoi…</> : <><Mail className="h-4 w-4" /> Envoyer le lien</>}
                </Button>
              </form>
              <p className="text-center text-xs text-muted-foreground">
                <Link href="/connexion" className="text-primary hover:underline"><ArrowLeft className="h-3 w-3 inline" /> Retour à la connexion</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
