import { CodeBlock } from '@tiptap/extension-code-block'
import { Document } from '@tiptap/extension-document'
import { HorizontalRule } from '@tiptap/extension-horizontal-rule'
import { BulletList, ListItem, OrderedList, TaskItem, TaskList } from '@tiptap/extension-list'
import { Paragraph } from '@tiptap/extension-paragraph'
import { Text } from '@tiptap/extension-text'
import { describe, expect, it } from 'vite-plus/test'

import { MarkdownManager } from '../../src/MarkdownManager.js'

describe('Blank lines inside a list item', () => {
  const markdownManager = new MarkdownManager({
    extensions: [
      Document,
      Paragraph,
      Text,
      CodeBlock,
      HorizontalRule,
      BulletList,
      OrderedList,
      ListItem,
      TaskList,
      TaskItem,
    ],
  })

  it.each([
    ['a blank line before a code block', '- a\n\n  ```\n  x\n  ```'],
    ['no blank line before a code block', '- a\n  ```\n  x\n  ```'],
    ['a blank line inside a code block only', '- a\n  ```\n  x\n\n  y\n  ```'],
    ['a blank line before a rule', '- a\n\n  ---'],
    ['a blank line in an ordered item', '1. a\n\n   ```\n   x\n   ```'],
    ['a blank line in a task item', '- [ ] a\n\n  ```\n  x\n  ```'],
    ['no blank line in a task item', '- [ ] a\n  ```\n  x\n  ```'],
  ])('keeps %s', (_name, markdown) => {
    expect(markdownManager.serialize(markdownManager.parse(markdown))).toBe(markdown)
  })
})
