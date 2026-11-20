export const drums = ['Kick', 'Snare', 'Clap', 'Hi-hat', 'Open hat', 'Tom', 'Rim', 'Shaker']
export const tracks = ['Batterie', 'Clavier', 'Guitare', 'Voix'] as const
export type Note = { pitch: number; at: number; length: number }
export type Clip = { id: string; track: number; start: number; length: number; name: string; grid?: boolean[][]; notes?: Note[]; sound?: 'piano' | 'synthé'; audio?: string }
export type Project = { bpm: number; grid: boolean[][]; clips: Clip[]; mix: { volume: number; mute: boolean }[] }
export const blank = (): Project => ({
  bpm: 90,
  grid: drums.map((_, row) => Array.from({ length: 16 }, (_, i) =>
    row === 0 ? [0, 6, 10].includes(i) : row === 1 ? i === 4 || i === 12 : row === 3 && i % 2 === 0)),
  clips: [],
  mix: tracks.map(() => ({ volume: 0.8, mute: false })),
})
export const secondsPerBeat = (bpm: number) => 60 / bpm
export const endBeat = (clips: Clip[]) => Math.max(0, ...clips.map(c => c.start + c.length))

export function tone(ctx: BaseAudioContext, out: AudioNode, at: number, freq: number, length: number, type: OscillatorType, level: number, drop = 1) {
  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()
  oscillator.type = type
  oscillator.frequency.setValueAtTime(freq, at)
  oscillator.frequency.exponentialRampToValueAtTime(freq * drop, at + length)
  gain.gain.setValueAtTime(0.0001, at)
  gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, level), at + Math.min(0.008, length / 4))
  gain.gain.exponentialRampToValueAtTime(0.0001, at + length)
  oscillator.connect(gain).connect(out)
  oscillator.start(at)
  oscillator.stop(at + length)
}

export function hit(ctx: BaseAudioContext, out: AudioNode, row: number, at: number) {
  if (row === 0 || row === 5 || row === 6) {
    tone(ctx, out, at, [140, 0, 0, 0, 0, 220, 850][row], row === 0 ? 0.28 : 0.12, row === 6 ? 'triangle' : 'sine', row === 0 ? 0.9 : 0.4, 0.3)
    return
  }
  const length = [0, 0.18, 0.13, 0.05, 0.28, 0, 0, 0.08][row]
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * length), ctx.sampleRate)
  const samples = buffer.getChannelData(0)
  let seed = 103 + row
  for (let i = 0; i < samples.length; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    samples[i] = (seed / 2147483648 - 1) * Math.exp(-6 * i / samples.length)
  }
  const source = ctx.createBufferSource()
  const filter = ctx.createBiquadFilter()
  const gain = ctx.createGain()
  source.buffer = buffer
  filter.type = 'highpass'
  filter.frequency.value = row < 3 ? 950 : 6200
  gain.gain.value = row < 3 ? 0.55 : 0.29
  source.connect(filter).connect(gain).connect(out)
  source.start(at)
}

export function note(ctx: BaseAudioContext, out: AudioNode, pitch: number, at: number, duration: number, sound?: Clip['sound']) {
  const hz = 440 * 2 ** ((pitch - 69) / 12)
  tone(ctx, out, at, hz, duration, sound === 'synthé' ? 'sawtooth' : 'triangle', 0.16)
  if (sound !== 'synthé') tone(ctx, out, at, hz * 2, duration * 0.6, 'sine', 0.07)
}

export async function decode(ctx: BaseAudioContext, url: string) {
  if (!url.startsWith('data:audio/') && !url.startsWith('data:application/octet-stream') && !url.startsWith('data:video/')) throw new Error('Format audio invalide.')
  return ctx.decodeAudioData(await (await fetch(url)).arrayBuffer())
}

export function schedule(ctx: BaseAudioContext, project: Project, at: number, buffers: Map<string, AudioBuffer>, from = 0) {
  const bus = ctx.createDynamicsCompressor()
  bus.connect(ctx.destination)
  const outputs = project.mix.map(m => {
    const gain = ctx.createGain()
    gain.gain.value = m.mute ? 0 : m.volume
    gain.connect(bus)
    return gain
  })
  const beat = secondsPerBeat(project.bpm)
  for (const clip of project.clips) {
    const out = outputs[clip.track]
    const skip = Math.max(0, from - clip.start)
    if (skip >= clip.length) continue
    const start = at + (clip.start - from) * beat
    if (clip.grid) {
      for (let i = Math.ceil(skip * 4); i < clip.length * 4; i++) {
        clip.grid.forEach((row, index) => {
          if (row[i % 16]) hit(ctx, out, index, start + i * beat / 4)
        })
      }
    }
    for (const n of clip.notes ?? []) {
      const onset = Math.max(n.at, skip)
      const end = Math.min(n.at + n.length, clip.length)
      if (end > onset) note(ctx, out, n.pitch, start + onset * beat, (end - onset) * beat, clip.sound)
    }
    if (clip.audio) {
      const buffer = buffers.get(clip.id)
      if (!buffer) throw new Error('Clip audio introuvable.')
      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.connect(out)
      const offset = skip * beat
      const duration = Math.min(buffer.duration - offset, (clip.length - skip) * beat)
      if (duration > 0) source.start(Math.max(at, start), offset, duration)
    }
  }
  return bus
}

export function wav(buffer: AudioBuffer) {
  const channels = buffer.numberOfChannels
  const bytes = new ArrayBuffer(44 + buffer.length * channels * 2)
  const view = new DataView(bytes)
  const label = (offset: number, value: string) => [...value].forEach((c, i) => view.setUint8(offset + i, c.charCodeAt(0)))
  label(0, 'RIFF')
  view.setUint32(4, bytes.byteLength - 8, true)
  label(8, 'WAVEfmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, channels, true)
  view.setUint32(24, buffer.sampleRate, true)
  view.setUint32(28, buffer.sampleRate * channels * 2, true)
  view.setUint16(32, channels * 2, true)
  view.setUint16(34, 16, true)
  label(36, 'data')
  view.setUint32(40, bytes.byteLength - 44, true)
  for (let ch = 0; ch < channels; ch++) {
    const samples = buffer.getChannelData(ch)
    for (let i = 0; i < samples.length; i++) {
      view.setInt16(44 + (i * channels + ch) * 2, Math.max(-1, Math.min(1, samples[i])) * 32767, true)
    }
  }
  return new Blob([bytes], { type: 'audio/wav' })
}
