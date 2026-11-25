import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { setTimeout as delay } from 'node:timers/promises'

const mimeTypes = {
  html: 'text/html; charset=utf-8',
  js: 'text/javascript',
  css: 'text/css',
}

async function verify(input) {
  const root = new URL(input)
  if (!root.pathname.endsWith('/')) root.pathname += '/'
  async function get(url, type) {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000), cache: 'no-store' })
    assert.equal(response.status, 200, String(url))
    assert.match(response.headers.get('content-type') ?? '', type, String(url))
    return response
  }

  const page = await get(root, /^text\/html\b/)
  assert.equal(new URL(page.url).protocol, root.protocol)
  const html = await page.text()
  assert.match(html, /<title>BeatLab Studio<\/title>/)
  const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map(match => match[1])
  const styles = [...html.matchAll(/<link\b[^>]*\bhref="([^"]+\.css)"/g)].map(match => match[1])
  assert.ok(scripts.length && styles.length, 'Scripts ou feuilles de style manquants')
  for (const [paths, type] of [[scripts, /javascript/], [styles, /^text\/css\b/]]) {
    for (const path of paths) {
      const asset = new URL(path, root)
      assert.equal(asset.origin, root.origin)
      assert.ok(asset.pathname.startsWith(root.pathname), `Ressource hors de ${root.pathname} : ${asset.pathname}`)
      const response = await get(asset, type)
      assert.ok((await response.arrayBuffer()).byteLength > 0)
    }
  }
  const previousVersion = await get(new URL('v1/', root), /^text\/html\b/)
  assert.match(await previousVersion.text(), /V1\.1/)
  console.log(`BeatLab, JavaScript, CSS et V1.1 vérifiés sur ${root.href}`)
}

const target = process.argv[2]
if (target === '--local') {
  const server = createServer(async (request, response) => {
    const path = request.url.slice('/beatlab/'.length)
    if (!request.url.startsWith('/beatlab/') || !/^[\w./-]*$/.test(path) || path.includes('..')) {
      response.writeHead(404).end()
      return
    }
    const file = !path || path.endsWith('/') ? path + 'index.html' : path
    try {
      const content = await readFile(new URL('../dist/' + file, import.meta.url))
      response.setHeader('Content-Type', mimeTypes[file.split('.').at(-1)] ?? 'application/octet-stream')
      response.end(content)
    } catch {
      response.writeHead(404).end()
    }
  })
  try {
    await new Promise((resolve, reject) => {
      server.once('error', reject)
      server.listen(0, '127.0.0.1', resolve)
    })
    await verify(`http://127.0.0.1:${server.address().port}/beatlab/`)
  } finally {
    server.close()
  }
} else {
  assert.equal(new URL(target).protocol, 'https:', 'Le site publié doit utiliser HTTPS')
  for (let attempt = 0; ; attempt++) {
    try {
      await verify(target)
      break
    } catch (error) {
      if (attempt === 7) throw error
      await delay(5000)
    }
  }
}
