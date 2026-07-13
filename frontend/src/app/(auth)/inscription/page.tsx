"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, UserPlus, Loader2, CheckCircle2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/contexts/auth-context"
import { MOCK_FACULTES, MOCK_NIVEAUX } from "@/lib/mock-data"
import { toast } from "sonner"

const ETAPES = ["Identité", "Scolarité", "Sécurité"]

export default function InscriptionPage() {
  const router = useRouter()
  const { register } = useAuth()
  const [etape, setEtape] = useState(0)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const [form, setForm] = useState({
    nom: "", prenom: "", email: "",
    faculte: "", filiere: "", niveau: "",
    password: "", confirm: "",
  })

  function setField(field: string, value: string) {
    setForm((f) => {
      const update: typeof f = { ...f, [field]: value }
      if (field === "faculte") { update.filiere = "" }
      return update
    })
  }

  const filieresDispo = useMemo(
    () => MOCK_FACULTES.find((f) => f.nom === form.faculte)?.filieres ?? [],
    [form.faculte]
  )

  const etape0Valide = form.nom && form.prenom && form.email
  const etape1Valide = form.faculte && form.filiere && form.niveau
  const etape2Valide = form.password.length >= 8 && form.password === form.confirm

  function suivant() {
    if (etape < ETAPES.length - 1) setEtape((e) => e + 1)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const result = await register(form)
    setLoading(false)

    if (result.success) {
      toast.success("Compte créé avec succès !", {
        description: "Bienvenue sur DMN-BU. Vous pouvez maintenant déposer vos documents.",
      })
      router.push("/profil")
    } else {
      toast.error("Erreur d'inscription", {
        description: result.error ?? "Une erreur est survenue",
      })
    }
  }

  const progressPwd = Math.min(100, (form.password.length / 8) * 100)

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
            <h2 className="text-base font-semibold">Créer un compte</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Étape {etape + 1} sur {ETAPES.length} — {ETAPES[etape]}
            </p>
          </div>

          <div className="flex gap-1">
            {ETAPES.map((_, i) => (
              <div key={i} className={`h-1.5 flex-1 rounded-full transition-all ${i <= etape ? "bg-primary" : "bg-border"}`} />
            ))}
          </div>

          <form
            onSubmit={etape === 2 ? handleSubmit : (e) => { e.preventDefault(); suivant() }}
            className="space-y-4"
          >
            {etape === 0 && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Prénom</Label>
                    <Input value={form.prenom} onChange={(e) => setField("prenom", e.target.value)}
                      placeholder="Moussa" className="h-10 text-sm rounded-lg" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Nom</Label>
                    <Input value={form.nom} onChange={(e) => setField("nom", e.target.value)}
                      placeholder="Diallo" className="h-10 text-sm rounded-lg" required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Adresse e-mail</Label>
                  <Input type="email" value={form.email} onChange={(e) => setField("email", e.target.value)}
                    placeholder="vous@exemple.com" className="h-10 text-sm rounded-lg" required />
                </div>
              </>
            )}

            {etape === 1 && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs">Faculté / École</Label>
                  <select value={form.faculte} onChange={(e) => setField("faculte", e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors" required>
                    <option value="">Choisir une faculté</option>
                    {MOCK_FACULTES.map((f) => (<option key={f.id} value={f.nom}>{f.nom}</option>))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Filière</Label>
                  <select value={form.filiere} onChange={(e) => setField("filiere", e.target.value)}
                    disabled={!form.faculte}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors disabled:opacity-50" required>
                    <option value="">Choisir une filière</option>
                    {filieresDispo.map((fi) => (<option key={fi.id} value={fi.nom}>{fi.nom}</option>))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Niveau actuel</Label>
                  <select value={form.niveau} onChange={(e) => setField("niveau", e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors" required>
                    <option value="">Choisir un niveau</option>
                    {MOCK_NIVEAUX.map((n) => (<option key={n.id} value={n.nom}>{n.nom}</option>))}
                  </select>
                </div>
              </>
            )}

            {etape === 2 && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-xs">Mot de passe</Label>
                  <div className="relative">
                    <Input type={showPassword ? "text" : "password"}
                      value={form.password} onChange={(e) => setField("password", e.target.value)}
                      placeholder="Minimum 8 caractères" className="h-10 text-sm rounded-lg pr-10"
                      required minLength={8} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {form.password.length > 0 && <Progress value={progressPwd} className="h-1" />}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Confirmer le mot de passe</Label>
                  <div className="relative">
                    <Input type="password" value={form.confirm} onChange={(e) => setField("confirm", e.target.value)}
                      placeholder="Répéter le mot de passe" className="h-10 text-sm rounded-lg pr-10" required />
                    {form.confirm && form.password === form.confirm && (
                      <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                    )}
                  </div>
                  {form.confirm && form.password !== form.confirm && (
                    <p className="text-xs text-destructive">Les mots de passe ne correspondent pas</p>
                  )}
                </div>

                <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">Récapitulatif</p>
                  <p>{form.prenom} {form.nom} · {form.email}</p>
                  <p>{form.faculte} · {form.filiere} · {form.niveau}</p>
                </div>
              </>
            )}

            <div className="flex gap-2 pt-1">
              {etape > 0 && (
                <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => setEtape((e) => e - 1)}>
                  Précédent
                </Button>
              )}
              <Button type="submit" size="sm" className="flex-1 gap-2 bg-primary hover:bg-primary/90"
                disabled={
                  (etape === 0 && !etape0Valide) ||
                  (etape === 1 && !etape1Valide) ||
                  (etape === 2 && (!etape2Valide || loading))
                }>
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Création…</>
                ) : etape === 2 ? (
                  <><UserPlus className="h-4 w-4" /> Créer mon compte</>
                ) : "Suivant →"}
              </Button>
            </div>
          </form>

          <Separator />

          <p className="text-center text-xs text-muted-foreground">
            Déjà un compte ?{" "}
            <Link href="/connexion" className="text-primary font-medium hover:underline">
              Se connecter
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
