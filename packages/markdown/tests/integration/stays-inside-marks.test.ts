import { Node } from '@tiptap/core'
import { Bold } from '@tiptap/extension-bold'
import { Document } from '@tiptap/extension-document'
import { Paragraph } from '@tiptap/extension-paragraph'
import { Text } from '@tiptap/extension-text'
import { describe, expect, it } from 'vite-plus/test'

import { MarkdownManager } from '../../src/MarkdownManager.js'

const RawTag = Node.create({
  name: 'rawTag',
  inline: true,
  group: 'inline',
  atom: true,
  addAttributes() {
    return { html: { default: '' } }
  },
  renderMarkdown: node => node.attrs?.html ?? '',
  markdownOptions: { staysInsideMarks: true },
})

describe('staysInsideMarks', () => {
  const markdownManager = new MarkdownManager({
    extensions: [Document, Paragraph, Text, Bold, RawTag],
  })

  it('writes the atom inside the marks around it', () => {
    const bold = { type: 'bold' }
    const json = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'rawTag', attrs: { html: '<span class="x">' }, marks: [bold] },
            { type: 'text', text: 'a', marks: [bold] },
            { type: 'rawTag', attrs: { html: '</span>' }, marks: [bold] },
            { type: 'text', text: ' b' },
          ],
        },
      ],
    }

    expect(markdownManager.serialize(json)).toBe('**<span class="x">a</span>** b')
  })
})
