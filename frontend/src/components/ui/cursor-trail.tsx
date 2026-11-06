"use client"

import { useEffect, useState } from "react"

const STORAGE_KEY = "dmn_cursor_trail"

export function useCursorTrailEnabled() {
  const [enabled, setEnabled] = useState(true)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored !== null) setEnabled(stored === "true")
    } catch {}
  }, [])

  function toggle() {
    setEnabled((prev) => {
      const next = !prev
      try { localStorage.setItem(STORAGE_KEY, String(next)) } catch {}
      return next
    })
  }

  return { enabled, toggle }
}

export function CursorTrail({ enabled = true }: { enabled?: boolean }) {
  useEffect(() => {
    if (!enabled) return
    // Pas de curseur sur tactile : la boucle d'animation tournerait pour
    // rien en continu (requestAnimationFrame perpetuel), pur gaspillage de
    // batterie pour un effet qui ne peut jamais se declencher la-bas.
    if (typeof window !== "undefined" && !window.matchMedia("(pointer: fine)").matches) return

    const N = 14
    const LERP = 0.18

    const container = document.createElement("div")
    container.style.cssText =
      "position:fixed;top:0;left:0;width:0;height:0;pointer-events:none;z-index:9998;overflow:visible"
    document.body.appendChild(container)

    const dots: HTMLDivElement[] = []
    for (let i = 0; i < N; i++) {
      const t = 1 - i / N
      const size = Math.round(t * 10) + 2
      const dot = document.createElement("div")
      dot.style.cssText = [
        "position:absolute",
        `width:${size}px`,
        `height:${size}px`,
        "border-radius:50%",
        `background:oklch(0.48 0.16 148 / ${(t * 0.65).toFixed(2)})`,
        "transform:translate(-50%,-50%)",
        "will-change:left,top",
        "transition:background 0.3s",
      ].join(";")
      container.appendChild(dot)
      dots.push(dot)
    }

    const pos: Array<{ x: number; y: number }> = Array.from({ length: N }, () => ({ x: -200, y: -200 }))
    const target = { x: -200, y: -200 }
    let rafId = 0
    let visible = false

    function onMove(e: MouseEvent) {
      target.x = e.clientX
      target.y = e.clientY
      if (!visible) {
        visible = true
        dots.forEach((d) => (d.style.opacity = "1"))
      }
    }

    function onLeave() {
      visible = false
      dots.forEach((d) => (d.style.opacity = "0"))
    }

    function animate() {
      pos[0].x += (target.x - pos[0].x) * LERP
      pos[0].y += (target.y - pos[0].y) * LERP
      for (let i = 1; i < N; i++) {
        pos[i].x += (pos[i - 1].x - pos[i].x) * LERP
        pos[i].y += (pos[i - 1].y - pos[i].y) * LERP
      }
      for (let i = 0; i < N; i++) {
        dots[i].style.left = pos[i].x + "px"
        dots[i].style.top = pos[i].y + "px"
      }
      rafId = requestAnimationFrame(animate)
    }

    dots.forEach((d) => (d.style.opacity = "0"))
    window.addEventListener("mousemove", onMove, { passive: true })
    document.addEventListener("mouseleave", onLeave)
    rafId = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener("mousemove", onMove)
      document.removeEventListener("mouseleave", onLeave)
      cancelAnimationFrame(rafId)
      if (container.parentNode) container.parentNode.removeChild(container)
    }
  }, [enabled])

  return null
}
