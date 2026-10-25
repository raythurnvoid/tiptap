import { afterEach, describe, expect, it, vi } from 'vite-plus/test'

import { hashOfJSON } from './hashOfJSON.js'

describe('hashOfJSON', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const mark = { type: 'comment', attrs: { threadId: 'th_1' } }

  it('keeps the hash that stored documents use', () => {
    expect(hashOfJSON(mark)).toBe('O94CZ6vF')
  })

  it('works without Node Buffer, like in Convex', () => {
    vi.stubGlobal('Buffer', undefined)

    expect(hashOfJSON(mark)).toBe('O94CZ6vF')
  })
})
