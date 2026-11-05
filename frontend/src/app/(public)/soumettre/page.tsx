"use client"

import { useState, useCallback, useEffect, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Upload, FileText, X, Loader2, CheckCircle2, ArrowLeft, Sparkles, Plus, AlertCircle } from "lucide-react"
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
import { TYPE_LABELS } from "@/lib/document-types"

// Format: PrenomNom__ANNEE__TYPE__CODE_FAC__NomFiliere.pdf
const TYPE_MAP: Record<string, string> = {
  master: "memoire_master",
  licence: "memoire_licence",
  doctorat: "these_doctorat",
  these: "these_doctorat",
  article: "article",
  rapport: "rapport",
}

interface FileEntry {
  id: string
  file: File
  titre: string
  titreAuto: boolean
  annee: number
  parsed: boolean
  status: "pending" | "uploading" | "done" | "error"
  error?: string
}

function parseFilename(
  name: string,
  facultes: Faculte[]
): { type?: string; annee?: number; faculteId?: string; filiereId?: string; parsed: boolean } {
  const base = name.replace(/\.pdf$/i, "")
  const parts = base.split("__")
  if (parts.length < 3) return { parsed: false }

  const [, anneeRaw, typeRaw, codeFac, nomFiliere] = parts
  const annee = Number(anneeRaw)
  const type = TYPE_MAP[typeRaw?.toLowerCase?.() ?? ""]
  if (!type || !annee || annee < 1900 || annee > 2100) return { parsed: false }

  const fac = codeFac
    ? facultes.find((f) => f.code?.toLowerCase() === codeFac.toLowerCase()) ?? null
    : null
  const faculteId = fac?.id ?? ""

  const fil = nomFiliere && fac
    ? fac.filieres.find((fi) => fi.nom.toLowerCase().replace(/\s/g, "") === nomFiliere.toLowerCase().replace(/\s/g, ""))
    : null
  const filiereId = fil?.id ?? ""

  return { parsed: true, type, annee, faculteId, filiereId }
}

export default function SoumettrePage() {
  const router = useRouter()
  const { isAuthenticated, user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [entries, setEntries] = useState<FileEntry[]>([])
  const [uploading, setUploading] = useState(false)
  const [facultes, setFacultes] = useState<Faculte[]>([])
  const [niveaux, setNiveaux] = useState<Niveau[]>([])

  useEffect(() => {
    api.getFacultes().then(setFacultes).catch(() => {})
    api.getNiveaux().then(setNiveaux).catch(() => {})
  }, [])

  const [form, setForm] = useState({
    type: "memoire_master",
    faculteId: "", filiereId: "", niveauId: "",
    directeur: "", resume: "",
  })

  const filieres = useMemo(
    () => facultes.find((f) => f.id === form.faculteId)?.filieres ?? [],
    [facultes, form.faculteId]
  )

  function computeTitre(type: string, annee: number) {
    const typeLabel = TYPE_LABELS[type] ?? type
    const auteur = user ? `${user.prenom} ${user.nom}`.trim() : ""
    return [auteur ? `${typeLabel} — ${auteur}` : typeLabel, annee].filter(Boolean).join(" | ")
  }

  function addFiles(rawFiles: FileList | File[]) {
    const arr = Array.from(rawFiles)
    const pdfs = arr.filter((f) => f.type === "application/pdf" || f.name.endsWith(".pdf"))
    const invalid = arr.length - pdfs.length
    if (invalid > 0) toast.error(`${invalid} fichier${invalid > 1 ? "s" : ""} ignoré${invalid > 1 ? "s" : ""} — PDF uniquement`)

    const newEntries: FileEntry[] = pdfs.map((f) => {
      const parsed = facultes.length > 0 ? parseFilename(f.name, facultes) : { parsed: false }
      if (parsed.parsed && parsed.type) {
        setForm((prev) => ({
          ...prev,
          type: parsed.type!,
          ...(parsed.faculteId ? { faculteId: parsed.faculteId, filiereId: parsed.filiereId ?? "" } : {}),
        }))
      }
      const type = parsed.type ?? form.type
      const annee = parsed.annee ?? new Date().getFullYear()
      return {
        id: crypto.randomUUID(),
        file: f,
        titre: computeTitre(type, annee),
        titreAuto: true,
        annee,
        parsed: parsed.parsed,
        status: "pending",
      }
    })

    if (newEntries.length > 0) {
      setEntries((prev) => [...prev, ...newEntries])
      if (newEntries.some((e) => e.parsed)) {
        toast.success("Fichier(s) analysé(s)", { description: "Type, faculté et filière ont été pré-remplis depuis les noms de fichiers." })
      }
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    addFiles(e.dataTransfer.files)
  }, [facultes]) // eslint-disable-line react-hooks/exhaustive-deps

  function removeEntry(id: string) {
    setEntries((prev) => prev.filter((e) => e.id !== id))
  }

  function updateEntry(id: string, field: "titre" | "annee", value: string | number) {
    setEntries((prev) => prev.map((e) => {
      if (e.id !== id) return e
      if (field === "titre") return { ...e, titre: value as string, titreAuto: false }
      const annee = value as number
      return { ...e, annee, titre: e.titreAuto ? computeTitre(form.type, annee) : e.titre }
    }))
  }

  function updateType(type: string) {
    setForm((f) => ({ ...f, type }))
    setEntries((prev) => prev.map((e) => e.titreAuto ? { ...e, titre: computeTitre(type, e.annee) } : e))
  }

  async function handleSubmit(evt: React.FormEvent) {
    evt.preventDefault()
    if (!isAuthenticated) { router.push("/connexion"); return }
    if (entries.length === 0) { toast.error("Ajoutez au moins un fichier PDF"); return }
    const missing = entries.filter((e) => !e.titre.trim())
    if (missing.length > 0) { toast.error("Remplissez le titre de chaque document"); return }

    setUploading(true)
    let successCount = 0

    for (const entry of entries) {
      setEntries((prev) => prev.map((e) => e.id === entry.id ? { ...e, status: "uploading" } : e))
      try {
        const fd = new FormData()
        fd.append("titre", entry.titre.trim())
        fd.append("auteur", user ? `${user.prenom} ${user.nom}`.trim() : "")
        fd.append("type", form.type)
        fd.append("faculte", form.faculteId)
        fd.append("filiere", form.filiereId)
        fd.append("niveau", form.niveauId)
        fd.append("annee", String(entry.annee))
        if (form.directeur) fd.append("directeur", form.directeur)
        if (form.resume) fd.append("resume", form.resume)
        fd.append("fichier", entry.file)
        await api.soumettreDocument(fd)
        setEntries((prev) => prev.map((e) => e.id === entry.id ? { ...e, status: "done" } : e))
        successCount++
      } catch (err: any) {
        setEntries((prev) => prev.map((e) => e.id === entry.id ? { ...e, status: "error", error: err?.message ?? "Erreur" } : e))
      }
    }

    setUploading(false)

    if (successCount === entries.length) {
      toast.success(`${successCount} document${successCount > 1 ? "s" : ""} soumis avec succès`, {
        description: "Ils seront vérifiés par un administrateur avant publication.",
      })
      router.push("/profil/mes-documents")
    } else if (successCount > 0) {
      toast.warning(`${successCount}/${entries.length} documents soumis`, {
        description: "Certains ont échoué — vérifiez les erreurs ci-dessus.",
      })
    } else {
      toast.error("Échec de la soumission")
    }
  }

  const selectCls = "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:border-primary"
  const doneCount = entries.filter((e) => e.status === "done").length

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" /> Retour à l&apos;accueil
      </Link>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Déposer un document</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Soumettez vos mémoires, thèses ou articles. Un administrateur vérifiera et classera chaque document avant publication.
          </p>
        </div>

        {/* Format hint */}
        <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 px-4 py-3 text-xs text-muted-foreground">
          <p className="font-medium text-foreground mb-1">Astuce (optionnelle) : renommez le fichier PDF avant de l&apos;envoyer pour pré-remplir Type / Faculté / Filière</p>
          <code className="text-primary text-[11px]">PrenomNom__ANNEE__TYPE__CODE_FAC__NomFiliere.pdf</code>
          <p className="mt-1">Ex : <code className="text-primary">SaliouNiane__2026__master__FST__Informatique.pdf</code></p>
          <p className="mt-1">Le titre, lui, reste toujours à vérifier/modifier ci-dessous — ce champ n&apos;a pas besoin de ce format.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Zone drop */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-all border-border hover:border-primary/40 hover:bg-muted/30 gap-2"
          >
            <Upload className="h-7 w-7 text-muted-foreground" />
            <p className="text-sm font-medium">Déposer vos fichiers PDF ici</p>
            <p className="text-xs text-muted-foreground">ou cliquez pour parcourir — plusieurs fichiers acceptés</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              multiple
              className="hidden"
              onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = "" }}
            />
          </div>

          {/* Liste des fichiers */}
          {entries.length > 0 && (
            <div className="space-y-2">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className={`flex items-start gap-3 rounded-lg border p-3 text-sm transition-colors ${
                    entry.status === "done" ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/30" :
                    entry.status === "error" ? "border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/30" :
                    entry.status === "uploading" ? "border-primary/40 bg-primary/5" :
                    "border-border bg-card"
                  }`}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    {entry.status === "done" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                    {entry.status === "error" && <AlertCircle className="h-4 w-4 text-red-500" />}
                    {entry.status === "uploading" && <Loader2 className="h-4 w-4 text-primary animate-spin" />}
                    {entry.status === "pending" && <FileText className="h-4 w-4 text-muted-foreground" />}
                  </div>

                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs text-muted-foreground truncate flex-1">{entry.file.name}</span>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">{(entry.file.size / 1024 / 1024).toFixed(1)} Mo</span>
                      {entry.parsed && (
                        <Badge className="text-[9px] gap-1 bg-primary/10 text-primary border-0 px-1.5 py-0 flex-shrink-0">
                          <Sparkles className="h-2.5 w-2.5" /> Auto
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        value={entry.titre}
                        onChange={(e) => updateEntry(entry.id, "titre", e.target.value)}
                        placeholder="Titre du document *"
                        className="h-8 text-xs flex-1"
                        disabled={entry.status !== "pending"}
                        required
                      />
                      <Input
                        type="number"
                        value={entry.annee}
                        onChange={(e) => updateEntry(entry.id, "annee", Number(e.target.value))}
                        className="h-8 text-xs w-20 flex-shrink-0"
                        disabled={entry.status !== "pending"}
                        min={1900} max={2100}
                      />
                    </div>
                    {entry.status === "error" && entry.error && (
                      <p className="text-xs text-red-600 dark:text-red-400">{entry.error}</p>
                    )}
                  </div>

                  {entry.status === "pending" && (
                    <button
                      type="button"
                      onClick={() => removeEntry(entry.id)}
                      className="flex-shrink-0 rounded-full p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors px-1"
              >
                <Plus className="h-3.5 w-3.5" /> Ajouter d&apos;autres fichiers
              </button>
            </div>
          )}

          <Separator />

          {/* Champs communs */}
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Informations communes à tous les documents
          </p>

          <Card>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Type <span className="text-destructive">*</span></Label>
                  <select value={form.type} onChange={(e) => updateType(e.target.value)}
                    className={selectCls}>
                    <option value="memoire_licence">Mémoire de Licence</option>
                    <option value="memoire_master">Mémoire de Master</option>
                    <option value="these_doctorat">Thèse de Doctorat</option>
                    <option value="article">Article</option>
                    <option value="rapport">Rapport</option>
                  </select>
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
                <div className="space-y-1.5">
                  <Label className="text-xs">Niveau <span className="text-destructive">*</span></Label>
                  <select value={form.niveauId} onChange={(e) => setForm((f) => ({ ...f, niveauId: e.target.value }))}
                    className={selectCls} required>
                    <option value="">Choisir</option>
                    {niveaux.map((n) => (<option key={n.id} value={n.id}>{n.nom}</option>))}
                  </select>
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-xs">Directeur de mémoire / Encadrant (optionnel)</Label>
                  <Input value={form.directeur} onChange={(e) => setForm((f) => ({ ...f, directeur: e.target.value }))}
                    placeholder="Prof. Nom et prénom" className="h-10 text-sm" />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-xs">Résumé (optionnel)</Label>
                  <Textarea value={form.resume} onChange={(e) => setForm((f) => ({ ...f, resume: e.target.value }))}
                    placeholder="Résumé du document (quelques phrases)" className="text-sm resize-none" rows={3} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            type="submit"
            size="lg"
            className="w-full gap-2 bg-primary hover:bg-primary/90"
            disabled={uploading || entries.length === 0}
          >
            {uploading
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Envoi en cours… ({doneCount}/{entries.length})</>
              : <><Upload className="h-4 w-4" /> Soumettre {entries.length > 1 ? `${entries.length} documents` : "pour validation"}</>}
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
