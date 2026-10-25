import { Blockquote } from '@tiptap/extension-blockquote'
import { Document } from '@tiptap/extension-document'
import { Heading } from '@tiptap/extension-heading'
import { Paragraph } from '@tiptap/extension-paragraph'
import { Text } from '@tiptap/extension-text'
import { describe, expect, it } from 'vite-plus/test'

import { MarkdownManager } from '../../src/MarkdownManager.js'

describe('Tight blocks', () => {
  const markdownManager = new MarkdownManager({
    extensions: [Document, Paragraph, Text, Heading, Blockquote],
  })
  const heading = (text: string) => ({
    type: 'heading',
    attrs: { level: 1 },
    content: [{ type: 'text', text }],
  })
  const tightParagraph = (text: string) => ({
    type: 'paragraph',
    attrs: { markdownTight: true },
    content: [{ type: 'text', text }],
  })

  it('writes a block right under the one before it', () => {
    const doc = { type: 'doc', content: [heading('h'), tightParagraph('text')] }

    expect(markdownManager.serialize(doc)).toBe('# h\ntext')
  })

  it('keeps the blank line when the file had one', () => {
    const doc = {
      type: 'doc',
      content: [heading('h'), { type: 'paragraph', content: [{ type: 'text', text: 'text' }] }],
    }

    expect(markdownManager.serialize(doc)).toBe('# h\n\ntext')
  })

  it('writes a block right under the one before it in a quote', () => {
    const doc = {
      type: 'doc',
      content: [{ type: 'blockquote', content: [heading('h'), tightParagraph('text')] }],
    }

    expect(markdownManager.serialize(doc)).toBe('> # h\n> text')
  })

  it('keeps the blank line when the two blocks would read as one', () => {
    const doc = {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: 'a' }] }, tightParagraph('b')],
    }

    expect(markdownManager.serialize(doc)).toBe('a\n\nb')
  })
})
