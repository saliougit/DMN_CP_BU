"use client"

import { useState, useMemo, useEffect, Fragment } from "react"
import {
  CheckCircle2, XCircle, Eye, Clock, FileText, RefreshCw,
  Calendar, AlertTriangle, Search, X, ChevronDown, ChevronUp,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { SubmissionDetailDrawer } from "@/components/admin/submission-detail-drawer"
import type { PickedNode } from "@/components/admin/submission-detail-drawer"
import { api } from "@/lib/api"
import type { Document } from "@/types"
import { TYPE_LABELS, TYPE_COLORS } from "@/lib/document-types"
import { usePagination } from "@/components/ui/pagination"
import { toast } from "sonner"

const STATUS_TABS = [
  { key: "all", label: "Toutes" },
  { key: "en_attente", label: "En attente" },
  { key: "approuve", label: "Approuvées" },
  { key: "rejete", label: "Rejetées" },
] as const

type TabKey = (typeof STATUS_TABS)[number]["key"]

const STATUS_STYLE: Record<string, { icon: React.ElementType; label: string; badgeCls: string }> = {
  en_attente: { icon: Clock,        label: "En attente", badgeCls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300" },
  approuve:   { icon: CheckCircle2, label: "Approuvé",   badgeCls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300" },
  rejete:     { icon: XCircle,      label: "Rejeté",     badgeCls: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300" },
}

export default function SoumissionsPage() {
  const [allDocs, setAllDocs] = useState<Document[]>([])
  const [tab, setTab] = useState<TabKey>("en_attente")
  const [recherche, setRecherche] = useState("")
  const [detailDoc, setDetailDoc] = useState<Document | null>(null)
  const [rejeteDoc, setRejeteDoc] = useState<Document | null>(null)
  const [motifRejet, setMotifRejet] = useState("")
  const [refreshing, setRefreshing] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  function loadDocs() {
    api.getDocumentsAdmin().then(setAllDocs).catch(() => {})
  }

  useEffect(() => { loadDocs() }, [])

  const filtrees = useMemo(() => {
    let items = allDocs
    if (tab !== "all") items = items.filter((d) => d.statut === tab)
    if (recherche.trim()) {
      const q = recherche.toLowerCase()
      items = items.filter((d) =>
        d.titre.toLowerCase().includes(q) ||
        d.auteur.toLowerCase().includes(q)
      )
    }
    return items
  }, [allDocs, tab, recherche])

  const { paginated, PaginationBar } = usePagination(filtrees, 8)

  const counts = useMemo(() => ({
    all: allDocs.length,
    en_attente: allDocs.filter((d) => d.statut === "en_attente").length,
    approuve: allDocs.filter((d) => d.statut === "approuve").length,
    rejete: allDocs.filter((d) => d.statut === "rejete").length,
  }), [allDocs])

  async function handleApprouver(doc: Document, _classif?: PickedNode) {
    try {
      await api.approuverDocument(doc.id)
      toast.success("Document approuvé", {
        description: `"${doc.titre.slice(0, 50)}…" publié dans le catalogue.`,
      })
      loadDocs()
    } catch {
      toast.error("Erreur lors de l'approbation")
    }
  }

  async function handleRejeter() {
    if (!rejeteDoc || !motifRejet.trim()) return
    try {
      await api.rejeterDocument(rejeteDoc.id, motifRejet)
      toast.error("Document rejeté", { description: `Motif : ${motifRejet.slice(0, 60)}…` })
      setRejeteDoc(null)
      setMotifRejet("")
      loadDocs()
    } catch {
      toast.error("Erreur lors du rejet")
    }
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Évaluation des soumissions</h1>
        </div>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-8"
          onClick={() => { setRefreshing(true); loadDocs(); setTimeout(() => setRefreshing(false), 800) }}
          disabled={refreshing}>
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} /> Actualiser
        </Button>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-0.5 border border-border/60">
          {STATUS_TABS.map((t) => {
            const Icon = STATUS_STYLE[t.key]?.icon ?? FileText
            const active = tab === t.key
            return (
              <button key={t.key} onClick={() => { setTab(t.key); setExpandedId(null) }}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  active
                    ? "bg-background text-foreground shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}>
                <Icon className="h-3.5 w-3.5" />
                {t.label}
                <Badge variant={active ? "default" : "secondary"} className="text-[9px] h-4 px-1 ml-0.5">
                  {counts[t.key]}
                </Badge>
              </button>
            )
          })}
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input value={recherche} onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher par titre ou auteur…" className="pl-9 h-9 rounded-lg text-xs" />
          {recherche && (
            <button onClick={() => setRecherche("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Tableau */}
      {filtrees.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl border-2 border-dashed border-border">
          {tab === "en_attente" ? (
            <CheckCircle2 className="h-12 w-12 text-primary/30 mb-3" />
          ) : (
            <FileText className="h-12 w-12 text-muted-foreground/20 mb-3" />
          )}
          <p className="text-sm font-medium text-muted-foreground">
            {recherche ? "Aucun résultat" : `Aucune soumission ${STATUS_TABS.find((t) => t.key === tab)?.label.toLowerCase() ?? ""}`}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead>Titre</TableHead>
                <TableHead className="hidden sm:table-cell">Auteur</TableHead>
                <TableHead className="hidden md:table-cell">Faculté</TableHead>
                <TableHead className="hidden lg:table-cell">Type</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="hidden md:table-cell">Soumis le</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((doc) => {
                const s = STATUS_STYLE[doc.statut] ?? STATUS_STYLE.en_attente
                const StatusIcon = s.icon
                const expanded = expandedId === doc.id
                return (
                  <Fragment key={doc.id}>
                    <TableRow className="hover:bg-muted/20">
                      <TableCell className="max-w-[260px]">
                        <p className="text-sm font-medium line-clamp-1">{doc.titre}</p>
                        <p className="text-xs text-muted-foreground sm:hidden">{doc.auteur}</p>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{doc.auteur}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{doc.faculte}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge className={`text-[10px] ${TYPE_COLORS[doc.type] ?? ""}`}>{TYPE_LABELS[doc.type] ?? doc.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`gap-1 text-[10px] ${s.badgeCls}`}>
                          <StatusIcon className="h-3 w-3" /> {s.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {doc.soumisLe}</span>
                      </TableCell>
                      <TableCell>
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
                      </TableCell>
                    </TableRow>
                    {expanded && (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={7} className="p-0 bg-muted/10">
                          <div className="flex flex-wrap items-center gap-2 px-4 py-3">
                            <Button variant="outline" size="sm" onClick={() => setDetailDoc(doc)} className="gap-1.5 h-8 text-xs">
                              <Eye className="h-3.5 w-3.5" /> Détails
                            </Button>
                            {doc.statut === "en_attente" && (
                              <>
                                <Button variant="outline" size="sm" onClick={() => setRejeteDoc(doc)}
                                  className="gap-1.5 h-8 text-xs text-destructive border-destructive/30 hover:bg-destructive/5 hover:border-destructive/60">
                                  <XCircle className="h-3.5 w-3.5" /> Rejeter
                                </Button>
                                <Button size="sm" onClick={() => handleApprouver(doc)} className="gap-1.5 h-8 text-xs bg-primary hover:bg-primary/90">
                                  <CheckCircle2 className="h-3.5 w-3.5" /> Approuver
                                </Button>
                              </>
                            )}
                            {doc.statut === "rejete" && doc.motifRejet && (
                              <span className="text-xs text-destructive/80 ml-1">
                                <span className="font-semibold">Motif :</span> {doc.motifRejet}
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex items-center justify-between">
        <PaginationBar />
      </div>

      {/* Drawer détail soumission */}
      <SubmissionDetailDrawer
        document={detailDoc}
        open={!!detailDoc}
        onClose={() => setDetailDoc(null)}
        onApprouver={handleApprouver}
        onRejeter={(doc) => { setDetailDoc(null); setRejeteDoc(doc) }}
      />

      {/* Modal Rejet */}
      <Dialog open={!!rejeteDoc} onOpenChange={(o) => !o && setRejeteDoc(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Rejeter le document
            </DialogTitle>
            <DialogDescription className="text-xs pt-1">
              L&apos;auteur recevra une notification avec le motif de rejet.
            </DialogDescription>
          </DialogHeader>
          {rejeteDoc && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                <p className="text-xs font-semibold line-clamp-2">{rejeteDoc.titre}</p>
                <p className="text-xs text-muted-foreground mt-1">{rejeteDoc.auteur}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Motif du rejet <span className="text-destructive">*</span></Label>
                <Textarea value={motifRejet} onChange={(e) => setMotifRejet(e.target.value)}
                  placeholder="Expliquez pourquoi ce document est rejeté…" className="text-sm resize-none" rows={4} />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => { setRejeteDoc(null); setMotifRejet("") }}>Annuler</Button>
            <Button variant="destructive" size="sm" className="gap-1.5" onClick={handleRejeter} disabled={!motifRejet.trim()}>
              <XCircle className="h-4 w-4" /> Confirmer le rejet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
