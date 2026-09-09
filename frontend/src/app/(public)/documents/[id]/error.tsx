"use client"

import { useEffect } from "react"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DocumentError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Document page error:", error)
  }, [error])

  return (
    <div className="mx-auto max-w-7xl px-4 py-20 text-center">
      <AlertTriangle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
      <h2 className="text-lg font-semibold mb-2">Erreur de chargement</h2>
      <p className="text-sm text-muted-foreground mb-1">{error.message}</p>
      {error.digest && (
        <p className="text-xs text-muted-foreground/60 font-mono mb-4">digest: {error.digest}</p>
      )}
      <Button variant="outline" size="sm" onClick={reset} className="mt-2">
        Réessayer
      </Button>
    </div>
  )
}
