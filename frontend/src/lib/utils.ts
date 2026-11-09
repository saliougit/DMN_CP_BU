import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Formate une date ISO (ex: "2026-11-09T12:07:37.835241Z") en "9 nov. 2026" */
export function formatDate(iso: string | undefined | null): string {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
  } catch {
    return iso
  }
}
