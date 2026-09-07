"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import {
  ChevronRight, ChevronDown, FolderOpen, Folder,
  BookOpen, GraduationCap, FileText, Search, Calendar, Trash2, X,
} from "lucide-react"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { api } from "@/lib/api"
import type { Document, Faculte, Niveau } from "@/types"
import { TYPE_LABELS } from "@/lib/document-types"
import { toast } from "sonner"

// ─── Ordre canonique des niveaux ─────────────────────────────────────────────

const NIVEAU_ORDER: Record<string, number> = {
  "Licence 1": 1, "Licence 2": 2, "Licence 3": 3,
  "Master 1": 4,  "Master 2": 5,  "Doctorat": 6,
  "DUT 1": 7, "DUT 2": 8, "DIC 1": 9, "DIC 2": 10, "DIC 3": 11,
}

// ─── Construction de l'arbre ──────────────────────────────────────────────────

interface FaculteData { id: string; nom: string; code: string; filieres: { id: string; nom: string }[] }

function buildTree(facultes: FaculteData[], deletedIds: Set<string>, allDocs: Document[]) {
  const docs = allDocs.filter((d) => d.statut === "approuve" && !deletedIds.has(d.id))

  return facultes.map((fac) => {
    const docsFac = docs.filter((d) => d.faculte === fac.nom)
    return {
      label: fac.nom,
      code: fac.code,
      type: "faculte" as const,
      count: docsFac.length,
      children: fac.filieres.map((fi) => {
        const docsFi = docsFac.filter((d) => d.filiere === fi.nom)
        const niveaux = [...new Set(docsFi.map((d) => d.niveau).filter(Boolean))]
          .sort((a, b) => (NIVEAU_ORDER[a] ?? 99) - (NIVEAU_ORDER[b] ?? 99))
        return {
          label: fi.nom,
          type: "filiere" as const,
          count: docsFi.length,
          children: niveaux.map((niveau) => {
            const docsNiv = docsFi.filter((d) => d.niveau === niveau)
            const annees = new Map<number, Document[]>()
            docsNiv.forEach((d) => {
              const arr = annees.get(d.annee) ?? []
              arr.push(d)
              annees.set(d.annee, arr)
            })
            return {
              label: niveau,
              type: "niveau" as const,
              count: docsNiv.length,
              children: Array.from(annees.entries())
                .sort(([a], [b]) => b - a)
                .map(([annee, docsAnnee]) => ({
                  label: String(annee),
                  type: "annee" as const,
                  count: docsAnnee.length,
                  children: docsAnnee.map((d) => ({
                    label: d.titre,
                    type: "document" as const,
                    doc: d,
                  })),
                })),
            }
          }),
        }
      }),
    }
  })
}

// ─── Styles par type de nœud ──────────────────────────────────────────────────

const NODE_STYLE: Record<string, { Icon: React.ElementType; color: string }> = {
  faculte:  { Icon: FolderOpen,    color: "text-amber-500" },
  filiere:  { Icon: BookOpen,      color: "text-blue-500"  },
  niveau:   { Icon: GraduationCap, color: "text-primary"   },
  annee:    { Icon: Calendar,      color: "text-purple-500" },
  document: { Icon: FileText,      color: "text-muted-foreground" },
}

// ─── Nœud de l'arbre ─────────────────────────────────────────────────────────

function TreeNodeItem({
  item, depth = 0, onDelete,
}: {
  item: any
  depth?: number
  onDelete: (id: string, titre: string) => void
}) {
  const [open, setOpen] = useState(depth === 0)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const hasChildren = item.children && item.children.length > 0
  const isDoc = item.type === "document"
  const style = NODE_STYLE[item.type] ?? { Icon: FileText, color: "text-muted-foreground" }

  if (isDoc) {
    return (
      <div
        className="group flex items-center gap-1.5 rounded-lg px-2 py-1.5 hover:bg-accent transition-colors"
        style={{ paddingLeft: `${0.5 + depth * 1.25}rem` }}
      >
        <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        <Link href={`/documents/${item.doc.id}`} className="text-xs truncate flex-1 hover:underline">
          {item.label}
        </Link>
        <Badge variant="outline" className="text-[9px] h-4 px-1 flex-shrink-0">
          {TYPE_LABELS[item.doc?.type] ?? ""}
        </Badge>

        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity rounded p-0.5 hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
            title="Supprimer"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        ) : (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => { onDelete(item.doc.id, item.label); setConfirmDelete(false) }}
              className="rounded px-1.5 py-0.5 text-[10px] bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
            >
              Supprimer
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="rounded p-0.5 hover:bg-muted text-muted-foreground transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div
        className="flex items-center gap-1 rounded-lg px-2 py-1.5 hover:bg-accent transition-colors cursor-pointer"
        style={{ paddingLeft: `${0.5 + depth * 1.25}rem` }}
        onClick={() => hasChildren && setOpen(!open)}
      >
        <span className="flex-shrink-0 text-muted-foreground w-4">
          {hasChildren
            ? open
              ? <ChevronDown className="h-3.5 w-3.5" />
              : <ChevronRight className="h-3.5 w-3.5" />
            : null}
        </span>
        <style.Icon className={`h-4 w-4 flex-shrink-0 ${style.color}`} />
        <span className={`truncate text-sm flex-1 ${depth === 0 ? "font-medium" : ""}`}>
          {item.label}
          {item.code && (
            <span className="ml-1.5 text-[10px] text-muted-foreground font-normal">({item.code})</span>
          )}
        </span>
        {item.count !== undefined && (
          <Badge variant="secondary" className="flex-shrink-0 h-5 text-[10px] px-1.5">
            {item.count}
          </Badge>
        )}
      </div>

      {hasChildren && (
        <CollapsibleContent>
          <div className="border-l border-border/50 ml-5">
            {item.children.map((child: any, i: number) => (
              <TreeNodeItem key={i} item={child} depth={depth + 1} onDelete={onDelete} />
            ))}
          </div>
        </CollapsibleContent>
      )}
    </Collapsible>
  )
}

// ─── Composant principal ──────────────────────────────────────────────────────

export function ClassificationTree() {
  const [recherche, setRecherche] = useState("")
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set())
  const [facultes, setFacultes] = useState<Faculte[]>([])
  const [allDocs, setAllDocs] = useState<Document[]>([])
  const [niveaux, setNiveaux] = useState<Niveau[]>([])

  useEffect(() => {
    api.getFacultes().then(setFacultes).catch(() => {})
    api.getNiveaux().then(setNiveaux).catch(() => {})
    api.getDocumentsAdmin({ statut: "approuve" }).then(setAllDocs).catch(() => {})
  }, [])

  function handleDelete(id: string, titre: string) {
    setDeletedIds((prev) => new Set([...prev, id]))
    toast.success("Document supprimé", { description: titre })
  }

  const tree = useMemo(
    () => buildTree(facultes as FaculteData[], deletedIds, allDocs),
    [facultes, deletedIds, allDocs]
  )

  const treeFiltre = useMemo(() => {
    if (!recherche.trim()) return tree
    const q = recherche.toLowerCase()
    return tree.filter((fac) => {
      if (fac.label.toLowerCase().includes(q) || fac.code?.toLowerCase().includes(q)) return true
      return fac.children.some((fi) => {
        if (fi.label.toLowerCase().includes(q)) return true
        return fi.children?.some((n) => {
          if (n.label.toLowerCase().includes(q)) return true
          return n.children?.some((a: any) => a.label.toLowerCase().includes(q))
        }) ?? false
      })
    })
  }, [tree, recherche])

  const totalDocs = useMemo(
    () => allDocs.filter((d) => d.statut === "approuve" && !deletedIds.has(d.id)).length,
    [allDocs, deletedIds]
  )

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">Arborescence des collections</h2>
        <p className="text-xs text-muted-foreground">Structure UCAD — Faculté → Filière → Niveau → Année → Documents</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Filtrer l'arborescence…"
          className="h-9 pl-9 rounded-lg text-sm"
        />
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground border border-border/60 rounded-lg px-3 py-2">
        <span className="flex items-center gap-1.5"><Folder className="h-3.5 w-3.5 text-amber-500" /> {facultes.length} facultés</span>
        <span className="flex items-center gap-1.5"><BookOpen className="h-3.5 w-3.5 text-blue-500" /> {facultes.reduce((s, f) => s + f.filieres.length, 0)} filières</span>
        <span className="flex items-center gap-1.5"><GraduationCap className="h-3.5 w-3.5 text-primary" /> {niveaux.length} niveaux</span>
        <span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5 text-muted-foreground" /> {totalDocs} documents publiés</span>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-2 space-y-0.5 max-h-[500px] overflow-y-auto">
          {treeFiltre.map((node, i) => (
            <TreeNodeItem key={i} item={node} depth={0} onDelete={handleDelete} />
          ))}
          {treeFiltre.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Search className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-xs text-muted-foreground">Aucun résultat dans l'arborescence</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
