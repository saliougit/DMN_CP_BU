import { Suspense } from "react"
import { ConnexionClient } from "./_connexion-client"
import { DmnLoader } from "@/components/ui/dmn-loader"

export default function ConnexionPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <DmnLoader size="md" />
      </div>
    }>
      <ConnexionClient />
    </Suspense>
  )
}
