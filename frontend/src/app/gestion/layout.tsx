import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminGuard } from "./AdminGuard"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <SidebarProvider>
        <AdminSidebar />
        <SidebarInset>
          <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border/60 px-3 sm:px-4">
            <SidebarTrigger className="-ml-1" />
          </header>
          <div className="flex-1 p-3 sm:p-6">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </AdminGuard>
  )
}
