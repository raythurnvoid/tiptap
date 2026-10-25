import { Document } from '@tiptap/extension-document'
import { Link } from '@tiptap/extension-link'
import { Paragraph } from '@tiptap/extension-paragraph'
import { Text } from '@tiptap/extension-text'
import { describe, expect, it } from 'vite-plus/test'

import { MarkdownManager } from '../../src/MarkdownManager.js'

describe('Link destination', () => {
  const markdownManager = new MarkdownManager({
    extensions: [Document, Paragraph, Text, Link],
  })
  const markdownDestination = {
    source: "<https://e.com/a b> 'T'",
    href: 'https://e.com/a%20b',
    title: 'T',
  }
  const linkDoc = (attrs: Record<string, unknown>) => ({
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'a', marks: [{ type: 'link', attrs }] }],
      },
    ],
  })

  it('writes the address and title as the file wrote them', () => {
    const doc = linkDoc({ href: 'https://e.com/a%20b', title: 'T', markdownDestination })

    expect(markdownManager.serialize(doc)).toBe("[a](<https://e.com/a b> 'T')")
  })

  it.each([
    ['title', 'https://e.com/a%20b', 'U', '[a](https://e.com/a%20b "U")'],
    ['address', 'https://f.com', 'T', '[a](https://f.com "T")'],
  ])('writes the default form once the %s changes', (_name, href, title, expected) => {
    const doc = linkDoc({ href, title, markdownDestination })

    expect(markdownManager.serialize(doc)).toBe(expected)
  })
})
