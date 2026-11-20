import { blank, drums, tracks, type Project } from './engine.ts'

export function readProject(data: unknown): Project {
  const p = data as Project & { version?: number; pattern?: boolean[][]; name?: string }
  const grid = (value: unknown): value is boolean[][] => Array.isArray(value) &&
    value.length === drums.length && value.every(row => Array.isArray(row) && row.length === 16 && row.every(v => typeof v === 'boolean'))
  const number = (v: unknown, min: number, max: number) => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max
  if (!p || !number(p.bpm, 50, 180)) throw Error('Tempo invalide.')
  if (p.version === 1 && grid(p.pattern)) return {
    ...blank(), bpm: p.bpm, grid: p.pattern,
    clips: [{ id: crypto.randomUUID(), track: 0, start: 0, length: 4, name: p.name || 'Pattern V1', grid: p.pattern }],
  }
  if (!grid(p.grid) || !Array.isArray(p.mix) || p.mix.length !== tracks.length ||
      !p.mix.every(m => m && number(m.volume, 0, 1) && typeof m.mute === 'boolean') ||
      !Array.isArray(p.clips) || p.clips.length > 500 ||
      new Set(p.clips.map(c => c?.id)).size !== p.clips.length ||
      !p.clips.every(c => c && typeof c.id === 'string' && typeof c.name === 'string' &&
        Number.isInteger(c.track) && number(c.track, 0, tracks.length - 1) &&
        number(c.start, 0, 2048) && number(c.length, 0.01, 2048) &&
        (c.track === 0 ? grid(c.grid) : c.track === 1 ?
          Array.isArray(c.notes) && c.notes.every(n => n && number(n.pitch, 0, 127) && number(n.at, 0, 2048) && number(n.length, 0.01, 2048)) :
          typeof c.audio === 'string' && /^data:(audio\/|video\/|application\/octet-stream)/.test(c.audio)) &&
        (c.grid === undefined || (c.track === 0 && grid(c.grid))) &&
        (c.notes === undefined || c.track === 1) &&
        (c.audio === undefined || c.track >= 2))) throw Error('Projet BeatLab invalide.')
  return p
}

function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('beatlab-studio', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('projects')
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

export async function restore() {
  const db = await database()
  return new Promise<Project | undefined>((resolve, reject) => {
    const tx = db.transaction('projects')
    const request = tx.objectStore('projects').get('current')
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    tx.oncomplete = () => db.close()
    tx.onabort = () => db.close()
  })
}

export async function save(project: Project) {
  const db = await database()
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction('projects', 'readwrite')
    tx.objectStore('projects').put(project, 'current')
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onabort = () => { db.close(); reject(tx.error) }
  })
}

export function dataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => resolve(String(reader.result))
    reader.readAsDataURL(blob)
  })
}
