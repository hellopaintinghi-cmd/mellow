import { useEffect, useRef } from 'react'
import type { MoodWorld, SceneProp } from '@/types'

interface Props { world: MoodWorld; className?: string }

// ── Pixel drawing helpers ──────────────────────────────────────────────────────
const PX = 3  // scale factor: 1 "pixel" = 3×3 CSS pixels

function px(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.fillStyle = color
  ctx.fillRect(x * PX, y * PX, PX, PX)
}

function rect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color
  ctx.fillRect(x * PX, y * PX, w * PX, h * PX)
}

// ── Scene constants ──────────────────────────────────────────────────────────
const W = 120   // canvas width in pixels
const H = 70    // canvas height in pixels

// ── Prop drawing functions ────────────────────────────────────────────────────
function drawWindow(ctx: CanvasRenderingContext2D, x: number, y: number, glow: string) {
  rect(ctx, x,   y,   14, 18, '#3A2E2A')  // frame
  rect(ctx, x+1, y+1, 12, 16, glow)       // glass
  rect(ctx, x+7, y+1,  1, 16, '#3A2E2A')  // divider v
  rect(ctx, x+1, y+9, 12,  1, '#3A2E2A')  // divider h
}

function drawLamp(ctx: CanvasRenderingContext2D, x: number, y: number, accent: string) {
  rect(ctx, x+3, y,   4, 1,  accent)   // shade
  rect(ctx, x+2, y+1, 6, 3,  accent)
  rect(ctx, x+4, y+4, 2, 6,  '#7A6A58')// pole
  rect(ctx, x+2, y+9, 6, 1,  '#7A6A58')// base
}

function drawCup(ctx: CanvasRenderingContext2D, x: number, y: number, accent: string) {
  rect(ctx, x+1, y,   5, 1, '#F2E4D4')
  rect(ctx, x,   y+1, 7, 5, accent)
  rect(ctx, x+1, y+6, 5, 1, accent)
  rect(ctx, x+7, y+2, 1, 3, accent)   // handle
  // Steam
  for (let i = 0; i < 3; i++) {
    px(ctx, x + 1 + i * 2, y - 2, 'rgba(255,255,255,0.4)')
    px(ctx, x + 2 + i * 2, y - 3, 'rgba(255,255,255,0.25)')
  }
}

function drawTree(ctx: CanvasRenderingContext2D, x: number, y: number, leafColor: string) {
  // trunk
  rect(ctx, x+4, y+12, 2, 6, '#7A4A2B')
  // canopy layers
  rect(ctx, x+3, y+8,  4, 4, leafColor)
  rect(ctx, x+1, y+5,  8, 4, leafColor)
  rect(ctx, x+0, y+2, 10, 4, leafColor)
  rect(ctx, x+2, y+0,  6, 3, leafColor)
}

function drawMountain(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, snow: boolean) {
  for (let row = 0; row < 12; row++) {
    const w = 2 + row * 2
    rect(ctx, x + 12 - row - 1, y + row, w, 1, color)
  }
  if (snow) rect(ctx, x+10, y, 5, 3, '#F0F4FF')
}

function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const c = 'rgba(255,255,255,0.75)'
  rect(ctx, x+2, y+2, 6, 3, c)
  rect(ctx, x+0, y+3, 10, 2, c)
  rect(ctx, x+1, y+5, 8, 1, c)
}

function drawSun(ctx: CanvasRenderingContext2D, x: number, y: number) {
  rect(ctx, x+2, y+2, 4, 4, '#FFD27D')
  // rays
  px(ctx, x+3, y,   '#FFD27D'); px(ctx, x+4, y, '#FFD27D')
  px(ctx, x+3, y+7, '#FFD27D'); px(ctx, x+4, y+7, '#FFD27D')
  px(ctx, x,   y+3, '#FFD27D'); px(ctx, x,   y+4, '#FFD27D')
  px(ctx, x+7, y+3, '#FFD27D'); px(ctx, x+7, y+4, '#FFD27D')
}

function drawMoon(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const c = '#F2E4D4'
  rect(ctx, x+2, y+1, 4, 6, c)
  rect(ctx, x+1, y+2, 6, 4, c)
  // crescent shadow
  rect(ctx, x+3, y+2, 3, 4, 'rgba(30,34,51,0.4)')
}

function drawFire(ctx: CanvasRenderingContext2D, x: number, y: number) {
  rect(ctx, x+2, y+4, 4, 4, '#E98A4E')
  rect(ctx, x+1, y+5, 6, 3, '#C9573D')
  rect(ctx, x+3, y+3, 2, 2, '#FFD27D')
  px(ctx, x+2, y+2, '#FFD27D')
  px(ctx, x+4, y+1, '#FFD27D')
}

function drawButterfly(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  rect(ctx, x,   y+1, 3, 2, color)
  rect(ctx, x+4, y+1, 3, 2, color)
  px(ctx, x+1,  y,   color)
  px(ctx, x+5,  y,   color)
  rect(ctx, x+3, y+1, 1, 4, '#3A2A26')  // body
}

function drawShelf(ctx: CanvasRenderingContext2D, x: number, y: number, bookColors: string[]) {
  rect(ctx, x, y+8, 20, 1, '#7A4A2B')  // shelf
  const bc = bookColors
  for (let i = 0; i < 6; i++) {
    const bx = x + i * 3 + (i > 2 ? 1 : 0)
    const bh = 4 + (i % 3)
    rect(ctx, bx, y + 8 - bh, 2, bh, bc[i % bc.length])
  }
}

function drawFlowers(ctx: CanvasRenderingContext2D, x: number, y: number, petal: string) {
  for (let i = 0; i < 4; i++) {
    const fx = x + i * 6
    rect(ctx, fx+1, y+4, 2, 3, '#7FAE7A')  // stem
    px(ctx, fx+1, y+3, petal)
    px(ctx, fx+2, y+2, petal)
    px(ctx, fx+3, y+3, petal)
    px(ctx, fx+2, y+4, '#FFD27D')  // center
  }
}

function drawWaves(ctx: CanvasRenderingContext2D, y: number, color: string, tick: number) {
  for (let x = 0; x < W; x++) {
    const wave = Math.sin((x + tick) * 0.2) * 2
    px(ctx, x, Math.round(y + wave), color)
  }
}

function drawBook(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  rect(ctx, x,   y,   2, 10, '#8C6E54')  // spine
  rect(ctx, x+2, y+1, 6, 8,  color)
  rect(ctx, x+8, y,   1, 10, '#E8DCC8')  // pages
}

function drawPlant(ctx: CanvasRenderingContext2D, x: number, y: number, leafColor: string) {
  rect(ctx, x+3, y+7,  2, 5, '#7A4A2B')  // pot
  rect(ctx, x+2, y+10, 4, 3, '#9C6644')
  // leaves
  rect(ctx, x+1, y+3, 5, 2, leafColor)
  rect(ctx, x+3, y+2, 4, 3, leafColor)
  rect(ctx, x+0, y+5, 4, 2, leafColor)
}

// ── Main renderer ─────────────────────────────────────────────────────────────
function renderScene(
  ctx: CanvasRenderingContext2D,
  world: MoodWorld,
  tick: number
) {
  const { scene, palette } = world

  // Sky gradient (simple 2-tone)
  const skyH = Math.floor(H * 0.55)
  const [skyTop, skyBot] = scene.sky
  for (let y = 0; y < skyH; y++) {
    const t = y / skyH
    const r = parseInt(skyTop.slice(1, 3), 16) * (1 - t) + parseInt(skyBot.slice(1, 3), 16) * t
    const g = parseInt(skyTop.slice(3, 5), 16) * (1 - t) + parseInt(skyBot.slice(3, 5), 16) * t
    const b = parseInt(skyTop.slice(5, 7), 16) * (1 - t) + parseInt(skyBot.slice(5, 7), 16) * t
    ctx.fillStyle = `rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`
    ctx.fillRect(0, y * PX, W * PX, PX)
  }

  // Ground
  rect(ctx, 0, skyH, W, H - skyH, scene.ground)

  // Horizon highlight
  rect(ctx, 0, skyH - 1, W, 2, palette.secondary + '66')

  // ── Weather effects (animated) ───────────────────────────────────────────
  if (scene.weather === 'rain') {
    ctx.fillStyle = 'rgba(180,210,240,0.45)'
    for (let i = 0; i < 30; i++) {
      const rx = ((i * 37 + tick * 4) % (W + 5))
      const ry = ((i * 17 + tick * 8) % (H + 5))
      ctx.fillRect(rx * PX, ry * PX, 1, PX * 3)
    }
  }
  if (scene.weather === 'snow') {
    for (let i = 0; i < 20; i++) {
      const sx = ((i * 43 + tick * 1.5) % (W + 4)) | 0
      const sy = ((i * 19 + tick * 2.5) % (H + 4)) | 0
      ctx.fillStyle = 'rgba(240,244,255,0.8)'
      ctx.fillRect(sx * PX, sy * PX, PX, PX)
    }
  }
  if (scene.weather === 'stars') {
    for (let i = 0; i < 18; i++) {
      const sx = ((i * 53 + 7) % W) | 0
      const sy = ((i * 23 + 3) % skyH) | 0
      const alpha = 0.4 + 0.6 * Math.sin((tick * 0.05 + i) % (Math.PI * 2))
      ctx.fillStyle = `rgba(255,240,200,${alpha.toFixed(2)})`
      ctx.fillRect(sx * PX, sy * PX, PX, PX)
    }
  }

  // ── Props ─────────────────────────────────────────────────────────────────
  const props = scene.props as SceneProp[]
  for (const prop of props) {
    switch (prop) {
      case 'window':  drawWindow(ctx,  4, skyH - 22, palette.primary); break
      case 'lamp':    drawLamp(ctx,   20, skyH - 16, palette.accent);   break
      case 'cup':     drawCup(ctx,    52, skyH - 11, palette.accent);   break
      case 'shelf':   drawShelf(ctx,  70, skyH - 16, [palette.primary, palette.accent, '#8C6E54', '#7FAE7A', '#F2B6C6', '#7C9CC8']); break
      case 'books':   drawBook(ctx,   30, skyH - 14, palette.primary);  break
      case 'tree':    drawTree(ctx,   84, skyH - 18, palette.primary);  break
      case 'mountain':drawMountain(ctx, 60, skyH - 14, palette.secondary, scene.weather === 'snow'); break
      case 'cloud':   drawCloud(ctx,  30, skyH - 28 + Math.sin(tick * 0.03) * 2 | 0, ); break
      case 'sun':     drawSun(ctx,    90, 8);  break
      case 'moon':    drawMoon(ctx,   92, 6);  break
      case 'fire':    drawFire(ctx,   44, skyH - 10); break
      case 'butterfly': drawButterfly(ctx, 60 + (Math.sin(tick * 0.07) * 8 | 0), skyH - 18, palette.accent); break
      case 'flowers': drawFlowers(ctx, 2, skyH - 8, palette.accent);  break
      case 'plant':   drawPlant(ctx,  88, skyH - 18, palette.primary); break
      case 'waves':   drawWaves(ctx, skyH + 3, palette.primary, tick); break
      case 'boat':
        rect(ctx, 54, skyH - 2, 10, 2, '#8C6E54')
        rect(ctx, 60, skyH - 6, 1, 4, '#3A2A26')
        rect(ctx, 55, skyH - 6, 6, 3, '#F2E4D4')
        break
      case 'tent':
        rect(ctx, 30, skyH - 10, 16, 8, palette.primary)
        for (let ty = 0; ty < 8; ty++) rect(ctx, 30 + 8 - ty - 1, skyH - 10 + ty, (ty + 1) * 2, 1, palette.secondary)
        break
    }
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function PixelWorld({ world, className = '' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const tickRef   = useRef(0)
  const rafRef    = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.imageSmoothingEnabled = false

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      renderScene(ctx, world, tickRef.current)
      tickRef.current++
      rafRef.current = requestAnimationFrame(draw)
    }
    draw()
    return () => cancelAnimationFrame(rafRef.current)
  }, [world])

  return (
    <canvas
      ref={canvasRef}
      width={W * PX}
      height={H * PX}
      className={`pixelated rounded-2xl ${className}`}
      style={{ imageRendering: 'pixelated' }}
      aria-label={`Pixel art scene: ${world.name}`}
    />
  )
}
