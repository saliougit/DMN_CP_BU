"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { BookOpen, FileText, GraduationCap, Users, ClipboardList, Archive, Lightbulb } from "lucide-react"
import { SearchBar } from "@/components/search/search-bar"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api"

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

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

const anim = (show: boolean, delay = 0) => ({
  style: { transitionDelay: `${delay}ms` },
  className: `transition-all duration-700 ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`,
})

export default function HomePage() {
  const [mounted, setMounted] = useState(false)
  const [stats, setStats] = useState({ totalDocuments: 0, totalFacultes: 0, totalMembres: 0 })
  const { ref: statsRef, inView: statsInView } = useInView()
  const { ref: commRef, inView: commInView } = useInView()
  const { ref: typesRef, inView: typesInView } = useInView()

  useEffect(() => {
    setMounted(true)
    api.getPublicStats().then(setStats).catch(() => {})
  }, [])

  const STATS = [
    { icon: FileText, label: "Documents", value: stats.totalDocuments || "—" },
    { icon: BookOpen, label: "Facultés couvertes", value: stats.totalFacultes || "—" },
    { icon: Users, label: "Membres actifs", value: stats.totalMembres || "—" },
  ]

  return (
    <>
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center overflow-hidden px-4 py-20 sm:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/8 via-transparent to-transparent"
        />

        {/* Logo avec animation au survol */}
        <div {...anim(mounted, 0)} className={`mb-6 flex flex-col items-center gap-3 ${anim(mounted, 0).className}`} style={anim(mounted, 0).style}>
          <div className="group relative h-40 w-40 cursor-pointer">
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

        <h1
          className={`mb-3 text-center text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl ${anim(mounted, 100).className}`}
          style={anim(mounted, 100).style}
        >
          Bibliothèque Numérique
        </h1>

        <p
          className={`mb-8 max-w-xl text-center text-muted-foreground text-sm sm:text-base ${anim(mounted, 180).className}`}
          style={anim(mounted, 180).style}
        >
          Accédez à l&apos;ensemble des travaux académiques des membres — mémoires, thèses et articles — classés par faculté, niveau et année.
        </p>

        <div
          className={`w-full max-w-2xl ${anim(mounted, 260).className}`}
          style={anim(mounted, 260).style}
        >
          <SearchBar size="hero" autoFocus />
        </div>

        <div
          className={`mt-5 flex flex-wrap justify-center gap-2 ${anim(mounted, 340).className}`}
          style={anim(mounted, 340).style}
        >
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

      {/* Stats réelles */}
      <section
        ref={statsRef as React.RefObject<HTMLElement>}
        className="border-y border-border/60 bg-muted/30 py-10 px-4"
      >
        <div className="mx-auto grid max-w-2xl grid-cols-3 gap-6 justify-items-center">
          {STATS.map(({ icon: Icon, label, value }, i) => (
            <div
              key={label}
              className={`flex flex-col items-center gap-2 text-center transition-all duration-700 ${statsInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
              style={{ transitionDelay: `${i * 120}ms` }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <span className="text-2xl font-bold text-foreground">{value}</span>
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Commission Pédagogique */}
      <section
        ref={commRef as React.RefObject<HTMLElement>}
        className="mx-auto max-w-4xl px-4 py-14"
      >
        <div
          className={`mb-8 text-center transition-all duration-700 ${commInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        >
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
          {[
            { icon: ClipboardList, title: "Analyse des besoins", body: "Identifier et évaluer les besoins de formation des membres afin d'orienter les programmes pédagogiques du Daara." },
            { icon: Archive, title: "Archivage des productions", body: "Collecter et préserver les productions intellectuelles des membres — mémoires, thèses et articles — au sein de cette bibliothèque numérique." },
            { icon: Lightbulb, title: "Méthodes innovantes", body: "Promouvoir des approches pédagogiques novatrices et organiser des rencontres scientifiques pour enrichir la pratique académique au sein du Daara." },
          ].map(({ icon: Icon, title, body }, i) => (
            <div
              key={title}
              className={`flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 transition-all duration-700 hover:shadow-md hover:-translate-y-0.5 ${commInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              style={{ transitionDelay: `${100 + i * 120}ms` }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">{title}</h3>
              <p className="text-xs leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Types de documents */}
      <section
        ref={typesRef as React.RefObject<HTMLElement>}
        className="mx-auto max-w-4xl px-4 py-12"
      >
        <h2
          className={`mb-6 text-center text-lg font-semibold text-foreground transition-all duration-700 ${typesInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        >
          Parcourir par type
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {RECENT_TYPES.map(({ label, href, color }, i) => (
            <Link
              key={label}
              href={href}
              className={`flex flex-col items-center gap-2 rounded-2xl p-5 text-center text-sm font-medium transition-all duration-700 hover:scale-[1.03] hover:shadow-md ${color} ${typesInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
              style={{ transitionDelay: `${i * 80}ms` }}
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
