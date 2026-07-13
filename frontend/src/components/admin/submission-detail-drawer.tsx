"use client"

import { useState } from "react"
import {
  CheckCircle2, XCircle, Pencil, Save, X, ChevronRight,
  ChevronDown, FolderOpen, Folder, BookOpen, GraduationCap,
  User, Calendar, FileText, Tag, FolderTree, Check
} from "lucide-react"
import { AppDrawer } from "@/components/ui/app-drawer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import dynamic from "next/dynamic"
const PdfViewer = dynamic(
  () => import("@/components/documents/pdf-viewer").then((m) => ({ default: m.PdfViewer })),
  { ssr: false }
)
import { MOCK_FACULTES, MOCK_NIVEAUX } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import type { Document } from "@/types"

const TYPE_LABELS: Record<string, string> = {
  memoire_licence: "Mémoire Licence",
  memoire_master: "Mémoire Master",
  these_doctorat: "Thèse Doctorat",
  article: "Article",
  rapport: "Rapport",
}

/* ───────────────── Tree picker compact ───────────────── */

interface TreeNode {
  id: string
  label: string
  type: "faculte" | "filiere" | "niveau"
  children?: TreeNode[]
}

const TREE_DATA: TreeNode[] = MOCK_FACULTES.map((f) => ({
  id: f.id, label: f.nom, type: "faculte" as const,
  children: f.filieres.map((fi) => ({
    id: fi.id, label: fi.nom, type: "filiere" as const,
    children: MOCK_NIVEAUX.map((n) => ({
      id: `${fi.id}-${n.id}`, label: n.nom, type: "niveau" as const,
    })),
  })),
}))

export interface PickedNode { faculte: string; filiere: string; niveau: string }

function TreePickerNode({
  node, depth, selected, onSelect,
}: {
  node: TreeNode
  depth: number
  selected: PickedNode | null
  onSelect: (path: PickedNode) => void
}) {
  const [open, setOpen] = useState(depth === 0)

  function getIcon() {
    if (node.type === "faculte") return open ? FolderOpen : Folder
    if (node.type === "filiere") return BookOpen
    return GraduationCap
  }

  const iconColor = node.type === "faculte" ? "text-amber-500" : node.type === "filiere" ? "text-blue-500" : "text-primary"
  const Icon = getIcon()
  const hasChildren = (node.children?.length ?? 0) > 0

  const isSelected = node.type === "niveau" && selected?.niveau === node.label

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div
        className={cn(
          "flex items-center gap-1.5 rounded-md px-2 py-1.5 cursor-pointer transition-colors",
          node.type === "niveau"
            ? isSelected
              ? "bg-primary/15 text-primary font-medium"
              : "hover:bg-accent"
            : "hover:bg-accent/50"
        )}
        style={{ paddingLeft: `${0.5 + depth * 1.1}rem` }}
        onClick={() => {
          if (node.type === "niveau") {
            // Remonter le chemin complet
            // On se fie au label — en prod on ferait avec les IDs
            const parts = node.id.split("-")
            // Chercher faculte et filiere depuis l'arbre
            for (const f of MOCK_FACULTES) {
              for (const fi of f.filieres) {
                if (fi.id === parts[0]) {
                  onSelect({ faculte: f.nom, filiere: fi.nom, niveau: node.label })
                  return
                }
              }
            }
            onSelect({ faculte: "", filiere: "", niveau: node.label })
          } else {
            setOpen(!open)
          }
        }}
      >
        {hasChildren ? (
          <button className="flex-shrink-0 text-muted-foreground" onClick={(e) => { e.stopPropagation(); setOpen(!open) }}>
            {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>
        ) : (
          <span className="w-3 flex-shrink-0" />
        )}
        <Icon className={cn("h-3.5 w-3.5 flex-shrink-0", iconColor)} />
        <span className="text-xs truncate flex-1">{node.label}</span>
        {isSelected && <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />}
      </div>

      {hasChildren && (
        <CollapsibleContent>
          <div className="border-l border-border/40 ml-4">
            {node.children!.map((child) => (
              <TreePickerNode key={child.id} node={child} depth={depth + 1} selected={selected} onSelect={onSelect} />
            ))}
          </div>
        </CollapsibleContent>
      )}
    </Collapsible>
  )
}

function TreePicker({
  value, onChange,
}: {
  value: PickedNode | null
  onChange: (v: PickedNode) => void
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-2 max-h-72 overflow-y-auto space-y-0.5">
      {TREE_DATA.map((node) => (
        <TreePickerNode key={node.id} node={node} depth={0} selected={value} onSelect={onChange} />
      ))}
    </div>
  )
}

/* ───────────────── Drawer principal ───────────────── */

interface SubmissionDetailDrawerProps {
  document: Document | null
  open: boolean
  onClose: () => void
  onApprouver: (doc: Document, classif: PickedNode) => void
  onRejeter: (doc: Document) => void
}

export function SubmissionDetailDrawer({
  document: doc,
  open,
  onClose,
  onApprouver,
  onRejeter,
}: SubmissionDetailDrawerProps) {
  const [editMode, setEditMode] = useState(false)
  const [classifMode, setClassifMode] = useState<"confirmer" | "choisir">("confirmer")
  const [pdfPage, setPdfPage] = useState(1)

  // Formulaire édition
  const [draft, setDraft] = useState<Partial<Document>>({})
  const current = { ...doc, ...draft } as Document

  // Classification sélectionnée
  const [classif, setClassif] = useState<PickedNode | null>(null)

  const finalClassif: PickedNode = classifMode === "confirmer"
    ? { faculte: doc?.faculte ?? "", filiere: doc?.filiere ?? "", niveau: doc?.niveau ?? "" }
    : (classif ?? { faculte: doc?.faculte ?? "", filiere: doc?.filiere ?? "", niveau: doc?.niveau ?? "" })

  function handleSaveEdit() {
    setEditMode(false)
    // En prod: appel API PATCH
  }

  function handleApprouver() {
    if (!doc) return
    onApprouver({ ...doc, ...draft }, finalClassif)
    onClose()
  }

  if (!doc) return null

  return (
    <AppDrawer
      open={open}
      onClose={onClose}
      size="full"
      scrollBody={false}
      titleExtra={
        <Badge className="bg-primary/10 text-primary border-0 text-xs">
          {TYPE_LABELS[doc.type] ?? doc.type}
        </Badge>
      }
      title={editMode
        ? <Input value={current.titre} onChange={(e) => setDraft((d) => ({ ...d, titre: e.target.value }))}
            className="h-8 text-sm font-semibold border-primary/50 focus-visible:ring-0" />
        : <span className="line-clamp-2">{doc.titre}</span>
      }
      description={`Soumis le ${doc.soumisLe} · ${doc.auteur}`}
      footer={
        <div className="flex items-center gap-2 w-full">
          {editMode ? (
            <>
              <Button variant="outline" size="sm" onClick={() => { setEditMode(false); setDraft({}) }} className="gap-1.5">
                <X className="h-3.5 w-3.5" /> Annuler
              </Button>
              <Button size="sm" onClick={handleSaveEdit} className="gap-1.5 bg-primary hover:bg-primary/90">
                <Save className="h-3.5 w-3.5" /> Sauvegarder
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditMode(true)}
                className="gap-1.5 text-muted-foreground"
              >
                <Pencil className="h-3.5 w-3.5" /> Modifier
              </Button>
              <div className="flex-1" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => { onRejeter(doc); onClose() }}
                className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/5"
              >
                <XCircle className="h-3.5 w-3.5" /> Rejeter
              </Button>
              <Button
                size="sm"
                onClick={handleApprouver}
                className="gap-1.5 bg-primary hover:bg-primary/90"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Approuver et publier
              </Button>
            </>
          )}
        </div>
      }
    >
      {/* Layout split : info gauche / viewer droit */}
      <div className="flex flex-1 min-h-0 w-full gap-0 h-full">

        {/* Panneau gauche — Informations */}
        <div className="w-[400px] flex-shrink-0 border-r border-border/60 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 min-h-0">
            <div className="p-5 space-y-5">

              {/* Infos de base */}
              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Informations générales
                </h3>
                <div className="space-y-2.5">
                  <EditableField icon={User} label="Auteur" value={current.auteur}
                    edit={editMode}
                    onChange={(v) => setDraft((d) => ({ ...d, auteur: v }))} />
                  <EditableField icon={Calendar} label="Année de soutenance" value={String(current.annee)}
                    edit={editMode} type="number"
                    onChange={(v) => setDraft((d) => ({ ...d, annee: Number(v) }))} />
                  <EditableField icon={User} label="Directeur de mémoire" value={current.directeur ?? ""}
                    edit={editMode}
                    onChange={(v) => setDraft((d) => ({ ...d, directeur: v }))} />
                  <EditableField icon={FileText} label="Nombre de pages" value={String(current.pages ?? "")}
                    edit={editMode} type="number"
                    onChange={(v) => setDraft((d) => ({ ...d, pages: Number(v) }))} />
                </div>
              </section>

              <Separator />

              {/* Résumé */}
              <section className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Résumé</h3>
                {editMode ? (
                  <Textarea
                    value={current.resume ?? ""}
                    onChange={(e) => setDraft((d) => ({ ...d, resume: e.target.value }))}
                    className="text-xs resize-none border-primary/50 focus-visible:ring-0"
                    rows={5}
                  />
                ) : (
                  <p className="text-xs text-foreground/80 leading-relaxed">{doc.resume}</p>
                )}
              </section>

              {/* Mots-clés */}
              <section className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                  <Tag className="h-3 w-3" /> Mots-clés
                </h3>
                {editMode ? (
                  <Input
                    value={(current.motsCles ?? []).join(", ")}
                    onChange={(e) => setDraft((d) => ({ ...d, motsCles: e.target.value.split(",").map((s) => s.trim()) }))}
                    className="text-xs h-8 border-primary/50 focus-visible:ring-0"
                    placeholder="séparés par des virgules"
                  />
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {(doc.motsCles ?? []).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
                    ))}
                  </div>
                )}
              </section>

              <Separator />

              {/* Classification */}
              <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                  <FolderTree className="h-3 w-3" /> Emplacement dans le catalogue
                </h3>

                {/* Placement proposé par le membre */}
                <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1.5 text-xs">
                  <p className="text-muted-foreground font-medium">Proposé par le membre :</p>
                  <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-1.5"><Folder className="h-3 w-3 text-amber-500" /> {doc.faculte}</span>
                    <span className="flex items-center gap-1.5 pl-4"><BookOpen className="h-3 w-3 text-blue-500" /> {doc.filiere}</span>
                    <span className="flex items-center gap-1.5 pl-8"><GraduationCap className="h-3 w-3 text-primary" /> {doc.niveau}</span>
                  </div>
                </div>

                {/* Choix admin */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setClassifMode("confirmer")}
                    className={cn(
                      "flex-1 flex items-center gap-1.5 justify-center rounded-lg border px-3 py-2 text-xs font-medium transition-all",
                      classifMode === "confirmer"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    )}
                  >
                    <Check className="h-3.5 w-3.5" />
                    Confirmer l&apos;emplacement
                  </button>
                  <button
                    onClick={() => setClassifMode("choisir")}
                    className={cn(
                      "flex-1 flex items-center gap-1.5 justify-center rounded-lg border px-3 py-2 text-xs font-medium transition-all",
                      classifMode === "choisir"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    )}
                  >
                    <FolderOpen className="h-3.5 w-3.5" />
                    Choisir un autre
                  </button>
                </div>

                {/* Tree picker si mode "choisir" */}
                {classifMode === "choisir" && (
                  <div className="space-y-2">
                    <p className="text-[11px] text-muted-foreground">Sélectionnez le niveau cible :</p>
                    <TreePicker value={classif} onChange={setClassif} />
                    {classif && (
                      <div className="rounded-lg bg-primary/8 border border-primary/20 px-3 py-2 text-xs">
                        <p className="font-medium text-primary mb-1">Emplacement sélectionné :</p>
                        <p className="text-foreground/80">{classif.faculte} › {classif.filiere} › {classif.niveau}</p>
                      </div>
                    )}
                  </div>
                )}
              </section>
            </div>
          </ScrollArea>
        </div>

        {/* Panneau droit — Viewer PDF */}
        <div className="flex-1 flex flex-col min-w-0 bg-muted/10">
          {/* Zone PDF — pleine hauteur */}
          <div className="flex-1 min-h-0">
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
    </AppDrawer>
  )
}

/* ───────────────── Champ éditable ───────────────── */

function EditableField({
  icon: Icon, label, value, edit, onChange, type = "text",
}: {
  icon: React.ElementType
  label: string
  value: string
  edit: boolean
  onChange: (v: string) => void
  type?: string
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
        {edit ? (
          <Input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="mt-0.5 h-7 text-xs border-primary/50 focus-visible:ring-0 px-2"
          />
        ) : (
          <p className="text-xs text-foreground leading-tight">{value || "—"}</p>
        )}
      </div>
    </div>
  )
}
