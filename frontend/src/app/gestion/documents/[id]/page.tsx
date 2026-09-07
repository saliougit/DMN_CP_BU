"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, Download, FileText, Calendar, User,
  GraduationCap, BookOpen,
  CheckCircle2, XCircle, Clock, Pencil, X, Loader2, Plus
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription
} from "@/components/ui/sheet"
import { MOCK_DOCUMENTS, MOCK_FACULTES, MOCK_NIVEAUX } from "@/lib/mock-data"
import { TYPE_LABELS, TYPE_COLORS } from "@/lib/document-types"
import { PdfViewer } from "@/components/documents/pdf-viewer"
import type { Document } from "@/types"
import { toast } from "sonner"

export default function AdminDocumentDetailPage() {
  const params = useParams<{ id: string }>()
  const [doc, setDoc] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [pdfPage, setPdfPage] = useState(1)
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Document>>({})
  const [saving, setSaving] = useState(false)
  const [newKeyword, setNewKeyword] = useState("")

  useEffect(() => {
    const found = MOCK_DOCUMENTS.find((d) => d.id === params.id)
    setDoc(found ?? null)
    setLoading(false)
  }, [params.id])

  function openEdit() {
    if (!doc) return
    setEditForm({
      titre: doc.titre, auteur: doc.auteur, type: doc.type,
      faculte: doc.faculte, filiere: doc.filiere, niveau: doc.niveau,
      annee: doc.annee, directeur: doc.directeur, resume: doc.resume,
      motsCles: [...doc.motsCles], pages: doc.pages,
    })
    setNewKeyword("")
    setEditOpen(true)
  }

  function updateForm(field: string, value: any) {
    setEditForm((prev) => ({ ...prev, [field]: value }))
  }

  function addKeyword() {
    const kw = newKeyword.trim()
    if (!kw) return
    updateForm("motsCles", [...(editForm.motsCles || []), kw])
    setNewKeyword("")
  }

  function removeKeyword(index: number) {
    const mots = [...(editForm.motsCles || [])]
    mots.splice(index, 1)
    updateForm("motsCles", mots)
  }

  function handleSave() {
    if (!doc || !editForm.titre || !editForm.auteur) {
      toast.error("Titre et auteur sont obligatoires")
      return
    }
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      setDoc((prev) => prev ? { ...prev, ...editForm } : prev)
      setEditOpen(false)
      toast.success("Document mis à jour")
    }, 500)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-40" />
        <div className="flex gap-6">
          <Skeleton className="w-[360px] h-[400px] rounded-xl flex-shrink-0" />
          <div className="flex-1"><Skeleton className="h-[600px] w-full rounded-xl" /></div>
        </div>
      </div>
    )
  }

  if (!doc) {
    return (
      <div className="flex flex-col items-center py-20 text-center">
        <FileText className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h2 className="text-lg font-semibold">Document introuvable</h2>
        <p className="text-sm text-muted-foreground mt-1">Ce document n&apos;existe pas ou a été supprimé.</p>
        <Link href="/gestion/documents"><Button variant="outline" size="sm" className="mt-4 gap-2"><ArrowLeft className="h-4 w-4" /> Retour au catalogue</Button></Link>
      </div>
    )
  }

  const statusInfo = doc.statut === "approuve"
    ? { icon: CheckCircle2, label: "Approuvé", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950" }
    : doc.statut === "rejete"
    ? { icon: XCircle, label: "Rejeté", color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-950" }
    : { icon: Clock, label: "En attente", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950" }

  const StatusIcon = statusInfo.icon

  const filieresList = MOCK_FACULTES.find((f) => f.nom === editForm.faculte)?.filieres ?? []

  return (
    <div className="space-y-4">
      <Link href="/gestion/documents" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Retour au catalogue
      </Link>

      <div className="flex flex-col lg:flex-row gap-6" style={{ minHeight: "calc(100vh - 12rem)" }}>
        {/* Panneau gauche : Métadonnées */}
        <aside className="lg:w-[360px] flex-shrink-0 order-2 lg:order-1">
          <div className="sticky top-4 rounded-xl border border-border bg-card flex flex-col" style={{ height: "calc(100vh - 12rem)" }}>
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${statusInfo.bg}`}>
                  <StatusIcon className={`h-3.5 w-3.5 ${statusInfo.color}`} />
                  <span className={`text-[11px] font-semibold ${statusInfo.color}`}>{statusInfo.label}</span>
                </div>
                {doc.annee && <Badge variant="outline" className="text-[10px]">{doc.annee}</Badge>}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={`text-[10px] ${TYPE_COLORS[doc.type] ?? "bg-muted text-muted-foreground"}`}>
                    {TYPE_LABELS[doc.type] ?? doc.type}
                  </Badge>
                  {doc.pages && <span className="text-[10px] text-muted-foreground">{doc.pages} pages</span>}
                </div>
                <h1 className="text-lg font-bold leading-tight">{doc.titre}</h1>
              </div>

              <Separator />

              <div className="space-y-3">
                <MetaRow icon={User} label="Auteur" value={doc.auteur} />
                <MetaRow icon={GraduationCap} label="Niveau" value={doc.niveau} />
                <MetaRow icon={BookOpen} label="Faculté" value={doc.faculte} />
                {doc.filiere && <MetaRow icon={BookOpen} label="Filière" value={doc.filiere} />}
                {doc.directeur && <MetaRow icon={User} label="Directeur" value={doc.directeur} />}
                <MetaRow icon={Calendar} label="Année" value={String(doc.annee)} />
                <MetaRow icon={User} label="Soumis par" value={doc.soumisParId} />
                <MetaRow icon={Calendar} label="Date de soumission" value={doc.soumisLe} />
              </div>

              {doc.motsCles.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Mots-clés</p>
                    <div className="flex flex-wrap gap-1.5">
                      {doc.motsCles.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <Separator />

              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Résumé</p>
                <p className="text-xs leading-relaxed text-foreground/80">{doc.resume}</p>
              </div>
            </div>

            {/* Actions toujours visibles en bas */}
            <div className="flex-shrink-0 border-t border-border/60 p-4">
              <div className="flex gap-2">
                <Button className="flex-1 gap-2 bg-primary hover:bg-primary/90 h-9 text-sm" onClick={openEdit}>
                  <Pencil className="h-4 w-4" /> Modifier
                </Button>
                <Button variant="outline" className="gap-2 h-9 text-sm">
                  <Download className="h-4 w-4" /> PDF
                </Button>
              </div>
            </div>
          </div>
        </aside>

        {/* Panneau droit : PDF Viewer */}
        <div className="flex-1 min-w-0 order-1 lg:order-2">
          <div className="sticky top-4 rounded-xl border border-border bg-card overflow-hidden"
            style={{ height: "calc(100vh - 12rem)" }}>
            <PdfViewer
              fileUrl={doc.fichierUrl}
              pages={doc.pages}
              page={pdfPage}
              onPageChange={setPdfPage}
              className="h-full"
            />
          </div>
        </div>
      </div>

      {/* Sheet d'édition */}
      <Sheet open={editOpen} onOpenChange={(o) => { if (!o && !saving) setEditOpen(false) }}>
        <SheetContent className="sm:max-w-xl w-full p-0 flex flex-col">
          <SheetHeader className="px-6 pt-6 pb-0 flex-shrink-0">
            <SheetTitle>Modifier le document</SheetTitle>
            <SheetDescription>Mettez à jour les métadonnées du document.</SheetDescription>
          </SheetHeader>
          <Separator className="my-4 flex-shrink-0" />
          <ScrollArea className="flex-1 px-6 pb-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs">Titre</Label>
                  <Input value={editForm.titre ?? ""} onChange={(e) => updateForm("titre", e.target.value)}
                    className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Auteur</Label>
                  <Input value={editForm.auteur ?? ""} onChange={(e) => updateForm("auteur", e.target.value)}
                    className="h-9 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Type</Label>
                  <select value={editForm.type ?? ""} onChange={(e) => updateForm("type", e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary">
                    <option value="memoire_licence">Mémoire Licence</option>
                    <option value="memoire_master">Mémoire Master</option>
                    <option value="these_doctorat">Thèse Doctorat</option>
                    <option value="article">Article</option>
                    <option value="rapport">Rapport</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Faculté</Label>
                  <select value={editForm.faculte ?? ""}
                    onChange={(e) => updateForm("faculte", e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary">
                    <option value="">Choisir</option>
                    {MOCK_FACULTES.map((f) => (<option key={f.id} value={f.nom}>{f.nom}</option>))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Filière</Label>
                  <select value={editForm.filiere ?? ""}
                    onChange={(e) => updateForm("filiere", e.target.value)}
                    disabled={!editForm.faculte}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary disabled:opacity-50">
                    <option value="">Choisir</option>
                    {filieresList.map((fi) => (<option key={fi.id} value={fi.nom}>{fi.nom}</option>))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Niveau</Label>
                  <select value={editForm.niveau ?? ""}
                    onChange={(e) => updateForm("niveau", e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary">
                    <option value="">Choisir</option>
                    {MOCK_NIVEAUX.map((n) => (<option key={n.id} value={n.nom}>{n.nom}</option>))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Année</Label>
                  <Input type="number" value={editForm.annee ?? new Date().getFullYear()}
                    onChange={(e) => updateForm("annee", Number(e.target.value))}
                    className="h-9 text-sm" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs">Directeur (optionnel)</Label>
                  <Input value={editForm.directeur ?? ""} onChange={(e) => updateForm("directeur", e.target.value)}
                    className="h-9 text-sm" placeholder="Prof. Nom Prénom" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs">Résumé</Label>
                  <Textarea value={editForm.resume ?? ""} onChange={(e) => updateForm("resume", e.target.value)}
                    className="text-sm resize-none" rows={4} />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-xs">Mots-clés</Label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {(editForm.motsCles ?? []).map((kw, i) => (
                      <Badge key={i} variant="secondary" className="text-[10px] gap-1 pr-1">
                        {kw}
                        <button onClick={() => removeKeyword(i)} className="hover:text-destructive">
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input value={newKeyword} onChange={(e) => setNewKeyword(e.target.value)}
                      placeholder="Ajouter un mot-clé…" className="h-9 text-sm flex-1"
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addKeyword() } }} />
                    <Button variant="outline" size="sm" className="h-9" onClick={addKeyword}>
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
          <Separator className="flex-shrink-0" />
          <div className="flex items-center justify-end gap-2 px-6 py-4 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(false)} disabled={saving}>Annuler</Button>
            <Button size="sm" className="gap-2 bg-primary hover:bg-primary/90" onClick={handleSave} disabled={saving}>
              {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Enregistrement…</> : <><Pencil className="h-4 w-4" /> Enregistrer</>}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function MetaRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
      <div className="flex items-baseline gap-1.5 min-w-0">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide flex-shrink-0">{label}</span>
        <span className="text-xs text-foreground truncate">{value}</span>
      </div>
    </div>
  )
}
