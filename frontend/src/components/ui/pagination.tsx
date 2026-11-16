"use client"
import { useState, useMemo } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function usePagination<T>(items: T[], perPage: number) {
  const [page, setPage] = useState(1)
  const total = Math.max(1, Math.ceil(items.length / perPage))
  const safePage = Math.min(page, total)
  const paginated = useMemo(() => items.slice((safePage - 1) * perPage, safePage * perPage), [items, safePage, perPage])

  function PaginationBar() {
    if (total <= 1) return null
    return (
      <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-xs text-muted-foreground">{items.length} résultats · page {safePage}/{total}</span>
        <div className="flex items-center justify-center gap-1">
          <Button variant="outline" size="icon" className="h-7 w-7 flex-shrink-0" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={safePage === 1}>
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          {/* Numéros de page : masqués sur mobile (un numéro par bouton
              déborde dès qu'il y a plus de quelques pages), remplacés par
              un simple "page X/Y" ; ré-affichés à partir de sm, avec retour
              à la ligne si la liste est longue. */}
          <div className="hidden sm:flex sm:flex-wrap items-center justify-center gap-1">
            {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
              <Button key={n} variant={n === safePage ? "default" : "outline"} size="icon" className="h-7 w-7 text-xs"
                onClick={() => setPage(n)}>
                {n}
              </Button>
            ))}
          </div>
          <span className="sm:hidden px-2 text-xs text-muted-foreground">{safePage} / {total}</span>
          <Button variant="outline" size="icon" className="h-7 w-7 flex-shrink-0" onClick={() => setPage((p) => Math.min(total, p + 1))} disabled={safePage === total}>
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    )
  }

  return { paginated, page: safePage, total, setPage, PaginationBar }
}
