import { Bold } from '@tiptap/extension-bold'
import { Document } from '@tiptap/extension-document'
import { Link } from '@tiptap/extension-link'
import { Paragraph } from '@tiptap/extension-paragraph'
import { Text } from '@tiptap/extension-text'
import { describe, expect, it } from 'vite-plus/test'

import { MarkdownManager } from '../../src/MarkdownManager.js'

describe('Autolinks', () => {
  const markdownManager = new MarkdownManager({
    extensions: [Document, Paragraph, Text, Bold, Link],
  })

  it('keeps bare and angle autolinks as written', () => {
    const input = 'See https://e.com/a_b*c, me@e.com and <https://e.com/x_y>'

    expect(markdownManager.serialize(markdownManager.parse(input))).toBe(input)
  })

  it('writes an autolink as a link once another mark covers part of it', () => {
    const autolink = { type: 'link', attrs: { href: 'https://e.com', markdownAutolink: 'bare' } }
    const json = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'https://e.', marks: [autolink] },
            { type: 'text', text: 'com', marks: [autolink, { type: 'bold' }] },
          ],
        },
      ],
    }

    expect(markdownManager.serialize(json)).toBe('[https://e.**com**](https://e.com)')
  })
})
