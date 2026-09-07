"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { BookOpen, FileText, GraduationCap, Users, ClipboardList, Archive, Lightbulb, Upload } from "lucide-react"
import { SearchBar } from "@/components/search/search-bar"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"

const STATS = [
  { icon: FileText, label: "Documents", value: "300+" },
  { icon: BookOpen, label: "Facultés couvertes", value: "10+" },
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

function GlowButton() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const btnRef = useRef<HTMLButtonElement>(null)
  const [mouse, setMouse] = useState({ x: 0, y: 0, inside: false })

  function handleMouseMove(e: React.MouseEvent<HTMLButtonElement>) {
    const rect = btnRef.current!.getBoundingClientRect()
    setMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top, inside: true })
  }

  function handleMouseLeave() {
    setMouse((m) => ({ ...m, inside: false }))
  }

  function handleClick() {
    if (isAuthenticated) {
      router.push("/soumettre")
    } else {
      router.push("/connexion?from=/soumettre")
    }
  }

  return (
    <button
      ref={btnRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      className="relative overflow-hidden inline-flex items-center gap-2.5 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-all duration-200 hover:shadow-primary/30 hover:shadow-xl hover:scale-[1.03] active:scale-[0.98]"
      style={{
        background: mouse.inside
          ? `radial-gradient(circle at ${mouse.x}px ${mouse.y}px, hsl(var(--primary) / 0.7) 0%, hsl(var(--primary)) 55%)`
          : undefined,
      }}
    >
      {mouse.inside && (
        <span
          className="pointer-events-none absolute rounded-full opacity-30 blur-xl transition-all duration-75"
          style={{
            width: 120,
            height: 120,
            left: mouse.x - 60,
            top: mouse.y - 60,
            background: "white",
          }}
        />
      )}
      <Upload className="relative h-4 w-4" />
      <span className="relative">Déposer un document</span>
    </button>
  )
}

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center overflow-hidden px-4 py-20 sm:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/8 via-transparent to-transparent"
        />

        {/* Logo avec animation au survol */}
        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="group relative h-40 w-40 cursor-pointer">
            {/* Halo pulsant au survol */}
            <span className="absolute inset-0 rounded-full bg-primary/20 opacity-0 blur-xl transition-all duration-500 group-hover:opacity-100 group-hover:scale-125" />
            <span className="absolute inset-0 rounded-full ring-4 ring-primary/20 transition-all duration-500 group-hover:ring-primary/60 group-hover:ring-8" />
            <div className="relative h-full w-full overflow-hidden rounded-full bg-white shadow-xl transition-all duration-500 group-hover:scale-105 group-hover:shadow-2xl group-hover:shadow-primary/30 dark:bg-white p-1">
              <Image
                src="/logo.png"
                alt="Logo DMN"
                fill
                className="object-contain transition-all duration-500 group-hover:brightness-110"
                priority
              />
            </div>
          </div>
          <Badge variant="secondary" className="text-xs px-3 py-1">
            DMN — Daara Madjmahoun Noreyni · UCAD · Dakar
          </Badge>
        </div>

        <h1 className="mb-3 text-center text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
          Bibliothèque Numérique
        </h1>
        <p className="mb-8 max-w-xl text-center text-muted-foreground text-sm sm:text-base">
          Accédez à l&apos;ensemble des travaux académiques des membres — mémoires, thèses et articles — classés par faculté, niveau et année.
        </p>

        <div className="w-full max-w-2xl">
          <SearchBar size="hero" autoFocus />
        </div>

        <div className="mt-6">
          <GlowButton />
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
        <div className="mx-auto grid max-w-2xl grid-cols-3 gap-6 justify-items-center">
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

      {/* Présentation de la Commission Pédagogique */}
      <section className="mx-auto max-w-4xl px-4 py-14">
        <div className="mb-8 text-center">
          <span className="inline-block mb-3 rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold text-primary uppercase tracking-widest">
            Commission Pédagogique
          </span>
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            Daara Madjmahoun Noreyni · UCAD
          </h2>
          <p className="mt-4 mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Instance de réflexion et de gouvernance chargée de superviser, d&apos;évaluer et d&apos;améliorer
            la qualité de l&apos;enseignement à travers la documentation, la recherche et des rencontres
            scientifiques.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <ClipboardList className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Analyse des besoins</h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Identifier et évaluer les besoins de formation des membres afin d&apos;orienter les programmes
              pédagogiques du Daara.
            </p>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Archive className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Archivage des productions</h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Collecter et préserver les productions intellectuelles des membres — mémoires, thèses et
              articles — au sein de cette bibliothèque numérique.
            </p>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Lightbulb className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Méthodes innovantes</h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Promouvoir des approches pédagogiques novatrices et organiser des rencontres scientifiques
              pour enrichir la pratique académique au sein du Daara.
            </p>
          </div>
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
