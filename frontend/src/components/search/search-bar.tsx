"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Search, X, Loader2, FileText, BookOpen, GraduationCap, TrendingUp } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { searchDocuments } from "@/lib/mock-data"
import { TYPE_LABELS } from "@/lib/document-types"
import type { Document } from "@/types"

const THEME_GROUPEMENTS = [
  { label: "Finance islamique", icon: TrendingUp, mots: ["finance islamique", "mourabaha", "moucharaka", "waqf", "zakât", "sadaqa", "banque islamique"] },
  { label: "Mouridisme & Spiritualité", icon: BookOpen, mots: ["mouridisme", "cheikh ahmadou bamba", "touba", "confrérie", "daara"] },
  { label: "Éducation & Pédagogie", icon: GraduationCap, mots: ["éducation", "pédagogie", "didactique", "enseignement", "coranique"] },
  { label: "Droit & Société", icon: FileText, mots: ["droit", "code", "famille", "juridique", "justice"] },
  { label: "Santé & Médecine", icon: FileText, mots: ["santé", "médecine", "maladie", "phytothérapie", "diagnostic"] },
  { label: "Sciences & Technologies", icon: FileText, mots: ["informatique", "mathématiques", "algorithme", "machine learning", "modélisation"] },
]

interface SearchBarProps {
  autoFocus?: boolean
  size?: "default" | "hero"
}

export function SearchBar({ autoFocus = false, size = "default" }: SearchBarProps) {
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const themesSuggests = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return THEME_GROUPEMENTS
      .map((g) => {
        const score = g.mots.filter((m) => m.includes(q) || q.includes(m)).length
        return { ...g, score }
      })
      .filter((g) => g.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
  }, [query])

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setSuggestions([])
      setOpen(false)
      return
    }
    setLoading(true)
    setTimeout(() => {
      const docs = searchDocuments(q, {}).slice(0, 5)
      setSuggestions(docs)
      setOpen(docs.length > 0 || themesSuggests.length > 0)
      setLoading(false)
    }, 200)
  }, [themesSuggests])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(query), 200)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, fetchSuggestions])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setOpen(false)
    router.push(`/recherche?q=${encodeURIComponent(query.trim())}`)
  }

  function navigateToSearch(q: string) {
    setOpen(false)
    setQuery("")
    router.push(`/recherche?q=${encodeURIComponent(q)}`)
  }

  const isHero = size === "hero"

  return (
    <div ref={containerRef} className="w-full">
      <form onSubmit={handleSubmit}>
        <div className="relative flex items-center">
          <Search className={`absolute left-4 text-muted-foreground pointer-events-none transition-colors ${isHero ? "h-5 w-5" : "h-4 w-4"} ${query ? "text-primary" : ""}`} />
          <Input
            ref={inputRef}
            autoFocus={autoFocus}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { if (query.length >= 2 || suggestions.length > 0) setOpen(true) }}
            placeholder="Rechercher un mémoire, une thèse, un auteur…"
            className={`w-full border-2 focus-visible:ring-0 focus-visible:border-primary transition-all bg-background ${
              isHero
                ? "h-14 pl-12 pr-14 text-base rounded-2xl shadow-lg border-border/60 hover:border-primary/40 focus-visible:shadow-xl"
                : "h-10 pl-10 pr-10 rounded-xl"
            }`}
          />
          {query && (
            <button type="button" onClick={() => { setQuery(""); setSuggestions([]); setOpen(false); inputRef.current?.focus() }}
              className={`${isHero ? "right-14" : "right-10"} absolute text-muted-foreground hover:text-foreground transition-colors`}>
              <X className="h-4 w-4" />
            </button>
          )}
          <button type="submit" disabled={!query.trim()}
            className={`absolute right-2 flex items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-all ${isHero ? "h-10 w-10" : "h-7 w-7"}`}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </button>
        </div>
      </form>

      {/* Dropdown en flux normal — pousse le contenu en dessous sans superposition */}
      {open && (suggestions.length > 0 || themesSuggests.length > 0) && (
        <div className="mt-2 rounded-xl border border-border bg-popover shadow-xl overflow-hidden">
          {themesSuggests.length > 0 && (
            <div className="px-3 py-2 border-b border-border/50">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Thèmes suggérés</p>
              <div className="flex flex-wrap gap-1.5">
                {themesSuggests.map((t) => (
                  <button key={t.label} type="button"
                    onClick={() => navigateToSearch(t.label)}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/5 px-2.5 py-1 text-xs text-primary hover:bg-primary/10 transition-colors">
                    <t.icon className="h-3 w-3" />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {suggestions.length > 0 && (
            <ul>
              {suggestions.map((doc, i) => (
                <li key={doc.id}>
                  {i > 0 && <div className="mx-4 border-t border-border/50" />}
                  <button type="button" onClick={() => navigateToSearch(doc.titre)}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-accent transition-colors">
                    <div className="mt-0.5 flex-shrink-0 rounded-lg bg-primary/10 p-1.5">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{doc.titre}</p>
                      <p className="text-xs text-muted-foreground">{doc.auteur} · {doc.faculte} · {doc.annee}</p>
                    </div>
                    <Badge variant="secondary" className="flex-shrink-0 text-[10px]">
                      {TYPE_LABELS[doc.type] ?? doc.type}
                    </Badge>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {query && (
            <button type="button" onClick={() => navigateToSearch(query)}
              className="flex w-full items-center gap-2 border-t border-border/50 px-4 py-3 text-sm text-primary hover:bg-primary/5 transition-colors font-medium">
              <Search className="h-3.5 w-3.5" />
              Voir tous les résultats pour &ldquo;{query}&rdquo;
            </button>
          )}
        </div>
      )}
    </div>
  )
}
