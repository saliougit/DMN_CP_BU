"use client"

import { useState, useMemo, useEffect } from "react"
import {
  CheckCircle2, XCircle, Eye, Clock, FileText, RefreshCw,
  User, GraduationCap, Calendar, AlertTriangle, Search,
  BookOpen, X
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { SubmissionDetailDrawer } from "@/components/admin/submission-detail-drawer"
import type { PickedNode } from "@/components/admin/submission-detail-drawer"
import { api } from "@/lib/api"
import type { Document } from "@/types"
import { usePagination } from "@/components/ui/pagination"
import { toast } from "sonner"

const STATUS_TABS = [
  { key: "all", label: "Toutes" },
  { key: "en_attente", label: "En attente" },
  { key: "approuve", label: "Approuvées" },
  { key: "rejete", label: "Rejetées" },
] as const

type TabKey = (typeof STATUS_TABS)[number]["key"]

const TYPE_LABELS: Record<string, string> = {
  memoire_licence: "Mémoire Licence",
  memoire_master: "Mémoire Master",
  these_doctorat: "Thèse Doctorat",
  article: "Article",
  rapport: "Rapport",
}

const STATUS_STYLE: Record<string, { icon: React.ElementType; label: string; cardBg: string; iconBg: string; iconColor: string; borderColor: string }> = {
  en_attente: {
    icon: Clock, label: "En attente",
    cardBg: "bg-amber-50 dark:bg-amber-950",
    iconBg: "bg-amber-50 dark:bg-amber-950",
    iconColor: "text-amber-600 dark:text-amber-400",
    borderColor: "border-amber-200 dark:border-amber-800",
  },
  approuve: {
    icon: CheckCircle2, label: "Approuvé",
    cardBg: "bg-emerald-50 dark:bg-emerald-950",
    iconBg: "bg-emerald-50 dark:bg-emerald-950",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    borderColor: "border-emerald-200 dark:border-emerald-800",
  },
  rejete: {
    icon: XCircle, label: "Rejeté",
    cardBg: "bg-red-50 dark:bg-red-950",
    iconBg: "bg-red-50 dark:bg-red-950",
    iconColor: "text-red-600 dark:text-red-400",
    borderColor: "border-red-200 dark:border-red-800",
  },
}

export default function SoumissionsPage() {
  const [allDocs, setAllDocs] = useState<Document[]>([])
  const [tab, setTab] = useState<TabKey>("en_attente")
  const [recherche, setRecherche] = useState("")
  const [detailDoc, setDetailDoc] = useState<Document | null>(null)
  const [rejeteDoc, setRejeteDoc] = useState<Document | null>(null)
  const [motifRejet, setMotifRejet] = useState("")
  const [refreshing, setRefreshing] = useState(false)

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

  const { paginated, PaginationBar } = usePagination(filtrees, 5)

  const counts = useMemo(() => ({
    all: allDocs.length,
    en_attente: allDocs.filter((d) => d.statut === "en_attente").length,
    approuve: allDocs.filter((d) => d.statut === "approuve").length,
    rejete: allDocs.filter((d) => d.statut === "rejete").length,
  }), [allDocs])

  async function handleApprouver(doc: Document, _classif: PickedNode) {
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
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  active
                    ? "bg-background text-foreground shadow-sm border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}>
                <Icon className={`h-3.5 w-3.5 ${active && t.key !== "all" ? STATUS_STYLE[t.key]?.iconColor : ""}`} />
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
            placeholder="Rechercher par titre ou auteur…" className="pl-9 h-8 rounded-lg text-xs" />
          {recherche && (
            <button onClick={() => setRecherche("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Liste en cartes */}
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
        <div className="space-y-3">
          {paginated.map((doc) => (
            <SubmissionCard
              key={doc.id}
              doc={doc}
              onPreview={() => setDetailDoc(doc)}
              onApprouver={() => setDetailDoc(doc)}
              onRejeter={() => setRejeteDoc(doc)}
            />
          ))}
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

function SubmissionCard({ doc, onPreview, onApprouver, onRejeter }: {
  doc: Document; onPreview: () => void; onApprouver: () => void; onRejeter: () => void
}) {
  const s = STATUS_STYLE[doc.statut] ?? STATUS_STYLE.en_attente
  const Icon = s.icon

  return (
    <div className={`rounded-xl border ${s.borderColor} bg-card p-4 hover:border-border/80 transition-colors`}>
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-xl ${s.iconBg} border ${s.borderColor}`}>
          <Icon className={`h-5 w-5 ${s.iconColor}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold leading-snug line-clamp-2 flex-1">{doc.titre}</h3>
            <Badge variant="outline" className={`flex-shrink-0 text-[10px] ${s.borderColor} ${s.iconColor}`}>
              <Icon className="h-3 w-3 mr-1" /> {s.label}
            </Badge>
          </div>

          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><User className="h-3 w-3" />{doc.auteur}</span>
            <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{doc.faculte}</span>
            <span className="flex items-center gap-1"><GraduationCap className="h-3 w-3" />{doc.niveau}</span>
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{doc.soumisLe}</span>
          </div>

          {doc.statut === "rejete" && doc.motifRejet && (
            <div className="mt-2 rounded-lg bg-destructive/5 border border-destructive/10 px-3 py-2">
              <p className="text-[10px] font-semibold text-destructive uppercase tracking-wide mb-0.5">Motif du rejet</p>
              <p className="text-xs text-destructive/80">{doc.motifRejet}</p>
            </div>
          )}

          {doc.statut === "approuve" && doc.approuveParId && (() => {
            return <p className="mt-2 text-[10px] text-muted-foreground">Approuvé par {doc.approuveParId}</p>
          })()}

          <p className="mt-2 text-xs text-muted-foreground line-clamp-1">{doc.resume}</p>
        </div>
      </div>

      <Separator className="my-3" />

      <div className="flex items-center justify-between gap-2">
        <Badge variant="secondary" className="text-[10px]">{TYPE_LABELS[doc.type] ?? doc.type}</Badge>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onPreview} className="gap-1.5 h-8 text-xs">
            <Eye className="h-3.5 w-3.5" /> Détails
          </Button>
          {doc.statut === "en_attente" && (
            <>
              <Button variant="outline" size="sm" onClick={onRejeter}
                className="gap-1.5 h-8 text-xs text-destructive border-destructive/30 hover:bg-destructive/5 hover:border-destructive/60">
                <XCircle className="h-3.5 w-3.5" /> Rejeter
              </Button>
              <Button size="sm" onClick={onApprouver} className="gap-1.5 h-8 text-xs bg-primary hover:bg-primary/90">
                <CheckCircle2 className="h-3.5 w-3.5" /> Approuver
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
