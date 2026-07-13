"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  FileText, Clock, CheckCircle2, XCircle, ArrowLeft,
  Search, Upload, Eye, RefreshCw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/auth-context"
import { MOCK_DOCUMENTS } from "@/lib/mock-data"
import { TYPE_LABELS, TYPE_COLORS } from "@/lib/document-types"
import { usePagination } from "@/components/ui/pagination"
import { useState, useCallback } from "react"

export default function MesDocumentsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [recherche, setRecherche] = useState("")
  const [refreshing, setRefreshing] = useState(false)
  const [, forceUpdate] = useState(0)

  const docs = useMemo(
    () => MOCK_DOCUMENTS.filter((d) => d.soumisParId === user?.id),
    [user]
  )

  const filtrees = useMemo(
    () => docs.filter((d) =>
      d.titre.toLowerCase().includes(recherche.toLowerCase())
    ),
    [docs, recherche]
  )

  const { paginated, PaginationBar } = usePagination(filtrees, 5)

  if (!user) { router.push("/connexion"); return null }

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
          onClick={() => { setRefreshing(true); forceUpdate((n) => n + 1); setTimeout(() => setRefreshing(false), 600) }}
          disabled={refreshing}>
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} /> Actualiser
        </Button>
      </div>

      <div className="relative max-w-sm mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input value={recherche} onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher dans mes documents…" className="h-9 pl-9 rounded-lg text-sm" />
      </div>

      {filtrees.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center rounded-xl border-2 border-dashed border-border">
          <FileText className="h-12 w-12 text-muted-foreground/20 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">Aucun document soumis</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Déposez votre premier mémoire ou thèse.</p>
          <Link href="/soumettre"><Button size="sm" className="mt-4 gap-2 bg-primary hover:bg-primary/90"><Upload className="h-4 w-4" /> Déposer</Button></Link>
        </div>
      ) : (
        <div className="space-y-3">
          {paginated.map((doc) => (
            <div key={doc.id} className="rounded-xl border border-border bg-card p-4 space-y-2.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                  <div className="mt-0.5 flex-shrink-0 rounded-lg bg-primary/10 p-1.5">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold leading-tight">{doc.titre}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{doc.type} · {doc.annee}</p>
                  </div>
                </div>
                <StatusBadge status={doc.statut} />
              </div>

              <p className="text-xs text-muted-foreground line-clamp-1">{doc.resume}</p>

              <div className="flex items-center gap-2 justify-end">
                {doc.statut === "rejete" && doc.motifRejet && (
                  <p className="text-xs text-destructive flex-1">Motif : {doc.motifRejet}</p>
                )}
                <Link href={`/documents/${doc.id}`}>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
                    <Eye className="h-3.5 w-3.5" /> Voir
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <PaginationBar />
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { icon: React.ElementType; label: string; color: string }> = {
    en_attente: { icon: Clock, label: "En attente", color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300" },
    approuve: { icon: CheckCircle2, label: "Approuvé", color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300" },
    rejete: { icon: XCircle, label: "Rejeté", color: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300" },
  }
  const c = config[status]
  return (
    <Badge variant="outline" className={`gap-1 text-[10px] ${c?.color ?? ""}`}>
      {c?.icon && <c.icon className="h-3 w-3" />} {c?.label ?? status}
    </Badge>
  )
}
