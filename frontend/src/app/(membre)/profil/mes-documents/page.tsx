"use client"

import { useMemo, useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  FileText, Clock, CheckCircle2, XCircle, ArrowLeft,
  Search, Upload, Eye, RefreshCw, Calendar, Download,
  GraduationCap, BookOpen, Loader2
} from "lucide-react"
import { DmnLoader } from "@/components/ui/dmn-loader"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/auth-context"
import { api } from "@/lib/api"
import { TYPE_LABELS, TYPE_COLORS, TYPE_ICONS } from "@/lib/document-types"
import { usePagination } from "@/components/ui/pagination"
import type { Document } from "@/types"

function fmt(iso: string | undefined) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
}

export default function MesDocumentsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [recherche, setRecherche] = useState("")
  const [refreshing, setRefreshing] = useState(false)
  const [docs, setDocs] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<string | null>(null)
  const downloadLinkRef = useRef<HTMLAnchorElement>(null)

  const loadDocs = useCallback(() => {
    setLoading(true)
    api.getMesDocuments()
      .then(setDocs)
      .catch(() => setDocs([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadDocs() }, [loadDocs])

  // On ne redirige qu'une fois la verification du token terminee — sinon le
  // premier rendu (user encore null le temps de la restauration de session)
  // renvoyait vers /connexion un utilisateur pourtant bien connecte.
  useEffect(() => {
    if (!authLoading && !user) router.push("/connexion")
  }, [authLoading, user, router])

  async function handleDownload(doc: Document) {
    if (downloading || !doc.fichierUrl) return
    setDownloading(doc.id)
    try {
      const { url } = await api.downloadDocument(doc.id)
      const res = await fetch(url)
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = downloadLinkRef.current!
      a.href = blobUrl
      a.download = `${doc.titre}.pdf`
      a.click()
      // Delai avant revocation : ouvrir un nouvel onglet (target=_blank) est
      // asynchrone - revoquer immediatement pouvait arriver avant que l'onglet
      // ait fini de charger le blob, l'ouvrant vide.
      setTimeout(() => URL.revokeObjectURL(blobUrl), 2000)
    } catch {
      // silencieux — l'URL directe peut aussi fonctionner
    } finally {
      setDownloading(null)
    }
  }

  const filtrees = useMemo(
    () => docs.filter((d) =>
      d.titre.toLowerCase().includes(recherche.toLowerCase())
    ),
    [docs, recherche]
  )

  const { paginated, PaginationBar } = usePagination(filtrees, 5)

  if (authLoading || loading) return <DmnLoader />
  if (!user) return null

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link href="/profil" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" /> Retour au profil
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mes documents</h1>
          <p className="text-sm text-muted-foreground">{docs.length} document{docs.length > 1 ? "s" : ""} soumis</p>
        </div>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-8"
          onClick={() => { setRefreshing(true); loadDocs(); setTimeout(() => setRefreshing(false), 800) }}
          disabled={refreshing}>
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} /> Actualiser
        </Button>
      </div>

      <div className="relative max-w-sm mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input value={recherche} onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher dans mes documents…" className="h-9 pl-9 rounded-lg text-sm" />
      </div>

      <a ref={downloadLinkRef} target="_blank" rel="noopener noreferrer" className="hidden" aria-hidden />

      {filtrees.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center rounded-xl border-2 border-dashed border-border">
          <FileText className="h-12 w-12 text-muted-foreground/20 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">Aucun document soumis</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Déposez votre premier mémoire ou thèse.</p>
          <Link href="/soumettre"><Button size="sm" className="mt-4 gap-2 bg-primary hover:bg-primary/90"><Upload className="h-4 w-4" /> Déposer</Button></Link>
        </div>
      ) : (
        <div className="space-y-4">
          {paginated.map((doc) => {
            const TypeIcon = TYPE_ICONS[doc.type] ?? FileText
            return (
            <div key={doc.id} className={`rounded-2xl border bg-card p-4 space-y-3 transition-all duration-200 hover:shadow-md ${doc.statut === "rejete" ? "border-red-200 dark:border-red-900" : "border-border hover:border-primary/30"}`}>
              {/* En-tête : titre + badge */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${doc.statut === "rejete" ? "bg-red-50 text-red-500 dark:bg-red-950" : TYPE_COLORS[doc.type] ?? "bg-primary/10 text-primary"}`}>
                    <TypeIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display text-sm font-bold leading-tight break-words">{doc.titre}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{TYPE_LABELS[doc.type] ?? doc.type}</p>
                  </div>
                </div>
                <StatusBadge status={doc.statut} />
              </div>

              {/* Métadonnées */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                {doc.faculte && (
                  <span className="flex items-center gap-1.5 col-span-2">
                    <BookOpen className="h-3.5 w-3.5 flex-shrink-0" /> {doc.faculte}
                  </span>
                )}
                {doc.filiere && (
                  <span className="flex items-center gap-1.5">
                    <GraduationCap className="h-3.5 w-3.5 flex-shrink-0" /> {doc.filiere}
                  </span>
                )}
                {doc.niveau && (
                  <span className="flex items-center gap-1.5">
                    <GraduationCap className="h-3.5 w-3.5 flex-shrink-0 opacity-0" /> {doc.niveau}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 flex-shrink-0" /> Soumis le {fmt(doc.soumisLe)}
                </span>
                {doc.statut === "approuve" && doc.approuveLe && (
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" /> Approuvé le {fmt(doc.approuveLe)}
                  </span>
                )}
                {doc.statut === "rejete" && doc.rejeteLe && (
                  <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                    <XCircle className="h-3.5 w-3.5 flex-shrink-0" /> Rejeté le {fmt(doc.rejeteLe)}
                  </span>
                )}
              </div>

              {/* Résumé */}
              {doc.resume && (
                <p className="text-xs text-muted-foreground line-clamp-2">{doc.resume}</p>
              )}

              {/* Motif de rejet */}
              {doc.statut === "rejete" && doc.motifRejet && (
                <div className="rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 px-3 py-2">
                  <p className="text-xs font-medium text-red-700 dark:text-red-300 mb-1">Motif de rejet</p>
                  <p className="text-xs text-red-600 dark:text-red-400 leading-relaxed">{doc.motifRejet}</p>
                </div>
              )}

              {/* Mini-stats */}
              {doc.statut === "approuve" && (
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {(doc.nbConsultations ?? 0).toLocaleString("fr-FR")} vue{(doc.nbConsultations ?? 0) > 1 ? "s" : ""}</span>
                  <span className="flex items-center gap-1"><Download className="h-3 w-3" /> {(doc.nbTelechargements ?? 0).toLocaleString("fr-FR")} téléchargement{(doc.nbTelechargements ?? 0) > 1 ? "s" : ""}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 justify-end pt-1 border-t border-border/40">
                {doc.fichierUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-xs h-8"
                    onClick={() => handleDownload(doc)}
                    disabled={downloading === doc.id}
                  >
                    {downloading === doc.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Download className="h-3.5 w-3.5" />}
                    PDF
                  </Button>
                )}
                <Link href={`/documents/${doc.id}`}>
                  <Button size="sm" className="gap-1.5 text-xs h-8 bg-primary hover:bg-primary/90">
                    <Eye className="h-3.5 w-3.5" /> Voir
                  </Button>
                </Link>
              </div>
            </div>
            )
          })}
        </div>
      )}

      <div className="flex items-center justify-between mt-4">
        <PaginationBar />
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { icon: React.ElementType; label: string; color: string }> = {
    en_attente: { icon: Clock,        label: "En attente", color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300" },
    approuve:   { icon: CheckCircle2, label: "Approuvé",   color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300" },
    rejete:     { icon: XCircle,      label: "Rejeté",     color: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300" },
  }
  const c = config[status]
  return (
    <Badge variant="outline" className={`gap-1 text-[10px] flex-shrink-0 ${c?.color ?? ""}`}>
      {c?.icon && <c.icon className="h-3 w-3" />} {c?.label ?? status}
    </Badge>
  )
}
