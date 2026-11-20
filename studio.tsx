import { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { blank, decode, drums, legacyDrums, endBeat, hit, note, schedule, secondsPerBeat, tracks, wav, type Clip, type Note, type Project } from './engine'
import { dataUrl, MAX_BEATS, MAX_CLIPS, readProject, restore, save } from './project'
import './studio.css'

const keys = ['Do', 'Do♯', 'Ré', 'Ré♯', 'Mi', 'Fa', 'Fa♯', 'Sol', 'Sol♯', 'La', 'La♯', 'Si']
const bar = 4
const maxMeasure = Math.floor(MAX_BEATS / bar) + 1
const pixel = 24
const makeId = () => crypto.randomUUID()
const roundBeat = (value: number) => Number(value.toFixed(2))
const message = (error: unknown) => error instanceof Error ? error.message : String(error)

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function Studio() {
  const [project, setProject] = useState(blank)
  const [ready, setReady] = useState(false)
  const [savePaused, setSavePaused] = useState(false)
  const [selected, setSelected] = useState<string>()
  const [measure, setMeasure] = useState(1)
  const [sound, setSound] = useState<NonNullable<Clip['sound']>>('piano')
  const [status, setStatus] = useState('')
  const [mode, setMode] = useState<'song' | 'pattern' | 'midi' | 'audio' | 'mix'>()
  const [head, setHead] = useState<number>()
  const [pressed, setPressed] = useState<number[]>([])
  const preview = useRef<AudioContext | null>(null)
  const playback = useRef<AudioContext | null>(null)
  const frame = useRef(0)
  const recorder = useRef<MediaRecorder | null>(null)
  const busy = useRef(false)
  const midi = useRef<{ context: AudioContext; at: number; start: number; seconds: number; sound: NonNullable<Clip['sound']>; notes: Note[]; active: Map<number, number> } | null>(null)
  const clip = project.clips.find(c => c.id === selected)
  const instruments = project.kit === 'v1' ? legacyDrums : drums
  const start = (measure - 1) * bar
  const measures = Math.max(8, measure + 1, Math.ceil(endBeat(project.clips) / bar) + 1)

  useEffect(() => {
    restore().then(value => { if (value) setProject(readProject(value)) })
      .catch(e => {
        setSavePaused(true)
        setStatus('Chargement local impossible. La sauvegarde précédente est protégée. ' + message(e))
      })
      .finally(() => setReady(true))
  }, [])
  useEffect(() => {
    if (ready && !savePaused) void save(project).catch(e => setStatus('Sauvegarde locale impossible. Exporte ton projet. ' + message(e)))
  }, [project, ready, savePaused])

  const update = (id: string, patch: Partial<Clip>) => setProject(p => ({
    ...p, clips: p.clips.map(c => c.id === id ? { ...c, ...patch } : c),
  }))
  const add = (value: Omit<Clip, 'id'>) => {
    if (project.clips.length >= MAX_CLIPS) throw Error('Le projet contient déjà 500 clips. Supprime un clip pour en ajouter un.')
    const id = makeId()
    setProject(p => p.clips.length >= MAX_CLIPS ? p : ({ ...p, clips: [...p.clips, { ...value, id }] }))
    setSelected(id)
  }
  const addPattern = () => add({ track: 0, start, length: 4, grid: project.grid, kit: project.kit, name: 'Pattern batterie' })
  const audioContext = () => preview.current ??= new AudioContext()
  async function audition(callback: (ctx: AudioContext) => void) {
    try {
      const ctx = audioContext()
      await ctx.resume()
      callback(ctx)
    } catch (e) { setStatus(message(e)) }
  }
  async function buffers(ctx: BaseAudioContext, song: Project) {
    const entries = await Promise.all(song.clips.filter(c => c.audio).map(async c => [c.id, await decode(ctx, c.audio!)] as const))
    return new Map(entries)
  }
  function stopPlayback() {
    cancelAnimationFrame(frame.current)
    if (playback.current) void playback.current.close()
    playback.current = null
    setHead(undefined)
  }
  async function play(song: Project, loop = false, offset = 0, onStart?: () => void) {
    const ctx = new AudioContext()
    playback.current = ctx
    try {
      await ctx.resume()
      const decoded = await buffers(ctx, song)
      if (playback.current !== ctx) return
      const seconds = secondsPerBeat(song.bpm)
      const end = endBeat(song.clips) - offset
      const origin = ctx.currentTime + (onStart ? 0.02 : 0.08)
      onStart?.()
      let next = origin
      const tick = () => {
        if (playback.current !== ctx) return
        const elapsed = Math.max(0, (ctx.currentTime - origin) / seconds)
        if (!loop && elapsed > end + 0.65) {
          stopPlayback()
          if (!recorder.current) { setMode(undefined); busy.current = false }
          return
        }
        if (loop && ctx.currentTime + 0.15 >= next) {
          const bus = schedule(ctx, song, next, decoded)
          const timer = window.setTimeout(() => bus.disconnect(), (end * seconds + 0.65) * 1000)
          ctx.addEventListener('statechange', () => { if (ctx.state === 'closed') clearTimeout(timer) })
          next += end * seconds
        }
        setHead(offset + (loop ? elapsed % end : elapsed))
        frame.current = requestAnimationFrame(tick)
      }
      if (!loop) schedule(ctx, song, origin, decoded, offset)
      tick()
      return { ctx, origin }
    } catch (e) { stopPlayback(); throw e }
  }
  const patternSong: Project = { ...project, clips: [{ id: 'preview', track: 0, start: 0, length: 4, grid: project.grid, kit: project.kit, name: 'Pattern' }] }
  async function run(kind: 'pattern' | 'song' | 'mix') {
    if (busy.current || (kind !== 'pattern' && !project.clips.length)) return
    busy.current = true
    setMode(kind)
    setStatus('')
    try {
      if (kind === 'mix') {
        const duration = endBeat(project.clips) * secondsPerBeat(project.bpm) + 0.5
        if (duration > 600) throw Error('L’export est limité à dix minutes.')
        const ctx = new OfflineAudioContext(2, Math.ceil(duration * 44100), 44100)
        schedule(ctx, project, 0, await buffers(ctx, project))
        download(wav(await ctx.startRendering()), 'beatlab-mix.wav')
        setStatus('Mix WAV exporté.')
      } else {
        await play(kind === 'pattern' ? patternSong : project, kind === 'pattern')
        return
      }
    } catch (e) { setStatus(message(e)) }
    busy.current = false
    setMode(undefined)
  }

  async function importAudio(file: Blob, track: number, position: number, name: string, bpm = project.bpm) {
    if (file.size > 100 * 1024 * 1024) throw Error('Ce fichier dépasse 100 Mo.')
    const url = await dataUrl(file.type ? file : new Blob([file], { type: 'application/octet-stream' }))
    const buffer = await decode(audioContext(), url)
    const length = Math.max(0.01, roundBeat(buffer.duration / secondsPerBeat(bpm)))
    if (length > MAX_BEATS) throw Error('Cet audio dépasse la durée maximale d’un clip à ce tempo.')
    add({ track, start: position, length, name, audio: url })
  }
  async function capture(track: number) {
    if (busy.current) return
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setStatus('Pour activer le micro, ouvre BeatLab en HTTPS ou sur localhost dans un navigateur compatible.')
      return
    }
    busy.current = true
    setMode('audio')
    setStatus('Autorise le microphone pour démarrer.')
    let stream: MediaStream | undefined
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } })
      const input = stream
      const take = new MediaRecorder(input)
      recorder.current = take
      const chunks: Blob[] = []
      let failed = false
      const finish = () => {
        recorder.current = null
        input.getTracks().forEach(t => t.stop())
        stopPlayback()
        busy.current = false
        setMode(undefined)
      }
      take.ondataavailable = event => { if (event.data.size) chunks.push(event.data) }
      take.onerror = () => { failed = true; finish(); setStatus('Le microphone a interrompu la prise.') }
      take.onstop = async () => {
        input.getTracks().forEach(t => t.stop())
        stopPlayback()
        try {
          if (!failed && chunks.length) {
            await importAudio(new Blob(chunks, { type: take.mimeType }), track, start, 'Prise ' + tracks[track].toLowerCase())
            setStatus('Prise ajoutée à la timeline.')
          }
        } catch (e) { setStatus(message(e)) }
        finally { finish() }
      }
      const begin = () => {
        take.start(250)
        setStatus('Enregistrement en cours.')
      }
      if (endBeat(project.clips) > start) await play(project, false, start, begin)
      else begin()
    } catch (e) {
      if (recorder.current?.state === 'recording') recorder.current.stop()
      else {
        stream?.getTracks().forEach(t => t.stop())
        recorder.current = null
        busy.current = false
        setMode(undefined)
      }
      setStatus(message(e))
    }
  }
  async function recordMidi() {
    if (busy.current) return
    busy.current = true
    try {
      const ctx = audioContext()
      await ctx.resume()
      midi.current = { context: ctx, at: ctx.currentTime, start, seconds: secondsPerBeat(project.bpm), sound, notes: [], active: new Map() }
      setMode('midi')
      setStatus('Joue sur le clavier pour enregistrer les notes.')
    } catch (e) { busy.current = false; setStatus(message(e)) }
  }
  function finishNote(pitch: number) {
    const take = midi.current
    const at = take?.active.get(pitch)
    if (!take || at === undefined) return
    take.active.delete(pitch)
    const end = Math.min(MAX_BEATS, (take.context.currentTime - take.at) / take.seconds)
    take.notes.push({ pitch, at, length: Math.max(0.08, roundBeat(end - at)) })
  }
  function stop() {
    if (recorder.current) {
      if (recorder.current.state === 'recording') recorder.current.stop()
      return
    }
    const take = midi.current
    if (take) {
      take.active.forEach((_, pitch) => finishNote(pitch))
      midi.current = null
      if (take.notes.length) {
        add({ track: 1, start: take.start, length: Math.max(...take.notes.map(n => roundBeat(n.at + n.length))), name: take.sound === 'piano' ? 'Piano' : 'Synthé', notes: take.notes, sound: take.sound })
        setStatus('Notes ajoutées à la timeline.')
      }
    }
    stopPlayback()
    busy.current = false
    setMode(undefined)
  }
  function press(pitch: number) {
    const take = midi.current
    const beat = take ? roundBeat((take.context.currentTime - take.at) / take.seconds) : 0
    if (take && beat <= MAX_BEATS - 0.08 && !take.active.has(pitch)) take.active.set(pitch, beat)
    setPressed(items => items.includes(pitch) ? items : [...items, pitch])
    void audition(ctx => note(ctx, ctx.destination, pitch, ctx.currentTime, 0.42, take?.sound ?? sound))
  }
  function release(pitch: number) {
    finishNote(pitch)
    setPressed(items => items.filter(n => n !== pitch))
  }
  const setMix = (track: number, patch: Partial<Project['mix'][number]>) => setProject(p => ({
    ...p, mix: p.mix.map((m, i) => i === track ? { ...m, ...patch } : m),
  }))
  return <main>
    <header><div><p className="eyebrow">STUDIO MUSICAL</p><h1>BeatLab<span>.</span></h1></div>
      <div className="actions"><a href="./v1/">Ouvrir la V1</a>
        <label className="file">Importer un projet<input disabled={!ready || !!mode} type="file" accept=".json" onChange={async e => {
          const file = e.currentTarget.files?.[0]
          e.currentTarget.value = ''
          if (file) try { setProject(readProject(JSON.parse(await file.text()))); setSelected(undefined); setStatus('Projet chargé.') } catch (error) { setStatus(message(error)) }
        }} /></label>
        <button disabled={!ready} onClick={() => download(new Blob([JSON.stringify(project)], { type: 'application/json' }), 'beatlab-projet.json')}>Exporter le projet</button>
      </div></header>
    <div className="transport">
      <button className="primary" disabled={!ready || !!mode || !project.clips.length} onClick={() => void run('song')}>▶ Lire le morceau</button>
      <button disabled={!mode || mode === 'mix'} onClick={stop}>■ Arrêter</button>
      <label>Tempo <input type="number" value={project.bpm} min={50} max={180} disabled={!!mode} onChange={e => {
        const value = e.currentTarget.valueAsNumber
        if (value >= 50 && value <= 180) setProject(p => ({ ...p, bpm: value }))
      }} /> BPM</label>
      <button disabled={!ready || !!mode || !project.clips.length} onClick={() => void run('mix')}>Exporter le mix WAV</button>
    </div>
    <p className="status" role="status">{status || (ready ? savePaused ? 'Sauvegarde automatique en pause.' : 'Projet sauvegardé sur cet appareil' : 'Chargement…')}</p>
    {savePaused && <div className="actions">
      <span>La copie précédente est conservée. Tu peux exporter le projet actuel séparément.</span>
      <button disabled={!!mode} onClick={() => {
        if (!window.confirm('Remplacer la sauvegarde locale précédente par le projet affiché ?')) return
        setStatus('')
        setSavePaused(false)
      }}>Remplacer la sauvegarde locale</button>
    </div>}
    <fieldset disabled={!ready || !!mode} className="workspace">
      <legend>Arrangement</legend>
      <div className="actions arrangement">
        <label>Mesure d’insertion <input type="number" min={1} max={maxMeasure} value={measure} onChange={e => setMeasure(Math.max(1, Math.min(maxMeasure, Math.floor(e.currentTarget.valueAsNumber || 1))))}/></label>
        <button disabled={project.clips.length >= MAX_CLIPS} onClick={addPattern}>＋ Ajouter le pattern batterie</button>
      </div>
      <div className="timeline">
        <div className="track-labels"><div className="ruler">Pistes</div>{tracks.map((name, i) => <div key={name} className="track-label">
          <strong>{name}</strong>
          <div><input aria-label={'Volume ' + name} type="range" min={0} max={1} step={0.01} value={project.mix[i].volume} onChange={e => setMix(i, { volume: e.currentTarget.valueAsNumber })} />
          <button className="mute" aria-pressed={project.mix[i].mute} onClick={() => setMix(i, { mute: !project.mix[i].mute })}>{project.mix[i].mute ? 'Muet' : 'Son'}</button></div>
        </div>)}</div>
        <div className="scroll"><div className="lanes" style={{ width: measures * pixel * bar }}>
          <div className="ruler">{Array.from({ length: measures }, (_, i) => <button key={i} disabled={i * bar > MAX_BEATS} aria-pressed={measure === i + 1} onClick={() => setMeasure(i + 1)}>{i + 1}</button>)}</div>
          {tracks.map((name, i) => <div key={name} className={'lane lane-' + i} onDragOver={e => e.preventDefault()} onDrop={e => {
            const dropped = project.clips.find(c => c.id === e.dataTransfer.getData('text/plain'))
            if (dropped?.track === i) update(dropped.id, { start: Math.max(0, Math.min(MAX_BEATS, Math.round((e.clientX - e.currentTarget.getBoundingClientRect().left) / pixel))) })
          }}>{project.clips.filter(c => c.track === i).map(c => <button type="button" key={c.id} draggable
            onDragStart={e => e.dataTransfer.setData('text/plain', c.id)}
            title={c.name} aria-pressed={selected === c.id} className="clip" onClick={() => setSelected(c.id)}
            style={{ left: c.start * pixel, width: Math.max(22, c.length * pixel) }}>{c.name}</button>)}</div>)}
          {head !== undefined && <div className="playhead" style={{ left: head * pixel }} />}
        </div></div>
      </div>
      {clip && <div className="actions inspector">
        <strong>{clip.name}</strong>
        <label>Début (temps) <input type="number" key={clip.id + ':start:' + clip.start} defaultValue={clip.start} min={0} max={MAX_BEATS} step={0.25} onBlur={e => {
          const v = e.currentTarget.valueAsNumber
          if (Number.isFinite(v)) update(clip.id, { start: Math.max(0, Math.min(MAX_BEATS, v)) })
        }} /></label>
        <label>Durée (temps) <input type="number" key={clip.id + ':length:' + clip.length} defaultValue={clip.length} min={0.01} max={MAX_BEATS} step={0.25} onBlur={e => {
          const v = e.currentTarget.valueAsNumber
          if (Number.isFinite(v)) update(clip.id, { length: Math.max(0.01, Math.min(MAX_BEATS, v)) })
        }} /></label>
        {clip.grid && <><button onClick={() => update(clip.id, { length: Math.min(MAX_BEATS, clip.length + 4) })}>＋ Répéter 1 mesure</button>
          <button onClick={() => setProject(p => ({ ...p, grid: clip.grid!, kit: clip.kit }))}>Ouvrir dans le séquenceur</button>
          <button onClick={() => update(clip.id, { grid: project.grid, kit: project.kit })}>Appliquer la grille au clip</button></>}
        <button disabled={project.clips.length >= MAX_CLIPS} onClick={() => add({ ...clip, start: Math.min(MAX_BEATS, clip.start + clip.length) })}>Dupliquer</button>
        <button className="danger" onClick={() => { setProject(p => ({ ...p, clips: p.clips.filter(c => c.id !== clip.id) })); setSelected(undefined) }}>Supprimer</button>
      </div>}
    </fieldset>
    <div className="editors">
      <section><h2>Batterie</h2><div className="actions"><button disabled={!ready || !!mode} onClick={() => void run('pattern')}>▶ Boucler le pattern</button>
        <button disabled={!ready || !!mode} onClick={() => setProject(p => ({ ...p, grid: p.grid.map(r => r.map(() => false)) }))}>Vider la grille</button></div>
        <div className="drums">{instruments.map((name, row) => <div className="drum-row" key={name}>
          <button className="pad" onClick={() => void audition(ctx => hit(ctx, ctx.destination, row, ctx.currentTime, project.kit))}>{name}</button>
          {project.grid[row].map((on, step) => <button key={step} disabled={!ready || !!mode} className={'step ' + (step % 4 === 0 ? 'downbeat' : '')}
            aria-label={name + ' pas ' + (step + 1)} aria-pressed={on} data-playing={mode === 'pattern' && head !== undefined && Math.floor(head * 4) === step}
            onClick={() => setProject(p => ({ ...p, grid: p.grid.map((r, ri) => ri === row ? r.map((v, si) => si === step ? !v : v) : r) }))}/>)}
        </div>)}</div>
      </section>
      <section><h2>Clavier</h2>
        <div className="actions"><label>Son <select value={sound} disabled={!!mode} onChange={e => setSound(e.currentTarget.value as typeof sound)}><option value="piano">Piano</option><option value="synthé">Synthé</option></select></label>
          <button disabled={!ready || !!mode || project.clips.length >= MAX_CLIPS} onClick={() => void recordMidi()}>● Enregistrer les notes</button></div>
        <div className="keyboard">{keys.map((name, index) => {
          const pitch = 60 + index
          return <button key={name} className={name.includes('♯') ? 'black-key' : 'white-key'} aria-pressed={pressed.includes(pitch)}
            onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); press(pitch) }}
            onPointerUp={() => release(pitch)} onLostPointerCapture={() => release(pitch)}
            onKeyDown={e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); press(pitch) } }}
            onKeyUp={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); release(pitch) } }} >{name}</button>
        })}</div>
        <h2>Guitare et voix</h2>
        {[2, 3].map(track => <div className="actions audio-actions" key={track}><strong>{tracks[track]}</strong>
          <button disabled={!ready || !!mode || project.clips.length >= MAX_CLIPS} onClick={() => void capture(track)}>● Enregistrer</button>
          <label className="file">Importer un audio<input disabled={!ready || !!mode || project.clips.length >= MAX_CLIPS} type="file" accept="audio/*,.webm,.m4a" onChange={async e => {
            const file = e.currentTarget.files?.[0]
            e.currentTarget.value = ''
            if (file) try { await importAudio(file, track, start, file.name); setStatus('Audio ajouté.') } catch (error) { setStatus(message(error)) }
          }} /></label>
        </div>)}
      </section>
    </div>
  </main>
}

createRoot(document.getElementById('root')!).render(<Studio />)
