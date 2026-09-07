"use client"

import { useState, useEffect } from "react"
import { ClassificationTree } from "@/components/admin/classification-tree"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FolderTree, BookMarked } from "lucide-react"
import { api } from "@/lib/api"
import type { Faculte } from "@/types"

export default function ClassificationPage() {
  const [facultes, setFacultes] = useState<Faculte[]>([])

  useEffect(() => {
    api.getFacultes().then(setFacultes).catch(() => {})
  }, [])

  const STATS = [
    { icon: FolderTree, label: "Facultés", value: facultes.length, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950" },
    { icon: BookMarked, label: "Filières", value: facultes.reduce((a, f) => a + f.filieres.length, 0), color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Classification</h1>
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
