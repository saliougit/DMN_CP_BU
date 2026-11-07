"use client"

import { useState, useMemo, useCallback, useEffect, Fragment } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Search, FileText, Download, Trash2, Eye, RefreshCw,
  Upload, X, Loader2, ArrowUpDown, ArrowDown, CheckCircle2, AlertCircle,
  ChevronDown, ChevronUp,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription
} from "@/components/ui/sheet"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { api } from "@/lib/api"
import type { Faculte, Niveau, Document } from "@/types"
import { TYPE_LABELS, TYPE_COLORS } from "@/lib/document-types"
import { usePagination } from "@/components/ui/pagination"
import { toast } from "sonner"

interface FileEntry {
  id: string
  file: File
  titre: string
  auteur: string
  type: string
  faculte: string
  filiere: string
  niveau: string
  annee: number
  directeur: string
  resume: string
  parsed: boolean // true si le nom a été parsé avec succès
  status: "pending" | "uploading" | "done" | "error"
  error?: string
}

const TYPE_MAP: Record<string, string> = {
  master: "memoire_master",
  licence: "memoire_licence",
  doctorat: "these_doctorat",
  these: "these_doctorat",
  thèse: "these_doctorat",
  article: "article",
  rapport: "rapport",
}

function fuzzyMatch(query: string, choices: string[]): string {
  const q = query.toLowerCase().replace(/[-_]/g, " ").trim()
  return choices.find((c) => c.toLowerCase().replace(/[-_]/g, " ").includes(q)) ??
    choices.find((c) => q.includes(c.toLowerCase().replace(/[-_]/g, " ").substring(0, 4))) ?? ""
}

function parseFilename(
  name: string,
  facultes: Faculte[]
): Partial<FileEntry> & { parsed: boolean } {
  // Format attendu : PrenomNom__2024__master__FSJP__NomFiliere.pdf
  const base = name.replace(/\.pdf$/i, "")
  const parts = base.split("__")

  if (parts.length < 2) {
    // Parsing minimal : juste l'année si dispo
    const yearMatch = base.match(/\b(19|20)\d{2}\b/)
    const auteur = base.replace(yearMatch?.[0] ?? "", "").replace(/[-_]+/g, " ").trim()
    return { auteur, annee: yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear(), parsed: false }
  }

  const auteur = (parts[0] ?? "").replace(/[-_]+/g, " ").trim()
  const annee  = parseInt(parts[1] ?? "") || new Date().getFullYear()
  const typeKey = (parts[2] ?? "").toLowerCase()
  const type    = TYPE_MAP[typeKey] ?? "memoire_master"
  const facCode = (parts[3] ?? "").toUpperCase()
  const filNom  = (parts[4] ?? "").replace(/[-_]+/g, " ").trim()

  const fac = facultes.find((f) => f.code?.toUpperCase() === facCode)
  const facId = fac?.id ?? ""
  const filId = fac
    ? (fuzzyMatch(filNom, fac.filieres.map((fi) => fi.nom))
        ? fac.filieres.find((fi) =>
            fi.nom.toLowerCase().includes(filNom.toLowerCase().substring(0, 4))
          )?.id ?? ""
        : "")
    : ""

  return { auteur, annee, type, faculte: facId, filiere: filId, parsed: parts.length >= 4 }
}

type SortKey = "recent" | "telecharges" | "vus"

export default function AdminDocumentsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [docs, setDocs] = useState<Document[]>([])
  const [facultes, setFacultes] = useState<Faculte[]>([])
  const [niveaux, setNiveaux] = useState<Niveau[]>([])
  const [recherche, setRecherche] = useState("")
  const [tri, setTri] = useState<SortKey>((searchParams.get("tri") as SortKey) ?? "recent")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [step, setStep] = useState<"upload" | "classify">("upload")
  const [files, setFiles] = useState<FileEntry[]>([])
  const [dragging, setDragging] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [bulk, setBulk] = useState({ type: "memoire_master", faculte: "", filiere: "", niveau: "", annee: new Date().getFullYear(), applyAnnee: true, directeur: "" })
  // Vide = "appliquer à tous" (comportement par défaut) ; non-vide = lot
  // hétérogène où seul le sous-ensemble coché doit recevoir ce rangement.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [expandedId, setExpandedId] = useState<string | null>(null)

  function loadDocs() {
    api.getDocumentsAdmin({ statut: "approuve" }).then(setDocs).catch(() => {})
  }

  useEffect(() => {
    loadDocs()
    api.getFacultes().then(setFacultes).catch(() => {})
    api.getNiveaux().then(setNiveaux).catch(() => {})
  }, [])

  const filtrees = useMemo(() => {
    const base = docs.filter((d) =>
      d.titre.toLowerCase().includes(recherche.toLowerCase()) ||
      d.auteur.toLowerCase().includes(recherche.toLowerCase()) ||
      d.faculte.toLowerCase().includes(recherche.toLowerCase())
    )
    if (tri === "telecharges") return [...base].sort((a, b) => (b.nbTelechargements ?? 0) - (a.nbTelechargements ?? 0))
    if (tri === "vus")         return [...base].sort((a, b) => (b.nbConsultations ?? 0) - (a.nbConsultations ?? 0))
    return base
  }, [docs, recherche, tri])

  const { paginated, PaginationBar } = usePagination(filtrees, 8)

  function handleSupprimer(id: string) {
    setDocs((prev) => prev.filter((d) => d.id !== id))
    toast.success("Document supprimé")
  }

  function resetForm() {
    setFiles([])
    setStep("upload")
    setSelectedIds(new Set())
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function openSheet() {
    resetForm()
    setSheetOpen(true)
  }

  function addFiles(newFiles: FileList | File[]) {
    const entries: FileEntry[] = Array.from(newFiles)
      .filter((f) => f.type === "application/pdf")
      .map((f) => {
        const parsed = parseFilename(f.name, facultes)
        return {
          id: crypto.randomUUID(),
          file: f,
          titre: "",
          auteur: parsed.auteur ?? "",
          type: parsed.type ?? "memoire_master",
          faculte: parsed.faculte ?? "",
          filiere: parsed.filiere ?? "",
          niveau: "",
          annee: parsed.annee ?? new Date().getFullYear(),
          directeur: "",
          resume: "",
          parsed: parsed.parsed ?? false,
          status: "pending",
        }
      })
    if (entries.length === 0) {
      toast.error("Seuls les fichiers PDF sont acceptés")
      return
    }
    setFiles((prev) => [...prev, ...entries])
    setStep("classify")
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files)
  }, [])

  function removeFile(id: string) {
    setFiles((prev) => {
      const next = prev.filter((f) => f.id !== id)
      if (next.length === 0) setStep("upload")
      return next
    })
    setSelectedIds((prev) => {
      if (!prev.has(id)) return prev
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  async function handleSubmitAll() {
    const incomplets = files.filter((f) => !f.titre || !f.auteur || !f.faculte || !f.filiere || !f.niveau)
    if (incomplets.length > 0) {
      toast.error(`${incomplets.length} document(s) incomplet(s) — remplissez tous les champs obligatoires`)
      return
    }
    setSubmitting(true)
    let successCount = 0

    for (const entry of files) {
      setFiles((prev) => prev.map((f) => f.id === entry.id ? { ...f, status: "uploading" } : f))
      try {
        const fd = new FormData()
        fd.append("titre", entry.titre)
        fd.append("auteur", entry.auteur)
        fd.append("type", entry.type)
        fd.append("faculte", entry.faculte)
        fd.append("filiere", entry.filiere)
        fd.append("niveau", entry.niveau)
        fd.append("annee", String(entry.annee))
        if (entry.directeur) fd.append("directeur", entry.directeur)
        if (entry.resume) fd.append("resume", entry.resume)
        fd.append("fichier", entry.file)
        await api.uploadDocument(fd)
        setFiles((prev) => prev.map((f) => f.id === entry.id ? { ...f, status: "done" } : f))
        successCount++
      } catch (err: any) {
        setFiles((prev) => prev.map((f) => f.id === entry.id ? { ...f, status: "error", error: err?.message ?? "Erreur" } : f))
      }
    }

    setSubmitting(false)
    loadDocs()

    if (successCount === files.length) {
      toast.success(`${successCount} document(s) publié(s) dans le catalogue`)
      setSheetOpen(false)
      resetForm()
    } else if (successCount > 0) {
      // On retire les documents déjà publiés : seuls les échecs restent à
      // corriger/relancer, pas de republication en double au prochain essai.
      setFiles((prev) => prev.filter((f) => f.status !== "done"))
      toast.warning(`${successCount}/${files.length} documents publiés`, {
        description: "Les autres ont échoué — corrigez si besoin et relancez la publication.",
      })
    } else {
      toast.error("Échec de la publication — vérifiez les erreurs sur chaque fichier")
    }
  }

  function computeTitre(entry: Pick<FileEntry, "type" | "auteur" | "annee">): string {
    const typeLabel = TYPE_LABELS[entry.type] ?? entry.type ?? ""
    const parts = []
    if (entry.auteur && typeLabel) parts.push(`${typeLabel} — ${entry.auteur}`)
    else if (entry.auteur) parts.push(entry.auteur)
    else if (typeLabel) parts.push(typeLabel)
    if (entry.annee && entry.annee > 0) parts.push(String(entry.annee))
    return parts.join(" | ")
  }

  function updateFile(id: string, field: keyof FileEntry, value: string | number) {
    setFiles((prev) => {
      const next = prev.map((f) => {
        if (f.id !== id) return f
        const updated = { ...f, [field]: value }
        if (field === "auteur" || field === "type" || field === "annee") {
          updated.titre = computeTitre(updated)
        }
        return updated
      })
      return next
    })
  }

  const filieres = (faculteId: string) =>
    facultes.find((f) => f.id === faculteId)?.filieres ?? []

  /** Applique les champs communs (bandeau "Classification commune") aux
   * fichiers en attente — soit tous, soit uniquement ceux cochés quand le
   * lot est hétérogène (ex : 100 PDF venant de plusieurs facultés/niveaux
   * différents, à classer par groupes successifs). */
  function applyBulkToAll() {
    if (!bulk.faculte || !bulk.niveau) {
      toast.error("Choisissez au moins une faculté et un niveau avant d'appliquer")
      return
    }
    const targetAll = selectedIds.size === 0
    setFiles((prev) => prev.map((f) => {
      if (!targetAll && !selectedIds.has(f.id)) return f
      if (f.status !== "pending" && f.status !== "error") return f
      const updated = {
        ...f,
        type: bulk.type,
        faculte: bulk.faculte,
        filiere: bulk.filiere,
        niveau: bulk.niveau,
        // L'année est souvent la seule chose qui varie au sein d'un meme
        // lot Faculte/Filiere/Niveau (plusieurs promotions) — ne pas
        // l'ecraser si l'admin a decoche la case.
        annee: bulk.applyAnnee ? bulk.annee : f.annee,
        directeur: bulk.directeur || f.directeur,
      }
      updated.titre = computeTitre(updated)
      return updated
    }))
    toast.success(targetAll
      ? "Champs communs appliqués à tous les fichiers en attente"
      : `Champs communs appliqués à ${selectedIds.size} fichier(s) sélectionné(s)`)
    if (!targetAll) setSelectedIds(new Set())
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Documents du catalogue</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-8"
            onClick={() => { setRefreshing(true); loadDocs(); setTimeout(() => setRefreshing(false), 800) }}
            disabled={refreshing}>
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} /> Actualiser
          </Button>
          <Button size="sm" className="gap-2 bg-primary hover:bg-primary/90" onClick={openSheet}>
            <FileText className="h-4 w-4" /> Ajouter un document
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input value={recherche} onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher dans le catalogue…" className="h-9 pl-9 rounded-lg text-sm" />
        </div>
        <div className="flex w-full items-stretch rounded-lg border border-border bg-card sm:w-fit">
          <Select value={tri} onValueChange={(v) => setTri(v as SortKey)}>
            <SelectTrigger className="h-9 w-full min-w-44 rounded-none border-0 shadow-none gap-1.5 text-xs sm:w-auto">
              <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent" className="text-xs">Plus récents</SelectItem>
              <SelectItem value="telecharges" className="text-xs">Plus téléchargés</SelectItem>
              <SelectItem value="vus" className="text-xs">Plus consultés</SelectItem>
            </SelectContent>
          </Select>
          {tri !== "recent" && (
            <>
              <div aria-hidden className="w-px shrink-0 self-stretch bg-border" />
              <button onClick={() => setTri("recent")} aria-label="Réinitialiser le tri"
                className="flex items-center gap-1.5 rounded-r-lg bg-foreground px-3 text-xs font-medium text-background hover:bg-foreground/90 transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 border-b border-border">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Titre</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Auteur</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Faculté</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Type</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Année</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">
                <span className="flex items-center justify-end gap-1"><Download className="h-3 w-3" /> DL</span>
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">
                <span className="flex items-center justify-end gap-1"><Eye className="h-3 w-3" /> Vues</span>
              </th>
              <th className="px-4 py-3 w-28" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {paginated.map((doc) => {
              const expanded = expandedId === doc.id
              return (
                <Fragment key={doc.id}>
                  <tr className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium line-clamp-1">{doc.titre}</p>
                      <p className="text-xs text-muted-foreground md:hidden">{doc.auteur}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">{doc.auteur}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{doc.faculte}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <Badge className={`text-[10px] ${TYPE_COLORS[doc.type] ?? ""}`}>{TYPE_LABELS[doc.type] ?? doc.type}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">{doc.annee}</td>
                    <td className="px-4 py-3 text-right hidden lg:table-cell">
                      <span className={`text-xs font-medium ${tri === "telecharges" ? "text-purple-600 font-semibold" : "text-muted-foreground"}`}>
                        {(doc.nbTelechargements ?? 0).toLocaleString("fr-FR")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right hidden lg:table-cell">
                      <span className={`text-xs font-medium ${tri === "vus" ? "text-blue-600 font-semibold" : "text-muted-foreground"}`}>
                        {(doc.nbConsultations ?? 0).toLocaleString("fr-FR")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        onClick={() => setExpandedId(expanded ? null : doc.id)}
                        size="sm" variant="secondary"
                        className="gap-1 text-xs h-8 shadow-none border-0"
                        aria-expanded={expanded}
                        aria-label={expanded ? `Replier ${doc.titre}` : `Déplier ${doc.titre}`}
                      >
                        {expanded ? <ChevronUp className="h-3.5 w-3.5 opacity-60" /> : <ChevronDown className="h-3.5 w-3.5 opacity-60" />}
                        Actions
                      </Button>
                    </td>
                  </tr>
                  {expanded && (
                    <tr className="hover:bg-transparent">
                      <td colSpan={7} className="p-0 bg-muted/10">
                        <div className="flex flex-wrap items-center gap-2 px-4 py-3">
                          <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs"
                            onClick={() => router.push(`/gestion/documents/${doc.id}`)}>
                            <Eye className="h-3.5 w-3.5" /> Voir
                          </Button>
                          <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
                            <Download className="h-3.5 w-3.5" /> Télécharger
                          </Button>
                          <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs text-destructive border-destructive/30 hover:bg-destructive/5 hover:border-destructive/60"
                            onClick={() => handleSupprimer(doc.id)}>
                            <Trash2 className="h-3.5 w-3.5" /> Supprimer
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
        {filtrees.length === 0 && (
          <div className="flex flex-col items-center py-16 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/20 mb-3" />
            <p className="text-sm text-muted-foreground">Aucun document trouvé</p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <PaginationBar />
      </div>

      {/* Sheet : Ajouter un document */}
      <Sheet
        open={sheetOpen}
        onOpenChange={(o, details) => {
          if (o) return
          if (details.reason === "outside-press" || details.reason === "escape-key" || details.reason === "focus-out") {
            details.cancel()
            return
          }
          if (!submitting) { setSheetOpen(false); resetForm() }
        }}
      >
        <SheetContent className="sm:max-w-2xl w-full p-0 flex flex-col">
          <SheetHeader className="px-6 pt-6 pb-0 flex-shrink-0">
            <SheetTitle>Ajouter des documents</SheetTitle>
            <SheetDescription>
              Importez un ou plusieurs PDF, puis classez-les dans l&apos;arborescence.
            </SheetDescription>
          </SheetHeader>

          <Separator className="my-4 flex-shrink-0" />

          <ScrollArea className="flex-1 px-6 pb-4">
            {step === "upload" ? (
              /* Étape 1 : Upload */
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => document.getElementById("sheet-pdf-upload")?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-all ${
                  dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted/30"
                }`}
              >
                <Upload className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm font-medium">Déposer les fichiers PDF ici</p>
                <p className="text-xs text-muted-foreground mt-1">ou cliquez pour parcourir — plusieurs fichiers acceptés</p>
                <input id="sheet-pdf-upload" type="file" accept=".pdf" multiple className="hidden"
                  onChange={(e) => { if (e.target.files && e.target.files.length > 0) addFiles(e.target.files) }} />
                <div className="mt-5 rounded-lg bg-primary/5 border border-primary/20 px-4 py-3 text-left w-full">
                  <p className="text-[11px] font-semibold text-primary mb-1.5">Format de nommage recommandé</p>
                  <code className="text-[11px] text-foreground block mb-1">PrenomNom__ANNEE__TYPE__CODE_FAC__NomFiliere.pdf</code>
                  <p className="text-[10px] text-muted-foreground">Exemple : <span className="font-mono">SaliouNiane__2024__master__FSJP__Droit-Prive.pdf</span></p>
                  <p className="text-[10px] text-muted-foreground mt-1">Types : <span className="font-mono">licence · master · doctorat · article · rapport</span></p>
                </div>
              </div>
            ) : (
              /* Étape 2 : Classification */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{files.length} fichier(s) à classer</p>
                  <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-8"
                    onClick={() => document.getElementById("sheet-pdf-upload")?.click()}>
                    <Upload className="h-3.5 w-3.5" /> Ajouter d&apos;autres fichiers
                  </Button>
                  <input id="sheet-pdf-upload" type="file" accept=".pdf" multiple className="hidden"
                    onChange={(e) => { if (e.target.files && e.target.files.length > 0) addFiles(e.target.files) }} />
                </div>

                {files.length > 1 && (
                  <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-primary">
                        Classification commune — pratique pour un import en lot
                      </p>
                      <button type="button" className="text-[11px] text-primary hover:underline flex-shrink-0"
                        onClick={() => setSelectedIds((prev) =>
                          prev.size === files.length ? new Set() : new Set(files.map((f) => f.id))
                        )}>
                        {selectedIds.size === files.length ? "Tout désélectionner" : "Tout sélectionner"}
                      </button>
                    </div>
                    {selectedIds.size > 0 && (
                      <p className="text-[11px] text-muted-foreground">
                        Lot hétérogène ? Cochez les fichiers concernés ci-dessous (ex : une seule faculté à la fois) avant d&apos;appliquer — {selectedIds.size} sélectionné(s).
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      <select value={bulk.type} onChange={(e) => setBulk((b) => ({ ...b, type: e.target.value }))}
                        className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:border-primary">
                        {Object.entries(TYPE_LABELS).map(([v, l]) => (<option key={v} value={v}>{l}</option>))}
                      </select>
                      <select value={bulk.faculte}
                        onChange={(e) => setBulk((b) => ({ ...b, faculte: e.target.value, filiere: "" }))}
                        className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:border-primary">
                        <option value="">Faculté</option>
                        {facultes.map((f) => (<option key={f.id} value={f.id}>{f.nom}</option>))}
                      </select>
                      <select value={bulk.filiere} onChange={(e) => setBulk((b) => ({ ...b, filiere: e.target.value }))}
                        disabled={!bulk.faculte}
                        className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:border-primary disabled:opacity-50">
                        <option value="">Filière</option>
                        {filieres(bulk.faculte).map((fi) => (<option key={fi.id} value={fi.id}>{fi.nom}</option>))}
                      </select>
                      <select value={bulk.niveau} onChange={(e) => setBulk((b) => ({ ...b, niveau: e.target.value }))}
                        className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:border-primary">
                        <option value="">Niveau</option>
                        {niveaux.map((n) => (<option key={n.id} value={n.id}>{n.nom}</option>))}
                      </select>
                      <div className="flex items-center gap-1.5">
                        <Input type="number" value={bulk.annee} disabled={!bulk.applyAnnee}
                          onChange={(e) => setBulk((b) => ({ ...b, annee: Number(e.target.value) }))}
                          className="h-8 text-xs disabled:opacity-40" placeholder="Année" />
                        <label className="flex items-center gap-1 text-[10px] text-muted-foreground flex-shrink-0 cursor-pointer" title="Décocher si le lot mélange plusieurs promotions/années">
                          <input type="checkbox" checked={bulk.applyAnnee}
                            onChange={(e) => setBulk((b) => ({ ...b, applyAnnee: e.target.checked }))}
                            className="h-3.5 w-3.5 accent-primary" />
                          incl.
                        </label>
                      </div>
                      <Input value={bulk.directeur}
                        onChange={(e) => setBulk((b) => ({ ...b, directeur: e.target.value }))}
                        className="h-8 text-xs" placeholder="Directeur (optionnel)" />
                    </div>
                    <Button type="button" size="sm" variant="outline" className="gap-1.5 text-xs h-8 w-full"
                      onClick={applyBulkToAll}>
                      {selectedIds.size > 0
                        ? `Appliquer à ${selectedIds.size} fichier(s) sélectionné(s)`
                        : "Appliquer à tous les fichiers en attente"}
                    </Button>
                  </div>
                )}

                {files.map((entry) => {
                  const fac = filieres(entry.faculte)
                  const locked = entry.status === "uploading" || entry.status === "done"
                  return (
                    <div key={entry.id} className={`rounded-xl border p-4 space-y-3 ${
                      entry.status === "done" ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/30" :
                      entry.status === "error" ? "border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/30" :
                      entry.status === "uploading" ? "border-primary/40 bg-primary/5" :
                      "border-border bg-card"
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          {files.length > 1 && !locked && (
                            <input type="checkbox" checked={selectedIds.has(entry.id)}
                              onChange={() => toggleSelected(entry.id)}
                              className="h-3.5 w-3.5 flex-shrink-0 accent-primary" />
                          )}
                          {entry.status === "done" && <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />}
                          {entry.status === "error" && <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />}
                          {entry.status === "uploading" && <Loader2 className="h-4 w-4 text-primary animate-spin flex-shrink-0" />}
                          {entry.status === "pending" && <FileText className="h-4 w-4 text-primary flex-shrink-0" />}
                          <span className="text-xs font-medium truncate">{entry.file.name}</span>
                          <Badge variant="outline" className="text-[9px]">{(entry.file.size / 1024 / 1024).toFixed(1)} Mo</Badge>
                          {entry.parsed
                            ? <Badge className="text-[9px] bg-primary/10 text-primary border-primary/20">Auto-parsé</Badge>
                            : <Badge variant="outline" className="text-[9px] text-amber-600 border-amber-300">À compléter</Badge>}
                        </div>
                        {!locked && (
                          <button onClick={() => removeFile(entry.id)}
                            className="rounded-full p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      {entry.status === "error" && entry.error && (
                        <p className="text-xs text-red-600 dark:text-red-400">{entry.error}</p>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2 space-y-1">
                          <Label className="text-[10px]">Titre</Label>
                          <Input value={entry.titre} disabled={locked}
                            onChange={(e) => updateFile(entry.id, "titre", e.target.value)}
                            className="h-8 text-xs" placeholder="Titre du document" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px]">Auteur</Label>
                          <Input value={entry.auteur} disabled={locked}
                            onChange={(e) => updateFile(entry.id, "auteur", e.target.value)}
                            className="h-8 text-xs" placeholder="Nom et prénom" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px]">Type</Label>
                          <select value={entry.type} disabled={locked} onChange={(e) => updateFile(entry.id, "type", e.target.value)}
                            className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:border-primary disabled:opacity-50">
                            <option value="memoire_licence">Mémoire Licence</option>
                            <option value="memoire_master">Mémoire Master</option>
                            <option value="these_doctorat">Thèse Doctorat</option>
                            <option value="article">Article</option>
                            <option value="rapport">Rapport</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px]">Faculté</Label>
                          <select value={entry.faculte} disabled={locked}
                            onChange={(e) => updateFile(entry.id, "faculte", e.target.value)}
                            className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:border-primary disabled:opacity-50">
                            <option value="">Choisir</option>
                            {facultes.map((f) => (<option key={f.id} value={f.id}>{f.nom}</option>))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px]">Filière</Label>
                          <select value={entry.filiere}
                            onChange={(e) => updateFile(entry.id, "filiere", e.target.value)}
                            disabled={locked || !entry.faculte}
                            className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:border-primary disabled:opacity-50">
                            <option value="">Choisir</option>
                            {fac.map((fi) => (<option key={fi.id} value={fi.id}>{fi.nom}</option>))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px]">Niveau</Label>
                          <select value={entry.niveau}
                            onChange={(e) => updateFile(entry.id, "niveau", e.target.value)}
                            disabled={locked || !entry.filiere}
                            className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:border-primary disabled:opacity-50">
                            <option value="">Choisir</option>
                            {niveaux.map((n) => (<option key={n.id} value={n.id}>{n.nom}</option>))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px]">Année</Label>
                          <Input type="number" value={entry.annee} disabled={locked}
                            onChange={(e) => updateFile(entry.id, "annee", Number(e.target.value))}
                            className="h-8 text-xs" />
                        </div>
                        <div className="col-span-2 space-y-1">
                          <Label className="text-[10px]">Directeur (optionnel)</Label>
                          <Input value={entry.directeur} disabled={locked}
                            onChange={(e) => updateFile(entry.id, "directeur", e.target.value)}
                            className="h-8 text-xs" placeholder="Prof. Nom Prénom" />
                        </div>
                        <div className="col-span-2 space-y-1">
                          <Label className="text-[10px]">Résumé (optionnel)</Label>
                          <Textarea value={entry.resume} disabled={locked}
                            onChange={(e) => updateFile(entry.id, "resume", e.target.value)}
                            className="text-xs resize-none" rows={2} placeholder="Brève description…" />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </ScrollArea>

          <Separator className="flex-shrink-0" />

          <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={() => { setSheetOpen(false); resetForm() }}
              disabled={submitting}>
              Annuler
            </Button>
            {step === "classify" && (
              <Button size="sm" className="gap-2 bg-primary hover:bg-primary/90" onClick={handleSubmitAll} disabled={submitting}>
                {submitting
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Publication… ({files.filter((f) => f.status === "done").length}/{files.length})</>
                  : <><Upload className="h-4 w-4" /> Publier {files.length} document(s)</>}
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
