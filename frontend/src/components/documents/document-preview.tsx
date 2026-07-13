"use client"

import { useState } from "react"
import {
  Download, FileText, User, BookOpen,
  Calendar, GraduationCap, ExternalLink, X
} from "lucide-react"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { PdfViewer } from "@/components/documents/pdf-viewer"
import type { Document } from "@/types"

const TYPE_LABELS: Record<string, string> = {
  memoire_licence: "Mémoire Licence",
  memoire_master: "Mémoire Master",
  these_doctorat: "Thèse Doctorat",
  article: "Article",
  rapport: "Rapport",
}

interface DocumentPreviewProps {
  document: Document | null
  open: boolean
  onClose: () => void
  actions?: React.ReactNode
  className?: string
}

export function DocumentPreview({ document: doc, open, onClose, actions, className }: DocumentPreviewProps) {
  const [pdfPage, setPdfPage] = useState(1)

  if (!doc) return null

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <SheetContent
        side="right"
        showCloseButton={false}
        className={`w-full sm:max-w-[90vw] p-0 flex flex-col ${className ?? ""}`.trim()}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/60 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Badge className="bg-primary/10 text-primary border-0 text-xs flex-shrink-0">
              {TYPE_LABELS[doc.type] ?? doc.type}
            </Badge>
            <SheetTitle className="text-sm font-semibold truncate">{doc.titre}</SheetTitle>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {actions}
            <button onClick={onClose}
              className="rounded-lg p-1.5 hover:bg-muted transition-colors text-muted-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body — layout identique à la page détail */}
        <div className="flex flex-1 min-h-0">
          {/* Panneau gauche : Métadonnées (360px) */}
          <aside className="w-[360px] flex-shrink-0 border-r border-border/60 hidden lg:block">
            <ScrollArea className="h-full">
              <div className="p-5 space-y-5">
                <div className="space-y-3">
                  <MetaRow icon={User} label="Auteur" value={doc.auteur} />
                  <MetaRow icon={GraduationCap} label="Niveau" value={doc.niveau} />
                  <MetaRow icon={BookOpen} label="Faculté" value={doc.faculte} />
                  {doc.filiere && <MetaRow icon={BookOpen} label="Filière" value={doc.filiere} />}
                  {doc.directeur && <MetaRow icon={User} label="Directeur" value={doc.directeur} />}
                  <MetaRow icon={Calendar} label="Année" value={String(doc.annee)} />
                  {doc.pages && <MetaRow icon={FileText} label="Pages" value={`${doc.pages} p.`} />}
                </div>

                {doc.motsCles.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Mots-clés</p>
                      <div className="flex flex-wrap gap-1.5">
                        {doc.motsCles.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {doc.resume && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Résumé</p>
                      <p className="text-sm leading-relaxed text-foreground/80">{doc.resume}</p>
                    </div>
                  </>
                )}

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="gap-2 flex-1">
                    <Download className="h-4 w-4" /> Télécharger
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <ExternalLink className="h-4 w-4" /> Ouvrir
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </aside>

          {/* Panneau droit : PDF Viewer */}
          <div className="flex-1 min-w-0 flex flex-col">
            <PdfViewer
              fileUrl={doc.fichierUrl}
              pages={doc.pages}
              page={pdfPage}
              onPageChange={setPdfPage}
              className="flex-1"
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function MetaRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
      <div className="flex items-baseline gap-1.5 min-w-0">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide flex-shrink-0">{label}</span>
        <span className="text-xs text-foreground truncate">{value}</span>
      </div>
    </div>
  )
}
