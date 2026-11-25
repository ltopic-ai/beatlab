import test from 'node:test'
import assert from 'node:assert/strict'
import { blank, drums, endBeat, hit, legacyDrums, schedule, secondsPerBeat, wav } from './engine.ts'
import { MAX_BEATS, MAX_CLIPS, readProject, save } from './project.ts'

test('la grille compte huit instruments et seize pas et importe le format V1', () => {
  const pattern = blank().grid
  assert.equal(pattern.length, drums.length)
  assert.ok(pattern.every(row => row.length === 16))
  const project = readProject({ version: 1, name: 'Rythme', bpm: 120, pattern })
  assert.equal(secondsPerBeat(project.bpm), 0.5)
  assert.equal(endBeat(project.clips), 4)
  assert.deepEqual(project.clips[0].grid, pattern)
  assert.equal(project.kit, 'v1')
  assert.equal(project.clips[0].kit, 'v1')
  assert.equal(readProject(JSON.parse(JSON.stringify(project))).clips[0].kit, 'v1')
  assert.throws(() => readProject({ ...project, clips: [project.clips[0], project.clips[0]] }))
  assert.throws(() => readProject({ ...project, mix: [{ volume: 1 }] }))
})

test('les huit rangées V1 déclenchent les sons historiques', () => {
  const tones = []
  const filters = []
  const node = { connect: () => node }
  const param = { setValueAtTime() {}, exponentialRampToValueAtTime() {} }
  const ctx = {
    sampleRate: 1000,
    createGain: () => ({ ...node, gain: { ...param } }),
    createOscillator: () => ({
      ...node, frequency: { ...param, setValueAtTime: hz => tones.push(hz) }, start() {}, stop() {},
    }),
    createBuffer: (_, length) => ({ getChannelData: () => new Float32Array(length) }),
    createBufferSource: () => ({ ...node, start() {} }),
    createBiquadFilter: () => ({ ...node, frequency: { set value(hz) { filters.push(hz) } } }),
  }
  assert.equal(legacyDrums.length, 8)
  const expected = [
    [[150], []], [[185], [1300]], [[], [6800]], [[], [1900, 1900, 1900]],
    [[82], []], [[830, 1245], []], [[220], []], [[], [5800]],
  ]
  legacyDrums.forEach((_, i) => {
    hit(ctx, node, i, 0, 'v1')
    assert.deepEqual([tones.splice(0), filters.splice(0)], expected[i])
  })
})

test('un projet hors limites est refusé avant toute écriture locale', async () => {
  const p = blank()
  p.clips = Array.from({ length: MAX_CLIPS }, (_, i) => ({
    id: String(i), track: 0, start: MAX_BEATS, length: 4, name: 'Pattern', grid: p.grid,
  }))
  assert.equal(readProject(p).clips.length, MAX_CLIPS)
  await assert.rejects(save({ ...p, clips: [...p.clips, { ...p.clips[0], id: 'extra' }] }), /Projet BeatLab invalide/)
  p.clips[0].start++
  await assert.rejects(save(p), /Projet BeatLab invalide/)
})

test('la reprise en cours de clip conserve la position audio et le mute', () => {
  const plays = []
  const gains = []
  const ctx = {
    createDynamicsCompressor: () => ({ connect() {} }),
    createGain: () => { const gain = { value: 1 }; gains.push(gain); return { gain, connect() {} } },
    createBufferSource: () => ({ connect() {}, start(...args) { plays.push(args) } }),
  }
  const p = blank()
  p.bpm = 120
  p.mix[2].mute = true
  p.clips = [{ id: 'a', track: 2, start: 2, length: 8, name: 'Guitare', audio: 'test' }]
  schedule(ctx, p, 10, new Map([['a', { duration: 3.5 }]]), 4)
  assert.deepEqual(plays, [[10, 1, 2.5]])
  assert.equal(gains[2].value, 0)
})

test('le WAV contient un en-tête PCM stéréo et des échantillons entrelacés', async () => {
  const buffer = {
    numberOfChannels: 2, length: 2, sampleRate: 44100,
    getChannelData: c => c ? [-1, 1] : [0, 0.5],
  }
  const blob = wav(buffer)
  const bytes = await blob.arrayBuffer()
  const view = new DataView(bytes)
  assert.equal(blob.type, 'audio/wav')
  assert.equal(new TextDecoder().decode(bytes.slice(0, 4)), 'RIFF')
  assert.equal(view.getUint16(22, true), 2)
  assert.equal(view.getUint32(24, true), 44100)
  assert.equal(view.getUint32(40, true), 8)
  assert.deepEqual([44, 46, 48, 50].map(i => view.getInt16(i, true)), [0, -32767, 16383, 32767])
})
