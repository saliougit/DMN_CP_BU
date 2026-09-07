"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Search, FileText, Download, Trash2, Eye, MoreHorizontal, RefreshCw,
  Upload, X, Loader2
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { api } from "@/lib/api"
import type { Faculte, Document } from "@/types"
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
}

export default function AdminDocumentsPage() {
  const router = useRouter()
  const [docs, setDocs] = useState<Document[]>([])
  const [facultes, setFacultes] = useState<Faculte[]>([])
  const [recherche, setRecherche] = useState("")
  const [sheetOpen, setSheetOpen] = useState(false)
  const [step, setStep] = useState<"upload" | "classify">("upload")
  const [files, setFiles] = useState<FileEntry[]>([])
  const [dragging, setDragging] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  function loadDocs() {
    api.getDocumentsAdmin({ statut: "approuve" }).then(setDocs).catch(() => {})
  }

  useEffect(() => {
    loadDocs()
    api.getFacultes().then(setFacultes).catch(() => {})
  }, [])

  const filtrees = useMemo(
    () => docs.filter((d) =>
      d.titre.toLowerCase().includes(recherche.toLowerCase()) ||
      d.auteur.toLowerCase().includes(recherche.toLowerCase()) ||
      d.faculte.toLowerCase().includes(recherche.toLowerCase())
    ),
    [docs, recherche]
  )

  const { paginated, PaginationBar } = usePagination(filtrees, 8)

  function handleSupprimer(id: string) {
    setDocs((prev) => prev.filter((d) => d.id !== id))
    toast.success("Document supprimé")
  }

  function resetForm() {
    setFiles([])
    setStep("upload")
  }

  function openSheet() {
    resetForm()
    setSheetOpen(true)
  }

  function addFiles(newFiles: FileList | File[]) {
    const entries: FileEntry[] = Array.from(newFiles)
      .filter((f) => f.type === "application/pdf")
      .map((f) => ({
        id: crypto.randomUUID(),
        file: f,
        titre: "",
        auteur: "",
        type: "memoire_master",
        faculte: "",
        filiere: "",
        niveau: "",
        annee: new Date().getFullYear(),
        directeur: "",
        resume: "",
      }))
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
  }

  async function handleSubmitAll() {
    const incomplets = files.filter((f) => !f.titre || !f.auteur || !f.faculte || !f.filiere || !f.niveau)
    if (incomplets.length > 0) {
      toast.error(`${incomplets.length} document(s) incomplet(s) — remplissez tous les champs obligatoires`)
      return
    }
    setSubmitting(true)
    try {
      for (const entry of files) {
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
      }
      toast.success(`${files.length} document(s) publié(s) dans le catalogue`)
      setSheetOpen(false)
      resetForm()
      loadDocs()
    } catch (err: any) {
      toast.error("Erreur lors de la publication", { description: err?.message })
    } finally {
      setSubmitting(false)
    }
  }

  function computeTitre(entry: FileEntry): string {
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
    facultes.find((f) => f.id === faculteId || f.nom === faculteId)?.filieres ?? []

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

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input value={recherche} onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher dans le catalogue…" className="h-9 pl-9 rounded-lg text-sm" />
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
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {paginated.map((doc) => (
              <tr key={doc.id} className="hover:bg-muted/20 transition-colors">
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
                <td className="px-4 py-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger className="rounded-lg p-1.5 hover:bg-muted transition-colors">
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuItem className="gap-2 text-xs" onClick={() => router.push(`/admin/documents/${doc.id}`)}><Eye className="h-3.5 w-3.5" /> Voir</DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 text-xs"><Download className="h-3.5 w-3.5" /> Télécharger</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleSupprimer(doc.id)}
                        className="gap-2 text-xs text-destructive"><Trash2 className="h-3.5 w-3.5" /> Supprimer</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
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
      <Sheet open={sheetOpen} onOpenChange={(o) => { if (!o && !submitting) { setSheetOpen(false); resetForm() } }}>
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

                {files.map((entry) => {
                  const fac = filieres(entry.faculte)
                  return (
                    <div key={entry.id} className="rounded-xl border border-border bg-card p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                          <span className="text-xs font-medium truncate">{entry.file.name}</span>
                          <Badge variant="outline" className="text-[9px]">{(entry.file.size / 1024 / 1024).toFixed(1)} Mo</Badge>
                        </div>
                        <button onClick={() => removeFile(entry.id)}
                          className="rounded-full p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2 space-y-1">
                          <Label className="text-[10px]">Titre</Label>
                          <Input value={entry.titre}
                            onChange={(e) => updateFile(entry.id, "titre", e.target.value)}
                            className="h-8 text-xs" placeholder="Titre du document" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px]">Auteur</Label>
                          <Input value={entry.auteur}
                            onChange={(e) => updateFile(entry.id, "auteur", e.target.value)}
                            className="h-8 text-xs" placeholder="Nom et prénom" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px]">Type</Label>
                          <select value={entry.type} onChange={(e) => updateFile(entry.id, "type", e.target.value)}
                            className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:border-primary">
                            <option value="memoire_licence">Mémoire Licence</option>
                            <option value="memoire_master">Mémoire Master</option>
                            <option value="these_doctorat">Thèse Doctorat</option>
                            <option value="article">Article</option>
                            <option value="rapport">Rapport</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px]">Faculté</Label>
                          <select value={entry.faculte}
                            onChange={(e) => updateFile(entry.id, "faculte", e.target.value)}
                            className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:border-primary">
                            <option value="">Choisir</option>
                            {facultes.map((f) => (<option key={f.id} value={f.nom}>{f.nom}</option>))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px]">Filière</Label>
                          <select value={entry.filiere}
                            onChange={(e) => updateFile(entry.id, "filiere", e.target.value)}
                            disabled={!entry.faculte}
                            className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:border-primary disabled:opacity-50">
                            <option value="">Choisir</option>
                            {fac.map((fi) => (<option key={fi.id} value={fi.nom}>{fi.nom}</option>))}
                          </select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px]">Niveau</Label>
                          <select value={entry.niveau}
                            onChange={(e) => updateFile(entry.id, "niveau", e.target.value)}
                            disabled={!entry.filiere}
                            className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:border-primary disabled:opacity-50">
                            <option value="">Choisir</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px]">Année</Label>
                          <Input type="number" value={entry.annee}
                            onChange={(e) => updateFile(entry.id, "annee", Number(e.target.value))}
                            className="h-8 text-xs" />
                        </div>
                        <div className="col-span-2 space-y-1">
                          <Label className="text-[10px]">Directeur (optionnel)</Label>
                          <Input value={entry.directeur}
                            onChange={(e) => updateFile(entry.id, "directeur", e.target.value)}
                            className="h-8 text-xs" placeholder="Prof. Nom Prénom" />
                        </div>
                        <div className="col-span-2 space-y-1">
                          <Label className="text-[10px]">Résumé (optionnel)</Label>
                          <Textarea value={entry.resume}
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
                {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Publication…</>
                  : <><Upload className="h-4 w-4" /> Publier {files.length} document(s)</>}
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
