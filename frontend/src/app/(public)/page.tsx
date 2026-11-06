"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  BookOpen, FileText, Users, ClipboardList, Archive, Lightbulb,
  UserPlus, Search, UploadCloud, CheckCircle2, ArrowRight,
} from "lucide-react"
import { SearchBar } from "@/components/search/search-bar"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api"
import { SectionReveal, SectionRevealItem } from "@/components/effects/section-reveal"
import { TYPE_LABELS, TYPE_COLORS, TYPE_ICONS } from "@/lib/document-types"

const QUICK_SEARCHES = [
  "Économie islamique",
  "Sciences de l'éducation",
  "Droit",
  "Médecine",
  "Informatique",
  "Philosophie",
]

const BROWSABLE_TYPES = ["memoire_licence", "memoire_master", "these_doctorat", "article"] as const

const STEPS = [
  { icon: UserPlus, title: "Créez votre compte", body: "Inscrivez-vous avec votre faculté, votre filière et votre niveau en quelques secondes.", accent: "text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-300" },
  { icon: Search, title: "Explorez le catalogue", body: "Recherchez par mot-clé, faculté, niveau ou année parmi les travaux déjà publiés.", accent: "text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300" },
  { icon: UploadCloud, title: "Déposez vos travaux", body: "Soumettez vos mémoires, thèses ou articles — ils sont vérifiés avant publication.", accent: "text-violet-600 bg-violet-50 dark:bg-violet-950/40 dark:text-violet-300" },
  { icon: CheckCircle2, title: "Consultez librement", body: "Une fois approuvés, vos documents rejoignent la bibliothèque, accessibles à tous les membres.", accent: "text-primary bg-primary/10" },
]

const COMMISSION_CARDS = [
  { icon: ClipboardList, title: "Analyse des besoins", body: "Identifier et évaluer les besoins de formation des membres afin d'orienter les programmes pédagogiques du Daara.", accent: "text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-300" },
  { icon: Archive, title: "Archivage des productions", body: "Collecter et préserver les productions intellectuelles des membres — mémoires, thèses et articles — au sein de cette bibliothèque numérique.", accent: "text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300" },
  { icon: Lightbulb, title: "Méthodes innovantes", body: "Promouvoir des approches pédagogiques novatrices et organiser des rencontres scientifiques pour enrichir la pratique académique au sein du Daara.", accent: "text-violet-600 bg-violet-50 dark:bg-violet-950/40 dark:text-violet-300" },
]

const STAT_ACCENTS = [
  "text-primary bg-primary/10",
  "text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-300",
  "text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300",
]

export default function HomePage() {
  const [stats, setStats] = useState({ totalDocuments: 0, totalFacultes: 0, totalMembres: 0 })
  const [bookRotation, setBookRotation] = useState(25)
  const [isDraggingBook, setIsDraggingBook] = useState(false)
  const bookDragRef = useRef({ pointerId: -1, startX: 0, startRotation: 0 })

  useEffect(() => {
    api.getPublicStats().then(setStats).catch(() => {})
  }, [])

  const handleBookPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    bookDragRef.current = { pointerId: event.pointerId, startX: event.clientX, startRotation: bookRotation }
    setIsDraggingBook(true)
  }

  const handleBookPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (bookDragRef.current.pointerId !== event.pointerId) return
    const nextRotation = bookDragRef.current.startRotation + (event.clientX - bookDragRef.current.startX) * 0.6
    setBookRotation(Math.max(-20, Math.min(200, nextRotation)))
  }

  const handleBookPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (bookDragRef.current.pointerId !== event.pointerId) return
    bookDragRef.current.pointerId = -1
    setIsDraggingBook(false)
  }

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
        <div aria-hidden className="hero-pattern pointer-events-none absolute inset-0 -z-10" />
        <div aria-hidden className="hero-glow pointer-events-none absolute -z-10" />

        {/* Logo avec animation au survol */}
        <SectionRevealItem variant="fade-down" className="mb-6 flex flex-col items-center gap-3">
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
        </SectionRevealItem>

        <SectionRevealItem variant="fade-up" delay={100} as="h1"
          className="mb-3 text-center font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl"
        >
          Bibliothèque <span className="text-primary">Numérique</span>
        </SectionRevealItem>

        <SectionRevealItem variant="blur-in" delay={220} as="p"
          className="mb-8 max-w-xl text-center text-muted-foreground text-sm sm:text-base"
        >
          Accédez à l&apos;ensemble des travaux académiques des membres — mémoires, thèses et articles — classés par faculté, niveau et année.
        </SectionRevealItem>

        <SectionRevealItem variant="rise" delay={340} className="w-full max-w-2xl">
          <SearchBar size="hero" autoFocus />
        </SectionRevealItem>

        <SectionRevealItem variant="zoom-in" delay={460} className="mt-5 flex flex-wrap justify-center gap-2">
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
        </SectionRevealItem>
      </section>

      {/* Stats réelles */}
      <section className="border-y border-border/60 bg-muted/30 py-10 px-4">
        <div className="mx-auto grid max-w-2xl grid-cols-3 gap-6 justify-items-center">
          {STATS.map(({ icon: Icon, label, value }, i) => (
            <SectionRevealItem
              key={label}
              variant={i % 2 === 0 ? "zoom-in" : "fade-up"}
              delay={i * 120}
              className="flex flex-col items-center gap-2 text-center"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${STAT_ACCENTS[i]}`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="font-display text-2xl font-bold text-foreground">{value}</span>
              <span className="text-xs text-muted-foreground">{label}</span>
            </SectionRevealItem>
          ))}
        </div>
      </section>

      {/* Comment ça marche */}
      <SectionReveal variant="blur-in" className="bg-background">
        <section className="mx-auto max-w-5xl px-4 py-16">
          <div className="mb-10 text-center">
            <span className="inline-flex items-center gap-2 mb-3 rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold text-primary uppercase tracking-widest">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Comment ça marche
            </span>
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              De l&apos;inscription à la consultation
            </h2>
          </div>

          <ol className="grid gap-px overflow-hidden rounded-2xl bg-border sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ icon: Icon, title, body, accent }, i) => (
              <SectionRevealItem
                as="li"
                key={title}
                variant={i % 2 === 0 ? "fade-right" : "fade-left"}
                delay={i * 110}
                className="group relative flex flex-col gap-3 bg-card p-6 transition-colors hover:bg-muted/40"
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-4xl font-black leading-none text-muted-foreground/15 transition-colors group-hover:text-primary/30">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${accent}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <h3 className="font-display text-sm font-bold text-foreground">{title}</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">{body}</p>
              </SectionRevealItem>
            ))}
          </ol>
        </section>
      </SectionReveal>

      {/* Commission Pédagogique */}
      <SectionReveal variant="fade-up">
        <section className="mx-auto max-w-4xl px-4 py-14">
          <div className="mb-8 text-center">
            <span className="inline-block mb-3 rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold text-primary uppercase tracking-widest">
              Commission Pédagogique
            </span>
            <h2 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Daara Madjmahoun Noreyni · UCAD
            </h2>
            <p className="mt-4 mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Instance de réflexion et de gouvernance chargée de superviser, d&apos;évaluer et d&apos;améliorer
              la qualité de l&apos;enseignement à travers la documentation, la recherche et des rencontres
              scientifiques.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {COMMISSION_CARDS.map(({ icon: Icon, title, body, accent }, i) => (
              <SectionRevealItem
                key={title}
                variant={i % 2 === 0 ? "zoom-in" : "fade-up"}
                delay={100 + i * 120}
                className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${accent}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-sm font-bold text-foreground">{title}</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">{body}</p>
              </SectionRevealItem>
            ))}
          </div>
        </section>
      </SectionReveal>

      {/* Nos réalisations */}
      <section className="border-y border-border/60 bg-muted/20 px-4 py-16">
        <div className="mx-auto grid max-w-4xl items-center gap-10 md:grid-cols-[minmax(0,0.9fr)_minmax(280px,1.1fr)]">
          <SectionRevealItem variant="fade-right">
            <span className="inline-block mb-3 rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
              Nos réalisations
            </span>
            <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Journal de la Commission Pédagogique
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">
              Découvrez une publication consacrée à la transmission des savoirs et aux travaux de la Commission Pédagogique.
            </p>
            <p className="mt-5 hidden text-xs font-medium text-primary/80 sm:block">
              Faites glisser la couverture pour l&apos;explorer
            </p>
          </SectionRevealItem>

          <SectionRevealItem variant="zoom-in" delay={140} className="flex min-h-[460px] items-center justify-center">
            <div className="book-wrapper">
              <div
                aria-label="Couverture 3D du journal de la Commission Pédagogique"
                className={`book-stage ${isDraggingBook ? "cursor-grabbing" : "cursor-grab"}`}
                onPointerDown={handleBookPointerDown}
                onPointerMove={handleBookPointerMove}
                onPointerUp={handleBookPointerUp}
                onPointerCancel={handleBookPointerUp}
                role="img"
                style={{
                  transform: `rotateX(6deg) rotateY(${bookRotation}deg)`,
                }}
              >
                <div className="book-face book-front" />
                <div className="book-face book-back" />
                <div className="book-face book-spine" />
                <div className="book-face book-page-edge" />
              </div>
            </div>
          </SectionRevealItem>
        </div>
      </section>

      {/* Types de documents */}
      <SectionReveal variant="fade-up">
        <section className="mx-auto max-w-4xl px-4 py-14">
          <h2 className="mb-8 text-center font-display text-xl font-bold text-foreground sm:text-2xl">
            Parcourir par type
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {BROWSABLE_TYPES.map((type, i) => {
              const Icon = TYPE_ICONS[type]
              return (
                <SectionRevealItem
                  as="div"
                  key={type}
                  variant={i % 2 === 0 ? "fade-right" : "fade-left"}
                  delay={i * 90}
                >
                  <Link
                    href={`/recherche?type=${type}`}
                    className={`group flex h-full flex-col items-center gap-3 rounded-2xl border border-transparent p-6 text-center text-sm font-semibold transition-all duration-300 hover:-translate-y-1 hover:border-current/20 hover:shadow-lg ${TYPE_COLORS[type]}`}
                  >
                    <Icon className="h-8 w-8" />
                    {TYPE_LABELS[type]}
                    <span className="flex items-center gap-1 text-[11px] font-normal opacity-0 transition-opacity group-hover:opacity-70">
                      Parcourir <ArrowRight className="h-3 w-3" />
                    </span>
                  </Link>
                </SectionRevealItem>
              )
            })}
          </div>
        </section>
      </SectionReveal>
    </>
  )
}
