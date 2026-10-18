// @vitest-environment node
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import { describe, expect, it, vi } from 'vite-plus/test'

import { generateJSON } from './generateJSON.js'
import { generateHTML } from './generateHTML.js'

describe('worker HTML conversion', () => {
  it('parses and renders without Node globals or resource loading', () => {
    const extensions = [Document, Paragraph, Text]
    vi.stubGlobal('process', undefined)
    try {
      const json = generateJSON('<script src="/app.js"></script><p>Worker text</p>', extensions)
      expect(json.content).toEqual([
        { type: 'paragraph', content: [{ type: 'text', text: 'Worker text' }] },
      ])
      expect(generateHTML(json, extensions)).toBe('<p>Worker text</p>')
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
