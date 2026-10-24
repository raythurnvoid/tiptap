import { Editor } from '@tiptap/core'
import { Bold } from '@tiptap/extension-bold'
import { Code } from '@tiptap/extension-code'
import { Document } from '@tiptap/extension-document'
import { Italic } from '@tiptap/extension-italic'
import { Link } from '@tiptap/extension-link'
import { Paragraph } from '@tiptap/extension-paragraph'
import Strike from '@tiptap/extension-strike'
import { Text } from '@tiptap/extension-text'
import { Markdown } from '@tiptap/markdown'
import { afterEach, describe, expect, it } from 'vite-plus/test'

// Markdown allows marks around a code span, so let code share them
const CodeWithMarks = Code.extend({ excludes: 'code' })

describe('Marks around code spans', () => {
  let editor: Editor | undefined

  afterEach(() => {
    editor?.destroy()
  })

  const roundTrip = (markdown: string) => {
    editor = new Editor({
      extensions: [Document, Paragraph, Text, Bold, CodeWithMarks, Italic, Strike, Link, Markdown],
      content: markdown,
      contentType: 'markdown',
    })
    return editor.getMarkdown()
  }

  it.each([
    '[`a`](https://e.com)',
    '**x `a` y**',
    '*`a`*',
    '~~`a`~~',
    '[***`a`***](https://e.com)',
    '**x `a`**`b`',
    '`a`**`b`**`c`',
  ])('keeps %j', markdown => {
    expect(roundTrip(markdown)).toBe(markdown)
  })

  it('closes the code span where a mark starts inside it', () => {
    editor = new Editor({
      extensions: [Document, Paragraph, Text, Bold, CodeWithMarks, Markdown],
      content: '<p><code>a<strong>b</strong>c</code></p>',
    })

    expect(editor.getMarkdown()).toBe('`a`**`b`**`c`')
  })
})
