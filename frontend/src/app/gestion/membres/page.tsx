"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import {
  Search, Users, Mail, GraduationCap, BookOpen, Calendar,
  RefreshCw, Plus, Loader2, Shield, UserRound
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription
} from "@/components/ui/sheet"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { usePagination } from "@/components/ui/pagination"
import { api } from "@/lib/api"
import type { User, Faculte, Niveau } from "@/types"
import { toast } from "sonner"

function getInitials(nom: string, prenom: string): string {
  return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase()
}

function MemberCard({ user }: { user: User }) {
  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {getInitials(user.nom, user.prenom)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold leading-tight">{user.prenom} {user.nom}</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <Mail className="h-3 w-3" />
              <span className="truncate">{user.email}</span>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-2 text-xs text-muted-foreground">
              {user.faculte && <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" /> {user.faculte}</span>}
              {user.niveau && <span className="flex items-center gap-1"><GraduationCap className="h-3 w-3" /> {user.niveau}</span>}
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Depuis {user.createdAt.split("-")[0]}</span>
            </div>
          </div>
          <Badge variant={user.role === "admin" ? "default" : "secondary"} className="text-[10px] flex-shrink-0">
            {user.role === "admin" ? "Admin" : "Membre"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AdminMembresPage() {
  const [users, setUsers] = useState<User[]>([])
  const [facultes, setFacultes] = useState<Faculte[]>([])
  const [niveaux, setNiveaux] = useState<Niveau[]>([])
  const [recherche, setRecherche] = useState("")
  const [refreshing, setRefreshing] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({
    prenom: "", nom: "", email: "", password: "", role: "membre" as "admin" | "membre",
    faculte: "", filiere: "", niveau: "",
  })
  const [saving, setSaving] = useState(false)

  function loadMembers() {
    api.getMembers().then(setUsers).catch(() => {})
  }

  useEffect(() => {
    loadMembers()
    api.getFacultes().then(setFacultes).catch(() => {})
    api.getNiveaux().then(setNiveaux).catch(() => {})
  }, [])

  const filtres = useMemo(
    () => users.filter((u) =>
      `${u.prenom} ${u.nom}`.toLowerCase().includes(recherche.toLowerCase()) ||
      u.email.toLowerCase().includes(recherche.toLowerCase()) ||
      u.faculte?.toLowerCase().includes(recherche.toLowerCase())
    ),
    [users, recherche]
  )

  const { paginated, PaginationBar } = usePagination(filtres, 9)

  const stats = useMemo(() => ({
    total: users.length,
    admins: users.filter((u) => u.role === "admin").length,
    membres: users.filter((u) => u.role === "membre").length,
  }), [users])

  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    loadMembers()
    setTimeout(() => setRefreshing(false), 800)
  }, [])

  const filieresDispo = useMemo(
    () => facultes.find((f) => f.nom === form.faculte)?.filieres ?? [],
    [facultes, form.faculte]
  )

  function handleCreate() {
    toast.info("Création d'utilisateur via API non disponible", {
      description: "Les membres s'inscrivent via le formulaire d'inscription.",
    })
    setCreateOpen(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Membres</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="gap-1.5 text-xs h-8 bg-primary hover:bg-primary/90"
            onClick={() => setCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Créer un utilisateur
          </Button>
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-8"
            onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        {[
          { label: "Total", value: stats.total, icon: Users },
          { label: "Admins", value: stats.admins, icon: Shield },
          { label: "Membres", value: stats.membres, icon: UserRound },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label} className="flex-1">
            <CardContent className="flex items-center gap-3 p-4">
              <Icon className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xl font-bold leading-tight">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input value={recherche} onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher un membre…" className="h-9 pl-9 rounded-lg text-sm" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {paginated.map((user) => <MemberCard key={user.id} user={user} />)}
        {filtres.length === 0 && (
          <div className="col-span-full flex flex-col items-center py-16 text-center">
            <Users className="h-10 w-10 text-muted-foreground/20 mb-3" />
            <p className="text-sm text-muted-foreground">Aucun membre trouvé</p>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between">
        <PaginationBar />
      </div>

      {/* Sheet Création utilisateur */}
      <Sheet open={createOpen} onOpenChange={(o) => !o && setCreateOpen(false)}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/60 flex-shrink-0">
            <SheetTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-primary" /> Créer un utilisateur</SheetTitle>
            <SheetDescription className="text-xs">Ajoutez un nouveau membre ou un administrateur.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Prénom <span className="text-destructive">*</span></Label>
                  <Input value={form.prenom} onChange={(e) => setForm((f) => ({ ...f, prenom: e.target.value }))}
                    className="h-9 text-sm" placeholder="Prénom" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Nom <span className="text-destructive">*</span></Label>
                  <Input value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                    className="h-9 text-sm" placeholder="Nom" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email <span className="text-destructive">*</span></Label>
                <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="h-9 text-sm" placeholder="email@exemple.com" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Mot de passe <span className="text-destructive">*</span></Label>
                <Input type="text" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="h-9 text-sm" placeholder="Mot de passe temporaire" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Rôle</Label>
                <Select value={form.role} onValueChange={(v) => v && setForm((f) => ({ ...f, role: v as "admin" | "membre" }))}>
                  <SelectTrigger className="h-9 text-sm w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="membre" className="text-sm">Membre</SelectItem>
                    <SelectItem value="admin" className="text-sm">Administrateur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <p className="text-[10px] text-muted-foreground">Informations facultatives</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Faculté</Label>
                  <Select value={form.faculte}
                    onValueChange={(v) => setForm((f) => ({ ...f, faculte: v ?? "", filiere: "" }))}>
                    <SelectTrigger className="h-9 text-sm w-full"><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      {facultes.map((f) => (
                        <SelectItem key={f.id} value={f.nom} className="text-sm">{f.nom}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Filière</Label>
                  <Select value={form.filiere} onValueChange={(v) => setForm((f) => ({ ...f, filiere: v ?? "" }))}
                    disabled={!form.faculte}>
                    <SelectTrigger className="h-9 text-sm w-full"><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      {filieresDispo.map((fi) => (
                        <SelectItem key={fi.id} value={fi.nom} className="text-sm">{fi.nom}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Niveau</Label>
                  <Select value={form.niveau} onValueChange={(v) => setForm((f) => ({ ...f, niveau: v ?? "" }))}>
                    <SelectTrigger className="h-9 text-sm w-full"><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      {niveaux.map((n) => (
                        <SelectItem key={n.id} value={n.nom} className="text-sm">{n.nom}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-border/60 px-6 py-4 flex items-center justify-end gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={() => setCreateOpen(false)} disabled={saving}>Annuler</Button>
            <Button size="sm" className="gap-1.5 bg-primary hover:bg-primary/90" onClick={handleCreate} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {saving ? "Création…" : "Créer"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
