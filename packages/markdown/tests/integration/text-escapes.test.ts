import { Document } from '@tiptap/extension-document'
import { Italic } from '@tiptap/extension-italic'
import { BulletList, ListItem } from '@tiptap/extension-list'
import { Paragraph } from '@tiptap/extension-paragraph'
import { Text } from '@tiptap/extension-text'
import { describe, expect, it } from 'vite-plus/test'

import { MarkdownManager } from '../../src/MarkdownManager.js'

describe('Text escapes', () => {
  const markdownManager = new MarkdownManager({
    extensions: [Document, Paragraph, Text, Italic, BulletList, ListItem],
  })
  const paragraph = (...content: any[]) => ({
    type: 'doc',
    content: [{ type: 'paragraph', content }],
  })
  const text = (value: string, marks?: any[]) => ({ type: 'text', text: value, marks })

  it.each([
    'use my_var and __dirname',
    'glob **/*.ts and *.md',
    '~/projects and ~user',
    '[TODO] fix login',
    '100*2 = 200',
    '<3 and </3',
    'Version\n2. x',
  ])('writes %j without escapes it does not need', value => {
    expect(markdownManager.serialize(paragraph(text(value)))).toBe(value)
  })

  it.each([
    ['*a*', '\\*a\\*'],
    ['[a](b)', '\\[a\\](b)'],
    ['<b>x</b>', '&lt;b>x&lt;/b>'],
    ['Version\n1. x', 'Version\n1\\. x'],
  ])('escapes %j where it would read as Markdown', (value, markdown) => {
    expect(markdownManager.serialize(paragraph(text(value)))).toBe(markdown)
  })

  it('escapes text that would pair with a mark next to it', () => {
    const doc = paragraph(text('x _'), text('b', [{ type: 'italic' }]), text('_ y'))

    expect(markdownManager.serialize(doc)).toBe('x \\_*b*\\_ y')
  })

  it('escapes a task box at the start of a list item', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [text('[ ] a')] }] },
          ],
        },
      ],
    }

    expect(markdownManager.serialize(doc)).toBe('- \\[ ] a')
  })

  it('escapes a later line like "2." in a list item, where it would start a list', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [{ type: 'paragraph', content: [text('Version\n2. x')] }],
            },
          ],
        },
      ],
    }

    expect(markdownManager.serialize(doc)).toBe('- Version\n  2\\. x')
  })
})
