"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  Search, SlidersHorizontal, FileText, BookOpen,
  GraduationCap, Loader2, X, Download,
  User, Calendar, Tag, ExternalLink, RefreshCw
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/lib/api"
import { TYPE_LABELS, TYPE_COLORS } from "@/lib/document-types"
import { usePagination } from "@/components/ui/pagination"
import type { Document, Faculte, Niveau } from "@/types"

const THEME_GROUPEMENTS = [
  { label: "Finance & Économie islamique", mots: ["finance islamique", "banque islamique", "mourabaha", "moucharaka", "waqf", "zakât"] },
  { label: "Mouridisme & Spiritualité", mots: ["mouridisme", "cheikh ahmadou bamba", "touba", "confrérie", "daara"] },
  { label: "Éducation & Pédagogie", mots: ["éducation", "pédagogie", "didactique", "enseignement", "coranique"] },
  { label: "Droit & Société", mots: ["droit", "code de la famille", "juridique", "justice"] },
  { label: "Santé & Médecine", mots: ["santé", "médecine", "maladie", "phytothérapie", "tropical"] },
  { label: "Sciences & Technologies", mots: ["informatique", "mathématiques", "algorithme", "machine learning", "modélisation"] },
]

// Années fixes disponibles pour le filtre
const ANNEES_FIXES = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i)

function groupThemeMatches(query: string) {
  if (!query.trim()) return []
  const q = query.toLowerCase()
  return THEME_GROUPEMENTS
    .map((g) => ({ ...g, score: g.mots.filter((m) => m.includes(q) || q.includes(m)).length }))
    .filter((g) => g.score > 0)
    .sort((a, b) => b.score - a.score)
}

function DocumentCard({ doc, selected, onSelect }: { doc: Document; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left group rounded-xl border p-4 space-y-2.5 transition-all cursor-pointer ${
        selected
          ? "border-primary bg-primary/5 shadow-md"
          : "border-border bg-card hover:border-primary/50 hover:shadow-md hover:bg-accent/20"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <div className="mt-0.5 flex-shrink-0 rounded-lg bg-primary/10 p-1.5">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <h2 className="text-sm font-semibold leading-snug text-foreground line-clamp-2">{doc.titre}</h2>
        </div>
        <span className={`flex-shrink-0 text-[10px] border rounded-full px-2 py-0.5 font-medium ${TYPE_COLORS[doc.type] ?? "bg-muted text-muted-foreground border-border"}`}>
          {TYPE_LABELS[doc.type] ?? doc.type}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><GraduationCap className="h-3 w-3" />{doc.auteur}</span>
        <span>·</span>
        <span className="truncate">{doc.faculte}</span>
        <span>·</span>
        <span>{doc.annee}</span>
      </div>

      {doc.resume && (
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{doc.resume}</p>
      )}

      <div className="flex flex-wrap gap-1.5 pt-0.5">
        {doc.motsCles.slice(0, 3).map((tag) => (
          <span key={tag} className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
            {tag}
          </span>
        ))}
      </div>
    </button>
  )
}

function DocumentPreview({ doc }: { doc: Document | null }) {
  if (!doc) {
    return (
      <div className="flex h-full items-center justify-center text-center p-8">
        <div className="max-w-xs space-y-3">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground/20" />
          <p className="text-sm text-muted-foreground">Sélectionnez un document pour voir ses détails</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        <div className="p-5 space-y-5">
          <div>
            <Badge className="mb-2 bg-primary/10 text-primary border-0 text-xs">{TYPE_LABELS[doc.type] ?? doc.type}</Badge>
            <h3 className="text-base font-bold leading-snug">{doc.titre}</h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <MetaItem icon={User} label="Auteur" value={doc.auteur} />
            <MetaItem icon={Calendar} label="Année" value={String(doc.annee)} />
            <MetaItem icon={BookOpen} label="Faculté" value={doc.faculte} />
            <MetaItem icon={GraduationCap} label="Niveau" value={doc.niveau} />
            {doc.directeur && <MetaItem icon={User} label="Directeur" value={doc.directeur} />}
            {doc.pages && <MetaItem icon={FileText} label="Pages" value={`${doc.pages} p.`} />}
          </div>

          {doc.motsCles.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Mots-clés</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {doc.motsCles.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
              </div>
            </div>
          )}

          {doc.resume && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Résumé</p>
              <p className="text-sm leading-relaxed text-foreground/80">{doc.resume}</p>
            </div>
          )}
        </div>
      </div>
      <div className="flex-shrink-0 border-t border-border/60 p-4">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2 flex-1 text-xs h-9">
            <Download className="h-3.5 w-3.5" /> Télécharger
          </Button>
          <Link href={`/documents/${doc.id}`} className="flex-1">
            <Button size="sm" className="gap-2 w-full text-xs h-9 bg-primary hover:bg-primary/90">
              <ExternalLink className="h-3.5 w-3.5" /> Voir en détail
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

function MetaItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-xs text-foreground truncate">{value}</p>
      </div>
    </div>
  )
}

function DocumentCardSkeleton() {
  return (
    <div className="rounded-xl border border-border p-4 space-y-3 animate-pulse">
      <div className="flex items-start gap-2.5">
        <Skeleton className="h-7 w-7 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-3/5" />
        </div>
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="h-3 w-2/3" />
      <Skeleton className="h-3 w-full" />
    </div>
  )
}

export function SearchClient() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [query, setQuery] = useState(searchParams.get("q") ?? "")
  const [filtreType, setFiltreType] = useState(searchParams.get("type") ?? "")
  const [filtreFaculte, setFiltreFaculte] = useState(searchParams.get("faculte") ?? "")
  const [filtreNiveau, setFiltreNiveau] = useState(searchParams.get("niveau") ?? "")
  const [filtreFiliere, setFiltreFiliere] = useState(searchParams.get("filiere") ?? "")
  const [filtreAnnee, setFiltreAnnee] = useState(searchParams.get("annee") ?? "")
  const [results, setResults] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [facultes, setFacultes] = useState<Faculte[]>([])
  const [niveaux, setNiveaux] = useState<Niveau[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    api.getFacultes().then(setFacultes).catch(() => {})
    api.getNiveaux().then(setNiveaux).catch(() => {})
  }, [])

  const themes = useMemo(() => groupThemeMatches(query), [query])

  const { paginated, PaginationBar } = usePagination(results, 8)

  const runSearch = useCallback((
    q: string, type: string, faculte: string, niveau: string, filiere: string, annee: string
  ) => {
    setLoading(true)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.searchDocuments({
          q: q || undefined,
          type: type as any || undefined,
          faculte: faculte || undefined,
          niveau: niveau || undefined,
          filiere: filiere || undefined,
          annee: annee ? Number(annee) : undefined,
        })
        setResults(res.documents)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
      const params = new URLSearchParams()
      if (q) params.set("q", q)
      if (type) params.set("type", type)
      if (faculte) params.set("faculte", faculte)
      if (niveau) params.set("niveau", niveau)
      if (filiere) params.set("filiere", filiere)
      if (annee) params.set("annee", annee)
      router.replace(`/recherche?${params.toString()}`, { scroll: false })
    }, 300)
  }, [router])

  useEffect(() => {
    runSearch(query, filtreType, filtreFaculte, filtreNiveau, filtreFiliere, filtreAnnee)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, filtreType, filtreFaculte, filtreNiveau, filtreFiliere, filtreAnnee, runSearch])

  function resetFiltres() {
    setFiltreType("")
    setFiltreFaculte("")
    setFiltreNiveau("")
    setFiltreFiliere("")
    setFiltreAnnee("")
  }

  const allFilieres = useMemo(() =>
    facultes.flatMap((f) => f.filieres.map((fi) => ({ ...fi, faculteNom: f.nom }))),
  [facultes])

  const hasFiltres = !!(filtreType || filtreFaculte || filtreNiveau || filtreFiliere || filtreAnnee)

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {/* Barre recherche + thèmes suggérés */}
      <div className="mb-6 space-y-2">
        <div className="relative max-w-xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un mémoire, une thèse, un auteur, des mots-clés…"
            className="h-11 pl-10 pr-10 rounded-xl border-2 focus-visible:ring-0 focus-visible:border-primary text-sm"
            autoFocus
          />
          {loading && <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />}
          {query && !loading && (
            <button onClick={() => setQuery("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {themes.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-muted-foreground">Thèmes suggérés :</span>
            {themes.map((t) => (
              <Badge
                key={t.label}
                variant="secondary"
                className="gap-1 text-xs cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors"
                onClick={() => setQuery(t.mots[0])}
              >
                {t.label}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* 3 colonnes */}
      <div className="flex gap-6" style={{ height: "calc(100vh - 12rem)" }}>
        {/* Colonne 1 : Filtres */}
        <aside className="w-56 flex-shrink-0">
          <div className="sticky top-0 rounded-xl border border-border bg-card p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">Filtres</span>
              </div>
              {hasFiltres && <button onClick={resetFiltres} className="text-xs text-primary hover:underline">Effacer</button>}
            </div>
            <Separator />

            {/* Type */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Type</p>
              <Select value={filtreType || "__all__"} onValueChange={(v) => setFiltreType(v && v !== "__all__" ? v : "")}>
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__" className="text-xs">Tous</SelectItem>
                  {Object.entries(TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value} className="text-xs">{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Separator />

            {/* Faculté */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Faculté</p>
              <Select
                value={filtreFaculte || "__all__"}
                onValueChange={(v) => {
                  if (!v || v === "__all__") { setFiltreFaculte(""); setFiltreFiliere("") }
                  else { setFiltreFaculte(v); setFiltreFiliere("") }
                }}
              >
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__" className="text-xs">Toutes</SelectItem>
                  {facultes.map((f) => (
                    <SelectItem key={f.id} value={f.nom} className="text-xs">{f.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filière (cascade de la faculté) */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Filière</p>
              <Select value={filtreFiliere || "__all__"} onValueChange={(v) => setFiltreFiliere(v && v !== "__all__" ? v : "")}>
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__" className="text-xs">Toutes</SelectItem>
                  {(filtreFaculte
                    ? allFilieres.filter((f) => f.faculteNom === filtreFaculte)
                    : allFilieres
                  ).map((f) => (
                    <SelectItem key={f.id} value={f.nom} className="text-xs">{f.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Separator />

            {/* Niveau */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Niveau</p>
              <Select value={filtreNiveau || "__all__"} onValueChange={(v) => setFiltreNiveau(v && v !== "__all__" ? v : "")}>
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__" className="text-xs">Tous</SelectItem>
                  {niveaux.map((n) => (
                    <SelectItem key={n.id} value={n.nom} className="text-xs">{n.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Année */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Année</p>
              <Select value={filtreAnnee || "__all__"} onValueChange={(v) => setFiltreAnnee(v && v !== "__all__" ? v : "")}>
                <SelectTrigger className="w-full h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__" className="text-xs">Toutes</SelectItem>
                  {ANNEES_FIXES.map((a) => (
                    <SelectItem key={a} value={String(a)} className="text-xs">{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </aside>

        {/* Colonne 2 : Résultats */}
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="mb-3 flex items-center gap-2 flex-shrink-0">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                Recherche…
              </div>
            ) : (
              <>
                <span className="text-sm font-semibold">{results.length} résultat{results.length > 1 ? "s" : ""}</span>
                {query && <span className="text-sm text-muted-foreground">pour <strong className="text-foreground">&ldquo;{query}&rdquo;</strong></span>}
                {filtreType && (
                  <Badge variant="secondary" className="gap-1 text-xs cursor-pointer" onClick={() => setFiltreType("")}>
                    {TYPE_LABELS[filtreType]} <X className="h-3 w-3" />
                  </Badge>
                )}
                {filtreFaculte && (
                  <Badge variant="secondary" className="gap-1 text-xs cursor-pointer" onClick={() => { setFiltreFaculte(""); setFiltreFiliere("") }}>
                    {facultes.find((f) => f.nom === filtreFaculte)?.code ?? filtreFaculte} <X className="h-3 w-3" />
                  </Badge>
                )}
                {filtreFiliere && (
                  <Badge variant="secondary" className="gap-1 text-xs cursor-pointer" onClick={() => setFiltreFiliere("")}>
                    {filtreFiliere} <X className="h-3 w-3" />
                  </Badge>
                )}
                {filtreNiveau && (
                  <Badge variant="secondary" className="gap-1 text-xs cursor-pointer" onClick={() => setFiltreNiveau("")}>
                    {filtreNiveau} <X className="h-3 w-3" />
                  </Badge>
                )}
                {filtreAnnee && (
                  <Badge variant="secondary" className="gap-1 text-xs cursor-pointer" onClick={() => setFiltreAnnee("")}>
                    {filtreAnnee} <X className="h-3 w-3" />
                  </Badge>
                )}
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 ml-auto"
                  onClick={() => { setRefreshing(true); runSearch(query, filtreType, filtreFaculte, filtreNiveau, filtreFiliere, filtreAnnee); setTimeout(() => setRefreshing(false), 800) }}
                  title="Actualiser" disabled={refreshing}>
                  <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                </Button>
              </>
            )}
          </div>

          <ScrollArea className="flex-1 -mr-2 pr-2">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <DocumentCardSkeleton key={i} />)}
              </div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Search className="h-12 w-12 text-muted-foreground/20 mb-4" />
                <p className="text-sm font-medium text-muted-foreground">Aucun résultat</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Essayez d&apos;autres termes ou retirez les filtres</p>
                {hasFiltres && <Button variant="outline" size="sm" className="mt-4" onClick={resetFiltres}>Supprimer les filtres</Button>}
              </div>
            ) : (
              <div className="space-y-3 pr-1">
                {paginated.map((doc) => (
                  <DocumentCard key={doc.id} doc={doc} selected={selectedDoc?.id === doc.id} onSelect={() => setSelectedDoc(doc)} />
                ))}
              </div>
            )}
          </ScrollArea>
          <div className="pt-3 flex-shrink-0">
            <PaginationBar />
          </div>
        </div>

        {/* Colonne 3 : Aperçu du document sélectionné */}
        <aside className="w-80 flex-shrink-0 hidden xl:block">
          <div className="sticky top-0 rounded-xl border border-border bg-card overflow-hidden" style={{ height: "calc(100vh - 12rem)" }}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Aperçu</p>
              {selectedDoc && (
                <Link href={`/documents/${selectedDoc.id}`}>
                  <Button variant="ghost" size="sm" className="gap-1 h-7 text-xs">
                    <ExternalLink className="h-3 w-3" /> Ouvrir
                  </Button>
                </Link>
              )}
            </div>
            <DocumentPreview doc={selectedDoc} />
          </div>
        </aside>
      </div>
    </div>
  )
}
