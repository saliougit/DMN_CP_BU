import { BookOpen, FileText, GraduationCap, Microscope, Scale } from "lucide-react"
import type { ComponentType } from "react"

export const TYPE_LABELS: Record<string, string> = {
  memoire_licence: "Mémoire Licence",
  memoire_master: "Mémoire Master",
  these_doctorat: "Thèse Doctorat",
  article: "Article",
  rapport: "Rapport",
}

export const TYPE_COLORS: Record<string, string> = {
  memoire_licence: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300",
  memoire_master: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950 dark:text-teal-300",
  these_doctorat: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300",
  article: "bg-lime-50 text-lime-700 border-lime-200 dark:bg-lime-950 dark:text-lime-300",
  rapport: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300",
}

export const TYPE_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  memoire_licence: BookOpen,
  memoire_master: GraduationCap,
  these_doctorat: Microscope,
  article: FileText,
  rapport: Scale,
}

export const THEMES_MOTS_CLES: Record<string, { label: string; mots: string[] }> = {
  finance_islamique: {
    label: "Finance islamique",
    mots: ["finance islamique", "mourabaha", "moucharaka", "waqf", "zakât", "sadaqa", "banque islamique"],
  },
  mouridisme: {
    label: "Mouridisme & Cheikh Ahmadou Bamba",
    mots: ["mouridisme", "cheikh ahmadou bamba", "touba", "confrérie", "daara"],
  },
  education: {
    label: "Éducation & Pédagogie",
    mots: ["éducation", "pédagogie", "didactique", "enseignement", "apprentissage", "coranique"],
  },
  droit: {
    label: "Droit & Société",
    mots: ["droit", "loi", "code", "famille", "juridique", "islamique"],
  },
  economie: {
    label: "Économie & Développement",
    mots: ["développement", "microfinance", "économie", "commerce", "inclusion financière"],
  },
  sante: {
    label: "Santé & Médecine",
    mots: ["santé", "médecine", "maladie", "phytothérapie", "diagnostic", "tropical"],
  },
  tech: {
    label: "Sciences & Technologie",
    mots: ["informatique", "mathématiques", "machine learning", "intelligence artificielle", "modélisation"],
  },
}
