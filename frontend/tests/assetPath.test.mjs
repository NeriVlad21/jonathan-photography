// Regression tests for portfolio image URLs and the Portfolio intro layering.
// Run with `npm test` (Node's built-in test runner, no extra dependencies).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { resolveAssetUrl, resolveBackendBase } from '../src/utils/assetPath.js'

const src = new URL('../src/', import.meta.url).pathname
const read = (relative) => readFileSync(join(src, relative), 'utf8')

test('upload paths map to the same-host backend in production', () => {
  assert.equal(resolveAssetUrl('/uploads/portfolio/a.jpg', '/backend'), '/backend/uploads/portfolio/a.jpg')
  assert.equal(resolveAssetUrl('uploads/portfolio/a.jpg', '/backend'), '/backend/uploads/portfolio/a.jpg')
})

test('already backend-prefixed paths are not doubled', () => {
  assert.equal(resolveAssetUrl('/backend/uploads/portfolio/a.jpg', '/backend'), '/backend/uploads/portfolio/a.jpg')
  assert.equal(resolveAssetUrl('/backend/uploads/a.jpg', 'https://site.test/backend/'), 'https://site.test/backend/uploads/a.jpg')
  assert.equal(resolveAssetUrl('/backend-old/a.jpg', '/backend'), '/backend/backend-old/a.jpg')
})

test('absolute, data, blob, empty and demo paths', () => {
  assert.equal(resolveAssetUrl('https://cdn.test/a.jpg', '/backend'), 'https://cdn.test/a.jpg')
  assert.equal(resolveAssetUrl('//cdn.test/a.jpg', '/backend'), '//cdn.test/a.jpg')
  assert.equal(resolveAssetUrl('data:image/png;base64,AA', '/backend'), 'data:image/png;base64,AA')
  assert.equal(resolveAssetUrl('blob:https://site.test/1', '/backend'), 'blob:https://site.test/1')
  assert.equal(resolveAssetUrl('', '/backend'), '')
  assert.equal(resolveAssetUrl(null, '/backend'), '')
  assert.equal(resolveAssetUrl('  ', '/backend'), '')
  assert.equal(resolveAssetUrl('/demo/portfolio/a.jpg', '/backend'), '')
})

test('production never points visitors at a localhost backend', () => {
  const local = 'http://localhost/jonathan-photography/backend'
  assert.equal(resolveBackendBase({ backendUrl: local, dev: false, pageHostname: 'jonathanphotography.page.gd' }), '/backend')
  assert.equal(resolveBackendBase({ backendUrl: 'http://127.0.0.1:8000', dev: false, pageHostname: 'example.com' }), '/backend')
  // Serving a production build from localhost may still use a localhost backend.
  assert.equal(resolveBackendBase({ backendUrl: local, dev: false, pageHostname: 'localhost' }), local)
  assert.equal(resolveBackendBase({ backendUrl: local, dev: true }), local)
})

test('backend base precedence: explicit, then API-derived, then default', () => {
  assert.equal(resolveBackendBase({ backendUrl: 'https://site.test/backend/', apiUrl: 'https://x.test/api' }), 'https://site.test/backend')
  assert.equal(resolveBackendBase({ apiUrl: 'https://api.site.test/api/' }), 'https://api.site.test')
  assert.equal(resolveBackendBase({ apiUrl: '/backend/api' }), '/backend')
  assert.equal(resolveBackendBase({}), '/backend')
})

test('production builds do not inherit development env values', () => {
  const root = new URL('../', import.meta.url).pathname
  const envFiles = readdirSync(root).filter((name) => name === '.env' || name === '.env.production')
  for (const name of envFiles) {
    assert.doesNotMatch(readFileSync(join(root, name), 'utf8'), /^\s*VITE_(BACKEND|API)_URL\s*=\s*\S*localhost/m,
      `${name} would bake a localhost backend into production builds`)
  }
})

test('pages render portfolio images through the shared helper', () => {
  const files = []
  const walk = (dir) => readdirSync(dir).forEach((name) => {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) walk(full)
    else if (name.endsWith('.jsx')) files.push(full)
  })
  walk(src)
  for (const file of files) {
    const code = readFileSync(file, 'utf8')
    // <img src={x.image_path}> bypasses the helper; EditorialImage resolves its own src.
    const raw = [...code.matchAll(/<img[^>]*\ssrc=\{\s*[\w.?]*(?:image_path|cover_image)\s*\}/g)]
    assert.equal(raw.length, 0, `${file.replace(src, '')} renders an upload path without assetUrl()`)
  }
  assert.match(read('pages/Home.jsx'), /src=\{assetUrl\(c\.cover\.image_path\)\}/)
  assert.match(read('pages/Portfolio.jsx'), /src=\{assetUrl\(image\.image_path\)\}/)
  assert.match(read('components/EditorialImage.jsx'), /src=\{imageUrl\(src\)\}/)
  assert.match(read('utils/format.js'), /export function imageUrl\(path\) \{\s*return assetUrl\(path\)/)
})

test('Portfolio intro layers: placeholder < image < shade < copy', () => {
  const css = read('styles/public.css')
  // Last plain rule whose selector list names the class and sets z-index (cascade order).
  const rules = css.split('}').map((chunk) => {
    const open = chunk.lastIndexOf('{')
    return open < 0 ? null : { selectors: chunk.slice(0, open).split(',').map((part) => part.trim()), body: chunk.slice(open + 1) }
  }).filter(Boolean)
  const z = (selector) => {
    const values = rules.filter((rule) => rule.selectors.includes(selector))
      .map((rule) => /z-index:\s*(-?\d+)/.exec(rule.body)).filter(Boolean)
    assert.ok(values.length, `${selector} has no z-index`)
    return Number(values.at(-1)[1])
  }
  const order = ['.work-intro__placeholder', '.work-intro__image', '.work-intro__shade', '.work-intro__copy'].map(z)
  assert.deepEqual([...order].sort((a, b) => a - b), order, `unexpected order ${order.join(' < ')}`)
  assert.equal(new Set(order).size, order.length, 'layers must not share a z-index')
  assert.match(css, /\.work-intro__image,\s*\.work-intro__placeholder\s*\{[^}]*position:\s*absolute/)
})
