"use client"

import { useState, useEffect, useMemo } from "react"
import {
  FileText,
  ClipboardList,
  Users,
  TrendingUp,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowUpRight,
} from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { api } from "@/lib/api"
import type { DashboardStats, Document } from "@/types"

export default function AdminDashboard() {
  const [statsData, setStatsData] = useState<DashboardStats | null>(null)
  const [recentSubs, setRecentSubs] = useState<Document[]>([])

  useEffect(() => {
    api.getDashboardStats().then(setStatsData).catch(() => {})
    api.getSoumissions().then((docs) => setRecentSubs(docs.slice(0, 5))).catch(() => {})
  }, [])

  const stats = useMemo(() => ({
    totalApprouves: statsData?.totalDocuments ?? 0,
    enAttente: statsData?.soumissionsEnAttente ?? 0,
    rejetes: 0,
    approuvesCeMois: statsData?.documentsApprouvesCeMois ?? 0,
    totalMembres: statsData?.totalMembres ?? 0,
    topFacultes: (statsData?.topFacultes ?? []).map((f) => ({
      nom: f.nom,
      count: f.count,
      pct: statsData && statsData.totalDocuments > 0
        ? Math.round((f.count / statsData.totalDocuments) * 100)
        : 0,
    })),
  }), [statsData])

  const RECENT_SUBMISSIONS = useMemo(() =>
    recentSubs.map((d) => {
      const days = Math.floor((Date.now() - new Date(d.soumisLe).getTime()) / 86400000)
      const soumisLe = days === 0 ? "aujourd'hui" : days === 1 ? "hier" : `il y a ${days} jours`
      return {
        id: d.id,
        titre: d.titre,
        auteur: d.auteur,
        type: d.type === "memoire_master" ? "Mémoire Master" : d.type === "these_doctorat" ? "Thèse Doctorat" : d.type === "memoire_licence" ? "Mémoire Licence" : d.type,
        faculte: d.faculte,
        soumisLe,
      }
    }),
  [recentSubs])

  const STATS_CARDS = [
    {
      title: "Documents approuvés",
      value: stats.totalApprouves.toLocaleString("fr-FR"),
      change: `+${stats.approuvesCeMois} ce mois`,
      icon: FileText,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Soumissions en attente",
      value: String(stats.enAttente),
      change: "À traiter",
      icon: ClipboardList,
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-950",
      urgent: stats.enAttente > 0,
    },
    {
      title: "Membres inscrits",
      value: String(stats.totalMembres),
      change: "Tous les membres",
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950",
    },
    {
      title: "Téléchargements",
      value: "—",
      change: "Statistiques à venir",
      icon: TrendingUp,
      color: "text-purple-600",
      bg: "bg-purple-50 dark:bg-purple-950",
    },
  ]

  const STATUTS_SUMMARY = [
    { label: "Approuvés", value: stats.totalApprouves, icon: CheckCircle2, color: "text-primary" },
    { label: "En attente", value: stats.enAttente, icon: Clock, color: "text-amber-500" },
    { label: "Rejetés", value: stats.rejetes, icon: XCircle, color: "text-destructive" },
  ]

  const hasFacultes = stats.topFacultes.length > 0
  const totalFacCount = stats.topFacultes.reduce((sum, f) => sum + f.count, 0)

  return (
    <div className="space-y-6">
      {/* En-tête page */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tableau de bord</h1>
      </div>

      {/* Cartes stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STATS_CARDS.map((stat) => (
          <Card key={stat.title} className={stat.urgent ? "border-amber-200 dark:border-amber-800" : ""}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className={`text-xs mt-1 ${stat.urgent ? "text-amber-600 font-medium" : "text-muted-foreground"}`}>
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Soumissions récentes */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Soumissions récentes</CardTitle>
            </div>
            <Link href="/gestion/soumissions">
              <Button variant="outline" size="sm" className="gap-1.5">
                Tout voir
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {RECENT_SUBMISSIONS.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Aucune soumission en attente</p>
            ) : (
              RECENT_SUBMISSIONS.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-start gap-3 rounded-xl border border-border/60 p-3 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight line-clamp-1">{sub.titre}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {sub.auteur} · {sub.faculte}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <Badge variant="outline" className="text-[10px]">{sub.type}</Badge>
                    <span className="text-[10px] text-muted-foreground">{sub.soumisLe}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Répartition */}
        <div className="space-y-4">
          {/* Statuts */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Statuts des documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {STATUTS_SUMMARY.map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${color}`} />
                    <span className="text-sm">{label}</span>
                  </div>
                  <span className="text-sm font-semibold">{value.toLocaleString("fr-FR")}</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Top facultés */}
          {hasFacultes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Top facultés</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {stats.topFacultes.map(({ nom, count, pct }) => (
                  <div key={nom} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground truncate pr-2">{nom}</span>
                      <span className="font-medium flex-shrink-0">{count}</span>
                    </div>
                    <Progress value={pct} className="h-1.5" />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
