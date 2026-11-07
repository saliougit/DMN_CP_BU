"use client"

import { useMemo, useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  FileText, Clock, CheckCircle2, XCircle, ArrowLeft, ChevronRight,
  Search, Upload, Eye, RefreshCw, Calendar, Download, X,
  GraduationCap, BookOpen, Loader2
} from "lucide-react"
import { DmnLoader } from "@/components/ui/dmn-loader"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/contexts/auth-context"
import { api } from "@/lib/api"
import { TYPE_LABELS, TYPE_COLORS, TYPE_ICONS } from "@/lib/document-types"
import { usePagination } from "@/components/ui/pagination"
import type { Document } from "@/types"

function fmt(iso: string | undefined) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
}

const STATUT_OPTIONS = [
  { value: "en_attente", label: "En attente" },
  { value: "approuve", label: "Approuvé" },
  { value: "rejete", label: "Rejeté" },
] as const

const ALL = "__all__"

export default function MesDocumentsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [recherche, setRecherche] = useState("")
  const [statutFiltre, setStatutFiltre] = useState<string>("")
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
      d.titre.toLowerCase().includes(recherche.toLowerCase()) &&
      (!statutFiltre || d.statut === statutFiltre)
    ),
    [docs, recherche, statutFiltre]
  )

  const { paginated, PaginationBar } = usePagination(filtrees, 6)
  const isSearching = recherche.trim().length > 0 || !!statutFiltre

  if (authLoading || loading) return <DmnLoader />
  if (!user) return null

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link href="/profil" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" /> Retour au profil
      </Link>

      <div className="flex items-center justify-between gap-3 mb-2">
        <h1 className="font-display text-2xl font-bold tracking-tight">Mes documents</h1>
        <div className="flex items-center gap-2">
          {docs.length > 0 && (
            <Badge className="rounded-md bg-primary/10 text-primary border-0">
              {isSearching && filtrees.length !== docs.length
                ? `${filtrees.length} sur ${docs.length}`
                : `${docs.length} document${docs.length > 1 ? "s" : ""}`}
            </Badge>
          )}
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-8"
            onClick={() => { setRefreshing(true); loadDocs(); setTimeout(() => setRefreshing(false), 800) }}
            disabled={refreshing}>
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Actualiser</span>
          </Button>
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-6">Vos soumissions et leur statut, réunis au même endroit.</p>

      {/* Filtres : statut (segmenté, reset) + recherche */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-6">
        <div className="flex w-full items-stretch rounded-lg border border-border bg-card sm:w-fit">
          <Select value={statutFiltre || ALL} onValueChange={(v) => setStatutFiltre(v && v !== ALL ? v : "")}>
            <SelectTrigger aria-label="Statut" className="h-9 w-full min-w-40 rounded-none border-0 shadow-none sm:w-auto">
              <SelectValue>
                {statutFiltre ? STATUT_OPTIONS.find((o) => o.value === statutFiltre)?.label : "Statut"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL} className="text-xs">Tous</SelectItem>
              {STATUT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {statutFiltre && (
            <>
              <div aria-hidden className="w-px shrink-0 self-stretch bg-border" />
              <button onClick={() => setStatutFiltre("")} aria-label="Réinitialiser"
                className="flex items-center gap-1.5 rounded-r-lg bg-foreground px-3 text-xs font-medium text-background hover:bg-foreground/90 transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>

        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input value={recherche} onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher dans mes documents…" className="h-9 pl-9 rounded-lg text-sm" />
        </div>
      </div>

      <a ref={downloadLinkRef} target="_blank" rel="noopener noreferrer" className="hidden" aria-hidden />

      {filtrees.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center rounded-xl border-2 border-dashed border-border">
          <FileText className="h-12 w-12 text-muted-foreground/20 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">
            {docs.length === 0 ? "Aucun document soumis" : "Aucun résultat pour ces filtres"}
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            {docs.length === 0 ? "Déposez votre premier mémoire ou thèse." : "Essayez un autre terme ou réinitialisez le statut."}
          </p>
          {docs.length === 0 ? (
            <Link href="/soumettre"><Button size="sm" className="mt-4 gap-2 bg-primary hover:bg-primary/90"><Upload className="h-4 w-4" /> Déposer</Button></Link>
          ) : (
            <Button size="sm" variant="outline" className="mt-4 gap-2" onClick={() => { setRecherche(""); setStatutFiltre("") }}>
              <X className="h-4 w-4" /> Réinitialiser
            </Button>
          )}
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {paginated.map((doc) => (
            <DocumentCard key={doc.id} doc={doc} downloading={downloading === doc.id} onDownload={() => handleDownload(doc)} />
          ))}
        </ul>
      )}

      <div className="flex items-center justify-between mt-4">
        <PaginationBar />
      </div>
    </div>
  )
}

function DocumentCard({ doc, downloading, onDownload }: { doc: Document; downloading: boolean; onDownload: () => void }) {
  const TypeIcon = TYPE_ICONS[doc.type] ?? FileText
  const s = STATUS_META[doc.statut] ?? STATUS_META.en_attente

  return (
    <li className="h-full">
      <Link href={`/documents/${doc.id}`}
        className="group relative flex h-full flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-none outline-none transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-[3px] focus-visible:ring-ring/50">
        <Badge variant="outline" className={`absolute -top-2 left-4 z-10 gap-1 rounded-md text-[10px] shadow-sm backdrop-blur-sm ${s.badgeCls}`}>
          <s.icon className="h-3 w-3" /> {s.label}
        </Badge>

        <div className="flex items-start justify-between gap-2 pt-1.5">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${TYPE_COLORS[doc.type] ?? "bg-primary/10 text-primary"}`}>
              <TypeIcon className="h-4 w-4" />
            </div>
            <h3 className="font-display text-sm font-bold leading-tight break-words line-clamp-2">{doc.titre}</h3>
          </div>
          <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </div>

        <Badge variant="secondary" className="w-fit text-[10px]">{TYPE_LABELS[doc.type] ?? doc.type}</Badge>

        <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
          <p className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 flex-shrink-0" /> Soumis le {fmt(doc.soumisLe)}</p>
          {doc.faculte && <p className="flex items-center gap-1.5 truncate"><BookOpen className="h-3.5 w-3.5 flex-shrink-0" /> {doc.faculte}</p>}
          {doc.filiere && <p className="flex items-center gap-1.5 truncate"><GraduationCap className="h-3.5 w-3.5 flex-shrink-0" /> {doc.filiere} · {doc.niveau}</p>}
        </div>

        <div className="mt-auto flex flex-col gap-1.5 border-t border-border/60 pt-3 text-xs">
          {doc.statut === "rejete" && doc.motifRejet ? (
            <p className="text-red-600 dark:text-red-400 line-clamp-2"><span className="font-semibold">Motif :</span> {doc.motifRejet}</p>
          ) : doc.statut === "approuve" ? (
            <p className="flex items-center gap-3 text-muted-foreground">
              <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {(doc.nbConsultations ?? 0).toLocaleString("fr-FR")}</span>
              <span className="flex items-center gap-1"><Download className="h-3 w-3" /> {(doc.nbTelechargements ?? 0).toLocaleString("fr-FR")}</span>
            </p>
          ) : (
            <p className="text-muted-foreground">En cours d&apos;évaluation par la Commission Pédagogique.</p>
          )}

          {doc.fichierUrl && (
            <Button
              variant="outline" size="sm" className="gap-1.5 text-xs h-8 w-full"
              onClick={(e) => { e.preventDefault(); onDownload() }}
              disabled={downloading}
            >
              {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              Télécharger le PDF
            </Button>
          )}
        </div>
      </Link>
    </li>
  )
}

const STATUS_META: Record<string, { icon: React.ElementType; label: string; badgeCls: string }> = {
  en_attente: { icon: Clock,        label: "En attente", badgeCls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300" },
  approuve:   { icon: CheckCircle2, label: "Approuvé",   badgeCls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300" },
  rejete:     { icon: XCircle,      label: "Rejeté",     badgeCls: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300" },
}
