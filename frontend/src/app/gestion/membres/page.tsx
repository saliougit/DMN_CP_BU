"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import {
  Search, Users, Mail, GraduationCap, BookOpen, Calendar,
  RefreshCw, Plus, Loader2, Shield, UserRound, Lock, Eye, EyeOff, Bell, BellOff
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
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

function formatDate(iso: string | undefined): string {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
  } catch { return iso }
}

export default function AdminMembresPage() {
  const [users, setUsers] = useState<User[]>([])
  const [facultes, setFacultes] = useState<Faculte[]>([])
  const [niveaux, setNiveaux] = useState<Niveau[]>([])
  const [recherche, setRecherche] = useState("")
  const [refreshing, setRefreshing] = useState(false)

  // Création
  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState({
    prenom: "", nom: "", email: "", password: "", role: "membre" as "admin" | "membre",
    faculte: "", filiere: "", niveau: "",
  })
  const [showCreatePwd, setShowCreatePwd] = useState(false)
  const [saving, setSaving] = useState(false)

  // Détail membre + set-password
  const [detailUser, setDetailUser] = useState<User | null>(null)
  const [setPwdForm, setSetPwdForm] = useState({ password: "", notify: true })
  const [showSetPwd, setShowSetPwd] = useState(false)
  const [savingPwd, setSavingPwd] = useState(false)

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

  const createFilieresDispo = useMemo(
    () => facultes.find((f) => f.nom === createForm.faculte)?.filieres ?? [],
    [facultes, createForm.faculte]
  )

  async function handleCreate() {
    if (!createForm.email || !createForm.password) {
      toast.error("Email et mot de passe requis")
      return
    }
    if (createForm.password.length < 8) {
      toast.error("Le mot de passe doit contenir au moins 8 caractères")
      return
    }
    setSaving(true)
    try {
      const created = await api.createMember({
        email: createForm.email,
        password: createForm.password,
        role: createForm.role,
        prenom: createForm.prenom || undefined,
        nom: createForm.nom || undefined,
        faculte: createForm.faculte || undefined,
        filiere: createForm.filiere || undefined,
        niveau: createForm.niveau || undefined,
      })
      toast.success(`Compte créé pour ${created.email} — email de bienvenue envoyé`)
      setUsers((prev) => [created, ...prev])
      setCreateOpen(false)
      setCreateForm({ prenom: "", nom: "", email: "", password: "", role: "membre", faculte: "", filiere: "", niveau: "" })
    } catch (err: any) {
      toast.error(err?.message ?? "Erreur lors de la création")
    } finally {
      setSaving(false)
    }
  }

  async function handleSetPassword() {
    if (!detailUser) return
    if (setPwdForm.password.length < 8) {
      toast.error("8 caractères minimum")
      return
    }
    setSavingPwd(true)
    try {
      await api.adminSetPassword(detailUser.id, setPwdForm.password, setPwdForm.notify)
      toast.success(`Mot de passe mis à jour${setPwdForm.notify ? " — email envoyé" : ""}`)
      setSetPwdForm({ password: "", notify: true })
      setShowSetPwd(false)
    } catch (err: any) {
      toast.error(err?.message ?? "Erreur lors de la mise à jour")
    } finally {
      setSavingPwd(false)
    }
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
        {paginated.map((user) => (
          <Card key={user.id} className="hover:shadow-sm transition-shadow cursor-pointer"
            onClick={() => { setDetailUser(user); setSetPwdForm({ password: "", notify: true }); setShowSetPwd(false) }}>
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
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDate(user.createdAt)}</span>
                  </div>
                </div>
                <Badge variant={user.role === "admin" ? "default" : "secondary"} className="text-[10px] flex-shrink-0">
                  {user.role === "admin" ? "Admin" : "Membre"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
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

      {/* Sheet Détail membre + set-password */}
      <Sheet open={!!detailUser} onOpenChange={(o) => !o && setDetailUser(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
          {detailUser && (
            <>
              <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/60 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                      {getInitials(detailUser.nom, detailUser.prenom)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <SheetTitle className="text-base">{detailUser.prenom} {detailUser.nom}</SheetTitle>
                    <SheetDescription className="text-xs">{detailUser.email}</SheetDescription>
                  </div>
                </div>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-muted-foreground">Rôle</p>
                    <Badge variant={detailUser.role === "admin" ? "default" : "secondary"} className="text-[10px] mt-1">
                      {detailUser.role === "admin" ? "Admin" : "Membre"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Inscrit le</p>
                    <p className="font-medium mt-1">{formatDate(detailUser.createdAt)}</p>
                  </div>
                  {detailUser.faculte && (
                    <div>
                      <p className="text-muted-foreground">Faculté</p>
                      <p className="font-medium mt-1">{detailUser.faculte}</p>
                    </div>
                  )}
                  {detailUser.filiere && (
                    <div>
                      <p className="text-muted-foreground">Filière</p>
                      <p className="font-medium mt-1">{detailUser.filiere}</p>
                    </div>
                  )}
                  {detailUser.niveau && (
                    <div>
                      <p className="text-muted-foreground">Niveau</p>
                      <p className="font-medium mt-1">{detailUser.niveau}</p>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Set-password section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-semibold">Changer le mot de passe</span>
                    </div>
                    {!showSetPwd && (
                      <Button variant="outline" size="sm" className="text-xs h-7"
                        onClick={() => setShowSetPwd(true)}>
                        Modifier
                      </Button>
                    )}
                  </div>

                  {showSetPwd && (
                    <div className="space-y-3 rounded-lg border border-border/60 p-4 bg-muted/20">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Nouveau mot de passe</Label>
                        <div className="relative">
                          <Input type={showSetPwd && false ? "text" : (showSetPwd ? "password" : "password")}
                            value={setPwdForm.password}
                            onChange={(e) => setSetPwdForm((p) => ({ ...p, password: e.target.value }))}
                            placeholder="8 caractères minimum" className="h-9 text-sm pr-10" />
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {setPwdForm.notify
                            ? <Bell className="h-4 w-4 text-primary" />
                            : <BellOff className="h-4 w-4 text-muted-foreground" />}
                          <Label className="text-xs cursor-pointer" htmlFor="notify-switch">
                            {setPwdForm.notify ? "Notifier le membre par email" : "Ne pas notifier"}
                          </Label>
                        </div>
                        <Switch id="notify-switch" checked={setPwdForm.notify}
                          onCheckedChange={(v) => setSetPwdForm((p) => ({ ...p, notify: v })) } />
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="text-xs h-8 flex-1"
                          onClick={() => { setShowSetPwd(false); setSetPwdForm({ password: "", notify: true }) }}
                          disabled={savingPwd}>
                          Annuler
                        </Button>
                        <Button size="sm" className="text-xs h-8 flex-1 bg-primary hover:bg-primary/90 gap-1.5"
                          onClick={handleSetPassword} disabled={savingPwd}>
                          {savingPwd ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Enregistrement…</>
                            : <><Lock className="h-3.5 w-3.5" /> Enregistrer</>}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

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
                  <Label className="text-xs">Prénom</Label>
                  <Input value={createForm.prenom} onChange={(e) => setCreateForm((f) => ({ ...f, prenom: e.target.value }))}
                    className="h-9 text-sm" placeholder="Prénom" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Nom</Label>
                  <Input value={createForm.nom} onChange={(e) => setCreateForm((f) => ({ ...f, nom: e.target.value }))}
                    className="h-9 text-sm" placeholder="Nom" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email <span className="text-destructive">*</span></Label>
                <Input type="email" value={createForm.email} onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                  className="h-9 text-sm" placeholder="email@exemple.com" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Mot de passe <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Input type={showCreatePwd ? "text" : "password"} value={createForm.password}
                    onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                    className="h-9 text-sm pr-10" placeholder="8 caractères minimum" />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowCreatePwd((v) => !v)}>
                    {showCreatePwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Rôle</Label>
                <Select value={createForm.role} onValueChange={(v) => v && setCreateForm((f) => ({ ...f, role: v as "admin" | "membre" }))}>
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
                  <Select value={createForm.faculte}
                    onValueChange={(v) => setCreateForm((f) => ({ ...f, faculte: v ?? "", filiere: "" }))}>
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
                  <Select value={createForm.filiere} onValueChange={(v) => setCreateForm((f) => ({ ...f, filiere: v ?? "" }))}
                    disabled={!createForm.faculte}>
                    <SelectTrigger className="h-9 text-sm w-full"><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      {createFilieresDispo.map((fi) => (
                        <SelectItem key={fi.id} value={fi.nom} className="text-sm">{fi.nom}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Niveau</Label>
                  <Select value={createForm.niveau} onValueChange={(v) => setCreateForm((f) => ({ ...f, niveau: v ?? "" }))}>
                    <SelectTrigger className="h-9 text-sm w-full"><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      {niveaux.map((n) => (
                        <SelectItem key={n.id} value={n.nom} className="text-sm">{n.nom}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground bg-muted/40 rounded p-2 border border-border/40">
                Un email de bienvenue avec les identifiants sera automatiquement envoyé{createForm.role === "admin" ? " à l'administrateur" : " au membre"}.
              </p>
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
