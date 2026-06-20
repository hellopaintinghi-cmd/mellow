import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function formatXp(xp: number): string {
  if (xp >= 1000) return `${(xp / 1000).toFixed(1)}k`
  return String(xp)
}

export function energyLabel(v: number): string {
  if (v <= 1) return 'Very Low'
  if (v === 2) return 'Low'
  if (v === 3) return 'Medium'
  if (v === 4) return 'High'
  return 'Very High'
}

export function energyColor(v: number): string {
  const palette = ['#A8C0D6', '#7FAE7A', '#D8A47F', '#C9A0DC', '#FF6FB2']
  return palette[Math.min(v - 1, 4)]
}

/** Sleep for ms milliseconds */
export const sleep = (ms: number) => new Promise<void>(res => setTimeout(res, ms))

/** Generate a deterministic colour from a string (for avatar fallback, etc.) */
export function stringToColor(s: string): string {
  let hash = 0
  for (let i = 0; i < s.length; i++) hash = s.charCodeAt(i) + ((hash << 5) - hash)
  const h = Math.abs(hash) % 360
  return `hsl(${h}, 50%, 70%)`
}

/** Linear interpolate between two hex colours (0 = a, 1 = b) */
export function lerpColor(a: string, b: string, t: number): string {
  const parse = (hex: string) => {
    const n = parseInt(hex.slice(1), 16)
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  }
  const [ar, ag, ab] = parse(a)
  const [br, bg, bb] = parse(b)
  const r = Math.round(ar + (br - ar) * t)
  const g = Math.round(ag + (bg - ag) * t)
  const bl2 = Math.round(ab + (bb - ab) * t)
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${bl2.toString(16).padStart(2,'0')}`
}
