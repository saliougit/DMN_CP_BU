"use client"

import { useState, useEffect, useRef } from "react"
import { FileText, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DmnLoader } from "@/components/ui/dmn-loader"
import { pdfjs, Document, Page } from "react-pdf"
import "react-pdf/dist/Page/AnnotationLayer.css"
import "react-pdf/dist/Page/TextLayer.css"

// Flag — workerSrc is set once per page load; `Document` never renders before this.
let _workerSrcSet = false

// Stable reference — if defined inline, react-pdf sees a new object every render
// and destroys/recreates the PDF document, causing a messageHandler null crash.
const PDF_OPTIONS = { disableRange: true, withCredentials: false }

interface PdfViewerProps {
  fileUrl?: string | null
  fileName?: string
  pages?: number
  page: number
  onPageChange: (page: number) => void
  className?: string
}

export function PdfViewer({ fileUrl, fileName, pages: _pages, page, onPageChange, className }: PdfViewerProps) {
  const [workerReady, setWorkerReady]     = useState(false)
  const [numPages, setNumPages]           = useState<number | null>(null)
  const [loadError, setLoadError]         = useState(false)
  const [downloading, setDownloading]     = useState(false)
  const downloadLinkRef                   = useRef<HTMLAnchorElement>(null)

  async function handleDownload() {
    if (!fileUrl || downloading) return
    setDownloading(true)
    try {
      const res  = await fetch(fileUrl)
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = downloadLinkRef.current!
      a.href     = url
      a.download = fileName ? `${fileName}.pdf` : "document.pdf"
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setDownloading(false)
    }
  }

  useEffect(() => {
    // Set workerSrc exactly once — pdfjs will create a fresh Worker each time
    // getDocument() is called, managing its own lifecycle correctly.
    if (!_workerSrcSet) {
      _workerSrcSet = true
      // pdfjs 4+ detects the .mjs extension and uses { type: "module" } automatically.
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs"
    }
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
            {!workerReady ? (
              <DmnLoader size="sm" />
            ) : (
              <Document
                file={fileUrl}
                options={PDF_OPTIONS}
                onLoadSuccess={onLoadSuccess}
                onLoadError={onLoadError}
                loading={<DmnLoader size="sm" />}
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
                  width={Math.min(720, typeof window !== "undefined" ? Math.max(280, window.innerWidth - 32) : 720)}
                  loading={<DmnLoader size="sm" />}
                  error={
                    <div className="text-center py-20 text-muted-foreground">
                      <p className="text-sm">Page non disponible</p>
                    </div>
                  }
                  className="rounded-lg shadow-sm border border-border/50"
                />
              </Document>
            )}
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="border-t border-border/60 bg-background px-4 py-2 flex items-center justify-between flex-shrink-0">
        <span className="text-[10px] text-muted-foreground">
          {numPages ? `${numPages} page${numPages > 1 ? "s" : ""}` : ""}
        </span>
        {/* Hidden anchor used by handleDownload — blob URLs need same-origin click */}
        <a ref={downloadLinkRef} className="hidden" aria-hidden />
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 h-7 text-xs"
          onClick={handleDownload}
          disabled={!fileUrl || downloading}
        >
          {downloading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
          )}
          PDF
        </Button>
      </div>
    </div>
  )
}
