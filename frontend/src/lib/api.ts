import type { Document, SearchFilters, SearchResult, DashboardStats, Faculte, Niveau } from "@/types"

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api"

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  })
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json()
}

export const api = {
  search: (filters: SearchFilters): Promise<SearchResult> => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => v !== undefined && params.set(k, String(v)))
    return fetchApi(`/documents/search?${params}`)
  },

  getDocument: (id: string): Promise<Document> =>
    fetchApi(`/documents/${id}`),

  getFacultes: (): Promise<Faculte[]> =>
    fetchApi("/facultes"),

  getNiveaux: (): Promise<Niveau[]> =>
    fetchApi("/niveaux"),

  getDashboardStats: (): Promise<DashboardStats> =>
    fetchApi("/admin/stats"),

  getSoumissions: (): Promise<Document[]> =>
    fetchApi("/admin/soumissions"),

  approuverDocument: (id: string, classification: Partial<Document>): Promise<Document> =>
    fetchApi(`/admin/soumissions/${id}/approuver`, {
      method: "POST",
      body: JSON.stringify(classification),
    }),

  rejeterDocument: (id: string, motif: string): Promise<Document> =>
    fetchApi(`/admin/soumissions/${id}/rejeter`, {
      method: "POST",
      body: JSON.stringify({ motif }),
    }),

  soumettreDocument: (formData: FormData): Promise<Document> =>
    fetch(`${API_URL}/documents/soumettre`, { method: "POST", body: formData }).then((r) => r.json()),

  uploadDocument: (formData: FormData): Promise<Document> =>
    fetch(`${API_URL}/admin/documents/upload`, { method: "POST", body: formData }).then((r) => r.json()),
}
