import { ClassificationTree } from "@/components/admin/classification-tree"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FolderTree, BookMarked, Layers, Calendar } from "lucide-react"
import { MOCK_FACULTES, MOCK_DOCUMENTS } from "@/lib/mock-data"

const UNIQUE_ANNEES = new Set(MOCK_DOCUMENTS.map((d) => d.annee))

const STATS = [
  { icon: FolderTree, label: "Facultés", value: MOCK_FACULTES.length, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950" },
  { icon: BookMarked, label: "Filières", value: MOCK_FACULTES.reduce((a, f) => a + f.filieres.length, 0), color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950" },
  { icon: Calendar, label: "Années couvertes", value: UNIQUE_ANNEES.size, color: "text-purple-500", bg: "bg-purple-50 dark:bg-purple-950" },
  { icon: Layers, label: "Total documents", value: MOCK_DOCUMENTS.length, color: "text-primary", bg: "bg-primary/10" },
]

export default function ClassificationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Classification</h1>
        <p className="text-sm text-muted-foreground">
          Gérez l&apos;arborescence des collections : facultés, filières et niveaux
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {STATS.map(({ icon: Icon, label, value, color, bg }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${bg}`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <div>
                <p className="text-xl font-bold leading-tight">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Arbre */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <FolderTree className="h-4 w-4 text-primary" />
            Structure de classification
          </CardTitle>
          <CardDescription>
            Cliquez sur un nœud pour l&apos;ouvrir. Survolez pour voir les actions disponibles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClassificationTree />
        </CardContent>
      </Card>
    </div>
  )
}
