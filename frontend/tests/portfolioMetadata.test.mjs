import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { pickPortfolioCover } from '../src/utils/portfolioCover.js'

const readSource = (path) => readFile(new URL(path, import.meta.url), 'utf8')

test('portfolio uploads send each photo title and description and retain failed files for retry', async () => {
  const manager = await readSource('../src/admin/PortfolioManager.jsx')

  assert.match(manager, /formData\.append\('title', item\.title\.trim\(\)\)/)
  assert.match(manager, /formData\.append\('caption', item\.caption\.trim\(\)\)/)
  assert.match(manager, /What is happening in this photo\? <span>\(required\)<\/span>/)
  assert.match(manager, /setUploadQueue\(\(current\) => current\.filter\(\(queued\) => queued\.id !== item\.id\)\)/)
  assert.match(manager, /Failed files remain in the queue/)
})

test('admins can add missing photo descriptions and public portfolio views render them', async () => {
  const manager = await readSource('../src/admin/PortfolioManager.jsx')
  const category = await readSource('../src/pages/PortfolioCategory.jsx')
  const home = await readSource('../src/pages/Home.jsx')
  const publicCss = await readSource('../src/styles/public.css')

  assert.match(manager, /portfolioApi\.updateImage\(\{ id: image\.id, title, caption \}\)/)
  assert.match(category, /className="portfolio-photo__caption">\{image\.caption\}/)
  assert.match(home, /className="preview-strip__caption">\s*\{c\.cover\.caption \|\| c\.cover\.title \|\| c\.name\}/)
  assert.match(home, /pickPortfolioCover\(images\)/)
  assert.match(publicCss, /\.preview-strip__caption[^\n]*font-family: var\(--font-display\)/)
})

test('homepage prefers the admin-selected category cover instead of the first photo', () => {
  const images = [
    { image_path: '/uploads/portfolio/first.jpg', is_cover: 0 },
    { image_path: '/uploads/portfolio/selected.jpg', is_cover: 1 },
    { image_path: '/demo/placeholder.jpg', is_cover: 1 }
  ]

  assert.equal(pickPortfolioCover(images).image_path, '/uploads/portfolio/selected.jpg')
  assert.equal(pickPortfolioCover([]), null)
})
