import test from 'node:test'
import assert from 'node:assert/strict'
import { shouldRetryUpload, uploadRetryDelay } from '../src/utils/uploadRetry.js'

test('only explicit rate-limit and temporary-unavailable responses are retried', () => {
  assert.equal(shouldRetryUpload(429, 1, 3), true)
  assert.equal(shouldRetryUpload(503, 2, 3), true)
  assert.equal(shouldRetryUpload(403, 1, 3), false)
  assert.equal(shouldRetryUpload(500, 1, 3), false)
  assert.equal(shouldRetryUpload(429, 3, 3), false)
})

test('upload retry honors Retry-After and caps the wait', () => {
  const response = { headers: { get: () => '3' } }
  assert.equal(uploadRetryDelay(response, 1), 3_000)
  assert.equal(uploadRetryDelay({ headers: { get: () => '60' } }, 1), 10_000)
})

test('upload retry uses bounded backoff when Retry-After is absent', () => {
  assert.equal(uploadRetryDelay(null, 1), 800)
  assert.equal(uploadRetryDelay(null, 2), 1_600)
  assert.equal(uploadRetryDelay(null, 8), 5_000)
})
