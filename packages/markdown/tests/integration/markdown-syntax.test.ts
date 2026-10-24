import { Bold } from '@tiptap/extension-bold'
import { Code } from '@tiptap/extension-code'
import { Document } from '@tiptap/extension-document'
import { Italic } from '@tiptap/extension-italic'
import { Paragraph } from '@tiptap/extension-paragraph'
import { Strike } from '@tiptap/extension-strike'
import { Text } from '@tiptap/extension-text'
import { describe, expect, it } from 'vite-plus/test'

import { MarkdownManager } from '../../src/MarkdownManager.js'

describe('markdownSyntax', () => {
  const markdownManager = new MarkdownManager({
    extensions: [Document, Paragraph, Text, Bold, Italic, Strike, Code],
  })

  it('keeps underscores and one tilde as written', () => {
    const input = '__a__ and _b_ ~c~'

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

  it('keeps a code tag only around plain text', () => {
    const code = (text: string) => ({
      type: 'text',
      text,
      marks: [{ type: 'code', attrs: { markdownSyntax: '<code>' } }],
    })
    const json = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            code('a b'),
            { type: 'text', text: ' ' },
            code('a*b'),
            { type: 'text', text: ' ' },
            code('www.e.com'),
          ],
        },
      ],
    }

    expect(markdownManager.serialize(json)).toBe('<code>a b</code> `a*b` `www.e.com`')
  })
})
