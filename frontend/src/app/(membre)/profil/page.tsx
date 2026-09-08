"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  User, Mail, BookOpen, Calendar,
  FileText, LogOut, ArrowLeft, CheckCircle2, Clock, XCircle, Upload, Layers
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"
import { api } from "@/lib/api"
import { toast } from "sonner"
import type { Document, Faculte, Niveau } from "@/types"

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
  } catch {
    return iso
  }
}

export default function ProfilPage() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [mesDocuments, setMesDocuments] = useState<Document[]>([])
  const [facultes, setFacultes] = useState<Faculte[]>([])
  const [niveaux, setNiveaux] = useState<Niveau[]>([])
  const [form, setForm] = useState({
    prenom: "", nom: "", faculteId: "", filiereId: "", niveauId: "",
  })

  useEffect(() => {
    api.getMesDocuments().then(setMesDocuments).catch(() => {})
    api.getFacultes().then(setFacultes).catch(() => {})
    api.getNiveaux().then(setNiveaux).catch(() => {})
  }, [])

  // Pré-remplir le formulaire quand user + listes sont chargées
  useEffect(() => {
    if (!user || !facultes.length) return
    const fac = facultes.find((f) => f.nom === user.faculte)
    const fil = fac?.filieres.find((fi) => fi.nom === user.filiere)
    const niv = niveaux.find((n) => n.nom === user.niveau)
    setForm({
      prenom: user.prenom ?? "",
      nom: user.nom ?? "",
      faculteId: fac?.id ?? "",
      filiereId: fil?.id ?? "",
      niveauId: niv?.id ?? "",
    })
  }, [user, facultes, niveaux])

  const filieresDispo = useMemo(
    () => facultes.find((f) => f.id === form.faculteId)?.filieres ?? [],
    [facultes, form.faculteId]
  )

  const statsDocs = useMemo(() => ({
    enAttente: mesDocuments.filter((d) => d.statut === "en_attente").length,
    approuves: mesDocuments.filter((d) => d.statut === "approuve").length,
    rejetes:   mesDocuments.filter((d) => d.statut === "rejete").length,
  }), [mesDocuments])

  if (!user) { router.push("/connexion"); return null }

  async function handleSave() {
    setSaving(true)
    try {
      await api.updateProfile({
        first_name: form.prenom,
        last_name:  form.nom,
        faculte:    form.faculteId  || undefined,
        filiere:    form.filiereId  || undefined,
        niveau:     form.niveauId   || undefined,
      })
      toast.success("Profil mis à jour")
      setEditing(false)
      // Rafraîchir les données utilisateur
      window.location.reload()
    } catch {
      toast.error("Erreur lors de la mise à jour")
    } finally {
      setSaving(false)
    }
  }

  const selectCls = "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-colors disabled:opacity-50"

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" /> Retour au catalogue
        </Link>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* ── Colonne gauche ── */}
          <div className="space-y-4">
            {/* Carte identité */}
            <Card className="overflow-hidden">
              <div className="h-16 bg-gradient-to-r from-primary/80 to-primary" />
              <CardContent className="pt-0 px-5 pb-5">
                <div className="flex flex-col items-center -mt-8 text-center">
                  <Avatar className="h-16 w-16 border-4 border-background shadow">
                    <AvatarFallback className="bg-primary text-primary-foreground text-lg font-bold">
                      {user.prenom.charAt(0)}{user.nom.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="mt-3 text-base font-bold">{user.prenom} {user.nom}</h2>
                  <Badge className="mt-1 text-[10px]" variant="secondary">
                    {user.role === "admin" ? "Administrateur" : "Membre"}
                  </Badge>
                  <p className="mt-2 text-[11px] text-muted-foreground">{user.email}</p>
                  <p className="text-[11px] text-muted-foreground">Membre depuis {formatDate(user.createdAt)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Mes documents stats */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mes soumissions</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-2">
                    <p className="text-lg font-bold text-amber-600">{statsDocs.enAttente}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">En attente</p>
                  </div>
                  <div className="rounded-lg bg-primary/10 p-2">
                    <p className="text-lg font-bold text-primary">{statsDocs.approuves}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">Approuvés</p>
                  </div>
                  <div className="rounded-lg bg-destructive/10 p-2">
                    <p className="text-lg font-bold text-destructive">{statsDocs.rejetes}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">Rejetés</p>
                  </div>
                </div>
                <Link href="/profil/mes-documents" className="block">
                  <Button variant="outline" size="sm" className="w-full gap-2 text-xs">
                    <FileText className="h-3.5 w-3.5" /> Voir mes documents
                  </Button>
                </Link>
                <Link href="/soumettre" className="block">
                  <Button size="sm" className="w-full gap-2 text-xs bg-primary hover:bg-primary/90">
                    <Upload className="h-3.5 w-3.5" /> Déposer un document
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Button variant="outline" size="sm" className="w-full gap-2 text-destructive border-destructive/40 hover:bg-destructive/10"
              onClick={() => { logout(); router.push("/") }}>
              <LogOut className="h-4 w-4" /> Déconnexion
            </Button>
          </div>

          {/* ── Colonne droite ── */}
          <div className="space-y-5">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-semibold">Informations personnelles</h3>
                  <Button variant={editing ? "ghost" : "outline"} size="sm" className="text-xs h-8"
                    onClick={() => setEditing(!editing)}>
                    {editing ? "Annuler" : "Modifier"}
                  </Button>
                </div>

                {editing ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Prénom</Label>
                      <Input value={form.prenom} onChange={(e) => setForm((f) => ({ ...f, prenom: e.target.value }))} className="h-9 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Nom</Label>
                      <Input value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} className="h-9 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Faculté</Label>
                      <select value={form.faculteId}
                        onChange={(e) => setForm((f) => ({ ...f, faculteId: e.target.value, filiereId: "" }))}
                        className={selectCls}>
                        <option value="">Choisir</option>
                        {facultes.map((f) => (<option key={f.id} value={f.id}>{f.nom}</option>))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Filière</Label>
                      <select value={form.filiereId}
                        onChange={(e) => setForm((f) => ({ ...f, filiereId: e.target.value }))}
                        disabled={!form.faculteId} className={selectCls}>
                        <option value="">Choisir</option>
                        {filieresDispo.map((fi) => (<option key={fi.id} value={fi.id}>{fi.nom}</option>))}
                      </select>
                    </div>
                    <div className="space-y-1.5 col-span-2">
                      <Label className="text-xs text-muted-foreground">Niveau</Label>
                      <select value={form.niveauId}
                        onChange={(e) => setForm((f) => ({ ...f, niveauId: e.target.value }))}
                        className={selectCls}>
                        <option value="">Choisir</option>
                        {niveaux.map((n) => (<option key={n.id} value={n.id}>{n.nom}</option>))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <Button size="sm" className="w-full gap-2 bg-primary hover:bg-primary/90" onClick={handleSave} disabled={saving}>
                        {saving
                          ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> Enregistrement…</>
                          : <><CheckCircle2 className="h-4 w-4" /> Enregistrer</>}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                    <ProfileField icon={User}         label="Prénom"   value={user.prenom || "—"} />
                    <ProfileField icon={User}         label="Nom"      value={user.nom    || "—"} />
                    <ProfileField icon={Mail}         label="Email"    value={user.email} className="col-span-2" />
                    <ProfileField icon={BookOpen}      label="Faculté"  value={user.faculte  ?? "Non renseigné"} />
                    <ProfileField icon={BookOpen}     label="Filière"  value={user.filiere  ?? "Non renseigné"} />
                    <ProfileField icon={Layers}       label="Niveau"   value={user.niveau   ?? "Non renseigné"} />
                    <ProfileField icon={Calendar}     label="Membre depuis" value={formatDate(user.createdAt)} />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Derniers documents */}
            {mesDocuments.length > 0 && (
              <Card>
                <CardContent className="p-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Derniers documents soumis</h3>
                    <Link href="/profil/mes-documents">
                      <Button variant="outline" size="sm" className="text-xs h-7">Tout voir</Button>
                    </Link>
                  </div>
                  <Separator />
                  <div className="space-y-1">
                    {mesDocuments.slice(0, 3).map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/40 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{doc.titre}</p>
                          <p className="text-xs text-muted-foreground">{doc.type} · {doc.annee}</p>
                        </div>
                        <StatusBadge status={doc.statut} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ProfileField({ icon: Icon, label, value, className = "" }: {
  icon: React.ElementType; label: string; value: string; className?: string
}) {
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10">
        <Icon className="h-3.5 w-3.5 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { icon: React.ElementType; label: string; cls: string }> = {
    en_attente: { icon: Clock,         label: "En attente", cls: "text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200" },
    approuve:   { icon: CheckCircle2,  label: "Approuvé",   cls: "text-primary bg-primary/10 border-primary/20" },
    rejete:     { icon: XCircle,       label: "Rejeté",     cls: "text-destructive bg-destructive/10 border-destructive/20" },
  }
  const c = cfg[status]
  return (
    <Badge variant="outline" className={`gap-1 text-[10px] shrink-0 ${c?.cls ?? ""}`}>
      {c?.icon && <c.icon className="h-3 w-3" />} {c?.label ?? status}
    </Badge>
  )
}
