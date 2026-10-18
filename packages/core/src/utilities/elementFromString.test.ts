// @vitest-environment node
import { describe, expect, it } from 'vite-plus/test'

import { elementFromString } from './elementFromString.js'

describe('elementFromString', () => {
  it('parses HTML without a browser DOMParser', () => {
    const element = elementFromString('<p>Worker text</p>')
    expect(element.textContent).toBe('Worker text')
  })
})
