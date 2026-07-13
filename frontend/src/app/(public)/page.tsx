import Image from "next/image"
import Link from "next/link"
import { BookOpen, FileText, GraduationCap, Users } from "lucide-react"
import { SearchBar } from "@/components/search/search-bar"
import { Badge } from "@/components/ui/badge"

const STATS = [
  { icon: FileText, label: "Documents", value: "1 200+" },
  { icon: GraduationCap, label: "Thèses & Mémoires", value: "950+" },
  { icon: BookOpen, label: "Facultés couvertes", value: "12" },
  { icon: Users, label: "Membres actifs", value: "300+" },
]

const QUICK_SEARCHES = [
  "Économie islamique",
  "Sciences de l'éducation",
  "Droit",
  "Médecine",
  "Informatique",
  "Philosophie",
]

const RECENT_TYPES = [
  { label: "Mémoires de Licence", href: "/recherche?type=memoire_licence", color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
  { label: "Mémoires de Master", href: "/recherche?type=memoire_master", color: "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300" },
  { label: "Thèses de Doctorat", href: "/recherche?type=these_doctorat", color: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300" },
  { label: "Articles de recherche", href: "/recherche?type=article", color: "bg-lime-50 text-lime-700 dark:bg-lime-950 dark:text-lime-300" },
]

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center overflow-hidden px-4 py-20 sm:py-28">
        {/* Fond décoratif */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/8 via-transparent to-transparent"
        />

        {/* Logo centré */}
        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="relative h-40 w-40 overflow-hidden rounded-full ring-4 ring-primary/20 shadow-xl bg-white dark:bg-white p-1">
            <Image src="/logo.png" alt="Logo DMN" fill className="object-contain" priority />
          </div>
          <Badge variant="secondary" className="text-xs px-3 py-1">
            DMN — Daara Madjmahoun Noreyni · UCAD · Dakar
          </Badge>
        </div>

        <h1 className="mb-3 text-center text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          Bibliothèque Numérique
          {/* <span className="block text-primary">Mouride</span> */}
        </h1>
        <p className="mb-8 max-w-xl text-center text-muted-foreground text-sm sm:text-base">
          Accédez à l&apos;ensemble des travaux académiques des membres — mémoires, thèses et articles — classés par faculté, niveau et année.
        </p>

        {/* Grande barre de recherche */}
        <div className="w-full max-w-2xl">
          <SearchBar size="hero" autoFocus />
        </div>

        {/* Recherches rapides */}
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <span className="text-xs text-muted-foreground self-center">Populaire :</span>
          {QUICK_SEARCHES.map((term) => (
            <Link
              key={term}
              href={`/recherche?q=${encodeURIComponent(term)}`}
              className="text-xs px-3 py-1.5 rounded-full border border-border bg-background hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all"
            >
              {term}
            </Link>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border/60 bg-muted/30 py-10 px-4">
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-6 sm:grid-cols-4">
          {STATS.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex flex-col items-center gap-2 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <span className="text-2xl font-bold text-foreground">{value}</span>
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Types de documents */}
      <section className="mx-auto max-w-4xl px-4 py-12">
        <h2 className="mb-6 text-center text-lg font-semibold text-foreground">Parcourir par type</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {RECENT_TYPES.map(({ label, href, color }) => (
            <Link
              key={label}
              href={href}
              className={`flex flex-col items-center gap-2 rounded-2xl p-5 text-center text-sm font-medium transition-all hover:scale-[1.02] hover:shadow-md ${color}`}
            >
              <GraduationCap className="h-7 w-7" />
              {label}
            </Link>
          ))}
        </div>
      </section>
    </>
  )
}
