export function Footer() {
  return (
    <footer className="border-t border-border/40">
      <div className="mx-auto flex h-11 max-w-7xl items-center px-6">
        <p className="text-[11px] text-muted-foreground/50 select-none">
          © {new Date().getFullYear()} DMN-BU · Daara Madjmahoun Noreyni · UCAD · Dakar
        </p>
      </div>
    </footer>
  )
}
