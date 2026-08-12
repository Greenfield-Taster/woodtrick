/*
 * The noises a piece makes, synthesised rather than downloaded. A wooden clack
 * is a short pitched knock plus a scrape of noise, and building it from an
 * oscillator costs a few lines where an audio file would cost a request, a
 * format decision and a licence.
 */

let context: AudioContext | null = null
let muted = false

function ac(): AudioContext | null {
  if (muted) return null
  if (!context) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    context = new Ctor()
  }
  if (context.state === 'suspended') void context.resume()
  return context
}

export function setMuted(value: boolean) {
  muted = value
}

export function isMuted() {
  return muted
}

/* Browsers only allow audio to start inside a gesture, so the board opens one. */
export function primeAudio() {
  ac()
}

function noiseBuffer(ctx: AudioContext, seconds: number) {
  const frames = Math.max(1, Math.floor(ctx.sampleRate * seconds))
  const buffer = ctx.createBuffer(1, frames, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < frames; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / frames)
  }
  return buffer
}

/* Two pieces taking hold of each other. `size` grows the knock as the group does. */
export function playSnap(size = 1) {
  const ctx = ac()
  if (!ctx) return

  const now = ctx.currentTime
  const gain = ctx.createGain()
  gain.connect(ctx.destination)
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(0.22, now + 0.004)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12)

  const knock = ctx.createOscillator()
  knock.type = 'triangle'
  const pitch = 320 / Math.min(3, Math.max(1, size) ** 0.32)
  knock.frequency.setValueAtTime(pitch, now)
  knock.frequency.exponentialRampToValueAtTime(pitch * 0.45, now + 0.09)
  knock.connect(gain)
  knock.start(now)
  knock.stop(now + 0.14)

  const scrape = ctx.createBufferSource()
  scrape.buffer = noiseBuffer(ctx, 0.05)
  const band = ctx.createBiquadFilter()
  band.type = 'bandpass'
  band.frequency.value = 2100
  band.Q.value = 0.9
  const scrapeGain = ctx.createGain()
  scrapeGain.gain.value = 0.1
  scrape.connect(band).connect(scrapeGain).connect(ctx.destination)
  scrape.start(now)
}

/* A piece leaving the table. Quieter than a snap — it is feedback, not an event. */
export function playPick() {
  const ctx = ac()
  if (!ctx) return

  const now = ctx.currentTime
  const gain = ctx.createGain()
  gain.connect(ctx.destination)
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(0.05, now + 0.005)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07)

  const osc = ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(540, now)
  osc.connect(gain)
  osc.start(now)
  osc.stop(now + 0.08)
}

/* The last piece. A short major arpeggio, over before it can outstay itself. */
export function playFinish() {
  const ctx = ac()
  if (!ctx) return

  const now = ctx.currentTime
  const notes = [523.25, 659.25, 783.99, 1046.5]

  notes.forEach((frequency, i) => {
    const at = now + i * 0.09
    const gain = ctx.createGain()
    gain.connect(ctx.destination)
    gain.gain.setValueAtTime(0.0001, at)
    gain.gain.exponentialRampToValueAtTime(0.16, at + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.5)

    const osc = ctx.createOscillator()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(frequency, at)
    osc.connect(gain)
    osc.start(at)
    osc.stop(at + 0.55)
  })
}
