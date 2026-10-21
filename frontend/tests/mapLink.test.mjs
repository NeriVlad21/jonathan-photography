// Studio Google Maps link: only HTTPS Google Maps URLs are used as the
// "View on Google Maps" target. Run with `npm test`.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { safeGoogleMapsLink } from '../src/utils/mapLink.js'

test('accepts Google Maps share and place links', () => {
  assert.equal(safeGoogleMapsLink('https://maps.app.goo.gl/MD5i4bsgUS8Q3xXT8'), 'https://maps.app.goo.gl/MD5i4bsgUS8Q3xXT8')
  assert.equal(safeGoogleMapsLink(' https://maps.app.goo.gl/MD5i4bsgUS8Q3xXT8?g_st=ac '), 'https://maps.app.goo.gl/MD5i4bsgUS8Q3xXT8')
  assert.equal(safeGoogleMapsLink('https://goo.gl/maps/abc123'), 'https://goo.gl/maps/abc123')
  assert.equal(safeGoogleMapsLink('https://www.google.com/maps/place/Sison'), 'https://www.google.com/maps/place/Sison')
  assert.equal(safeGoogleMapsLink('https://maps.google.com/?q=16.17,120.51'), 'https://maps.google.com/?q=16.17,120.51')
})

test('rejects anything that is not an HTTPS Google Maps link', () => {
  for (const value of ['', null, 'http://maps.app.goo.gl/x', 'javascript:alert(1)', 'https://evil.test/maps', 'https://goo.gl/other',
    'https://www.google.com/search?q=x', 'https://maps.app.goo.gl.evil.test/x', 'not a url']) {
    assert.equal(safeGoogleMapsLink(value), '', String(value))
  }
})

test('default site content points at the studio share link', async () => {
  const { readFileSync } = await import('node:fs')
  const source = readFileSync(new URL('../src/content/defaultSiteContent.js', import.meta.url), 'utf8')
  assert.match(source, /mapLink: 'https:\/\/maps\.app\.goo\.gl\/MD5i4bsgUS8Q3xXT8'/)
})
