"use client"

import Image from "next/image"

interface DmnLoaderProps {
  fullscreen?: boolean
  size?: "sm" | "md" | "lg"
}

export function DmnLoader({ fullscreen = false, size = "md" }: DmnLoaderProps) {
  const sizes = {
    sm: { ring: "h-12 w-12", logo: 24, border: "border-[3px]" },
    md: { ring: "h-20 w-20", logo: 40, border: "border-4" },
    lg: { ring: "h-28 w-28", logo: 56, border: "border-[5px]" },
  }
  const s = sizes[size]

  const inner = (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        {/* Anneau externe animé */}
        <div
          className={`${s.ring} ${s.border} rounded-full border-primary/20 border-t-primary animate-spin`}
          style={{ animationDuration: "0.9s" }}
        />
        {/* Logo centré */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-full overflow-hidden bg-white dark:bg-white shadow-sm"
            style={{ width: s.logo, height: s.logo }}>
            <Image
              src="/logo.png"
              alt="DMN"
              width={s.logo}
              height={s.logo}
              className="object-contain"
              priority
            />
          </div>
        </div>
      </div>
      {size !== "sm" && (
        <p className="text-xs text-muted-foreground font-medium tracking-wide animate-pulse">
          Chargement…
        </p>
      )}
    </div>
  )

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {inner}
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center py-16">
      {inner}
    </div>
  )
}
