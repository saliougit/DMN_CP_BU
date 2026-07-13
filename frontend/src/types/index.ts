export type UserRole = "admin" | "membre"

export interface User {
  id: string
  nom: string
  prenom: string
  email: string
  role: UserRole
  niveau?: string
  faculte?: string
  filiere?: string
  anneeInscription?: number
  createdAt: string
}

export type DocumentType = "memoire_licence" | "memoire_master" | "these_doctorat" | "article" | "rapport"

export type DocumentStatus = "en_attente" | "approuve" | "rejete"

export interface Document {
  id: string
  titre: string
  auteur: string
  type: DocumentType
  statut: DocumentStatus
  faculte: string
  filiere: string
  niveau: string
  annee: number
  directeur?: string
  resume?: string
  motsCles: string[]
  fichierUrl?: string
  couvertureUrl?: string
  pages?: number
  soumisParId: string
  soumisLe: string
  approuveLe?: string
  approuveParId?: string
  motifRejet?: string
}

export interface Faculte {
  id: string
  nom: string
  code: string
  filieres: Filiere[]
}

export interface Filiere {
  id: string
  nom: string
  faculteId: string
}

export interface Niveau {
  id: string
  nom: string
  ordre: number
}

export interface SearchResult {
  total: number
  page: number
  perPage: number
  documents: Document[]
}

export interface SearchFilters {
  q?: string
  type?: DocumentType
  faculte?: string
  filiere?: string
  niveau?: string
  annee?: number
  page?: number
}

export interface DashboardStats {
  totalDocuments: number
  soumissionsEnAttente: number
  totalMembres: number
  documentsApprouvesCeMois: number
  topFacultes: { nom: string; count: number }[]
  documentsParAnnee: { annee: number; count: number }[]
}
