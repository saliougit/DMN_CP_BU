import type { User } from "@/types"

export const MOCK_USERS: User[] = [
  { id: "u1", nom: "Diallo", prenom: "Moussa", email: "moussa.diallo@ucad.edu.sn", role: "membre", niveau: "Master 2", faculte: "Sciences Économiques et de Gestion", filiere: "Finance islamique", anneeInscription: 2021, createdAt: "2021-09-01" },
  { id: "u2", nom: "Ndiaye", prenom: "Aïssatou", email: "aissatou.ndiaye@ucad.edu.sn", role: "membre", niveau: "Doctorat", faculte: "Sciences de l'Éducation", filiere: "Pédagogie", anneeInscription: 2019, createdAt: "2019-10-01" },
  { id: "u3", nom: "Sow", prenom: "Ibrahima", email: "ibrahima.sow@ucad.edu.sn", role: "membre", niveau: "Licence 3", faculte: "Droit", filiere: "Droit islamique", anneeInscription: 2023, createdAt: "2023-09-15" },
  { id: "admin1", nom: "Fall", prenom: "Admin", email: "admin@dmn.sn", role: "admin", createdAt: "2020-01-01" },
  { id: "admin2", nom: "Admin", prenom: "DISI", email: "admin@disi.ucad.sn", role: "admin", createdAt: "2026-01-01" },
]

/** Mots de passe mock (en prod ce sera géré côté Django) */
export const MOCK_PASSWORDS: Record<string, string> = {
  "admin@dmn.sn": "admin",
  "admin@disi.ucad.sn": "admin2026",
}
export function getUserById(id: string): User | undefined { return MOCK_USERS.find((u) => u.id === id) }
export function createUser(data: Omit<User, "id" | "createdAt">): User {
  return { ...data, id: `u_${Date.now()}`, createdAt: new Date().toISOString() }
}
