import { Suspense } from "react"
import { ConnexionClient } from "./_connexion-client"
import { Loader2 } from "lucide-react"

export default function ConnexionPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    }>
      <ConnexionClient />
    </Suspense>
  )
}
