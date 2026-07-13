"use client"

import { useState, useEffect } from "react"
import { FileText, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { pdfjs, Document, Page } from "react-pdf"
import "react-pdf/dist/Page/AnnotationLayer.css"
import "react-pdf/dist/Page/TextLayer.css"

const WORKER_URL = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`
if (typeof window !== "undefined" && !pdfjs.GlobalWorkerOptions.workerSrc) {
  pdfjs.GlobalWorkerOptions.workerSrc = WORKER_URL
}

interface PdfViewerProps {
  fileUrl?: string | null
  pages?: number
  page: number
  onPageChange: (page: number) => void
  className?: string
}

export function PdfViewer({ fileUrl, pages: _pages, page, onPageChange, className }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [workerReady, setWorkerReady] = useState(false)

  useEffect(() => {
    pdfjs.GlobalWorkerOptions.workerSrc = WORKER_URL
    setWorkerReady(true)
  }, [])

  function onLoadSuccess({ numPages: n }: { numPages: number }) {
    setNumPages(n)
    setLoadError(false)
  }

  function onLoadError() {
    setLoadError(true)
  }

  const displayPages = numPages ?? _pages ?? 0

  if (!fileUrl) {
    return (
      <div className={`flex items-center justify-center ${className ?? ""}`}>
        <div className="text-center text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Aperçu non disponible</p>
        </div>
      </div>
    )
  }

  if (!workerReady) {
    return (
      <div className={`flex items-center justify-center ${className ?? ""}`}>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className={`flex items-center justify-center ${className ?? ""}`}>
        <div className="text-center text-muted-foreground">
          <AlertCircle className="h-10 w-10 mx-auto mb-2 text-amber-500" />
          <p className="text-sm font-medium">Impossible de charger le PDF</p>
          <p className="text-xs mt-1">Le fichier peut être inaccessible ou corrompu.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col min-h-0 ${className ?? ""}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60 bg-muted/20 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <FileText className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium">Document PDF</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="rounded p-1 hover:bg-muted transition-colors disabled:opacity-30"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <span className="text-xs text-muted-foreground min-w-[4rem] text-center tabular-nums">
            {page} / {displayPages || "—"}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={numPages !== null && page >= numPages}
            className="rounded p-1 hover:bg-muted transition-colors disabled:opacity-30"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Viewer */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="flex justify-center p-4">
          <div className="w-full max-w-4xl">
            <Document
              file={fileUrl}
              onLoadSuccess={onLoadSuccess}
              onLoadError={onLoadError}
              loading={
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              }
              error={
                <div className="text-center py-20 text-muted-foreground">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">Erreur de chargement</p>
                </div>
              }
            >
              <Page
                pageNumber={page}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                width={Math.min(720, typeof window !== "undefined" ? window.innerWidth - 480 : 720)}
                loading={
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                }
                error={
                  <div className="text-center py-20 text-muted-foreground">
                    <p className="text-sm">Page non disponible</p>
                  </div>
                }
                className="rounded-lg shadow-sm border border-border/50"
              />
            </Document>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="border-t border-border/60 bg-background px-4 py-2 flex items-center justify-between flex-shrink-0">
        <span className="text-[10px] text-muted-foreground">
          {numPages ? `${numPages} page${numPages > 1 ? "s" : ""}` : ""}
        </span>
        <Button variant="ghost" size="sm" className="gap-1.5 h-7 text-xs">
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
          </svg>
          PDF
        </Button>
      </div>
    </div>
  )
}
