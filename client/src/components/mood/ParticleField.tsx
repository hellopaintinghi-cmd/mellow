import { useEffect, useRef } from 'react'

interface Props { count?: number; dark?: boolean }

interface Particle {
  x: number; y: number; vx: number; vy: number
  r: number; color: string; opacity: number; opacityDir: number
}

const COLORS_DARK  = ['#C9A0DC', '#7FAE7A', '#D8A47F', '#7C9CC8', '#F2B6C6', '#FFD27D']
const COLORS_LIGHT = ['#C9A0DC', '#7FAE7A', '#D8A47F', '#7C9CC8', '#F2B6C6']

export default function ParticleField({ count = 40, dark = true }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particles = useRef<Particle[]>([])
  const raf       = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const colors = dark ? COLORS_DARK : COLORS_LIGHT

    const resize = () => {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Spawn particles
    particles.current = Array.from({ length: count }, () => ({
      x:  Math.random() * canvas.width,
      y:  Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: -Math.random() * 0.5 - 0.15,
      r:  Math.random() * 2.5 + 0.8,
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: Math.random() * 0.6 + 0.1,
      opacityDir: Math.random() > 0.5 ? 1 : -1,
    }))

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const p of particles.current) {
        // Update
        p.x += p.vx
        p.y += p.vy
        p.opacity += p.opacityDir * 0.003
        if (p.opacity > 0.7)  p.opacityDir = -1
        if (p.opacity < 0.05) p.opacityDir =  1

        // Wrap
        if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width }
        if (p.x < -10) p.x = canvas.width + 10
        if (p.x > canvas.width + 10) p.x = -10

        // Draw
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.opacity
        ctx.fill()
      }
      ctx.globalAlpha = 1
      raf.current = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(raf.current)
      window.removeEventListener('resize', resize)
    }
  }, [count, dark])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden
    />
  )
}
