"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  User, Mail, GraduationCap, BookOpen, Calendar,
  FileText, LogOut, ArrowLeft, CheckCircle2, Clock, XCircle, Upload
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/contexts/auth-context"
import { MOCK_DOCUMENTS } from "@/lib/mock-data"
import { MOCK_FACULTES, MOCK_NIVEAUX } from "@/lib/mock-data"
import { TYPE_LABELS, TYPE_COLORS } from "@/lib/document-types"
import { toast } from "sonner"

export default function ProfilPage() {
  const { user, logout } = useAuth()
  const router = useRouter()

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    nom: user?.nom ?? "", prenom: user?.prenom ?? "",
    faculte: user?.faculte ?? "", filiere: user?.filiere ?? "",
    niveau: user?.niveau ?? "",
  })

  const filieresDispo = useMemo(
    () => MOCK_FACULTES.find((f) => f.nom === form.faculte)?.filieres ?? [],
    [form.faculte]
  )

  const mesDocuments = useMemo(
    () => MOCK_DOCUMENTS.filter((d) => d.soumisParId === user?.id),
    [user]
  )

  const statsDocs = useMemo(() => ({
    enAttente: mesDocuments.filter((d) => d.statut === "en_attente").length,
    approuves: mesDocuments.filter((d) => d.statut === "approuve").length,
    rejetes: mesDocuments.filter((d) => d.statut === "rejete").length,
  }), [mesDocuments])

  if (!user) {
    router.push("/connexion")
    return null
  }

  function handleSave() {
    toast.success("Profil mis à jour")
    setEditing(false)
  }

  function handleLogout() {
    logout()
    router.push("/")
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-6">
        <ArrowLeft className="h-4 w-4" /> Retour à l&apos;accueil
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Colonne gauche : Infos */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-6 flex flex-col items-center text-center">
              <Avatar className="h-20 w-20 mb-3">
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                  {user.prenom.charAt(0)}{user.nom.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-lg font-bold">{user.prenom} {user.nom}</h2>
              <Badge variant="secondary" className="mt-1">{user.role === "admin" ? "Administrateur" : "Membre"}</Badge>
              <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
                <Mail className="h-3 w-3" /> {user.email}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" /> Membre depuis {user.createdAt}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Mes documents</p>
              <div className="flex justify-around text-center">
                <div>
                  <p className="text-lg font-bold text-amber-600">{statsDocs.enAttente}</p>
                  <p className="text-[10px] text-muted-foreground">En attente</p>
                </div>
                <Separator orientation="vertical" className="h-10" />
                <div>
                  <p className="text-lg font-bold text-primary">{statsDocs.approuves}</p>
                  <p className="text-[10px] text-muted-foreground">Approuvés</p>
                </div>
                <Separator orientation="vertical" className="h-10" />
                <div>
                  <p className="text-lg font-bold text-destructive">{statsDocs.rejetes}</p>
                  <p className="text-[10px] text-muted-foreground">Rejetés</p>
                </div>
              </div>
              <Link href="/profil/mes-documents">
                <Button variant="outline" size="sm" className="w-full gap-2 text-xs mt-1">
                  <FileText className="h-3.5 w-3.5" /> Voir mes documents
                </Button>
              </Link>
              <Separator className="my-1" />
              <Link href="/soumettre">
                <Button size="sm" className="w-full gap-2 text-xs bg-primary hover:bg-primary/90">
                  <Upload className="h-3.5 w-3.5" /> Déposer un document
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Button variant="destructive" size="sm" className="w-full gap-2" onClick={handleLogout}>
            <LogOut className="h-4 w-4" /> Déconnexion
          </Button>
        </div>

        {/* Colonne droite : Formulaire */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold">Informations personnelles</h3>
                  <p className="text-xs text-muted-foreground">Gérez vos informations de profil</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setEditing(!editing)}>
                  {editing ? "Annuler" : "Modifier"}
                </Button>
              </div>

              <Separator />

              {editing ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Prénom</Label>
                    <Input value={form.prenom} onChange={(e) => setForm((f) => ({ ...f, prenom: e.target.value }))} className="h-10 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Nom</Label>
                    <Input value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} className="h-10 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Faculté</Label>
                    <select value={form.faculte} onChange={(e) => setForm((f) => ({ ...f, faculte: e.target.value, filiere: "" }))}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:border-primary">
                      <option value="">Choisir</option>
                      {MOCK_FACULTES.map((f) => (<option key={f.id} value={f.nom}>{f.nom}</option>))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Filière</Label>
                    <select value={form.filiere} onChange={(e) => setForm((f) => ({ ...f, filiere: e.target.value }))}
                      disabled={!form.faculte}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:border-primary disabled:opacity-50">
                      <option value="">Choisir</option>
                      {filieresDispo.map((fi) => (<option key={fi.id} value={fi.nom}>{fi.nom}</option>))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Niveau</Label>
                    <select value={form.niveau} onChange={(e) => setForm((f) => ({ ...f, niveau: e.target.value }))}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:border-primary">
                      <option value="">Choisir</option>
                      {MOCK_NIVEAUX.map((n) => (<option key={n.id} value={n.nom}>{n.nom}</option>))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <Button size="sm" className="w-full gap-2 bg-primary hover:bg-primary/90" onClick={handleSave}>
                      <CheckCircle2 className="h-4 w-4" /> Enregistrer
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <ProfileRow icon={User} label="Prénom" value={user.prenom} />
                  <ProfileRow icon={User} label="Nom" value={user.nom} />
                  <ProfileRow icon={Mail} label="Email" value={user.email} />
                  <ProfileRow icon={BookOpen} label="Faculté" value={user.faculte ?? "Non renseigné"} />
                  <ProfileRow icon={BookOpen} label="Filière" value={user.filiere ?? "Non renseigné"} />
                  <ProfileRow icon={GraduationCap} label="Niveau" value={user.niveau ?? "Non renseigné"} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Derniers documents */}
          {mesDocuments.length > 0 && (
            <Card>
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold">Derniers documents soumis</h3>
                  <Link href="/profil/mes-documents"><Button variant="outline" size="sm" className="text-xs">Tout voir</Button></Link>
                </div>
                <Separator />
                <div className="space-y-2">
                  {mesDocuments.slice(0, 3).map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30">
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
  )
}

function ProfileRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { icon: React.ElementType; label: string; color: string }> = {
    en_attente: { icon: Clock, label: "En attente", color: "text-amber-600 bg-amber-50 dark:bg-amber-950" },
    approuve: { icon: CheckCircle2, label: "Approuvé", color: "text-primary bg-primary/10" },
    rejete: { icon: XCircle, label: "Rejeté", color: "text-destructive bg-destructive/10" },
  }
  const c = config[status]
  return (
    <Badge variant="outline" className={`gap-1 text-[10px] ${c?.color ?? ""}`}>
      {c?.icon && <c.icon className="h-3 w-3" />} {c?.label ?? status}
    </Badge>
  )
}
