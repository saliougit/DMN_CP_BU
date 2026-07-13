"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  ChevronRight, ChevronDown, FolderOpen, Folder,
  BookOpen, Plus, Pencil, Trash2, MoreHorizontal,
  GraduationCap, FileText, Search, Calendar, ChevronDown as ChevronDownIcon
} from "lucide-react"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AppDrawer } from "@/components/ui/app-drawer"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { MOCK_FACULTES, MOCK_DOCUMENTS, MOCK_NIVEAUX } from "@/lib/mock-data"
import type { Document } from "@/types"
import { TYPE_LABELS } from "@/lib/document-types"
import { toast } from "sonner"

interface NiveauData { id: string; nom: string; ordre: number }

interface FaculteData {
  id: string
  nom: string
  filieres: { id: string; nom: string }[]
}

function buildTree(facultes: FaculteData[], niveaux: NiveauData[]) {
  return facultes.map((fac) => {
    const docsFac = MOCK_DOCUMENTS.filter((d) => d.faculte === fac.nom)
    return {
      label: fac.nom, type: "faculte" as const, count: docsFac.length,
      children: fac.filieres.map((fi) => {
        const docsFi = docsFac.filter((d) => d.filiere === fi.nom)
        const nivFromDocs = new Set(docsFi.map((d) => d.niveau))
        const allNiveaux = [...new Set([...nivFromDocs, ...niveaux.map((n) => n.nom)])]
        return {
          label: fi.nom, type: "filiere" as const, count: docsFi.length,
          children: allNiveaux.map((niveau) => {
            const docsNiv = docsFi.filter((d) => d.niveau === niveau)
            const annees = new Map<number, Document[]>()
            docsNiv.forEach((d) => {
              const arr = annees.get(d.annee) ?? []
              arr.push(d)
              annees.set(d.annee, arr)
            })
            return {
              label: niveau, type: "niveau" as const, count: docsNiv.length,
              children: Array.from(annees.entries())
                .sort(([a], [b]) => b - a)
                .map(([annee, docsAnnee]) => ({
                  label: String(annee), type: "annee" as const, count: docsAnnee.length,
                  children: docsAnnee.map((d) => ({ label: d.titre, type: "document" as const, doc: d })),
                })),
            }
          }),
        }
      }),
    }
  })
}

type DialogMode = "faculte_add" | "faculte_edit" | "faculte_delete"
  | "filiere_add" | "filiere_edit" | "filiere_delete"
  | "niveau_add" | "niveau_edit" | "niveau_delete"

const STRUCTURAL_TYPES = new Set(["faculte", "filiere", "niveau"])

const NODE_STYLE: Record<string, { Icon: React.ElementType; color: string }> = {
  faculte: { Icon: FolderOpen, color: "text-amber-500" },
  filiere: { Icon: BookOpen, color: "text-blue-500" },
  niveau: { Icon: GraduationCap, color: "text-primary" },
  annee: { Icon: Calendar, color: "text-purple-500" },
  document: { Icon: FileText, color: "text-muted-foreground" },
}

function TreeNodeItem({
  item, depth = 0, parentLabel, faculte, onAction
}: {
  item: any
  depth?: number
  parentLabel?: string
  faculte?: string
  onAction: (action: string, label: string, context: { type: string; parentLabel?: string; faculte?: string }) => void
}) {
  const [open, setOpen] = useState(depth === 0)
  const hasChildren = item.children && item.children.length > 0
  const isDoc = item.type === "document"
  const style = NODE_STYLE[item.type] ?? { Icon: FileText, color: "text-muted-foreground" }

  if (isDoc) {
    return (
      <Link href={`/documents/${item.doc.id}`}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors text-left w-full hover:bg-accent"
        style={{ paddingLeft: `${0.5 + depth * 1.25}rem` }}>
        <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        <span className="text-xs truncate flex-1">{item.label}</span>
        <Badge variant="outline" className="text-[9px] h-4 px-1">{TYPE_LABELS[item.doc?.type] ?? ""}</Badge>
      </Link>
    )
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="group flex items-center gap-1 rounded-lg px-2 py-1.5 hover:bg-accent transition-colors"
        style={{ paddingLeft: `${0.5 + depth * 1.25}rem` }}>
        <button onClick={() => setOpen(!open)}
          className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors w-4">
          {hasChildren
            ? (open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />)
            : null}
        </button>

        <button onClick={() => hasChildren && setOpen(!open)}
          className="flex flex-1 items-center gap-2 min-w-0 text-left cursor-pointer">
          <style.Icon className={`h-4 w-4 flex-shrink-0 ${style.color}`} />
          <span className={`truncate text-sm ${depth === 0 ? "font-medium" : ""}`}>{item.label}</span>
          {item.count !== undefined && (
            <Badge variant="secondary" className="ml-auto flex-shrink-0 h-5 text-[10px] px-1.5">{item.count}</Badge>
          )}
        </button>

        {STRUCTURAL_TYPES.has(item.type) && (
          <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 ml-1">
            <button onClick={() => onAction("add", item.label, { type: item.type, parentLabel, faculte })}
              className="rounded p-0.5 hover:bg-primary/10 hover:text-primary transition-colors" title="Ajouter">
              <Plus className="h-3.5 w-3.5" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger className="rounded p-0.5 hover:bg-muted transition-colors outline-none">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => onAction("edit", item.label, { type: item.type, parentLabel, faculte })}
                  className="gap-2 text-xs">
                  <Pencil className="h-3.5 w-3.5" /> Renommer
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAction("delete", item.label, { type: item.type, parentLabel, faculte })}
                  className="gap-2 text-xs text-destructive focus:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" /> Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {hasChildren && (
        <CollapsibleContent>
          <div className="border-l border-border/50 ml-5">
            {item.children.map((child: any, i: number) => (
              <TreeNodeItem key={i} item={child} depth={depth + 1} parentLabel={item.label} faculte={depth === 0 ? item.label : faculte} onAction={onAction} />
            ))}
          </div>
        </CollapsibleContent>
      )}
    </Collapsible>
  )
}

export function ClassificationTree() {
  const [facultes, setFacultes] = useState<FaculteData[]>(() =>
    JSON.parse(JSON.stringify(MOCK_FACULTES))
  )
  const [niveaux, setNiveaux] = useState<NiveauData[]>(() =>
    JSON.parse(JSON.stringify(MOCK_NIVEAUX))
  )
  const [recherche, setRecherche] = useState("")

  const [dialog, setDialog] = useState<{
    mode: DialogMode
    label?: string
    faculte?: string
    filiere?: string
  } | null>(null)

  const [formName, setFormName] = useState("")
  const [formFaculte, setFormFaculte] = useState("")
  const [addDropdown, setAddDropdown] = useState(false)

  const tree = useMemo(() => buildTree(facultes, niveaux), [facultes, niveaux])

  const treeFiltre = useMemo(() => {
    if (!recherche.trim()) return tree
    const q = recherche.toLowerCase()
    return tree.filter((fac) => {
      const facMatch = fac.label.toLowerCase().includes(q)
      const filMatch = fac.children.some((fi) => {
        const fiMatch = fi.label.toLowerCase().includes(q)
        const nivMatch = fi.children?.some((n) => {
          const nMatch = n.label.toLowerCase().includes(q)
          const anneeMatch = n.children?.some((a: any) => a.label.toLowerCase().includes(q)) ?? false
          return nMatch || anneeMatch
        }) ?? false
        return fiMatch || nivMatch
      })
      return facMatch || filMatch
    })
  }, [tree, recherche])

  const stats = useMemo(() => ({
    facultes: facultes.length,
    filieres: facultes.reduce((s, f) => s + f.filieres.length, 0),
    niveaux: niveaux.length,
    documents: MOCK_DOCUMENTS.length,
  }), [facultes, niveaux])

  function openDialog(mode: DialogMode, label?: string, faculteVal = "", filiereVal = "") {
    setFormName("")
    setFormFaculte(faculteVal)
    setDialog({ mode, label, faculte: faculteVal, filiere: filiereVal })
  }

  function closeDialog() {
    setDialog(null)
    setFormName("")
    setFormFaculte("")
  }

  function handleSave() {
    if (!dialog) return

    switch (dialog.mode) {
      case "faculte_add": {
        if (!formName.trim()) return
        setFacultes((prev) => [...prev, { id: `f${Date.now()}`, nom: formName.trim(), filieres: [] }])
        toast.success(`Faculté « ${formName.trim()} » créée`)
        closeDialog()
        return
      }
      case "faculte_edit": {
        if (!formName.trim() || !dialog.label) return
        setFacultes((prev) => prev.map((f) => f.nom === dialog.label ? { ...f, nom: formName.trim() } : f))
        toast.success(`Faculté renommée en « ${formName.trim()} »`)
        closeDialog()
        return
      }
      case "faculte_delete": {
        if (!dialog.label) return
        setFacultes((prev) => prev.filter((f) => f.nom !== dialog.label))
        toast.success(`Faculté « ${dialog.label} » supprimée`)
        closeDialog()
        return
      }
      case "filiere_add": {
        if (!formName.trim() || !dialog.faculte) return
        setFacultes((prev) => prev.map((f) =>
          f.nom === dialog.faculte ? { ...f, filieres: [...f.filieres, { id: `fi${Date.now()}`, nom: formName.trim() }] } : f
        ))
        toast.success(`Filière « ${formName.trim()} » ajoutée à ${dialog.faculte}`)
        closeDialog()
        return
      }
      case "filiere_edit": {
        if (!formName.trim() || !dialog.faculte || !dialog.label) return
        setFacultes((prev) => prev.map((f) =>
          f.nom === dialog.faculte
            ? { ...f, filieres: f.filieres.map((fi) => fi.nom === dialog.label ? { ...fi, nom: formName.trim() } : fi) }
            : f
        ))
        toast.success(`Filière renommée en « ${formName.trim()} »`)
        closeDialog()
        return
      }
      case "filiere_delete": {
        if (!dialog.faculte || !dialog.label) return
        setFacultes((prev) => prev.map((f) =>
          f.nom === dialog.faculte
            ? { ...f, filieres: f.filieres.filter((fi) => fi.nom !== dialog.label) }
            : f
        ))
        toast.success(`Filière « ${dialog.label} » supprimée`)
        closeDialog()
        return
      }
      case "niveau_add": {
        if (!formName.trim()) return
        const ordre = niveaux.length > 0 ? Math.max(...niveaux.map((n) => n.ordre)) + 1 : 1
        setNiveaux((prev) => [...prev, { id: `n${Date.now()}`, nom: formName.trim(), ordre }])
        toast.success(`Niveau « ${formName.trim()} » créé`)
        closeDialog()
        return
      }
      case "niveau_edit": {
        if (!formName.trim() || !dialog.label) return
        setNiveaux((prev) => prev.map((n) => n.nom === dialog.label ? { ...n, nom: formName.trim() } : n))
        toast.success(`Niveau renommé en « ${formName.trim()} »`)
        closeDialog()
        return
      }
      case "niveau_delete": {
        if (!dialog.label) return
        setNiveaux((prev) => prev.filter((n) => n.nom !== dialog.label))
        toast.success(`Niveau « ${dialog.label} » supprimé`)
        closeDialog()
        return
      }
    }
  }

  function handleAction(action: string, label: string, context: { type: string; parentLabel?: string; faculte?: string }) {
    const type = context.type
    const addMap: Record<string, DialogMode> = {
      faculte: "filiere_add",
      filiere: "niveau_add",
      niveau: "niveau_add",
    }
    const editMap: Record<string, DialogMode> = {
      faculte: "faculte_edit",
      filiere: "filiere_edit",
      niveau: "niveau_edit",
    }
    const deleteMap: Record<string, DialogMode> = {
      faculte: "faculte_delete",
      filiere: "filiere_delete",
      niveau: "niveau_delete",
    }
    const map = action === "add" ? addMap : action === "edit" ? editMap : deleteMap
    const mode = map[type]
    if (!mode) return

    let dialogFaculte = ""
    let dialogFiliere = ""
    if (type === "faculte" && action === "add") {
      dialogFaculte = label
    } else if (type === "filiere") {
      dialogFaculte = context.faculte ?? context.parentLabel ?? ""
      dialogFiliere = action === "add" ? "" : label
    } else if (type === "niveau") {
      dialogFaculte = context.faculte ?? ""
      dialogFiliere = action === "add" ? context.parentLabel ?? "" : label
    }
    openDialog(mode, label, dialogFaculte, dialogFiliere)
  }

  function handleTopLevelAdd(type: "faculte" | "filiere" | "niveau") {
    setAddDropdown(false)
    if (type === "faculte") {
      openDialog("faculte_add")
    } else if (type === "filiere") {
      openDialog("filiere_add", undefined, facultes[0]?.nom ?? "")
    } else if (type === "niveau") {
      openDialog("niveau_add")
    }
  }

  function getDialogConfig() {
    if (!dialog) return null
    switch (dialog.mode) {
      case "faculte_add":
        return { title: "Nouvelle faculté", desc: "Ajoutez une nouvelle faculté à l'arborescence.", label: "Nom de la faculté", showFaculte: false, showFiliere: false }
      case "faculte_edit":
        return { title: "Renommer la faculté", desc: `Modifier le nom de « ${dialog.label} ».`, label: "Nouveau nom", showFaculte: false, showFiliere: false }
      case "faculte_delete":
        return { title: "Supprimer la faculté", desc: `Êtes-vous sûr de vouloir supprimer « ${dialog.label} » ? Cette action est irréversible.`, label: "", showFaculte: false, showFiliere: false }
      case "filiere_add":
        return { title: "Nouvelle filière", desc: "Ajoutez une filière à une faculté.", label: "Nom de la filière", showFaculte: true, showFiliere: false }
      case "filiere_edit":
        return { title: "Renommer la filière", desc: `Modifier le nom de « ${dialog.label} ».`, label: "Nouveau nom", showFaculte: true, showFiliere: false }
      case "filiere_delete":
        return { title: "Supprimer la filière", desc: `Supprimer « ${dialog.label} » ?`, label: "", showFaculte: false, showFiliere: false }
      case "niveau_add":
        return { title: "Nouveau niveau", desc: "Ajoutez un niveau d'étude (Licence 1, Master 2, Doctorat…).", label: "Nom du niveau", showFaculte: false, showFiliere: false }
      case "niveau_edit":
        return { title: "Renommer le niveau", desc: `Modifier le nom de « ${dialog.label} ».`, label: "Nouveau nom", showFaculte: false, showFiliere: false }
      case "niveau_delete":
        return { title: "Supprimer le niveau", desc: `Supprimer « ${dialog.label} » ?`, label: "", showFaculte: false, showFiliere: false }
    }
  }

  const config = getDialogConfig()
  const showInput = dialog?.mode && !dialog.mode.includes("delete")

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Arborescence des collections</h2>
          <p className="text-xs text-muted-foreground">Facultés → Filières → Niveaux → Années → Documents</p>
        </div>
        <DropdownMenu open={addDropdown} onOpenChange={setAddDropdown}>
          <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-1.5 text-xs font-medium transition-colors outline-none">
            <Plus className="h-3.5 w-3.5" /> Nouveau <ChevronDownIcon className="h-3 w-3" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => handleTopLevelAdd("faculte")} className="gap-2 text-xs">
              <FolderOpen className="h-3.5 w-3.5 text-amber-500" /> Faculté
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleTopLevelAdd("filiere")} className="gap-2 text-xs">
              <BookOpen className="h-3.5 w-3.5 text-blue-500" /> Filière
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleTopLevelAdd("niveau")} className="gap-2 text-xs">
              <GraduationCap className="h-3.5 w-3.5 text-primary" /> Niveau
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input value={recherche} onChange={(e) => setRecherche(e.target.value)}
          placeholder="Filtrer l'arborescence…" className="h-9 pl-9 rounded-lg text-sm" />
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground border border-border/60 rounded-lg px-3 py-2">
        <span className="flex items-center gap-1.5"><Folder className="h-3.5 w-3.5 text-amber-500" /> Faculté ({stats.facultes})</span>
        <span className="flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5 text-blue-500" /> Filière ({stats.filieres})</span>
        <span className="flex items-center gap-1.5"><GraduationCap className="h-3.5 w-3.5 text-primary" /> Niveau ({stats.niveaux})</span>
        <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-purple-500" /> Année</span>
        <span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5 text-muted-foreground" /> Document ({stats.documents})</span>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-2 space-y-0.5 max-h-[500px] overflow-y-auto">
          {treeFiltre.map((node, i) => (
            <TreeNodeItem key={i} item={node} depth={0} onAction={handleAction} />
          ))}
          {treeFiltre.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-xs text-muted-foreground">Aucun résultat dans l'arborescence</p>
            </div>
          )}
        </div>
      </div>

      <AppDrawer
        open={!!dialog}
        onClose={closeDialog}
        size="sm"
        title={config?.title ?? ""}
        description={config?.desc ?? ""}
        footer={
          <>
            <Button variant="outline" size="sm" onClick={closeDialog} className="flex-1">Annuler</Button>
            <Button size="sm" variant={dialog?.mode.includes("delete") ? "destructive" : "default"}
              className="flex-1 gap-1.5" onClick={handleSave}
              disabled={showInput && !formName.trim()}>
              {dialog?.mode.includes("delete") ? <Trash2 className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
              {dialog?.mode.includes("delete") ? "Confirmer" : "Enregistrer"}
            </Button>
          </>
        }
      >
        <div className="px-5 py-6 space-y-3">
          {config?.showFaculte && (
            <div className="space-y-1.5">
              <Label className="text-xs">Faculté</Label>
              <Select value={formFaculte} onValueChange={(v) => v !== null && setFormFaculte(v)}>
                <SelectTrigger className="h-9 text-sm rounded-lg"><SelectValue placeholder="Choisir" /></SelectTrigger>
                <SelectContent>
                  {facultes.map((f) => (
                    <SelectItem key={f.id} value={f.nom} className="text-sm">{f.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {showInput && (
            <div className="space-y-1.5">
              <Label className="text-xs">{config?.label ?? "Nom"}</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)}
                placeholder="Saisir le nom…" className="h-9 text-sm rounded-lg" autoFocus />
            </div>
          )}
        </div>
      </AppDrawer>
    </div>
  )
}
