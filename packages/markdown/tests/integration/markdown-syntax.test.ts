import { Bold } from '@tiptap/extension-bold'
import { Document } from '@tiptap/extension-document'
import { Italic } from '@tiptap/extension-italic'
import { Paragraph } from '@tiptap/extension-paragraph'
import { Text } from '@tiptap/extension-text'
import { describe, expect, it } from 'vite-plus/test'

import { MarkdownManager } from '../../src/MarkdownManager.js'

describe('markdownSyntax', () => {
  const markdownManager = new MarkdownManager({
    extensions: [Document, Paragraph, Text, Bold, Italic],
  })

  it('keeps underscores as written', () => {
    const input = '__a__ and _b_'

    expect(markdownManager.serialize(markdownManager.parse(input))).toBe(input)
  })

  it('writes a tag syntax, and stars where a letter touches underscores', () => {
    const json = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'x',
              marks: [{ type: 'bold', attrs: { markdownSyntax: '<b>' } }],
            },
            { type: 'text', text: ' a' },
            {
              type: 'text',
              text: 'y',
              marks: [{ type: 'italic', attrs: { markdownSyntax: '_' } }],
            },
          ],
        },
      ],
    }

    expect(markdownManager.serialize(json)).toBe('<b>x</b> a*y*')
  })
})
