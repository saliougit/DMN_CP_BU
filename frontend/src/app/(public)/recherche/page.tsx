import { Suspense } from "react"
import { SearchClient } from "./_search-client"
import { Skeleton } from "@/components/ui/skeleton"

function SearchFallback() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
      <Skeleton className="h-11 max-w-xl rounded-xl" />
      <div className="flex gap-6">
        <Skeleton className="w-56 h-[70vh] rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      </div>
    </div>
  )
}

export default function RecherchePage() {
  return (
    <Suspense fallback={<SearchFallback />}>
      <SearchClient />
    </Suspense>
  )
}
