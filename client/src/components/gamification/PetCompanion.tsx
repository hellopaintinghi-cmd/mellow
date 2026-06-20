import { useEffect, useRef } from 'react'
import { useProfile } from '@/store/mellowStore'
import type { PetSpecies } from '@/types'

interface Props { size?: 'sm' | 'md' | 'lg' }

// ── Pixel art sprites 12×12 grid ─────────────────────────────────────────────
// Each array is rows of hex colours; '.' = transparent

const CAT_IDLE = [
  '  ████  ',
  ' █ ██ █ ',
  ' ██████ ',
  '  ████  ',
  ' ██████ ',
  '████████',
  '█ ████ █',
  '  █  █  ',
]

type Sprite = string[]

const SPRITES: Record<PetSpecies, { idle: Sprite; color: string; highlight: string }> = {
  cat:      { idle: ['..##.##..', '.#.##.#.', '.#####.', '##O.O##', '.#####.', '..###..', '.#...#.', '##...##'], color: '#D8A47F', highlight: '#F2B6C6' },
  bunny:    { idle: ['.##.##..', '#..#..#', '.#####.', '.#O.O#.', '##.^.##', '.#####.', '.#...#.', '##...##'], color: '#EFF4F8', highlight: '#F2B6C6' },
  fox:      { idle: ['#.....#', '##.#.##', '.#####.', '.#O.O#.', '.##^##.', '.#####.', '.##.##.', '#.....#'], color: '#E98A4E', highlight: '#FFD27D' },
  capybara: { idle: ['........', '.######.', '#.####.#', '#.O..O.#', '#.####.#', '.######.', '..#..#..', '........'], color: '#C9B79C', highlight: '#E8DCC8' },
  penguin:  { idle: ['..###...', '.#####..', '#.O.O.#.', '#.###.#.', '.######.', '..####..', '.##.##..', '........'], color: '#2A2E3E', highlight: '#EFF4F8' },
}

const PX_SIZE: Record<NonNullable<Props['size']>, number> = { sm: 3, md: 4, lg: 6 }
const DIM     = 8   // sprite is 8×8 grid units

function renderPet(ctx: CanvasRenderingContext2D, species: PetSpecies, level: number, pxSize: number, tick: number) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  const { color, highlight } = SPRITES[species]

  // Bob animation
  const bobY = Math.sin(tick * 0.08) > 0.5 ? 1 : 0

  // Draw a small cute blob pet based on species
  const draw = (x: number, y: number, c: string) => {
    ctx.fillStyle = c
    ctx.fillRect((x) * pxSize, (y + bobY) * pxSize, pxSize, pxSize)
  }

  // Head
  for (let hx = 2; hx < 6; hx++) for (let hy = 0; hy < 4; hy++) draw(hx, hy, color)
  // Eyes
  draw(2, 1, '#2A1F14')
  draw(5, 1, '#2A1F14')
  // Nose
  draw(3, 2, highlight)
  draw(4, 2, highlight)
  // Cheeks
  ctx.globalAlpha = 0.4
  draw(2, 2, '#F2B6C6')
  draw(5, 2, '#F2B6C6')
  ctx.globalAlpha = 1
  // Body
  for (let bx = 1; bx < 7; bx++) for (let by = 4; by < 7; by++) draw(bx, by, color)
  // Feet
  draw(1, 7, highlight); draw(2, 7, highlight)
  draw(5, 7, highlight); draw(6, 7, highlight)

  // Species-specific features
  if (species === 'cat') {
    // Ears
    draw(1, 0, highlight); draw(6, 0, highlight)
    // Tail
    const tailX = 7 + (Math.sin(tick * 0.1) > 0 ? 1 : 0)
    draw(tailX, 5, color)
    draw(tailX, 6, color)
  } else if (species === 'bunny') {
    // Tall ears
    draw(2, -2, highlight); draw(5, -2, highlight)
    draw(2, -1, highlight); draw(5, -1, highlight)
  } else if (species === 'fox') {
    // Bushy tail
    ctx.fillStyle = '#FFD27D'
    ctx.fillRect(7 * pxSize, (5 + bobY) * pxSize, pxSize * 2, pxSize * 2)
  } else if (species === 'capybara') {
    // Wider body
    draw(0, 5, color); draw(7, 5, color)
  } else if (species === 'penguin') {
    // Belly white
    for (let bx = 2; bx < 6; bx++) for (let by = 4; by < 7; by++) draw(bx, by, '#EFF4F8')
    // Flippers
    draw(0, 4, '#1A1E2C'); draw(7, 4, '#1A1E2C')
  }

  // Level stars
  const stars = Math.min(level, 5)
  ctx.fillStyle = '#FFD27D'
  for (let i = 0; i < stars; i++) {
    ctx.fillRect((i * 2) * pxSize, 0 * pxSize, pxSize, pxSize)
  }
}

export default function PetCompanion({ size = 'md' }: Props) {
  const profile = useProfile()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef    = useRef<number>(0)
  const tickRef   = useRef(0)
  const pxSize    = PX_SIZE[size]
  const canvasDim = DIM * pxSize + pxSize * 2  // a bit of padding

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.imageSmoothingEnabled = false

    const loop = () => {
      renderPet(ctx, profile.pet, profile.petLevel, pxSize, tickRef.current)
      tickRef.current++
      rafRef.current = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(rafRef.current)
  }, [profile.pet, profile.petLevel, pxSize])

  return (
    <div className="flex flex-col items-center gap-1">
      <canvas
        ref={canvasRef}
        width={canvasDim}
        height={canvasDim + pxSize * 2}
        style={{ imageRendering: 'pixelated' }}
        aria-label={`Pixel pet: ${profile.pet}`}
      />
      {size !== 'sm' && (
        <span className="font-pixel text-[8px] text-warm-300">
          Lv.{profile.petLevel}
        </span>
      )}
    </div>
  )
}
