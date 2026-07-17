import { AuthGuard } from "@/components/auth/auth-guard"
import { PublicNavbar } from "@/components/layout/public-navbar"
import { Footer } from "@/components/layout/footer"
import { ContactDrawer } from "@/components/layout/contact-drawer"

export default function MembreLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen flex-col">
        <PublicNavbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <ContactDrawer />
      </div>
    </AuthGuard>
  )
}
