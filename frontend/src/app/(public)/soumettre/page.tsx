"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Upload, FileText, X, Loader2, CheckCircle2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/contexts/auth-context"
import { api } from "@/lib/api"
import { toast } from "sonner"
import type { Faculte, Niveau } from "@/types"

export default function SoumettrePage() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [facultes, setFacultes] = useState<Faculte[]>([])
  const [niveaux, setNiveaux] = useState<Niveau[]>([])

  useEffect(() => {
    api.getFacultes().then(setFacultes).catch(() => {})
    api.getNiveaux().then(setNiveaux).catch(() => {})
  }, [])

  const [form, setForm] = useState({
    titre: "", type: "memoire_master",
    faculteId: "", filiereId: "", niveauId: "", annee: new Date().getFullYear(),
    directeur: "", resume: "",
  })

  const filieres = useMemo(
    () => facultes.find((f) => f.id === form.faculteId)?.filieres ?? [],
    [facultes, form.faculteId]
  )

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f?.type === "application/pdf") setFile(f)
    else toast.error("Format accepté : PDF uniquement")
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isAuthenticated) { router.push("/connexion"); return }
    if (!file) { toast.error("Veuillez sélectionner un fichier PDF"); return }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("titre", form.titre)
      fd.append("auteur", user ? `${user.prenom} ${user.nom}`.trim() : "")
      fd.append("type", form.type)
      fd.append("faculte", form.faculteId)
      fd.append("filiere", form.filiereId)
      fd.append("niveau", form.niveauId)
      fd.append("annee", String(form.annee))
      if (form.directeur) fd.append("directeur", form.directeur)
      if (form.resume) fd.append("resume", form.resume)
      fd.append("fichier", file)
      await api.soumettreDocument(fd)
      toast.success("Document soumis avec succès", {
        description: "Il sera vérifié par un administrateur avant publication.",
      })
      router.push("/profil/mes-documents")
    } catch (err: any) {
      toast.error("Erreur lors de la soumission", { description: err?.message ?? "Réessayez." })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" /> Retour à l&apos;accueil
      </Link>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Déposer un document</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Soumettez votre mémoire, thèse ou article. Un administrateur vérifiera et classera le document avant publication.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Zone drop */}
          <div
            onDragOver={(e) => { e.preventDefault() }}
            onDrop={handleDrop}
            onClick={() => document.getElementById("submit-pdf")?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all ${
              file ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted/30"
            }`}
          >
            {file ? (
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} Mo</p>
                </div>
                <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null) }}
                  className="rounded-full p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Déposer votre fichier PDF</p>
                <p className="text-xs text-muted-foreground mt-1">ou cliquez pour parcourir</p>
              </>
            )}
            <input id="submit-pdf" type="file" accept=".pdf" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) setFile(f) }} />
          </div>

          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs">Titre du document <span className="text-destructive">*</span></Label>
                  <Input value={form.titre} onChange={(e) => setForm((f) => ({ ...f, titre: e.target.value }))}
                    placeholder="Titre complet du mémoire / thèse / article" className="h-10 text-sm" required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Type <span className="text-destructive">*</span></Label>
                  <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:border-primary">
                    <option value="memoire_licence">Mémoire de Licence</option>
                    <option value="memoire_master">Mémoire de Master</option>
                    <option value="these_doctorat">Thèse de Doctorat</option>
                    <option value="article">Article</option>
                    <option value="rapport">Rapport</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Année de soutenance <span className="text-destructive">*</span></Label>
                  <Input type="number" value={form.annee} onChange={(e) => setForm((f) => ({ ...f, annee: Number(e.target.value) }))}
                    className="h-10 text-sm" required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Faculté <span className="text-destructive">*</span></Label>
                  <select value={form.faculteId} onChange={(e) => setForm((f) => ({ ...f, faculteId: e.target.value, filiereId: "" }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:border-primary" required>
                    <option value="">Choisir</option>
                    {facultes.map((f) => (<option key={f.id} value={f.id}>{f.nom}</option>))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Filière <span className="text-destructive">*</span></Label>
                  <select value={form.filiereId} onChange={(e) => setForm((f) => ({ ...f, filiereId: e.target.value }))}
                    disabled={!form.faculteId}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:border-primary disabled:opacity-50" required>
                    <option value="">Choisir</option>
                    {filieres.map((fi) => (<option key={fi.id} value={fi.id}>{fi.nom}</option>))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Niveau <span className="text-destructive">*</span></Label>
                  <select value={form.niveauId} onChange={(e) => setForm((f) => ({ ...f, niveauId: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:border-primary" required>
                    <option value="">Choisir</option>
                    {niveaux.map((n) => (<option key={n.id} value={n.id}>{n.nom}</option>))}
                  </select>
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs">Directeur de mémoire / encadreur (optionnel)</Label>
                  <Input value={form.directeur} onChange={(e) => setForm((f) => ({ ...f, directeur: e.target.value }))}
                    placeholder="Prof. Nom et prénom" className="h-10 text-sm" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs">Résumé (optionnel)</Label>
                  <Textarea value={form.resume} onChange={(e) => setForm((f) => ({ ...f, resume: e.target.value }))}
                    placeholder="Résumé du document (quelques phrases)" className="text-sm resize-none" rows={3} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" size="lg" className="w-full gap-2 bg-primary hover:bg-primary/90" disabled={uploading}>
            {uploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Envoi en cours…</>
              : <><Upload className="h-4 w-4" /> Soumettre pour validation</>}
          </Button>

          {!isAuthenticated && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800 px-4 py-3 text-xs text-amber-800 dark:text-amber-200">
              Vous devez être connecté pour soumettre un document.{' '}
              <Link href="/connexion" className="font-medium underline">Se connecter</Link>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
