"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Upload, FileText, X, Loader2, CheckCircle2, ArrowLeft, Sparkles } from "lucide-react"
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

// Format: PrenomNom__ANNEE__TYPE__CODE_FAC__NomFiliere.pdf
const TYPE_MAP: Record<string, string> = {
  master: "memoire_master",
  licence: "memoire_licence",
  doctorat: "these_doctorat",
  these: "these_doctorat",
  article: "article",
  rapport: "rapport",
}

function parseFilename(
  name: string,
  facultes: Faculte[]
): { titre?: string; type?: string; annee?: number; faculteId?: string; filiereId?: string; parsed: boolean } {
  const base = name.replace(/\.pdf$/i, "")
  const parts = base.split("__")
  if (parts.length < 3) return { parsed: false }

  const [auteurRaw, anneeRaw, typeRaw, codeFac, nomFiliere] = parts
  const annee = Number(anneeRaw)
  const type = TYPE_MAP[typeRaw?.toLowerCase?.() ?? ""]
  if (!type || !annee || annee < 1900 || annee > 2100) return { parsed: false }

  // Trouver faculté par code
  const fac = codeFac
    ? facultes.find((f) => f.code?.toLowerCase() === codeFac.toLowerCase()) ?? null
    : null
  const faculteId = fac?.id ?? ""

  // Trouver filière par nom
  const fil = nomFiliere && fac
    ? fac.filieres.find((fi) => fi.nom.toLowerCase().replace(/\s/g, "") === nomFiliere.toLowerCase().replace(/\s/g, ""))
    : null
  const filiereId = fil?.id ?? ""

  // Construire un titre proposé depuis le nom auteur + type
  const typeLabel: Record<string, string> = {
    memoire_master: "Mémoire de Master",
    memoire_licence: "Mémoire de Licence",
    these_doctorat: "Thèse de Doctorat",
    article: "Article",
    rapport: "Rapport",
  }
  const auteurPretty = auteurRaw.replace(/([a-z])([A-Z])/g, "$1 $2")

  return {
    parsed: true,
    type,
    annee,
    faculteId,
    filiereId,
    titre: `${typeLabel[type] ?? type} de ${auteurPretty} (${annee})`,
  }
}

export default function SoumettrePage() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [facultes, setFacultes] = useState<Faculte[]>([])
  const [niveaux, setNiveaux] = useState<Niveau[]>([])
  const [autoParsed, setAutoParsed] = useState(false)

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

  function handleFileSelect(f: File | null) {
    if (!f) { setFile(null); setAutoParsed(false); return }
    if (f.type !== "application/pdf") {
      toast.error("Format accepté : PDF uniquement")
      return
    }
    setFile(f)

    // Tenter le parsing automatique du nom de fichier
    if (facultes.length > 0) {
      const parsed = parseFilename(f.name, facultes)
      if (parsed.parsed) {
        setForm((prev) => ({
          ...prev,
          ...(parsed.type ? { type: parsed.type } : {}),
          ...(parsed.annee ? { annee: parsed.annee } : {}),
          ...(parsed.faculteId ? { faculteId: parsed.faculteId, filiereId: parsed.filiereId ?? "" } : {}),
          ...(parsed.titre && !prev.titre ? { titre: parsed.titre } : {}),
        }))
        setAutoParsed(true)
        toast.success("Fichier analysé", {
          description: "Les champs ont été pré-remplis depuis le nom de fichier.",
        })
      } else {
        setAutoParsed(false)
      }
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    handleFileSelect(e.dataTransfer.files[0] ?? null)
  }, [facultes]) // eslint-disable-line react-hooks/exhaustive-deps

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

  const selectCls = "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:border-primary"

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

        {/* Format hint */}
        <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 px-4 py-3 text-xs text-muted-foreground">
          <p className="font-medium text-foreground mb-1">Format de nom recommandé pour pré-remplissage automatique :</p>
          <code className="text-primary text-[11px]">PrenomNom__ANNEE__TYPE__CODE_FAC__NomFiliere.pdf</code>
          <p className="mt-1">Ex : <code className="text-primary">SaliouNiane__2026__master__FST__Informatique.pdf</code></p>
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
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{file.name}</p>
                    {autoParsed && (
                      <Badge className="text-[9px] gap-1 bg-primary/10 text-primary border-0 px-1.5 py-0">
                        <Sparkles className="h-2.5 w-2.5" /> Auto-parsé
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} Mo</p>
                </div>
                <button type="button" onClick={(e) => { e.stopPropagation(); setFile(null); setAutoParsed(false) }}
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
            <input id="submit-pdf" type="file" accept=".pdf,application/pdf" className="hidden"
              onChange={(e) => { handleFileSelect(e.target.files?.[0] ?? null) }} />
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
                    className={selectCls}>
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
                    className={selectCls} required>
                    <option value="">Choisir</option>
                    {facultes.map((f) => (<option key={f.id} value={f.id}>{f.nom}</option>))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Filière <span className="text-destructive">*</span></Label>
                  <select value={form.filiereId} onChange={(e) => setForm((f) => ({ ...f, filiereId: e.target.value }))}
                    disabled={!form.faculteId}
                    className={`${selectCls} disabled:opacity-50`} required>
                    <option value="">Choisir</option>
                    {filieres.map((fi) => (<option key={fi.id} value={fi.id}>{fi.nom}</option>))}
                  </select>
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs">Niveau <span className="text-destructive">*</span></Label>
                  <select value={form.niveauId} onChange={(e) => setForm((f) => ({ ...f, niveauId: e.target.value }))}
                    className={selectCls} required>
                    <option value="">Choisir</option>
                    {niveaux.map((n) => (<option key={n.id} value={n.id}>{n.nom}</option>))}
                  </select>
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs">Directeur de mémoire / Encadrant (optionnel)</Label>
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
