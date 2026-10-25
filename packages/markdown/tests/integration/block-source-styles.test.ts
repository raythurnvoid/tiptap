import { CodeBlock } from '@tiptap/extension-code-block'
import { Document } from '@tiptap/extension-document'
import { Heading } from '@tiptap/extension-heading'
import { BulletList, ListItem, OrderedList } from '@tiptap/extension-list'
import { Paragraph } from '@tiptap/extension-paragraph'
import { Text } from '@tiptap/extension-text'
import { describe, expect, it } from 'vite-plus/test'

import { MarkdownManager } from '../../src/MarkdownManager.js'

describe('Code block and heading styles', () => {
  const markdownManager = new MarkdownManager({
    extensions: [Document, Paragraph, Text, CodeBlock, Heading, BulletList, OrderedList, ListItem],
  })

  it.each([
    ['a `~~~` fence', '~~~js\ncode\n~~~'],
    ['a longer fence', '````\ncode\n````'],
    ['a space before the language', '``` js\ncode\n```'],
    ['an indented block', 'a\n\n    code\n\n    more'],
    ['closing marks', '## a ##'],
    ['an empty heading', 'a\n\n##\n\nb'],
    ['spaces after the opening marks', '#   a\n\n##\ta  ##'],
    ['closing marks on an empty heading', '## ##'],
    ['an underline', 'a\n='],
    ['an underline over text that starts like a list', '\\- a\n---'],
    ['a heading that starts a list item', '- # a\n- b'],
    ['a fence that starts a list item', '- ```\n  code\n  ```'],
    ['a heading that starts a numbered item', '1. # a\n2. b'],
    ['a heading under an empty list item', '-\n  # a'],
  ])('keeps %s', (_name, markdown) => {
    expect(markdownManager.serialize(markdownManager.parse(markdown))).toBe(markdown)
  })

  it('writes the default opening marks once the level changes', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 2, markdownOpening: '#   ' },
          content: [{ type: 'text', text: 'a' }],
        },
      ],
    }

    expect(markdownManager.serialize(doc)).toBe('## a')
  })

  it('makes a `~~~` fence longer than a `~~~` line in the code', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'codeBlock',
          attrs: { markdownFence: '~~~' },
          content: [{ type: 'text', text: '~~~' }],
        },
      ],
    }

    expect(markdownManager.serialize(doc)).toBe('~~~~\n~~~\n~~~~')
  })

  const indentedBlock = (text: string, language: string | null = null) => ({
    type: 'codeBlock',
    attrs: { markdownFence: 'indented', language },
    content: [{ type: 'text', text }],
  })
  const paragraph = { type: 'paragraph', content: [{ type: 'text', text: 'a' }] }

  it.each([
    ['it starts with a blank line', [indentedBlock('\ncode')], '```\n\ncode\n```'],
    ['it ends with a blank line', [indentedBlock('code\n')], '```\ncode\n\n```'],
    ['it has a language', [indentedBlock('code', 'js')], '```js\ncode\n```'],
    [
      'a list comes before it',
      [
        { type: 'bulletList', content: [{ type: 'listItem', content: [paragraph] }] },
        indentedBlock('code'),
      ],
      '- a\n\n```\ncode\n```',
    ],
    [
      'it is in a list item',
      [
        {
          type: 'bulletList',
          content: [{ type: 'listItem', content: [paragraph, indentedBlock('code')] }],
        },
      ],
      '- a\n  ```\n  code\n  ```',
    ],
  ])('writes a fence for an indented block when %s', (_name, content, markdown) => {
    expect(markdownManager.serialize({ type: 'doc', content })).toBe(markdown)
  })

  it('writes the block under the marker once the item has text', () => {
    const heading = { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'h' }] }
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', attrs: { blockOnMarker: true }, content: [paragraph, heading] },
          ],
        },
      ],
    }

    expect(markdownManager.serialize(doc)).toBe('- a\n  # h')
  })
})
