import { Document } from '@tiptap/extension-document'
import { HorizontalRule } from '@tiptap/extension-horizontal-rule'
import { Paragraph } from '@tiptap/extension-paragraph'
import { Text } from '@tiptap/extension-text'
import { describe, expect, it } from 'vite-plus/test'

import { MarkdownManager } from '../../src/MarkdownManager.js'

describe('Horizontal rule source', () => {
  const markdownManager = new MarkdownManager({
    extensions: [Document, Paragraph, Text, HorizontalRule],
  })

  it.each(['---', '***', '___', '* * *', '- - -', '**********'])('keeps %j', rule => {
    expect(markdownManager.serialize(markdownManager.parse(rule))).toBe(rule)
  })

  it('writes `---` for a rule made in the editor or a source that is no rule', () => {
    const doc = {
      type: 'doc',
      content: [
        { type: 'horizontalRule' },
        { type: 'horizontalRule', attrs: { markdownSource: '**' } },
      ],
    }

    expect(markdownManager.serialize(doc)).toBe('---\n\n---')
  })
})
