/**
 * Mellow Ambient Synth Engine
 * ───────────────────────────
 * Every ambient sound (rain, fire, birds, train hum…) is generated live with
 * the Web Audio API — filtered noise, oscillators, and randomly-scheduled
 * impulses. There are zero external audio files, so nothing can 404, get
 * CORS-blocked, or go stale. If you can hear it, it's because the graph is
 * actually running — there's no "fake playing" state possible.
 */
import type { AmbientSound } from '@/types'

type StopFn = () => void
type BuilderFn = (ctx: AudioContext, out: GainNode) => StopFn

// ── Noise buffer generators ────────────────────────────────────────────────────

function whiteNoiseBuffer(ctx: AudioContext, seconds = 4): AudioBuffer {
  const n = ctx.sampleRate * seconds
  const buf = ctx.createBuffer(1, n, ctx.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1
  return buf
}

function brownNoiseBuffer(ctx: AudioContext, seconds = 4): AudioBuffer {
  const n = ctx.sampleRate * seconds
  const buf = ctx.createBuffer(1, n, ctx.sampleRate)
  const data = buf.getChannelData(0)
  let last = 0
  for (let i = 0; i < n; i++) {
    const white = Math.random() * 2 - 1
    last = (last + 0.02 * white) / 1.02
    data[i] = last * 3.2
  }
  return buf
}

function loopedNoiseSource(ctx: AudioContext, buffer: AudioBuffer): AudioBufferSourceNode {
  const src = ctx.createBufferSource()
  src.buffer = buffer
  src.loop = true
  return src
}

// ── Building blocks ────────────────────────────────────────────────────────────

/** Continuous filtered-noise bed (rain, wind, ocean base, traffic rumble…) */
function noiseBed(opts: {
  noiseType?: 'white' | 'brown'
  filterType: BiquadFilterType
  freq: number
  q?: number
  gain?: number
  secondFilter?: { type: BiquadFilterType; freq: number; q?: number }
  lfoRate?: number      // slow amplitude wobble (for waves/wind gusts)
  lfoDepth?: number
}): BuilderFn {
  return (ctx, out) => {
    const buffer = opts.noiseType === 'brown' ? brownNoiseBuffer(ctx, 5) : whiteNoiseBuffer(ctx, 5)
    const src = loopedNoiseSource(ctx, buffer)

    const filter = ctx.createBiquadFilter()
    filter.type = opts.filterType
    filter.frequency.value = opts.freq
    filter.Q.value = opts.q ?? 0.7

    const gain = ctx.createGain()
    gain.gain.value = opts.gain ?? 0.6

    let chain: AudioNode = src
    chain.connect(filter)
    chain = filter

    let filter2: BiquadFilterNode | null = null
    if (opts.secondFilter) {
      filter2 = ctx.createBiquadFilter()
      filter2.type = opts.secondFilter.type
      filter2.frequency.value = opts.secondFilter.freq
      filter2.Q.value = opts.secondFilter.q ?? 0.7
      chain.connect(filter2)
      chain = filter2
    }

    chain.connect(gain).connect(out)
    src.start()

    let lfo: OscillatorNode | null = null
    let lfoGain: GainNode | null = null
    if (opts.lfoRate) {
      lfo = ctx.createOscillator()
      lfo.frequency.value = opts.lfoRate
      lfoGain = ctx.createGain()
      lfoGain.gain.value = opts.lfoDepth ?? 0.2
      lfo.connect(lfoGain).connect(gain.gain)
      lfo.start()
    }

    return () => {
      try { src.stop() } catch {}
      src.disconnect(); filter.disconnect(); filter2?.disconnect(); gain.disconnect()
      lfo?.stop(); lfo?.disconnect(); lfoGain?.disconnect()
    }
  }
}

/** A pure tone drone, optionally with a quiet harmonic (train hum, neon hum) */
function drone(freq: number, harmonics: number[] = [2], baseGain = 0.35): BuilderFn {
  return (ctx, out) => {
    const oscs: OscillatorNode[] = []
    const gains: GainNode[] = []

    const mk = (f: number, g: number) => {
      const o = ctx.createOscillator()
      o.type = 'sine'
      o.frequency.value = f
      const gn = ctx.createGain()
      gn.gain.value = g
      o.connect(gn).connect(out)
      o.start()
      oscs.push(o); gains.push(gn)
    }

    mk(freq, baseGain)
    harmonics.forEach((h, i) => mk(freq * h, baseGain * (0.25 / (i + 1))))

    return () => {
      oscs.forEach(o => { try { o.stop() } catch {}; o.disconnect() })
      gains.forEach(g => g.disconnect())
    }
  }
}

/** Randomly-scheduled short impulses — crackle, clicks, pops, drips */
function impulseScheduler(opts: {
  minMs: number
  maxMs: number
  burst: (ctx: AudioContext, out: GainNode) => void
}): BuilderFn {
  return (ctx, out) => {
    let active = true
    let timeoutId = 0

    const fire = () => {
      if (!active) return
      opts.burst(ctx, out)
      const delay = opts.minMs + Math.random() * (opts.maxMs - opts.minMs)
      timeoutId = window.setTimeout(fire, delay)
    }
    timeoutId = window.setTimeout(fire, Math.random() * opts.minMs)

    return () => { active = false; window.clearTimeout(timeoutId) }
  }
}

function noiseBurst(ctx: AudioContext, out: GainNode, opts: {
  duration?: number; freq?: number; q?: number; peakGain?: number
}) {
  const dur = opts.duration ?? (0.04 + Math.random() * 0.05)
  const buf = whiteNoiseBuffer(ctx, dur)
  const src = ctx.createBufferSource()
  src.buffer = buf

  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = (opts.freq ?? 2500) + (Math.random() - 0.5) * 800
  bp.Q.value = opts.q ?? 3

  const g = ctx.createGain()
  const peak = opts.peakGain ?? (0.4 + Math.random() * 0.3)
  g.gain.setValueAtTime(0, ctx.currentTime)
  g.gain.linearRampToValueAtTime(peak, ctx.currentTime + 0.004)
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur)

  src.connect(bp).connect(g).connect(out)
  src.start()
  src.stop(ctx.currentTime + dur + 0.05)
}

function toneChirp(ctx: AudioContext, out: GainNode, opts: {
  baseFreq: number; sweep?: number; duration?: number; peakGain?: number
}) {
  const dur = opts.duration ?? 0.18
  const osc = ctx.createOscillator()
  osc.type = 'sine'
  const base = opts.baseFreq + (Math.random() - 0.5) * opts.baseFreq * 0.2
  osc.frequency.setValueAtTime(base, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(base * (opts.sweep ?? 1.3), ctx.currentTime + dur * 0.4)
  osc.frequency.exponentialRampToValueAtTime(base * 0.85, ctx.currentTime + dur)

  const g = ctx.createGain()
  const peak = opts.peakGain ?? 0.22
  g.gain.setValueAtTime(0, ctx.currentTime)
  g.gain.linearRampToValueAtTime(peak, ctx.currentTime + 0.02)
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur)

  osc.connect(g).connect(out)
  osc.start()
  osc.stop(ctx.currentTime + dur + 0.05)
}

/** Combine multiple builders into one (layered textures) */
function layer(...builders: BuilderFn[]): BuilderFn {
  return (ctx, out) => {
    const stops = builders.map(b => b(ctx, out))
    return () => stops.forEach(s => s())
  }
}

// ── Per-sound definitions ──────────────────────────────────────────────────────

const BUILDERS: Record<AmbientSound, BuilderFn> = {
  'rain': noiseBed({
    filterType: 'bandpass', freq: 3800, q: 0.5, gain: 0.55,
    secondFilter: { type: 'highpass', freq: 1000 },
  }),

  'thunder': layer(
    noiseBed({ noiseType: 'brown', filterType: 'lowpass', freq: 180, gain: 0.18 }),
    impulseScheduler({
      minMs: 9000, maxMs: 22000,
      burst: (ctx, out) => {
        const dur = 1.4 + Math.random() * 0.8
        const buf = brownNoiseBuffer(ctx, dur)
        const src = ctx.createBufferSource()
        src.buffer = buf
        const lp = ctx.createBiquadFilter()
        lp.type = 'lowpass'
        lp.frequency.value = 250
        const g = ctx.createGain()
        g.gain.setValueAtTime(0, ctx.currentTime)
        g.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.3)
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur)
        src.connect(lp).connect(g).connect(out)
        src.start(); src.stop(ctx.currentTime + dur + 0.1)
      },
    })
  ),

  'ocean-waves': noiseBed({
    filterType: 'lowpass', freq: 950, gain: 0.5,
    lfoRate: 0.11, lfoDepth: 0.22,
  }),

  'fireplace': layer(
    noiseBed({ noiseType: 'brown', filterType: 'lowpass', freq: 320, gain: 0.16 }),
    impulseScheduler({
      minMs: 180, maxMs: 650,
      burst: (ctx, out) => noiseBurst(ctx, out, { duration: 0.03 + Math.random() * 0.04, freq: 2800, q: 4, peakGain: 0.25 }),
    })
  ),

  'wind': noiseBed({
    filterType: 'bandpass', freq: 600, q: 0.6, gain: 0.4,
    secondFilter: { type: 'lowpass', freq: 1400 },
    lfoRate: 0.08, lfoDepth: 0.18,
  }),

  'snow-wind': noiseBed({
    filterType: 'highpass', freq: 700, q: 0.5, gain: 0.3,
    secondFilter: { type: 'lowpass', freq: 2200 },
    lfoRate: 0.06, lfoDepth: 0.15,
  }),

  'grass-rustle': noiseBed({
    filterType: 'highpass', freq: 1800, gain: 0.16,
    lfoRate: 0.4, lfoDepth: 0.3,
  }),

  'distant-traffic': noiseBed({
    noiseType: 'brown', filterType: 'lowpass', freq: 380, gain: 0.22,
    lfoRate: 0.05, lfoDepth: 0.1,
  }),

  'cafe-chatter': layer(
    noiseBed({ filterType: 'bandpass', freq: 850, q: 0.8, gain: 0.18, lfoRate: 0.3, lfoDepth: 0.15 }),
    noiseBed({ filterType: 'bandpass', freq: 1400, q: 1.1, gain: 0.12, lfoRate: 0.22, lfoDepth: 0.2 }),
    impulseScheduler({
      minMs: 600, maxMs: 1600,
      burst: (ctx, out) => noiseBurst(ctx, out, { duration: 0.12, freq: 1100, q: 1.5, peakGain: 0.1 }),
    })
  ),

  'birds': impulseScheduler({
    minMs: 1500, maxMs: 4500,
    burst: (ctx, out) => toneChirp(ctx, out, { baseFreq: 2200 + Math.random() * 1800, duration: 0.18, peakGain: 0.18 }),
  }),

  'seagulls': impulseScheduler({
    minMs: 2500, maxMs: 6500,
    burst: (ctx, out) => toneChirp(ctx, out, { baseFreq: 900 + Math.random() * 500, sweep: 1.6, duration: 0.35, peakGain: 0.16 }),
  }),

  'forest-night': layer(
    noiseBed({ noiseType: 'brown', filterType: 'lowpass', freq: 260, gain: 0.14 }),
    impulseScheduler({
      minMs: 800, maxMs: 2600,
      burst: (ctx, out) => toneChirp(ctx, out, { baseFreq: 3200 + Math.random() * 1200, duration: 0.08, peakGain: 0.08 }),
    })
  ),

  'train-hum': layer(
    drone(58, [2, 3], 0.22),
    noiseBed({ noiseType: 'brown', filterType: 'lowpass', freq: 220, gain: 0.12 }),
  ),

  'neon-hum': drone(120, [2], 0.1),

  'keyboard-clicks': impulseScheduler({
    minMs: 110, maxMs: 420,
    burst: (ctx, out) => noiseBurst(ctx, out, { duration: 0.018, freq: 4200, q: 6, peakGain: 0.18 }),
  }),

  'page-turns': impulseScheduler({
    minMs: 3000, maxMs: 9000,
    burst: (ctx, out) => noiseBurst(ctx, out, { duration: 0.22, freq: 2200, q: 1.2, peakGain: 0.16 }),
  }),

  'vinyl-crackle': layer(
    noiseBed({ filterType: 'highpass', freq: 4500, gain: 0.05 }),
    impulseScheduler({
      minMs: 80, maxMs: 320,
      burst: (ctx, out) => noiseBurst(ctx, out, { duration: 0.012, freq: 5000, q: 8, peakGain: 0.12 }),
    })
  ),

  'cup-clinks': impulseScheduler({
    minMs: 6000, maxMs: 16000,
    burst: (ctx, out) => toneChirp(ctx, out, { baseFreq: 1800, sweep: 1.1, duration: 0.12, peakGain: 0.14 }),
  }),

  'clock-tick': impulseScheduler({
    minMs: 1000, maxMs: 1000,
    burst: (ctx, out) => noiseBurst(ctx, out, { duration: 0.015, freq: 1800, q: 5, peakGain: 0.12 }),
  }),
}

// ── Engine ──────────────────────────────────────────────────────────────────────

interface Voice { gain: GainNode; stop: StopFn }

class AmbientEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private voices = new Map<AmbientSound, Voice>()

  private ensureCtx() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext
      this.ctx = new Ctx()
      this.master = this.ctx.createGain()
      this.master.gain.value = 1
      this.master.connect(this.ctx.destination)
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {})
    return { ctx: this.ctx, master: this.master! }
  }

  /** Call this from a user gesture (click) to satisfy browser autoplay policy. */
  unlock() {
    this.ensureCtx()
  }

  isUnlocked(): boolean {
    return !!this.ctx && this.ctx.state === 'running'
  }

  start(sound: AmbientSound, volume: number) {
    const { ctx, master } = this.ensureCtx()
    if (this.voices.has(sound)) {
      this.setVolume(sound, volume)
      return
    }
    const builder = BUILDERS[sound]
    if (!builder) return

    const gain = ctx.createGain()
    gain.gain.value = volume
    gain.connect(master)

    const stop = builder(ctx, gain)
    this.voices.set(sound, { gain, stop })
  }

  setVolume(sound: AmbientSound, volume: number) {
    const v = this.voices.get(sound)
    if (v && this.ctx) v.gain.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.06)
  }

  stop(sound: AmbientSound) {
    const v = this.voices.get(sound)
    if (!v) return
    v.stop()
    v.gain.disconnect()
    this.voices.delete(sound)
  }

  stopAll() {
    for (const sound of [...this.voices.keys()]) this.stop(sound)
  }

  isPlaying(sound: AmbientSound): boolean {
    return this.voices.has(sound)
  }

  activeSounds(): AmbientSound[] {
    return [...this.voices.keys()]
  }
}

export const ambientEngine = new AmbientEngine()
