import type { JSONContent } from '@tiptap/core'

/**
 * A list item must start with a paragraph. When the file starts an item with another block, like
 * `- # Title`, put an empty paragraph before it. `blockOnMarker` says the block was on the marker line.
 */
export function startItemWithParagraph(content: JSONContent[], raw: string) {
  if (content.length === 0 || content[0].type === 'paragraph') {
    return { content, blockOnMarker: false }
  }

  return {
    content: [{ type: 'paragraph', content: [] }, ...content],
    blockOnMarker: /^\s*\S+[ \t]+\S/.test(raw),
  }
}
