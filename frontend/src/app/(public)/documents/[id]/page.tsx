"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, Download, FileText, Calendar, User,
  GraduationCap, BookOpen, Tag
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { MOCK_DOCUMENTS } from "@/lib/mock-data"
import { TYPE_LABELS, TYPE_COLORS } from "@/lib/document-types"
import dynamic from "next/dynamic"
const PdfViewer = dynamic(
  () => import("@/components/documents/pdf-viewer").then((m) => ({ default: m.PdfViewer })),
  { ssr: false }
)
import type { Document } from "@/types"

export default function DocumentDetailPage() {
  const params = useParams<{ id: string }>()
  const [doc, setDoc] = useState<Document | null>(null)
  const [loading, setLoading] = useState(true)
  const [pdfPage, setPdfPage] = useState(1)

  useEffect(() => {
    const found = MOCK_DOCUMENTS.find((d) => d.id === params.id)
    setDoc(found ?? null)
    setLoading(false)
  }, [params.id])

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="flex gap-8">
          <Skeleton className="w-[360px] h-[400px] rounded-xl flex-shrink-0" />
          <div className="flex-1 space-y-4">
            <Skeleton className="h-[600px] w-full rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  if (!doc) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <FileText className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
        <h2 className="text-lg font-semibold">Document introuvable</h2>
        <p className="text-sm text-muted-foreground mt-1">Ce document n&apos;existe pas ou a été supprimé.</p>
        <Link href="/recherche"><Button variant="outline" size="sm" className="mt-4 gap-2"><ArrowLeft className="h-4 w-4" /> Retour à la recherche</Button></Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <Link href="/recherche" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-4">
        <ArrowLeft className="h-4 w-4" />
        Retour aux résultats
      </Link>

      <div className="flex flex-col lg:flex-row gap-6" style={{ minHeight: "calc(100vh - 10rem)" }}>
        {/* Panneau gauche : Métadonnées compactes */}
        <aside className="lg:w-[360px] flex-shrink-0 order-2 lg:order-1">
          <div className="sticky top-4 rounded-xl border border-border bg-card flex flex-col" style={{ height: "calc(100vh - 10rem)" }}>
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {/* En-tête */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={`text-[10px] ${TYPE_COLORS[doc.type] ?? "bg-muted text-muted-foreground"}`}>
                    {TYPE_LABELS[doc.type] ?? doc.type}
                  </Badge>
                  {doc.annee && <Badge variant="outline" className="text-[10px]">{doc.annee}</Badge>}
                  {doc.pages && <span className="text-[10px] text-muted-foreground">{doc.pages} pages</span>}
                </div>
                <h1 className="text-lg font-bold leading-tight">{doc.titre}</h1>
              </div>

              <Separator />

              {/* Métadonnées en format liste */}
              <div className="space-y-3">
                <MetaRow icon={User} label="Auteur" value={doc.auteur} />
                <MetaRow icon={GraduationCap} label="Niveau" value={doc.niveau} />
                <MetaRow icon={BookOpen} label="Faculté" value={doc.faculte} />
                {doc.filiere && <MetaRow icon={BookOpen} label="Filière" value={doc.filiere} />}
                {doc.directeur && <MetaRow icon={User} label="Directeur" value={doc.directeur} />}
                <MetaRow icon={Calendar} label="Année" value={String(doc.annee)} />
              </div>

              {/* Mots-clés */}
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

              <Separator />

              {/* Résumé */}
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Résumé</p>
                <p className="text-xs leading-relaxed text-foreground/80">{doc.resume}</p>
              </div>
            </div>

            {/* Actions toujours visibles en bas */}
            <div className="flex-shrink-0 border-t border-border/60 p-4">
              <Button className="w-full gap-2 bg-primary hover:bg-primary/90 h-9 text-sm">
                <Download className="h-4 w-4" /> Télécharger le PDF
              </Button>
            </div>
          </div>
        </aside>

        {/* Panneau droit : PDF Viewer */}
        <div className="flex-1 min-w-0 order-1 lg:order-2">
          <div className="sticky top-4 rounded-xl border border-border bg-card overflow-hidden"
            style={{ height: "calc(100vh - 10rem)" }}>
            <PdfViewer
              fileUrl={doc.fichierUrl}
              pages={doc.pages}
              page={pdfPage}
              onPageChange={setPdfPage}
              className="h-full"
            />
          </div>
        </div>
      </div>
    </div>
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
