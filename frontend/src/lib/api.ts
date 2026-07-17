import type { Document, SearchFilters, SearchResult, DashboardStats, Faculte, Niveau, User } from "@/types"

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api").replace(/\/$/, "")

// ─── Token storage ────────────────────────────────────────────────────────────

export const tokens = {
  getAccess:  () => (typeof window !== "undefined" ? localStorage.getItem("access_token")  : null),
  getRefresh: () => (typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null),
  set: (access: string, refresh: string) => {
    localStorage.setItem("access_token",  access)
    localStorage.setItem("refresh_token", refresh)
  },
  clear: () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
  },
}

// ─── HTTP client ──────────────────────────────────────────────────────────────

async function fetchApi<T>(path: string, options: RequestInit = {}, auth = false): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }
  if (auth) {
    const token = tokens.getAccess()
    if (token) headers["Authorization"] = `Bearer ${token}`
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers })

  // Token expiré → tenter un refresh automatique
  if (res.status === 401 && auth) {
    const refreshed = await tryRefresh()
    if (refreshed) {
      headers["Authorization"] = `Bearer ${tokens.getAccess()}`
      const retry = await fetch(`${API_URL}${path}`, { ...options, headers })
      if (!retry.ok) throw new Error(`API ${retry.status}`)
      return retry.json()
    }
    tokens.clear()
    throw new Error("Session expirée")
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.detail ?? `API ${res.status}`)
  }
  return res.json()
}

async function tryRefresh(): Promise<boolean> {
  const refresh = tokens.getRefresh()
  if (!refresh) return false
  try {
    const res = await fetch(`${API_URL}/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    })
    if (!res.ok) return false
    const { access } = await res.json()
    localStorage.setItem("access_token", access)
    return true
  } catch {
    return false
  }
}

// ─── Mapping Django → types frontend ─────────────────────────────────────────

function mapDocument(d: Record<string, unknown>): Document {
  return {
    id:            d.id as string,
    titre:         d.titre as string,
    auteur:        d.auteur as string,
    type:          d.type as Document["type"],
    statut:        d.statut as Document["statut"],
    faculte:       (d.faculte_nom ?? d.faculte) as string,
    filiere:       (d.filiere_nom ?? d.filiere ?? "") as string,
    niveau:        (d.niveau_nom  ?? d.niveau)  as string,
    annee:         d.annee as number,
    directeur:     (d.directeur  as string) || undefined,
    resume:        (d.resume     as string) || undefined,
    motsCles:      (d.mots_cles  as string[]) ?? [],
    fichierUrl:    (d.fichier    as string) || undefined,
    pages:         (d.pages      as number) || undefined,
    soumisParId:   (d.soumis_par as string) ?? "",
    soumisLe:      d.date_soumission as string,
    approuveLe:    (d.date_approbation as string) || undefined,
    approuveParId: (d.approuve_par    as string) || undefined,
    motifRejet:    (d.raison_rejet    as string) || undefined,
  }
}

function mapUser(d: Record<string, unknown>): User {
  return {
    id:        d.id as string,
    nom:       (d.last_name  as string) ?? "",
    prenom:    (d.first_name as string) ?? "",
    email:     d.email as string,
    role:      d.role as User["role"],
    faculte:   (d.faculte as string) || undefined,
    filiere:   (d.filiere as string) || undefined,
    createdAt: (d.date_joined as string) ?? new Date().toISOString(),
  }
}

// ─── API publique ─────────────────────────────────────────────────────────────

export const api = {

  // Auth
  logout: async (): Promise<void> => {
    const refresh = tokens.getRefresh()
    if (refresh) {
      // Blackliste le refresh token côté serveur (erreur ignorée — la session locale est nettoyée de toute façon)
      await fetchApi("/auth/logout/", { method: "POST", body: JSON.stringify({ refresh }) }, true).catch(() => {})
    }
    tokens.clear()
  },

  login: async (email: string, password: string): Promise<{ user: User }> => {
    const data = await fetchApi<{ access: string; refresh: string }>("/auth/token/", {
      method: "POST",
      body: JSON.stringify({ username: email, password }),
    })
    tokens.set(data.access, data.refresh)
    const user = await fetchApi<Record<string, unknown>>("/auth/me/", {}, true)
    return { user: mapUser(user) }
  },

  register: async (form: {
    username: string; email: string; first_name: string; last_name: string; password: string; telephone?: string
  }): Promise<void> => {
    await fetchApi("/auth/register/", { method: "POST", body: JSON.stringify({ ...form, password_confirm: form.password }) })
  },

  me: async (): Promise<User> => {
    const d = await fetchApi<Record<string, unknown>>("/auth/me/", {}, true)
    return mapUser(d)
  },

  // Documents publics
  searchDocuments: (filters: SearchFilters): Promise<SearchResult> => {
    const params = new URLSearchParams()
    if (filters.q)       params.set("search",  filters.q)
    if (filters.type)    params.set("type",     filters.type)
    if (filters.faculte) params.set("faculte",  filters.faculte)
    if (filters.filiere) params.set("filiere",  filters.filiere)
    if (filters.niveau)  params.set("niveau",   filters.niveau)
    if (filters.annee)   params.set("annee",    String(filters.annee))
    if (filters.page)    params.set("page",     String(filters.page))
    return fetchApi<{ count: number; results: Record<string, unknown>[] }>(`/documents/?${params}`).then((r) => ({
      total:     r.count,
      page:      filters.page ?? 1,
      perPage:   20,
      documents: r.results.map(mapDocument),
    }))
  },

  getDocument: async (id: string): Promise<Document> => {
    const d = await fetchApi<Record<string, unknown>>(`/documents/${id}/`)
    return mapDocument(d)
  },

  getFacultes: (): Promise<Faculte[]> =>
    fetchApi<Faculte[]>("/facultes/"),

  getNiveaux: (): Promise<Niveau[]> =>
    fetchApi<Niveau[]>("/niveaux/"),

  // Soumission membre
  soumettreDocument: (formData: FormData): Promise<Document> =>
    fetch(`${API_URL}/documents/`, {
      method:  "POST",
      headers: { Authorization: `Bearer ${tokens.getAccess()}` },
      body:    formData,
    }).then((r) => r.json()).then(mapDocument),

  // Admin — workflow
  getSoumissions: (): Promise<Document[]> =>
    fetchApi<{ results: Record<string, unknown>[] }>("/documents/?statut=en_attente", {}, true)
      .then((r) => r.results.map(mapDocument)),

  approuverDocument: (id: string): Promise<void> =>
    fetchApi(`/documents/${id}/approuver/`, { method: "POST" }, true),

  rejeterDocument: (id: string, raison: string): Promise<void> =>
    fetchApi(`/documents/${id}/rejeter/`, { method: "POST", body: JSON.stringify({ raison }) }, true),

  // Admin — upload direct
  uploadDocument: (formData: FormData): Promise<Document> =>
    fetch(`${API_URL}/documents/`, {
      method:  "POST",
      headers: { Authorization: `Bearer ${tokens.getAccess()}` },
      body:    formData,
    }).then((r) => r.json()).then(mapDocument),

  // Admin — stats dashboard
  getDashboardStats: (): Promise<DashboardStats> =>
    fetchApi<DashboardStats>("/admin/stats/", {}, true),

  // Téléchargement sécurisé
  getDownloadUrl: async (id: string): Promise<string> => {
    const d = await fetchApi<{ url: string }>(`/documents/${id}/download/`, {}, true)
    return d.url
  },
}
