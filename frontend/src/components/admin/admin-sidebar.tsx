"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard, ClipboardList, FolderTree,
  BookMarked, Users, LogOut
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup,
  SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarSeparator,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { useAuth } from "@/contexts/auth-context"
import { MOCK_DOCUMENTS } from "@/lib/mock-data"

const NAV_GESTION = [
  { title: "Classification", href: "/admin/classification", icon: FolderTree },
  { title: "Membres", href: "/admin/membres", icon: Users },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  const pendingCount = MOCK_DOCUMENTS.filter((d) => d.statut === "en_attente").length

  const NAV_MAIN: { title: string; href: string; icon: LucideIcon; badge?: number }[] = [
    { title: "Tableau de bord", href: "/admin", icon: LayoutDashboard },
    { title: "Soumissions", href: "/admin/soumissions", icon: ClipboardList, badge: pendingCount },
    { title: "Documents", href: "/admin/documents", icon: BookMarked },
  ]

  function isActive(href: string) {
    return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href)
  }

  function handleLogout() {
    logout()
    router.push("/")
  }

  const initials = user ? `${user.prenom.charAt(0)}${user.nom.charAt(0)}` : "AD"

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="px-4 py-4 group-data-[collapsible=icon]:px-1.5 group-data-[collapsible=icon]:py-1.5">
        <Link href="/" className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
          <div className="relative h-8 w-8 overflow-hidden rounded-full ring-2 ring-primary/30 flex-shrink-0 bg-white dark:bg-white p-0.5">
            <Image src="/logo.png" alt="Logo DMN" fill className="object-contain" />
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <p className="text-sm font-bold text-primary leading-tight">DMN-BU</p>
            <p className="text-xs text-muted-foreground leading-tight">Administration</p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_MAIN.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={isActive(item.href)}
                    tooltip={item.title}
                    className="justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </div>
                    {"badge" in item && (item.badge ?? 0) > 0 && (
                      <Badge variant="default" className="h-5 min-w-5 px-1.5 text-[10px] bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                        {item.badge}
                      </Badge>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel>Gestion</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_GESTION.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={isActive(item.href)}
                    tooltip={item.title}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-3 py-3 space-y-2">
        <SidebarSeparator />
        <div className="flex items-center gap-2 px-2 group-data-[collapsible=icon]:justify-center">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div className="group-data-[collapsible=icon]:hidden flex-1 min-w-0">
            <p className="text-xs font-semibold truncate">{user?.prenom} {user?.nom}</p>
            <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
          </div>
          <div className="group-data-[collapsible=icon]:hidden flex gap-1">
            <ThemeToggle />
            <button onClick={handleLogout} className="rounded p-1 hover:bg-muted transition-colors">
              <LogOut className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
