import { Document } from '@tiptap/extension-document'
import { BulletList, ListItem, OrderedList, TaskItem, TaskList } from '@tiptap/extension-list'
import { Paragraph } from '@tiptap/extension-paragraph'
import { Text } from '@tiptap/extension-text'
import { describe, expect, it } from 'vite-plus/test'

import { MarkdownManager } from '../../src/MarkdownManager.js'

describe('List styles', () => {
  const markdownManager = new MarkdownManager({
    extensions: [
      Document,
      Paragraph,
      Text,
      BulletList,
      OrderedList,
      ListItem,
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
  })

  it.each([
    ['the same number on every item', '1. a\n1. b'],
    ['a `*` task bullet', '* [ ] a\n* [x] b'],
    ['a `+` task bullet', '+ [ ] a'],
    ['an upper-case `[X]`', '- [X] a\n- [x] b\n  - [X] c'],
    ['an empty bullet item', '- a\n-\n- c'],
    ['an empty ordered item', '1. a\n2.\n3. c'],
    ['a list nested with 4 spaces', '- a\n    - b\n        - c'],
    ['an ordered list nested with 4 spaces', '1. a\n    1. b'],
    ['a paragraph indented 4 spaces in an item', '- a\n\n    more'],
    ['a wrapped line indented 4 spaces in an item', '- a\n    b'],
    ['a wrapped line indented 4 spaces in an ordered item', '1. a\n    b'],
    ['a wrapped line in a task item', '- [ ] a\n  b'],
    ['a wrapped line indented 6 spaces in a task item', '- [ ] a\n      b'],
    ['a wrapped line before a nested task item', '- [ ] a\n  b\n  - [ ] c'],
    ['a wrapped line in a nested task item', '- [ ] a\n  - [ ] b\n    c'],
    ['a wrapped line before a list nested with 4 spaces', '- a\n  b\n    - c'],
  ])('keeps %s', (_name, markdown) => {
    expect(markdownManager.serialize(markdownManager.parse(markdown))).toBe(markdown)
  })

  it('uses the normal indent when the kept one would make a code block', () => {
    const paragraph = (text: string) => ({ type: 'paragraph', content: [{ type: 'text', text }] })
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              attrs: { indent: 7 },
              content: [
                paragraph('a'),
                { type: 'bulletList', content: [{ type: 'listItem', content: [paragraph('b')] }] },
              ],
            },
          ],
        },
      ],
    }

    expect(markdownManager.serialize(doc)).toBe('- a\n  - b')
  })
})
