"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, AlertTriangle } from "lucide-react"
import { AppDrawer } from "@/components/ui/app-drawer"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

type Action = "add" | "edit" | "delete"
type NodeType = "faculte" | "filiere" | "niveau"

const TYPE_LABELS: Record<NodeType, string> = {
  faculte: "Faculté",
  filiere: "Filière",
  niveau: "Niveau",
}

const CHILD_LABELS: Record<NodeType, string> = {
  faculte: "filière",
  filiere: "niveau",
  niveau: "",
}

interface ClassificationFormDrawerProps {
  open: boolean
  onClose: () => void
  action: Action
  nodeType: NodeType
  nodeName: string
  nodeCount?: number
  onConfirm: (name: string) => void
}

export function ClassificationFormDrawer({
  open,
  onClose,
  action,
  nodeType,
  nodeName,
  nodeCount,
  onConfirm,
}: ClassificationFormDrawerProps) {
  const [name, setName] = useState("")

  useEffect(() => {
    if (action === "edit") setName(nodeName)
    else setName("")
  }, [action, nodeName, open])

  const isDelete = action === "delete"
  const childType = CHILD_LABELS[nodeType]

  const titles: Record<Action, string> = {
    add: `Ajouter une ${childType} dans « ${nodeName} »`,
    edit: `Renommer « ${nodeName} »`,
    delete: `Supprimer « ${nodeName} »`,
  }

  const icons: Record<Action, React.ElementType> = {
    add: Plus,
    edit: Pencil,
    delete: Trash2,
  }

  const Icon = icons[action]

  return (
    <AppDrawer
      open={open}
      onClose={onClose}
      size="sm"
      titleExtra={
        <Badge variant="secondary" className="text-[10px] gap-1">
          <Icon className="h-3 w-3" />
          {action === "add" ? "Ajouter" : action === "edit" ? "Renommer" : "Supprimer"}
          {" · "}
          {TYPE_LABELS[nodeType]}
        </Badge>
      }
      title={titles[action]}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} className="flex-1">
            Annuler
          </Button>
          <Button
            size="sm"
            variant={isDelete ? "destructive" : "default"}
            className={isDelete ? "flex-1 gap-1.5" : "flex-1 gap-1.5 bg-primary hover:bg-primary/90"}
            onClick={() => { onConfirm(isDelete ? nodeName : name); onClose() }}
            disabled={!isDelete && !name.trim()}
          >
            <Icon className="h-3.5 w-3.5" />
            {action === "add" ? "Ajouter" : action === "edit" ? "Enregistrer" : "Confirmer la suppression"}
          </Button>
        </>
      }
    >
      <div className="px-5 py-6 space-y-5">
        {action === "delete" ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl bg-destructive/8 border border-destructive/20 p-4">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-destructive">Action irréversible</p>
                <p className="text-muted-foreground text-xs mt-1">
                  Vous allez supprimer <strong>{nodeName}</strong>.
                  {nodeCount !== undefined && nodeCount > 0 && (
                    <> Cette action affectera <strong>{nodeCount} documents</strong> associés.</>
                  )}
                </p>
              </div>
            </div>
            {nodeCount !== undefined && nodeCount > 0 && (
              <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Que se passe-t-il avec les documents ?</p>
                <p>Les {nodeCount} documents seront déplacés dans la catégorie <em>«&nbsp;Non classé&nbsp;»</em> et nécessiteront une reclassification manuelle.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">
                {action === "add"
                  ? `Nom de la ${childType}`
                  : `Nouveau nom pour ${TYPE_LABELS[nodeType].toLowerCase()}`}
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && name.trim() && (onConfirm(name), onClose())}
                placeholder={
                  action === "add"
                    ? `Ex. : Finance participative`
                    : `Ex. : ${nodeName}`
                }
                className="h-10 text-sm rounded-lg focus-visible:ring-0 focus-visible:border-primary"
                autoFocus
              />
            </div>
            {action === "edit" && (
              <p className="text-xs text-muted-foreground">
                Nom actuel : <span className="font-medium text-foreground">{nodeName}</span>
              </p>
            )}
          </div>
        )}
      </div>
    </AppDrawer>
  )
}
